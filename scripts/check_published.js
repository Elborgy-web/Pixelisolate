import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function checkPublished() {
  const { data, error } = await supabaseAdmin.from("posts").select("id, title, slug, is_published, created_at");
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Posts in Supabase DB:");
    data.forEach(p => {
      console.log(`- [${p.is_published ? 'PUBLISHED' : 'DRAFT/UNPUBLISHED'}] ID: ${p.id} | Title: "${p.title}"`);
    });
  }
}

checkPublished();
