import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import crypto from "crypto";
import https from "https";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const serverLogs: string[] = [];
const logInfo = (msg: string) => {
  const line = `[INFO] [${new Date().toISOString()}] ${msg}`;
  console.log(line);
  serverLogs.push(line);
  if (serverLogs.length > 500) serverLogs.shift();
};
const logError = (msg: string, err?: any) => {
  const errMsg = err ? (err.message || (typeof err === "object" ? JSON.stringify(err) : String(err))) : "";
  const line = `[ERROR] [${new Date().toISOString()}] ${msg} ${errMsg}`;
  console.error(line);
  serverLogs.push(line);
  if (serverLogs.length > 500) serverLogs.shift();
};

const app = express();
const PORT = 3000;

// Public diagnostics endpoint to inspect backend logs
app.get("/api/diagnostics/logs", (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.send(serverLogs.join("\n"));
});

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


// Helper to send transactional thank you email via Supabase Edge Function using native node https module to guarantee execution across all node runtime versions
const triggerPurchaseEmail = async (userId: string, purchaseType: "subscription" | "credits") => {
  try {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();

    if (profileError) {
      logError(`[Webhook] Error fetching profile for user ID ${userId} inside triggerPurchaseEmail:`, profileError);
    }

    if (profile?.email) {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
      
      let hostname = "";
      try {
        hostname = new URL(supabaseUrl).hostname;
      } catch (e) {
        hostname = supabaseUrl.replace("https://", "").replace("http://", "").split("/")[0].split(":")[0];
      }
      const path = "/functions/v1/send-purchase-email";
      
      const payload = JSON.stringify({
        email: profile.email,
        purchaseType,
        userName: undefined,
      });

      const options = {
        hostname,
        port: 443,
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceKey}`,
          "Content-Length": Buffer.byteLength(payload)
        }
      };

      const req = https.request(options, (res) => {
        let responseBody = "";
        res.on("data", (chunk) => {
          responseBody += chunk;
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            logInfo(`[Webhook] Successfully triggered purchase email for user ${profile.email}`);
          } else {
            logError(`[Webhook] Failed to invoke purchase email function: ${res.statusCode} - ${responseBody}`);
          }
        });
      });

      req.on("error", (err) => {
        logError("[Webhook] Error invoking purchase email function:", err);
      });

      req.write(payload);
      req.end();
    } else {
      logInfo(`[Webhook] No email found in profile for user ID ${userId}, skipping purchase email.`);
    }
  } catch (err) {
    logError("[Webhook] Error triggering purchase email helper:", err);
  }
};

// Webhook endpoint to listen for billing events from Paddle Billing v2
app.post("/api/webhooks/paddle", async (req: any, res) => {
  try {
    const signature = req.get("paddle-signature") || "";
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      res.status(400).json({ error: "Missing webhook signature configurations." });
      return;
    }

    // Parse the paddle-signature header: ts=TIMESTAMP;h1=SIGNATURE
    const parts = signature.split(";").reduce((acc: any, part: string) => {
      const [key, val] = part.split("=");
      if (key && val) acc[key] = val;
      return acc;
    }, {});

    const ts = parts.ts;
    const h1 = parts.h1;

    if (!ts || !h1) {
      res.status(400).json({ error: "Invalid paddle-signature header structure." });
      return;
    }

    // Verify signature manually using crypto and rawBody buffer
    const rawBodyStr = req.rawBody ? req.rawBody.toString("utf8") : "";
    const message = `${ts}:${rawBodyStr}`;

    const hmac = crypto.createHmac("sha256", webhookSecret);
    const computedHash = hmac.update(message).digest("hex");

    const digestBuffer = Buffer.from(computedHash, "hex");
    const signatureBuffer = Buffer.from(h1, "hex");

    if (digestBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(digestBuffer, signatureBuffer)) {
      res.status(401).json({ error: "Invalid signature verification failed." });
      return;
    }

    const payload = req.body;
    const eventType = payload.event_type;
    const entityData = payload.data;
    const customData = entityData?.custom_data;
    const userId = customData?.userId || customData?.user_id;

    logInfo(`[Webhook] Received Paddle event: ${eventType} for user: ${userId || "none"}`);

    if (!userId) {
      logInfo("Webhook received but no userId found in customData.");
      res.status(200).json({ message: "Webhook received but no userId found in customData." });
      return;
    }

    if (eventType === "subscription.created" || eventType === "subscription.updated") {
      const subId = entityData.id;
      const customerId = entityData.customer_id;
      const status = entityData.status; // active, trialing, past_due, canceled, paused
      const currentPeriodEnd = entityData.current_period_end || entityData.next_billed_at;
      
      // Get price ID from items list
      let priceId = "";
      if (entityData.items && entityData.items.length > 0) {
        priceId = entityData.items[0].price?.id || "";
      }

      // Upsert paddle_subscriptions table
      const { error: subError } = await supabaseAdmin
        .from("paddle_subscriptions")
        .upsert({
          id: subId,
          user_id: userId,
          customer_id: customerId,
          status: status,
          price_id: priceId,
          current_period_end: currentPeriodEnd,
          updated_at: new Date().toISOString(),
        });

      if (subError) throw subError;

      // Update profiles is_pro status
      const isPro = status === "active" || status === "trialing";
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ is_pro: isPro, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (profileError) throw profileError;

      // Trigger thank-you email for new subscriptions
      if (eventType === "subscription.created" && isPro) {
        triggerPurchaseEmail(userId, "subscription");
      }

    } else if (eventType === "subscription.canceled" || eventType === "subscription.past_due" || eventType === "subscription.paused") {
      const subId = entityData.id;
      const status = entityData.status;

      // Update subscription record
      const { error: subError } = await supabaseAdmin
        .from("paddle_subscriptions")
        .update({ status: status, updated_at: new Date().toISOString() })
        .eq("id", subId);

      if (subError) throw subError;

      // Revoke pro status
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ is_pro: false, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (profileError) throw profileError;

    } else if (eventType === "transaction.completed") {
      const purchaseType = customData?.purchaseType;
      
      if (purchaseType === "credit_topup") {
        // Fetch current credits
        const { data: profile, error: getError } = await supabaseAdmin
          .from("profiles")
          .select("credits, hd_credits_remaining")
          .eq("id", userId)
          .single();

        if (getError) throw getError;

        const currentCredits = profile?.credits || 0;
        const currentHdCredits = profile?.hd_credits_remaining || 0;
        const creditsToGrant = parseInt(customData.creditsToGrant || "100", 10);

        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({ 
            credits: currentCredits + creditsToGrant, 
            hd_credits_remaining: currentHdCredits + creditsToGrant,
            updated_at: new Date().toISOString() 
          })
          .eq("id", userId);

        if (updateError) throw updateError;

        // Trigger thank-you email for top-up
        triggerPurchaseEmail(userId, "credits");
      }
    }

    res.status(200).json({ success: true });
  } catch (err: any) {
    logError("Paddle Webhook processing error:", err);
    res.status(500).json({ error: err.message || "Webhook handling failed." });
  }
});


// Route to generate a secure customer portal session URL and redirect the user
app.get("/api/billing/portal", async (req: any, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      res.status(400).json({ error: "Missing userId parameter." });
      return;
    }

    // Fetch paddle subscription to get customer ID
    const { data: sub, error: subError } = await supabaseAdmin
      .from("paddle_subscriptions")
      .select("customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (subError || !sub?.customer_id) {
      console.warn(`[Portal] No active subscription or customer ID found for user ${userId}. Redirecting to default billing portal.`);
      const fallbackUrl = process.env.VITE_PADDLE_ENV === "production"
        ? "https://billing.paddle.com"
        : "https://sandbox-customer-portal.paddle.com/login";
      res.redirect(fallbackUrl);
      return;
    }

    const customerId = sub.customer_id;
    const isSandbox = process.env.VITE_PADDLE_ENV !== "production";
    const paddleBaseUrl = isSandbox ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";

    // Call Paddle API to create a customer portal session
    const response = await fetch(`${paddleBaseUrl}/customers/${customerId}/portal-sessions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.PADDLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Paddle API error: ${errText}`);
    }

    const resData = await response.json();
    const portalUrl = resData?.data?.urls?.general?.overview;

    if (portalUrl) {
      res.redirect(portalUrl);
    } else {
      throw new Error("Failed to retrieve portal URL from Paddle response.");
    }
  } catch (err: any) {
    console.error("Failed to generate billing portal session:", err);
    res.redirect(process.env.VITE_PADDLE_ENV === "production"
      ? "https://billing.paddle.com"
      : "https://sandbox-customer-portal.paddle.com/login"
    );
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
