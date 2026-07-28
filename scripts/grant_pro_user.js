import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file.");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function grantProUser(targetEmail) {
  console.log(`[VIP Provisioner] Checking auth.users for email: ${targetEmail}...`);

  let targetUserId = null;

  try {
    // 1. Search existing users in auth.users
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.warn("[VIP Provisioner] Warning listing users:", listError.message);
    }

    if (usersData && usersData.users) {
      const match = usersData.users.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase());
      if (match) {
        targetUserId = match.id;
        console.log(`[VIP Provisioner] Found existing auth user ID: ${targetUserId}`);
      }
    }

    // 2. If user doesn't exist yet, auto-create auth user so they can log in
    if (!targetUserId) {
      console.log(`[VIP Provisioner] User ${targetEmail} not found in auth.users. Provisioning auth user...`);
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: targetEmail,
        email_confirm: true,
        user_metadata: { role: "admin", is_pro: true }
      });

      if (createError) {
        console.warn("[VIP Provisioner] Notice during auth user creation:", createError.message);
      }
      if (newUser && newUser.user) {
        targetUserId = newUser.user.id;
        console.log(`[VIP Provisioner] Successfully created auth user ID: ${targetUserId}`);
      }
    }

    // 3. Update or upsert profiles table record
    if (targetUserId) {
      const profileData = {
        id: targetUserId,
        email: targetEmail.toLowerCase(),
        is_pro: true,
        credits: 9999,
        hd_credits_remaining: 9999,
        solid_bg_trials_remaining: 9999,
        updated_at: new Date().toISOString()
      };

      const { data: upsertData, error: upsertError } = await supabaseAdmin
        .from("profiles")
        .upsert(profileData, { onConflict: "id" })
        .select();

      if (upsertError) {
        console.error("[VIP Provisioner] Error upserting profile:", upsertError);
      } else {
        console.log("[VIP Provisioner] Successfully granted permanent PRO status & 9999 credits in DB:", upsertData);
      }
    }
  } catch (err) {
    console.error("[VIP Provisioner] Fatal error during VIP provisioning:", err);
  }
}

grantProUser("rjhustles@gmail.com");
