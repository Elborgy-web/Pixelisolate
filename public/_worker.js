export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Supabase Credentials for Edge Worker SSR
    const SUPABASE_URL = "https://nyiwicwbwzjkijamqqsl.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55aXdpY3did3pqa2lqYW1xcXNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMDUwODgsImV4cCI6MjA5OTc4MTA4OH0.Y34FVIh9iv6tobH238qAszhN6W3waL4Ko2lkjEqsUd4";

    // Intercept /blog and /blog/* routes for dynamic OpenGraph SSR with HTTP 200 OK
    if (pathname === '/blog' || pathname.startsWith('/blog/')) {
      const rawSlug = pathname.replace('/blog/', '').replace('/blog', '').replace(/\/$/, '').trim();
      const cleanSlug = rawSlug.toLowerCase();

      try {
        let post = null;

        if (cleanSlug) {
          // 1. Query Supabase REST API by exact slug match
          const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/posts?slug=eq.${encodeURIComponent(cleanSlug)}&select=*`, {
            headers: {
              "apikey": SUPABASE_ANON_KEY,
              "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
            }
          });

          if (dbRes.ok) {
            const posts = await dbRes.json();
            if (posts && posts.length > 0) {
              post = posts[0];
            } else {
              // 2. Retry query matching prefix or partial slug match
              const cleanPrefix = cleanSlug.split('-').slice(0, 3).join('-');
              if (cleanPrefix && cleanPrefix.length > 3) {
                const prefixRes = await fetch(`${SUPABASE_URL}/rest/v1/posts?slug=ilike.*${encodeURIComponent(cleanPrefix)}*&select=*`, {
                  headers: {
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
                  }
                });
                if (prefixRes.ok) {
                  const prefixPosts = await prefixRes.json();
                  if (prefixPosts && prefixPosts.length > 0) {
                    post = prefixPosts[0];
                  }
                }
              }
            }
          }
        }

        // Fetch base index.html static asset from Cloudflare Pages binding
        const assetRes = await env.ASSETS.fetch(request);
        let html = await assetRes.text();

        const title = post
          ? `${post.title} | Pixel Isolate`
          : "Pixel Isolate Blog: Print-on-Demand & AI Design Guides";
        const description = post
          ? post.excerpt
          : "Community-driven tutorials on background removal, subpixel chroma keying, eliminating white print halos, and e-commerce growth.";
        const imageUrl = (post && post.cover_image)
          ? post.cover_image
          : "https://pixelisolate.online/logo.png";
        const pageUrl = post
          ? `https://pixelisolate.online/blog/${post.slug}`
          : "https://pixelisolate.online/blog";
        const ogType = post ? "article" : "website";

        const safeTitle = title.replace(/"/g, '&quot;');
        const safeDesc = description.replace(/"/g, '&quot;');

        // Replace <title>
        html = html.replace(/<title>.*?<\/title>/gi, `<title>${safeTitle}</title>`);

        // Strip default meta tags to prevent collisions
        html = html
          .replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/gi, "")
          .replace(/<meta\s+property="og:.*?"\s+content=".*?"\s*\/?>/gi, "")
          .replace(/<meta\s+name="twitter:.*?"\s+content=".*?"\s*\/?>/gi, "")
          .replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/gi, "");

        const ogMeta = `
          <meta name="description" content="${safeDesc}" />
          <meta property="og:type" content="${ogType}" />
          <meta property="og:title" content="${safeTitle}" />
          <meta property="og:description" content="${safeDesc}" />
          <meta property="og:image" content="${imageUrl}" />
          <meta property="og:image:secure_url" content="${imageUrl}" />
          <meta property="og:url" content="${pageUrl}" />
          <meta property="og:site_name" content="Pixel Isolate" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="${safeTitle}" />
          <meta name="twitter:description" content="${safeDesc}" />
          <meta name="twitter:image" content="${imageUrl}" />
          <link rel="canonical" href="${pageUrl}" />
        `;

        html = html.replace("<head>", `<head>\n${ogMeta}`);

        return new Response(html, {
          status: 200,
          headers: {
            "content-type": "text/html; charset=UTF-8",
            "cache-control": "public, max-age=60, s-maxage=3600"
          }
        });
      } catch (e) {
        console.error("Cloudflare Worker SSR error:", e);
      }
    }

    // Default static asset fetch for all other routes
    const response = await env.ASSETS.fetch(request);

    // If static asset returns 404 for SPA route, fallback to index.html with 200 OK
    if (response.status === 404) {
      const indexReq = new Request(new URL('/', request.url), request);
      const indexRes = await env.ASSETS.fetch(indexReq);
      return new Response(indexRes.body, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=UTF-8"
        }
      });
    }

    return response;
  }
};
