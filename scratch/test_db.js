import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function testColumns() {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Error querying profiles:", error);
  } else {
    console.log("Profiles sample row:", data);
  }
}

testColumns();
