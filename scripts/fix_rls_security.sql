-- Migration: Fix Row Level Security (RLS) on public tables in Supabase project wnzgwwtidscjwfnapleb
-- Resolves Supabase Security Advisor Critical Issue: rls_disabled_in_public

-- 1. Enable RLS on paddle_subscriptions
ALTER TABLE public.paddle_subscriptions ENABLE ROW LEVEL SECURITY;

-- 2. Policies for paddle_subscriptions
DROP POLICY IF EXISTS "Users can view own subscription" ON public.paddle_subscriptions;
CREATE POLICY "Users can view own subscription"
ON public.paddle_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access on paddle_subscriptions" ON public.paddle_subscriptions;
CREATE POLICY "Service role full access on paddle_subscriptions"
ON public.paddle_subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Policies for history
ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on history" ON public.history;
DROP POLICY IF EXISTS "Users can view own history" ON public.history;
DROP POLICY IF EXISTS "Users can delete own history" ON public.history;
DROP POLICY IF EXISTS "Users can insert own history" ON public.history;

CREATE POLICY "Users can view own history"
ON public.history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history"
ON public.history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own history"
ON public.history
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on history"
ON public.history
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role full access on profiles"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Policies for post_comments
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view comments" ON public.post_comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.post_comments;
DROP POLICY IF EXISTS "Service role full access on post_comments" ON public.post_comments;

CREATE POLICY "Public can view comments"
ON public.post_comments
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert comments"
ON public.post_comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own comments"
ON public.post_comments
FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Service role full access on post_comments"
ON public.post_comments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6. Policies for post_votes
ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view votes" ON public.post_votes;
DROP POLICY IF EXISTS "Authenticated users can vote" ON public.post_votes;
DROP POLICY IF EXISTS "Users can remove own vote" ON public.post_votes;
DROP POLICY IF EXISTS "Service role full access on post_votes" ON public.post_votes;

CREATE POLICY "Public can view votes"
ON public.post_votes
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can vote"
ON public.post_votes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can remove own vote"
ON public.post_votes
FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Service role full access on post_votes"
ON public.post_votes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 7. Policies for posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published posts" ON public.posts;
DROP POLICY IF EXISTS "Allow authenticated manage posts" ON public.posts;
DROP POLICY IF EXISTS "Service role full access on posts" ON public.posts;

CREATE POLICY "Public can view published posts"
ON public.posts
FOR SELECT
USING (is_published = true OR auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated manage posts"
ON public.posts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access on posts"
ON public.posts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
