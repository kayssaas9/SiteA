import express from "express";
import cors from "cors";
import multer from "multer";
import fetch from "node-fetch";
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

import { supabaseAdmin } from "./lib/supabase.js";
import webhookClerk  from "./routes/webhook-clerk.js";
import webhookStripe from "./routes/webhook-stripe.js";
import checkoutRoute from "./routes/checkout.js";
import userRoute     from "./routes/user.js";
import historyRoute  from "./routes/history.js";
import surveyRoute   from "./routes/survey.js";
import referralRoute from "./routes/referral.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = process.env.PORT || 3001;

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.use(cors());

// ── Webhook routes need raw body — mount BEFORE express.json ─────────────────
app.use("/api/webhook/stripe", webhookStripe);   // raw body handled inside route
app.use("/api/webhook/clerk",  webhookClerk);    // raw body handled inside route

// ── JSON middleware for everything else ──────────────────────────────────────
app.use(express.json({ limit: "10mb" }));

// ── API routes ───────────────────────────────────────────────────────────────
app.use("/api/checkout", checkoutRoute);
app.use("/api/user",     userRoute);
app.use("/api/history",  historyRoute);
app.use("/api/survey",   surveyRoute);
app.use("/api/referral", referralRoute);

// ── OneShotAPI image generation proxy ────────────────────────────────────────
const ONESHOT_BASE_URL = "https://api.oneshotapi.com";
const ONESHOT_API_KEY  = process.env.ONESHOT_API_KEY;
const GENERATION_COST = 100;

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
  // Auto-orient using EXIF and strip metadata so the image is stored upright.
  return sharp(buffer)
    .rotate() // applies EXIF Orientation and removes the tag
    .jpeg({ quality: 92, progressive: true })
    .toBuffer();
}

async function uploadToOneShot(file) {
  // Normalize image orientation before uploading.
  let normalizedBuffer;
  try {
    normalizedBuffer = await normalizeImage(file.buffer);
  } catch (normalizeErr) {
    console.warn("Image normalization failed, using original buffer:", normalizeErr.message);
    normalizedBuffer = file.buffer;
  }

  const filename = file.originalname ? file.originalname.replace(/\.[^.]+$/, ".jpg") : "reference.jpg";
  const contentType = "image/jpeg";
  const sizeBytes = normalizedBuffer.length;

  // 1. Request a signed upload URL.
  const signData = await oneshotFetch("/v1/uploads/sign", {
    method: "POST",
    body: JSON.stringify({ filename, contentType, sizeBytes }),
  });

  const { fileId, uploadUrl, requiredHeaders } = signData;

  // 2. Upload the file to the signed URL.
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { ...requiredHeaders, "Content-Length": sizeBytes },
    body: normalizedBuffer,
  });
  if (!uploadRes.ok) {
    const uploadText = await uploadRes.text();
    throw new Error(`Échec de l'upload de l'image de référence (${uploadRes.status}): ${uploadText}`);
  }

  // 3. Mark the upload as complete.
  await oneshotFetch("/v1/uploads/complete", {
    method: "POST",
    body: JSON.stringify({ fileId }),
  });

  return fileId;
}

async function pollOneShotJob(jobId) {
  const maxAttempts = 60; // up to ~2 minutes
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
      if (!imageUrl) {
        throw new Error("URL de l'image introuvable dans le résultat du job.");
      }
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

app.post("/api/generate", upload.fields([
  { name: "image", maxCount: 1 },
  { name: "reference_1", maxCount: 1 },
  { name: "reference_2", maxCount: 1 },
]), async (req, res) => {
  try {
    const { mode, prompt, clerk_user_id } = req.body;

    if (!ONESHOT_API_KEY) {
      return res.status(500).json({ error: "Clé OneShotAPI non configurée." });
    }

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "Prompt manquant." });
    }

    // Collect reference files and upload them.
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

    // Build an explicit prompt so the model understands the transformation intent.
    const trimmedPrompt = prompt.trim();
    let finalPrompt = trimmedPrompt;
    if (referenceFileIds.length > 0) {
      if (mode === "car") {
        finalPrompt = `Replace the main vehicle in the reference image completely with: ${trimmedPrompt}. Preserve the background, lighting, and camera angle. Do not keep the original car body or add superficial details on top of it — the vehicle must be fully replaced.`;
      } else if (mode === "outfit") {
        finalPrompt = `Apply the following outfit to the person in the reference image: ${trimmedPrompt}. Preserve the person's pose, body shape, background, and lighting. The original clothing should be fully replaced, not just covered with accessories.`;
      }
    }

    // Create the generation job. All uploaded images (main + refs) are sent as referenceFileIds
    // so the model can see them. The API supports up to 4 referenceFileIds.
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

    // Poll until the job is finished.
    let imageUrl;
    try {
      imageUrl = await pollOneShotJob(job.id);
    } catch (pollErr) {
      console.error("OneShot polling error:", pollErr);
      return res.status(502).json({ error: pollErr.message });
    }

    // ── Generation succeeded: deduct credits, save history, handle referrals. ──
    if (clerk_user_id && clerk_user_id.trim() !== "") {
      // Ensure the user row exists (idempotent fallback if Clerk webhook missed).
      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("clerk_user_id")
        .eq("clerk_user_id", clerk_user_id)
        .maybeSingle();

      if (!existingUser) {
        const { error: createError } = await supabaseAdmin
          .from("users")
          .insert({ clerk_user_id, plan: "free", credits: 0, snaprouge_unlocked: false, survey_completed: false });
        if (createError) {
          console.error("failed to create user row during generation:", createError);
        }
      }

      // Deduct credits.
      const { data: userRow, error: userError } = await supabaseAdmin
        .from("users")
        .select("credits")
        .eq("clerk_user_id", clerk_user_id)
        .single();

      if (userError) {
        console.error("credit check error:", userError);
      } else if (userRow) {
        const currentCredits = userRow.credits ?? 0;
        if (currentCredits < GENERATION_COST) {
          return res.status(402).json({ error: "Crédits insuffisants. Rechargez votre compte pour générer." });
        }

        const newCredits = currentCredits - GENERATION_COST;
        const { error: updateError } = await supabaseAdmin
          .from("users")
          .update({ credits: newCredits })
          .eq("clerk_user_id", clerk_user_id);

        if (updateError) {
          console.error("credit deduction error:", updateError);
          return res.status(500).json({ error: "Erreur lors de la déduction des crédits." });
        }
      }

      // Save generation history.
      const { error: saveError } = await supabaseAdmin
        .from("generations")
        .insert({ clerk_user_id, mode, prompt: prompt || "", image_url: imageUrl });
      if (saveError) {
        console.error("Failed to save generation history:", saveError);
        return res.status(500).json({ error: "Erreur lors de l'enregistrement dans l'historique." });
      }
      console.log(`✅ Saved generation history for ${clerk_user_id}: ${imageUrl}`);

      // Grant referrer reward on the referee's first successful generation.
      const { data: pendingReferral } = await supabaseAdmin
        .from("referrals")
        .select("id, referrer_id, reward_granted")
        .eq("referred_id", clerk_user_id)
        .eq("reward_granted", false)
        .maybeSingle();

      if (pendingReferral) {
        const { data: referrer } = await supabaseAdmin
          .from("users")
          .select("credits")
          .eq("clerk_user_id", pendingReferral.referrer_id)
          .single();

        if (referrer) {
          const newReferrerCredits = (referrer.credits ?? 0) + 200;
          const { error: creditError } = await supabaseAdmin
            .from("users")
            .update({ credits: newReferrerCredits })
            .eq("clerk_user_id", pendingReferral.referrer_id);

          if (!creditError) {
            await supabaseAdmin
              .from("referrals")
              .update({ reward_granted: true })
              .eq("id", pendingReferral.id);
          } else {
            console.error("referrer reward credit error:", creditError);
          }
        }
      }
    }

    return res.json({ imageUrl, cost: GENERATION_COST });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ── Serve built React app in production ──────────────────────────────────────
const clientDist = path.join(__dirname, "../client/dist");
app.use(express.static(clientDist));
app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
