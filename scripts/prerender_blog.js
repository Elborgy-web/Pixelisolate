import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

// Dynamic posts to pre-render static HTML pages (cleared hardcoded seeds)
const SEED_POSTS = [];

function prerender() {
  console.log("[Prerender] Starting static HTML generation for Blog routes...");
  const baseIndexPath = path.join(distDir, "index.html");

  if (!fs.existsSync(baseIndexPath)) {
    console.error("[Prerender] Error: dist/index.html does not exist. Run vite build first.");
    process.exit(1);
  }

  const baseHtml = fs.readFileSync(baseIndexPath, "utf8");

  // 1. Pre-render /blog index page
  const blogDir = path.join(distDir, "blog");
  if (!fs.existsSync(blogDir)) fs.mkdirSync(blogDir, { recursive: true });

  const blogTitle = "PixelIsolate Blog: Print-on-Demand & AI Design Guides";
  const blogDesc = "Expert tutorials on background removal, subpixel chroma keying, eliminating white print halos, and scaling e-commerce photography.";
  const blogUrl = "https://pixelisolate.online/blog";
  const blogImage = "https://pixelisolate.online/logo.png";

  let blogHtml = baseHtml
    .replace(/<title>.*?<\/title>/gi, `<title>${blogTitle}</title>`)
    .replace(/<meta name="description" content=".*?" \/>/gi, `<meta name="description" content="${blogDesc}" />`)
    .replace(/<meta property="og:title" content=".*?" \/>/gi, `<meta property="og:title" content="${blogTitle}" />`)
    .replace(/<meta property="og:description" content=".*?" \/>/gi, `<meta property="og:description" content="${blogDesc}" />`)
    .replace(/<meta property="og:image" content=".*?" \/>/gi, `<meta property="og:image" content="${blogImage}" />`)
    .replace(/<meta property="og:url" content=".*?" \/>/gi, `<meta property="og:url" content="${blogUrl}" />`)
    .replace(/<meta property="twitter:title" content=".*?" \/>/gi, `<meta property="twitter:title" content="${blogTitle}" />`)
    .replace(/<meta property="twitter:description" content=".*?" \/>/gi, `<meta property="twitter:description" content="${blogDesc}" />`)
    .replace(/<meta property="twitter:image" content=".*?" \/>/gi, `<meta property="twitter:image" content="${blogImage}" />`);

  fs.writeFileSync(path.join(blogDir, "index.html"), blogHtml, "utf8");
  console.log(`[Prerender] Generated static HTML for: /blog`);

  // 2. Pre-render each article slug page
  for (const post of SEED_POSTS) {
    const postDir = path.join(blogDir, post.slug);
    if (!fs.existsSync(postDir)) fs.mkdirSync(postDir, { recursive: true });

    const title = post.title;
    const desc = post.excerpt;
    const imageUrl = post.cover_image;
    const pageUrl = `https://pixelisolate.online/blog/${post.slug}`;

    let postHtml = baseHtml
      .replace(/<title>.*?<\/title>/gi, `<title>${title}</title>`)
      .replace(/<meta name="description" content=".*?" \/>/gi, `<meta name="description" content="${desc}" />`)
      .replace(/<meta property="og:title" content=".*?" \/>/gi, `<meta property="og:title" content="${title}" />`)
      .replace(/<meta property="og:description" content=".*?" \/>/gi, `<meta property="og:description" content="${desc}" />`)
      .replace(/<meta property="og:image" content=".*?" \/>/gi, `<meta property="og:image" content="${imageUrl}" />`)
      .replace(/<meta property="og:url" content=".*?" \/>/gi, `<meta property="og:url" content="${pageUrl}" />`)
      .replace(/<meta property="twitter:title" content=".*?" \/>/gi, `<meta property="twitter:title" content="${title}" />`)
      .replace(/<meta property="twitter:description" content=".*?" \/>/gi, `<meta property="twitter:description" content="${desc}" />`)
      .replace(/<meta property="twitter:image" content=".*?" \/>/gi, `<meta property="twitter:image" content="${imageUrl}" />`);

    fs.writeFileSync(path.join(postDir, "index.html"), postHtml, "utf8");
    console.log(`[Prerender] Generated static HTML for: /blog/${post.slug}`);
  }

  console.log("[Prerender] All static blog pages generated successfully!");
}

prerender();
