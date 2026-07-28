import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function verifyUser() {
  const email = "rjhustles@gmail.com";
  console.log(`[Verification] Checking database records for ${email}...`);

  // 1. Check profiles table by email
  const { data: profileByEmail, error: err1 } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("email", email);

  console.log("1. Profiles table query by email:", profileByEmail, "Error:", err1);

  // 2. Check auth.users table
  const { data: usersData, error: err2 } = await supabaseAdmin.auth.admin.listUsers();
  const authUser = usersData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

  console.log("2. Auth user record:", authUser ? { id: authUser.id, email: authUser.email, created_at: authUser.created_at } : "NOT FOUND");

  if (authUser) {
    // 3. Check profiles table by ID
    const { data: profileById, error: err3 } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", authUser.id);
    console.log("3. Profiles table query by user ID:", profileById, "Error:", err3);
  }
}

verifyUser();
