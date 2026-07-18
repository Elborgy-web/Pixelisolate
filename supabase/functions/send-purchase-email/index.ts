import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const payload = await req.json()
    const { email, purchaseType, userName } = payload
    
    if (!email || !purchaseType) {
      return new Response(JSON.stringify({ error: 'Missing email or purchaseType' }), { status: 400 })
    }

    const name = userName || 'there'
    
    let subject = ''
    let htmlContent = ''

    if (purchaseType === 'subscription') {
      subject = 'Your PixelIsolate Pro Plan is Active! 🚀'
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; background-color: #0B0F19; color: #F3F4F6; border-radius: 12px; border: 1px solid #1F2937;">
          <h2 style="color: #00A896; margin-top: 0;">Hi ${name},</h2>
          <p>Thank you for upgrading to the <strong>PixelIsolate Pro Plan</strong>! Your subscription is now fully active.</p>
          <p>Your workspace has been upgraded to the highest performance tier, unlocking all premium design operations and volume parameters.</p>
          
          <h3 style="color: #E5E7EB; margin-top: 25px; border-bottom: 1px solid #1F2937; padding-bottom: 8px;">👑 Your Pro Features are Unlocked:</h3>
          <ul style="padding-left: 20px; color: #9CA3AF; line-height: 1.6;">
            <li style="margin-bottom: 8px;"><strong>Unlimited HD Cutouts:</strong> Process and download images at full raw resolution. No dimension caps.</li>
            <li style="margin-bottom: 8px;"><strong>Bulk Background Remover:</strong> Drag-and-drop up to 50 assets concurrently to process parallel pipelines.</li>
            <li style="margin-bottom: 8px;"><strong>Secure Cloud Archive:</strong> Access, review, and download your historical cutouts from any device.</li>
            <li style="margin-bottom: 8px;"><strong>Priority Processing Node:</strong> Fast lane queue processing with zero trials latency.</li>
          </ul>
          
          <p style="margin: 30px 0; text-align: center;">
            <a href="https://pixelisolate.online" style="background-color: #00A896; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Launch Your Pro Workspace</a>
          </p>

          <p style="color: #9CA3AF; font-size: 0.9em; margin-top: 30px;">Thank you for supporting PixelIsolate!</p>
          <p style="margin: 0; font-weight: bold; color: #ffffff;">The PixelIsolate Team</p>
        </div>
      `
    } else {
      subject = '100 HD Isolation Credits Added to Your Account! ⚡'
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; background-color: #0B0F19; color: #F3F4F6; border-radius: 12px; border: 1px solid #1F2937;">
          <h2 style="color: #00A896; margin-top: 0;">Hi ${name},</h2>
          <p>Your purchase was successful! We have added <strong>100 High-Definition Isolation Credits</strong> to your account.</p>
          <p>These credits never expire and are ready to be used in your workspace whenever you need them.</p>
          
          <h3 style="color: #E5E7EB; margin-top: 25px; border-bottom: 1px solid #1F2937; padding-bottom: 8px;">⚡ Highlights of Your High-Definition Features:</h3>
          <ul style="padding-left: 20px; color: #9CA3AF; line-height: 1.6;">
            <li style="margin-bottom: 8px;"><strong>Full Resolution Downloads:</strong> Download your isolated PNGs at raw upload size.</li>
            <li style="margin-bottom: 8px;"><strong>Subpixel Edge Refinement:</strong> Leverage smart BFS connectivity and local neural networks.</li>
            <li style="margin-bottom: 8px;"><strong>Ad-Free Workflow:</strong> Focus entirely on your creative and print-on-demand designs.</li>
          </ul>
          
          <p style="margin: 30px 0; text-align: center;">
            <a href="https://pixelisolate.online" style="background-color: #00A896; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Deploy Your Credits Now</a>
          </p>

          <p style="color: #9CA3AF; font-size: 0.9em; margin-top: 30px;">Thank you for your purchase!</p>
          <p style="margin: 0; font-weight: bold; color: #ffffff;">The PixelIsolate Team</p>
        </div>
      `
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'PixelIsolate <contact@pixelisolate.online>',
        to: [email],
        subject: subject,
        html: htmlContent,
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
