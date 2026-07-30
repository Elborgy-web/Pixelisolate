import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function inspectPosts() {
  console.log("[Posts Inspector] Fetching all posts from Supabase database...");
  const { data, error } = await supabaseAdmin.from("posts").select("*");
  if (error) {
    console.error("Error fetching posts:", error);
  } else {
    console.log(`Total posts in Supabase DB: ${data?.length}`);
    console.log(JSON.stringify(data, null, 2));
  }
}

inspectPosts();
