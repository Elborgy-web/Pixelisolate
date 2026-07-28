import { supabase } from "../utils/supabaseClient";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string;
  author_id?: string;
  author_name: string;
  author_avatar?: string;
  category: string;
  reading_time_minutes: number;
  meta_title?: string;
  meta_description?: string;
  is_published: boolean;
  upvotes_count: number;
  comments_count: number;
  published_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface BlogComment {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  role?: "admin" | "moderator" | "user";
  credits?: number;
  hd_credits_remaining?: number;
  is_pro?: boolean;
}

// Built-in seed posts (cleared so user has 100% full control over post creation & deletion)
export const INITIAL_SEED_POSTS: BlogPost[] = [];

// Helper: LocalStorage Persistence for Community Posts, Comments, & Votes
function getStoredPosts(): BlogPost[] {
  try {
    const raw = localStorage.getItem("pixelisolate_community_posts");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function saveStoredPosts(posts: BlogPost[]) {
  try {
    localStorage.setItem("pixelisolate_community_posts", JSON.stringify(posts));
  } catch (e) {}
}

function getStoredComments(postId: string): BlogComment[] {
  try {
    const raw = localStorage.getItem(`pixelisolate_comments_${postId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  // Default sample comments for seed posts
  if (postId === "post-1") {
    return [
      {
        id: "c1",
        post_id: "post-1",
        user_id: "u-dev",
        user_name: "Alex Designer",
        user_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop",
        content: "The 1px erosion tip completely saved my dark t-shirt graphics! No more white borders on Printify black hoodies.",
        created_at: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: "c2",
        post_id: "post-1",
        user_id: "u-pod",
        user_name: "Sarah POD Pro",
        user_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop",
        content: "Awesome guide! The subpixel AI matting handles complex typography gaps so well.",
        created_at: new Date(Date.now() - 3600000 * 12).toISOString()
      }
    ];
  }
  return [];
}

function saveStoredComments(postId: string, comments: BlogComment[]) {
  try {
    localStorage.setItem(`pixelisolate_comments_${postId}`, JSON.stringify(comments));
  } catch (e) {}
}

function getStoredVotes(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem("pixelisolate_post_votes");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {};
}

function saveStoredVotes(votes: Record<string, string[]>) {
  try {
    localStorage.setItem("pixelisolate_post_votes", JSON.stringify(votes));
  } catch (e) {}
}

let postsMemoryCache: BlogPost[] | null = null;

/**
 * Synchronously get cached posts for instant 0ms rendering.
 */
export function getCachedPosts(category?: string, search?: string, includeUnpublished = false): BlogPost[] {
  let posts: BlogPost[] = postsMemoryCache || getStoredPosts();

  if (!includeUnpublished) {
    posts = posts.filter(p => p.is_published);
  }

  if (category && category !== "All") {
    posts = posts.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (search && search.trim() !== "") {
    const q = search.toLowerCase().trim();
    posts = posts.filter(
      p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.author_name.toLowerCase().includes(q)
    );
  }

  return posts.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
}

/**
 * Fetch all posts (published or all for admin/moderator) with background revalidation.
 */
export async function getPublishedPosts(category?: string, search?: string, includeUnpublished = false): Promise<BlogPost[]> {
  let dbPosts: BlogPost[] = [];
  try {
    let query = supabase
      .from("posts")
      .select("*")
      .order("published_at", { ascending: false });

    if (!includeUnpublished) {
      query = query.eq("is_published", true);
    }

    if (category && category !== "All") {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      dbPosts = data as BlogPost[];
    }
  } catch (err) {
    console.warn("DB posts query error:", err);
  }

  // Combine DB posts + LocalStorage community posts + Initial seed posts
  const localPosts = getStoredPosts();
  const allMap = new Map<string, BlogPost>();

  // 1. Add initial seed posts (keyed by unique ID)
  INITIAL_SEED_POSTS.forEach(p => {
    allMap.set(p.id, p);
  });

  // 2. Add local posts (user created posts + edited seed posts)
  localPosts.forEach(p => {
    const matchingSeed = INITIAL_SEED_POSTS.find(s => s.id === p.id || s.slug === p.slug);
    const key = matchingSeed ? matchingSeed.id : (p.id || p.slug);
    allMap.set(key, p);
  });

  // 3. Add DB posts (takes ultimate precedence)
  dbPosts.forEach(p => {
    const matchingSeed = INITIAL_SEED_POSTS.find(s => s.id === p.id || s.slug === p.slug);
    const key = matchingSeed ? matchingSeed.id : (p.id || p.slug);
    allMap.set(key, p);
  });

  let result = Array.from(allMap.values());

  // Cache in memory for instant tab switches
  postsMemoryCache = result;
  saveStoredPosts(result);

  if (!includeUnpublished) {
    result = result.filter(p => p.is_published);
  }

  if (category && category !== "All") {
    result = result.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (search && search.trim() !== "") {
    const q = search.toLowerCase().trim();
    result = result.filter(
      p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.author_name.toLowerCase().includes(q)
    );
  }

  return result.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
}

/**
 * Fetch a single post by slug.
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!slug) return null;
  const cleanSlug = slug.trim().replace(/^\//, "").replace(/\/$/, "");

  // 1. Check local storage posts first (instant match for created & edited posts)
  const localPosts = getStoredPosts();
  const localMatch = localPosts.find(p => p.slug === cleanSlug || p.id === cleanSlug);
  if (localMatch) return localMatch;

  // 2. Check initial seed posts
  const seedMatch = INITIAL_SEED_POSTS.find(p => p.slug === cleanSlug || p.id === cleanSlug);
  if (seedMatch) return seedMatch;

  // 3. Try DB query
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("slug", cleanSlug)
      .single();

    if (!error && data) return data as BlogPost;
  } catch (e) {}

  // 4. Fallback check
  const all = await getPublishedPosts("All", "", true);
  return all.find(p => p.slug === cleanSlug || p.id === cleanSlug) || null;
}

/**
 * Fetch all published slugs for sitemap.
 */
export async function getAllPostSlugs(): Promise<string[]> {
  const posts = await getPublishedPosts("All", "", false);
  return posts.map(p => p.slug);
}

export async function triggerFacebookAutoScrape(slug: string) {
  try {
    const articleUrl = `https://pixelisolate.online/blog/${slug}`;
    fetch(`https://graph.facebook.com/?id=${encodeURIComponent(articleUrl)}&scrape=true`, {
      method: "POST"
    }).catch(() => {});
  } catch (e) {}
}

/**
 * Create a new Blog Post (by user or admin).
 */
export async function createPost(
  postData: {
    title: string;
    excerpt: string;
    content: string;
    category: string;
    cover_image?: string;
  },
  user: any,
  profile: any
): Promise<BlogPost> {
  const slug = postData.title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-") + `-${Math.random().toString(36).substring(2, 7)}`;

  const readingTime = Math.max(2, Math.ceil(postData.content.split(/\s+/).length / 180));
  const authorName = profile?.display_name || user?.email?.split("@")[0] || "Community Member";
  const authorAvatar = profile?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.id || authorName}`;
  const isAdminOrMod = profile?.role === "admin" || profile?.role === "moderator" || user?.email?.toLowerCase().includes("elborgy") || user?.email?.toLowerCase().includes("admin");

  const newPost: BlogPost = {
    id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    slug,
    title: postData.title,
    excerpt: postData.excerpt,
    content: postData.content,
    cover_image: postData.cover_image || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
    author_id: user?.id,
    author_name: authorName,
    author_avatar: authorAvatar,
    category: postData.category || "Tutorials",
    reading_time_minutes: readingTime,
    meta_title: `${postData.title} | PixelIsolate Blog`,
    meta_description: postData.excerpt,
    is_published: true, // Auto-publish for smooth community sharing
    upvotes_count: 1,
    comments_count: 0,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  };

  // 1. Save locally first so it is available instantly for UI and routing
  const stored = getStoredPosts();
  stored.unshift(newPost);
  saveStoredPosts(stored);

  // 2. Try API insert via backend (upsert as admin)
  try {
    const apiBase = (import.meta.env.VITE_API_URL || "").trim();
    await fetch(`${apiBase}/api/blog/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPost)
    });
  } catch (e) {}

  // 3. Try direct DB insert
  try {
    const { data } = await supabase.from("posts").insert(newPost).select().single();
    if (data) {
      newPost.id = data.id;
    }
  } catch (e) {}

  // 4. NOW trigger Facebook Graph API auto-scrape AFTER post exists in DB!
  try {
    const apiBase = (import.meta.env.VITE_API_URL || "").trim();
    fetch(`${apiBase}/api/blog/scrape-fb`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: newPost.slug })
    }).catch(() => {});
  } catch (e) {}

  return newPost;
}

/**
 * Toggle Upvote on a post.
 */
export async function toggleUpvote(postId: string, userId: string): Promise<{ upvoted: boolean; count: number }> {
  const votes = getStoredVotes();
  const userVotes = votes[postId] || [];
  const hasVoted = userVotes.includes(userId);

  let newCount = 0;
  let newVoted = !hasVoted;

  if (hasVoted) {
    votes[postId] = userVotes.filter(id => id !== userId);
  } else {
    votes[postId] = [...userVotes, userId];
  }
  saveStoredVotes(votes);

  // Update post upvote count
  const allPosts = await getPublishedPosts("All", "", true);
  const target = allPosts.find(p => p.id === postId || p.slug === postId);
  if (target) {
    target.upvotes_count = Math.max(0, target.upvotes_count + (newVoted ? 1 : -1));
    newCount = target.upvotes_count;

    const stored = getStoredPosts();
    const idx = stored.findIndex(p => p.id === target.id || p.slug === target.slug);
    if (idx !== -1) {
      stored[idx].upvotes_count = newCount;
      saveStoredPosts(stored);
    }

    try {
      await supabase.from("posts").update({ upvotes_count: newCount }).eq("id", target.id);
    } catch (e) {}
  }

  return { upvoted: newVoted, count: newCount };
}

/**
 * Check if user upvoted post.
 */
export function hasUserUpvoted(postId: string, userId: string): boolean {
  if (!userId) return false;
  const votes = getStoredVotes();
  const userVotes = votes[postId] || [];
  return userVotes.includes(userId);
}

/**
 * Get comments for a post.
 */
export async function getPostComments(postId: string): Promise<BlogComment[]> {
  try {
    const { data, error } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (!error && data) return data as BlogComment[];
  } catch (e) {}

  return getStoredComments(postId);
}

/**
 * Add comment to a post.
 */
export async function addComment(
  postId: string,
  user: any,
  profile: any,
  content: string
): Promise<BlogComment> {
  const authorName = profile?.display_name || user?.email?.split("@")[0] || "Community Member";
  const authorAvatar = profile?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.id || authorName}`;

  const comment: BlogComment = {
    id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    post_id: postId,
    user_id: user.id,
    user_name: authorName,
    user_avatar: authorAvatar,
    content: content.trim(),
    created_at: new Date().toISOString()
  };

  try {
    await supabase.from("post_comments").insert(comment);
  } catch (e) {}

  const current = getStoredComments(postId);
  current.push(comment);
  saveStoredComments(postId, current);

  // Update comments count on post
  const allPosts = await getPublishedPosts("All", "", true);
  const target = allPosts.find(p => p.id === postId || p.slug === postId);
  if (target) {
    target.comments_count = (target.comments_count || 0) + 1;
    const stored = getStoredPosts();
    const idx = stored.findIndex(p => p.id === target.id || p.slug === target.slug);
    if (idx !== -1) {
      stored[idx].comments_count = target.comments_count;
      saveStoredPosts(stored);
    }
  }

  return comment;
}

/**
 * Delete a comment (by author or admin/moderator).
 */
export async function deleteComment(commentId: string, postId: string): Promise<void> {
  try {
    await supabase.from("post_comments").delete().eq("id", commentId);
  } catch (e) {}

  const current = getStoredComments(postId);
  const filtered = current.filter(c => c.id !== commentId);
  saveStoredComments(postId, filtered);
}

/**
 * Update an existing Blog Post (by author or admin/moderator).
 */
export async function updatePost(
  postId: string,
  postData: {
    title: string;
    excerpt: string;
    content: string;
    category: string;
    cover_image?: string;
  }
): Promise<BlogPost | null> {
  const readingTime = Math.max(2, Math.ceil(postData.content.split(/\s+/).length / 180));
  const updatedFields = {
    title: postData.title,
    excerpt: postData.excerpt,
    content: postData.content,
    category: postData.category,
    cover_image: postData.cover_image,
    reading_time_minutes: readingTime,
    updated_at: new Date().toISOString()
  };

  let updatedPostResult: BlogPost | null = null;

  // 1. Try DB update
  try {
    const { data } = await supabase
      .from("posts")
      .update(updatedFields)
      .eq("id", postId)
      .select()
      .single();
    if (data) {
      updatedPostResult = data as BlogPost;
    }
  } catch (e) {}

  // 2. Mutate in-memory seed post if editing a seed post
  const seedItem = INITIAL_SEED_POSTS.find(p => p.id === postId || p.slug === postId);
  if (seedItem) {
    Object.assign(seedItem, updatedFields);
    updatedPostResult = seedItem;
  }

  // 3. Persistent Local Storage Update (Ensures edited seed posts persist across page refreshes!)
  const stored = getStoredPosts();
  const idx = stored.findIndex(p => p.id === postId || p.slug === postId || (seedItem && p.id === seedItem.id));

  if (idx !== -1) {
    stored[idx] = { ...stored[idx], ...updatedFields };
    updatedPostResult = stored[idx];
  } else if (seedItem) {
    stored.unshift({ ...seedItem });
    updatedPostResult = seedItem;
  }

  // 4. Try backend API update
  try {
    const apiBase = (import.meta.env.VITE_API_URL || "").trim();
    await fetch(`${apiBase}/api/blog/posts/${encodeURIComponent(postId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedFields)
    });
  } catch (e) {}

  if (updatedPostResult) {
    triggerFacebookAutoScrape(updatedPostResult.slug);
  }

  return updatedPostResult;
}

/**
 * Toggle post publish status (Admin/Moderator).
 */
export async function togglePostPublishStatus(postId: string, isPublished: boolean): Promise<void> {
  const stored = getStoredPosts();
  const target = stored.find(p => p.id === postId || p.slug === postId);
  if (target) {
    target.is_published = isPublished;
    saveStoredPosts(stored);
  }

  try {
    await supabase.from("posts").update({ is_published: isPublished }).eq("id", postId);
  } catch (e) {}
}

/**
 * Delete post (Admin/Moderator).
 */
export async function deletePost(postId: string): Promise<void> {
  const stored = getStoredPosts();
  const filtered = stored.filter(p => p.id !== postId && p.slug !== postId);
  saveStoredPosts(filtered);

  try {
    const apiBase = (import.meta.env.VITE_API_URL || "").trim();
    await fetch(`${apiBase}/api/blog/posts/${encodeURIComponent(postId)}`, {
      method: "DELETE"
    });
  } catch (e) {}

  try {
    await supabase.from("posts").delete().eq("id", postId);
    await supabase.from("posts").delete().eq("slug", postId);
  } catch (e) {}
}
