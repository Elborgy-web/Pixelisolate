import React, { useState } from "react";
import { X, Copy, Check, Code, Sparkles } from "lucide-react";

interface EmbedBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmbedBadgeModal({ isOpen, onClose }: EmbedBadgeModalProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const badges = [
    {
      title: "Dark Badge (Recommended)",
      description: "Sleek dark mode badge with emerald accent.",
      previewHtml: (
        <a
          href="https://pixelisolate.online/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-950 border border-emerald-500/30 rounded-lg text-gray-100 font-sans text-xs text-decoration-none font-semibold hover:border-emerald-500/60 transition"
        >
          <span className="text-emerald-400">✦</span> Powered by <span className="text-emerald-400">Pixel Isolate AI</span>
        </a>
      ),
      code: `<a href="https://pixelisolate.online/" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:#030712;border:1px solid rgba(16,185,129,0.3);border-radius:8px;color:#f3f4f6;font-family:sans-serif;font-size:12px;text-decoration:none;font-weight:600;"><span style="color:#10b981;">✦</span> Powered by <span style="color:#10b981;">Pixel Isolate AI</span></a>`
    },
    {
      title: "Minimal Link Badge",
      description: "Clean inline hyperlink badge for articles & blogs.",
      previewHtml: (
        <a
          href="https://pixelisolate.online/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-400 font-sans text-xs font-semibold hover:underline"
        >
          Background Removed by Pixel Isolate AI ⚡
        </a>
      ),
      code: `<a href="https://pixelisolate.online/" target="_blank" rel="noopener" style="color:#10b981;font-family:sans-serif;font-size:12px;text-decoration:none;font-weight:600;">Background Removed by Pixel Isolate AI ⚡</a>`
    },
    {
      title: "Logo Icon Badge",
      description: "Pill badge featuring the Pixel Isolate logo image.",
      previewHtml: (
        <a
          href="https://pixelisolate.online/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-1 bg-gray-900 border border-gray-800 rounded-full text-xs font-semibold text-gray-200"
        >
          <img src="/logo.png" alt="Pixel Isolate" className="h-4 w-4 rounded-full object-cover" />
          <span>Pixel Isolate AI</span>
        </a>
      ),
      code: `<a href="https://pixelisolate.online/" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;padding:4px 12px;background:#111827;border:1px solid #1f2937;border-radius:9999px;color:#e5e7eb;font-family:sans-serif;font-size:12px;text-decoration:none;font-weight:600;"><img src="https://pixelisolate.online/logo.png" alt="Pixel Isolate" style="height:16px;width:16px;border-radius:9999px;" /><span>Pixel Isolate AI</span></a>`
    }
  ];

  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Code className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Embed "Powered by Pixel Isolate" Widget
              </h2>
              <p className="text-xs text-gray-400">
                Copy HTML code to embed a badge on your site or blog.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Badge Options */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {badges.map((badge, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-gray-950/60 border border-gray-800 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">{badge.title}</h3>
                  <p className="text-xs text-gray-400">{badge.description}</p>
                </div>
                <div className="p-2 bg-gray-900/80 rounded-lg border border-gray-800">
                  {badge.previewHtml}
                </div>
              </div>

              <div className="relative flex items-center">
                <input
                  type="text"
                  readOnly
                  value={badge.code}
                  className="w-full px-3 py-2 pr-24 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 font-mono text-[11px] select-all focus:outline-none"
                />
                <button
                  onClick={() => handleCopy(badge.code, idx)}
                  className="absolute right-1.5 px-3 py-1 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
            <Sparkles className="h-4 w-4" />
            <span>Passes high-authority DoFollow backlinks to your site</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
