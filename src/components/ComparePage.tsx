import React, { useEffect } from "react";
import { Check, X, ChevronRight, Sparkles, ArrowRight, ShieldCheck, Layers } from "lucide-react";
import { trackConversionEvent } from "../utils/attribution";

interface ComparePageProps {
  onGoToEditor: () => void;
  onGoToUpscaler: () => void;
  onGoToPricing: () => void;
}

const COMPARISON_ROWS = [
  {
    feature: "Starting Paid Price",
    pixelIsolate: "$5 one-time (100 credits) or $7.99/mo unlimited",
    removeBg: "$9/mo for 40 credits (~$0.23/image)",
    adobeExpress: "$9.99/mo subscription required for bulk/HD",
    canva: "$15/mo Canva Pro subscription",
  },
  {
    feature: "On-Device Local Processing (Privacy)",
    pixelIsolate: true,
    removeBg: false,
    adobeExpress: false,
    canva: false,
  },
  {
    feature: "32-Bit RGBA Alpha Channel Preservation",
    pixelIsolate: true,
    removeBg: true,
    adobeExpress: true,
    canva: "Limited (often clips soft edges)",
  },
  {
    feature: "POD White-Halo Erosion & Decontamination",
    pixelIsolate: "Tunable subpixel erosion, dilation & dark-shirt preview",
    removeBg: "Auto-only (no edge erosion slider)",
    adobeExpress: "Basic cutout only",
    canva: "Basic auto cutout only",
  },
  {
    feature: "Integrated 8K Real-ESRGAN Upscaler (300 DPI)",
    pixelIsolate: "Included in Pro (4K & 8K + alpha preservation)",
    removeBg: false,
    adobeExpress: false,
    canva: false,
  },
  {
    feature: "Parallel Bulk Processing (50+ Files → ZIP)",
    pixelIsolate: "50+ files in Pro (BG removal & 8K upscaling)",
    removeBg: "Desktop app / API (per-credit cost)",
    adobeExpress: "Up to 25 files (paid)",
    canva: "Manual per design",
  },
  {
    feature: "HSV Chroma Keying + Flood Protection",
    pixelIsolate: "Yes (protects interior whites on logos)",
    removeBg: false,
    adobeExpress: false,
    canva: false,
  },
  {
    feature: "Free Tier (No Credit Card)",
    pixelIsolate: "10 free credits + 3 full-HD trial exports",
    removeBg: "1 HD credit (500px previews only)",
    adobeExpress: "Limited exports with Adobe account",
    canva: "BG Remover locked behind Pro",
  },
];

function renderCell(val: string | boolean, isHighlight = false) {
  if (val === true) {
    return (
      <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
        <Check className="h-4 w-4 shrink-0" />
        <span>Yes</span>
      </span>
    );
  }
  if (val === false) {
    return (
      <span className="inline-flex items-center gap-1.5 text-gray-500">
        <X className="h-4 w-4 shrink-0 text-rose-400/70" />
        <span>No</span>
      </span>
    );
  }
  return (
    <span className={isHighlight ? "text-white font-semibold" : "text-gray-300"}>
      {val}
    </span>
  );
}

export default function ComparePage({
  onGoToEditor,
  onGoToUpscaler,
  onGoToPricing,
}: ComparePageProps) {
  useEffect(() => {
    document.title = "PixelIsolate vs remove.bg, Adobe Express & Canva | Compare";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Compare PixelIsolate vs remove.bg, Adobe Express, and Canva on price, local WebAssembly privacy, alpha preservation, bulk queues, and 8K POD upscaling."
      );
    }
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-8 sm:py-12 space-y-14">
      {/* Visible Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs font-mono text-gray-400"
      >
        <a href="/" className="hover:text-emerald-400 transition">
          Home
        </a>
        <ChevronRight className="h-3.5 w-3.5 text-gray-600" />
        <span className="text-emerald-400 font-semibold">Compare Alternatives</span>
      </nav>

      {/* Hero */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
          <Layers className="h-3.5 w-3.5" />
          Honest Tool Comparison
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          PixelIsolate vs remove.bg vs Adobe Express vs Canva
        </h1>
        <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
          Most background removers charge per-image cloud fees and leave frosty white edge halos on
          dark t-shirts. Compare pricing, privacy, alpha channel fidelity, and print-on-demand
          features side by side.
        </p>
      </section>

      {/* Comparison Table */}
      <section className="rounded-2xl border border-gray-800 bg-gray-950/60 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80 font-mono text-xs">
                <th className="p-4 text-gray-400 font-semibold">Capability</th>
                <th className="p-4 text-emerald-400 font-bold bg-emerald-500/10 border-x border-emerald-500/20">
                  PixelIsolate
                </th>
                <th className="p-4 text-gray-300 font-semibold">remove.bg</th>
                <th className="p-4 text-gray-300 font-semibold">Adobe Express</th>
                <th className="p-4 text-gray-300 font-semibold">Canva Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/80">
              {COMPARISON_ROWS.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-900/40 transition">
                  <td className="p-4 font-semibold text-white whitespace-nowrap">{row.feature}</td>
                  <td className="p-4 bg-emerald-500/[0.04] border-x border-emerald-500/15">
                    {renderCell(row.pixelIsolate, true)}
                  </td>
                  <td className="p-4">{renderCell(row.removeBg)}</td>
                  <td className="p-4">{renderCell(row.adobeExpress)}</td>
                  <td className="p-4">{renderCell(row.canva)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Why POD & E-Commerce Teams Switch */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-gray-950/60 border border-gray-800 space-y-2">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">Zero Cloud Uploads</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Background isolation runs locally in your browser via WebAssembly &amp; WebGPU. Client
            artwork and unreleased product catalogs never touch third-party training servers.
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-gray-950/60 border border-gray-800 space-y-2">
          <Sparkles className="h-5 w-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">Built for Dark Garment DTG/DTF</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Adjust morphological erosion, dilation, and feathering sliders with a live dark-shirt
            preview so RIP white underbase ink never creates frosty outlines.
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-gray-950/60 border border-gray-800 space-y-2">
          <Layers className="h-5 w-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">Isolate + Upscale to 8K in One Place</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Stop paying for separate background remover and upscaler subscriptions. Pro ($7.99/mo)
            bundles unlimited cutouts, 8K Real-ESRGAN upscaling, and 50+ bulk queues.
          </p>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="p-8 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-gray-900 to-gray-950 border border-emerald-500/30 text-center space-y-5">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          Test PixelIsolate Free With 10 Credits
        </h2>
        <p className="text-sm text-gray-300 max-w-2xl mx-auto">
          Run your toughest dark-shirt graphic or product photo through our background remover and
          8K upscaler — no credit card required.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="/background-remover?source=organic&utm_campaign=compare_page"
            onClick={(e) => {
              e.preventDefault();
              trackConversionEvent("compare_cta_click", { target: "background_remover" });
              onGoToEditor();
            }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm transition inline-flex items-center gap-2"
          >
            <span>Try Background Remover Free</span>
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="/image-upscaler?source=organic&utm_campaign=compare_page"
            onClick={(e) => {
              e.preventDefault();
              trackConversionEvent("compare_cta_click", { target: "image_upscaler" });
              onGoToUpscaler();
            }}
            className="px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold text-xs sm:text-sm transition"
          >
            Try 8K Upscaler
          </a>
          <a
            href="/pricing?source=organic&utm_campaign=compare_page"
            onClick={(e) => {
              e.preventDefault();
              trackConversionEvent("compare_cta_click", { target: "pricing" });
              onGoToPricing();
            }}
            className="px-6 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 border border-emerald-500/30 text-emerald-400 font-semibold text-xs sm:text-sm transition"
          >
            View Pricing Plans
          </a>
        </div>
      </section>
    </div>
  );
}
