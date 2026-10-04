import React, { useState, useEffect } from "react";
import { 
  Zap, 
  Sparkles, 
  Layers, 
  History, 
  ArrowRight, 
  Check, 
  Sliders, 
  Coins, 
  Play, 
  CheckCircle, 
  Loader2, 
  HelpCircle,
  FileCheck,
  FolderArchive,
  Code
} from "lucide-react";

interface LandingPageProps {
  onOpenAuth: () => void;
  onOpenEmbedBadge?: () => void;
  onGoToUpscaler?: () => void;
  onGoToEditor?: () => void;
  intent?: "general" | "background-remover" | "image-upscaler" | "pod-background-remover" | "bulk-background-remover" | "remove-white-background" | "transparent-png-maker";
}

export default function LandingPage({ onOpenAuth, onOpenEmbedBadge, onGoToUpscaler, onGoToEditor, intent = "general" }: LandingPageProps) {
  // Simulator State
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [simulatedBgType, setSimulatedBgType] = useState<"solid" | "transparent">("solid");
  const [simulatedBgColor, setSimulatedBgColor] = useState<"#00FF00" | "#FF00FF" | "#00FFFF">("#00FF00");
  const [simulatedErosion, setSimulatedErosion] = useState<number>(0);
  const [simulatedBlur, setSimulatedBlur] = useState<number>(0);

  // Hero Proof Widget State
  const [proofTab, setProofTab] = useState<"pod" | "hair" | "upscale">(
    intent === "image-upscaler" ? "upscale" : intent === "pod-background-remover" || intent === "remove-white-background" ? "pod" : "pod"
  );
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isHoveringProof, setIsHoveringProof] = useState<boolean>(false);

  // AI Magic Simulator State
  const [magicPreset, setMagicPreset] = useState<"model" | "sneaker">("model");
  const [magicMode, setMagicMode] = useState<"chroma" | "magic">("magic");
  const [magicInvert, setMagicInvert] = useState<boolean>(false);
  const [magicBg, setMagicBg] = useState<"transparent" | "green" | "magenta" | "black">("transparent");
  const [magicLoading, setMagicLoading] = useState<boolean>(false);

  useEffect(() => {
    if (magicMode === "magic") {
      setMagicLoading(true);
      const timer = setTimeout(() => {
        setMagicLoading(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [magicMode, magicPreset]);

  // Bulk Simulator state
  const [bulkStatus, setBulkStatus] = useState<"ready" | "processing" | "completed">("ready");
  const [bulkProgress, setBulkProgress] = useState<number>(0);
  const [bulkItems, setBulkItems] = useState([
    { id: 1, name: "brand_logo_vintage.png", status: "ready" },
    { id: 2, name: "sneaker_mockup_red.jpg", status: "ready" },
    { id: 3, name: "team_portrait_studio.png", status: "ready" },
    { id: 4, name: "icon_set_monochrome.webp", status: "ready" },
  ]);

  useEffect(() => {
    let interval: any;
    if (bulkStatus === "processing") {
      setBulkProgress(0);
      setBulkItems(prev => prev.map(item => ({ ...item, status: "isolating" })));
      
      interval = setInterval(() => {
        setBulkProgress(current => {
          if (current >= 100) {
            clearInterval(interval);
            setBulkStatus("completed");
            setBulkItems(prev => prev.map(item => ({ ...item, status: "completed" })));
            return 100;
          }
          const next = current + 5;
          // Progressively complete items
          if (next >= 25) setBulkItems(prev => prev.map(item => item.id === 1 ? { ...item, status: "completed" } : item));
          if (next >= 50) setBulkItems(prev => prev.map(item => item.id === 2 ? { ...item, status: "completed" } : item));
          if (next >= 75) setBulkItems(prev => prev.map(item => item.id === 3 ? { ...item, status: "completed" } : item));
          if (next >= 100) setBulkItems(prev => prev.map(item => item.id === 4 ? { ...item, status: "completed" } : item));
          return next;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [bulkStatus]);

  const handleRunBulk = () => {
    if (bulkStatus === "processing") return;
    setBulkStatus("processing");
  };

  const handleResetBulk = () => {
    setBulkStatus("ready");
    setBulkProgress(0);
    setBulkItems(prev => prev.map(item => ({ ...item, status: "ready" })));
  };

  // Mock Ingestion Preset
  const [selectedPreset, setSelectedPreset] = useState<"badge" | "sneaker">("badge");

  // Dynamic Intent Headers
  const getHeroContent = () => {
    switch (intent) {
      case "image-upscaler":
        return {
          badge: "8K AI Super-Resolution Engine",
          h1: "Upscale Images to 8K with Razor-Sharp Print Detail",
          p: "Transform low-resolution graphics and product photos into 300 DPI print-ready masterpieces. Powered by Real-ESRGAN Vulkan neural upscaling with alpha transparency preservation.",
          primaryCta: "Upscale Image to 8K Free",
          secondaryCta: "Remove Backgrounds"
        };
      case "pod-background-remover":
      case "remove-white-background":
        return {
          badge: "Print-on-Demand Specialist Engine",
          h1: "Eliminate White Halos on Dark Apparel & Merchandise",
          p: "Subpixel edge feathering and erosion tools specifically engineered for POD designers. Remove white backgrounds and export clean transparent PNGs ready for Direct-to-Garment (DTG) printing.",
          primaryCta: "Remove Background for POD",
          secondaryCta: "Upscale for 300 DPI Print"
        };
      case "bulk-background-remover":
        return {
          badge: "High-Volume Batch Processing",
          h1: "Remove Backgrounds from 50+ Images Simultaneously",
          p: "Drop bulk product catalogs, sticker packs, and merchandise graphics for fast parallel client-side processing. Download cleanly structured ZIP archives with zero wait queues.",
          primaryCta: "Start Bulk Batch Free",
          secondaryCta: "Explore Pro Features"
        };
      case "transparent-png-maker":
        return {
          badge: "Instant Transparent PNG Creator",
          h1: "Create Crystal-Clear Transparent PNGs in Seconds",
          p: "Extract isolated subjects with lossless alpha channels directly inside your browser. 100% on-device WebAssembly privacy with zero cloud image harvesting.",
          primaryCta: "Make PNG Transparent Free",
          secondaryCta: "8K AI Upscaler"
        };
      default:
        return {
          badge: "Privacy-First AI & Subpixel Engine",
          h1: "Remove backgrounds. Upscale to 8K. Keep every detail.",
          p: "Privacy-first image tools for POD designers, e-commerce sellers, and creators — with fast browser processing, white halo elimination, and 300 DPI transparent PNG exports.",
          primaryCta: "Remove Background Free",
          secondaryCta: "Upscale an Image"
        };
    }
  };

  const heroContent = getHeroContent();

  return (
    <div className="min-h-screen bg-[#07080a] text-gray-100 font-sans selection:bg-emerald-500/30 selection:text-white">
      {/* 1. Benefit-First Hero Section with Above-the-Fold Proof */}
      <section className="relative overflow-hidden pt-16 pb-20 border-b border-gray-900 bg-gradient-to-b from-[#0a0c14] via-[#080910] to-[#07080a]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest mb-5 shadow-sm">
              <Sparkles className="h-3 w-3 animate-pulse" />
              {heroContent.badge}
            </span>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] mb-5">
              {heroContent.h1.includes("Remove backgrounds.") ? (
                <>
                  Remove backgrounds. Upscale to 8K. <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Keep every detail.</span>
                </>
              ) : (
                heroContent.h1
              )}
            </h1>
            
            <p className="text-sm sm:text-base text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed font-normal">
              {heroContent.p}
            </p>
            
            {/* Primary & Secondary CTAs with Microcopy */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-3">
              <button
                onClick={() => {
                  if (intent === "image-upscaler") {
                    if (onGoToUpscaler) onGoToUpscaler();
                    else onOpenAuth();
                  } else {
                    if (onGoToEditor) onGoToEditor();
                    else onOpenAuth();
                  }
                }}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white font-bold text-sm hover:shadow-xl hover:shadow-emerald-500/20 active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2 cursor-pointer group"
              >
                <Zap className="h-4 w-4 fill-current text-white group-hover:scale-110 transition-transform" />
                <span>{heroContent.primaryCta}</span>
                <ArrowRight className="h-4 w-4 text-white/80 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={() => {
                  if (intent === "image-upscaler") {
                    if (onGoToEditor) onGoToEditor();
                    else onOpenAuth();
                  } else {
                    if (onGoToUpscaler) onGoToUpscaler();
                    else onOpenAuth();
                  }
                }}
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-gray-950/90 hover:bg-gray-850 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white font-semibold text-sm transition duration-200 cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span>{heroContent.secondaryCta}</span>
              </button>
            </div>

            <p className="text-xs font-mono text-gray-400 flex items-center justify-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <CheckCircle className="h-3.5 w-3.5" /> 10 Free Credits on Signup
              </span>
              <span>•</span>
              <span>No Credit Card Required</span>
              <span>•</span>
              <span>Zero-Knowledge Browser Privacy</span>
            </p>
          </div>

          {/* Above-The-Fold Visual Proof Interactive Showcase */}
          <div className="mt-8 max-w-4xl mx-auto rounded-3xl bg-gray-950/80 border border-gray-850/90 p-4 sm:p-6 shadow-2xl backdrop-blur-md">
            {/* Proof Scenario Selector Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-850/80">
              <div className="flex items-center gap-1.5 font-mono text-xs text-gray-400">
                <Sliders className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-bold text-white uppercase text-[11px] tracking-wider">Live Proof Showcase</span>
              </div>
              <div className="flex bg-gray-900/90 p-1 rounded-xl border border-gray-800 text-[11px] font-mono">
                <button
                  onClick={() => setProofTab("pod")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                    proofTab === "pod" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <span>👕 POD White Halo Fix</span>
                </button>
                <button
                  onClick={() => setProofTab("hair")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                    proofTab === "hair" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <span>✂️ Fine Hair Extraction</span>
                </button>
                <button
                  onClick={() => setProofTab("upscale")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                    proofTab === "upscale" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <span>⚡ 8K AI Upscale (300 DPI)</span>
                </button>
              </div>
            </div>

            {/* Split Visual Comparison Area */}
            <div 
              className="relative w-full h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 select-none cursor-ew-resize group"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                setSliderPos(Math.round((x / rect.width) * 100));
              }}
              onTouchMove={(e) => {
                if (e.touches[0]) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
                  setSliderPos(Math.round((x / rect.width) * 100));
                }
              }}
              onMouseEnter={() => setIsHoveringProof(true)}
              onMouseLeave={() => setIsHoveringProof(false)}
            >
              {/* Tab 1: POD White Halo Removal */}
              {proofTab === "pod" && (
                <>
                  {/* Left Side: Original Image with White Fringe (Simulated on Dark Shirt) */}
                  <div className="absolute inset-0 bg-gray-950 flex items-center justify-center p-6">
                    <div className="relative text-center">
                      <div className="inline-block p-8 rounded-2xl bg-[#11131a] border-4 border-white/60 shadow-2xl">
                        <div className="text-4xl sm:text-5xl font-extrabold text-amber-300 font-mono tracking-wider drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">
                          VINTAGE SKULL
                        </div>
                        <p className="text-xs font-mono text-red-400 mt-2 font-bold uppercase bg-red-950/60 px-2 py-1 rounded border border-red-500/40">
                          ⚠️ White Halo / Edge Fringe on Dark Fabric
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Clean Subpixel Feathered Cutout (Clipped by Slider) */}
                  <div 
                    className="absolute inset-0 bg-[#050608] flex items-center justify-center p-6 overflow-hidden"
                    style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
                  >
                    <div className="relative text-center">
                      <div className="inline-block p-8 rounded-2xl bg-[#090b10] border border-emerald-500/40 shadow-2xl">
                        <div className="text-4xl sm:text-5xl font-extrabold text-emerald-400 font-mono tracking-wider">
                          VINTAGE SKULL
                        </div>
                        <p className="text-xs font-mono text-emerald-300 mt-2 font-bold uppercase bg-emerald-950/60 px-2 py-1 rounded border border-emerald-500/40">
                          ✓ 100% Zero-Halo Alpha Transparent PNG
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Tab 2: Fine Hair Details */}
              {proofTab === "hair" && (
                <>
                  <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                    <img 
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80"
                      alt="Raw Portrait Studio Background"
                      className="w-full h-full object-cover opacity-60"
                    />
                    <span className="absolute top-4 left-4 px-2.5 py-1 rounded bg-black/80 font-mono text-[10px] text-gray-300 border border-gray-800">
                      Original Studio Background
                    </span>
                  </div>
                  <div 
                    className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] bg-[#090d16] flex items-center justify-center overflow-hidden"
                    style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
                  >
                    <img 
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80"
                      alt="Extracted Portrait with Preserved Hair Details"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-4 right-4 px-2.5 py-1 rounded bg-emerald-950/90 font-mono text-[10px] text-emerald-300 border border-emerald-500/40 font-bold">
                      Subpixel Feathered Hair Alpha Mask
                    </span>
                  </div>
                </>
              )}

              {/* Tab 3: 8K AI Image Upscaler */}
              {proofTab === "upscale" && (
                <>
                  <div className="absolute inset-0 bg-gray-950 flex items-center justify-center p-6">
                    <div className="text-center">
                      <div className="text-3xl sm:text-4xl font-extrabold text-gray-400 font-mono filter blur-[2px]">
                        PRINT DESIGN (1000px Low-Res)
                      </div>
                      <p className="text-xs font-mono text-red-400 mt-3 font-bold bg-red-950/60 px-2 py-1 rounded border border-red-500/40 inline-block">
                        ⚠️ 72 DPI Pixelated Artifacts
                      </p>
                    </div>
                  </div>
                  <div 
                    className="absolute inset-0 bg-[#06080e] flex items-center justify-center p-6 overflow-hidden"
                    style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
                  >
                    <div className="text-center">
                      <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono tracking-wide">
                        PRINT DESIGN (8192px 8K)
                      </div>
                      <p className="text-xs font-mono text-emerald-300 mt-3 font-bold bg-emerald-950/60 px-2 py-1 rounded border border-emerald-500/40 inline-block">
                        ✓ 300 DPI Ultra-Sharp Vector & Line Precision
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Draggable Divider Line */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)] z-20 pointer-events-none"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-emerald-500 text-gray-950 flex items-center justify-center shadow-lg font-bold text-xs border-2 border-white">
                  ↔
                </div>
              </div>

              {/* Interactive Help Hint */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gray-950/80 border border-gray-800 text-[10px] font-mono text-gray-400 pointer-events-none backdrop-blur-sm">
                Drag or hover across to compare Before vs. After ({sliderPos}%)
              </div>
            </div>

            {/* 3 Trust Points Directly Under Hero */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-850/80 font-mono text-xs text-gray-400">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-900/40 border border-gray-850">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-[11px] mb-0.5">Zero-Knowledge Privacy</h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed">Runs 100% locally in your browser WASM sandbox. Photos are never uploaded or stored.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-900/40 border border-gray-850">
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-[11px] mb-0.5">300 DPI Print-Ready</h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed">Subpixel edge feathering eliminates white halo bleed on black t-shirts and apparel.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-900/40 border border-gray-850">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
                  <FolderArchive className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-[11px] mb-0.5">Built for Batch POD</h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed">Queue 50+ designs simultaneously with instant ZIP archive folder exports.</p>
                </div>
              </div>
            </div>

            {/* Privacy Architecture Flow Diagram */}
            <div className="mt-4 p-4 rounded-xl bg-[#090b12] border border-gray-850/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left font-mono text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="text-gray-300 font-bold">Privacy Flow Architecture:</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-400 flex-wrap justify-center">
                <span className="px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-gray-300">1. Client Device</span>
                <span>→</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold">2. Local Browser WASM / Neural Net</span>
                <span>→</span>
                <span className="px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-gray-300">3. Instant PNG Export</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">🔒 0% Cloud Harvesting</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Technical Workflow Simulator */}
      <section className="py-20 border-b border-gray-900 bg-[#07080a]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">[ Workspace Engine Simulation ]</span>
            <h2 className="text-2xl font-bold text-white tracking-tight mt-1">Interactive Processing Pipeline</h2>
            <p className="text-xs text-gray-500 font-mono mt-1">Adjust real-time variables to experience subpixel keying engine capabilities</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Controls Column (Interactive Inputs) */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-gray-900/30 border border-gray-850 rounded-2xl p-6 backdrop-blur-sm">
              <div>
                {/* Steps Selector tabs */}
                <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-850/80 mb-6 font-mono text-[10px]">
                  <button 
                    onClick={() => setActiveStep(1)}
                    className={`flex-1 py-2 text-center rounded-lg font-bold tracking-wide transition ${activeStep === 1 ? 'bg-gray-850 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    1. Ingestion
                  </button>
                  <button 
                    onClick={() => setActiveStep(2)}
                    className={`flex-1 py-2 text-center rounded-lg font-bold tracking-wide transition ${activeStep === 2 ? 'bg-gray-850 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    2. Masking
                  </button>
                  <button 
                    onClick={() => setActiveStep(3)}
                    className={`flex-1 py-2 text-center rounded-lg font-bold tracking-wide transition ${activeStep === 3 ? 'bg-gray-850 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    3. Refinement
                  </button>
                </div>

                {/* Tab content 1 */}
                {activeStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-2">Step 1: Source Ingestion</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Drop high-resolution raw imagery directly into an isolated client terminal. The tool processes assets entirely on-device, preserving details at raw resolution.
                      </p>
                    </div>
                    
                    <div>
                      <span className="block text-[10px] font-mono text-gray-500 uppercase mb-3">Ingest Sample Asset</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => { setSelectedPreset("badge"); setSimulatedBgType("solid"); }}
                          className={`p-3 rounded-xl border text-left transition overflow-hidden ${selectedPreset === "badge" ? "bg-emerald-500/5 border-emerald-500/30 text-white" : "bg-gray-950/40 border-gray-850 text-gray-400 hover:text-gray-200"}`}
                        >
                          <span className="block text-[10px] font-mono font-bold truncate">brand_logo_workspace</span>
                          <span className="block text-[8px] font-mono text-gray-500 mt-1 truncate">1000 x 300px | PNG</span>
                        </button>
                        <button
                          onClick={() => { setSelectedPreset("sneaker"); setSimulatedBgType("solid"); }}
                          className={`p-3 rounded-xl border text-left transition overflow-hidden ${selectedPreset === "sneaker" ? "bg-emerald-500/5 border-emerald-500/30 text-white" : "bg-gray-950/40 border-gray-850 text-gray-400 hover:text-gray-200"}`}
                        >
                          <span className="block text-[10px] font-mono font-bold truncate">model_hair_refinement</span>
                          <span className="block text-[8px] font-mono text-gray-500 mt-1 truncate">1024 x 680px | JPG</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-950/60 border border-gray-850 rounded-xl font-mono text-[9px] text-gray-500 space-y-1">
                      <div>[ SOURCE TERMINAL INGESTION ]</div>
                      <div>Input Stream: Ready</div>
                      <div>Processing Node: Local WASM Sandbox</div>
                    </div>
                  </div>
                )}

                {/* Tab content 2 */}
                {activeStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-2">Step 2: Advanced Chroma Keying</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Execute subpixel keying by locking onto specific color values. Toggle backdrops to inspect mask boundaries and check transparency thresholds.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <span className="block text-[10px] font-mono text-gray-500 uppercase mb-2">Toggle Mask Key</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSimulatedBgType("solid")}
                            className={`flex-1 py-2 text-center rounded-lg font-mono text-[10px] border transition ${simulatedBgType === "solid" ? "bg-gray-850 border-gray-700 text-white" : "bg-gray-950/40 border-gray-850 text-gray-500"}`}
                          >
                            Solid Backdrop
                          </button>
                          <button
                            onClick={() => setSimulatedBgType("transparent")}
                            className={`flex-1 py-2 text-center rounded-lg font-mono text-[10px] border transition ${simulatedBgType === "transparent" ? "bg-gray-850 border-gray-700 text-white" : "bg-gray-950/40 border-gray-850 text-gray-500"}`}
                          >
                            Key (Transparent)
                          </button>
                        </div>
                      </div>

                      {simulatedBgType === "solid" && (
                        <div>
                          <span className="block text-[10px] font-mono text-gray-500 uppercase mb-2">Inspect Backdrop Color</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSimulatedBgColor("#00FF00")}
                              className={`flex-1 py-2 rounded-lg text-[9px] font-mono font-bold border transition ${simulatedBgColor === "#00FF00" ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-400" : "bg-gray-950/40 border-gray-850 text-gray-500"}`}
                            >
                              Green Mask
                            </button>
                            <button
                              onClick={() => setSimulatedBgColor("#FF00FF")}
                              className={`flex-1 py-2 rounded-lg text-[9px] font-mono font-bold border transition ${simulatedBgColor === "#FF00FF" ? "bg-fuchsia-500/10 border-fuchsia-500/35 text-fuchsia-400" : "bg-gray-950/40 border-gray-850 text-gray-500"}`}
                            >
                              Magenta Mask
                            </button>
                            <button
                              onClick={() => setSimulatedBgColor("#00FFFF")}
                              className={`flex-1 py-2 rounded-lg text-[9px] font-mono font-bold border transition ${simulatedBgColor === "#00FFFF" ? "bg-cyan-500/10 border-cyan-500/35 text-cyan-400" : "bg-gray-950/40 border-gray-850 text-gray-500"}`}
                            >
                              Cyan Mask
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab content 3 */}
                {activeStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-2">Step 3: Morphological Refining</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Fine-tune boundary fringes. Shrink edges to eliminate green halo bleed-through, expand to fill holes, or apply true Gaussian Blur feathering for soft details.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Erosion slider */}
                      <div>
                        <div className="flex justify-between font-mono text-[10px] text-gray-500 mb-1">
                          <span>Erosion (Edge Shrinkage) <span className="text-gray-600">cv2.erode</span></span>
                          <span className="text-amber-400 font-bold">{simulatedErosion}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="4"
                          step="1"
                          value={simulatedErosion}
                          onChange={(e) => setSimulatedErosion(parseInt(e.target.value))}
                          className="w-full h-1 bg-gray-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>

                      {/* Feathering slider */}
                      <div>
                        <div className="flex justify-between font-mono text-[10px] text-gray-500 mb-1">
                          <span>Feathering (Gaussian Blur) <span className="text-gray-600">GaussianBlur</span></span>
                          <span className="text-blue-400 font-bold">{simulatedBlur}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="6"
                          step="1"
                          value={simulatedBlur}
                          onChange={(e) => setSimulatedBlur(parseInt(e.target.value))}
                          className="w-full h-1 bg-gray-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-4 border-t border-gray-850/60 flex justify-between items-center">
                <span className="text-[9px] font-mono text-gray-600">[ Pipeline Node: Active ]</span>
                {activeStep < 3 ? (
                  <button
                    onClick={() => setActiveStep(prev => (prev + 1) as any)}
                    className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400 hover:text-emerald-300 font-bold transition cursor-pointer"
                  >
                    <span>Next step</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (onGoToEditor) onGoToEditor();
                      else onOpenAuth();
                    }}
                    className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400 hover:text-emerald-300 font-bold transition cursor-pointer"
                  >
                    <span>Try with your own images</span>
                    <Zap className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Right Output Column (Interactive Render) */}
            <div className="lg:col-span-7 flex flex-col justify-between bg-gray-950 border border-gray-850 rounded-2xl p-4 overflow-hidden relative min-h-[300px]">
              {/* Accents/Labels */}
              <div className="flex justify-between items-center border-b border-gray-900 pb-3 mb-4 font-mono text-[9px] text-gray-600">
                <span>[ CHANNEL: RGBA_PREVIEW ]</span>
                <span className="text-emerald-500 font-bold">100% RENDER ENGINE ACTIVE</span>
              </div>

              {/* Dynamic SVG Render box */}
              <div className="flex-1 flex items-center justify-center py-6">
                <svg width="100%" height="100%" viewBox="0 0 200 200" className="w-full h-full max-h-[220px] object-contain">
                  <defs>
                    <clipPath id="simulator-clip">
                      <rect x="0" y="0" width="200" height="200" rx="12" />
                    </clipPath>
                    <pattern id="simulator-checkerboard" width="16" height="16" patternUnits="userSpaceOnUse">
                      <rect width="8" height="8" fill="#0c0d12" />
                      <rect x="8" width="8" height="8" fill="#151720" />
                      <rect y="8" width="8" height="8" fill="#151720" />
                      <rect x="8" y="8" width="8" height="8" fill="#0c0d12" />
                    </pattern>
                    <filter id="sim-feather">
                      <feGaussianBlur stdDeviation={simulatedBlur / 2} />
                    </filter>
                  </defs>
                  
                  {/* Background element */}
                  <rect 
                    x="0" 
                    y="0" 
                    width="200" 
                    height="200" 
                    fill={simulatedBgType === "solid" ? simulatedBgColor : "url(#simulator-checkerboard)"} 
                    rx="12" 
                  />
                  
                  {/* Dynamic Render Subject */}
                  <g 
                    filter="url(#sim-feather)" 
                    clipPath="url(#simulator-clip)"
                    style={{ 
                      transform: `scale(${1 - (simulatedErosion * 0.025)})`, 
                      transformOrigin: 'center' 
                    }}
                  >
                    {selectedPreset === "badge" ? (
                      <image 
                        href="/logo.png" 
                        x="5" 
                        y="5" 
                        width="190" 
                        height="190" 
                        preserveAspectRatio="xMidYMid meet"
                      />
                    ) : (
                      <image 
                        href="/model_isolated.png" 
                        x="0" 
                        y="0" 
                        width="200" 
                        height="200" 
                        preserveAspectRatio="xMidYMid slice"
                      />
                    )}
                  </g>
                </svg>
              </div>

              {/* Technical Indicator labels */}
              <div className="border-t border-gray-900 pt-3 mt-4 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[9px] text-gray-500">
                <div>[ EROSION: {simulatedErosion}px ]</div>
                <div>[ FEATHERING: {simulatedBlur}px ]</div>
                <div>[ BACKDROP: {simulatedBgType === "solid" ? "SOLID" : "CHECKERBOARD"} ]</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2.5 AI Magic Showcase Simulator */}
      <section className="py-20 border-b border-gray-900 bg-[#07080a]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">[ Neural Segmentation Module ]</span>
            <h2 className="text-2xl font-bold text-white tracking-tight mt-1">AI Magic Isolation Engine</h2>
            <p className="text-xs text-gray-500 font-mono mt-1">Experience browser-side neural network segmentation that auto-detects complex subjects</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Controls Column (Interactive Inputs) */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-gray-900/30 border border-gray-850 rounded-2xl p-6 backdrop-blur-sm">
              <div>
                {/* Step 1: AI Subject Vector Analysis */}
                <div className="mb-6 p-4 rounded-xl bg-gray-950/60 border border-gray-850/80 font-mono text-[10px] space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-900 pb-2">
                    <span className="text-emerald-400 uppercase font-bold text-[9px] flex items-center gap-1">
                      <Sparkles className="h-3 w-3 animate-pulse" />
                      STEP 1: AI SUBJECT VECTOR ANALYSIS
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800 text-[8px] text-gray-500">Groq Llama 4</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-gray-500 text-[8px] uppercase">Subject Name:</div>
                      <div className="text-white font-bold text-xs mt-0.5">
                        {magicPreset === "model" ? "Messy Hair Portrait" : "Puma Sneaker Product"}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-[8px] uppercase">Outline Complexity:</div>
                      <div className="mt-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${magicPreset === "model" ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-amber-500/10 border border-amber-500/20 text-amber-400"}`}>
                          {magicPreset === "model" ? "VERY HIGH" : "MEDIUM"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-500 text-[8px] uppercase">Color Edge Bleed Risks:</div>
                    <div className="text-gray-300 text-[9px] mt-1 p-2 rounded bg-gray-900/50 border border-gray-900 leading-normal">
                      {magicPreset === "model" 
                        ? "Fine hair strands overlap with background, risk of halos in chroma keying." 
                        : "Standard contrast. Background is easily separated from subject edge vectors."}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-500 text-[8px] uppercase">Sub-surface Extraction Advice:</div>
                    <div className="text-gray-400 text-[9px] mt-0.5 leading-normal">
                      {magicPreset === "model" 
                        ? '"Chroma keying will eat into dark hair. Neural AI Segmenter is highly recommended."' 
                        : '"Sample background directly on canvas. Set HSV parameters standard ranges [35-85] chroma green key."'}
                    </div>
                  </div>
                </div>

                {/* Step 2: AI Subject Segmentation */}
                <div className="mb-6 p-4 rounded-xl bg-gray-950/60 border border-gray-850/80 font-mono text-[10px] space-y-4">
                  <div className="text-emerald-400 uppercase font-bold text-[9px] flex items-center gap-1 border-b border-gray-900 pb-2">
                    <Sliders className="h-3 w-3" />
                    STEP 2: AI SUBJECT SEGMENTATION
                  </div>

                  {/* Preset Selector */}
                  <div>
                    <span className="block text-[8px] text-gray-500 uppercase mb-2">Ingest Demo Subject</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button 
                        onClick={() => setMagicPreset("model")}
                        className={`py-2 px-2 text-center rounded-lg border transition text-[9px] font-bold truncate ${magicPreset === "model" ? "bg-emerald-500/5 border-emerald-500/30 text-white" : "bg-gray-950/40 border-gray-850 text-gray-500 hover:text-gray-300"}`}
                      >
                        model_hair_portrait
                      </button>
                      <button 
                        onClick={() => setMagicPreset("sneaker")}
                        className={`py-2 px-2 text-center rounded-lg border transition text-[9px] font-bold truncate ${magicPreset === "sneaker" ? "bg-emerald-500/5 border-emerald-500/30 text-white" : "bg-gray-950/40 border-gray-850 text-gray-500 hover:text-gray-300"}`}
                      >
                        sneaker_mockup
                      </button>
                    </div>
                  </div>

                  {/* Mode Toggles */}
                  <div>
                    <span className="block text-[8px] text-gray-500 uppercase mb-2">Segmentation Mode</span>
                    <div className="grid grid-cols-2 p-0.5 bg-gray-950 rounded-lg border border-gray-850">
                      <button 
                        onClick={() => setMagicMode("chroma")}
                        className={`py-1.5 text-center rounded-md transition text-[9px] font-bold ${magicMode === "chroma" ? "bg-gray-850 text-white" : "text-gray-500 hover:text-gray-300"}`}
                      >
                        Chroma Key
                      </button>
                      <button 
                        onClick={() => setMagicMode("magic")}
                        className={`py-1.5 text-center rounded-md transition text-[9px] font-bold flex items-center justify-center gap-1 ${magicMode === "magic" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-gray-500 hover:text-gray-300"}`}
                      >
                        <Sparkles className="h-3 w-3 fill-current" />
                        AI Magic
                      </button>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="flex justify-between items-center border-t border-gray-900 pt-3">
                    <div>
                      <div className="font-bold text-white text-[9px]">Invert Mask Direction</div>
                      <div className="text-[8px] text-gray-500 mt-0.5">Toggle subject vs background extraction</div>
                    </div>
                    <button
                      onClick={() => setMagicInvert(!magicInvert)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${magicInvert ? "bg-emerald-500" : "bg-gray-800"}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${magicInvert ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>

                  {/* AI Pro-Tip */}
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-[9px] text-emerald-400 leading-normal">
                    <span className="font-bold">★ AI PRO-TIP:</span> For complex subject outlines (like curly hair, fine fur, or product textures) the neural AI Segmenter provides a complete alpha mask without requiring chroma values or connectivity samples.
                  </div>
                </div>
              </div>

              {/* Bottom Footer Label */}
              <div className="pt-4 border-t border-gray-850/60 flex justify-between items-center font-mono text-[9px] text-gray-600">
                <span>[ Neural Node: Connected ]</span>
                <button
                  onClick={() => {
                    if (onGoToEditor) onGoToEditor();
                    else onOpenAuth();
                  }}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold transition cursor-pointer"
                >
                  Test AI Magic Live <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Right Output Column (Interactive Render) */}
            <div className="lg:col-span-7 flex flex-col justify-between bg-gray-950 border border-gray-850 rounded-2xl p-4 overflow-hidden relative min-h-[350px]">
              {/* Accents/Labels */}
              <div className="flex justify-between items-center border-b border-gray-900 pb-3 mb-4 font-mono text-[9px] text-gray-600">
                <span>[ CHANNEL: RGBA_PREVIEW ]</span>
                <span className="text-emerald-500 font-bold">100% RENDER ENGINE ACTIVE</span>
              </div>

              {/* Backdrop Toggle */}
              <div className="absolute top-12 right-4 z-25 flex gap-1.5 font-mono text-[8px] bg-gray-900/80 backdrop-blur border border-gray-800 p-1 rounded-lg">
                <button 
                  onClick={() => setMagicBg("transparent")}
                  className={`px-1.5 py-0.5 rounded transition ${magicBg === "transparent" ? "bg-gray-800 text-white font-bold" : "text-gray-500 hover:text-gray-300"}`}
                >
                  Checkers
                </button>
                <button 
                  onClick={() => setMagicBg("green")}
                  className={`px-1.5 py-0.5 rounded transition ${magicBg === "green" ? "bg-green-600 text-white font-bold" : "text-gray-500 hover:text-gray-300"}`}
                >
                  Green
                </button>
                <button 
                  onClick={() => setMagicBg("magenta")}
                  className={`px-1.5 py-0.5 rounded transition ${magicBg === "magenta" ? "bg-fuchsia-600 text-white font-bold" : "text-gray-500 hover:text-gray-300"}`}
                >
                  Magenta
                </button>
                <button 
                  onClick={() => setMagicBg("black")}
                  className={`px-1.5 py-0.5 rounded transition ${magicBg === "black" ? "bg-black text-white font-bold" : "text-gray-500 hover:text-gray-300"}`}
                >
                  Black
                </button>
              </div>

              {/* Dynamic Preview Box */}
              <div className="flex-1 flex items-center justify-center py-6 relative">
                <div 
                  className={`w-full max-w-[240px] aspect-square rounded-2xl border border-gray-850 relative overflow-hidden flex items-center justify-center transition-all duration-300 ${
                    magicBg === "transparent" 
                      ? "bg-[linear-gradient(45deg,#15171a_25%,transparent_25%),linear-gradient(-45deg,#15171a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#15171a_75%),linear-gradient(-45deg,transparent_75%,#15171a_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px]" 
                      : magicBg === "green" 
                      ? "bg-[#00FF00]" 
                      : magicBg === "magenta" 
                      ? "bg-[#FF00FF]" 
                      : "bg-[#000000]"
                  }`}
                >
                  {magicLoading ? (
                    <div className="flex flex-col gap-2 items-center justify-center z-30 font-mono text-[9px] text-emerald-400 bg-gray-950/80 backdrop-blur-md absolute inset-0">
                      <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                      <span>Loading Neural Model (2.7 MB)...</span>
                    </div>
                  ) : (
                    <img 
                      src={
                        magicMode === "magic" 
                          ? (magicPreset === "model" ? "/model_isolated.png" : "/history_sneaker.png")
                          : (magicPreset === "model" ? "/model.jpg" : "/history_sneaker.png")
                      } 
                      width="400"
                      height="400"
                      loading="lazy"
                      className={`max-w-full max-h-full object-contain p-2 z-10 transition-all duration-300 ${
                        magicMode === "chroma" && magicPreset === "sneaker" ? "bg-white" : ""
                      } ${magicInvert ? "invert" : ""}`}
                      alt="Neural isolation preview" 
                    />
                  )}
                </div>
              </div>

              {/* Technical Indicator labels */}
              <div className="border-t border-gray-900 pt-3 mt-4 flex justify-between font-mono text-[9px] text-gray-500">
                <div>Format: <span className="text-gray-300">PNG</span></div>
                <div>Mode: <span className="text-gray-300">{magicMode === "magic" ? "NEURAL MASK" : "CHROMA LOCK"}</span></div>
                <div>Channel: <span className="text-gray-300">{magicInvert ? "INVERTED" : "RGBA (8-bit)"}</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Feature Highlight: Bulk Parallel Processing */}
      <section className="py-20 border-b border-gray-900 bg-[#0a0c14]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Copy */}
            <div>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">[ Parallel Pipeline Arrays ]</span>
              <h2 className="text-3xl font-extrabold text-white tracking-tight mt-2 mb-6">Engineered for Mass Production</h2>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Stop wasting hours processing image mockups one by one. Drop up to 50 assets concurrently into our parallel processing engine, watch them isolate simultaneously, and download your entire clean asset library instantly in a structured `.zip` archive.
              </p>
              
              <ul className="space-y-4 mb-8 font-mono text-xs text-gray-300">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                  <span>Concurrent uploads up to 50 files</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                  <span>Parallel WASM-thread mask computation</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                  <span>Structured zip file packaging downloads</span>
                </li>
              </ul>
              
              <button
                onClick={onOpenAuth}
                className="px-6 py-3 bg-gray-950 border border-gray-850 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition duration-150 flex items-center gap-2 cursor-pointer"
              >
                <span>Access Bulk Engine</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Right Interactive Mock Component */}
            <div className="bg-gray-950 border border-gray-850 rounded-2xl p-5 shadow-2xl relative overflow-hidden font-mono">
              <div className="flex justify-between items-center border-b border-gray-900 pb-3 mb-4 text-[9px] text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  BULK PROCESSING PIPELINE
                </span>
                <span className="px-2 py-0.5 rounded bg-gray-900 border border-gray-850 text-gray-400">
                  {bulkStatus === "completed" ? "4 / 4 Complete" : `${bulkItems.filter(i => i.status === "completed").length} / 4 Isolated`}
                </span>
              </div>

              {/* Progress bar container */}
              <div className="mb-6">
                <div className="w-full bg-gray-900 h-2.5 rounded-full overflow-hidden border border-gray-850">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-150" 
                    style={{ width: `${bulkProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-gray-600 mt-1.5">
                  <span>Pipeline status: {bulkStatus === "processing" ? "Compiling..." : bulkStatus === "completed" ? "Ready" : "Idle"}</span>
                  <span>{bulkProgress}% Overall Progress</span>
                </div>
              </div>

              {/* Matrix of items */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {bulkItems.map(item => (
                  <div key={item.id} className="p-3 bg-gray-900/40 border border-gray-850 rounded-xl flex items-center justify-between text-[10px]">
                    <div className="truncate max-w-[120px] text-gray-300">{item.name}</div>
                    {item.status === "completed" ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1 text-[9px]">
                        <Check className="h-3.5 w-3.5 shrink-0" />
                        DONE
                      </span>
                    ) : item.status === "isolating" ? (
                      <span className="text-amber-400 font-bold flex items-center gap-1 text-[9px]">
                        <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                        RUNNING
                      </span>
                    ) : (
                      <span className="text-gray-600 text-[9px]">QUEUED</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {bulkStatus === "completed" ? (
                  <>
                    <button
                      onClick={handleResetBulk}
                      className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-850 border border-gray-850 text-white rounded-xl text-xs font-semibold tracking-wider transition duration-150 cursor-pointer"
                    >
                      Clear Batch
                    </button>
                    <button
                      onClick={onOpenAuth}
                      className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-xs font-bold hover:shadow-lg transition duration-150 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <FolderArchive className="h-3.5 w-3.5" />
                      <span>Download ZIP</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleRunBulk}
                    disabled={bulkStatus === "processing"}
                    className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 hover:text-emerald-300 rounded-xl text-xs font-bold transition duration-150 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5 fill-current shrink-0" />
                    <span>{bulkStatus === "processing" ? "Running compilation..." : "Simulate Bulk Pipeline"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Secure History Vault */}
      <section className="py-20 border-b border-gray-900 bg-[#07080a]">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">[ PRIVATE PERSISTENCE LEDGER ]</span>
          <h2 className="text-3xl font-extrabold text-white tracking-tight mt-2 mb-6">Your Isolated History Gallery</h2>
          <p className="text-sm text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
            Every processed transparency is saved securely in cloud-archived vaults. Access, review, or re-download your high-resolution original uploads and extracted transparent assets straight from your private persistence ledger anytime, anywhere.
          </p>

          {/* Graphic mockup of history row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-[10px] text-gray-400">
            <div className="p-4 bg-gray-900/30 border border-gray-850 rounded-2xl text-left relative overflow-hidden group">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] text-gray-500">7/16/2026</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px]">PRO</span>
              </div>
              <div className="aspect-video w-full rounded-lg bg-gray-950 border border-gray-850 flex items-center justify-center mb-3 relative overflow-hidden bg-[linear-gradient(45deg,#15171a_25%,transparent_25%),linear-gradient(-45deg,#15171a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#15171a_75%),linear-gradient(-45deg,transparent_75%,#15171a_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px] p-3 select-none">
                <img src="/logo.png" width="300" height="300" fetchPriority="high" className="max-w-full max-h-full object-contain z-10" alt="brand logo isolation preview" />
              </div>
              <div className="truncate font-bold text-white">brand_logo_isolated.png</div>
              <div className="text-[9px] text-gray-500 mt-1">1000 x 300px | Original & Isolated</div>
            </div>

            <div className="p-4 bg-gray-900/30 border border-gray-850 rounded-2xl text-left relative overflow-hidden group">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] text-gray-500">7/16/2026</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px]">PRO</span>
              </div>
              <div className="aspect-video w-full rounded-lg bg-gray-950 border border-gray-850 flex items-center justify-center mb-3 relative overflow-hidden bg-[linear-gradient(45deg,#15171a_25%,transparent_25%),linear-gradient(-45deg,#15171a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#15171a_75%),linear-gradient(-45deg,transparent_75%,#15171a_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px] p-3 select-none">
                <img src="/history_model.png" width="400" height="400" loading="lazy" className="max-w-full max-h-full object-contain z-10" alt="model isolation preview" />
              </div>
              <div className="truncate font-bold text-white">model_isolated.png</div>
              <div className="text-[9px] text-gray-500 mt-1">1024 x 680px | Original & Isolated</div>
            </div>

            <div className="p-4 bg-gray-900/30 border border-gray-850 rounded-2xl text-left relative overflow-hidden group">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] text-gray-500">7/16/2026</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px]">PRO</span>
              </div>
              <div className="aspect-video w-full rounded-lg bg-gray-950 border border-gray-850 flex items-center justify-center mb-3 relative overflow-hidden bg-[linear-gradient(45deg,#15171a_25%,transparent_25%),linear-gradient(-45deg,#15171a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#15171a_75%),linear-gradient(-45deg,transparent_75%,#15171a_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px] p-3 select-none">
                <img src="/history_sneaker.png" width="400" height="400" loading="lazy" className="max-w-full max-h-full object-contain z-10" alt="sneaker isolation preview" />
              </div>
              <div className="truncate font-bold text-white">sneaker_isolated.png</div>
              <div className="text-[9px] text-gray-500 mt-1">1024 x 1024px | Original & Isolated</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4.5 Real-ESRGAN 4K & 8K AI Super-Resolution Showcase */}
      <section id="upscaler-showcase" className="py-20 border-b border-gray-900 bg-gradient-to-b from-[#07080a] via-[#0a0d18] to-[#07080a]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest mb-3">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              NCNN Vulkan GPU Acceleration
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Real-ESRGAN <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">4K & 8K AI Super-Resolution</span>
            </h2>
            <p className="text-xs md:text-sm text-gray-400 font-mono mt-2 max-w-2xl mx-auto">
              Restore micro-textures, sharpen fuzzy text, and scale graphics up to 8192×8192 with zero alpha transparency corruption.
            </p>
          </div>

          {/* Showcase Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gray-950/60 border border-gray-800 rounded-2xl p-6 shadow-xl backdrop-blur-xl relative overflow-hidden group">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 font-bold text-sm">
                8K
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Progressive 2-Pass 8K Engine</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-mono">
                Executes a native 4x model pass followed by a 2x pass using Real-ESRGAN NCNN Vulkan to generate pristine 8192×8192 resolution exports without memory tile misalignment.
              </p>
            </div>

            <div className="bg-gray-950/60 border border-gray-800 rounded-2xl p-6 shadow-xl backdrop-blur-xl relative overflow-hidden group">
              <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-4 font-bold text-sm">
                🔍
              </div>
              <h3 className="text-lg font-bold text-white mb-2">1000% Micro Inspection Loupe</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-mono">
                Compare Before & After extractions in real-time with dual synchronized side-by-side viewports and magnification controls up to 1000% scale.
              </p>
            </div>

            <div className="bg-gray-950/60 border border-gray-800 rounded-2xl p-6 shadow-xl backdrop-blur-xl relative overflow-hidden group">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 font-bold text-sm">
                🎯
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Category Model Tuning</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-mono">
                Switch neural weights between Graphic/Text (<span className="text-emerald-400 font-semibold">realesrgan-x4plus-anime</span>), Product photography, and Portrait modes for custom edge sharpening.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Pricing Tiers & Comparison Matrix */}
      <section id="pricing" className="py-20 bg-[#0a0c14]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">[ PRICING SCHEDULING ]</span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight mt-2">Monetization Engine Plans</h2>
            <p className="text-xs text-gray-500 font-mono mt-1">Select the tier best optimized for your processing volume requirements</p>
          </div>

          {/* Pricing presentation cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            {/* Free Tier Card */}
            <div className="bg-gray-950/40 border border-gray-850 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest">Decision: Try & Test</span>
                  <span className="px-2 py-0.5 rounded bg-gray-900 text-gray-400 text-[8px] font-mono border border-gray-800">FREE FOREVER</span>
                </div>
                <h3 className="text-xl font-bold text-white">Free Plan</h3>
                <div className="my-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">$0</span>
                  <span className="text-gray-500 text-xs font-mono">/ no card needed</span>
                </div>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                  Test the client-side WASM keyer, refine transparency masks, and preview output quality.
                </p>
                <ul className="space-y-3 font-mono text-[10px] text-gray-300 mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span><strong>10 Free trial credits</strong> on account setup</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Standard resolution preview downloads (500px)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span><strong>3 HD / Full-Resolution</strong> trial exports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>2X / 4K Real-ESRGAN AI upscaler trial</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Single asset mode (1 image at a time)</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => {
                  if (onGoToEditor) onGoToEditor();
                  else onOpenAuth();
                }}
                className="w-full py-3 bg-gray-900 border border-gray-850 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold active:scale-[0.99] transition duration-150 cursor-pointer"
              >
                Start Free Trial
              </button>
            </div>

            {/* 100 Credit Bundle Card */}
            <div className="bg-gray-950/40 border border-gray-850 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-mono text-teal-400 uppercase tracking-widest">Decision: Occasional Use</span>
                  <span className="px-2 py-0.5 rounded bg-teal-950/40 text-teal-300 text-[8px] font-mono border border-teal-500/30">$0.05 / ASSET</span>
                </div>
                <h3 className="text-xl font-bold text-white">100 Credit Bundle</h3>
                <div className="my-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">$5</span>
                  <span className="text-gray-500 text-xs font-mono">one-time payment</span>
                </div>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                  Best for creators and stores who need high-resolution downloads without a recurring monthly charge.
                </p>
                <ul className="space-y-3 font-mono text-[10px] text-gray-300 mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span><strong>100 Full-Resolution Credits</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Credits NEVER expire</strong> (Use anytime)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>1 credit = 1 Full HD export or 4K/8K upscale</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Real-ESRGAN 4K & 8K AI Super-Resolution</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Single file workflow mode</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onOpenAuth}
                className="w-full py-3 bg-gray-900 border border-gray-850 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold active:scale-[0.99] transition duration-150 cursor-pointer"
              >
                Buy 100 Credits ($5)
              </button>
            </div>

            {/* Pro Tier Card */}
            <div className="bg-gray-950/60 border border-emerald-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-[8px] font-mono font-bold text-white uppercase tracking-wider rounded-bl-lg shadow">
                BEST FOR POD & AGENCIES
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest">Decision: High-Volume / Power Users</span>
                </div>
                <h3 className="text-xl font-bold text-white">Pro Plan</h3>
                <div className="my-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">$7.99</span>
                  <span className="text-gray-500 text-xs font-mono">/ month</span>
                </div>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                  Unlimited power for print-on-demand sellers, creative agencies, and e-commerce catalogs.
                </p>
                <ul className="space-y-3 font-mono text-[10px] text-gray-300 mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span><strong>UNLIMITED</strong> background removals (No caps)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span><strong>UNLIMITED 4K & 8K AI Super-Resolution</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span><strong>50+ File Batch Processing</strong> with ZIP download</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Full original resolution exports (up to 8192×8192)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Encrypted History Gallery (Re-download anytime)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Cancel anytime with 1 click via billing portal</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onOpenAuth}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-xs font-bold hover:shadow-lg active:scale-[0.99] transition duration-150 cursor-pointer"
              >
                Subscribe to Pro ($7.99/mo)
              </button>
            </div>
          </div>

          {/* Comparison Matrix Table */}
          <div className="border border-gray-850 rounded-2xl bg-gray-950/20 backdrop-blur-md overflow-hidden">
            <div className="p-4 border-b border-gray-850 bg-gray-950/40 font-mono text-[10px] text-gray-500 flex justify-between items-center">
              <span>[ TRANSPARENT CAPABILITY COMPARISON MATRIX ]</span>
              <span className="text-emerald-400 text-[9px]">100% Transparent Limits</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px] text-gray-400 border-collapse">
                <thead>
                  <tr className="border-b border-gray-900 bg-gray-950/50 text-gray-500">
                    <th className="p-4 font-semibold uppercase">Feature / Feature Limit</th>
                    <th className="p-4 font-semibold uppercase">Free Trial</th>
                    <th className="p-4 font-semibold uppercase">100 Credit Bundle</th>
                    <th className="p-4 font-semibold uppercase">Pro Subscription</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900">
                  <tr className="hover:bg-gray-900/20 transition">
                    <td className="p-4 font-bold text-gray-300">Intended User</td>
                    <td className="p-4 text-gray-400">Testing & Casual Preview</td>
                    <td className="p-4 text-teal-300">Occasional Projects</td>
                    <td className="p-4 text-emerald-400 font-bold">High-Volume POD & Creators</td>
                  </tr>
                  <tr className="hover:bg-gray-900/20 transition">
                    <td className="p-4 font-bold text-gray-300">Background Isolation Capacity</td>
                    <td className="p-4">10 Trial Credits</td>
                    <td className="p-4">100 HD Credits</td>
                    <td className="p-4 text-emerald-400 font-bold">Unlimited Without Caps</td>
                  </tr>
                  <tr className="hover:bg-gray-900/20 transition">
                    <td className="p-4 font-bold text-gray-300">4K & 8K AI Image Upscaling</td>
                    <td className="p-4 font-semibold text-amber-400">2X / 4K Trial Pass</td>
                    <td className="p-4">1 Credit per 4K/8K Upscale</td>
                    <td className="p-4 text-emerald-400 font-bold">Unlimited 4K & 8K Neural Passes</td>
                  </tr>
                  <tr className="hover:bg-gray-900/20 transition">
                    <td className="p-4 font-bold text-gray-300">Max Export Resolution</td>
                    <td className="p-4">500px (3 HD Trials)</td>
                    <td className="p-4">Original HD / Ultra-HD</td>
                    <td className="p-4 text-emerald-400 font-bold">Up to 8192×8192 (300 DPI Print)</td>
                  </tr>
                  <tr className="hover:bg-gray-900/20 transition">
                    <td className="p-4 font-bold text-gray-300">Batch Processing (50+ Files)</td>
                    <td className="p-4 text-gray-600">—</td>
                    <td className="p-4 text-gray-600">—</td>
                    <td className="p-4 text-emerald-400 font-bold">Included with Structured ZIP</td>
                  </tr>
                  <tr className="hover:bg-gray-900/20 transition">
                    <td className="p-4 font-bold text-gray-300">Credit Expiry Date</td>
                    <td className="p-4">Never</td>
                    <td className="p-4 text-emerald-400 font-bold">Never Expire</td>
                    <td className="p-4">Active Subscription</td>
                  </tr>
                  <tr className="hover:bg-gray-900/20 transition">
                    <td className="p-4 font-bold text-gray-300">Commercial Usage Rights</td>
                    <td className="p-4">Yes</td>
                    <td className="p-4">Yes</td>
                    <td className="p-4 text-emerald-400 font-bold">100% Commercial License</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 5.5. Technical Methodology Section (GEO & Intent Optimized) */}
      <section id="features" className="py-20 border-t border-b border-gray-900 bg-[#07080a]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="border border-gray-850 rounded-2xl bg-gray-950/40 p-8 relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest block mb-3">
              [ TECHNICAL ARCHITECTURE & PRIVACY ]
            </span>
            <h3 className="text-xl font-bold text-white tracking-tight mb-4">
              Deterministic Edge Keying & Progressive 2-Pass 8K AI Super-Resolution
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed font-mono">
              PixelIsolate combines client-side WebAssembly (WASM) for zero-latency, private background extraction with a hardware-accelerated Real-ESRGAN Vulkan neural upscaler. For 4K upscales, native 4x deep neural networks enhance vector lines and micro-textures. For 8K upscales, our progressive 2-pass engine executes a 4x deep neural pass followed by an anime-optimized 2x refinement pass, scaling artwork up to 8192×8192 while preserving raw alpha transparency channels and zero white edge halos.
            </p>
          </div>
        </div>
      </section>

      {/* 5.6. E-E-A-T Trust, Security & Publisher Information */}
      <section id="trust-eeat" className="py-16 border-b border-gray-900 bg-[#0a0c14]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">[ TRUST & COMPLIANCE VERIFICATION ]</span>
            <h2 className="text-2xl font-bold text-white tracking-tight mt-1">Publisher & Security Transparency</h2>
            <p className="text-xs text-gray-500 font-mono mt-1">Verified browser sandbox safety protocols and compliance standards</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 font-mono text-[11px]">
            <div className="p-5 rounded-2xl bg-gray-950/60 border border-gray-850">
              <span className="text-emerald-400 font-bold block mb-2">🔒 On-Device Privacy</span>
              <p className="text-gray-400 text-[10px] leading-relaxed">
                Images are processed entirely within client memory. No unencrypted photo uploads or AI training datasets are maintained.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-gray-950/60 border border-gray-850">
              <span className="text-emerald-400 font-bold block mb-2">🛡️ Merchant of Record</span>
              <p className="text-gray-400 text-[10px] leading-relaxed">
                All financial transactions are handled securely via Paddle.com under SSL 256-bit PCI-DSS Level 1 compliance.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-gray-950/60 border border-gray-850">
              <span className="text-emerald-400 font-bold block mb-2">✉️ Publisher Support</span>
              <p className="text-gray-400 text-[10px] leading-relaxed">
                Managed by PixelIsolate Team. Contact <a href="mailto:contact@pixelisolate.online" className="text-emerald-400 underline">contact@pixelisolate.online</a> for technical inquiries.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-gray-950/60 border border-gray-850">
              <span className="text-emerald-400 font-bold block mb-2">🌐 Social Media Channels</span>
              <p className="text-gray-400 text-[10px] leading-relaxed mb-2">
                Connect with our official brand channels:
              </p>
              <div className="flex flex-col gap-1 text-[10px]">
                <a href="https://www.facebook.com/pixelisolate/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline font-bold flex items-center gap-1">
                  → Facebook Page
                </a>
                <a href="https://www.instagram.com/pixelisolate/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline font-bold flex items-center gap-1">
                  → Instagram Profile
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5.7. Comprehensive Frequently Asked Questions (FAQ) */}
      <section id="faq" className="py-20 border-b border-gray-900 bg-[#07080a]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">[ KNOWLEDGE BASE ]</span>
            <h2 className="text-2xl font-bold text-white tracking-tight mt-1">Frequently Asked Questions</h2>
            <p className="text-xs text-gray-500 font-mono mt-1">Clear answers regarding credit calculation, resolution limits, refunds, and privacy</p>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div className="p-5 rounded-2xl bg-gray-950/40 border border-gray-850">
              <h3 className="font-bold text-white mb-2">What counts as a credit?</h3>
              <p className="text-gray-400 leading-relaxed text-[11px]">
                1 credit allows 1 full-resolution HD background isolation export or 1 high-resolution 4K/8K AI upscale pass. Standard 500px preview exports and on-screen threshold tuning do not consume paid credits.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-gray-950/40 border border-gray-850">
              <h3 className="font-bold text-white mb-2">Do purchased credits expire?</h3>
              <p className="text-gray-400 leading-relaxed text-[11px]">
                No. Credits purchased through the 100 Credit Bundle never expire. They remain in your account until you decide to use them.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-gray-950/40 border border-gray-850">
              <h3 className="font-bold text-white mb-2">How does PixelIsolate eliminate white halos on print-on-demand designs?</h3>
              <p className="text-gray-400 leading-relaxed text-[11px]">
                Traditional background removers leave a 1–2 pixel light fringe around cutouts, which looks messy when printed on black t-shirts. PixelIsolate includes subpixel erosion, alpha threshold tuning, and Gaussian edge feathering that completely eliminates white edge fringing.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-gray-950/40 border border-gray-850">
              <h3 className="font-bold text-white mb-2">Can I cancel my Pro subscription anytime?</h3>
              <p className="text-gray-400 leading-relaxed text-[11px]">
                Yes, absolutely. You can cancel your subscription with a single click at any time inside your Billing & Subscription dashboard or via the Paddle customer portal. You will retain Pro access until the end of your billing cycle.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-gray-950/40 border border-gray-850">
              <h3 className="font-bold text-white mb-2">Are my uploaded images kept private?</h3>
              <p className="text-gray-400 leading-relaxed text-[11px]">
                Yes. Background isolation is executed 100% on your device inside your browser's WebAssembly sandbox. Your images are never sent to external servers, harvested, or used for AI model training datasets.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-gray-950/40 border border-gray-850">
              <h3 className="font-bold text-white mb-2">What is your refund policy?</h3>
              <p className="text-gray-400 leading-relaxed text-[11px]">
                We offer a 14-day refund policy for unused credit bundles and subscription billing concerns. If you encounter any technical difficulty, simply contact our support at contact@pixelisolate.online.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Simple Conversion Banner */}
      <section className="py-20 border-t border-gray-900 bg-gradient-to-b from-[#07080a] to-[#0a0c14]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white tracking-tight mb-4">Start Isolating Assets with High-Precision Right Now</h2>
          <p className="text-xs text-gray-500 font-mono mb-8 max-w-xl mx-auto">
            Zero installation required. Create your account and deploy your first edge masking workflow in seconds.
          </p>
          <button
            onClick={onOpenAuth}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm hover:shadow-lg hover:shadow-emerald-500/15 active:scale-[0.99] transition duration-200 cursor-pointer mb-8"
          >
            Deploy Your Free Workspace
          </button>
          
          <div className="flex justify-center flex-wrap gap-4 text-xs font-mono text-gray-500 pt-6 border-t border-gray-900 mb-6 items-center">
            <a href="https://www.facebook.com/pixelisolate/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition">Facebook</a>
            <span>•</span>
            <a href="https://www.instagram.com/pixelisolate/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition">Instagram</a>
            <span>•</span>
            <a href="/privacy.html" className="hover:text-gray-300 transition">Privacy Policy</a>
            <span>•</span>
            <a href="/terms.html" className="hover:text-gray-300 transition">Terms of Service</a>
            <span>•</span>
            <a href="/sitemap.xml" className="hover:text-gray-300 transition">Sitemap</a>
            {onOpenEmbedBadge && (
              <>
                <span>•</span>
                <button
                  onClick={onOpenEmbedBadge}
                  className="hover:text-emerald-400 text-emerald-500 font-semibold transition cursor-pointer flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20"
                >
                  <Code className="h-3.5 w-3.5" />
                  <span>Embed Badge</span>
                </button>
              </>
            )}
          </div>

          <div className="flex flex-wrap justify-center items-center gap-6 pt-4">
            <a href="https://startupbase.io/products/pixel-isolate?utm_source=startupbase&utm_medium=badge&utm_campaign=featured-badge-dark" target="_blank" rel="noopener noreferrer" className="inline-block transition-transform duration-200 hover:scale-[1.03]">
              <img src="https://statics.startupbase.io/site/badges/featured-on-sb-dark.svg" alt="Featured on StartupBase" width="215" height="55" loading="lazy" referrerPolicy="no-referrer" className="h-[54px] w-auto object-contain block" />
            </a>

            <a href="https://techbasedirectory.com/product/pixel-isolate?utm_source=featured_embed" target="_blank" rel="noopener noreferrer" className="inline-block transition-transform duration-200 hover:scale-[1.03]">
              <img src="https://techbasedirectory.com/api/featured-embed" alt="Pixel Isolate | Techbasedirectory.com" width="200" height="60" loading="lazy" referrerPolicy="no-referrer" className="h-[54px] w-auto object-contain block" />
            </a>

            <a href="https://www.producthunt.com/products/pixel-isolate?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-pixel-isolate" target="_blank" rel="noopener noreferrer" className="inline-block transition-transform duration-200 hover:scale-[1.03]">
              <img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1206327&theme=dark" alt="Pixel Isolate | Product Hunt" width="250" height="54" loading="lazy" referrerPolicy="no-referrer" className="h-[54px] w-auto object-contain block" />
            </a>

            <a href="https://launchit.fast/tools/pixel-isolate" target="_blank" rel="noopener noreferrer" className="inline-block transition-transform duration-200 hover:scale-[1.03]">
              <img src="https://launchit.fast/img/live.svg" alt="Live now on LaunchIt" width="180" height="54" loading="lazy" referrerPolicy="no-referrer" className="h-[54px] w-auto object-contain block" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
