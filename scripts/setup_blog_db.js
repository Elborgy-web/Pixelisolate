import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function checkOrSetupBlog() {
  console.log("Checking Supabase 'posts' table...");
  const { data, error } = await supabase.from("posts").select("id").limit(1);

  if (error) {
    console.log("Posts table check result:", error.message);
  } else {
    console.log("Posts table exists! Found rows:", data.length);
  }
}

checkOrSetupBlog();
