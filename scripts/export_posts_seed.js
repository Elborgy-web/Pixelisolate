import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function exportSeed() {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("*")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Error:", error);
  } else {
    console.log(`Exported ${data.length} posts for INITIAL_SEED_POSTS.`);
    const content = `export const INITIAL_SEED_POSTS: BlogPost[] = ${JSON.stringify(data, null, 2)};\n`;
    fs.writeFileSync("scripts/seed_data.json", content);
  }
}

exportSeed();
