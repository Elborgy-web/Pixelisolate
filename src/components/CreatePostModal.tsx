import React, { useState } from "react";
import { X, PenTool, Sparkles, Image as ImageIcon, Send, FileText } from "lucide-react";
import { createPost, BlogPost } from "../lib/blog";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  profile: any;
  onPostCreated: (newPost: BlogPost) => void;
}

const CATEGORIES = ["POD Tips", "E-Commerce", "AI Tools", "Tutorials", "Design & Printing"];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  user,
  profile,
  onPostCreated,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("POD Tips");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !excerpt.trim() || !content.trim()) return;

    setIsSubmitting(true);

    try {
      const created = await createPost(
        {
          title: title.trim(),
          category,
          excerpt: excerpt.trim(),
          cover_image: coverImage.trim() || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
          content: content.trim(),
        },
        user,
        profile
      );

      setIsSubmitting(false);
      onPostCreated(created);
      onClose();
    } catch (err) {
      console.error("Failed to create post:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-gray-950 border border-gray-850 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-900 pb-4 sticky top-0 bg-gray-950 z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <PenTool className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Write Community Blog Article</h3>
              <p className="text-xs text-gray-500 font-mono">Publish your guide, workflow tips & background isolation case study</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-900 hover:bg-gray-850 text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-mono text-gray-400 uppercase">Article Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Masterclass: Removing Transparent Glass Backgrounds"
                className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs font-sans text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-gray-400 uppercase">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Excerpt */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-gray-400 uppercase">Short Summary / Excerpt *</label>
            <input
              type="text"
              required
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A brief 1-2 sentence overview of what readers will learn..."
              className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs font-sans text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Cover Image URL */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-gray-400 uppercase">Cover Image URL (Optional)</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="flex-1 px-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Article Content (Markdown) */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-mono text-gray-400 uppercase">Article Body (Markdown Supported) *</label>
              <span className="text-[10px] font-mono text-emerald-400"># Heading 1, ## Heading 2, **Bold**</span>
            </div>
            <textarea
              required
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`# Your Article Heading\n\nWrite your article here. You can use markdown headings, lists, and bold text.\n\n## Subheading\n* Tip 1: Use 1px erosion for dark apparel\n* Tip 2: Use AI Magic for messy hair`}
              className="w-full p-4 bg-gray-900 border border-gray-800 rounded-xl text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 leading-relaxed resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-gray-900 flex items-center justify-between">
            <span className="text-[10px] font-mono text-gray-500">
              Posting as: <strong className="text-gray-300">{profile?.display_name || user?.email?.split("@")[0]}</strong>
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-850 text-xs font-mono text-gray-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs font-mono shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 cursor-pointer"
              >
                <Send className="h-4 w-4" />
                <span>{isSubmitting ? "Publishing..." : "Publish Article"}</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};

export default CreatePostModal;
