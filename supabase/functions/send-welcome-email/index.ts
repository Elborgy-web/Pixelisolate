import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ""

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const payload = await req.json()
    const userEmail = payload.record.email
    const userId = payload.record.id
    
    if (!userId || !userEmail) {
      return new Response(JSON.stringify({ error: 'Missing userId or email in trigger record' }), { status: 400 })
    }

    const userMetaData = payload.record.raw_user_meta_data || {}
    const userName = userMetaData.full_name || 'there'

    // Deduplication check: Check if welcome_sent is already set in metadata
    if (userMetaData.welcome_sent === true) {
      console.log(`[Welcome Email] Welcome email already sent for user ID ${userId} (${userEmail}), skipping.`);
      return new Response(JSON.stringify({ success: true, message: 'Welcome email already sent' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Mark as sent in user auth metadata to prevent duplicate triggering
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { user_metadata: { ...userMetaData, welcome_sent: true } }
    )
    
    if (updateError) {
      console.error(`[Welcome Email] Failed to update user metadata for ${userId}:`, updateError.message);
    }

    console.log(`[Welcome Email] Sending welcome email to ${userEmail}...`);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'PixelIsolate <contact@pixelisolate.online>',
        to: [userEmail],
        subject: 'Welcome to the workspace. Your 10 free credits are active. ⚡',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; background-color: #0B0F19; color: #F3F4F6; border-radius: 12px; border: 1px solid #1F2937;">
            <h2 style="color: #00A896; margin-top: 0;">Hi ${userName},</h2>
            <p>Welcome to <strong>PixelIsolate.online</strong>—your new command center for high-precision, subpixel image extraction.</p>
            <p>To get you moving at terminal speed, we’ve successfully initialized your profile and credited your account with <strong>10 Free High-Definition Isolation Credits</strong>.</p>
            
            <h3 style="color: #E5E7EB; margin-top: 25px;">Here is what you can deploy right now:</h3>
            <ul style="padding-left: 20px; color: #9CA3AF;">
              <li style="margin-bottom: 8px;"><strong>Single Subject Isolation:</strong> Experience zero-compromise edge refinement and HSV masking.</li>
              <li style="margin-bottom: 8px;"><strong>The Bulk Remover:</strong> Drag-and-drop multiple assets concurrently (Pro feature preview).</li>
              <li style="margin-bottom: 8px;"><strong>Secure History Gallery:</strong> Access and re-download your isolated assets anytime.</li>
            </ul>
            
            <p style="margin: 25px 0;"><a href="https://pixelisolate.online" style="background-color: #00A896; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; text-align: center;">Launch Your Workspace Now</a></p>

            <h3 style="color: #E5E7EB; margin-top: 35px; border-top: 1px solid #1F2937; padding-top: 20px;">⚡ Supercharge Your Workspace</h3>
            <p style="color: #9CA3AF; font-size: 0.95em;">Need more processing volume or bulk queues? Upgrade your account for maximum speed:</p>
            
            <div style="margin: 20px 0;">
              <!-- Pro Subscription Card -->
              <div style="background-color: #111827; border: 1px solid #1F2937; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <h4 style="color: #00A896; margin: 0 0 6px 0; font-size: 1.05em; font-weight: bold;">Pro Workspace Subscription — $9/month</h4>
                <p style="color: #9CA3AF; font-size: 0.88em; margin: 0 0 12px 0; line-height: 1.5;">Unlock unlimited high-definition subject cuts, priority processing queues, and full access to the Bulk Remover (process up to 50 images concurrently).</p>
                <a href="https://pixelisolate.online" style="color: #34D399; font-weight: bold; text-decoration: none; font-size: 0.88em;">Upgrade to Pro Plan →</a>
              </div>
              
              <!-- 100 Credits Card -->
              <div style="background-color: #111827; border: 1px solid #1F2937; border-radius: 8px; padding: 16px;">
                <h4 style="color: #00A896; margin: 0 0 6px 0; font-size: 1.05em; font-weight: bold;">100 Isolation Credits Pack — $5 (One-time)</h4>
                <p style="color: #9CA3AF; font-size: 0.88em; margin: 0 0 12px 0; line-height: 1.5;">Running low on trial credits? Top up your balance with 100 high-resolution download credits. Credits never expire and carry over monthly.</p>
                <a href="https://pixelisolate.online" style="color: #34D399; font-weight: bold; text-decoration: none; font-size: 0.88em;">Get 100 Credits Top-Up →</a>
              </div>
            </div>
            
            <br>
            <p style="color: #9CA3AF; font-size: 0.9em; margin-bottom: 4px;">Precision cuts await,</p>
            <p style="margin: 0; font-weight: bold; color: #ffffff;">The PixelIsolate Team</p>
          </div>
        `,
      }),
    })

    const result = await response.json()
    if (!response.ok) {
      console.error("Resend API Error Payload:", result);
      return new Response(JSON.stringify(result), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
