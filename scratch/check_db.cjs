const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing environment variables VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  console.log("Supabase URL:", supabaseUrl);
  
  // 1. Check if column exists by querying profiles table
  console.log("\nChecking profiles table schema...");
  const { data, error } = await supabase.from("profiles").select("*").limit(1);
  if (error) {
    console.error("Error fetching profiles:", error);
  } else {
    console.log("Successfully fetched profile row. Columns available:", Object.keys(data[0] || {}));
  }

  // 2. Try executing RPC function decrement_user_solid_bg_trials
  console.log("\nTesting RPC decrement_user_solid_bg_trials...");
  const testUserId = data[0]?.id;
  if (!testUserId) {
    console.log("No profile row found to test RPC with.");
  } else {
    const { error: rpcError } = await supabase.rpc("decrement_user_solid_bg_trials", {
      user_id: testUserId,
      amount: 0 // Decrement by 0 to check if function exists without modifying count
    });
    if (rpcError) {
      console.error("RPC decrement_user_solid_bg_trials failed:", rpcError.message);
    } else {
      console.log("RPC decrement_user_solid_bg_trials exists and was called successfully!");
    }
  }
}

run();
