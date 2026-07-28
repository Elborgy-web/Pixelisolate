import React, { useState, useEffect } from "react";
import { getPostBySlug, getCachedPostBySlug, toggleUpvote, hasUserUpvoted, getPostComments, addComment, deleteComment, deletePost, togglePostPublishStatus, BlogPost, BlogComment } from "../lib/blog";
import { BlogCTA } from "./BlogCTA";
import ShareModal from "./ShareModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { ArrowLeft, Calendar, Clock, User, Share2, Check, List, Sparkles, ThumbsUp, MessageSquare, Send, Trash2, ShieldCheck, Eye, EyeOff, Edit3 } from "lucide-react";

interface BlogPostDetailProps {
  slug: string;
  onBackToBlog: () => void;
  user: any;
  profile: any;
  onOpenAuth?: () => void;
  onOpenEditPost?: (post: BlogPost) => void;
  onGoToWorkspace?: () => void;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export const BlogPostDetail: React.FC<BlogPostDetailProps> = ({
  slug,
  onBackToBlog,
  user,
  profile,
  onOpenAuth,
  onOpenEditPost,
  onGoToWorkspace,
}) => {
  // Instant 0ms cache-first state initialization to eliminate skeleton screens
  const [post, setPost] = useState<BlogPost | null>(() => getCachedPostBySlug(slug));
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [commentText, setCommentText] = useState<string>("");
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);
  const [isUpvoted, setIsUpvoted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(() => !post);
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
  const [toc, setToc] = useState<TocItem[]>([]);

  // Delete Modals states
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [isDeletingPost, setIsDeletingPost] = useState<boolean>(false);
  const [showPostDeleteModal, setShowPostDeleteModal] = useState<boolean>(false);

  const isAdminOrMod = profile?.role === "admin" || profile?.role === "moderator" || user?.email?.toLowerCase().includes("elborgy") || user?.email?.toLowerCase().includes("admin");
  const isAuthor = user && post && (user.id === post.author_id);
  const canEdit = isAuthor || isAdminOrMod;

  const loadPostDetails = async () => {
    // Only set isLoading if we don't already have the post in state
    if (!post) {
      setIsLoading(true);
    }
    const data = await getPostBySlug(slug);
    if (data) {
      setPost(data);

      // Parse Table of Contents from markdown headings (#, ##, ###)
      const lines = data.content.split("\n");
      const items: TocItem[] = [];
      lines.forEach((line) => {
        const match = line.match(/^(#{1,3})\s+(.+)$/);
        if (match) {
          const level = match[1].length;
          const text = match[2].trim();
          const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
          items.push({ id, text, level });
        }
      });
      setToc(items);

      // Fetch Comments
      const comms = await getPostComments(data.id);
      setComments(comms);

      // Check User Upvote State
      if (user) {
        setIsUpvoted(hasUserUpvoted(data.id, user.id));
      }

      // Update Document Title & Meta Tags dynamically for SEO
      document.title = data.meta_title || `${data.title} | PixelIsolate Blog`;
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.setAttribute("name", "description");
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute("content", data.meta_description || data.excerpt);
    }

    setIsLoading(false);
  };

  const userId = user?.id;
  useEffect(() => {
    loadPostDetails();
  }, [slug, userId]);

  const handleUpvote = async () => {
    if (!user) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    if (!post) return;

    const { upvoted, count } = await toggleUpvote(post.id, user.id);
    setIsUpvoted(upvoted);
    setPost((prev) => (prev ? { ...prev, upvotes_count: count } : null));
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    if (!commentText.trim() || !post) return;

    setIsSubmittingComment(true);
    const newComment = await addComment(post.id, user, profile, commentText.trim());
    setComments((prev) => [...prev, newComment]);
    setPost((prev) => (prev ? { ...prev, comments_count: (prev.comments_count || 0) + 1 } : null));
    setCommentText("");
    setIsSubmittingComment(false);
  };

  const handleConfirmDeleteComment = async () => {
    if (!post || !commentToDelete) return;
    await deleteComment(commentToDelete, post.id);
    setComments((prev) => prev.filter((c) => c.id !== commentToDelete));
    setPost((prev) => (prev ? { ...prev, comments_count: Math.max(0, (prev.comments_count || 1) - 1) } : null));
    setCommentToDelete(null);
  };

  const handleTogglePublish = async () => {
    if (!post) return;
    const newStatus = !post.is_published;
    await togglePostPublishStatus(post.id, newStatus);
    setPost((prev) => (prev ? { ...prev, is_published: newStatus } : null));
  };

  const handleConfirmDeletePost = async () => {
    if (!post) return;
    setIsDeletingPost(true);
    await deletePost(post.id);
    setIsDeletingPost(false);
    setShowPostDeleteModal(false);
    onBackToBlog();
  };

  // Convert Markdown content into HTML blocks
  const renderMarkdownContent = (content: string) => {
    const paragraphs = content.split(/\n\n+/);
    return paragraphs.map((block, idx) => {
      const trimmed = block.trim();
      
      // H1 Header (Demoted to H2 in body to preserve single H1 per page)
      if (trimmed.startsWith("# ")) {
        const text = trimmed.replace(/^#\s+/, "");
        const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
        return (
          <h2 key={idx} id={id} className="text-2xl sm:text-3xl font-extrabold text-white mt-8 mb-4 tracking-tight">
            {text}
          </h2>
        );
      }

      // H2 Header
      if (trimmed.startsWith("## ")) {
        const text = trimmed.replace(/^##\s+/, "");
        const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
        return (
          <h2 key={idx} id={id} className="text-xl sm:text-2xl font-bold text-emerald-400 mt-8 mb-4 tracking-tight border-b border-gray-850 pb-2">
            {text}
          </h2>
        );
      }

      // H3 Header
      if (trimmed.startsWith("### ")) {
        const text = trimmed.replace(/^###\s+/, "");
        const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
        return (
          <h3 key={idx} id={id} className="text-lg font-bold text-gray-200 mt-6 mb-3 tracking-tight">
            {text}
          </h3>
        );
      }

      // Horizontal Divider
      if (trimmed === "---") {
        return <hr key={idx} className="my-8 border-gray-850" />;
      }

      // Bullet List
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        const items = trimmed.split("\n").map((l) => l.replace(/^[*|-]\s+/, ""));
        return (
          <ul key={idx} className="my-4 space-y-2 font-sans text-sm sm:text-base text-gray-300 list-disc list-inside">
            {items.map((item, iIdx) => (
              <li key={iIdx} className="leading-relaxed">
                {formatInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        );
      }

      // Numbered List
      if (/^\d+\.\s+/.test(trimmed)) {
        const items = trimmed.split("\n").map((l) => l.replace(/^\d+\.\s+/, ""));
        return (
          <ol key={idx} className="my-4 space-y-2 font-sans text-sm sm:text-base text-gray-300 list-decimal list-inside">
            {items.map((item, iIdx) => (
              <li key={iIdx} className="leading-relaxed">
                {formatInlineMarkdown(item)}
              </li>
            ))}
          </ol>
        );
      }

      // Regular Paragraph
      return (
        <p key={idx} className="my-4 text-sm sm:text-base text-gray-300 leading-relaxed font-sans">
          {formatInlineMarkdown(trimmed)}
        </p>
      );
    });
  };

  const formatInlineMarkdown = (text: string) => {
    const regex = /(\[.*?\]\(https?:\/\/.*?\)|https?:\/\/[^\s<]+|\*\*.*?\*\*|\`.*?\`)/g;
    const parts = text.split(regex);

    return parts.map((part, i) => {
      if (!part) return null;

      // 1. Markdown Link: [Anchor Text](https://url.com)
      const mdLinkMatch = part.match(/^\[(.*?)\]\((https?:\/\/.*?)\)$/);
      if (mdLinkMatch) {
        const anchorText = mdLinkMatch[1];
        const href = mdLinkMatch[2];
        return (
          <a
            key={i}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4 font-semibold transition"
          >
            {anchorText}
          </a>
        );
      }

      // 2. Raw URL: https://...
      if (/^https?:\/\/[^\s<]+$/.test(part)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4 font-semibold transition"
          >
            {part}
          </a>
        );
      }

      // 3. Bold **text**
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      }

      // 4. Code `text`
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={i} className="px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800 text-emerald-400 font-mono text-xs">{part.slice(1, -1)}</code>;
      }

      return part;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07080a] text-gray-100 py-12 px-4 max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-900 rounded w-1/4" />
        <div className="h-10 bg-gray-900 rounded w-3/4" />
        <div className="h-64 bg-gray-900 rounded-2xl w-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#07080a] text-gray-100 py-20 px-4 text-center max-w-md mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-white">Article Not Found</h2>
        <p className="text-xs text-gray-400">The requested article could not be located or has been moved.</p>
        <button
          onClick={onBackToBlog}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold font-mono shadow-lg hover:shadow-emerald-500/20 transition cursor-pointer"
        >
          Return to Blog
        </button>
      </div>
    );
  }

  // BlogPosting JSON-LD Schema
  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.meta_description || post.excerpt,
    "image": [post.cover_image],
    "datePublished": post.published_at,
    "author": [{
      "@type": "Person",
      "name": post.author_name,
      "url": "https://pixelisolate.online"
    }],
    "publisher": {
      "@type": "Organization",
      "name": "PixelIsolate",
      "logo": {
        "@type": "ImageObject",
        "url": "https://pixelisolate.online/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://pixelisolate.online/blog/${post.slug}`
    }
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-gray-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      <article className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header Toolbar */}
        <div className="space-y-6 border-b border-gray-850 pb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={onBackToBlog}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gray-950 hover:bg-gray-900 border border-gray-850 text-xs font-mono text-gray-400 hover:text-emerald-400 transition cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Blog</span>
            </button>

            {/* Author / Admin Toolbar */}
            {canEdit && (
              <div className="flex items-center gap-2 bg-gray-950/80 p-1.5 rounded-xl border border-gray-800">
                <button
                  type="button"
                  onClick={() => onOpenEditPost && onOpenEditPost(post)}
                  className="px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 text-[10px] font-mono text-emerald-400 transition flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit Article</span>
                </button>
                {isAdminOrMod && (
                  <>
                    <button
                      type="button"
                      onClick={handleTogglePublish}
                      className="px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 text-[10px] font-mono text-gray-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
                    >
                      {post.is_published ? <EyeOff className="h-3.5 w-3.5 text-amber-400" /> : <Eye className="h-3.5 w-3.5 text-emerald-400" />}
                      <span>{post.is_published ? "Unpublish" : "Publish"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPostDeleteModal(true)}
                      className="px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 text-[10px] font-mono text-red-400 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <span className="inline-block px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
              {post.category}
            </span>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {post.title}
            </h1>
            <p className="text-base sm:text-lg text-gray-400 leading-relaxed font-sans">
              {post.excerpt}
            </p>
          </div>

          {/* Author, Meta & Upvote Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs font-mono text-gray-400">
            <div className="flex items-center gap-3">
              <img
                src={post.author_avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${post.author_name}`}
                alt={post.author_name}
                className="w-9 h-9 rounded-full object-cover border border-emerald-500/40"
              />
              <div>
                <p className="font-bold text-gray-200">{post.author_name}</p>
                <p className="text-[10px] text-gray-500">Community Contributor</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-gray-500">
              {/* Upvote Button */}
              <button
                type="button"
                onClick={handleUpvote}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                  isUpvoted
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold"
                    : "bg-gray-950 hover:bg-gray-900 text-gray-300 border-gray-800"
                }`}
              >
                <ThumbsUp className={`h-3.5 w-3.5 ${isUpvoted ? "fill-current text-emerald-400" : ""}`} />
                <span>{post.upvotes_count || 0} Upvotes</span>
              </button>

              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {post.reading_time_minutes} min read
              </span>

              {/* Social Share Button */}
              <button
                onClick={() => setShareModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white transition cursor-pointer"
                title="Share Article to Social Media"
              >
                <Share2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Featured Cover Image */}
        <div className="w-full h-64 sm:h-96 rounded-2xl overflow-hidden border border-gray-850 bg-gray-950 shadow-2xl">
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Article Content */}
          <div className="lg:col-span-8 space-y-8">
            {renderMarkdownContent(post.content)}

            {/* Embedded Conversion CTA */}
            <BlogCTA onOpenAuth={onOpenAuth} onGoToWorkspace={onGoToWorkspace} />

            {/* Comments Section */}
            <div className="pt-8 border-t border-gray-850 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-emerald-400" />
                  <span>Community Discussion ({comments.length})</span>
                </h3>
              </div>

              {/* Comment Input */}
              {user ? (
                <form onSubmit={handleAddComment} className="space-y-3 bg-gray-950/60 p-4 rounded-2xl border border-gray-850">
                  <div className="flex items-center gap-2">
                    <img
                      src={profile?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.id}`}
                      alt="User Avatar"
                      className="w-6 h-6 rounded-full object-cover border border-emerald-500/40"
                    />
                    <span className="text-xs font-mono font-bold text-gray-300">
                      {profile?.display_name || user.email?.split("@")[0]}
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add your thoughts, feedback, or Print-on-Demand questions..."
                    className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-xs font-sans text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingComment || !commentText.trim()}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs font-mono shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{isSubmittingComment ? "Posting..." : "Post Comment"}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 bg-gray-950/60 rounded-2xl border border-gray-850 text-center space-y-2 font-mono text-xs">
                  <p className="text-gray-400">Join the discussion to leave a comment and upvote articles.</p>
                  <button
                    onClick={onOpenAuth}
                    className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold hover:bg-emerald-500/20 transition cursor-pointer"
                  >
                    Sign In to Comment
                  </button>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-xs text-gray-500 font-mono italic">No comments yet. Be the first to start the discussion!</p>
                ) : (
                  comments.map((comment) => {
                    const isCommentAuthor = user && user.id === comment.user_id;
                    return (
                      <div key={comment.id} className="p-4 rounded-xl bg-gray-950/40 border border-gray-850/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={comment.user_avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${comment.user_name}`}
                              alt={comment.user_name}
                              className="w-6 h-6 rounded-full object-cover border border-gray-800"
                            />
                            <span className="text-xs font-mono font-bold text-gray-200">{comment.user_name}</span>
                            <span className="text-[10px] font-mono text-gray-500">
                              {new Date(comment.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>

                          {(isCommentAuthor || isAdminOrMod) && (
                            <button
                              onClick={() => setCommentToDelete(comment.id)}
                              className="text-gray-500 hover:text-red-400 transition cursor-pointer"
                              title="Delete Comment"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed font-sans pl-8">
                          {comment.content}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Sidebar / Table of Contents */}
          <div className="lg:col-span-4 space-y-6">
            {toc.length > 0 && (
              <div className="sticky top-24 bg-gray-950/70 border border-gray-850 p-5 rounded-2xl backdrop-blur-md space-y-4">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-gray-300 border-b border-gray-900 pb-3">
                  <List className="h-4 w-4 text-emerald-400" />
                  <span>Table of Contents</span>
                </div>
                <nav className="space-y-2 font-mono text-xs">
                  {toc.map((item, i) => (
                    <a
                      key={i}
                      href={`#${item.id}`}
                      className={`block text-gray-400 hover:text-emerald-400 transition-colors line-clamp-1 ${
                        item.level === 2 ? "pl-0 font-semibold" : "pl-3 text-[11px]"
                      }`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}
          </div>
        </div>

      </article>

      {/* Social Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title={post.title}
        url={window.location.href}
      />

      {/* Delete Comment Modal */}
      <ConfirmDeleteModal
        isOpen={!!commentToDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        onConfirm={handleConfirmDeleteComment}
        onCancel={() => setCommentToDelete(null)}
      />

      {/* Delete Post Modal */}
      <ConfirmDeleteModal
        isOpen={showPostDeleteModal}
        title="Delete Article"
        message={`Are you sure you want to permanently delete "${post.title}"?`}
        onConfirm={handleConfirmDeletePost}
        onCancel={() => setShowPostDeleteModal(false)}
        isDeleting={isDeletingPost}
      />
    </div>
  );
};

export default BlogPostDetail;
