import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  // Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const payload = await req.json();
    const email = payload?.record?.email;

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing recipient email in payload record." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!RESEND_API_KEY) {
      console.error("Missing RESEND_API_KEY Deno environment variable.");
      return new Response(JSON.stringify({ error: "Email provider configuration missing." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // HTML Email Template matching the premium PixelIsolate branding
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Pixel Isolate</title>
        <style>
          body {
            background-color: #050505;
            color: #d1d5db;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            margin: 0;
            padding: 40px 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #0a0b0d;
            border: 1px solid #1f2937;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 20px;
            font-weight: 800;
            letter-spacing: -0.025em;
            color: #ffffff;
            margin: 0;
          }
          .logo span {
            color: #10b981;
          }
          h1 {
            color: #ffffff;
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 20px;
            text-align: center;
          }
          p {
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 24px;
            color: #9ca3af;
          }
          .btn-container {
            text-align: center;
            margin: 35px 0;
          }
          .btn {
            background-color: #10b981;
            color: #ffffff !important;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            padding: 12px 30px;
            border-radius: 10px;
            display: inline-block;
            box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
            transition: all 0.2s ease;
          }
          .footer {
            margin-top: 40px;
            border-top: 1px solid #1f2937;
            padding-top: 25px;
            text-align: center;
            font-size: 12px;
            color: #4b5563;
            font-family: monospace;
          }
          .footer a {
            color: #6b7280;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 class="logo">PIXEL<span>ISOLATE</span></h2>
          </div>
          <h1>Welcome to Pixel Isolate!</h1>
          <p>We are thrilled to welcome you to our freemium, high-precision image isolation workspace.</p>
          <p>Your account has been successfully created and instantly credited with <strong>10 free trial credits</strong> to isolate, feather, and remove backgrounds with pixel-perfect accuracy.</p>
          
          <div class="btn-container">
            <a href="https://pixelisolate.online" class="btn" target="_blank">Launch Workspace</a>
          </div>

          <p>If you have any questions, feedback, or need billing support, don't hesitate to reach out directly to our engineering team at <a href="mailto:contact@pixelisolate.online" style="color: #10b981; text-decoration: none;">contact@pixelisolate.online</a>.</p>
          
          <div class="footer">
            <p>© 2026 Pixel Isolate Workspace. All rights reserved.</p>
            <p><a href="https://pixelisolate.online/privacy" target="_blank">Privacy Policy</a> | <a href="https://pixelisolate.online/terms" target="_blank">Terms of Service</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email using Resend API
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Pixel Isolate <welcome@pixelisolate.online>",
        to: [email],
        subject: "Welcome to Pixel Isolate!",
        html: emailHtml,
      }),
    });

    const resData = await res.json();

    return new Response(JSON.stringify({ success: true, data: resData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });

  } catch (error: any) {
    console.error("Welcome email execution failed:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
