import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://nyiwicwbwzjkijamqqsl.supabase.co";
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55aXdpY3did3pqa2lqYW1xcXNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMDUwODgsImV4cCI6MjA5OTc4MTA4OH0.Y34FVIh9iv6tobH238qAszhN6W3waL4Ko2lkjEqsUd4";

// Client simulating an unauthenticated GUEST visitor using public anon key
const anonClient = createClient(supabaseUrl, anonKey);

async function testGuestQuery() {
  console.log("[Guest Visitor Simulation] Fetching posts using public anon key...");
  const { data, error } = await anonClient.from("posts").select("*").eq("is_published", true);
  if (error) {
    console.error("Supabase Error for guest:", error);
  } else {
    console.log(`Number of posts visible to GUEST visitors: ${data?.length}`);
    data?.forEach(p => console.log(`- ${p.title} (ID: ${p.id})`));
  }
}

testGuestQuery();
