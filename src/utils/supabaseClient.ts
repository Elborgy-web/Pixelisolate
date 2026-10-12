import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://wnzgwwtidscjwfnapleb.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Induemd3d3RpZHNjandmbmFwbGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMzYzODIsImV4cCI6MjEwNjgxMjM4Mn0.c6EmEUjhhv0-aEtS3BRbfqJ_F23CgUIWUu7NOCcHXt8";

const rawUrl = import.meta.env.VITE_SUPABASE_URL || "";
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const supabaseUrl =
  rawUrl && !rawUrl.includes("your-supabase-project")
    ? rawUrl
    : DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  rawKey && !rawKey.includes("your-supabase-anon")
    ? rawKey
    : DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

