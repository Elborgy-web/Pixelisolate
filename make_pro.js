import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function elevateToPro() {
  const targetEmails = ["muhammad.elborgy@gmail.com"];

  console.log("Connecting to Supabase Database...");
  
  for (const email of targetEmails) {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({ is_pro: true, updated_at: new Date().toISOString() })
      .eq("email", email)
      .select();

    if (error) {
      console.error(`❌ Failed to update ${email}:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`✅ Successfully set ${email} to Pro Tier:`, data[0]);
    } else {
      console.log(`ℹ️ Account not found in profiles for: ${email} (will elevate automatically when they sign up).`);
    }
  }
}

elevateToPro();
