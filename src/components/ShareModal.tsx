import React, { useState } from "react";
import { X, Share2, Copy, Check, ExternalLink } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  title,
  url,
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    {
      name: "Facebook",
      icon: "🌐",
      color: "from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600",
      link: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: "X (Twitter)",
      icon: "𝕏",
      color: "from-gray-800 to-gray-950 hover:from-gray-700 hover:to-gray-900 border border-gray-700",
      link: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      name: "Reddit",
      icon: "🤖",
      color: "from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500",
      link: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    },
  ];

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-md bg-gray-950 border border-gray-850 rounded-2xl p-6 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-900 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Share Article</h3>
              <p className="text-[11px] text-gray-500 font-mono line-clamp-1">{title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-900 hover:bg-gray-850 text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Social Buttons */}
        <div className="grid grid-cols-3 gap-3">
          {shareLinks.map((item) => (
            <a
              key={item.name}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-3.5 rounded-xl bg-gradient-to-br ${item.color} text-white font-mono text-xs font-bold flex flex-col items-center justify-center gap-2 shadow-lg transition cursor-pointer group`}
            >
              <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
              <span>{item.name}</span>
            </a>
          ))}
        </div>

        {/* Copy Direct Link */}
        <div className="space-y-2 pt-2 border-t border-gray-900">
          <label className="block text-[10px] font-mono text-gray-400 uppercase">Direct Article Link</label>
          <div className="flex items-center gap-2 bg-gray-900 p-2 rounded-xl border border-gray-800">
            <input
              type="text"
              readOnly
              value={url}
              className="flex-1 bg-transparent text-xs font-mono text-gray-300 focus:outline-none truncate px-1"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ShareModal;
