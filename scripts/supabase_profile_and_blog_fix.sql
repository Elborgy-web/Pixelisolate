-- ================================================================
-- PixelIsolate Database Schema Migration: Profile & Blog Persistence
-- Execute this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/wnzgwwtidscjwfnapleb/sql
-- ================================================================

-- 1. Ensure all Community Profile columns exist in public.profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 2. Ensure all Blog Engine columns exist in public.posts
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Tutorials',
  ADD COLUMN IF NOT EXISTS reading_time_minutes INT DEFAULT 5,
  ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS comments_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Ensure post_comments and post_votes tables exist for community interactions
CREATE TABLE IF NOT EXISTS public.post_comments (
  id VARCHAR(255) PRIMARY KEY,
  post_id VARCHAR(255) NOT NULL,
  user_id TEXT,
  user_name VARCHAR(100) NOT NULL,
  user_avatar TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.post_votes (
  id VARCHAR(255) PRIMARY KEY,
  post_id VARCHAR(255) NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;

-- 5. Create Permissive Policies to allow full read/write for Community Blog & Profiles
DROP POLICY IF EXISTS "Allow all access on profiles" ON public.profiles;
CREATE POLICY "Allow all access on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access on posts" ON public.posts;
CREATE POLICY "Allow all access on posts" ON public.posts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access on post_comments" ON public.post_comments;
CREATE POLICY "Allow all access on post_comments" ON public.post_comments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access on post_votes" ON public.post_votes;
CREATE POLICY "Allow all access on post_votes" ON public.post_votes FOR ALL USING (true) WITH CHECK (true);

-- 6. Grant access to public and authenticated roles
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.posts TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.post_comments TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.post_votes TO anon, authenticated, service_role;
