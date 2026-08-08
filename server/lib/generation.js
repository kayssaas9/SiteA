import fetch from "node-fetch";
import sharp from "sharp";
import heicConvert from "heic-convert";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "./supabase.js";
import { MAX_EXPERT_CREDITS } from "./stripe.js";

const ONESHOT_BASE_URL = "https://api.oneshotapi.com";
const ONESHOT_API_KEY = process.env.ONESHOT_API_KEY;
export const GENERATION_COST = 100;
const PREVIEW_BUCKET = "generation-previews";

function isSubscriber(plan) {
  return ["basic", "pro", "expert"].includes(plan);
}

function normalizeHttpUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;

  const candidate = value.trim();
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function errorMessage(value, fallback = "Une erreur est survenue.") {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value instanceof Error && value.message) return value.message;
  if (value && typeof value === "object") {
    for (const key of ["message", "error", "detail", "description"]) {
      const nested = errorMessage(value[key], "");
      if (nested) return nested;
    }
    try {
      const serialized = JSON.stringify(value);
      if (serialized && serialized !== "{}") return serialized;
    } catch {
      // Keep the safe fallback for circular or otherwise unserializable errors.
    }
  }
  return fallback;
}

async function oneshotFetch(path, opts = {}) {
  const res = await fetch(`${ONESHOT_BASE_URL}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${ONESHOT_API_KEY}`,
      "Content-Type": "application/json",
      ...opts.headers,
    },
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { __text: text };
  }

  if (!res.ok) {
    const message = errorMessage(data?.error || data?.message || data?.__text, `Erreur ${res.status}`);
    const error = new Error(message);
    error.status = res.status;
    error.body = data;
    throw error;
  }

  return data;
}

export async function normalizeImage(buffer) {
  try {
    return await sharp(buffer)
      .rotate()
      .jpeg({ quality: 92, progressive: true })
      .toBuffer();
  } catch (sharpError) {
    // Only invoke the HEIC decoder when the file has an HEIC/HEIF signature.
    // Calling it for a malformed JPG/PNG hides the useful sharp error and
    // produces the misleading “input buffer is not a HEIC image” message.
    const isHeifSignature = buffer.length >= 12
      && buffer.toString("ascii", 4, 8) === "ftyp"
      && /^(heic|heix|hevc|hevx|heif|mif1|msf1)/i.test(buffer.toString("ascii", 8, 12));
    if (!isHeifSignature) {
      throw sharpError;
    }

    // sharp in the production image does not always include HEIC support.
    // Use the dedicated decoder for iPhone HEIC/HEIF uploads, then keep the
    // same JPEG normalization pipeline for the rest of the upload flow.
    try {
      const jpegBuffer = await heicConvert({
        buffer,
        format: "JPEG",
        quality: 0.92,
      });
      return sharp(jpegBuffer)
        .rotate()
        .jpeg({ quality: 92, progressive: true })
        .toBuffer();
    } catch (heicError) {
      heicError.cause = sharpError;
      throw heicError;
    }
  }
}

async function uploadToOneShot(file) {
  let normalizedBuffer;

  try {
    normalizedBuffer = await normalizeImage(file.buffer);
  } catch (normalizeError) {
    console.error("Mobile image normalization failed:", normalizeError.message);
    throw new Error(
      "Cette photo ne peut pas être convertie. Choisis une image JPG ou PNG, puis réessaie.",
    );
  }

  // Never send an unconverted HEIC/HEIF or device-specific image to OneShot
  // while labelling it as JPEG. Mobile cameras commonly provide those
  // formats even though desktop uploads are usually already JPEG/PNG.
  const filename = `reference-${randomUUID()}.jpg`;
  const contentType = "image/jpeg";
  const sizeBytes = normalizedBuffer.length;

  const signData = await oneshotFetch("/v1/uploads/sign", {
    method: "POST",
    body: JSON.stringify({ filename, contentType, sizeBytes }),
  });

  const { fileId, uploadUrl, requiredHeaders } = signData;
  const validUploadUrl = normalizeHttpUrl(uploadUrl);
  if (!validUploadUrl) {
    throw new Error("OneShot a retourné une URL d'upload invalide.");
  }

  const uploadRes = await fetch(validUploadUrl, {
    method: "PUT",
    headers: { ...requiredHeaders, "Content-Length": sizeBytes },
    body: normalizedBuffer,
  });
  if (!uploadRes.ok) {
    const uploadText = await uploadRes.text();
    throw new Error(`Échec de l'upload de l'image de référence (${uploadRes.status}): ${uploadText}`);
  }

  await oneshotFetch("/v1/uploads/complete", {
    method: "POST",
    body: JSON.stringify({ fileId }),
  });

  return fileId;
}

async function getOneShotJob(jobId) {
  return oneshotFetch(`/v1/jobs/${jobId}`);
}

function getJobImageUrl(job) {
  const result = job?.result || {};
  const candidates = [
    result,
    result.url,
    result.image_url,
    result.imageUrl,
    result.output,
    result.image,
    result.images,
    job?.output,
    job?.images,
  ].flat(Infinity);

  for (const candidate of candidates) {
    const candidateValue = typeof candidate === "object" && candidate !== null
      ? candidate.url || candidate.image_url || candidate.imageUrl
      : candidate;
    const validUrl = normalizeHttpUrl(candidateValue);
    if (validUrl) return validUrl;
  }

  return null;
}

function clientGeneration(row, error = null) {
  const status = row.status || "completed";
  const unlocked = status === "completed" && row.unlocked === true;
  const teaser = row.teaser === true || (
    status === "completed" &&
    unlocked === false &&
    Boolean(row.preview_url)
  );
  return {
    id: row.id,
    status,
    unlocked,
    teaser,
    imageUrl: status === "completed" && (unlocked ? row.image_url : row.preview_url)
      ? `/api/generations/${encodeURIComponent(row.id)}/image?clerkUserId=${encodeURIComponent(row.clerk_user_id)}`
      : null,
    error: error || row.error_message || null,
  };
}

export async function getGenerationImage(generationId, clerkUserId) {
  const { data: row, error } = await supabaseAdmin
    .from("generations")
    .select("id, clerk_user_id, status, image_url, preview_url, unlocked")
    .eq("id", generationId)
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (error || !row) {
    const notFound = error?.code === "PGRST116";
    const imageError = new Error(notFound ? "Image introuvable." : error?.message || "Impossible de charger l'image.");
    imageError.statusCode = notFound ? 404 : 500;
    throw imageError;
  }

  if (row.status !== "completed") {
    const imageError = new Error("Cette génération n'est pas encore terminée.");
    imageError.statusCode = 404;
    throw imageError;
  }

  const source = row.unlocked ? row.image_url : row.preview_url;
  if (typeof source !== "string" || !source.trim()) {
    const imageError = new Error("URL d'image indisponible.");
    imageError.statusCode = 404;
    throw imageError;
  }

  if (source.startsWith("data:image/")) {
    const match = source.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
    if (!match) {
      const imageError = new Error("Format d'aperçu invalide.");
      imageError.statusCode = 502;
      throw imageError;
    }
    return {
      contentType: match[1],
      buffer: Buffer.from(match[2], "base64"),
    };
  }

  const validUrl = normalizeHttpUrl(source);
  if (!validUrl) {
    const imageError = new Error("URL d'image invalide.");
    imageError.statusCode = 502;
    throw imageError;
  }

  const upstream = await fetch(validUrl);
  if (!upstream.ok) {
    const imageError = new Error(`Impossible de charger l'image (${upstream.status}).`);
    imageError.statusCode = 502;
    throw imageError;
  }

  return {
    contentType: upstream.headers.get("content-type")?.split(";")[0] || "image/jpeg",
    buffer: Buffer.from(await upstream.arrayBuffer()),
  };
}

async function failGeneration(row, message) {
  await supabaseAdmin
    .from("generations")
    .update({
      status: "failed",
      error_message: message,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .eq("status", "processing");

  if (row.free_teaser_claimed) {
    await releaseFreeTeaser(row.clerk_user_id);
  }

  return clientGeneration({ ...row, status: "failed", error_message: message }, message);
}

async function finalizeGeneration(row, imageUrl) {
  const { data: claimed, error: claimError } = await supabaseAdmin
    .from("generations")
    .update({
      status: "finalizing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .eq("status", "processing")
    .select("id, clerk_user_id, teaser, free_teaser_claimed, consumed_credits, unlocked, status")
    .maybeSingle();

  if (claimError) throw claimError;
  if (!claimed) {
    const { data: current, error: readError } = await supabaseAdmin
      .from("generations")
      .select("id, clerk_user_id, status, image_url, preview_url, unlocked, teaser, error_message")
      .eq("id", row.id)
      .single();
    if (readError || !current) throw readError || new Error("Generation introuvable.");
    return clientGeneration(current);
  }

  try {
    let previewUrl = null;
    let consumed = 0;

    if (claimed.teaser) {
      previewUrl = await createBlurredPreview(imageUrl, claimed.clerk_user_id, claimed.id);
      if (!claimed.free_teaser_claimed) {
        consumed = await consumeCreditsForGeneration(
          claimed.id,
          claimed.clerk_user_id,
          GENERATION_COST,
        );
        if (consumed <= 0) {
          throw Object.assign(
            new Error("Vos crédits ont été utilisés pendant la génération. Rechargez votre compte."),
            { code: "NO_CREDITS" },
          );
        }
      }
    } else {
      consumed = await consumeCreditsForGeneration(
        claimed.id,
        claimed.clerk_user_id,
        GENERATION_COST,
      );
      if (consumed < GENERATION_COST) {
        throw Object.assign(
          new Error("Vos crédits ont été utilisés pendant la génération. Rechargez votre compte."),
          { code: "NO_CREDITS" },
        );
      }
    }

    const unlocked = claimed.unlocked === true || (!claimed.teaser && consumed >= GENERATION_COST);
    const completedUpdate = {
      status: "completed",
      image_url: imageUrl,
      preview_url: previewUrl,
      consumed_credits: consumed,
      error_message: null,
      updated_at: new Date().toISOString(),
    };

    // Stripe may unlock a teaser while its preview is being prepared. Do not
    // write false back over that payment; for full generations the value is
    // determined by the successful credit consumption.
    if (!claimed.teaser) completedUpdate.unlocked = unlocked;

    const { data: completed, error: saveError } = await supabaseAdmin
      .from("generations")
      .update(completedUpdate)
      .eq("id", claimed.id)
      .eq("status", "finalizing")
      .select("id, clerk_user_id, status, image_url, preview_url, unlocked, teaser, error_message")
      .single();

    if (saveError || !completed) throw saveError || new Error("Erreur lors de l'enregistrement dans l'historique.");

    await grantReferralReward(claimed.clerk_user_id);
    console.log(`✅ Finalized ${unlocked ? "unlocked" : "teaser"} generation for ${claimed.clerk_user_id}: ${claimed.id}`);
    return clientGeneration(completed);
  } catch (error) {
    await supabaseAdmin
      .from("generations")
      .update({
        status: "failed",
        error_message: error.message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", claimed.id)
      .eq("status", "finalizing");

    if (claimed.free_teaser_claimed) {
      await releaseFreeTeaser(claimed.clerk_user_id);
    }
    return clientGeneration({ ...row, status: "failed", error_message: error.message }, error.message);
  }
}

export async function getGenerationStatus(generationId, clerkUserId) {
  const { data: row, error } = await supabaseAdmin
    .from("generations")
    .select([
      "id",
      "clerk_user_id",
      "oneshot_job_id",
      "status",
      "image_url",
      "preview_url",
      "unlocked",
      "teaser",
      "free_teaser_claimed",
      "error_message",
      "updated_at",
    ].join(", "))
    .eq("id", generationId)
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (error || !row) {
    const notFound = error?.code === "PGRST116";
    const statusError = new Error(notFound ? "Generation not found" : error?.message || "Unable to load generation");
    statusError.statusCode = notFound ? 404 : 500;
    throw statusError;
  }

  if (row.status === "completed" || row.status === "failed") return clientGeneration(row);
  if (row.status === "finalizing") {
    const finalizingAt = row.updated_at ? Date.parse(row.updated_at) : 0;
    const staleFinalization = !finalizingAt || Date.now() - finalizingAt > 5 * 60 * 1000;
    if (!staleFinalization) return clientGeneration(row);

    const { data: recovered, error: recoveryError } = await supabaseAdmin
      .from("generations")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", row.id)
      .eq("status", "finalizing")
      .select("id")
      .maybeSingle();
    if (recoveryError) throw recoveryError;
    if (!recovered) return clientGeneration(row);
    row.status = "processing";
  }
  // The browser can refresh while the request is still uploading references or
  // creating the OneShot job. Keep the durable row alive until the job ID is
  // attached instead of turning a normal refresh into a failed generation.
  if (!row.oneshot_job_id) return clientGeneration(row);

  let job;
  try {
    job = await getOneShotJob(row.oneshot_job_id);
  } catch (error) {
    // A transient OneShot/network error must not destroy a still-running job.
    console.error(`Unable to read OneShot job ${row.oneshot_job_id}:`, error.message);
    return clientGeneration(row);
  }

  if (job.status === "failed") {
    const message = errorMessage(
      job.error,
      `Le job a échoué (${job.error?.code || "unknown"}).`,
    );
    return failGeneration(row, message);
  }

  const imageUrl = getJobImageUrl(job);
  if (job.status !== "completed") return clientGeneration(row);
  if (!imageUrl) {
    return failGeneration(row, "OneShot n'a pas retourné une URL d'image valide. Réessayez avec une autre image.");
  }

  return finalizeGeneration(row, imageUrl);
}

async function ensureUser(clerkUserId) {
  const { data: existingUser } = await supabaseAdmin
    .from("users")
    .select("clerk_user_id, plan, credits, free_teaser_used")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();

  if (existingUser) return existingUser;

  const { data: createdUser, error } = await supabaseAdmin
    .from("users")
    .insert({
      clerk_user_id: clerkUserId,
      plan: "free",
      credits: 0,
      snaprouge_unlocked: false,
      survey_completed: false,
    })
    .select("clerk_user_id, plan, credits, free_teaser_used")
    .single();

  if (error) {
    console.error("failed to create user row during generation:", error);
    return null;
  }
  return createdUser;
}

async function claimFreeTeaser(clerkUserId) {
  const { data, error } = await supabaseAdmin.rpc("claim_free_teaser", {
    p_clerk_user_id: clerkUserId,
  });

  if (error) {
    console.error("claim_free_teaser RPC failed:", error.message);
    throw new Error("Le teaser gratuit est temporairement indisponible. Réessayez plus tard.");
  }

  return data === true;
}

async function releaseFreeTeaser(clerkUserId) {
  const { error } = await supabaseAdmin.rpc("release_free_teaser", {
    p_clerk_user_id: clerkUserId,
  });

  if (error) {
    console.error("release_free_teaser RPC failed:", error.message);
  }
}

async function consumeCredits(clerkUserId, maximum) {
  const { data, error } = await supabaseAdmin.rpc("consume_generation_credits", {
    p_clerk_user_id: clerkUserId,
    p_maximum: maximum,
  });

  if (!error && typeof data === "number") return data;

  if (error) {
    console.warn("consume_generation_credits RPC failed, using fallback:", error.message);
  }

  const { data: userRow, error: readError } = await supabaseAdmin
    .from("users")
    .select("credits")
    .eq("clerk_user_id", clerkUserId)
    .single();
  if (readError || !userRow) return 0;

  const consumed = Math.min(userRow.credits ?? 0, maximum);
  if (consumed <= 0) return 0;

  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update({ credits: (userRow.credits ?? 0) - consumed })
    .eq("clerk_user_id", clerkUserId)
    .eq("credits", userRow.credits ?? 0);

  return updateError ? 0 : consumed;
}

async function consumeCreditsForGeneration(generationId, clerkUserId, maximum) {
  const { data, error } = await supabaseAdmin.rpc(
    "consume_generation_credits_for_generation",
    {
      p_generation_id: generationId,
      p_clerk_user_id: clerkUserId,
      p_maximum: maximum,
    },
  );

  if (error || typeof data !== "number") {
    console.error("idempotent generation credit consumption failed:", error?.message);
    throw new Error("La consommation des crédits est temporairement indisponible. Réessayez plus tard.");
  }

  return data;
}

async function createBlurredPreview(imageUrl, clerkUserId, generationId) {
  const original = await fetch(imageUrl);
  if (!original.ok) {
    throw new Error(`Impossible de préparer l'aperçu teaser (${original.status}).`);
  }

  const originalBuffer = Buffer.from(await original.arrayBuffer());
  const blurredBuffer = await sharp(originalBuffer)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .blur(7)
    .jpeg({ quality: 84, progressive: true })
    .toBuffer();

  const objectPath = `${clerkUserId}/${generationId}.jpg`;
  // The migration creates this public bucket. The create attempt keeps local
  // environments usable when the migration has not been applied yet.
  await supabaseAdmin.storage.createBucket(PREVIEW_BUCKET, { public: true }).catch(() => {});
  const { error: uploadError } = await supabaseAdmin.storage
    .from(PREVIEW_BUCKET)
    .upload(objectPath, blurredBuffer, {
      contentType: "image/jpeg",
      cacheControl: "31536000",
      upsert: true,
    });

  if (!uploadError) {
    const { data } = supabaseAdmin.storage.from(PREVIEW_BUCKET).getPublicUrl(objectPath);
    return data.publicUrl;
  }

  // Never fall back to the original URL. A data URL is less efficient, but it
  // preserves the protection guarantee if Storage is temporarily unavailable.
  console.error("Preview upload failed; using a server-generated data URL:", uploadError.message);
  return `data:image/jpeg;base64,${blurredBuffer.toString("base64")}`;
}

async function grantReferralReward(clerkUserId) {
  const { data: pendingReferral } = await supabaseAdmin
    .from("referrals")
    .select("id, referrer_id, reward_granted")
    .eq("referred_id", clerkUserId)
    .eq("reward_granted", false)
    .maybeSingle();

  if (!pendingReferral) return;

  const { data: referrer } = await supabaseAdmin
    .from("users")
    .select("plan, credits")
    .eq("clerk_user_id", pendingReferral.referrer_id)
    .single();

  if (!referrer) return;
  const newReferrerCredits = referrer.plan === "expert"
    ? Math.min(MAX_EXPERT_CREDITS, (referrer.credits ?? 0) + 200)
    : (referrer.credits ?? 0) + 200;
  const { error: creditError } = await supabaseAdmin
    .from("users")
    .update({ credits: newReferrerCredits })
    .eq("clerk_user_id", pendingReferral.referrer_id);

  if (creditError) {
    console.error("referrer reward credit error:", creditError);
    return;
  }

  await supabaseAdmin
    .from("referrals")
    .update({ reward_granted: true })
    .eq("id", pendingReferral.id);
}

export async function createGeneration(req, res) {
  let freeTeaserClaimed = false;
  let generationPersisted = false;
  let clerkUserId = "";
  let generationId = "";

  try {
    const {
      mode,
      prompt,
      generation_id: requestedGenerationId,
      clerk_user_id: rawClerkUserId,
    } = req.body;
    clerkUserId = typeof rawClerkUserId === "string" ? rawClerkUserId.trim() : "";
    generationId = typeof requestedGenerationId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestedGenerationId)
      ? requestedGenerationId
      : randomUUID();

    if (!ONESHOT_API_KEY) {
      return res.status(500).json({ error: "Clé OneShotAPI non configurée." });
    }
    if (!clerkUserId) {
      return res.status(401).json({ error: "Connectez-vous pour générer une image." });
    }
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "Prompt manquant." });
    }

    const user = await ensureUser(clerkUserId);
    if (!user) {
      return res.status(500).json({ error: "Impossible de charger votre compte." });
    }

    // A refresh can replay the multipart POST after the browser has already
    // started the original request. Reuse the durable row before claiming a
    // teaser or checking credits, so the replay cannot consume entitlement
    // twice or create a second OneShot job.
    const { data: existingGeneration, error: existingError } = await supabaseAdmin
      .from("generations")
      .select("id, clerk_user_id, status, teaser, unlocked")
      .eq("id", generationId)
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle();
    if (existingError) {
      console.error("Failed to check existing generation:", existingError);
      return res.status(500).json({ error: "Impossible d'enregistrer la génération." });
    }
    if (existingGeneration) {
      return res.status(202).json({
        generationId,
        status: existingGeneration.status || "processing",
        imageUrl: null,
        unlocked: existingGeneration.unlocked === true,
        teaser: existingGeneration.teaser === true,
      });
    }

    const subscriber = isSubscriber(user.plan);
    let currentCredits = user.credits ?? 0;
    if (currentCredits <= 0 && !subscriber) {
      freeTeaserClaimed = await claimFreeTeaser(clerkUserId);

      if (!freeTeaserClaimed) {
        // A payment or credit refill may have happened after ensureUser read
        // the row. Re-read before returning the quota error.
        const refreshedUser = await ensureUser(clerkUserId);
        currentCredits = refreshedUser?.credits ?? 0;

      }
    }

    if (!freeTeaserClaimed && currentCredits < GENERATION_COST) {
      const isFreeAccountWithoutCredits = !subscriber && currentCredits <= 0;
      return res.status(402).json({
        code: isFreeAccountWithoutCredits ? "FREE_TEASER_USED" : "INSUFFICIENT_CREDITS",
        error: isFreeAccountWithoutCredits
          ? "Votre aperçu gratuit a déjà été utilisé. Rechargez vos crédits ou abonnez-vous pour générer un nouveau résultat."
          : `Il vous faut au moins ${GENERATION_COST} crédits pour générer une image nette.`,
      });
    }

    if (freeTeaserClaimed) {
      currentCredits = 0;
    }

    const teaser = freeTeaserClaimed;

    // Persist the generation before slow uploads and OneShot calls. A refresh
    // can now discover the exact row even if the multipart request is still
    // in flight or the response has not reached the browser yet.
    const { error: persistError } = await supabaseAdmin
      .from("generations")
      .insert({
        id: generationId,
        clerk_user_id: clerkUserId,
        mode: mode || "image",
        prompt: prompt.trim(),
        image_url: null,
        preview_url: null,
        unlocked: false,
        oneshot_job_id: null,
        status: "processing",
        teaser,
        free_teaser_claimed: freeTeaserClaimed,
        consumed_credits: 0,
        error_message: null,
      });

    if (persistError) {
      console.error("Failed to persist generation before OneShot:", persistError);
      return res.status(500).json({ error: "Erreur lors de l'enregistrement de la génération." });
    }
    generationPersisted = true;
    console.log(`⏳ Persisted ${teaser ? "teaser" : "full"} generation for ${clerkUserId}: ${generationId}`);

    const files = req.files || {};
    const allFiles = [
      files.image?.[0],
      files.reference_1?.[0],
      files.reference_2?.[0],
    ].filter(Boolean);

    let referenceFileIds = [];
    if (allFiles.length > 0) {
      try {
        referenceFileIds = await Promise.all(allFiles.map(uploadToOneShot));
      } catch (uploadErr) {
        console.error("OneShot upload error:", uploadErr);
        await failGeneration({
          id: generationId,
          clerk_user_id: clerkUserId,
          free_teaser_claimed: freeTeaserClaimed,
        }, uploadErr.message);
        return res.status(502).json({ error: uploadErr.message });
      }
    }

    const trimmedPrompt = prompt.trim();
    let finalPrompt = `${trimmedPrompt}

Create the final image as a vertical 9:16 portrait composition, with the complete car visible and centered in frame.`;
    if (referenceFileIds.length > 0) {
      if (mode === "car") {
        finalPrompt = `Replace the main vehicle in the reference image completely with: ${trimmedPrompt}. Preserve the background, lighting, and camera angle. Do not keep the original car body or add superficial details on top of it — the vehicle must be fully replaced. Create the final image as a vertical 9:16 portrait composition, with the complete car visible and centered in frame.`;
      } else if (mode === "outfit") {
        finalPrompt = `Apply the following outfit to the person in the reference image: ${trimmedPrompt}. Preserve the person's pose, body shape, background, and lighting. The original clothing should be fully replaced, not just covered with accessories. Create the final image as a vertical 9:16 portrait composition, with the complete subject visible and centered in frame.`;
      }
    }

    const jobPayload = {
      prompt: finalPrompt,
      options: {
        modelVariant: "default",
        ...(referenceFileIds.length > 0 && { referenceFileIds }),
      },
    };
    console.log(`Creating OneShot job with ${referenceFileIds.length} reference file(s): ${referenceFileIds.join(", ") || "none"}`);

    let job;
    try {
      job = await oneshotFetch("/v1/models/nano-banana/jobs", {
        method: "POST",
        body: JSON.stringify(jobPayload),
      });
    } catch (jobErr) {
      console.error("OneShot job creation error:", jobErr);
      await failGeneration({
        id: generationId,
        clerk_user_id: clerkUserId,
        free_teaser_claimed: freeTeaserClaimed,
      }, jobErr.message);
      return res.status(502).json({ error: jobErr.message });
    }

    if (!job?.id) {
      await failGeneration({
        id: generationId,
        clerk_user_id: clerkUserId,
        free_teaser_claimed: freeTeaserClaimed,
      }, "OneShot n'a pas retourné d'identifiant de génération.");
      return res.status(502).json({ error: "OneShot n'a pas retourné d'identifiant de génération." });
    }

    const { error: attachError } = await supabaseAdmin
      .from("generations")
      .update({
        oneshot_job_id: job.id,
        updated_at: new Date().toISOString(),
      });

    if (attachError) {
      console.error("Failed to attach OneShot job:", attachError);
      await failGeneration({
        id: generationId,
        clerk_user_id: clerkUserId,
        free_teaser_claimed: freeTeaserClaimed,
      }, "Impossible d'attacher le job de génération.");
      return res.status(500).json({ error: "Erreur lors de l'enregistrement de la génération." });
    }

    console.log(`🔗 Attached OneShot job ${job.id} to generation ${generationId}`);

    return res.status(202).json({
      generationId,
      status: "processing",
      imageUrl: null,
      unlocked: false,
      teaser,
    });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (freeTeaserClaimed && !generationPersisted) {
      await releaseFreeTeaser(clerkUserId);
    }
  }
}
