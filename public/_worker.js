const CANONICAL_ORIGIN = "https://pixelisolate.online";
const SUPABASE_URL = "https://wnzgwwtidscjwfnapleb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Induemd3d3RpZHNjandmbmFwbGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMzYzODIsImV4cCI6MjEwNjgxMjM4Mn0.c6EmEUjhhv0-aEtS3BRbfqJ_F23CgUIWUu7NOCcHXt8";

const HTML_CLEAN_MAP = {
  "/index.html": "/",
  "/privacy.html": "/privacy",
  "/terms.html": "/terms",
  "/refund.html": "/refund",
  "/sitemap.html": "/sitemap",
  "/alternatives": "/compare"
};

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

const ORG_SCHEMA = {
  "@type": "Organization",
  "@id": `${CANONICAL_ORIGIN}/#organization`,
  "name": "Pixel Isolate Engine Inc.",
  "url": `${CANONICAL_ORIGIN}/`,
  "logo": `${CANONICAL_ORIGIN}/logo.png`,
  "email": "contact@pixelisolate.online",
  "sameAs": [
    "https://www.facebook.com/pixelisolate/",
    "https://www.instagram.com/pixelisolate/",
    "https://github.com/Elborgy-web/Pixelisolate",
    "https://x.com/pixelisolate",
    "https://startupbase.io/products/pixel-isolate"
  ]
};

function buildBreadcrumbSchema(items) {
  return {
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": item.name,
      "item": item.url
    }))
  };
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

function escapeAttr(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function clampMetaTitle(rawTitle, fallbackTitle) {
  const candidate = String(rawTitle || fallbackTitle || "PixelIsolate").trim();
  if (candidate.length <= 60) return candidate;
  const trimmed = candidate.slice(0, 57).replace(/\s+\S*$/, "").trim();
  return `${trimmed || candidate.slice(0, 57)}...`;
}

function clampMetaDescription(rawDesc, fallbackDesc) {
  const candidate = String(rawDesc || fallbackDesc || "").replace(/\s+/g, " ").trim();
  if (candidate.length <= 160) return candidate;
  const trimmed = candidate.slice(0, 157).replace(/\s+\S*$/, "").trim();
  return `${trimmed || candidate.slice(0, 157)}...`;
}

function acceptsMarkdown(request) {
  const accept = (request.headers.get("accept") || "").toLowerCase();
  if (!accept.includes("text/markdown")) return false;
  const parts = accept.split(",").map((s) => s.trim());
  let mdQ = 0;
  let htmlQ = 0;
  for (const part of parts) {
    const [type, ...params] = part.split(";").map((s) => s.trim());
    let q = 1;
    for (const p of params) {
      if (p.startsWith("q=")) {
        const parsed = parseFloat(p.slice(2));
        if (!Number.isNaN(parsed)) q = parsed;
      }
    }
    if (type === "text/markdown") mdQ = Math.max(mdQ, q);
    if (type === "text/html") htmlQ = Math.max(htmlQ, q);
  }
  return mdQ > 0 && mdQ >= htmlQ;
}

function markdownResponse(md, cacheControl = "public, max-age=3600, s-maxage=86400") {
  return new Response(md, {
    status: 200,
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "vary": "Accept",
      "x-robots-tag": "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      "cache-control": cacheControl
    }
  });
}

function withVaryAccept(response) {
  const headers = new Headers(response.headers);
  const existingVary = headers.get("vary");
  if (!existingVary) {
    headers.set("vary", "Accept");
  } else if (!existingVary.toLowerCase().includes("accept")) {
    headers.set("vary", `${existingVary}, Accept`);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function htmlToMarkdown(html) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let text = bodyMatch ? bodyMatch[1] : html;
  text = text
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n\n")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n")
    .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
    .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**")
    .replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, "*$2*")
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "$1\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&copy;/g, "©")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text + "\n";
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
  const text = md.replace(/\r\n/g, "\n");
  const lines = text.split("\n");
  const htmlBlocks = [];
  let inList = false;
  let listType = "ul";
  let listItems = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      const tag = listType;
      const itemsHtml = listItems.map((item) => `  <li class="leading-relaxed mb-2">${formatInline(item)}</li>`).join("\n");
      htmlBlocks.push(`<${tag} class="my-5 space-y-2 pl-6 ${tag === "ul" ? "list-disc" : "list-decimal"} text-gray-300">\n${itemsHtml}\n</${tag}>`);
      listItems = [];
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

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

function applyPageMeta(html, { title, desc, pageUrl, mdHref, ogType = "website", imageUrl = "https://pixelisolate.online/logo.png", schemaObj = null }) {
  const safeTitle = escapeAttr(title);
  const safeDesc = escapeAttr(desc);
  let out = html
    .replace(/<title>.*?<\/title>/gi, `<title>${escapeHtml(title)}</title>`)
    .replace(/<link\s+[^>]*?rel=["']canonical["'][^>]*?>/gi, `<link rel="canonical" href="${pageUrl}" />`)
    .replace(/<link\s+[^>]*?hreflang=["']en["'][^>]*?>/gi, `<link rel="alternate" hreflang="en" href="${pageUrl}" />`)
    .replace(/<link\s+[^>]*?hreflang=["']x-default["'][^>]*?>/gi, `<link rel="alternate" hreflang="x-default" href="${pageUrl}" />`)
    .replace(/<link\s+[^>]*?type=["']text\/markdown["'][^>]*?>/gi, `<link rel="alternate" type="text/markdown" href="${mdHref}" />`)
    .replace(/<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/?>/gi, `<meta name="description" content="${safeDesc}" />`)
    .replace(/<meta\s+property=["']og:type["']\s+content=["'][^"']*["']\s*\/?>/gi, `<meta property="og:type" content="${ogType}" />`)
    .replace(/<meta\s+property=["']og:title["']\s+content=["'][^"']*["']\s*\/?>/gi, `<meta property="og:title" content="${safeTitle}" />`)
    .replace(/<meta\s+property=["']og:description["']\s+content=["'][^"']*["']\s*\/?>/gi, `<meta property="og:description" content="${safeDesc}" />`)
    .replace(/<meta\s+property=["']og:image["']\s+content=["'][^"']*["']\s*\/?>/gi, `<meta property="og:image" content="${imageUrl}" />`)
    .replace(/<meta\s+property=["']og:url["']\s+content=["'][^"']*["']\s*\/?>/gi, `<meta property="og:url" content="${pageUrl}" />`)
    .replace(/<meta\s+(?:name|property)=["']twitter:title["']\s+content=["'][^"']*["']\s*\/?>/gi, `<meta property="twitter:title" content="${safeTitle}" />`)
    .replace(/<meta\s+(?:name|property)=["']twitter:description["']\s+content=["'][^"']*["']\s*\/?>/gi, `<meta property="twitter:description" content="${safeDesc}" />`)
    .replace(/<meta\s+(?:name|property)=["']twitter:url["']\s+content=["'][^"']*["']\s*\/?>/gi, `<meta property="twitter:url" content="${pageUrl}" />`)
    .replace(/<meta\s+(?:name|property)=["']twitter:image["']\s+content=["'][^"']*["']\s*\/?>/gi, `<meta property="twitter:image" content="${imageUrl}" />`);

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

const INTENT_ROUTES = {
  "/background-remover": {
    title: "AI Background Remover - Transparent PNGs | PixelIsolate",
    desc: "Instant AI background removal engine with high-contrast alpha channel output for portraits, products, and graphic assets.",
    h1: "Instant AI Background Remover for Transparent PNGs",
    lead: "Isolate portraits, e-commerce products, and intricate digital artwork directly inside your browser using WebAssembly neural segmentation and subpixel HSV color keying.",
    sections: [
      {
        heading: "Precision Neural Subject Extraction in Your Browser",
        paragraphs: [
          "Pixel Isolate executes hardware-accelerated RMBG neural segmentation locally on your device rather than uploading private studio files to third-party cloud queues. Hair strands, delicate jewelry, glass edges, and fabric textures are separated from busy backgrounds in seconds with zero server bandwidth bottlenecks.",
          "Because every alpha mask runs at full native image resolution, your exported PNG retains crisp studio edges without the 1000px downscaling penalties common on free web tools."
        ]
      },
      {
        heading: "Interactive HSV Keying & Manual Brush Touch-Ups",
        paragraphs: [
          "When neural models need fine-tuning on complex scenes, switch seamlessly to interactive HSV color keying, connected-component flood protection, and pixel-accurate Restore or Erase brushes with multi-step undo.",
          "Preview cutouts immediately over checkerboard transparency, pure white (#FFFFFF), deep black (#000000), or any custom brand hex color before downloading."
        ]
      },
      {
        heading: "Built for Creators, Agencies, and Online Sellers",
        paragraphs: [
          "Every new workspace account includes 10 free credits so you can test neural cutouts, edge refinement sliders, and solid backdrop exports without entering a credit card."
        ]
      }
    ]
  },
  "/image-upscaler": {
    title: "8K AI Image Upscaler - 300 DPI Print | PixelIsolate",
    desc: "Deep neural super-resolution engine. Enhance low-resolution Midjourney, Flux, and photos into crisp 300 DPI, 4K & 8K print files.",
    h1: "8K AI Image Upscaler for 300 DPI Print Artwork",
    lead: "Scale Midjourney, Flux, and low-resolution raster graphics up to 4K (3840px+) and 8K (7680px+) print-ready files using Real-ESRGAN NCNN Vulkan super-resolution.",
    sections: [
      {
        heading: "Real-ESRGAN Vulkan Models for Graphics & Photography",
        paragraphs: [
          "Standard bicubic resizing stretches existing pixels into soft, blurry edges. Our 8K AI Image Upscaler runs dedicated Real-ESRGAN models—realesrgan-x4plus-anime for illustrations, logos, and flat apparel typography, and realesrgan-x4plus for photorealistic textures and product photography.",
          "For 8K output, a progressive multi-pass pipeline scales cleanly from 4x super-resolution into a crisp 2x refinement pass without tile seams or cropping distortion."
        ]
      },
      {
        heading: "Alpha Transparency Preservation for Print-on-Demand",
        paragraphs: [
          "Unlike generic upscalers that flatten transparent PNGs onto solid white or black backgrounds, Pixel Isolate preserves your 32-bit RGBA alpha channel so transparent t-shirt graphics and stickers scale cleanly to 4500x5400px at 300 DPI."
        ]
      },
      {
        heading: "Single-Image & 50-File Bulk Batch Upscaling",
        paragraphs: [
          "Upscale individual hero images or drop up to 50 artwork files into the Bulk Upscaler queue for unattended batch processing and unified ZIP download."
        ]
      }
    ]
  },
  "/pod-background-remover": {
    title: "POD Background Remover | Zero White Halos on Dark Garments",
    desc: "Engineered specifically for Print-on-Demand sellers. Eliminates white halo edges on dark garments and DTG/DTF transfers.",
    h1: "POD Background Remover Without White Edge Halos",
    lead: "Purpose-built for Amazon Merch, Etsy, Printful, and DTF/DTF apparel sellers who need razor-clean transparent PNGs on black, navy, and charcoal garments.",
    sections: [
      {
        heading: "Eliminate White Underbase Halos Before Printing",
        paragraphs: [
          "Generic background removers leave 1px to 3px of semi-transparent white or grey anti-aliased pixels around graphic edges. On Direct-to-Garment (DTG) and Direct-to-Film (DTF) printers, the RIP software lays white underbase ink beneath every non-zero alpha pixel, creating an ugly frosty outline on dark cotton shirts.",
          "Pixel Isolate solves this at the subpixel level with tunable morphological erosion, boundary decontamination, and real-time dark-garment preview canvases."
        ]
      },
      {
        heading: "Preserve Distressed Textures & Fine Typography",
        paragraphs: [
          "Vintage grunge cracks, halftone dots, and thin script lettering are frequently destroyed by aggressive auto-cutters. Adjust erosion, dilation, and feathering sliders with subpixel feedback so distressed print graphics stay sharp without muddy underbase boxes."
        ]
      },
      {
        heading: "Ready for 4500x5400px Merch & Gang Sheets",
        paragraphs: [
          "Pair halo-free background isolation with our integrated 8K upscaler to export 300 DPI print files compliant with Amazon Merch on Demand, Printify, and 22-inch DTF gang sheets."
        ]
      }
    ]
  },
  "/bulk-background-remover": {
    title: "Bulk Background Remover | Batch Process 50+ Product Photos",
    desc: "Process hundreds of e-commerce product photos in parallel. Queue entire product catalogs and download transparent PNGs in one ZIP archive.",
    h1: "Bulk Background Remover for 50+ Images at Once",
    lead: "Queue entire e-commerce product catalogs, clipart bundles, and merchandise collections for parallel background extraction and unified ZIP export.",
    sections: [
      {
        heading: "Parallel Multi-Image Queue Without Per-File Tedium",
        paragraphs: [
          "Editing product photos or t-shirt graphics one at a time stalls store launches. Drag and drop dozens of PNG, JPG, or WEBP files directly into the Bulk Mode container and run automated AI Magic or unified HSV chroma keying across every item in your queue."
        ]
      },
      {
        heading: "Consistent Erosion, Feathering & Merged Backdrops",
        paragraphs: [
          "Apply identical edge refinement settings across an entire collection—or merge every isolated cutout onto pure white (#FFFFFF) for Amazon and eBay main images, solid black for apparel previews, or transparent RGBA PNGs for Shopify mockups."
        ]
      },
      {
        heading: "One-Click Structured ZIP Packaging",
        paragraphs: [
          "Track live per-file completion progress and download your entire batch in a single organized .zip archive with original filenames preserved for rapid store uploading."
        ]
      }
    ]
  },
  "/remove-white-background": {
    title: "Remove White Background Online | Pure Transparent PNGs",
    desc: "Instantly strip pure white #FFFFFF studio backgrounds from stock images, graphics, and manufacturer product shots.",
    h1: "Remove White Backgrounds from Logos & Product Shots",
    lead: "Strip pure white #FFFFFF studio backdrops, scanned paper grain, and flat manufacturer backgrounds while protecting interior white details inside your subject.",
    sections: [
      {
        heading: "Smart Flood-Fill Protection for Interior Whites",
        paragraphs: [
          "Naive color-replacement tools delete every white pixel in an image—punching holes through white shirt sleeves, typography highlights, eyes, and ceramic product reflections. Pixel Isolate uses Breadth-First Search (BFS) connected-component flooding starting from the image perimeter so only exterior background pixels are removed."
        ]
      },
      {
        heading: "Clean Scanned Logos & AI Art on White Canvases",
        paragraphs: [
          "Midjourney, Flux, and scanned vintage logos often embed yellowed paper noise or slight compression fringes around white backgrounds. Combine color tolerance thresholds with 1–2px boundary erosion to strip residual fringe pixels cleanly."
        ]
      },
      {
        heading: "Export Lossless Transparency or Swap Backdrops",
        paragraphs: [
          "Download an instant transparent PNG cutout or replace the stripped white canvas with a custom hex brand color directly in the browser."
        ]
      }
    ]
  },
  "/transparent-png-maker": {
    title: "Transparent PNG Maker | Instant High-Precision Alpha Masking",
    desc: "Convert standard JPG, WEBP, and AVIF photos into crystal-clear transparent PNGs with preserved transparency gradations.",
    h1: "Transparent PNG Maker with 32-Bit RGBA Alpha Precision",
    lead: "Convert flat JPG, WEBP, and AVIF graphics into crisp, lossless 32-bit transparent PNG files with smooth anti-aliased alpha channels.",
    sections: [
      {
        heading: "True 32-Bit RGBA Alpha Channel Output",
        paragraphs: [
          "Creating a clean transparent PNG requires more than a binary cutout mask. Pixel Isolate calculates continuous 0–255 alpha transparency values along subject boundaries so translucent smoke, glassware, motion edges, and soft shadows composite naturally onto any website, slide deck, or mockup."
        ]
      },
      {
        heading: "Zero Compression Artifacts & Full Resolution",
        paragraphs: [
          "All mask compositing runs locally in browser canvas memory and exports lossless PNG binaries at full source dimensions, preserving crisp vector-like edges on logos, stickers, YouTube thumbnails, and UI icons."
        ]
      },
      {
        heading: "Inspect Transparency Before Exporting",
        paragraphs: [
          "Zoom into pixel-level edges over our high-contrast checkerboard grid or dark/light preview swatches to verify zero jagged stair-stepping prior to download."
        ]
      }
    ]
  },
  "/how-it-works": {
    title: "How It Works | Subpixel Chroma Keying & Neural Segmentation",
    desc: "Learn about the underlying neural network architecture, subpixel alpha matting, and automated halo-suppression pipeline.",
    h1: "How Pixel Isolate Works: Subpixel Keying & Neural AI",
    lead: "Understand the client-side WebAssembly neural pipeline, HSV color space thresholding, BFS connected-component protection, and morphological post-processing behind every cutout.",
    sections: [
      {
        heading: "Stage 1: On-Device AI Neural Segmentation",
        paragraphs: [
          "AI Magic mode executes neural subject segmentation directly inside your browser via WebAssembly and WebGPU acceleration, keeping source photography private on your device."
        ]
      },
      {
        heading: "Stage 2: HSV Chroma Keying & BFS Flood Isolation",
        paragraphs: [
          "Chroma Key mode converts RGB values to Hue-Saturation-Value space and optionally floods inward from image edges using Breadth-First Search so interior subject colors stay protected."
        ]
      },
      {
        heading: "Stage 3: Morphological Erosion, Dilation & Feathering",
        paragraphs: [
          "Post-processing filters contract halo fringes, bridge micro-voids, and apply smooth subpixel boundary feathering before exporting lossless 32-bit PNGs or scaling up to 8K via Real-ESRGAN."
        ]
      }
    ]
  }
};

function renderIntentRootHtml(pathname, routeMeta) {
  const sectionsHtml = routeMeta.sections
    .map(
      (sec) => `
      <section class="mb-10">
        <h2 class="seo-static-h2">${escapeHtml(sec.heading)}</h2>
        ${sec.paragraphs.map((p) => `<p class="seo-static-p">${escapeHtml(p)}</p>`).join("\n        ")}
      </section>`
    )
    .join("\n");

  const toolLinks = [
    ["/", "Workspace"],
    ["/background-remover", "Background Remover"],
    ["/image-upscaler", "8K Upscaler"],
    ["/pod-background-remover", "POD Remover"],
    ["/bulk-background-remover", "Bulk Remover"],
    ["/remove-white-background", "White BG Remover"],
    ["/transparent-png-maker", "PNG Maker"],
    ["/pricing", "Pricing"],
    ["/compare", "Compare"],
    ["/blog", "Blog"]
  ]
    .map(([href, label]) => {
      const cls = href === pathname ? "text-emerald-400 font-semibold" : "seo-footer-link";
      return `<a href="https://pixelisolate.online${href}" class="${cls}">${label}</a>`;
    })
    .join("\n            ");

  const breadcrumbName = routeMeta.shortName || routeMeta.h1;

  return `
      <header class="p-4 border-b border-white/10 bg-[#030712] text-white">
        <nav class="max-w-6xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <a href="https://pixelisolate.online/" class="text-white font-bold no-underline">Pixel Isolate Engine</a>
          <div class="flex gap-4 text-sm flex-wrap">
            ${toolLinks}
          </div>
        </nav>
      </header>

      <main class="seo-static-wrapper">
        <nav class="text-xs text-gray-400 mb-6 flex gap-2 items-center font-mono" aria-label="Breadcrumb">
          <a href="https://pixelisolate.online/" class="hover:text-emerald-400 transition">Home</a>
          <span>›</span>
          <span class="text-emerald-400">${escapeHtml(breadcrumbName)}</span>
        </nav>
        <section class="text-center mb-12">
          <h1 class="seo-static-h1">${escapeHtml(routeMeta.h1)}</h1>
          <p class="seo-static-p max-w-3xl mx-auto">${escapeHtml(routeMeta.lead)}</p>
        </section>
        ${sectionsHtml}
        <section class="mt-12 p-6 rounded-2xl bg-gray-900/60 border border-emerald-500/30 text-center">
          <h2 class="text-xl font-bold text-white mb-2">Start Free With 10 Credits — No Credit Card Required</h2>
          <p class="text-sm text-gray-300 mb-5">Compare our Free Tier, non-expiring $5 credit bundles, and $7.99/mo unlimited Pro plan.</p>
          <div class="flex justify-center flex-wrap gap-4">
            <a href="https://pixelisolate.online/pricing?source=organic" class="inline-block px-5 py-2.5 rounded-lg bg-emerald-500 text-gray-950 font-bold text-sm no-underline">View Pricing Plans →</a>
            <a href="https://pixelisolate.online/compare" class="inline-block px-5 py-2.5 rounded-lg border border-gray-700 text-gray-200 font-semibold text-sm no-underline">Compare vs remove.bg &amp; Canva</a>
          </div>
        </section>
      </main>

      <footer class="seo-footer">
        <div class="flex justify-center flex-wrap gap-5 mb-3">
          <a href="https://pixelisolate.online/" class="seo-footer-link">Home</a>
          <a href="https://pixelisolate.online/background-remover" class="seo-footer-link">Background Remover</a>
          <a href="https://pixelisolate.online/image-upscaler" class="seo-footer-link">8K Upscaler</a>
          <a href="https://pixelisolate.online/pricing" class="seo-footer-link">Pricing</a>
          <a href="https://pixelisolate.online/compare" class="seo-footer-link">Compare</a>
          <a href="https://pixelisolate.online/blog" class="seo-footer-link">Blog</a>
          <a href="https://pixelisolate.online/sitemap" class="seo-footer-link">Sitemap</a>
          <a href="https://pixelisolate.online/privacy" class="seo-footer-link">Privacy Policy</a>
          <a href="https://pixelisolate.online/terms" class="seo-footer-link">Terms of Service</a>
          <a href="https://pixelisolate.online/refund" class="seo-footer-link">Refund Policy</a>
        </div>
        <p>© 2026 Pixel Isolate Engine. Subpixel WebAssembly background removal workspace.</p>
      </footer>
  `;
}

function renderIntentMarkdown(pathname, routeMeta) {
  const sectionsMd = routeMeta.sections
    .map((sec) => `## ${sec.heading}\n\n${sec.paragraphs.join("\n\n")}`)
    .join("\n\n");

  return `# ${routeMeta.h1}\n\n> ${routeMeta.lead}\n\n${sectionsMd}\n\n## Canonical URL\n- [${routeMeta.title}](https://pixelisolate.online${pathname})\n`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 1. Canonical 301 Redirects: enforce https://pixelisolate.online, strip trailing slashes & .html, handle /pixel
    let canonicalPath = pathname.replace(/\/{2,}/g, "/");
    if (canonicalPath.toLowerCase() === "/pixel" || canonicalPath.toLowerCase() === "/pixel/") {
      canonicalPath = "/";
    } else if (HTML_CLEAN_MAP[canonicalPath.toLowerCase()]) {
      canonicalPath = HTML_CLEAN_MAP[canonicalPath.toLowerCase()];
    } else if (canonicalPath.length > 1 && canonicalPath.endsWith("/")) {
      canonicalPath = canonicalPath.slice(0, -1);
    }

    const isApiRoute = pathname.startsWith("/api/") || pathname === "/api";
    if (!isApiRoute && (request.method === "GET" || request.method === "HEAD")) {
      if (url.protocol !== "https:" || url.hostname !== "pixelisolate.online" || canonicalPath !== pathname) {
        return Response.redirect(`${CANONICAL_ORIGIN}${canonicalPath}${url.search}`, 301);
      }
    } else if (url.hostname.startsWith("www.") && (request.method === "GET" || request.method === "HEAD")) {
      return Response.redirect(`${CANONICAL_ORIGIN}${canonicalPath}${url.search}`, 301);
    }

    // 2. Block direct directory browsing / listing attempts with 403 Forbidden
    if (pathname === "/assets" || pathname === "/scripts" || pathname === "/components") {
      return new Response("Directory listing forbidden.", {
        status: 403,
        headers: {
          "content-type": "text/plain; charset=UTF-8",
          "x-content-type-options": "nosniff",
          "x-frame-options": "DENY"
        }
      });
    }

    // 3. Reverse-proxy all /api/* requests to Express backend on Render
    if (isApiRoute) {
      const backendUrl = new URL(request.url);
      backendUrl.protocol = "https:";
      backendUrl.hostname = "pixelisolate-backend.onrender.com";
      backendUrl.port = "";

      const proxyHeaders = new Headers(request.headers);
      proxyHeaders.set("host", "pixelisolate-backend.onrender.com");

      const proxyReq = new Request(backendUrl.toString(), {
        method: request.method,
        headers: proxyHeaders,
        body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
        redirect: "follow"
      });

      return fetch(proxyReq);
    }

    const wantMd = acceptsMarkdown(request);

    // 4. Dynamic /sitemap.xml Generation (noindex, follow so the XML file itself isn't treated as an indexable page)
    if (pathname === "/sitemap.xml") {
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
            slugs = posts.map((p) => ({
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
          (item) => `  <url>
    <loc>${CANONICAL_ORIGIN}/blog/${stripBlogSlugHash(item.slug)}</loc>
    <lastmod>${item.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
        )
        .join("\n");

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <url>
    <loc>${CANONICAL_ORIGIN}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${CANONICAL_ORIGIN}/background-remover</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${CANONICAL_ORIGIN}/image-upscaler</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${CANONICAL_ORIGIN}/pod-background-remover</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${CANONICAL_ORIGIN}/bulk-background-remover</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>${CANONICAL_ORIGIN}/remove-white-background</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>${CANONICAL_ORIGIN}/transparent-png-maker</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>${CANONICAL_ORIGIN}/pricing</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${CANONICAL_ORIGIN}/compare</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${CANONICAL_ORIGIN}/blog</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${CANONICAL_ORIGIN}/sitemap</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${CANONICAL_ORIGIN}/privacy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${CANONICAL_ORIGIN}/terms</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${CANONICAL_ORIGIN}/refund</loc>
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
          "x-robots-tag": "noindex, follow",
          "cache-control": "public, max-age=3600, s-maxage=86400"
        }
      });
    }

    // 5. Homepage Markdown (/index.md or Accept: text/markdown on /)
    if (pathname === "/index.md" || (pathname === "/" && wantMd)) {
      const mdReq = new Request(new URL("/index.md", request.url), request);
      const mdAsset = await env.ASSETS.fetch(mdReq);
      if (mdAsset.ok) {
        return markdownResponse(await mdAsset.text());
      }
      const indexReq = new Request(new URL("/", request.url), request);
      const htmlRes = await env.ASSETS.fetch(indexReq);
      return markdownResponse(htmlToMarkdown(await htmlRes.text()));
    }

    // 5b. Dedicated /pricing Landing Page (and /pricing.md)
    if (pathname === "/pricing" || pathname === "/pricing.md") {
      const pricingTitle = "PixelIsolate Pricing — AI Background Remover & 8K Upscaler Plans";
      const pricingDesc = "Compare PixelIsolate plans: 10 free credits with no card, $5 non-expiring 100-credit bundles, and $7.99/mo Pro for unlimited 4K/8K upscaling & bulk queues.";
      const pricingUrl = `${CANONICAL_ORIGIN}/pricing`;

      if (pathname === "/pricing.md" || wantMd) {
        const md = `# Simple, Transparent Pricing for AI Image Processing\n\n> ${pricingDesc}\n\n## Plans\n\n### Free Tier — $0\n- 10 free credits on signup (no credit card required)\n- 3 HD trial exports & 1 solid backdrop trial\n- 100% on-device WebAssembly privacy\n\n### 100 Credit Bundle — $5 one-time\n- 100 non-expiring credits ($0.05/image)\n- Full HD / native resolution transparent PNG exports\n- Commercial rights for Etsy, Amazon & Shopify\n\n### Pro Tier — $7.99 / month\n- Unlimited background isolations & HD/4K/8K exports\n- 4K & 8K Real-ESRGAN AI Image Upscaler (300 DPI)\n- 50+ file parallel bulk queue & ZIP export\n- Unlimited solid backdrops (#FFFFFF, #000000, custom hex)\n- Encrypted cloud History Gallery\n\n## Canonical URL\n- [PixelIsolate Pricing](${pricingUrl})\n`;
        return markdownResponse(md);
      }

      try {
        const indexReq = new Request(new URL("/", request.url), request);
        const assetRes = await env.ASSETS.fetch(indexReq);
        let html = await assetRes.text();

        const pricingSchema = {
          "@context": "https://schema.org",
          "@graph": [
            ORG_SCHEMA,
            buildBreadcrumbSchema([
              { name: "Home", url: `${CANONICAL_ORIGIN}/` },
              { name: "Pricing", url: pricingUrl }
            ]),
            {
              "@type": "Product",
              "name": "PixelIsolate Free Tier",
              "description": "10 free credits, 3 HD trial exports, 1 solid backdrop trial, no credit card required.",
              "brand": { "@id": `${CANONICAL_ORIGIN}/#organization` },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "url": pricingUrl
              }
            },
            {
              "@type": "Product",
              "name": "PixelIsolate 100 Credit Bundle",
              "description": "100 non-expiring pay-as-you-go credits for full HD transparent PNG background removal exports.",
              "brand": { "@id": `${CANONICAL_ORIGIN}/#organization` },
              "offers": {
                "@type": "Offer",
                "price": "5.00",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "url": pricingUrl
              }
            },
            {
              "@type": "Product",
              "name": "PixelIsolate Pro Tier",
              "description": "Unlimited background isolations, 4K & 8K AI Image Upscaler, 50+ bulk batch processing, custom solid backdrops, and encrypted cloud gallery.",
              "brand": { "@id": `${CANONICAL_ORIGIN}/#organization` },
              "offers": {
                "@type": "Offer",
                "price": "7.99",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "url": pricingUrl
              }
            }
          ]
        };

        const pricingRootHtml = `
          <header class="p-4 border-b border-white/10 bg-[#030712] text-white">
            <nav class="max-w-6xl mx-auto flex justify-between items-center flex-wrap gap-4">
              <a href="https://pixelisolate.online/" class="text-white font-bold no-underline">Pixel Isolate Engine</a>
              <div class="flex gap-4 text-sm flex-wrap">
                <a href="https://pixelisolate.online/background-remover" class="seo-footer-link">Background Remover</a>
                <a href="https://pixelisolate.online/image-upscaler" class="seo-footer-link">8K Upscaler</a>
                <a href="https://pixelisolate.online/pricing" class="text-emerald-400 font-semibold">Pricing</a>
                <a href="https://pixelisolate.online/compare" class="seo-footer-link">Compare</a>
                <a href="https://pixelisolate.online/blog" class="seo-footer-link">Blog</a>
              </div>
            </nav>
          </header>
          <main class="seo-static-wrapper">
            <nav class="text-xs text-gray-400 mb-6 flex gap-2 items-center font-mono" aria-label="Breadcrumb">
              <a href="https://pixelisolate.online/" class="hover:text-emerald-400">Home</a>
              <span>›</span>
              <span class="text-emerald-400">Pricing</span>
            </nav>
            <section class="text-center mb-12">
              <h1 class="seo-static-h1">Simple, Transparent Pricing for AI Image Processing</h1>
              <p class="seo-static-p max-w-3xl mx-auto">${escapeHtml(pricingDesc)}</p>
            </section>
            <section class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div class="p-6 rounded-2xl border border-gray-800 bg-gray-900/60">
                <h2 class="text-xl font-bold text-white mb-2">Free Tier — $0</h2>
                <p class="text-sm text-gray-400 mb-4">10 free credits, 3 HD trial exports, 1 solid backdrop trial, no credit card required.</p>
                <a href="https://pixelisolate.online/background-remover" class="text-emerald-400 font-semibold">Start Free →</a>
              </div>
              <div class="p-6 rounded-2xl border border-gray-800 bg-gray-900/60">
                <h2 class="text-xl font-bold text-white mb-2">100 Credit Bundle — $5 one-time</h2>
                <p class="text-sm text-gray-400 mb-4">Non-expiring credit top-ups for full-resolution transparent PNG exports. Powered by Paddle.</p>
                <a href="https://pixelisolate.online/pricing" class="text-emerald-400 font-semibold">Buy 100 Credits →</a>
              </div>
              <div class="p-6 rounded-2xl border border-emerald-500/40 bg-gray-900/80">
                <h2 class="text-xl font-bold text-white mb-2">Pro Tier — $7.99/month</h2>
                <p class="text-sm text-gray-400 mb-4">Unlimited background removals, 4K &amp; 8K AI Image Upscaler, 50+ bulk batch queue, custom hex backdrops, and encrypted cloud gallery.</p>
                <a href="https://pixelisolate.online/pricing" class="text-emerald-400 font-semibold">Upgrade to Pro →</a>
              </div>
            </section>
            <section class="mb-10">
              <h2 class="seo-static-h2">Pricing &amp; Billing FAQ</h2>
              <p class="seo-static-p"><strong>Do credits expire?</strong> No, 100 Credit Bundle top-ups never expire.</p>
              <p class="seo-static-p"><strong>Can I cancel or get a refund?</strong> Cancel Pro anytime with one click, backed by our 14-day refund policy through Paddle.</p>
            </section>
          </main>
          <footer class="seo-footer">
            <div class="flex justify-center flex-wrap gap-5 mb-3">
              <a href="https://pixelisolate.online/" class="seo-footer-link">Home</a>
              <a href="https://pixelisolate.online/background-remover" class="seo-footer-link">Background Remover</a>
              <a href="https://pixelisolate.online/image-upscaler" class="seo-footer-link">8K Upscaler</a>
              <a href="https://pixelisolate.online/pricing" class="seo-footer-link">Pricing</a>
              <a href="https://pixelisolate.online/compare" class="seo-footer-link">Compare</a>
              <a href="https://pixelisolate.online/blog" class="seo-footer-link">Blog</a>
              <a href="https://pixelisolate.online/privacy" class="seo-footer-link">Privacy Policy</a>
              <a href="https://pixelisolate.online/terms" class="seo-footer-link">Terms of Service</a>
              <a href="https://pixelisolate.online/refund" class="seo-footer-link">Refund Policy</a>
            </div>
            <p>© 2026 Pixel Isolate Engine. Subpixel WebAssembly background removal workspace.</p>
          </footer>
        `;

        html = applyPageMeta(html, {
          title: pricingTitle,
          desc: pricingDesc,
          pageUrl: pricingUrl,
          mdHref: "/pricing.md",
          schemaObj: pricingSchema
        });
        html = html.replace(/<div id="root">[\s\S]*?<\/div>\s*<\/body>/i, `<div id="root">\n${pricingRootHtml}\n</div>\n</body>`);

        return new Response(html, {
          status: 200,
          headers: {
            "content-type": "text/html; charset=UTF-8",
            "vary": "Accept",
            "x-robots-tag": "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
            "cache-control": "public, max-age=3600, s-maxage=86400"
          }
        });
      } catch (err) {
        console.warn("Pricing route handler notice:", err);
      }
    }

    // 5c. Dedicated /compare Landing Page (and /compare.md)
    if (pathname === "/compare" || pathname === "/compare.md") {
      const compareTitle = "PixelIsolate vs remove.bg, Adobe Express & Canva | Compare";
      const compareDesc = "Compare PixelIsolate vs remove.bg, Adobe Express, and Canva on price, local WebAssembly privacy, alpha preservation, bulk queues, and 8K POD upscaling.";
      const compareUrl = `${CANONICAL_ORIGIN}/compare`;

      if (pathname === "/compare.md" || wantMd) {
        const md = `# PixelIsolate vs remove.bg vs Adobe Express vs Canva\n\n> ${compareDesc}\n\n- **Price**: PixelIsolate starts at $5 one-time (100 non-expiring credits) or $7.99/mo unlimited Pro vs remove.bg ($9/mo for 40 credits), Adobe Express ($9.99/mo), and Canva Pro ($15/mo).\n- **Local Privacy**: PixelIsolate runs on-device via WebAssembly/WebGPU; competitors require cloud uploads.\n- **POD & 8K Upscaling**: PixelIsolate includes tunable halo erosion sliders and 8K Real-ESRGAN upscaling with 32-bit RGBA alpha preservation.\n\n## Links\n- [AI Background Remover](${CANONICAL_ORIGIN}/background-remover)\n- [8K AI Image Upscaler](${CANONICAL_ORIGIN}/image-upscaler)\n- [Pricing](${CANONICAL_ORIGIN}/pricing)\n`;
        return markdownResponse(md);
      }

      try {
        const indexReq = new Request(new URL("/", request.url), request);
        const assetRes = await env.ASSETS.fetch(indexReq);
        let html = await assetRes.text();

        const compareSchema = {
          "@context": "https://schema.org",
          "@graph": [
            ORG_SCHEMA,
            buildBreadcrumbSchema([
              { name: "Home", url: `${CANONICAL_ORIGIN}/` },
              { name: "Compare", url: compareUrl }
            ]),
            {
              "@type": "WebPage",
              "@id": `${compareUrl}#webpage`,
              "name": compareTitle,
              "url": compareUrl,
              "description": compareDesc,
              "publisher": { "@id": `${CANONICAL_ORIGIN}/#organization` }
            }
          ]
        };

        const compareRootHtml = `
          <header class="p-4 border-b border-white/10 bg-[#030712] text-white">
            <nav class="max-w-6xl mx-auto flex justify-between items-center flex-wrap gap-4">
              <a href="https://pixelisolate.online/" class="text-white font-bold no-underline">Pixel Isolate Engine</a>
              <div class="flex gap-4 text-sm flex-wrap">
                <a href="https://pixelisolate.online/background-remover" class="seo-footer-link">Background Remover</a>
                <a href="https://pixelisolate.online/image-upscaler" class="seo-footer-link">8K Upscaler</a>
                <a href="https://pixelisolate.online/pricing" class="seo-footer-link">Pricing</a>
                <a href="https://pixelisolate.online/compare" class="text-emerald-400 font-semibold">Compare</a>
                <a href="https://pixelisolate.online/blog" class="seo-footer-link">Blog</a>
              </div>
            </nav>
          </header>
          <main class="seo-static-wrapper">
            <nav class="text-xs text-gray-400 mb-6 flex gap-2 items-center font-mono" aria-label="Breadcrumb">
              <a href="https://pixelisolate.online/" class="hover:text-emerald-400">Home</a>
              <span>›</span>
              <span class="text-emerald-400">Compare Alternatives</span>
            </nav>
            <section class="text-center mb-12">
              <h1 class="seo-static-h1">PixelIsolate vs remove.bg vs Adobe Express vs Canva</h1>
              <p class="seo-static-p max-w-3xl mx-auto">${escapeHtml(compareDesc)}</p>
            </section>
            <section class="mb-10">
              <h2 class="seo-static-h2">Side-by-Side Feature &amp; Pricing Comparison</h2>
              <p class="seo-static-p">PixelIsolate combines on-device WebAssembly AI background removal, tunable morphological white-halo erosion for dark DTG/DTF shirts, 50+ file bulk queues, and 8K Real-ESRGAN upscaling for $5 one-time (100 credits) or $7.99/mo unlimited Pro — compared to cloud-only per-credit subscriptions on remove.bg, Adobe Express, and Canva Pro.</p>
              <div class="flex gap-4 mt-6">
                <a href="https://pixelisolate.online/background-remover" class="text-emerald-400 font-semibold">Try Background Remover Free →</a>
                <a href="https://pixelisolate.online/pricing" class="text-emerald-400 font-semibold">View Pricing Plans →</a>
              </div>
            </section>
          </main>
          <footer class="seo-footer">
            <div class="flex justify-center flex-wrap gap-5 mb-3">
              <a href="https://pixelisolate.online/" class="seo-footer-link">Home</a>
              <a href="https://pixelisolate.online/background-remover" class="seo-footer-link">Background Remover</a>
              <a href="https://pixelisolate.online/image-upscaler" class="seo-footer-link">8K Upscaler</a>
              <a href="https://pixelisolate.online/pricing" class="seo-footer-link">Pricing</a>
              <a href="https://pixelisolate.online/compare" class="seo-footer-link">Compare</a>
              <a href="https://pixelisolate.online/blog" class="seo-footer-link">Blog</a>
            </div>
            <p>© 2026 Pixel Isolate Engine. Subpixel WebAssembly background removal workspace.</p>
          </footer>
        `;

        html = applyPageMeta(html, {
          title: compareTitle,
          desc: compareDesc,
          pageUrl: compareUrl,
          mdHref: "/compare.md",
          schemaObj: compareSchema
        });
        html = html.replace(/<div id="root">[\s\S]*?<\/div>\s*<\/body>/i, `<div id="root">\n${compareRootHtml}\n</div>\n</body>`);

        return new Response(html, {
          status: 200,
          headers: {
            "content-type": "text/html; charset=UTF-8",
            "vary": "Accept",
            "x-robots-tag": "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
            "cache-control": "public, max-age=3600, s-maxage=86400"
          }
        });
      } catch (err) {
        console.warn("Compare route handler notice:", err);
      }
    }

    // 6. Specialized Search Intent Landing Routes (Unique H1, Unique Content, Self-Canonical, Self-Hreflang, Unique Schema, .md support)
    const intentTarget = pathname.endsWith(".md") ? pathname.slice(0, -3) : pathname;
    if (INTENT_ROUTES[intentTarget]) {
      const meta = INTENT_ROUTES[intentTarget];
      if (pathname.endsWith(".md") || wantMd) {
        return markdownResponse(renderIntentMarkdown(intentTarget, meta));
      }

      try {
        const pageUrl = `${CANONICAL_ORIGIN}${intentTarget}`;
        const indexReq = new Request(new URL("/", request.url), request);
        const assetRes = await env.ASSETS.fetch(indexReq);
        let html = await assetRes.text();

        const intentSchema = {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebApplication",
              "@id": `${pageUrl}#software`,
              "name": meta.h1,
              "url": pageUrl,
              "applicationCategory": "DesignApplication",
              "operatingSystem": "All",
              "description": meta.desc,
              "offers": {
                "@type": "AggregateOffer",
                "lowPrice": "0",
                "highPrice": "7.99",
                "priceCurrency": "USD",
                "offerCount": "3",
                "url": `${CANONICAL_ORIGIN}/pricing`
              },
              "publisher": { "@id": `${CANONICAL_ORIGIN}/#organization` }
            },
            ORG_SCHEMA,
            buildBreadcrumbSchema([
              { name: "Home", url: `${CANONICAL_ORIGIN}/` },
              { name: meta.h1, url: pageUrl }
            ])
          ]
        };

        html = applyPageMeta(html, {
          title: meta.title,
          desc: meta.desc,
          pageUrl,
          mdHref: `${intentTarget}.md`,
          schemaObj: intentSchema
        });
        html = html.replace(
          /<div id="root">[\s\S]*?<\/div>\s*<\/body>/i,
          `<div id="root">\n${renderIntentRootHtml(intentTarget, meta)}\n</div>\n</body>`
        );

        return new Response(html, {
          status: 200,
          headers: {
            "content-type": "text/html; charset=UTF-8",
            "vary": "Accept",
            "x-robots-tag": "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
            "cache-control": "public, max-age=3600, s-maxage=86400"
          }
        });
      } catch (err) {
        console.warn("Intent route handler notice:", err);
      }
    }

    // 7. Static HTML Pages with Markdown Content Negotiation (/privacy, /terms, /refund, /sitemap and *.md)
    const staticCleanTargets = new Set(["/privacy", "/terms", "/refund", "/sitemap"]);
    const staticBase = pathname.endsWith(".md") ? pathname.slice(0, -3) : pathname;
    if (staticCleanTargets.has(staticBase) && (pathname.endsWith(".md") || wantMd)) {
      const assetReq = new Request(new URL(staticBase, request.url), request);
      const assetRes = await env.ASSETS.fetch(assetReq);
      if (assetRes.ok) {
        return markdownResponse(htmlToMarkdown(await assetRes.text()));
      }
    }

    // 8. Intercept /blog Directory (and /blog.md)
    if (pathname === "/blog" || pathname === "/blog.md") {
      try {
        let posts = [];
        try {
          const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/posts?is_published=eq.true&select=slug,title,excerpt,cover_image,category,reading_time_minutes,published_at&order=published_at.desc`, {
            headers: {
              "apikey": SUPABASE_ANON_KEY,
              "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
            }
          });
          if (dbRes.ok) {
            posts = await dbRes.json();
          }
        } catch (e) {
          console.warn("Blog list DB error:", e);
        }

        const blogTitle = "Pixel Isolate Blog: Print-on-Demand & AI Design Guides";
        const blogDesc = "Expert tutorials on background removal, subpixel chroma keying, eliminating white print halos, and scaling e-commerce photography.";
        const blogUrl = `${CANONICAL_ORIGIN}/blog`;

        if (pathname === "/blog.md" || wantMd) {
          const listMd = (posts || [])
            .map((p) => {
              const cleanS = stripBlogSlugHash(p.slug);
              return `- [${p.title}](${CANONICAL_ORIGIN}/blog/${cleanS}) ([Markdown](${CANONICAL_ORIGIN}/blog/${cleanS}.md)) — ${p.excerpt || ""}`;
            })
            .join("\n");
          const md = `# Print-on-Demand & AI Design Guides\n\n> ${blogDesc}\n\n## Articles\n\n${listMd}\n`;
          return markdownResponse(md, "public, max-age=300, s-maxage=3600");
        }

        const indexReq = new Request(new URL("/", request.url), request);
        const assetRes = await env.ASSETS.fetch(indexReq);
        let html = await assetRes.text();

        const blogCardsHtml = (posts || [])
          .map((p) => {
            const cleanS = stripBlogSlugHash(p.slug);
            const pubDate = new Date(p.published_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
            const coverHtml =
              p.cover_image && p.cover_image.startsWith("http")
                ? `<div class="h-44 w-full overflow-hidden bg-gray-900"><img src="${escapeAttr(p.cover_image)}" alt="${escapeAttr(p.title)}" class="w-full h-full object-cover transition-transform duration-300 hover:scale-105" loading="lazy" /></div>`
                : "";

            return `
            <article class="flex flex-col bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden hover:border-emerald-500/50 transition">
              ${coverHtml}
              <div class="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between text-xs text-emerald-400 font-mono mb-2">
                    <span class="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">${escapeHtml(p.category || "Tutorials")}</span>
                    <span>${p.reading_time_minutes || 5} min read</span>
                  </div>
                  <h2 class="text-lg font-bold text-white mb-2 leading-snug hover:text-emerald-400 transition">
                    <a href="/blog/${cleanS}">${escapeHtml(p.title)}</a>
                  </h2>
                  <p class="text-sm text-gray-400 line-clamp-3 mb-4 leading-relaxed">${escapeHtml(p.excerpt || "")}</p>
                </div>
                <div class="pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-500 font-mono">
                  <span>${pubDate}</span>
                  <a href="/blog/${cleanS}" class="text-emerald-400 hover:underline font-semibold">Read Guide →</a>
                </div>
              </div>
            </article>
          `;
          })
          .join("\n");

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

        const blogIndexSchema = {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Blog",
              "@id": `${blogUrl}#blog`,
              "name": blogTitle,
              "description": blogDesc,
              "url": blogUrl,
              "publisher": { "@id": `${CANONICAL_ORIGIN}/#organization` }
            },
            ORG_SCHEMA,
            buildBreadcrumbSchema([
              { name: "Home", url: `${CANONICAL_ORIGIN}/` },
              { name: "Blog", url: blogUrl }
            ])
          ]
        };

        html = applyPageMeta(html, {
          title: blogTitle,
          desc: blogDesc,
          pageUrl: blogUrl,
          mdHref: "/blog.md",
          schemaObj: blogIndexSchema
        });
        html = html.replace(/<div id="root">[\s\S]*?<\/div>\s*<\/body>/i, `<div id="root">\n${blogRootContent}\n</div>\n</body>`);

        return new Response(html, {
          status: 200,
          headers: {
            "content-type": "text/html; charset=UTF-8",
            "vary": "Accept",
            "x-robots-tag": "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
            "cache-control": "public, max-age=300, s-maxage=3600"
          }
        });
      } catch (e) {
        console.error("Cloudflare Worker Blog Index SSR error:", e);
      }
    }

    // 9. Intercept /blog/:slug (and /blog/:slug.md)
    if (pathname.startsWith("/blog/")) {
      const isMdSlug = pathname.endsWith(".md");
      const rawSlug = pathname.slice("/blog/".length).replace(/\.md$/i, "").replace(/\/$/, "").trim();
      const cleanSlug = rawSlug.toLowerCase();

      try {
        let post = null;

        if (cleanSlug) {
          const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/posts?slug=eq.${encodeURIComponent(cleanSlug)}&is_published=eq.true&select=*`, {
            headers: {
              "apikey": SUPABASE_ANON_KEY,
              "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
            }
          });

          if (dbRes.ok) {
            const posts = await dbRes.json();
            if (posts && posts.length > 0) {
              post = posts[0];
            }
          }

          // If visitor hit a legacy hash-suffixed URL, 301 redirect to the clean canonical slug
          if (post && !isMdSlug) {
            const stripped = stripBlogSlugHash(post.slug);
            if (stripped && stripped !== cleanSlug) {
              return Response.redirect(`${CANONICAL_ORIGIN}/blog/${stripped}${url.search}`, 301);
            }
          }

          // If visitor hit a clean URL whose DB row still carries a legacy 5-char hash suffix, resolve it
          if (!post) {
            const likeRes = await fetch(`${SUPABASE_URL}/rest/v1/posts?slug=ilike.${encodeURIComponent(cleanSlug + "-*")}&is_published=eq.true&select=*&limit=10`, {
              headers: {
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
              }
            });
            if (likeRes.ok) {
              const candidates = await likeRes.json();
              if (Array.isArray(candidates) && candidates.length > 0) {
                post = candidates.find((c) => stripBlogSlugHash(c.slug) === cleanSlug) || candidates[0];
              }
            }
          }
        }

        if (!post) {
          return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>404 - Article Not Found | Pixel Isolate</title>
  <meta name="robots" content="noindex, follow">
  <link rel="icon" type="image/png" href="/favicon.png">
  <style>
    body { background: #07090e; color: #f3f4f6; font-family: ui-sans-serif, system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; text-align: center; margin: 0; padding: 20px; }
    h1 { font-size: 3.5rem; margin-bottom: 8px; color: #ef4444; font-weight: 800; }
    h2 { font-size: 1.5rem; margin-bottom: 12px; }
    p { font-size: 1rem; color: #9ca3af; margin-bottom: 24px; max-width: 480px; }
    a { display: inline-block; background: #10b981; color: #030712; padding: 10px 22px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 0.95rem; }
    a:hover { background: #34d399; }
  </style>
</head>
<body>
  <h1>404</h1>
  <h2>Article Not Found</h2>
  <p>The requested blog article does not exist or has been moved.</p>
  <a href="/blog">Browse All Articles →</a>
</body>
</html>`, {
            status: 404,
            headers: {
              "content-type": "text/html; charset=UTF-8",
              "x-robots-tag": "noindex, follow"
            }
          });
        }

        if (isMdSlug || wantMd) {
          const md = `# ${post.title}\n\n*By ${post.author_name || "Mohamed Elborgy"} • ${post.category || "Tutorials"}*\n\n> ${post.excerpt || ""}\n\n${post.content || ""}\n`;
          return markdownResponse(md, "public, max-age=300, s-maxage=3600");
        }

        const indexReq = new Request(new URL("/", request.url), request);
        const assetRes = await env.ASSETS.fetch(indexReq);
        let html = await assetRes.text();

        const canonicalSlug = stripBlogSlugHash(post.slug);
        const title = clampMetaTitle(post.meta_title, post.title);
        const desc = clampMetaDescription(post.meta_description, post.excerpt);
        const pageUrl = `${CANONICAL_ORIGIN}/blog/${canonicalSlug}`;
        const imageUrl =
          post.cover_image && post.cover_image.startsWith("http")
            ? post.cover_image
            : `${CANONICAL_ORIGIN}/logo.png`;
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

        const coverImgTag =
          post.cover_image && post.cover_image.startsWith("http")
            ? `<div class="mb-8 rounded-xl overflow-hidden border border-gray-800 bg-gray-900 max-h-[500px]">
              <img src="${escapeAttr(post.cover_image)}" alt="${escapeAttr(post.title)}" class="w-full h-full object-cover" />
            </div>`
            : "";

        // Fetch up to 4 related posts for internal linking in static SSR HTML
        let relatedHtml = "";
        try {
          const relRes = await fetch(`${SUPABASE_URL}/rest/v1/posts?is_published=eq.true&select=slug,title,category&order=published_at.desc&limit=8`, {
            headers: {
              "apikey": SUPABASE_ANON_KEY,
              "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
            }
          });
          if (relRes.ok) {
            const relPosts = (await relRes.json()).filter((r) => stripBlogSlugHash(r.slug) !== canonicalSlug).slice(0, 4);
            if (relPosts.length > 0) {
              relatedHtml = `
                <aside class="mt-10 p-6 rounded-2xl bg-gray-900/50 border border-gray-800">
                  <h2 class="text-lg font-bold text-white mb-4">Related Guides &amp; Tools</h2>
                  <ul class="space-y-2 text-sm">
                    ${relPosts.map((r) => `<li><a href="/blog/${stripBlogSlugHash(r.slug)}" class="text-emerald-400 hover:underline">${escapeHtml(r.title)}</a></li>`).join("\n")}
                  </ul>
                  <div class="mt-4 pt-4 border-t border-gray-800 flex flex-wrap gap-4 text-xs font-mono">
                    <a href="/background-remover?source=organic" class="text-emerald-400 hover:underline">AI Background Remover →</a>
                    <a href="/image-upscaler?source=organic" class="text-emerald-400 hover:underline">8K AI Image Upscaler →</a>
                    <a href="/pricing?source=organic" class="text-emerald-400 hover:underline">Pricing &amp; Plans →</a>
                  </div>
                </aside>
              `;
            }
          }
        } catch {}

        const primaryToolHref = topic === "upscaler" ? "/image-upscaler?source=organic&amp;utm_campaign=blog_cta" : "/background-remover?source=organic&amp;utm_campaign=blog_cta";
        const primaryToolLabel = topic === "upscaler" ? "Try 8K Upscaler Free ↗" : "Try Background Remover Free ↗";

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
              <span class="text-emerald-400 truncate max-w-xs">${escapeHtml(post.title)}</span>
            </nav>

            <article class="prose prose-invert max-w-none">
              <header class="mb-8">
                <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4 font-mono">
                  ${escapeHtml(post.category || "Tutorials")}
                </span>
                <h1 class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
                  ${escapeHtml(post.title)}
                </h1>
                <div class="flex items-center gap-4 text-xs text-gray-400 border-b border-gray-800 pb-4 font-mono">
                  <span class="text-gray-300 font-semibold">By ${escapeHtml(post.author_name || "Mohamed Elborgy")}</span>
                  <span>•</span>
                  <time datetime="${isoDate}">${pubDate}</time>
                  <span>•</span>
                  <span>${post.reading_time_minutes || 5} min read</span>
                </div>
              </header>

              <div class="article-lead text-base sm:text-lg text-gray-300 font-medium mb-8 leading-relaxed">
                ${escapeHtml(post.excerpt || "")}
              </div>

              ${coverImgTag}

              <div class="article-body">
                ${articleBodyHtml}
              </div>

              <div class="mt-14 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-gray-900 to-gray-900 border border-emerald-500/30 text-center">
                <h3 class="text-xl sm:text-2xl font-bold text-white mb-2">Start With 10 Free Credits — No Credit Card Required</h3>
                <p class="text-sm text-gray-300 mb-6 max-w-xl mx-auto leading-relaxed">
                  Create subpixel zero-halo transparent PNGs and upscale images to 8K 300 DPI print resolution directly inside your browser.
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
                "@id": `${CANONICAL_ORIGIN}/#organization`,
                "name": "Pixel Isolate Engine Inc.",
                "logo": {
                  "@type": "ImageObject",
                  "url": `${CANONICAL_ORIGIN}/logo.png`
                }
              },
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": pageUrl
              }
            },
            buildBreadcrumbSchema([
              { name: "Home", url: `${CANONICAL_ORIGIN}/` },
              { name: "Blog", url: `${CANONICAL_ORIGIN}/blog` },
              { name: post.title, url: pageUrl }
            ])
          ]
        };

        html = applyPageMeta(html, {
          title,
          desc,
          pageUrl,
          mdHref: `/blog/${canonicalSlug}.md`,
          ogType: "article",
          imageUrl,
          schemaObj: articleSchema
        });
        html = html.replace(/<div id="root">[\s\S]*?<\/div>\s*<\/body>/i, `<div id="root">\n${articleRootContent}\n</div>\n</body>`);

        return new Response(html, {
          status: 200,
          headers: {
            "content-type": "text/html; charset=UTF-8",
            "vary": "Accept",
            "x-robots-tag": "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
            "cache-control": "public, max-age=300, s-maxage=3600"
          }
        });
      } catch (e) {
        console.error("Cloudflare Worker Blog Detail SSR error:", e);
      }
    }

    // Default static asset fetch for all other routes
    const response = await env.ASSETS.fetch(request);

    if (response.status === 404) {
      const isStaticAsset = pathname.startsWith("/assets/") || /\.(js|css|wasm|png|jpg|jpeg|svg|ico|json|woff2?|md|txt|xml)$/i.test(pathname);
      if (isStaticAsset) {
        return response;
      }

      const indexReq = new Request(new URL("/", request.url), request);
      const indexRes = await env.ASSETS.fetch(indexReq);
      return new Response(indexRes.body, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=UTF-8",
          "vary": "Accept",
          "x-robots-tag": "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        }
      });
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      return withVaryAccept(response);
    }

    return response;
  }
};
