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

// Built-in seed posts
export const INITIAL_SEED_POSTS: BlogPost[] = [
  {
    id: "post-1",
    slug: "how-to-eliminate-white-halos-on-dark-tshirts",
    title: "How to Eliminate White Halos on Dark T-Shirts (POD Masterclass)",
    category: "POD Tips",
    reading_time_minutes: 6,
    excerpt: "Learn how subpixel green screen chroma keying and neural AI segmentation eliminate white edge halos and color bleeding on black & dark garments.",
    cover_image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop",
    author_name: "PixelIsolate Engineering",
    author_avatar: "/logo.png",
    meta_title: "How to Eliminate White Halos on Dark T-Shirts | PixelIsolate",
    meta_description: "Discover how to eliminate ugly white border halos on dark apparel graphics using subpixel isolation and neural background matting.",
    is_published: true,
    upvotes_count: 24,
    comments_count: 3,
    published_at: "2026-07-27T12:00:00.000Z",
    content: `
# How to Eliminate White Halos on Dark T-Shirts

When printing custom graphics on dark apparel (black, navy, charcoal t-shirts), nothing ruins a Print-on-Demand (POD) product faster than **ugly white fringe halos** around the subject.

Whether you sell on Printify, Printful, Teespring, or Shopify, background removal tools often leave anti-aliased white border pixels that become stark white rings when printed with white underbase ink.

---

## 1. Why White Halos Happen in Print-on-Demand

Standard background removal engines work by thresholding opacity. When removing a white or light background:

1. **Anti-Aliasing Fringes:** The transition pixels between the subject and the white background contain mixed RGB colors (50% subject color, 50% white backdrop).
2. **DTG Printing Underbase:** Direct-to-Garment (DTG) printers apply a solid white underbase layer beneath all colored inks to make colors pop on dark shirts.
3. **Fringe Amplification:** Semi-transparent edge pixels trigger the printer to lay down white underbase ink, producing a visible white outline around text, fur, and intricate line art.

---

## 2. The Solution: Subpixel Isolation & Edge Erosion

To achieve crisp, retail-quality prints on dark garments:

### A. Apply Morphological Erosion
By shrinking the outer alpha mask by **1 to 2 pixels**, you strip away the semi-transparent boundary layer without distorting the core artwork.

### B. Use Neural AI Subpixel Segmentation
Unlike standard magic-wand tools, **PixelIsolate's AI Magic Engine** calculates exact transparency alpha values down to sub-pixel resolution, completely separating subject edges from the background color.

---

## 3. Step-by-Step Workflow in PixelIsolate

1. **Upload your artwork** into the PixelIsolate editor workspace.
2. Select **Graphic / Artwork** mode.
3. Enable **AI Magic** for sub-pixel boundary detection.
4. Set **Erosion Size** to \`1px\` if any fringe bleed is present.
5. Export at **100% Full HD PNG Resolution** with transparency intact.

---

## Conclusion

Ready to transform your POD designs? Try **PixelIsolate** today with **10 Free HD Credits** — zero credit card required!
    `.trim()
  },
  {
    id: "post-2",
    slug: "e-commerce-product-photography-background-removal-guide",
    title: "The Ultimate Guide to E-Commerce Product Photography Background Removal",
    category: "E-Commerce",
    reading_time_minutes: 8,
    excerpt: "Boost your Shopify & Amazon conversion rates with clean, professional white & transparent background product photography.",
    cover_image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop",
    author_name: "PixelIsolate Team",
    author_avatar: "/logo.png",
    meta_title: "E-Commerce Product Photography Background Removal Guide | PixelIsolate",
    meta_description: "Learn how high-resolution background removal increases conversion rates on Shopify, Amazon, and Etsy.",
    is_published: true,
    upvotes_count: 42,
    comments_count: 5,
    published_at: "2026-07-26T14:30:00.000Z",
    content: `
# The Ultimate Guide to E-Commerce Product Photography Background Removal

In e-commerce, **your product photos are your storefront**. Studies show that 75% of online shoppers rely on product photos when deciding to make a purchase.

Clean, consistent product images with pure white or transparent backdrops instantly communicate quality and professionalism.

---

## Key Benefits of Studio Background Removal

* **Amazon & Marketplace Compliance:** Amazon, Google Shopping, and eBay strictly require pure white (#FFFFFF) background images for main product listings.
* **Higher Conversion Rates:** Removing clutter and shadows keeps 100% of the customer's focus on product details, textures, and materials.
* **Versatility Across Marketing Channels:** Isolated PNG assets can be seamlessly overlaid onto seasonal banners, social media ads, and hero banners.

---

## Best Practices for Product Isolation

1. **Maintain Crisp Edge Contours:** Avoid aggressive blur or heavy feathering that makes product edges look fuzzy.
2. **Preserve Natural Drop Shadows:** Use safety backdrops or green-screen preview modes to verify that subtle contact shadows are preserved.
3. **Batch Processing:** When listing entire product catalogs, use **PixelIsolate Bulk Remover** to isolate dozens of images simultaneously at full original resolution.

---

## Start Isolating Products for Free

Transform your e-commerce store today. Sign up for **PixelIsolate** to claim **10 Free HD Credits**!
    `.trim()
  },
  {
    id: "post-3",
    slug: "ai-background-removal-vs-chroma-keying-which-is-better",
    title: "AI Background Removal vs. Chroma Keying: Which Should You Use?",
    category: "AI Tools",
    reading_time_minutes: 5,
    excerpt: "Understand the technical differences between AI neural segmentation models and traditional RGB/HSV Chroma Keying to pick the perfect workflow.",
    cover_image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
    author_name: "PixelIsolate Engineering",
    author_avatar: "/logo.png",
    meta_title: "AI Background Removal vs Chroma Keying | PixelIsolate Blog",
    meta_description: "Compare AI neural background matting with Chroma Keying to choose the right technique for hair, products, and graphics.",
    is_published: true,
    upvotes_count: 19,
    comments_count: 2,
    published_at: "2026-07-25T10:15:00.000Z",
    content: `
# AI Background Removal vs. Chroma Keying: Which Should You Use?

Choosing between **AI Neural Segmentation** and **Chroma Keying** depends on your subject material, backdrop uniformity, and required processing speed.

---

## 1. Chroma Keying (Color-Based Extraction)

Chroma keying works by targeting a specific key color (such as studio green, blue, white, or black) and calculating the Euclidean distance between pixel colors.

### Best For:
* Graphics, logos, and vector illustrations on solid backdrops.
* Rapid client-side processing with zero server latency.
* Fine manual control over color distance thresholds and connectivity flood-fill.

---

## 2. AI Neural Segmentation (RMBG / BiRefNet Architecture)

AI neural segmentation uses deep convolutional neural networks trained on millions of high-resolution images to understand object semantics (hair, eyes, fur, fabric edges).

### Best For:
* Complex portrait photography with messy hair strands.
* Transparent glass, water droplets, and semi-opaque fabrics.
* Unstructured real-world backgrounds without solid studio backdrops.

---

## Why Choose When You Have Both?

PixelIsolate uniquely integrates **both engines** into a unified browser workspace, giving you the precision of AI Magic alongside the speed and control of Chroma Keying.

Try **PixelIsolate** now with **10 Free HD Credits**!
    `.trim()
  }
];

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

/**
 * Fetch all posts (published or all for admin/moderator).
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
        p.category.toLowerCase().includes(q) ||
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

  // Trigger Facebook auto-scrape in background so FB gets OpenGraph preview immediately
  triggerFacebookAutoScrape(slug);

  // Save locally first so it is available instantly for UI and routing
  const stored = getStoredPosts();
  stored.unshift(newPost);
  saveStoredPosts(stored);

  // Try API insert via backend
  try {
    const apiBase = (import.meta.env.VITE_API_URL || "").trim();
    await fetch(`${apiBase}/api/blog/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPost)
    });
  } catch (e) {}

  // Try direct DB insert
  try {
    const { data, error } = await supabase.from("posts").insert(newPost).select().single();
    if (!error && data) return data as BlogPost;
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
    await supabase.from("posts").delete().eq("id", postId);
  } catch (e) {}
}
