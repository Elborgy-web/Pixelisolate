import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function checkLatest() {
  console.log("Fetching latest subscriptions...");
  const { data: subs, error } = await supabaseAdmin
    .from("paddle_subscriptions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching subs:", error);
  } else {
    console.log("Latest subscriptions:", subs);
  }

  console.log("Fetching latest profiles updated...");
  const { data: profiles, error: profErr } = await supabaseAdmin
    .from("profiles")
    .select("id, email, is_pro, updated_at")
    .order("updated_at", { ascending: false })
    .limit(5);

  if (profErr) {
    console.error("Error fetching profiles:", profErr);
  } else {
    console.log("Latest profiles:", profiles);
  }
}

checkLatest();
