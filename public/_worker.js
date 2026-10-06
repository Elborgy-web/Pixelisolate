export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 1. 301 Permanent Redirect for www.pixelisolate.online -> https://pixelisolate.online
    if (url.hostname.startsWith('www.')) {
      const canonicalHost = url.hostname.replace(/^www\./, '');
      return Response.redirect(`https://${canonicalHost}${pathname}${url.search}`, 301);
    }

    // 2. Block direct directory browsing / listing attempts with 403 Forbidden
    if (pathname === '/assets' || pathname === '/assets/' || pathname === '/scripts' || pathname === '/scripts/' || pathname === '/components' || pathname === '/components/') {
      return new Response("Directory listing forbidden.", {
        status: 403,
        headers: {
          "content-type": "text/plain; charset=UTF-8",
          "x-content-type-options": "nosniff",
          "x-frame-options": "DENY"
        }
      });
    }

    // Supabase Credentials for Edge Worker SSR
    const SUPABASE_URL = "https://wnzgwwtidscjwfnapleb.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Induemd3d3RpZHNjandmbmFwbGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMzYzODIsImV4cCI6MjEwNjgxMjM4Mn0.c6EmEUjhhv0-aEtS3BRbfqJ_F23CgUIWUu7NOCcHXt8";

    // Dynamic /sitemap.xml Generation for Search Engine Crawlers
    if (pathname === '/sitemap.xml') {
      const baseUrl = "https://pixelisolate.online";
      const today = new Date().toISOString().split("T")[0];
      let slugs = [];

      try {
        const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/posts?is_published=eq.true&select=slug,published_at,updated_at`, {
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
          }
        });
        if (dbRes.ok) {
          const posts = await dbRes.json();
          if (Array.isArray(posts)) {
            slugs = posts.map(p => ({
              slug: p.slug,
              lastmod: (p.updated_at || p.published_at || today).split("T")[0]
            }));
          }
        }
      } catch (e) {
        console.warn("Sitemap DB query notice:", e);
      }

      const blogUrls = slugs
        .map(
          item => `  <url>
    <loc>${baseUrl}/blog/${item.slug}</loc>
    <lastmod>${item.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
        )
        .join("\n");

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/background-remover</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/image-upscaler</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/pod-background-remover</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/bulk-background-remover</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>${baseUrl}/remove-white-background</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>${baseUrl}/transparent-png-maker</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/privacy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/terms</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/refund</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
${blogUrls}
</urlset>`;

      return new Response(xml, {
        status: 200,
        headers: {
          "content-type": "application/xml; charset=utf-8",
          "x-robots-tag": "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
          "cache-control": "public, max-age=3600, s-maxage=86400"
        }
      });
    }

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

        // Fetch base index.html static asset from Cloudflare Pages binding (must target root '/')
        const indexReq = new Request(new URL('/', request.url), request);
        const assetRes = await env.ASSETS.fetch(indexReq);
        let html = await assetRes.text();

        const title = post
          ? `${post.title} | Pixel Isolate`
          : "Pixel Isolate Blog: Print-on-Demand & AI Design Guides";
        const description = post
          ? post.excerpt
          : "Community-driven tutorials on background removal, subpixel chroma keying, eliminating white print halos, and e-commerce growth.";
        
        let imageUrl = "https://pixelisolate.online/logo.png";
        if (post && post.cover_image && post.cover_image.startsWith("http")) {
          imageUrl = post.cover_image;
        }

        const pageUrl = post
          ? `https://pixelisolate.online/blog/${post.slug}`
          : `https://pixelisolate.online${pathname}`;
        const ogType = post ? "article" : "website";

        const safeTitle = title.replace(/"/g, '&quot;');
        const safeDesc = description.replace(/"/g, '&quot;');

        // Replace <title>
        html = html.replace(/<title>.*?<\/title>/gi, `<title>${safeTitle}</title>`);

        // Universal regex to strip all existing meta tags (description, og:*, twitter:*) and canonical links
        html = html
          .replace(/<meta\s+[^>]*?(?:name|property)=["'](?:description|og:[^"']+|twitter:[^"']+)["'][^>]*?>/gi, "")
          .replace(/<link\s+[^>]*?rel=["']canonical["'][^>]*?>/gi, "");

        const ogMeta = `
          <meta name="description" content="${safeDesc}" />
          <meta property="og:type" content="${ogType}" />
          <meta property="og:site_name" content="Pixel Isolate" />
          <meta property="og:title" content="${safeTitle}" />
          <meta property="og:description" content="${safeDesc}" />
          <meta property="og:url" content="${pageUrl}" />
          <meta property="og:image" content="${imageUrl}" />
          <meta property="og:image:secure_url" content="${imageUrl}" />
          <meta property="og:image:type" content="image/png" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content="${safeTitle}" />
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
            "x-robots-tag": "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
            "cache-control": "public, max-age=60, s-maxage=3600"
          }
        });
      } catch (e) {
        console.error("Cloudflare Worker SSR error:", e);
      }
    }

    // Default static asset fetch for all other routes
    const response = await env.ASSETS.fetch(request);

    // If static asset returns 404 for SPA route, fallback to index.html with 200 OK (except for static asset extensions)
    if (response.status === 404) {
      const isStaticAsset = pathname.startsWith('/assets/') || /\.(js|css|wasm|png|jpg|jpeg|svg|ico|json|woff2?)$/i.test(pathname);
      if (isStaticAsset) {
        return response; // Return actual 404 for missing static chunks to let browser trigger ChunkLoadError retry
      }

      const indexReq = new Request(new URL('/', request.url), request);
      const indexRes = await env.ASSETS.fetch(indexReq);
      return new Response(indexRes.body, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=UTF-8",
          "x-robots-tag": "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        }
      });
    }

    return response;
  }
};
