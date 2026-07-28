-- PixelIsolate Blog Engine Supabase Migration
-- Execute this SQL script in Supabase SQL Editor to create tables & RLS policies

-- 1. Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id VARCHAR(255) PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_image TEXT,
  author_id TEXT,
  author_name VARCHAR(100) DEFAULT 'PixelIsolate Team',
  author_avatar TEXT,
  category VARCHAR(50) DEFAULT 'Tutorials',
  reading_time_minutes INT DEFAULT 5,
  meta_title VARCHAR(255),
  meta_description TEXT,
  is_published BOOLEAN DEFAULT true,
  upvotes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create post_comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id VARCHAR(255) PRIMARY KEY,
  post_id VARCHAR(255) NOT NULL,
  user_id TEXT,
  user_name VARCHAR(100) NOT NULL,
  user_avatar TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create post_votes table
CREATE TABLE IF NOT EXISTS post_votes (
  id VARCHAR(255) PRIMARY KEY,
  post_id VARCHAR(255) NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS and Grant Full Public Access for Blog Community
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access on posts" ON posts;
CREATE POLICY "Allow all access on posts" ON posts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access on post_comments" ON post_comments;
CREATE POLICY "Allow all access on post_comments" ON post_comments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access on post_votes" ON post_votes;
CREATE POLICY "Allow all access on post_votes" ON post_votes FOR ALL USING (true) WITH CHECK (true);
