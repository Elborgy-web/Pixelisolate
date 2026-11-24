import React from "react";
import { Sparkles, ArrowRight, ShieldCheck, Tag } from "lucide-react";
import { trackConversionEvent } from "../utils/attribution";

interface BlogCTAProps {
  topic?: "upscaler" | "ecommerce" | "bg-remover";
  onOpenAuth?: () => void;
  onGoToWorkspace?: () => void;
  onGoToUpscaler?: () => void;
  onGoToPricing?: () => void;
}

export const BlogCTA: React.FC<BlogCTAProps> = ({
  topic = "bg-remover",
  onOpenAuth,
  onGoToWorkspace,
  onGoToUpscaler,
  onGoToPricing,
}) => {
  const isUpscaler = topic === "upscaler";
  const primaryHref = isUpscaler
    ? "/image-upscaler?source=organic&utm_campaign=blog_cta"
    : "/background-remover?source=organic&utm_campaign=blog_cta";
  const pricingHref = "/pricing?source=organic&utm_campaign=blog_cta";

  const handlePrimaryClick = (e: React.MouseEvent) => {
    trackConversionEvent("blog_hard_cta_click", {
      target: isUpscaler ? "image_upscaler" : "background_remover",
      topic,
    });
    if (isUpscaler && onGoToUpscaler) {
      e.preventDefault();
      onGoToUpscaler();
    } else if (!isUpscaler && onGoToWorkspace) {
      e.preventDefault();
      onGoToWorkspace();
    } else if (onOpenAuth) {
      e.preventDefault();
      onOpenAuth();
    }
  };

  const handlePricingClick = (e: React.MouseEvent) => {
    trackConversionEvent("blog_hard_cta_click", { target: "pricing", topic });
    if (onGoToPricing) {
      e.preventDefault();
      onGoToPricing();
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
            <span>{isUpscaler ? "8K 300 DPI Print-Ready" : "Zero-Halo Guarantee"}</span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            {isUpscaler
              ? "Upscale your artwork to crisp 8K 300 DPI print files."
              : "Stop getting white halos on dark shirts."}
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed font-sans">
            Start with <strong className="text-emerald-400 font-semibold">10 free credits — no credit card required</strong>. Run on-device AI background removal, HSV chroma keying, and 8K Real-ESRGAN upscaling directly in your browser.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-gray-400 pt-1">
            <span className="flex items-center gap-1 text-gray-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              AES-256 Client-Side Encrypted
            </span>
            <span>•</span>
            <span>100% On-Device Privacy</span>
          </div>
        </div>

        <div className="w-full md:w-auto shrink-0 flex flex-col gap-2.5">
          <a
            href={primaryHref}
            onClick={handlePrimaryClick}
            className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer group/btn"
          >
            <span>{isUpscaler ? "Try 8K Upscaler Free" : "Try Background Remover Free"}</span>
            <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
          </a>
          <a
            href={pricingHref}
            onClick={handlePricingClick}
            className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-gray-900/90 hover:bg-gray-800 border border-gray-700 text-emerald-400 font-semibold text-xs transition flex items-center justify-center gap-1.5"
          >
            <Tag className="h-3.5 w-3.5" />
            <span>Compare Plans &amp; $5 Credit Bundles</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default BlogCTA;
