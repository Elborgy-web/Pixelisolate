import React, { useState, useEffect } from "react";
import { getPublishedPosts, BlogPost } from "../lib/blog";
import { Search, Clock, Calendar, ArrowRight, Tag, Sparkles, BookOpen } from "lucide-react";

interface BlogIndexProps {
  onSelectPost: (slug: string) => void;
  onOpenAuth?: () => void;
}

const CATEGORIES = ["All", "POD Tips", "E-Commerce", "AI Tools", "Tutorials"];

export const BlogIndex: React.FC<BlogIndexProps> = ({ onSelectPost, onOpenAuth }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getPublishedPosts(selectedCategory, searchQuery).then(data => {
      if (isMounted) {
        setPosts(data);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#07080a] text-gray-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
            <BookOpen className="h-3.5 w-3.5" />
            <span>PixelIsolate Knowledge Hub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            PixelIsolate Blog: Print-on-Demand & AI Design Guides
          </h1>
          <p className="text-base sm:text-lg text-gray-400 font-sans leading-relaxed">
            Expert tutorials on background removal, subpixel chroma keying, eliminating white print halos, and scaling e-commerce photography.
          </p>
        </div>

        {/* Filters & Search Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-950/60 p-4 rounded-2xl border border-gray-850 backdrop-blur-md">
          {/* Category Badges */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {CATEGORIES.map(cat => (
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
              placeholder="Search articles..."
              className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Posts Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
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
            {posts.map(post => (
              <article
                key={post.slug}
                onClick={() => onSelectPost(post.slug)}
                className="group flex flex-col justify-between bg-gray-950/70 hover:bg-gray-900/80 border border-gray-850 hover:border-emerald-500/40 rounded-2xl p-5 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-emerald-500/5 cursor-pointer overflow-hidden"
              >
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

                  {/* Meta Details */}
                  <div className="flex items-center gap-4 text-[11px] font-mono text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.reading_time_minutes} min read
                    </span>
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

                {/* Card Footer */}
                <div className="pt-4 mt-6 border-t border-gray-900 flex items-center justify-between font-mono text-xs text-emerald-400 font-bold">
                  <span>Read Article</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </article>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default BlogIndex;
