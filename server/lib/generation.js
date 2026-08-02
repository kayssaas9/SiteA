import fetch from "node-fetch";
import sharp from "sharp";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "./supabase.js";

const ONESHOT_BASE_URL = "https://api.oneshotapi.com";
const ONESHOT_API_KEY = process.env.ONESHOT_API_KEY;
export const GENERATION_COST = 100;
const PREVIEW_BUCKET = "generation-previews";

function isSubscriber(plan) {
  return ["basic", "pro", "expert"].includes(plan);
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
    const message = data?.error?.message || data?.__text || `Erreur ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    error.body = data;
    throw error;
  }

  return data;
}

async function normalizeImage(buffer) {
  return sharp(buffer)
    .rotate()
    .jpeg({ quality: 92, progressive: true })
    .toBuffer();
}

async function uploadToOneShot(file) {
  let normalizedBuffer;
  try {
    normalizedBuffer = await normalizeImage(file.buffer);
  } catch (normalizeErr) {
    console.warn("Image normalization failed, using original buffer:", normalizeErr.message);
    normalizedBuffer = file.buffer;
  }

  const filename = file.originalname
    ? file.originalname.replace(/\.[^.]+$/, ".jpg")
    : "reference.jpg";
  const contentType = "image/jpeg";
  const sizeBytes = normalizedBuffer.length;

  const signData = await oneshotFetch("/v1/uploads/sign", {
    method: "POST",
    body: JSON.stringify({ filename, contentType, sizeBytes }),
  });

  const { fileId, uploadUrl, requiredHeaders } = signData;
  const uploadRes = await fetch(uploadUrl, {
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

async function pollOneShotJob(jobId) {
  const maxAttempts = 60;
  const delayMs = 2000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const job = await oneshotFetch(`/v1/jobs/${jobId}`);
    console.log(`OneShot job ${jobId} status: ${job.status} (attempt ${attempt + 1}/${maxAttempts})`);

    if (job.status === "completed") {
      const result = job.result || {};
      const imageUrl =
        result.url ||
        result.image_url ||
        result.imageUrl ||
        result.output ||
        result.image ||
        null;
      if (!imageUrl) throw new Error("URL de l'image introuvable dans le résultat du job.");
      return imageUrl;
    }

    if (job.status === "failed") {
      const error = job.error || {};
      throw new Error(error.message || `Le job a échoué (${error.code || "unknown"}).`);
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error("La génération a pris trop de temps. Réessayez plus tard.");
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

async function createBlurredPreview(imageUrl, clerkUserId, generationId) {
  const original = await fetch(imageUrl);
  if (!original.ok) {
    throw new Error(`Impossible de préparer l'aperçu teaser (${original.status}).`);
  }

  const originalBuffer = Buffer.from(await original.arrayBuffer());
  const blurredBuffer = await sharp(originalBuffer)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .blur(24)
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
    .select("credits")
    .eq("clerk_user_id", pendingReferral.referrer_id)
    .single();

  if (!referrer) return;
  const newReferrerCredits = (referrer.credits ?? 0) + 200;
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
  let freeTeaserPersisted = false;

  try {
    const { mode, prompt, clerk_user_id: clerkUserId } = req.body;

    if (!ONESHOT_API_KEY) {
      return res.status(500).json({ error: "Clé OneShotAPI non configurée." });
    }
    if (!clerkUserId || !clerkUserId.trim()) {
      return res.status(401).json({ error: "Connectez-vous pour générer une image." });
    }
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "Prompt manquant." });
    }

    const user = await ensureUser(clerkUserId);
    if (!user) {
      return res.status(500).json({ error: "Impossible de charger votre compte." });
    }

    let currentCredits = user.credits ?? 0;

    if (currentCredits <= 0) {
      freeTeaserClaimed = await claimFreeTeaser(clerkUserId);

      if (!freeTeaserClaimed) {
        // A payment or credit refill may have happened after ensureUser read
        // the row. Re-read before returning the quota error.
        const refreshedUser = await ensureUser(clerkUserId);
        currentCredits = refreshedUser?.credits ?? 0;

        if (currentCredits <= 0) {
          return res.status(402).json({
            code: "FREE_TEASER_USED",
            error: "Votre aperçu gratuit a déjà été utilisé. Rechargez vos crédits ou abonnez-vous pour générer un nouveau résultat.",
          });
        }
      }
    }

    const subscriber = isSubscriber(user.plan);
    const teaser = freeTeaserClaimed || !subscriber || currentCredits < GENERATION_COST;

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
        return res.status(502).json({ error: uploadErr.message });
      }
    }

    const trimmedPrompt = prompt.trim();
    let finalPrompt = trimmedPrompt;
    if (referenceFileIds.length > 0) {
      if (mode === "car") {
        finalPrompt = `Replace the main vehicle in the reference image completely with: ${trimmedPrompt}. Preserve the background, lighting, and camera angle. Do not keep the original car body or add superficial details on top of it — the vehicle must be fully replaced.`;
      } else if (mode === "outfit") {
        finalPrompt = `Apply the following outfit to the person in the reference image: ${trimmedPrompt}. Preserve the person's pose, body shape, background, and lighting. The original clothing should be fully replaced, not just covered with accessories.`;
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
      return res.status(502).json({ error: jobErr.message });
    }

    let imageUrl;
    try {
      imageUrl = await pollOneShotJob(job.id);
    } catch (pollErr) {
      console.error("OneShot polling error:", pollErr);
      return res.status(502).json({ error: pollErr.message });
    }

    const consumed = freeTeaserClaimed
      ? 0
      : await consumeCredits(clerkUserId, GENERATION_COST);
    if (!freeTeaserClaimed && consumed <= 0) {
      return res.status(402).json({
        code: "NO_CREDITS",
        error: "Vos crédits ont été utilisés pendant la génération. Rechargez votre compte.",
      });
    }

    // A teaser is intentionally created for non-subscribers, even when they
    // have enough credits. Subscribers with fewer than 100 credits also get
    // one, and only their remaining credits are charged.
    const unlocked = !teaser && consumed >= GENERATION_COST;
    const generationId = randomUUID();
    const previewUrl = unlocked
      ? null
      : await createBlurredPreview(imageUrl, clerkUserId, generationId);

    const { error: saveError } = await supabaseAdmin
      .from("generations")
      .insert({
        id: generationId,
        clerk_user_id: clerkUserId,
        mode: mode || "image",
        prompt: prompt || "",
        image_url: imageUrl,
        preview_url: previewUrl,
        unlocked,
      });
    if (saveError) {
      console.error("Failed to save generation:", saveError);
      return res.status(500).json({ error: "Erreur lors de l'enregistrement dans l'historique." });
    }

    // The free teaser is now safely persisted. Keep its one-use reservation.
    freeTeaserPersisted = true;
    await grantReferralReward(clerkUserId);
    console.log(`✅ Saved ${unlocked ? "unlocked" : "teaser"} generation for ${clerkUserId}: ${generationId}`);

    return res.json({
      generationId,
      imageUrl: unlocked ? imageUrl : previewUrl,
      unlocked,
      teaser: !unlocked,
      cost: consumed,
    });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (freeTeaserClaimed && !freeTeaserPersisted) {
      await releaseFreeTeaser(clerkUserIdFromRequest(req));
    }
  }
}

function clerkUserIdFromRequest(req) {
  return typeof req.body?.clerk_user_id === "string" ? req.body.clerk_user_id.trim() : "";
}
