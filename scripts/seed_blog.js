import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

// SQL migration script for `posts` table
const createTableSql = `
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_image TEXT,
  author_name VARCHAR(100) DEFAULT 'PixelIsolate Team',
  author_avatar TEXT,
  category VARCHAR(100) DEFAULT 'Tutorials',
  reading_time_minutes INT DEFAULT 5,
  meta_title VARCHAR(255),
  meta_description TEXT,
  is_published BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_published ON public.posts(is_published, published_at DESC);
`;

async function seedData() {
  console.log("Loading seed data from seed_data.json...");
  const seedDataPath = path.join(__dirname, "seed_data.json");
  let rawCode = fs.readFileSync(seedDataPath, "utf8");
  rawCode = rawCode.replace(/export const INITIAL_SEED_POSTS: BlogPost\[\] =/, "");
  if (rawCode.trim().endsWith(";")) rawCode = rawCode.trim().slice(0, -1);
  const seedPosts = JSON.parse(rawCode);

  console.log(`Seeding ${seedPosts.length} blog posts to Supabase...`);
  for (const post of seedPosts) {
    const upsertObj = {
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      cover_image: post.cover_image,
      author_name: post.author_name || "PixelIsolate Engineering",
      author_avatar: post.author_avatar || "https://api.dicebear.com/7.x/identicon/svg?seed=1f817627-549f-4e4a-8aff-348f0b960dc3",
      category: post.category || "Design & Printing",
      reading_time_minutes: post.reading_time_minutes || 5,
      meta_title: post.meta_title || `${post.title} | PixelIsolate Blog`,
      meta_description: post.meta_description || post.excerpt,
      is_published: post.is_published !== false,
      published_at: post.published_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("posts")
      .upsert(upsertObj, { onConflict: "slug" })
      .select();

    if (error) {
      console.error(`Error seeding post '${post.slug}':`, error.message);
    } else {
      console.log(`Successfully seeded post: '${post.title}'`);
    }
  }
  console.log("Blog seeding complete!");
}

seedData();

