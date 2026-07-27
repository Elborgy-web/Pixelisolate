import React, { useState, useEffect } from "react";
import { getPostBySlug, BlogPost } from "../lib/blog";
import { BlogCTA } from "./BlogCTA";
import { ArrowLeft, Calendar, Clock, User, Share2, Check, List, Sparkles } from "lucide-react";

interface BlogPostDetailProps {
  slug: string;
  onBackToBlog: () => void;
  onOpenAuth?: () => void;
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
  onOpenAuth,
  onGoToWorkspace
}) => {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [toc, setToc] = useState<TocItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getPostBySlug(slug).then(data => {
      if (isMounted) {
        setPost(data);
        setIsLoading(false);

        if (data) {
          // Parse Table of Contents from markdown headings (#, ##, ###)
          const lines = data.content.split("\n");
          const items: TocItem[] = [];
          lines.forEach(line => {
            const match = line.match(/^(#{1,3})\s+(.+)$/);
            if (match) {
              const level = match[1].length;
              const text = match[2].trim();
              const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
              items.push({ id, text, level });
            }
          });
          setToc(items);

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
      }
    });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Convert Markdown content into HTML blocks
  const renderMarkdownContent = (content: string) => {
    const paragraphs = content.split(/\n\n+/);
    return paragraphs.map((block, idx) => {
      const trimmed = block.trim();
      
      // H1 Header
      if (trimmed.startsWith("# ")) {
        const text = trimmed.replace(/^#\s+/, "");
        const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
        return (
          <h1 key={idx} id={id} className="text-2xl sm:text-3xl font-extrabold text-white mt-8 mb-4 tracking-tight">
            {text}
          </h1>
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
        const items = trimmed.split("\n").map(l => l.replace(/^[*|-]\s+/, ""));
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
        const items = trimmed.split("\n").map(l => l.replace(/^\d+\.\s+/, ""));
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

  // Inline formatting helper for bold, code, links
  const formatInlineMarkdown = (text: string) => {
    // Bold **text**
    const parts = text.split(/(\*\*.*?\*\*|\`.*?\`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      }
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

  // BlogPosting JSON-LD Schema for Google Rich Snippets
  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.meta_description || post.excerpt,
    "image": [post.cover_image],
    "datePublished": post.published_at,
    "author": [{
      "@type": "Organization",
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
      {/* Inject JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      <article className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="space-y-6 border-b border-gray-850 pb-8">
          <button
            onClick={onBackToBlog}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gray-950 hover:bg-gray-900 border border-gray-850 text-xs font-mono text-gray-400 hover:text-emerald-400 transition cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Blog</span>
          </button>

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

          {/* Author & Meta Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs font-mono text-gray-400">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-400">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-gray-200">{post.author_name}</p>
                <p className="text-[10px] text-gray-500">Author & Editorial Team</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {post.reading_time_minutes} min read
              </span>
              <button
                onClick={handleShare}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 hover:text-white transition cursor-pointer"
                title="Copy Article Link"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied!" : "Share"}</span>
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

        {/* Content Layout with Table of Contents & Article Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Article Content */}
          <div className="lg:col-span-8 space-y-6">
            {renderMarkdownContent(post.content)}

            {/* Embedded Conversion CTA */}
            <BlogCTA onOpenAuth={onOpenAuth} onGoToWorkspace={onGoToWorkspace} />
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
    </div>
  );
};

export default BlogPostDetail;
