import React, { useState, useEffect, useCallback } from "react";
import { getPublishedPosts, getCachedPosts, toggleUpvote, hasUserUpvoted, deletePost, togglePostPublishStatus, BlogPost } from "../lib/blog";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { Search, Clock, Calendar, ArrowRight, Tag, Sparkles, BookOpen, ThumbsUp, MessageSquare, Plus, User, ShieldCheck, Trash2, Eye, EyeOff, Edit3 } from "lucide-react";

interface BlogIndexProps {
  onSelectPost: (slug: string) => void;
  user: any;
  profile: any;
  onOpenAuth?: () => void;
  onOpenCreatePost?: () => void;
  onOpenEditPost?: (post: BlogPost) => void;
  onOpenProfile?: () => void;
}

const CATEGORIES = ["All", "POD Tips", "E-Commerce", "AI Tools", "Tutorials", "Design & Printing"];

export const BlogIndex: React.FC<BlogIndexProps> = ({
  onSelectPost,
  user,
  profile,
  onOpenAuth,
  onOpenCreatePost,
  onOpenEditPost,
  onOpenProfile,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const isAdminOrMod = profile?.role === "admin" || profile?.role === "moderator" || user?.email?.toLowerCase().includes("elborgy") || user?.email?.toLowerCase().includes("admin");

  // Instant 0ms cache-first state initialization
  const [posts, setPosts] = useState<BlogPost[]>(() => {
    return getCachedPosts(selectedCategory, searchQuery, isAdminOrMod);
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const cached = getCachedPosts(selectedCategory, searchQuery, isAdminOrMod);
    return cached.length === 0;
  });
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>({});

  // Delete modal state
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadPosts = useCallback(async () => {
    // Only show skeleton loader if cache is empty
    if (posts.length === 0) {
      setIsLoading(true);
    }

    const data = await getPublishedPosts(selectedCategory, searchQuery, isAdminOrMod);
    setPosts(data);

    if (user) {
      const votesState: Record<string, boolean> = {};
      data.forEach((p) => {
        votesState[p.id] = hasUserUpvoted(p.id, user.id);
      });
      setUserVotes(votesState);
    }
    setIsLoading(false);
  }, [selectedCategory, searchQuery, user, profile, isAdminOrMod, posts.length]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleUpvote = async (e: React.MouseEvent, post: BlogPost) => {
    e.stopPropagation();
    if (!user) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    const { upvoted, count } = await toggleUpvote(post.id, user.id);

    setUserVotes((prev) => ({ ...prev, [post.id]: upvoted }));
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, upvotes_count: count } : p))
    );
  };

  const handleTogglePublish = async (e: React.MouseEvent, post: BlogPost) => {
    e.stopPropagation();
    const newStatus = !post.is_published;
    await togglePostPublishStatus(post.id, newStatus);
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, is_published: newStatus } : p))
    );
  };

  const handleConfirmDelete = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);
    await deletePost(postToDelete.id);
    setPosts((prev) => prev.filter((p) => p.id !== postToDelete.id));
    setIsDeleting(false);
    setPostToDelete(null);
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-gray-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4 pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
            <BookOpen className="h-3.5 w-3.5" />
            <span>PixelIsolate Community Knowledge Hub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            PixelIsolate Blog: Print-on-Demand & AI Design Guides
          </h1>
          <p className="text-base sm:text-lg text-gray-400 font-sans leading-relaxed">
            Community-driven tutorials on background removal, subpixel chroma keying, eliminating white print halos, and e-commerce growth.
          </p>

          {/* User Action Bar */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {user ? (
              <>
                <button
                  onClick={onOpenCreatePost}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs font-mono shadow-xl shadow-emerald-500/20 transition flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Write Article</span>
                </button>
                <button
                  onClick={onOpenProfile}
                  className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-850 border border-gray-800 text-gray-300 hover:text-white text-xs font-mono transition flex items-center gap-2 cursor-pointer"
                >
                  <User className="h-4 w-4 text-emerald-400" />
                  <span>My Profile</span>
                  {isAdminOrMod && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold uppercase">
                      Admin / Mod
                    </span>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs font-mono shadow-xl shadow-emerald-500/20 transition flex items-center gap-2 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Sign In to Post, Comment & Vote</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters & Search Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-950/60 p-4 rounded-2xl border border-gray-850 backdrop-blur-md">
          {/* Category Badges */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all duration-200 cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                    : "bg-gray-900 hover:bg-gray-850 text-gray-400 hover:text-gray-200 border border-gray-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles or authors..."
              className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Posts Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-950/40 rounded-2xl border border-gray-850 p-4 space-y-4 animate-pulse">
                <div className="w-full h-48 bg-gray-900 rounded-xl" />
                <div className="h-4 bg-gray-900 rounded w-1/4" />
                <div className="h-6 bg-gray-900 rounded w-3/4" />
                <div className="h-12 bg-gray-900 rounded w-full" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-gray-950/30 rounded-2xl border border-gray-850 space-y-4">
            <Tag className="h-10 w-10 text-gray-600 mx-auto" />
            <h3 className="text-lg font-bold text-gray-300">No articles found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              We couldn't find any published guides matching "{searchQuery}" in category "{selectedCategory}".
            </p>
            <button
              onClick={() => { setSelectedCategory("All"); setSearchQuery(""); }}
              className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-xs font-mono text-emerald-400 border border-gray-800 transition"
            >
              Reset Search & Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {posts.map((post) => {
              const isUpvoted = userVotes[post.id];
              const isAuthor = user && (user.id === post.author_id);
              const canEdit = isAuthor || isAdminOrMod;

              return (
                <article
                  key={post.id || post.slug}
                  onClick={() => onSelectPost(post.slug)}
                  className={`group flex flex-col justify-between bg-gray-950/70 hover:bg-gray-900/80 border ${
                    !post.is_published ? "border-amber-500/40 bg-amber-950/10" : "border-gray-850 hover:border-emerald-500/40"
                  } rounded-2xl p-5 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-emerald-500/5 cursor-pointer overflow-hidden relative`}
                >
                  {/* Admin Status Badge */}
                  {!post.is_published && (
                    <span className="absolute top-7 right-7 z-10 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[9px] font-bold uppercase">
                      Draft / Unpublished
                    </span>
                  )}

                  <div className="space-y-4">
                    {/* Cover Image */}
                    <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-900 border border-gray-800">
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-gray-950/90 backdrop-blur-md border border-gray-800 text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                        {post.category}
                      </span>
                    </div>

                    {/* Author & Meta Details */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-gray-500">
                      <div className="flex items-center gap-2 truncate">
                        <img
                          src={post.author_avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${post.author_name}`}
                          alt={post.author_name}
                          className="w-5 h-5 rounded-full object-cover border border-gray-800 shrink-0"
                        />
                        <span className="text-gray-300 truncate max-w-[110px]">{post.author_name}</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-500 shrink-0">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.reading_time_minutes}m
                        </span>
                      </div>
                    </div>

                    {/* Title & Excerpt */}
                    <div className="space-y-2">
                      <h2 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </h2>
                      <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer: Upvote, Comments & Author/Admin Toolbar */}
                  <div className="pt-4 mt-6 border-t border-gray-900 flex items-center justify-between font-mono text-xs">
                    {/* Upvote & Comment counts */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => handleUpvote(e, post)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                          isUpvoted
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold"
                            : "bg-gray-900 hover:bg-gray-850 text-gray-400 hover:text-white border-gray-800"
                        }`}
                      >
                        <ThumbsUp className={`h-3.5 w-3.5 ${isUpvoted ? "fill-current text-emerald-400" : ""}`} />
                        <span>{post.upvotes_count || 0}</span>
                      </button>

                      <span className="flex items-center gap-1 text-gray-500">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>{post.comments_count || 0}</span>
                      </span>
                    </div>

                    {/* Toolbar & Read Article */}
                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onOpenEditPost) onOpenEditPost(post);
                            }}
                            className="p-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-emerald-400 transition"
                            title="Edit Article"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          {isAdminOrMod && (
                            <button
                              type="button"
                              onClick={(e) => handleTogglePublish(e, post)}
                              className="p-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-amber-400 transition"
                              title={post.is_published ? "Unpublish Post" : "Publish Post"}
                            >
                              {post.is_published ? <Eye className="h-3.5 w-3.5 text-emerald-400" /> : <EyeOff className="h-3.5 w-3.5 text-amber-400" />}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPostToDelete(post);
                            }}
                            className="p-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-red-400 transition"
                            title="Delete Article"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}

                      <span className="text-emerald-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>Read</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

      </div>

      {/* Styled Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!postToDelete}
        title="Delete Article"
        message={`Are you sure you want to permanently delete "${postToDelete?.title}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPostToDelete(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default BlogIndex;
