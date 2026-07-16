import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("your-supabase-project")) {
  console.warn(
    "Supabase credentials are not configured. User authentication, storage, and history will operate in offline/mock mode."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
