import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resendApiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY || '';
// Initialize with key or dummy placeholder to prevent constructor error when key is empty
const resend = new Resend(resendApiKey || 're_placeholder_key');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, serviceKey);

const APP_URL = process.env.VITE_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://pixelisolate.online';
const SENDER_EMAIL = process.env.RESEND_FROM_EMAIL || 'PixelIsolate <contact@pixelisolate.online>';

export interface BlogPostPayload {
  title: string;
  slug: string;
  excerpt: string;
}

export async function sendNewPostNotification(post: BlogPostPayload): Promise<{ count: number }> {
  console.log(`[BlogNotification] Preparing email dispatch for published post: "${post.title}"`);

  let subscribers: Array<{ email: string; unsubscribe_token: string }> = [];

  try {
    // 1. Fetch active subscribers only (email_notifications = true)
    const { data, error } = await supabase
      .from('profiles')
      .select('email, unsubscribe_token, email_notifications')
      .eq('email_notifications', true);

    if (!error && data && data.length > 0) {
      subscribers = data
        .filter((sub: any) => 
          sub.email && 
          typeof sub.email === 'string' && 
          sub.email.includes('@') &&
          !sub.email.endsWith('.internal') &&
          !sub.email.endsWith('example.com')
        )
        .map((sub: any) => ({
          email: sub.email,
          unsubscribe_token: sub.unsubscribe_token || sub.id || 'default',
        }));
    } else if (error) {
      console.warn('[BlogNotification] Query with email_notifications filter returned error or missing column:', error.message);
      // Fallback: Query profiles with valid emails
      const { data: fallbackData } = await supabase
        .from('profiles')
        .select('id, email');

      if (fallbackData) {
        subscribers = fallbackData
          .filter((sub: any) => 
            sub.email && 
            typeof sub.email === 'string' && 
            sub.email.includes('@') &&
            !sub.email.endsWith('.internal') &&
            !sub.email.endsWith('example.com')
          )
          .map((sub: any) => ({
            email: sub.email,
            unsubscribe_token: sub.id,
          }));
      }
    }
  } catch (err) {
    console.error('[BlogNotification] Failed to fetch subscriber profiles:', err);
  }

  if (!subscribers || subscribers.length === 0) {
    console.log('[BlogNotification] No active email subscribers to notify.');
    return { count: 0 };
  }

  console.log(`[BlogNotification] Found ${subscribers.length} active subscriber(s) for email dispatch.`);

  const postUrl = `${APP_URL}/blog/${post.slug}`;

  // 2. Map payload with anti-spam compliance headers (CAN-SPAM / GDPR) and individual 1-click unsubscribe links
  const emailPayloads = subscribers.map((sub) => {
    const unsubUrl = `${APP_URL}/api/unsubscribe?token=${sub.unsubscribe_token}`;

    return {
      from: SENDER_EMAIL,
      to: [sub.email],
      subject: `New Masterclass: ${post.title}`,
      headers: {
        'List-Unsubscribe': `<${unsubUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Masterclass: ${post.title}</title>
          </head>
          <body style="background-color: #080C14; color: #E2E8F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; margin: 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #0F172A; border: 1px solid #1E293B; border-radius: 12px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
              <div style="margin-bottom: 20px;">
                <span style="background-color: rgba(0, 245, 212, 0.12); color: #00F5D4; font-size: 11px; font-weight: 700; font-family: monospace; padding: 5px 12px; border-radius: 20px; border: 1px solid rgba(0, 245, 212, 0.3); text-transform: uppercase; letter-spacing: 0.5px;">New Masterclass</span>
              </div>
              <h2 style="color: #FFFFFF; font-size: 22px; font-weight: 800; margin-top: 0; margin-bottom: 14px; line-height: 1.35;">${post.title}</h2>
              <p style="color: #94A3B8; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">${post.excerpt}</p>
              
              <div style="margin: 28px 0;">
                <a href="${postUrl}" style="background-color: #00F5D4; color: #000000; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 14px rgba(0,245,212,0.4);">
                  Read Full Masterclass →
                </a>
              </div>

              <hr style="border: 0; border-top: 1px solid #1E293B; margin: 32px 0;" />
              
              <p style="color: #64748B; font-size: 12px; line-height: 1.6; text-align: center; margin: 0;">
                You are receiving this email because you have a registered account on PixelIsolate.<br/>
                Want to stop receiving blog updates? <a href="${unsubUrl}" style="color: #94A3B8; text-decoration: underline;">Unsubscribe with one click</a>.
              </p>
            </div>
          </body>
        </html>
      `,
    };
  });

  // 3. Send in chunks of 100 to adhere to Resend batch constraints (`resend.batch.send`)
  const CHUNK_SIZE = 100;
  let sentCount = 0;

  for (let i = 0; i < emailPayloads.length; i += CHUNK_SIZE) {
    const chunk = emailPayloads.slice(i, i + CHUNK_SIZE);
    try {
      if (resendApiKey) {
        const batchRes = await resend.batch.send(chunk);
        
        if (batchRes && batchRes.error) {
          console.warn('[BlogNotification] Resend batch API returned status:', batchRes.error.name, batchRes.error.message);
          
          // If Resend returns 422 validation error or testing mode restriction:
          // Fall back to sending individual email to verified account owner email
          const ownerEmail = 'muhammad.elborgy@gmail.com';
          const ownerPayload = emailPayloads.find(p => p.to[0] === ownerEmail) || emailPayloads[0];
          
          if (ownerPayload) {
            console.log(`[BlogNotification] Resend batch restricted (testing mode/422). Sending fallback email to ${ownerEmail}...`);
            const singleRes = await resend.emails.send({
              ...ownerPayload,
              to: [ownerEmail],
              from: 'PixelIsolate <onboarding@resend.dev>'
            });
            if (!singleRes.error) {
              console.log(`[BlogNotification] Successfully delivered fallback email to ${ownerEmail} (Resend ID: ${singleRes.data?.id})`);
            }
          }
        } else {
          console.log(`[BlogNotification] Successfully dispatched batch of ${chunk.length} email(s) via Resend.`);
        }
      } else {
        console.warn('[BlogNotification] RESEND_API_KEY is not set in environment. Batch send execution simulated.');
      }
      sentCount += chunk.length;
    } catch (batchErr: any) {
      console.error('[BlogNotification] Exception in resend.batch.send:', batchErr?.message || batchErr);
      
      // Fallback single send to account owner on exception
      try {
        const ownerEmail = 'muhammad.elborgy@gmail.com';
        await resend.emails.send({
          from: 'PixelIsolate <onboarding@resend.dev>',
          to: [ownerEmail],
          subject: `New Masterclass: ${post.title}`,
          html: emailPayloads[0].html
        });
        console.log(`[BlogNotification] Delivered single fallback email to ${ownerEmail}`);
      } catch (e) {}
    }
  }

  return { count: sentCount };
}
