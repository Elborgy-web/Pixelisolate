import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function adjustUserProfile() {
  const email = "ideoborgy1@gmail.com";
  console.log(`Connecting to Supabase and finding user profile for: ${email}...`);

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update({ 
      is_pro: false, 
      credits: 100, 
      updated_at: new Date().toISOString() 
    })
    .eq("email", email)
    .select();

  if (error) {
    console.error(`❌ Failed to update profile for ${email}:`, error.message);
  } else if (data && data.length > 0) {
    console.log(`✅ Successfully updated profile for ${email}:`, data[0]);
  } else {
    console.log(`ℹ️ Profile record for ${email} not found in 'profiles' table.`);
  }
}

adjustUserProfile();
