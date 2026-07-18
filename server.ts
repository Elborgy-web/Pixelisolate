import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const app = express();
const PORT = 3000;

// Enable Cross-Origin Resource Sharing (CORS) for production API access
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Signature");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

// Set up json parser with extended limit, storing rawBody for webhook signature verification
app.use(
  express.json({
    limit: "50mb",
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// REST API for Subject Identity & Analysis (Step 1)
// Health check: Verify server is running and env vars are configured
app.get("/api/health", (req, res) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  res.status(200).json({
    status: "ok",
    supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : "MISSING",
    serviceKey: serviceKey ? `${serviceKey.substring(0, 20)}...` : "MISSING",
    nodeEnv: process.env.NODE_ENV || "undefined",
  });
});

app.post("/api/analyze", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      res.status(400).json({ error: "No image content provided." });
      return;
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      throw new Error("GROQ_API_KEY environment variable is not configured. Please define it in your .env file.");
    }

    const groqPrompt = `
      You are a highly precise pixel-level image isolation assistant powered by Groq. 
      Analyze the uploaded image for background removal and subject isolation.
      
      Respond ONLY with a valid JSON object matching this schema:
      {
        "subjectName": "Name of the main foreground subject",
        "outlineComplexity": "low" | "medium" | "high",
        "colorAnalysis": "Color bleed/clash analysis between background and subject",
        "edgeDifficulty": "Hair, fur, glass transparency, or high frequency edge details found",
        "boundingBox": {
          "x": 0 to 100,
          "y": 0 to 100,
          "w": 0 to 100,
          "h": 0 to 100
        },
        "segmentationAdvice": "Recommended chroma key thresholds, dilations, and erosion advice",
        "detectedBgColorHex": "Dominant background hex color, e.g. #FFFFFF or #123456",
        "detectedBgColorRgb": [R, G, B],
        "autoTunedSliders": {
          "similarity": chroma key tolerance float (0.01 to 0.40, default 0.07),
          "hueMin": chroma green lower Hue limit integer (0 to 180, default 35),
          "hueMax": chroma green upper Hue limit integer (0 to 180, default 85),
          "satMin": chroma green lower Saturation limit integer (0 to 255, default 50),
          "satMax": chroma green upper Saturation limit integer (0 to 255, default 255),
          "valMin": chroma green lower Value limit integer (0 to 255, default 50),
          "valMax": chroma green upper Value limit integer (0 to 255, default 255),
          "erosionSize": erosion size integer (0 to 5px, default 1),
          "dilationSize": dilation size integer (0 to 5px, default 0),
          "featherRadius": Gaussian feather blur radius integer (0 to 5px, default 1)
        }
      }
      
      Tuning Advice:
      - detectedBgColorHex and detectedBgColorRgb MUST be the dominant color of the background of the input image. We will key this color out!
      - similarity: Lower is safer. Prefer very conservative, low values (e.g. 0.04 to 0.08) to prevent eating into foreground subjects unless the background is noisy or highly variable.
      - erosionSize: 2-3 if outlines are complex or hairy to prevent halo bleeding.
      - featherRadius: 2-3 for soft hair, fur or detailed edges; 0-1 for clean, hard objects.
    `;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: groqPrompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || "image/png"};base64,${cleanBase64}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Groq API returned error status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response returned from Groq Vision model.");
    }

    res.json(JSON.parse(content.trim()));
  } catch (err: any) {
    console.error("Analysis endpoint error:", err);
    res.status(500).json({ error: err.message || "Failed to process image analysis using Groq GenAI API." });
  }
});


// Helper to send transactional thank you email via Supabase Edge Function
const triggerPurchaseEmail = async (userId: string, purchaseType: "subscription" | "credits") => {
  try {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .single();

    if (profile?.email) {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/send-purchase-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            email: profile.email,
            purchaseType,
            userName: profile.full_name,
          }),
        }
      );
      
      if (!response.ok) {
        const errText = await response.text();
        console.error(`[Webhook] Failed to invoke purchase email function: ${response.status} ${response.statusText} - ${errText}`);
      } else {
        console.log(`[Webhook] Successfully triggered purchase email for user ${profile.email}`);
      }
    } else {
      console.warn(`[Webhook] No email found in profile for user ID ${userId}, skipping purchase email.`);
    }
  } catch (err) {
    console.error("[Webhook] Error triggering purchase email helper:", err);
  }
};

// Webhook endpoint to listen for billing events from Lemon Squeezy
app.post("/api/webhooks/lemon-squeezy", async (req: any, res) => {
  try {
    const signature = req.get("X-Signature");
    const webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      res.status(400).json({ error: "Missing webhook signature configurations." });
      return;
    }

    // Verify HMAC SHA256 signature
    const hmac = crypto.createHmac("sha256", webhookSecret);
    const digest = hmac.update(req.rawBody).digest("hex");
    
    // Timing safe comparison to prevent timing attacks
    const digestBuffer = Buffer.from(digest, "utf8");
    const signatureBuffer = Buffer.from(signature, "utf8");
    
    if (digestBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(digestBuffer, signatureBuffer)) {
      res.status(401).json({ error: "Invalid signature verification failed." });
      return;
    }

    const payload = req.body;
    const eventName = payload.meta?.event_name;
    const customData = payload.meta?.custom_data;
    const userId = customData?.user_id;

    console.log(`[Webhook] Received Lemon Squeezy event: ${eventName} for user: ${userId || "none"}`);

    if (!userId) {
      // Return 200 to acknowledge the event if no user context is associated
      res.status(200).json({ message: "Webhook received but no user_id found in metadata." });
      return;
    }

    if (eventName === "subscription_created" || eventName === "subscription_updated") {
      const subData = payload.data;
      const subId = subData.id;
      const attributes = subData.attributes;
      const status = attributes.status; // active, trialling, past_due, paused, cancelled
      const variantId = attributes.variant_id?.toString();
      const renewsAt = attributes.renews_at;

      // Upsert subscription table
      const { error: subError } = await supabaseAdmin
        .from("lemon_squeezy_subscriptions")
        .upsert({
          id: subId,
          user_id: userId,
          status: status,
          variant_id: variantId,
          renews_at: renewsAt,
        });

      if (subError) throw subError;

      // Update profiles is_pro status
      const isPro = status === "active" || status === "on_trial";
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ is_pro: isPro, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (profileError) throw profileError;

      // Trigger transactional purchase thank-you email for new Pro subscriptions
      if (eventName === "subscription_created" && isPro) {
        triggerPurchaseEmail(userId, "subscription");
      }

    } else if (eventName === "subscription_cancelled" || eventName === "subscription_expired") {
      const subData = payload.data;
      const subId = subData.id;
      const attributes = subData.attributes;
      const status = attributes.status;

      // Update subscription record
      const { error: subError } = await supabaseAdmin
        .from("lemon_squeezy_subscriptions")
        .update({ status: status })
        .eq("id", subId);

      if (subError) throw subError;

      // Revoke pro status
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ is_pro: false, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (profileError) throw profileError;

    } else if (eventName === "order_created") {
      const orderData = payload.data;
      const attributes = orderData.attributes;
      const variantId = attributes.first_order_item?.variant_id?.toString();

      // Check if it's the 100 Credits package variant (default 1225505)
      const targetCreditsVariant = process.env.LEMON_SQUEEZY_CREDITS_VARIANT_ID || "1225505";
      if (variantId === targetCreditsVariant) {
        // Fetch current credits
        const { data: profile, error: getError } = await supabaseAdmin
          .from("profiles")
          .select("credits")
          .eq("id", userId)
          .single();

        if (getError) throw getError;

        const currentCredits = profile?.credits || 0;
        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({ credits: currentCredits + 100, updated_at: new Date().toISOString() })
          .eq("id", userId);

        if (updateError) throw updateError;

        // Trigger transactional purchase thank-you email for 100 Credits package
        triggerPurchaseEmail(userId, "credits");
      }
    }

    res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    res.status(500).json({ error: err.message || "Webhook handling failed." });
  }
});


// API Endpoint: Save processed image pair to history (bypasses RLS & storage policies via admin client)
app.post("/api/vault", async (req, res) => {
  try {
    const { userId, originalBase64, processedBase64 } = req.body;
    if (!userId || !originalBase64 || !processedBase64) {
      res.status(400).json({ error: "Missing required history payload parameters." });
      return;
    }

    // Sanitize userId to only allow UUID-safe characters (alphanumeric + hyphens)
    const safeUserId = String(userId).replace(/[^a-zA-Z0-9\-_]/g, "_").substring(0, 64);

    // Helper: Convert base64 DataURI to Buffer
    const base64ToBuffer = (base64Str: string) => {
      const splitIdx = base64Str.indexOf(",");
      const cleanBase = splitIdx === -1 ? base64Str : base64Str.substring(splitIdx + 1);
      return Buffer.from(cleanBase, "base64");
    };

    const origBuffer = base64ToBuffer(originalBase64);
    const procBuffer = base64ToBuffer(processedBase64);

    const timestamp = Date.now();
    const origPath = `${safeUserId}/${timestamp}-original.jpg`;
    const procPath = `${safeUserId}/${timestamp}-isolated.jpg`;

    console.log(`[History] Uploading for user ${safeUserId}, paths: ${origPath}, ${procPath}`);

    // 1. Upload original using admin client
    const { error: origError } = await supabaseAdmin.storage
      .from("history_images")
      .upload(origPath, origBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      });
    if (origError) {
      console.error("[History] Original upload error:", JSON.stringify(origError));
      throw origError;
    }

    // 2. Upload isolated using admin client
    const { error: procError } = await supabaseAdmin.storage
      .from("history_images")
      .upload(procPath, procBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      });
    if (procError) {
      console.error("[History] Isolated upload error:", JSON.stringify(procError));
      throw procError;
    }

    // 3. Get public URLs
    const { data: origUrlData } = supabaseAdmin.storage.from("history_images").getPublicUrl(origPath);
    const { data: procUrlData } = supabaseAdmin.storage.from("history_images").getPublicUrl(procPath);

    // 4. Save to history table
    const { data: inserted, error: dbError } = await supabaseAdmin
      .from("history")
      .insert({
        user_id: userId,
        original_url: origUrlData.publicUrl,
        processed_url: procUrlData.publicUrl,
      })
      .select();

    if (dbError) {
      console.error("[History] DB insert error:", JSON.stringify(dbError));
      throw dbError;
    }

    console.log(`[History] Successfully saved history record for user ${safeUserId}`);
    res.status(200).json({ success: true, data: inserted });
  } catch (err: any) {
    console.error("Failed to save history via backend API:", err);
    let errMsg = "Failed to save history.";
    if (err) {
      errMsg = err.message || err.error_description || (typeof err === "object" ? JSON.stringify(err) : String(err));
    }
    res.status(500).json({ error: errMsg });
  }
});

// API Endpoint: Delete history item (bypasses storage & DB policies via admin client)
app.delete("/api/vault/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!id || !userId) {
      res.status(400).json({ error: "Missing delete parameters." });
      return;
    }

    // Retrieve history record to verify ownership
    const { data: item, error: getError } = await supabaseAdmin
      .from("history")
      .select("*")
      .eq("id", id)
      .single();

    if (getError) throw getError;
    if (item.user_id !== userId) {
      res.status(403).json({ error: "Unauthorized access blocked." });
      return;
    }

    // Delete database record
    const { error: dbError } = await supabaseAdmin
      .from("history")
      .delete()
      .eq("id", id);

    if (dbError) throw dbError;

    // Parse storage paths
    const getStoragePathFromUrl = (url: string) => {
      const parts = url.split("/history_images/");
      return parts.length > 1 ? parts[1] : null;
    };

    const origPath = getStoragePathFromUrl(item.original_url);
    const procPath = getStoragePathFromUrl(item.processed_url);
    const filesToDelete = [];
    if (origPath) filesToDelete.push(origPath);
    if (procPath) filesToDelete.push(procPath);

    if (filesToDelete.length > 0) {
      await supabaseAdmin.storage.from("history_images").remove(filesToDelete);
    }

    res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("Failed to delete history item via backend API:", err);
    let errMsg = "Failed to delete history item.";
    if (err) {
      errMsg = err.message || err.error_description || (typeof err === "object" ? JSON.stringify(err) : String(err));
    }
    res.status(500).json({ error: errMsg });
  }
});


// Setup dev server with Vite in dev, or serve production build in production
async function run() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Isolator Engine running at http://0.0.0.0:${PORT}`);
  });
}

run().catch((err) => {
  console.error("Server boot failure:", err);
});
