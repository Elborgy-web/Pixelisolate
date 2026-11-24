import { createClient } from "@supabase/supabase-js";

const HOST = "pixelisolate.online";
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "e9a4c7b2d1f8403a9b6e5c2d8f1a4e7b";
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

const SUPABASE_URL = "https://wnzgwwtidscjwfnapleb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Induemd3d3RpZHNjandmbmFwbGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMzYzODIsImV4cCI6MjEwNjgxMjM4Mn0.c6EmEUjhhv0-aEtS3BRbfqJ_F23CgUIWUu7NOCcHXt8";

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

async function submitIndexNow() {
  const coreUrls = [
    `https://${HOST}/`,
    `https://${HOST}/pricing`,
    `https://${HOST}/compare`,
    `https://${HOST}/background-remover`,
    `https://${HOST}/image-upscaler`,
    `https://${HOST}/pod-background-remover`,
    `https://${HOST}/bulk-background-remover`,
    `https://${HOST}/remove-white-background`,
    `https://${HOST}/transparent-png-maker`,
    `https://${HOST}/how-it-works`,
    `https://${HOST}/blog`,
    `https://${HOST}/sitemap`,
    `https://${HOST}/privacy`,
    `https://${HOST}/terms`,
    `https://${HOST}/refund`,
  ];

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let blogUrls = [];
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("slug")
      .eq("is_published", true);
    if (!error && Array.isArray(data)) {
      blogUrls = data.map((p) => `https://${HOST}/blog/${stripBlogSlugHash(p.slug)}`);
    }
  } catch (err) {
    console.warn("[IndexNow] Could not fetch blog slugs from Supabase:", err.message);
  }

  const urlList = Array.from(new Set([...coreUrls, ...blogUrls]));
  console.log(`[IndexNow] Submitting ${urlList.length} URLs to api.indexnow.org...`);

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: HOST,
      key: INDEXNOW_KEY,
      keyLocation: KEY_LOCATION,
      urlList,
    }),
  });

  console.log(`[IndexNow] Response: HTTP ${res.status} ${res.statusText}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[IndexNow] Error body:", text);
    process.exit(1);
  }
  console.log("[IndexNow] Submission accepted!");
}

submitIndexNow();
