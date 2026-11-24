import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

const SUPABASE_URL = "https://wnzgwwtidscjwfnapleb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Induemd3d3RpZHNjandmbmFwbGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMzYzODIsImV4cCI6MjEwNjgxMjM4Mn0.c6EmEUjhhv0-aEtS3BRbfqJ_F23CgUIWUu7NOCcHXt8";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function truncateWordBoundary(text, maxLen) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxLen) return clean;
  const sliced = clean.slice(0, maxLen).replace(/\s+\S*$/, "").trim();
  return sliced.length >= Math.min(20, maxLen) ? sliced : clean.slice(0, maxLen).trim();
}

function buildMetaTitle(metaTitle, title) {
  const candidate = String(metaTitle || "").trim();
  if (candidate && candidate.length <= 60) return candidate;
  const raw = String(candidate || title || "PixelIsolate").trim();
  const suffix = " | PixelIsolate";
  if (raw.length + suffix.length <= 60) return `${raw}${suffix}`;
  if (raw.length <= 60) return raw;
  return truncateWordBoundary(raw, 60);
}

function buildMetaDescription(metaDesc, excerpt) {
  const candidate = String(metaDesc || "").replace(/\s+/g, " ").trim();
  if (candidate && candidate.length >= 70 && candidate.length <= 160) return candidate;
  const fallback = String(excerpt || "Read AI background removal, white halo cleanup, and 8K print-ready upscaling guides from PixelIsolate.").replace(/\s+/g, " ").trim();
  if (fallback.length <= 160) return fallback;
  return truncateWordBoundary(fallback, 159) + ".";
}

function escapeAttr(val) {
  return String(val || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

const COMMON_5_LETTER_WORDS = new Set([
  "guide", "shirt", "print", "photo", "merch", "store", "image", "tools", "scale", "files",
  "color", "craft", "black", "white", "clean", "alpha", "brand", "sales", "pixel", "spend",
  "ready", "batch", "world", "focus", "boost", "smart", "quick", "super", "ultra",
  "light", "heavy", "sharp", "clear", "edges", "matte", "gloss", "frame", "style", "vinyl",
  "paper", "glass", "metal", "wood", "laser", "anime", "retro", "trend"
]);

function stripBlogSlugHash(slug) {
  const s = String(slug || "").trim().replace(/^\/+|\/+$/g, "").toLowerCase();
  if (!s) return "";
  const match = s.match(/^(.*?)-+([a-z0-9]{5})$/);
  if (!match) return s.replace(/-+/g, "-");
  const base = match[1].replace(/-+$/g, "");
  const suffix = match[2];
  if (!base || base.length < 10) return s.replace(/-+/g, "-");
  const hasDigit = /\d/.test(suffix);
  const hasWeirdCluster = /[qxzjv]/.test(suffix) || /[bcdfghjklmnpqrstvwxyz]{3,}/.test(suffix) || /(aa|uu|yy|ii|oo|ee)/.test(suffix);
  if ((hasDigit || hasWeirdCluster) && !COMMON_5_LETTER_WORDS.has(suffix)) {
    return base.replace(/-+/g, "-");
  }
  return s.replace(/-+/g, "-");
}

function detectArticleTopic(post) {
  const haystack = `${post.title || ""} ${post.slug || ""} ${post.category || ""} ${post.excerpt || ""}`.toLowerCase();
  if (/(upscal|8k|4k|300\s*dpi|super-resolution|esrgan|midjourney|flux|resolution|poster|wall art)/.test(haystack)) {
    return "upscaler";
  }
  if (/(etsy|amazon|shopify|e-commerce|ecommerce|catalog|listing|product photo|bulk|batch)/.test(haystack)) {
    return "ecommerce";
  }
  return "bg-remover";
}

function buildMidArticleCtaHtml(topic) {
  if (topic === "upscaler") {
    return `<div class="my-6 p-5 rounded-xl bg-emerald-950/25 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <p class="text-sm text-gray-200 m-0"><strong class="text-emerald-400">Need 300 DPI print resolution?</strong> Try PixelIsolate's <a href="/image-upscaler?source=organic&amp;utm_campaign=blog_mid_cta" class="text-emerald-400 underline font-semibold">8K AI Image Upscaler</a> or <a href="/pricing?source=organic&amp;utm_campaign=blog_mid_cta" class="text-emerald-400 underline font-semibold">compare plans</a>.</p>
      <a href="/image-upscaler?source=organic&amp;utm_campaign=blog_mid_cta" class="shrink-0 inline-block px-4 py-2 rounded-lg bg-emerald-500 text-gray-950 font-bold text-xs no-underline">Try 8K Upscaler →</a>
    </div>`;
  }
  if (topic === "ecommerce") {
    return `<div class="my-6 p-5 rounded-xl bg-emerald-950/25 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <p class="text-sm text-gray-200 m-0"><strong class="text-emerald-400">Preparing marketplace product images at scale?</strong> Use our <a href="/background-remover?source=organic&amp;utm_campaign=blog_mid_cta" class="text-emerald-400 underline font-semibold">AI Background Remover</a>, <a href="/image-upscaler?source=organic&amp;utm_campaign=blog_mid_cta" class="text-emerald-400 underline font-semibold">8K Upscaler</a>, and <a href="/pricing?source=organic&amp;utm_campaign=blog_mid_cta" class="text-emerald-400 underline font-semibold">non-expiring credit bundles</a>.</p>
      <a href="/background-remover?source=organic&amp;utm_campaign=blog_mid_cta" class="shrink-0 inline-block px-4 py-2 rounded-lg bg-emerald-500 text-gray-950 font-bold text-xs no-underline">Try Free →</a>
    </div>`;
  }
  return `<div class="my-6 p-5 rounded-xl bg-emerald-950/25 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <p class="text-sm text-gray-200 m-0"><strong class="text-emerald-400">Need zero-halo transparent PNGs at scale?</strong> Try PixelIsolate's <a href="/background-remover?source=organic&amp;utm_campaign=blog_mid_cta" class="text-emerald-400 underline font-semibold">AI Background Remover</a> with 10 free credits — no credit card required.</p>
    <a href="/background-remover?source=organic&amp;utm_campaign=blog_mid_cta" class="shrink-0 inline-block px-4 py-2 rounded-lg bg-emerald-500 text-gray-950 font-bold text-xs no-underline">Try Free →</a>
  </div>`;
}

function applyPageMetadata(baseHtml, { title, description, pageUrl, markdownHref, imageUrl, ogType = "website", schemaObj = null }) {
  const safeTitle = escapeAttr(title);
  const safeDesc = escapeAttr(description);
  const safeUrl = escapeAttr(pageUrl);
  const safeImage = escapeAttr(imageUrl);
  const safeMd = escapeAttr(markdownHref);

  let out = baseHtml
    .replace(/<title>.*?<\/title>/gi, `<title>${safeTitle}</title>`)
    .replace(/<link\s+[^>]*?rel=["']canonical["'][^>]*?>/gi, `<link rel="canonical" href="${safeUrl}" />`)
    .replace(/<link\s+[^>]*?hreflang=["']en["'][^>]*?>/gi, `<link rel="alternate" hreflang="en" href="${safeUrl}" />`)
    .replace(/<link\s+[^>]*?hreflang=["']x-default["'][^>]*?>/gi, `<link rel="alternate" hreflang="x-default" href="${safeUrl}" />`)
    .replace(/<link\s+[^>]*?type=["']text\/markdown["'][^>]*?>/gi, `<link rel="alternate" type="text/markdown" href="${safeMd}" />`)
    .replace(/<meta\s+name=["']description["'][^>]*?>/gi, `<meta name="description" content="${safeDesc}" />`)
    .replace(/<meta\s+property=["']og:type["'][^>]*?>/gi, `<meta property="og:type" content="${ogType}" />`)
    .replace(/<meta\s+property=["']og:title["'][^>]*?>/gi, `<meta property="og:title" content="${safeTitle}" />`)
    .replace(/<meta\s+property=["']og:description["'][^>]*?>/gi, `<meta property="og:description" content="${safeDesc}" />`)
    .replace(/<meta\s+property=["']og:image["'][^>]*?>/gi, `<meta property="og:image" content="${safeImage}" />`)
    .replace(/<meta\s+property=["']og:url["'][^>]*?>/gi, `<meta property="og:url" content="${safeUrl}" />`)
    .replace(/<meta\s+(?:name|property)=["']twitter:url["'][^>]*?>/gi, `<meta property="twitter:url" content="${safeUrl}" />`)
    .replace(/<meta\s+(?:name|property)=["']twitter:title["'][^>]*?>/gi, `<meta property="twitter:title" content="${safeTitle}" />`)
    .replace(/<meta\s+(?:name|property)=["']twitter:description["'][^>]*?>/gi, `<meta property="twitter:description" content="${safeDesc}" />`)
    .replace(/<meta\s+(?:name|property)=["']twitter:image["'][^>]*?>/gi, `<meta property="twitter:image" content="${safeImage}" />`);

  if (schemaObj) {
    const schemaScript = `<script type="application/ld+json">\n${JSON.stringify(schemaObj, null, 2)}\n    </script>`;
    if (/<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/i.test(out)) {
      out = out.replace(/<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/i, schemaScript);
    } else {
      out = out.replace("</head>", `${schemaScript}\n</head>`);
    }
  }
  return out;
}

function formatInline(str) {
  if (!str) return "";
  let out = str;
  out = out.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  out = out.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800 text-emerald-400 font-mono text-xs">$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
  out = out.replace(/__([^_]+)__/g, '<strong class="font-semibold text-white">$1</strong>');
  out = out.replace(/\*([^*]+)\*/g, '<em class="italic text-gray-200">$1</em>');
  out = out.replace(/_([^_]+)_/g, '<em class="italic text-gray-200">$1</em>');
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:text-emerald-300 underline underline-offset-4 font-semibold transition">$1</a>');
  out = out.replace(/\[([^\]]+)\]\((\/[^\s\)]+)\)/g, '<a href="$2" class="text-emerald-400 hover:text-emerald-300 underline underline-offset-4 font-semibold transition">$1</a>');
  return out;
}

function markdownToHtml(md) {
  if (!md) return "";
  let text = md.replace(/\r\n/g, "\n");
  const lines = text.split("\n");
  const htmlBlocks = [];
  let inList = false;
  let listType = "ul";
  let listItems = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      const tag = listType;
      const itemsHtml = listItems.map(item => `  <li class="leading-relaxed mb-2">${formatInline(item)}</li>`).join("\n");
      htmlBlocks.push(`<${tag} class="my-5 space-y-2 pl-6 ${tag === 'ul' ? 'list-disc' : 'list-decimal'} text-gray-300">\n${itemsHtml}\n</${tag}>`);
      listItems = [];
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    if (line === "---" || line === "***" || line === "___") {
      flushList();
      htmlBlocks.push('<hr class="my-8 border-gray-850" />');
      continue;
    }

    if (line.startsWith("# ")) {
      flushList();
      htmlBlocks.push(`<h2 class="text-2xl sm:text-3xl font-bold text-white mt-10 mb-4 tracking-tight border-b border-gray-800 pb-3">${formatInline(line.replace(/^#\s+/, ""))}</h2>`);
      continue;
    }

    if (line.startsWith("## ")) {
      flushList();
      htmlBlocks.push(`<h2 class="text-xl sm:text-2xl font-bold text-emerald-400 mt-8 mb-4 tracking-tight border-b border-gray-850 pb-2">${formatInline(line.replace(/^##\s+/, ""))}</h2>`);
      continue;
    }

    if (line.startsWith("### ")) {
      flushList();
      htmlBlocks.push(`<h3 class="text-lg sm:text-xl font-bold text-gray-200 mt-6 mb-3 tracking-tight">${formatInline(line.replace(/^###\s+/, ""))}</h3>`);
      continue;
    }

    if (line.startsWith("> ")) {
      flushList();
      htmlBlocks.push(`<blockquote class="my-6 border-l-4 border-emerald-500 pl-4 py-2 italic text-gray-300 bg-emerald-950/20 rounded-r-lg">${formatInline(line.replace(/^>\s+/, ""))}</blockquote>`);
      continue;
    }

    if (/^[\*\-]\s+/.test(line)) {
      if (!inList || listType !== "ul") {
        flushList();
        inList = true;
        listType = "ul";
      }
      listItems.push(line.replace(/^[\*\-]\s+/, ""));
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      if (!inList || listType !== "ol") {
        flushList();
        inList = true;
        listType = "ol";
      }
      listItems.push(line.replace(/^\d+\.\s+/, ""));
      continue;
    }

    flushList();
    htmlBlocks.push(`<p class="my-4 text-base sm:text-lg text-gray-300 leading-relaxed font-sans">${formatInline(line)}</p>`);
  }
  flushList();
  return htmlBlocks.join("\n");
}

async function prerender() {
  console.log("[Prerender] Starting static HTML generation for Blog routes...");
  const baseIndexPath = path.join(distDir, "index.html");

  if (!fs.existsSync(baseIndexPath)) {
    console.error("[Prerender] Error: dist/index.html does not exist. Run vite build first.");
    process.exit(1);
  }

  const baseHtml = fs.readFileSync(baseIndexPath, "utf8");

  // Fetch all published posts from Supabase
  let posts = [];
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("id, slug, title, meta_title, meta_description, excerpt, content, cover_image, category, reading_time_minutes, author_name, published_at, updated_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    if (error) throw error;
    posts = data || [];
    console.log(`[Prerender] Successfully fetched ${posts.length} published posts from Supabase.`);
  } catch (err) {
    console.error("[Prerender] Warning: Failed to fetch posts from Supabase:", err.message);
  }

  const blogDir = path.join(distDir, "blog");
  if (!fs.existsSync(blogDir)) fs.mkdirSync(blogDir, { recursive: true });

  // -------------------------------------------------------------
  // 1. Generate /blog directory page
  // -------------------------------------------------------------
  const blogTitle = "Pixel Isolate Blog: Print-on-Demand & AI Design Guides";
  const blogDesc = "Expert tutorials on background removal, subpixel chroma keying, eliminating white print halos, and scaling e-commerce photography.";
  const blogUrl = "https://pixelisolate.online/blog";
  const blogImage = "https://pixelisolate.online/logo.png";

  const blogCardsHtml = posts.map(p => {
    const cleanS = stripBlogSlugHash(p.slug);
    const pubDate = new Date(p.published_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    const coverHtml = p.cover_image && p.cover_image.startsWith("http")
      ? `<div class="h-44 w-full overflow-hidden bg-gray-900"><img src="${p.cover_image}" alt="${p.title}" class="w-full h-full object-cover transition-transform duration-300 hover:scale-105" loading="lazy" /></div>`
      : "";

    return `
      <article class="flex flex-col bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden hover:border-emerald-500/50 transition">
        ${coverHtml}
        <div class="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between text-xs text-emerald-400 font-mono mb-2">
              <span class="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">${p.category || "Tutorials"}</span>
              <span>${p.reading_time_minutes || 5} min read</span>
            </div>
            <h2 class="text-lg font-bold text-white mb-2 leading-snug hover:text-emerald-400 transition">
              <a href="/blog/${cleanS}">${p.title}</a>
            </h2>
            <p class="text-sm text-gray-400 line-clamp-3 mb-4 leading-relaxed">${p.excerpt || ""}</p>
          </div>
          <div class="pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-500 font-mono">
            <span>${pubDate}</span>
            <a href="/blog/${cleanS}" class="text-emerald-400 hover:underline font-semibold">Read Guide →</a>
          </div>
        </div>
      </article>
    `;
  }).join("\n");

  const blogIndexSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        "@id": `${blogUrl}#blog`,
        "name": blogTitle,
        "description": blogDesc,
        "url": blogUrl,
        "publisher": {
          "@type": "Organization",
          "@id": "https://pixelisolate.online/#organization",
          "name": "Pixel Isolate Engine Inc.",
          "url": "https://pixelisolate.online/",
          "logo": "https://pixelisolate.online/logo.png"
        }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://pixelisolate.online/" },
          { "@type": "ListItem", "position": 2, "name": "Blog", "item": blogUrl }
        ]
      }
    ]
  };

  const blogRootContent = `
    <header class="p-4 border-b border-white/10 bg-[#030712] text-white">
      <nav class="max-w-6xl mx-auto flex justify-between items-center flex-wrap gap-4">
        <a href="https://pixelisolate.online/" class="text-white font-bold no-underline text-lg">Pixel Isolate</a>
        <div class="flex gap-4 text-sm font-medium flex-wrap">
          <a href="/background-remover" class="text-gray-300 hover:text-white transition">Background Remover</a>
          <a href="/image-upscaler" class="text-gray-300 hover:text-white transition">8K Upscaler</a>
          <a href="/pricing" class="text-gray-300 hover:text-white transition">Pricing</a>
          <a href="/compare" class="text-gray-300 hover:text-white transition">Compare</a>
          <a href="/blog" class="text-emerald-400 font-semibold">Blog</a>
          <a href="/sitemap" class="text-gray-300 hover:text-white transition">Sitemap</a>
        </div>
      </nav>
    </header>

    <main class="max-w-6xl w-full mx-auto px-4 sm:px-6 py-10">
      <nav class="text-xs text-gray-400 mb-6 flex gap-2 items-center font-mono" aria-label="Breadcrumb">
        <a href="/" class="hover:text-emerald-400 transition">Home</a>
        <span>›</span>
        <span class="text-emerald-400">Blog</span>
      </nav>
      <div class="text-center max-w-3xl mx-auto mb-12">
        <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3 font-mono">Engineering &amp; Masterclasses</span>
        <h1 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">Print-on-Demand &amp; AI Design Guides</h1>
        <p class="text-base text-gray-400 leading-relaxed">
          Comprehensive, production-grade masterclasses on AI background removal, eliminating white edge halos on dark shirts, 8K super-resolution upscaling, and e-commerce conversion optimization.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${blogCardsHtml}
      </div>
    </main>

    <footer class="mt-16 border-t border-gray-900 py-10 text-center text-xs text-gray-500 font-mono">
      <div class="flex justify-center flex-wrap gap-5 mb-4">
        <a href="/" class="hover:text-emerald-400">Home</a>
        <a href="/background-remover" class="hover:text-emerald-400">Background Remover</a>
        <a href="/image-upscaler" class="hover:text-emerald-400">8K Upscaler</a>
        <a href="/pricing" class="hover:text-emerald-400">Pricing</a>
        <a href="/compare" class="hover:text-emerald-400">Compare</a>
        <a href="/blog" class="hover:text-emerald-400">Blog</a>
        <a href="/sitemap" class="hover:text-emerald-400">Sitemap</a>
        <a href="/privacy" class="hover:text-emerald-400">Privacy Policy</a>
        <a href="/terms" class="hover:text-emerald-400">Terms of Service</a>
        <a href="/refund" class="hover:text-emerald-400">Refund Policy</a>
      </div>
      <p>© 2026 Pixel Isolate Engine. Subpixel WebAssembly background removal workspace.</p>
    </footer>
  `;

  let blogIndexHtml = applyPageMetadata(baseHtml, {
    title: blogTitle,
    description: blogDesc,
    pageUrl: blogUrl,
    markdownHref: "/blog.md",
    imageUrl: blogImage,
    ogType: "website",
    schemaObj: blogIndexSchema
  }).replace(/<div id="root">[\s\S]*?<\/div>\s*<\/body>/i, `<div id="root">\n${blogRootContent}\n</div>\n</body>`);

  fs.writeFileSync(path.join(blogDir, "index.html"), blogIndexHtml, "utf8");
  console.log(`[Prerender] Generated static HTML for: /blog`);

  // -------------------------------------------------------------
  // 2. Pre-render each article slug page with FULL SEMANTIC BODY
  // -------------------------------------------------------------
  for (const post of posts) {
    const cleanSlug = stripBlogSlugHash(post.slug);
    const postDir = path.join(blogDir, cleanSlug);
    if (!fs.existsSync(postDir)) fs.mkdirSync(postDir, { recursive: true });

    const title = buildMetaTitle(post.meta_title, post.title);
    const desc = buildMetaDescription(post.meta_description, post.excerpt);
    const pageUrl = `https://pixelisolate.online/blog/${cleanSlug}`;
    const imageUrl = post.cover_image && post.cover_image.startsWith("http")
      ? post.cover_image
      : "https://pixelisolate.online/logo.png";
    const pubDate = new Date(post.published_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    const isoDate = new Date(post.published_at).toISOString();
    const modifiedDate = new Date(post.updated_at || post.published_at).toISOString();

    const topic = detectArticleTopic(post);
    const rawBodyHtml = markdownToHtml(post.content || "");
    const bodyParts = rawBodyHtml.split("\n");
    const midPos = bodyParts.length >= 8 ? Math.floor(bodyParts.length * 0.45) : -1;
    if (midPos > 0) {
      bodyParts.splice(midPos, 0, buildMidArticleCtaHtml(topic));
    }
    const articleBodyHtml = bodyParts.join("\n");

    const relatedPosts = posts.filter((p) => stripBlogSlugHash(p.slug) !== cleanSlug).slice(0, 4);
    const relatedHtml = relatedPosts.length > 0 ? `
      <aside class="mt-10 p-6 rounded-2xl bg-gray-900/50 border border-gray-800">
        <h2 class="text-lg font-bold text-white mb-4">Related Guides &amp; Tools</h2>
        <ul class="space-y-2 text-sm">
          ${relatedPosts.map((r) => `<li><a href="/blog/${stripBlogSlugHash(r.slug)}" class="text-emerald-400 hover:underline">${r.title}</a></li>`).join("\n")}
        </ul>
        <div class="mt-4 pt-4 border-t border-gray-800 flex flex-wrap gap-4 text-xs font-mono">
          <a href="/background-remover?source=organic" class="text-emerald-400 hover:underline">AI Background Remover →</a>
          <a href="/image-upscaler?source=organic" class="text-emerald-400 hover:underline">8K AI Image Upscaler →</a>
          <a href="/pricing?source=organic" class="text-emerald-400 hover:underline">Pricing &amp; Plans →</a>
        </div>
      </aside>
    ` : "";

    const primaryToolHref = topic === "upscaler" ? "/image-upscaler?source=organic&amp;utm_campaign=blog_cta" : "/background-remover?source=organic&amp;utm_campaign=blog_cta";
    const primaryToolLabel = topic === "upscaler" ? "Try 8K Upscaler Free ↗" : "Try Background Remover Free ↗";

    const coverImgTag = post.cover_image && post.cover_image.startsWith("http")
      ? `<div class="mb-8 rounded-xl overflow-hidden border border-gray-800 bg-gray-900 max-h-[500px]">
          <img src="${post.cover_image}" alt="${post.title}" class="w-full h-full object-cover" />
        </div>`
      : "";

    const articleRootContent = `
      <header class="p-4 border-b border-white/10 bg-[#030712] text-white">
        <nav class="max-w-4xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <a href="https://pixelisolate.online/" class="text-white font-bold no-underline text-lg">Pixel Isolate</a>
          <div class="flex gap-4 text-sm font-medium flex-wrap">
            <a href="/background-remover" class="text-gray-300 hover:text-white transition">Background Remover</a>
            <a href="/image-upscaler" class="text-gray-300 hover:text-white transition">8K Upscaler</a>
            <a href="/pricing" class="text-gray-300 hover:text-white transition">Pricing</a>
            <a href="/blog" class="text-emerald-400 font-semibold">Blog</a>
            <a href="/sitemap" class="text-gray-300 hover:text-white transition">Sitemap</a>
          </div>
        </nav>
      </header>

      <main class="max-w-4xl w-full mx-auto px-4 sm:px-6 py-10">
        <nav class="text-xs text-gray-400 mb-6 flex gap-2 items-center font-mono" aria-label="Breadcrumb">
          <a href="/" class="hover:text-emerald-400 transition">Home</a>
          <span>›</span>
          <a href="/blog" class="hover:text-emerald-400 transition">Blog</a>
          <span>›</span>
          <span class="text-emerald-400 truncate max-w-xs">${post.title}</span>
        </nav>

        <article class="prose prose-invert max-w-none">
          <header class="mb-8">
            <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4 font-mono">
              ${post.category || "Tutorials"}
            </span>
            <h1 class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
              ${post.title}
            </h1>
            <div class="flex items-center gap-4 text-xs text-gray-400 border-b border-gray-800 pb-4 font-mono">
              <span class="text-gray-300 font-semibold">By ${post.author_name || "Mohamed Elborgy"}</span>
              <span>•</span>
              <time datetime="${isoDate}">${pubDate}</time>
              <span>•</span>
              <span>${post.reading_time_minutes || 5} min read</span>
            </div>
          </header>

          <div class="article-lead text-base sm:text-lg text-gray-300 font-medium mb-8 leading-relaxed">
            ${post.excerpt || ""}
          </div>

          ${coverImgTag}

          <div class="article-body">
            ${articleBodyHtml}
          </div>

          <div class="mt-14 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-gray-900 to-gray-900 border border-emerald-500/30 text-center">
            <h3 class="text-xl sm:text-2xl font-bold text-white mb-2">Start With 10 Free Credits — No Credit Card Required</h3>
            <p class="text-sm text-gray-300 mb-6 max-w-xl mx-auto leading-relaxed">
              Create subpixel zero-halo cutouts and upscale images to 8K 300 DPI print resolution directly inside your browser.
            </p>
            <div class="flex justify-center flex-wrap gap-3">
              <a href="${primaryToolHref}" class="inline-block px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-sm transition no-underline">
                ${primaryToolLabel}
              </a>
              <a href="/pricing?source=organic&amp;utm_campaign=blog_cta" class="inline-block px-6 py-3 rounded-lg border border-gray-700 text-emerald-400 font-semibold text-sm transition no-underline">
                View Pricing Plans
              </a>
            </div>
          </div>

          ${relatedHtml}
        </article>
      </main>

      <footer class="mt-16 border-t border-gray-900 py-10 text-center text-xs text-gray-500 font-mono">
        <div class="flex justify-center flex-wrap gap-5 mb-4">
          <a href="/" class="hover:text-emerald-400">Home</a>
          <a href="/background-remover" class="hover:text-emerald-400">Background Remover</a>
          <a href="/image-upscaler" class="hover:text-emerald-400">8K Upscaler</a>
          <a href="/pricing" class="hover:text-emerald-400">Pricing</a>
          <a href="/compare" class="hover:text-emerald-400">Compare</a>
          <a href="/blog" class="hover:text-emerald-400">Blog</a>
          <a href="/sitemap" class="hover:text-emerald-400">Sitemap</a>
          <a href="/privacy" class="hover:text-emerald-400">Privacy Policy</a>
          <a href="/terms" class="hover:text-emerald-400">Terms of Service</a>
          <a href="/refund" class="hover:text-emerald-400">Refund Policy</a>
        </div>
        <p>© 2026 Pixel Isolate Engine. Subpixel WebAssembly background removal workspace.</p>
      </footer>
    `;

    const articleSchema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BlogPosting",
          "headline": post.title,
          "description": desc,
          "image": imageUrl,
          "datePublished": isoDate,
          "dateModified": modifiedDate,
          "author": {
            "@type": "Person",
            "name": post.author_name || "Mohamed Elborgy"
          },
          "publisher": {
            "@type": "Organization",
            "@id": "https://pixelisolate.online/#organization",
            "name": "Pixel Isolate Engine Inc.",
            "logo": {
              "@type": "ImageObject",
              "url": "https://pixelisolate.online/logo.png"
            }
          },
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": pageUrl
          }
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://pixelisolate.online/" },
            { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://pixelisolate.online/blog" },
            { "@type": "ListItem", "position": 3, "name": post.title, "item": pageUrl }
          ]
        }
      ]
    };

    let postHtml = applyPageMetadata(baseHtml, {
      title,
      description: desc,
      pageUrl,
      markdownHref: `/blog/${cleanSlug}.md`,
      imageUrl,
      ogType: "article",
      schemaObj: articleSchema
    }).replace(/<div id="root">[\s\S]*?<\/div>\s*<\/body>/i, `<div id="root">\n${articleRootContent}\n</div>\n</body>`);

    fs.writeFileSync(path.join(postDir, "index.html"), postHtml, "utf8");
  }

  console.log(`[Prerender] Successfully generated static HTML for all ${posts.length} blog posts!`);
}

prerender();
