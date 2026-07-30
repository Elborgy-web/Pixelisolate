import React, { useState, useEffect, useRef } from "react";
import { X, PenTool, Sparkles, Image as ImageIcon, Send, FileText, Save, Check, AlertCircle, Loader2 } from "lucide-react";
import { createPost, updatePost, BlogPost } from "../lib/blog";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  profile: any;
  postToEdit?: BlogPost | null;
  onPostSaved: (post: BlogPost) => void;
}

const CATEGORIES = ["POD Tips", "E-Commerce", "AI Tools", "Tutorials", "Design & Printing"];
const MAX_COVER_SIZE_BYTES = 2 * 1024 * 1024; // 2MB strict limit

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  user,
  profile,
  postToEdit = null,
  onPostSaved,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState(postToEdit?.title || "");
  const [category, setCategory] = useState(postToEdit?.category || "POD Tips");
  const [excerpt, setExcerpt] = useState(postToEdit?.excerpt || "");
  const [coverImage, setCoverImage] = useState(postToEdit?.cover_image || "");
  const [content, setContent] = useState(postToEdit?.content || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImageError(null);
    if (postToEdit) {
      setTitle(postToEdit.title);
      setCategory(postToEdit.category);
      setExcerpt(postToEdit.excerpt);
      setCoverImage(postToEdit.cover_image);
      setContent(postToEdit.content);
    } else {
      setTitle("");
      setCategory("POD Tips");
      setExcerpt("");
      setCoverImage("");
      setContent("");
    }
  }, [postToEdit, isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);

    // 1. Enforce strict 2MB limit
    if (file.size > MAX_COVER_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setImageError(`Cover image file size exceeds the 2MB limit (selected file is ${sizeMB}MB). Please select an image under 2MB.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 2. Compress and downscale image to max 1200px for instant DB query performance
    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (!evt.target?.result) {
        setIsCompressing(false);
        return;
      }

      const img = new Image();
      img.src = evt.target.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.82);
          setCoverImage(compressed);
        } else {
          setCoverImage(evt.target.result as string);
        }
        setIsCompressing(false);
      };
      img.onerror = () => {
        setImageError("Failed to load image file. Please try another image.");
        setIsCompressing(false);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageError || isCompressing) return;
    if (!title.trim() || !excerpt.trim() || !content.trim()) return;

    setIsSubmitting(true);

    const postPayload = {
      title: title.trim(),
      category,
      excerpt: excerpt.trim(),
      cover_image: coverImage.trim() || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
      content: content.trim(),
    };

    try {
      let result: BlogPost | null = null;
      if (postToEdit) {
        result = await updatePost(postToEdit.id, postPayload);
      } else {
        result = await createPost(postPayload, user, profile);
      }

      setIsSubmitting(false);
      if (result) {
        onPostSaved(result);
      }
      onClose();
    } catch (err) {
      console.error("Failed to save post:", err);
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
              <h3 className="text-lg font-bold text-white tracking-tight">
                {postToEdit ? "Edit Community Article" : "Write Community Article"}
              </h3>
              <p className="text-xs text-gray-500 font-mono">
                {postToEdit ? "Update your title, artwork, and article body" : "Publish your guide, workflow tips & background isolation case study"}
              </p>
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

          {/* Cover Image URL & File Upload */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-mono text-gray-400 uppercase">Cover Image (Strict 2MB Limit)</label>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">Max size: 2MB • Auto-optimized</span>
            </div>

            {/* Explicit 2MB Limit Note */}
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-300 text-xs font-mono flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Note:</strong> Cover image files must not exceed <strong>2MB</strong>. Files over 2MB will be rejected to ensure fast page loading.
              </span>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isCompressing}
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isCompressing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                <span>{isCompressing ? "Processing..." : "Browse Image"}</span>
              </button>
              <input
                type="text"
                value={coverImage.startsWith("data:") ? "[Local Image File Selected]" : coverImage}
                onChange={(e) => {
                  const val = e.target.value;
                  setImageError(null);
                  if (val.length > 2800000) {
                    setImageError("Pasted image data exceeds 2MB limit. Please select a smaller file.");
                    return;
                  }
                  setCoverImage(val);
                }}
                placeholder="or paste Image URL..."
                className="flex-1 px-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 truncate"
              />
            </div>

            {/* Image Upload Error Alert */}
            {imageError && (
              <div className="mt-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-medium flex items-center gap-2 animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{imageError}</span>
              </div>
            )}

            {/* Live Cover Preview */}
            {coverImage && !imageError && (
              <div className="mt-2 relative w-full h-32 rounded-xl overflow-hidden border border-gray-800 bg-gray-900">
                <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-gray-950/80 text-[10px] font-mono text-emerald-400 font-bold">Cover Preview</span>
              </div>
            )}
          </div>

          {/* Article Content (Markdown) */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-mono text-gray-400 uppercase">Article Body (Markdown Supported) *</label>
              <span className="text-[10px] font-mono text-emerald-400"># Heading 1, ## Heading 2, **Bold**, [Link Text](https://...)</span>
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
              Author: <strong className="text-gray-300">{postToEdit ? postToEdit.author_name : (profile?.display_name || user?.email?.split("@")[0])}</strong>
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
                {postToEdit ? <Save className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                <span>{isSubmitting ? "Saving..." : postToEdit ? "Save Changes" : "Publish Article"}</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};

export default CreatePostModal;
