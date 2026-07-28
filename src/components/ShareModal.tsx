import React, { useState } from "react";
import { X, Share2, Copy, Check } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

const FacebookIcon = () => (
  <svg className="w-5 h-5 fill-current text-white shrink-0" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const XTwitterIcon = () => (
  <svg className="w-4 h-4 fill-current text-white shrink-0" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const RedditIcon = () => (
  <svg className="w-5 h-5 fill-current text-white shrink-0" viewBox="0 0 24 24">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 3.314 1.344 6.315 3.516 8.484l-1.391 3.565a.5.5 0 00.648.648l3.565-1.391C8.502 23.36 10.203 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm6.657 14.538c.17.376.082.822-.224 1.107-1.12 1.042-2.775 1.625-4.433 1.625s-3.313-.583-4.433-1.625a.952.952 0 01-.224-1.107c.106-.238.328-.403.585-.434.258-.03.51.077.671.282.794.74 2.052 1.134 3.401 1.134s2.607-.394 3.401-1.134a.798.798 0 01.671-.282c.257.031.479.196.585.434zM9.25 12a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm5.5 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z"/>
  </svg>
);

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
      icon: <FacebookIcon />,
      color: "from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 shadow-blue-500/20",
      link: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: "X (Twitter)",
      icon: <XTwitterIcon />,
      color: "from-gray-800 to-gray-950 hover:from-gray-700 hover:to-gray-900 border border-gray-700 shadow-black/40",
      link: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      name: "Reddit",
      icon: <RedditIcon />,
      color: "from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 shadow-orange-500/20",
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
              className={`p-3.5 rounded-xl bg-gradient-to-br ${item.color} text-white font-mono text-xs font-bold flex flex-col items-center justify-center gap-2.5 shadow-lg transition cursor-pointer group`}
            >
              <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
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
