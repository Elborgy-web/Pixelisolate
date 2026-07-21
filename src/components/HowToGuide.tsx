import React, { useState } from "react";
import { 
  Sparkles, 
  Droplet, 
  Sliders, 
  Brush, 
  Layers, 
  Download, 
  BookOpen, 
  RotateCcw, 
  Plus, 
  Minus,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Maximize2,
  Palette
} from "lucide-react";

interface HowToGuideProps {
  onGoToEditor: () => void;
  isLoggedIn: boolean;
}

export default function HowToGuide({ onGoToEditor, isLoggedIn }: HowToGuideProps) {
  const [activeSection, setActiveSection] = useState<string>("ai-magic");

  const sections = [
    {
      id: "ai-magic",
      title: "AI Magic Cutout",
      icon: Sparkles,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      id: "chroma-key",
      title: "Chroma Key Workspace",
      icon: Droplet,
      color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
    },
    {
      id: "solid-bg",
      title: "Solid Color Backdrops",
      icon: Palette,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
    {
      id: "refinements",
      title: "Edge Refinement Sliders",
      icon: Sliders,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      id: "manual-brush",
      title: "Manual Brush & Undo",
      icon: Brush,
      color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    },
    {
      id: "bulk-merge",
      title: "Bulk Mode & Background Merging",
      icon: Layers,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 py-4 animate-fade-in">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-3">
        <div className="p-4.5 bg-gray-950/60 rounded-2xl border border-gray-900 flex flex-col gap-1.5">
          <h2 className="text-xs font-mono uppercase tracking-wider text-gray-500">Documentation</h2>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Learn how to extract pixel-perfect assets, fine-tune mask thresholds, and correct AI boundaries.
          </p>
        </div>

        <nav className="flex flex-col gap-1.5 bg-gray-950/40 p-2 rounded-2xl border border-gray-900/60">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                  isActive 
                    ? "bg-gray-850 text-white border border-gray-800 shadow" 
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-900/30"
                }`}
              >
                <div className={`p-1.5 rounded-lg border ${sec.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span>{sec.title}</span>
              </button>
            );
          })}
        </nav>

        <button
          onClick={onGoToEditor}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xl shadow-emerald-950/20 mt-2"
        >
          <span>Open Editor Workspace</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-gray-950/40 border border-gray-900 rounded-3xl p-6 md:p-8 min-h-[480px]">
        {activeSection === "ai-magic" && (
          <div className="flex flex-col gap-6 animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">AI Magic Cutout Mode</h1>
                <p className="text-xs font-mono text-gray-500 uppercase tracking-wider mt-0.5">SOTA Neural Segmentation</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed max-w-3xl">
              AI Magic mode leverages client-side WebAssembly execution to isolate subjects without transmitting your private images to external servers. It runs a full 32-bit precision <code className="text-emerald-400 font-mono font-bold bg-emerald-950/40 px-1 py-0.5 rounded border border-emerald-900/30">isnet</code> neural network model directly in the browser to distinguish subject edges.
            </p>

            <hr className="border-gray-900" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-950/60 p-4.5 rounded-2xl border border-gray-900 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-white font-mono uppercase tracking-wide">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span>Automated Object Recovery</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  For portraits where a person is holding a light-colored object (like open books, mugs, or papers), standard human models often chop the object out. Our automated BFS Connected-Component analysis detects connected light colors and automatically restores them into the foreground mask.
                </p>
              </div>

              <div className="bg-gray-950/60 p-4.5 rounded-2xl border border-gray-900 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-white font-mono uppercase tracking-wide">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span>GPU Acceleration (WebGPU)</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  The model utilizes Chrome and Edge’s native WebGPU features to run on your device's graphics card. This delivers sub-second background removals and ensures smooth bulk queues without relying on slow cloud CPU clusters.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 bg-emerald-950/20 border border-emerald-900/30 p-4 rounded-2xl">
              <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase font-mono">
                <HelpCircle className="h-4 w-4 shrink-0" />
                <span>When to use AI Magic</span>
              </h3>
              <p className="text-[11px] text-emerald-300/80 leading-relaxed">
                Ideal for portraits, ecommerce products, fashion photos, vehicles, and animal cutouts. Because the model is optimized for real-world photo subjects, it handles textures like hair and fabric with high edge fidelity.
              </p>
            </div>
          </div>
        )}

        {activeSection === "chroma-key" && (
          <div className="flex flex-col gap-6 animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                <Droplet className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Chroma Key Workspace</h1>
                <p className="text-xs font-mono text-gray-500 uppercase tracking-wider mt-0.5">High-Precision Color Keying</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed max-w-3xl">
              Chroma Key mode gives you professional studio controls for green, blue, or custom backdrop removals. It maps colors from RGB to Hue-Saturation-Value (HSV) space to isolate solid colors with high surgical accuracy.
            </p>

            <hr className="border-gray-900" />

            <div className="flex flex-col gap-4">
              <div className="bg-gray-950/60 p-4 rounded-2xl border border-gray-900 flex flex-col gap-3">
                <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wide">Key Parameters:</h3>
                <ul className="flex flex-col gap-3.5 text-[11px] text-gray-400">
                  <li className="flex gap-2">
                    <strong className="text-teal-400 font-mono font-bold w-28 shrink-0">Hue boundaries:</strong>
                    <span>Defines the color spectrum range to target (e.g. 35 to 85 for classic chroma green).</span>
                  </li>
                  <li className="flex gap-2">
                    <strong className="text-teal-400 font-mono font-bold w-28 shrink-0">Saturation limits:</strong>
                    <span>Filters out pixels based on color purity. Lowering satMin key out pastel or washed-out green screen walls.</span>
                  </li>
                  <li className="flex gap-2">
                    <strong className="text-teal-400 font-mono font-bold w-28 shrink-0">Value (Brightness):</strong>
                    <span>Adjusts keying sensitivity under shadow. Lowering valMin targets dark shadowed corners of your backdrop.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-950/60 p-4 rounded-2xl border border-gray-900 flex flex-col gap-2">
                <div className="text-xs font-bold text-white font-mono uppercase tracking-wide flex items-center gap-1.5">
                  <Maximize2 className="h-3.5 w-3.5 text-teal-400" />
                  <span>Smart Connected Component BFS</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed mt-1">
                  Enabling **Smart Connectivity (BFS)** starts the color extraction from the corners of the image, flooding inwards. This protects interior subjects (like green logos, eyes, or clothing designs) from being erroneously keyed out and preserves internal design integrity.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSection === "refinements" && (
          <div className="flex flex-col gap-6 animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                <Sliders className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Edge Refinement Sliders</h1>
                <p className="text-xs font-mono text-gray-500 uppercase tracking-wider mt-0.5">Post-Processing Morphological Filters</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed max-w-3xl">
              Post-processing sliders apply structural pixel operators directly to the alpha mask channel. This is essential for cleaning up edge halos, green-screen spill margins, or smoothing aliased stair-stepping boundaries.
            </p>

            <hr className="border-gray-900" />

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-950/60 p-4 rounded-2xl border border-gray-900 flex flex-col gap-2">
                  <span className="text-xs font-bold text-amber-400 font-mono uppercase tracking-wide">Erosion</span>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    Shrinks the boundary of the foreground subject mask. A 1-2px erosion is highly recommended to strip away residual green pixels on green-screen borders.
                  </p>
                </div>
                <div className="bg-gray-950/60 p-4 rounded-2xl border border-gray-900 flex flex-col gap-2">
                  <span className="text-xs font-bold text-amber-400 font-mono uppercase tracking-wide">Dilation</span>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    Expands the boundary of the foreground subject mask outward. Useful to recover thin elements or outer limits that were slightly over-keyed.
                  </p>
                </div>
                <div className="bg-gray-950/60 p-4 rounded-2xl border border-gray-900 flex flex-col gap-2">
                  <span className="text-xs font-bold text-amber-400 font-mono uppercase tracking-wide">Feathering</span>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    Applies a sub-pixel box blur to the alpha channel edges. This creates transparent gradients at the boundaries, allowing isolated elements to blend naturally onto new backdrops.
                  </p>
                </div>
              </div>

              <div className="bg-amber-950/10 border border-amber-900/20 p-4 rounded-2xl text-[11px] text-amber-300/80 leading-relaxed">
                <strong>Pro-Tip:</strong> In **AI Magic** mode, the neural mask is already highly smoothed. We automatically set default Erosion to <code className="font-mono bg-amber-950/50 px-1 py-0.5 rounded">0</code> to prevent loss of detail. Only use erosion if your raw AI boundary has a slight halo.
              </div>
            </div>
          </div>
        )}

        {activeSection === "manual-brush" && (
          <div className="flex flex-col gap-6 animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <Brush className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Manual Mask Refinement Brush</h1>
                <p className="text-xs font-mono text-gray-500 uppercase tracking-wider mt-0.5">Interactive Brush & Undo</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed max-w-3xl">
              No AI model is 100% correct on every image. Our workspace equips you with a professional brush tool that lets you paint corrections directly onto the image's transparency channel with pixel accuracy.
            </p>

            <hr className="border-gray-900" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-950/60 p-4.5 rounded-2xl border border-gray-900 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 font-mono uppercase tracking-wide">
                  <Plus className="h-4 w-4" />
                  <span>Restore Brush</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Paints mask pixels back to <code className="text-emerald-400 font-mono bg-emerald-950/30 px-1">255</code> (fully visible). Use this to restore subjects, books, or details that were incorrectly classified as background.
                </p>
              </div>

              <div className="bg-gray-950/60 p-4.5 rounded-2xl border border-gray-900 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-400 font-mono uppercase tracking-wide">
                  <Minus className="h-4 w-4" />
                  <span>Erase Brush</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Paints mask pixels back to <code className="text-rose-400 font-mono bg-rose-950/30 px-1">0</code> (transparent). Use this to rub out leftover background components, dust, or shadows that the AI model failed to delete.
                </p>
              </div>
            </div>

            <div className="bg-gray-950/60 p-4 rounded-2xl border border-gray-900 flex flex-col gap-3">
              <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wide">Key Features:</h3>
              <ul className="flex flex-col gap-3 text-[11px] text-gray-400">
                <li className="flex gap-2">
                  <strong className="text-rose-400 font-mono font-bold w-32 shrink-0">Dynamic Circle Cursor:</strong>
                  <span>Your mouse cursor transforms into a dashed circular preview of the exact brush size, color-coded by mode (green for Restore, red for Erase).</span>
                </li>
                <li className="flex gap-2">
                  <strong className="text-rose-400 font-mono font-bold w-32 shrink-0">Multi-Step Undo:</strong>
                  <span>Every paint stroke saves a snapshot of the mask. Click the **Undo** button in the Refinement section header to revert changes sequentially.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeSection === "bulk-merge" && (
          <div className="flex flex-col gap-6 animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Bulk Mode & Background Merging</h1>
                <p className="text-xs font-mono text-gray-500 uppercase tracking-wider mt-0.5">Automated Multi-Image Pipelines</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed max-w-3xl">
              Maximize efficiency by queuing multiple images simultaneously. Pro users can run bulk background removals, apply consistent edge erosions across entire datasets, and merge custom background colors in a single export.
            </p>

            <hr className="border-gray-900" />

            <div className="bg-gray-950/60 p-4.5 rounded-2xl border border-gray-900 flex flex-col gap-3">
              <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wide">Standard Workflow:</h3>
              <ol className="flex flex-col gap-3 text-[11px] text-gray-400 list-decimal pl-4">
                <li>
                  <span>**Batch Upload**: Drag and drop up to 100 images into the bulk workspace container.</span>
                </li>
                <li>
                  <span>**Unified Sliders**: Adjust Hue, Saturation, Erosion, or select AI Magic. These settings apply globally to all images in the queue.</span>
                </li>
                <li>
                  <span>**Merged Backdrops**: In the Merge settings, select Solid Color (e.g. solid white for ecommerce) or keep it Transparent.</span>
                </li>
                <li>
                  <span>**Batch Download**: Click **Process & Export**. The engine runs background threads and downloads your isolated files packaged inside a single **.ZIP** archive.</span>
                </li>
              </ol>
            </div>
          </div>
        )}

        {activeSection === "solid-bg" && (
          <div className="flex flex-col gap-6 animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Palette className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Solid Color Background Selector</h1>
                <p className="text-xs font-mono text-gray-500 uppercase tracking-wider mt-0.5">Instant Product Compliance & Previewing</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed max-w-3xl">
              Instantly swap out transparent checkerboard backgrounds with solid color backdrops inside the workspace editor. This provides rapid Amazon/eBay listing compliance and checks logo readability against dark or light brand themes.
            </p>

            <hr className="border-gray-900" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-950/60 p-4.5 rounded-2xl border border-gray-900 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-400 font-mono uppercase tracking-wide">
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                  <span>Standard Fast Backdrops</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Switch instantly between transparent checkerboard, solid white (`#FFFFFF`) for product listings, or solid black (`#000000`) for high-contrast apparel mockups with a single click.
                </p>
              </div>

              <div className="bg-gray-950/60 p-4.5 rounded-2xl border border-gray-900 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-400 font-mono uppercase tracking-wide">
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                  <span>Hex Code Spectrum Input</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Enter any custom 6-digit hex code or open the native color picker menu to choose exactly the solid color backdrop that fits your marketing creative template.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 bg-purple-950/20 border border-purple-900/30 p-4 rounded-2xl">
              <h3 className="text-xs font-bold text-purple-400 flex items-center gap-1.5 uppercase font-mono">
                <HelpCircle className="h-4 w-4 shrink-0" />
                <span>Trial Gating & Subscriptions</span>
              </h3>
              <p className="text-[11px] text-purple-300/80 leading-relaxed">
                Free Tier and credit bundle accounts include **3 free trial exports** of solid color backgrounds. After trials are used up, exporting custom backdrops requires upgrading to the **Pro Tier**. Standard transparent PNG downloads are always free.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
