import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const payload = await req.json()
    const userEmail = payload.record.email
    const userName = payload.record.raw_user_meta_data?.full_name || 'there'

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
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0B0F19; color: #F3F4F6; border-radius: 8px;">
            <h2 style="color: #00A896;">Hi ${userName},</h2>
            <p>Welcome to <strong>PixelIsolate.online</strong>—your new command center for high-precision, subpixel image extraction.</p>
            <p>To get you moving at terminal speed, we’ve successfully initialized your profile and credited your account with <strong>10 Free High-Definition Isolation Credits</strong>.</p>
            <h3 style="color: #E5E7EB;">Here is what you can deploy right now:</h3>
            <ul>
              <li><strong>Single Subject Isolation:</strong> Experience zero-compromise edge refinement and HSV masking.</li>
              <li><strong>The Bulk Remover:</strong> Drag-and-drop up to 50 assets concurrently (Pro feature preview).</li>
              <li><strong>Secure History Gallery:</strong> Access and re-download your isolated assets anytime.</li>
            </ul>
            <p>Ready to initialize your first pipeline?</p>
            <p style="margin-top: 25px;"><a href="https://pixelisolate.online" style="background-color: #00A896; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Launch Your Workspace Now</a></p>
            <br>
            <p style="color: #9CA3AF; font-size: 0.9em;">Precision cuts await,</p>
            <p><strong>The PixelIsolate Team</strong></p>
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
