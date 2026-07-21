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
  FolderArchive
} from "lucide-react";

interface LandingPageProps {
  onOpenAuth: () => void;
}

export default function LandingPage({ onOpenAuth }: LandingPageProps) {
  // Simulator State
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [simulatedBgType, setSimulatedBgType] = useState<"solid" | "transparent">("solid");
  const [simulatedBgColor, setSimulatedBgColor] = useState<"#00FF00" | "#FF00FF" | "#00FFFF">("#00FF00");
  const [simulatedErosion, setSimulatedErosion] = useState<number>(0);
  const [simulatedBlur, setSimulatedBlur] = useState<number>(0);

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

  return (
    <div className="min-h-screen bg-[#07080a] text-gray-100 font-sans selection:bg-emerald-500/30 selection:text-white">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-20 border-b border-gray-900 bg-gradient-to-b from-[#0a0c14] to-[#07080a]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest mb-6">
            <Sparkles className="h-3 w-3 animate-pulse" />
            Workspace Version 2.0 Active
          </span>
          
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto mb-6">
            Pixel Isolate Background Remover for <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">High-Volume</span> Digital Creators
          </h1>
          
          <p className="text-sm md:text-base text-gray-400 max-w-3xl mx-auto mb-8 leading-relaxed font-light">
            The advanced pixel isolate background remover built for print-on-demand designers, e-commerce stores, and digital artists. Extract clean alpha masks at subpixel speeds directly in your browser.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onOpenAuth}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm hover:shadow-lg hover:shadow-emerald-500/15 active:scale-[0.99] transition duration-200 flex items-center gap-2 cursor-pointer"
            >
              <Zap className="h-4 w-4 fill-current text-white" />
              <span>Initialize 10 Free Credits</span>
            </button>
            <a
              href="#pricing"
              className="px-6 py-3.5 rounded-xl bg-gray-950 hover:bg-gray-850 border border-gray-850 text-gray-300 font-semibold text-sm transition duration-200 cursor-pointer"
            >
              View Pricing Tiers
            </a>
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
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => { setSelectedPreset("badge"); setSimulatedBgType("solid"); }}
                          className={`p-3 rounded-xl border text-left transition ${selectedPreset === "badge" ? "bg-emerald-500/5 border-emerald-500/30 text-white" : "bg-gray-950/40 border-gray-850 text-gray-400 hover:text-gray-200"}`}
                        >
                          <span className="block text-[10px] font-mono font-bold">brand_logo_workspace</span>
                          <span className="block text-[8px] font-mono text-gray-500 mt-1">1000 x 300px | PNG</span>
                        </button>
                        <button
                          onClick={() => { setSelectedPreset("sneaker"); setSimulatedBgType("solid"); }}
                          className={`p-3 rounded-xl border text-left transition ${selectedPreset === "sneaker" ? "bg-emerald-500/5 border-emerald-500/30 text-white" : "bg-gray-950/40 border-gray-850 text-gray-400 hover:text-gray-200"}`}
                        >
                          <span className="block text-[10px] font-mono font-bold">model_hair_refinement</span>
                          <span className="block text-[8px] font-mono text-gray-500 mt-1">1024 x 680px | JPG</span>
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
                    onClick={onOpenAuth}
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
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setMagicPreset("model")}
                        className={`py-2 text-center rounded-lg border transition text-[9px] font-bold ${magicPreset === "model" ? "bg-emerald-500/5 border-emerald-500/30 text-white" : "bg-gray-950/40 border-gray-850 text-gray-500 hover:text-gray-300"}`}
                      >
                        model_hair_portrait
                      </button>
                      <button 
                        onClick={() => setMagicPreset("sneaker")}
                        className={`py-2 text-center rounded-lg border transition text-[9px] font-bold ${magicPreset === "sneaker" ? "bg-emerald-500/5 border-emerald-500/30 text-white" : "bg-gray-950/40 border-gray-850 text-gray-500 hover:text-gray-300"}`}
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
                  onClick={onOpenAuth}
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
                <img src="/logo.png" className="max-w-full max-h-full object-contain z-10" alt="brand logo isolation preview" />
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
                <img src="/history_model.png" className="max-w-full max-h-full object-contain z-10" alt="model isolation preview" />
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
                <img src="/history_sneaker.png" className="max-w-full max-h-full object-contain z-10" alt="sneaker isolation preview" />
              </div>
              <div className="truncate font-bold text-white">sneaker_isolated.png</div>
              <div className="text-[9px] text-gray-500 mt-1">1024 x 1024px | Original & Isolated</div>
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
                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-2">Configuration trial</span>
                <h3 className="text-xl font-bold text-white">Free Tier Plan</h3>
                <div className="my-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">$0</span>
                  <span className="text-gray-500 text-xs font-mono">/ forever</span>
                </div>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                  Excellent option to test the WASM keyer, refine templates, and explore threshold settings.
                </p>
                <ul className="space-y-3 font-mono text-[10px] text-gray-300 mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>10 Free initial credits</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Single subject isolation mode</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Max export: 500px resolution</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>3 HD / Full-Resolution trial exports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>1 Solid background trial export</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Full refinement settings access</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onOpenAuth}
                className="w-full py-3 bg-gray-900 border border-gray-850 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold active:scale-[0.99] transition duration-150 cursor-pointer"
              >
                Start Isolating Free
              </button>
            </div>

            {/* 100 Credit Bundle Card */}
            <div className="bg-gray-950/40 border border-gray-850 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div>
                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-2">Pay-As-You-Go</span>
                <h3 className="text-xl font-bold text-white">100 Credit Bundle</h3>
                <div className="my-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">$5</span>
                  <span className="text-gray-500 text-xs font-mono">one-time</span>
                </div>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                  Perfect for casual users who only need high-resolution asset downloads occasionally.
                </p>
                <ul className="space-y-3 font-mono text-[10px] text-gray-300 mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>100 Credits added to account</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>HD / Full-Resolution exports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>3 Solid background trial exports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Credits never expire</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Single subject isolation mode only</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onOpenAuth}
                className="w-full py-3 bg-gray-900 border border-gray-850 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold active:scale-[0.99] transition duration-150 cursor-pointer"
              >
                Purchase Credits
              </button>
            </div>

            {/* Pro Tier Card */}
            <div className="bg-gray-950/60 border border-emerald-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-[8px] font-mono font-bold text-white uppercase tracking-wider rounded-bl-lg shadow">
                MOST POPULAR
              </div>
              <div>
                <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest block mb-2">Mass production</span>
                <h3 className="text-xl font-bold text-white">Pro Tier Plan</h3>
                <div className="my-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">$7.99</span>
                  <span className="text-gray-500 text-xs font-mono">/ monthly</span>
                </div>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                  Optimized for digital agencies, high-volume e-commerce stores, and active content creators.
                </p>
                <ul className="space-y-3 font-mono text-[10px] text-gray-300 mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Unlimited</strong> keying workflows</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Full Original Resolution</strong> exports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Unlimited</strong> Solid BG colors (PRO)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Bulk Queue Processing</strong> (50+ files)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Persistent secure History Gallery</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>ZIP structured folder packaging</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onOpenAuth}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-xs font-bold hover:shadow-lg active:scale-[0.99] transition duration-150 cursor-pointer"
              >
                Upgrade to Pro Engine
              </button>
            </div>
          </div>

          {/* Comparison Matrix Table */}
          <div className="border border-gray-850 rounded-2xl bg-gray-950/20 backdrop-blur-md overflow-hidden">
            <div className="p-4 border-b border-gray-850 bg-gray-950/40 font-mono text-[10px] text-gray-500">
              [ CAPABILITY COMPARISON VECTOR MATRIX ]
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px] text-gray-400 border-collapse">
                <thead>
                  <tr className="border-b border-gray-900 bg-gray-950/50 text-gray-500">
                    <th className="p-4 font-semibold uppercase">Capability Vector</th>
                    <th className="p-4 font-semibold uppercase">Free Tier Plan</th>
                    <th className="p-4 font-semibold uppercase">100 Credit Bundle</th>
                    <th className="p-4 font-semibold uppercase">Pro Tier Plan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900">
                  <tr className="hover:bg-gray-900/20 transition">
                    <td className="p-4 font-bold text-gray-300">Initial Allotted Credits</td>
                    <td className="p-4">10 Trial Credits</td>
                    <td className="p-4">100 Credits</td>
                    <td className="p-4 text-emerald-400 font-bold">Unlimited Access</td>
                  </tr>
                  <tr className="hover:bg-gray-900/20 transition">
                    <td className="p-4 font-bold text-gray-300">HD / Full-Res Exports</td>
                    <td className="p-4">3 Trial Exports</td>
                    <td className="p-4 text-amber-400 font-semibold">Unlimited (per credit)</td>
                    <td className="p-4 text-emerald-400 font-bold">Unlimited Access</td>
                  </tr>
                  <tr className="hover:bg-gray-900/20 transition">
                    <td className="p-4 font-bold text-gray-300">Max Download Resolution</td>
                    <td className="p-4">Standard Resolution (500px)</td>
                    <td className="p-4">Full Original HD / Ultra-HD</td>
                    <td className="p-4 text-emerald-400 font-bold">Full Original HD / Ultra-HD</td>
                  </tr>
                  <tr className="hover:bg-gray-900/20 transition">
                    <td className="p-4 font-bold text-gray-300">Solid BG Backdrops</td>
                    <td className="p-4">1 Trial Export</td>
                    <td className="p-4">3 Trial Exports</td>
                    <td className="p-4 text-emerald-400 font-bold">Unlimited Access (Custom Hex)</td>
                  </tr>
                  <tr className="hover:bg-gray-900/20 transition">
                    <td className="p-4 font-bold text-gray-300">Ingestion Capacity</td>
                    <td className="p-4">Single File Processing</td>
                    <td className="p-4">Single File Processing</td>
                    <td className="p-4 text-emerald-400 font-bold">Parallel Mass Bulk (50+ Files)</td>
                  </tr>
                  <tr className="hover:bg-gray-900/20 transition">
                    <td className="p-4 font-bold text-gray-300">Mask Customization Tools</td>
                    <td className="p-4">Included</td>
                    <td className="p-4">Included</td>
                    <td className="p-4">Included</td>
                  </tr>
                  <tr className="hover:bg-gray-900/20 transition">
                    <td className="p-4 font-bold text-gray-300">Cloud Archive Storage</td>
                    <td className="p-4">Standard (Restricted)</td>
                    <td className="p-4">Standard (Restricted)</td>
                    <td className="p-4 text-emerald-400 font-bold">Extended Lifecycle</td>
                  </tr>
                  <tr className="hover:bg-gray-900/20 transition">
                    <td className="p-4 font-bold text-gray-300">Export Formats</td>
                    <td className="p-4">Raw PNG</td>
                    <td className="p-4">Raw PNG</td>
                    <td className="p-4 text-emerald-400 font-bold">Structured ZIP Archive</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 5.5. Technical Methodology Section (GEO Optimized) */}
      <section className="py-20 border-t border-b border-gray-900 bg-[#07080a]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="border border-gray-850 rounded-2xl bg-gray-950/40 p-8 relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest block mb-3">
              [ ENGINE SPECIFICATION PROTOCOL ]
            </span>
            <h3 className="text-xl font-bold text-white tracking-tight mb-4">
              Core Extraction Methodology & Edge Morphologies
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed font-mono">
              The Pixel Isolate Background Remover utilizes WebAssembly (WASM) to execute hardware-accelerated morphological edge operations directly in the browser's sandbox. By avoiding cloud latency, the engine performs high-frequency subpixel color-key thresholding to isolate subject outlines with zero quality degradation. In print-on-demand and e-commerce workflows, extraction accuracy is governed by three specific morphological steps. First, the source image is parsed into an 8-bit RGBA canvas, preserving raw dimensions. Next, an HSV color-space mask segments the targeted chrominance key, creating a binary connectivity map. Finally, boundary correction algorithms apply erosion (cv2.erode) to contract halos, dilation (cv2.dilate) to bridge voids, and Gaussian Blur feathering to blend pixel fringes. This combination solves green-screen spill and jagged transparency borders without high computing overhead. E-commerce operators and digital designers can automate these pipelines to export production-ready PNGs or package batch assets into structured archives, optimizing processing speed and output resolution.
            </p>
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
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm hover:shadow-lg hover:shadow-emerald-500/15 active:scale-[0.99] transition duration-200 cursor-pointer"
          >
            Deploy Your Free Workspace
          </button>
        </div>
      </section>
    </div>
  );
}
