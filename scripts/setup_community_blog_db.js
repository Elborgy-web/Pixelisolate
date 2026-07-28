import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase configuration.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function setupCommunityBlog() {
  console.log("Checking Supabase tables for community blog...");

  // Check posts
  const { data: postsData, error: postsErr } = await supabase.from("posts").select("id").limit(1);
  console.log("Posts table check:", postsErr ? postsErr.message : `Exists (${postsData.length} items)`);

  // Check post_comments
  const { data: commentsData, error: commentsErr } = await supabase.from("post_comments").select("id").limit(1);
  console.log("Post comments table check:", commentsErr ? commentsErr.message : `Exists (${commentsData.length} items)`);

  // Check post_votes
  const { data: votesData, error: votesErr } = await supabase.from("post_votes").select("id").limit(1);
  console.log("Post votes table check:", votesErr ? votesErr.message : `Exists (${votesData.length} items)`);
}

setupCommunityBlog();
