import React from "react";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

interface BlogCTAProps {
  onOpenAuth?: () => void;
  onGoToWorkspace?: () => void;
}

export const BlogCTA: React.FC<BlogCTAProps> = ({ onOpenAuth, onGoToWorkspace }) => {
  const handleClick = () => {
    if (onGoToWorkspace) {
      onGoToWorkspace();
    } else if (onOpenAuth) {
      onOpenAuth();
    } else {
      window.location.href = "/?action=signup";
    }
  };

  return (
    <div className="my-8 p-6 md:p-8 bg-gradient-to-br from-gray-900 via-gray-950 to-emerald-950/40 rounded-2xl border border-emerald-500/30 shadow-2xl relative overflow-hidden group">
      {/* Glow effect background */}
      <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <span>Zero-Halo Guarantee</span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Stop getting white halos on dark shirts.
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed font-sans">
            Try PixelIsolate with <strong className="text-emerald-400 font-semibold">10 Free HD Credits</strong> — subpixel chroma keying and neural AI matting directly inside your browser. No credit card required.
          </p>
          <div className="flex items-center gap-4 text-xs font-mono text-gray-400 pt-1">
            <span className="flex items-center gap-1 text-gray-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              AES-256 Client-Side Encrypted
            </span>
            <span>•</span>
            <span>100% On-Device Privacy</span>
          </div>
        </div>

        <div className="w-full md:w-auto shrink-0">
          <button
            onClick={handleClick}
            className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer group/btn"
          >
            <span>Get 10 Free HD Credits</span>
            <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlogCTA;
