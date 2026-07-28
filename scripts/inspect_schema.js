import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function inspectSchema() {
  const { data, error } = await supabaseAdmin.from("profiles").select("*").limit(1);
  if (error) {
    console.error("Error inspecting profiles table:", error);
  } else {
    console.log("Profiles table sample row / columns:", data);
  }
}

inspectSchema();
