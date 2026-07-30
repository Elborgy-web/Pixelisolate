import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function injectSeed() {
  const { data: posts, error } = await supabaseAdmin
    .from("posts")
    .select("*")
    .order("published_at", { ascending: false });

  if (error || !posts) {
    console.error("Failed to fetch posts from Supabase:", error);
    return;
  }

  let blogTs = fs.readFileSync("src/lib/blog.ts", "utf-8");

  // Replace INITIAL_SEED_POSTS definition with real published posts
  const seedString = `export const INITIAL_SEED_POSTS: BlogPost[] = ${JSON.stringify(posts, null, 2)};`;

  // Find start and end of INITIAL_SEED_POSTS in src/lib/blog.ts
  const regex = /export const INITIAL_SEED_POSTS:\s*BlogPost\[\]\s*=\s*\[[\s\S]*?\];/;
  if (regex.test(blogTs)) {
    blogTs = blogTs.replace(regex, seedString);
    fs.writeFileSync("src/lib/blog.ts", blogTs);
    console.log(`Successfully injected ${posts.length} seed posts into src/lib/blog.ts!`);
  } else {
    console.error("Could not locate INITIAL_SEED_POSTS regex in src/lib/blog.ts");
  }
}

injectSeed();
