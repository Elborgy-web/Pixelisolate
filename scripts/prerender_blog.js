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
      .select("id, slug, title, excerpt, content, cover_image, category, reading_time_minutes, author_name, published_at, updated_at")
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
              <a href="/blog/${p.slug}">${p.title}</a>
            </h2>
            <p class="text-sm text-gray-400 line-clamp-3 mb-4 leading-relaxed">${p.excerpt || ""}</p>
          </div>
          <div class="pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-500 font-mono">
            <span>${pubDate}</span>
            <a href="/blog/${p.slug}" class="text-emerald-400 hover:underline font-semibold">Read Guide →</a>
          </div>
        </div>
      </article>
    `;
  }).join("\n");

  const blogRootContent = `
    <header class="p-4 border-b border-white/10 bg-[#030712] text-white">
      <nav class="max-w-6xl mx-auto flex justify-between items-center">
        <a href="https://pixelisolate.online/" class="text-white font-bold no-underline text-lg">Pixel Isolate</a>
        <div class="flex gap-4 text-sm font-medium">
          <a href="/" class="text-gray-300 hover:text-white transition">Workspace</a>
          <a href="/image-upscaler" class="text-gray-300 hover:text-white transition">8K Upscaler</a>
          <a href="/blog" class="text-emerald-400 font-semibold">Blog</a>
          <a href="/sitemap" class="text-gray-300 hover:text-white transition">Sitemap</a>
        </div>
      </nav>
    </header>

    <main class="max-w-6xl w-full mx-auto px-4 sm:px-6 py-10">
      <div class="text-center max-w-3xl mx-auto mb-12">
        <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3 font-mono">Engineering & Masterclasses</span>
        <h1 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">Print-on-Demand & AI Design Guides</h1>
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
        <a href="/image-upscaler" class="hover:text-emerald-400">8K Upscaler</a>
        <a href="/blog" class="hover:text-emerald-400">Blog</a>
        <a href="/sitemap" class="hover:text-emerald-400">Sitemap</a>
        <a href="/privacy" class="hover:text-emerald-400">Privacy Policy</a>
        <a href="/terms" class="hover:text-emerald-400">Terms of Service</a>
        <a href="/refund" class="hover:text-emerald-400">Refund Policy</a>
      </div>
      <p>© 2026 Pixel Isolate Engine. Subpixel WebAssembly background removal workspace.</p>
    </footer>
  `;

  let blogIndexHtml = baseHtml
    .replace(/<title>.*?<\/title>/gi, `<title>${blogTitle}</title>`)
    .replace(/<link\s+[^>]*?rel=["']canonical["'][^>]*?>/gi, `<link rel="canonical" href="${blogUrl}" />`)
    .replace(/<meta name="description" content=".*?" \/>/gi, `<meta name="description" content="${blogDesc}" />`)
    .replace(/<meta property="og:title" content=".*?" \/>/gi, `<meta property="og:title" content="${blogTitle}" />`)
    .replace(/<meta property="og:description" content=".*?" \/>/gi, `<meta property="og:description" content="${blogDesc}" />`)
    .replace(/<meta property="og:image" content=".*?" \/>/gi, `<meta property="og:image" content="${blogImage}" />`)
    .replace(/<meta property="og:url" content=".*?" \/>/gi, `<meta property="og:url" content="${blogUrl}" />`)
    .replace(/<meta name="twitter:title" content=".*?" \/>/gi, `<meta name="twitter:title" content="${blogTitle}" />`)
    .replace(/<meta name="twitter:description" content=".*?" \/>/gi, `<meta name="twitter:description" content="${blogDesc}" />`)
    .replace(/<meta name="twitter:image" content=".*?" \/>/gi, `<meta name="twitter:image" content="${blogImage}" />`)
    .replace(/<div id="root">[\s\S]*?<\/div>\s*<\/body>/i, `<div id="root">\n${blogRootContent}\n</div>\n</body>`);

  fs.writeFileSync(path.join(blogDir, "index.html"), blogIndexHtml, "utf8");
  console.log(`[Prerender] Generated static HTML for: /blog`);

  // -------------------------------------------------------------
  // 2. Pre-render each article slug page with FULL SEMANTIC BODY
  // -------------------------------------------------------------
  for (const post of posts) {
    const postDir = path.join(blogDir, post.slug);
    if (!fs.existsSync(postDir)) fs.mkdirSync(postDir, { recursive: true });

    const title = `${post.title} | Pixel Isolate`;
    const desc = (post.excerpt || "").replace(/"/g, '&quot;');
    const pageUrl = `https://pixelisolate.online/blog/${post.slug}`;
    const imageUrl = post.cover_image && post.cover_image.startsWith("http")
      ? post.cover_image
      : "https://pixelisolate.online/logo.png";
    const pubDate = new Date(post.published_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    const isoDate = new Date(post.published_at).toISOString();
    const modifiedDate = new Date(post.updated_at || post.published_at).toISOString();

    const articleBodyHtml = markdownToHtml(post.content || "");
    const coverImgTag = post.cover_image && post.cover_image.startsWith("http")
      ? `<div class="mb-8 rounded-xl overflow-hidden border border-gray-800 bg-gray-900 max-h-[500px]">
          <img src="${post.cover_image}" alt="${post.title}" class="w-full h-full object-cover" />
        </div>`
      : "";

    const articleRootContent = `
      <header class="p-4 border-b border-white/10 bg-[#030712] text-white">
        <nav class="max-w-4xl mx-auto flex justify-between items-center">
          <a href="https://pixelisolate.online/" class="text-white font-bold no-underline text-lg">Pixel Isolate</a>
          <div class="flex gap-4 text-sm font-medium">
            <a href="/" class="text-gray-300 hover:text-white transition">Workspace</a>
            <a href="/image-upscaler" class="text-gray-300 hover:text-white transition">8K Upscaler</a>
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
          <span class="text-emerald-400 truncate max-w-xs">${post.category || "Tutorials"}</span>
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
            <h3 class="text-xl sm:text-2xl font-bold text-white mb-2">Ready to Isolate & Upscale Your Artwork?</h3>
            <p class="text-sm text-gray-300 mb-6 max-w-xl mx-auto leading-relaxed">
              Create subpixel zero-halo cutouts and upscale images to 8K print resolution directly inside your browser. 10 Free HD Credits included.
            </p>
            <a href="/" class="inline-block px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-sm transition">
              Launch Free Workspace ↗
            </a>
          </div>
        </article>
      </main>

      <footer class="mt-16 border-t border-gray-900 py-10 text-center text-xs text-gray-500 font-mono">
        <div class="flex justify-center flex-wrap gap-5 mb-4">
          <a href="/" class="hover:text-emerald-400">Home</a>
          <a href="/image-upscaler" class="hover:text-emerald-400">8K Upscaler</a>
          <a href="/blog" class="hover:text-emerald-400">Blog</a>
          <a href="/sitemap" class="hover:text-emerald-400">Sitemap</a>
          <a href="/privacy" class="hover:text-emerald-400">Privacy Policy</a>
          <a href="/terms" class="hover:text-emerald-400">Terms of Service</a>
          <a href="/refund" class="hover:text-emerald-400">Refund Policy</a>
        </div>
        <p>© 2026 Pixel Isolate Engine. Subpixel WebAssembly background removal workspace.</p>
      </footer>
    `;

    const schemaJson = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt,
      "image": imageUrl,
      "datePublished": isoDate,
      "dateModified": modifiedDate,
      "author": {
        "@type": "Person",
        "name": post.author_name || "Mohamed Elborgy"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Pixel Isolate",
        "logo": {
          "@type": "ImageObject",
          "url": "https://pixelisolate.online/logo.png"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": pageUrl
      }
    });

    let postHtml = baseHtml
      .replace(/<title>.*?<\/title>/gi, `<title>${title}</title>`)
      .replace(/<link\s+[^>]*?rel=["']canonical["'][^>]*?>/gi, `<link rel="canonical" href="${pageUrl}" />`)
      .replace(/<meta name="description" content=".*?" \/>/gi, `<meta name="description" content="${desc}" />`)
      .replace(/<meta property="og:type" content=".*?" \/>/gi, `<meta property="og:type" content="article" />`)
      .replace(/<meta property="og:title" content=".*?" \/>/gi, `<meta property="og:title" content="${title}" />`)
      .replace(/<meta property="og:description" content=".*?" \/>/gi, `<meta property="og:description" content="${desc}" />`)
      .replace(/<meta property="og:image" content=".*?" \/>/gi, `<meta property="og:image" content="${imageUrl}" />`)
      .replace(/<meta property="og:url" content=".*?" \/>/gi, `<meta property="og:url" content="${pageUrl}" />`)
      .replace(/<meta name="twitter:title" content=".*?" \/>/gi, `<meta name="twitter:title" content="${title}" />`)
      .replace(/<meta name="twitter:description" content=".*?" \/>/gi, `<meta name="twitter:description" content="${desc}" />`)
      .replace(/<meta name="twitter:image" content=".*?" \/>/gi, `<meta name="twitter:image" content="${imageUrl}" />`)
      .replace("</head>", `<script type="application/ld+json">\n${schemaJson}\n</script>\n</head>`)
      .replace(/<div id="root">[\s\S]*?<\/div>\s*<\/body>/i, `<div id="root">\n${articleRootContent}\n</div>\n</body>`);

    fs.writeFileSync(path.join(postDir, "index.html"), postHtml, "utf8");
  }

  console.log(`[Prerender] Successfully generated static HTML for all ${posts.length} blog posts!`);
}

prerender();
