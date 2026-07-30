import React, { useState, useRef, useCallback } from "react";
import JSZip from "jszip";
import {
  processSuperResolution,
  detectImageCategory,
  ImageCategory,
  UpscaleTarget,
  UpscaleResult,
} from "../utils/upscalerEngine";
import {
  Upload,
  Sparkles,
  Zap,
  Crown,
  Download,
  RefreshCw,
  FileImage,
  Lock,
  ZoomIn,
  ZoomOut,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  Trash2,
  FolderDown,
  Plus,
  Columns,
  Sliders,
  Eye,
  RotateCcw,
} from "lucide-react";

interface UpscalerWorkspaceProps {
  user: any;
  profile: any;
  isPro: boolean;
  onOpenPricing?: () => void;
  onOpenAuth?: () => void;
}

export interface BulkUpscaleItem {
  id: string;
  file: File;
  previewUrl: string;
  status: "pending" | "processing" | "complete" | "error";
  progressPct: number;
  progressMsg: string;
  result?: UpscaleResult;
  category: ImageCategory;
}

export const UpscalerWorkspace: React.FC<UpscalerWorkspaceProps> = ({
  user,
  profile,
  isPro,
  onOpenPricing,
}) => {
  // Mode selection
  const [workMode, setWorkMode] = useState<"single" | "bulk">("single");

  // Single mode state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [detectedCategory, setDetectedCategory] = useState<ImageCategory>("graphic");
  const [selectedCategory, setSelectedCategory] = useState<ImageCategory>("graphic");
  const [selectedTarget, setSelectedTarget] = useState<UpscaleTarget>("4k");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<{ label: string; pct: number } | null>(null);
  const [upscaleResult, setUpscaleResult] = useState<UpscaleResult | null>(null);
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isZoomMode, setIsZoomMode] = useState<boolean>(false);
  const [zoomMultiplier, setZoomMultiplier] = useState<number>(3);
  const [comparisonMode, setComparisonMode] = useState<"split" | "sideBySide">("split");
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [sideZoom, setSideZoom] = useState<number>(1);

  const leftSideRef = useRef<HTMLDivElement>(null);
  const rightSideRef = useRef<HTMLDivElement>(null);

  const handleSideScroll = (source: "left" | "right") => {
    const srcEl = source === "left" ? leftSideRef.current : rightSideRef.current;
    const targetEl = source === "left" ? rightSideRef.current : leftSideRef.current;
    if (srcEl && targetEl) {
      targetEl.scrollLeft = srcEl.scrollLeft;
      targetEl.scrollTop = srcEl.scrollTop;
    }
  };

  const handleClearSingleImage = () => {
    setImageFile(null);
    setImageSrc(null);
    setUpscaleResult(null);
    setProgressStatus(null);
    setIsProcessing(false);
    setIsZoomMode(false);
  };

  // Bulk mode state
  const [bulkItems, setBulkItems] = useState<BulkUpscaleItem[]>([]);
  const [bulkProcessingActive, setBulkProcessingActive] = useState<boolean>(false);

  const [freeTrialUsed, setFreeTrialUsed] = useState<boolean>(() => {
    return localStorage.getItem("pixelisolate_upscale_trial_used") === "true";
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageLoad = useCallback((img: HTMLImageElement) => {
    const category = detectImageCategory(img);
    setDetectedCategory(category);
    setSelectedCategory(category);
  }, []);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPG, WebP).");
      return;
    }
    setImageFile(file);
    setUpscaleResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImageSrc(src);
      const img = new Image();
      img.onload = () => handleImageLoad(img);
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // Bulk File Selection
  const handleBulkFilesSelect = (files: FileList | File[]) => {
    const newItems: BulkUpscaleItem[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const previewUrl = URL.createObjectURL(file);
      const tempImg = new Image();
      tempImg.src = previewUrl;
      const category = detectImageCategory(tempImg);

      newItems.push({
        id: `bulk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl,
        status: "pending",
        progressPct: 0,
        progressMsg: "Queued",
        category,
      });
    });

    if (newItems.length > 0) {
      setBulkItems((prev) => [...prev, ...newItems]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (workMode === "bulk") {
        handleBulkFilesSelect(e.dataTransfer.files);
      } else {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    }
  };

  const handleExecuteUpscale = async () => {
    if (!imageSrc) return;

    if (!isPro && freeTrialUsed) {
      if (onOpenPricing) onOpenPricing();
      return;
    }

    setIsProcessing(true);
    setProgressStatus({ label: "Initializing Real-ESRGAN GPU Engine...", pct: 5 });

    try {
      const img = new Image();
      img.src = imageSrc;
      await new Promise((res) => (img.onload = res));

      const result = await processSuperResolution(
        img,
        selectedTarget,
        selectedCategory,
        "neural",
        (msg, pct) => setProgressStatus({ label: msg, pct })
      );

      setUpscaleResult(result);

      if (!isPro) {
        localStorage.setItem("pixelisolate_upscale_trial_used", "true");
        setFreeTrialUsed(true);
      }
    } catch (err) {
      console.error("Super-resolution upscaling failed:", err);
      alert("Failed to process image upscaling. Please try another image.");
    } finally {
      setIsProcessing(false);
      setProgressStatus(null);
    }
  };

  // Bulk Processing Queue
  const processBatchQueue = async () => {
    if (bulkItems.length === 0 || bulkProcessingActive) return;

    if (!isPro && freeTrialUsed) {
      if (onOpenPricing) onOpenPricing();
      return;
    }

    setBulkProcessingActive(true);

    for (let i = 0; i < bulkItems.length; i++) {
      const item = bulkItems[i];
      if (item.status === "complete") continue;

      setBulkItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, status: "processing", progressPct: 15, progressMsg: "Upscaling via Real-ESRGAN..." } : it
        )
      );

      try {
        const img = new Image();
        img.src = item.previewUrl;
        await new Promise((res) => (img.onload = res));

        const result = await processSuperResolution(
          img,
          selectedTarget,
          item.category,
          "neural",
          (msg, pct) => {
            setBulkItems((prev) =>
              prev.map((it) =>
                it.id === item.id ? { ...it, progressPct: pct, progressMsg: msg } : it
              )
            );
          }
        );

        setBulkItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? { ...it, status: "complete", progressPct: 100, progressMsg: "Done", result }
              : it
          )
        );
      } catch (err) {
        console.error(`Failed to upscale bulk item ${item.file.name}:`, err);
        setBulkItems((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, status: "error", progressMsg: "Failed" } : it
          )
        );
      }
    }

    if (!isPro) {
      localStorage.setItem("pixelisolate_upscale_trial_used", "true");
      setFreeTrialUsed(true);
    }

    setBulkProcessingActive(false);
  };

  // ZIP Bulk Download
  const downloadBulkZip = async () => {
    const completedItems = bulkItems.filter((i) => i.status === "complete" && i.result?.dataUrl);
    if (completedItems.length === 0) return;

    const zip = new JSZip();
    completedItems.forEach((item, idx) => {
      if (!item.result?.dataUrl) return;
      const cleanName = item.file.name.replace(/\.[^/.]+$/, "");
      const filename = `${cleanName}_upscaled_${selectedTarget}.png`;
      const base64Data = item.result.dataUrl.replace(/^data:image\/\w+;base64,/, "");
      zip.file(filename, base64Data, { base64: true });
    });

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pixelisolate_upscaled_batch_${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadItem = (item: BulkUpscaleItem) => {
    if (!item.result?.blob) return;
    const url = URL.createObjectURL(item.result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `upscaled-${selectedTarget}-${item.file.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownload = () => {
    if (!upscaleResult || !upscaleResult.blob) return;
    const url = URL.createObjectURL(upscaleResult.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `upscaled-${selectedTarget}-${upscaleResult.upscaledWidth}x${upscaleResult.upscaledHeight}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold mb-4">
          <Cpu className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
          <span>Real-ESRGAN NCNN Vulkan GPU Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
          AI Image Upscaler & Bulk Batch Engine
        </h1>
        <p className="text-sm text-gray-400 max-w-2xl mx-auto">
          Enlarge single or batch images up to 4K (3840px+) and 8K (7680px+) using the official Real-ESRGAN NCNN Vulkan engine (<span className="text-emerald-400 font-mono">realesrgan-x4plus-anime</span> & <span className="text-emerald-400 font-mono">realesrgan-x4plus</span>).
        </p>

        {/* Mode Switcher: Single vs Bulk */}
        <div className="mt-6 inline-flex p-1 bg-gray-900 border border-gray-800 rounded-2xl">
          <button
            onClick={() => setWorkMode("single")}
            className={`px-5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              workMode === "single"
                ? "bg-emerald-500 text-gray-950 font-bold shadow-lg shadow-emerald-500/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <FileImage className="h-4 w-4" />
            <span>Single Image Upscaler</span>
          </button>

          <button
            onClick={() => setWorkMode("bulk")}
            className={`px-5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              workMode === "bulk"
                ? "bg-emerald-500 text-gray-950 font-bold shadow-lg shadow-emerald-500/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Bulk Batch Upscaler</span>
            {bulkItems.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-gray-950 text-emerald-400 text-[10px] font-mono font-bold">
                {bulkItems.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* SINGLE IMAGE MODE */}
      {workMode === "single" && (
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Control Panel */}
          <div className="lg:col-span-4 flex flex-col gap-6 bg-gray-900/60 border border-gray-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
            {/* Upload Dropzone */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 font-semibold">
                  Source Image
                </label>
                {imageSrc && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearSingleImage();
                    }}
                    className="px-2 py-0.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold flex items-center gap-1 transition cursor-pointer"
                    title="Remove source image and reset result"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Clear Image</span>
                  </button>
                )}
              </div>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="relative border-2 border-dashed border-gray-700 hover:border-emerald-500/50 rounded-2xl p-6 text-center cursor-pointer transition group bg-gray-950/40 hover:bg-gray-900/50"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />

                {imageSrc ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative h-32 w-full max-w-[200px] rounded-xl overflow-hidden border border-gray-800 bg-gray-950 flex items-center justify-center">
                      <img src={imageSrc} alt="Source" className="h-full w-full object-contain" />
                    </div>
                    <span className="text-xs text-gray-400 font-mono truncate max-w-[200px]">
                      {imageFile?.name || "Loaded Image"}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">Click to change</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Upload className="h-8 w-8 text-emerald-400 group-hover:scale-110 transition duration-300" />
                    <span className="text-xs font-semibold text-gray-300">Drop image here or click to browse</span>
                    <span className="text-[10px] text-gray-500 font-mono">PNG, JPG, WebP up to 50MB</span>
                  </div>
                )}
              </div>
            </div>

            {/* Target Resolution Toggle */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-gray-400 font-semibold">
                Target Resolution
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(["2x", "4k", "8k"] as UpscaleTarget[]).map((tgt) => (
                  <button
                    key={tgt}
                    onClick={() => setSelectedTarget(tgt)}
                    className={`py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex flex-col items-center ${
                      selectedTarget === tgt
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                        : "bg-gray-950/60 border-gray-800 text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <span className="uppercase font-bold">{tgt}</span>
                    <span className="text-[9px] text-gray-500 font-mono">
                      {tgt === "2x" ? "200% Scale" : tgt === "4k" ? "Ultra HD 4K" : "Full 8K Print"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-Detection Badge & Category Selector */}
            {imageSrc && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-gray-400 font-semibold">
                    Category Model Tuning
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-mono font-semibold">
                    Auto-Detected: {detectedCategory}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(["graphic", "product", "portrait"] as ImageCategory[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`py-2 rounded-xl border text-[11px] font-medium transition cursor-pointer capitalize ${
                        selectedCategory === cat
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold"
                          : "bg-gray-950/60 border-gray-800 text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      {cat === "graphic" ? "Graphic / Text" : cat === "product" ? "Product" : "Portrait"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Execute Button */}
            <button
              onClick={handleExecuteUpscale}
              disabled={!imageSrc || isProcessing}
              className={`w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shadow-lg ${
                !imageSrc || isProcessing
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                  : !isPro && freeTrialUsed
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-gray-950 hover:brightness-110 shadow-amber-500/20"
                  : "bg-emerald-500 hover:bg-emerald-400 text-gray-950 shadow-emerald-500/20"
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Processing Super-Resolution...</span>
                </>
              ) : !isPro && freeTrialUsed ? (
                <>
                  <Crown className="h-4 w-4" />
                  <span>Upgrade to Pro for Unlimited 8K</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Upscale Image to {selectedTarget.toUpperCase()}</span>
                </>
              )}
            </button>

            {/* Progress Status Bar */}
            {isProcessing && progressStatus && (
              <div className="flex flex-col gap-2 p-3.5 bg-gray-950/80 border border-gray-800 rounded-xl">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-gray-300 truncate max-w-[200px]">{progressStatus.label}</span>
                  <span className="text-emerald-400 font-bold">{progressStatus.pct}%</span>
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${progressStatus.pct}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Display Area */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6 min-h-[500px] flex flex-col justify-between shadow-xl backdrop-blur-xl">
              {!imageSrc ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-16 text-gray-500">
                  <FileImage className="h-16 w-16 mb-4 text-gray-700 stroke-1" />
                  <h3 className="text-lg font-semibold text-gray-400 mb-1">No Image Loaded</h3>
                  <p className="text-xs text-gray-600 max-w-sm">
                    Upload an image on the left panel to test Real-ESRGAN super-resolution.
                  </p>
                </div>
              ) : upscaleResult ? (
                <div className="flex-1 flex flex-col gap-4">
                  {/* Result Controls Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-950/80 p-3.5 rounded-2xl border border-gray-800 shadow-lg">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      {/* View Mode: Split vs Side-by-Side */}
                      <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-0.5">
                        <button
                          onClick={() => setComparisonMode("split")}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
                            comparisonMode === "split"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold"
                              : "text-gray-400 hover:text-white"
                          }`}
                          title="Split slider view"
                        >
                          <Sliders className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Split Slider</span>
                        </button>
                        <button
                          onClick={() => setComparisonMode("sideBySide")}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
                            comparisonMode === "sideBySide"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold"
                              : "text-gray-400 hover:text-white"
                          }`}
                          title="Side-by-side view"
                        >
                          <Columns className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Side-by-Side</span>
                        </button>
                      </div>

                      {/* Inspect Zoom Loupe Toggle (Split Mode Only) */}
                      {comparisonMode === "split" ? (
                        <>
                          <button
                            onClick={() => setIsZoomMode(!isZoomMode)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition flex items-center gap-1.5 cursor-pointer ${
                              isZoomMode
                                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold shadow-[0_0_12px_rgba(52,211,153,0.3)]"
                                : "bg-gray-900 border-gray-800 text-gray-400 hover:text-white"
                            }`}
                          >
                            <ZoomIn className="h-3.5 w-3.5" />
                            <span>{isZoomMode ? "Loupe Active" : "Inspect Zoom"}</span>
                          </button>

                          {/* Zoom Level Selectors */}
                          {isZoomMode && (
                            <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-0.5 animate-fade-in">
                              {[2, 4, 6].map((lvl) => (
                                <button
                                  key={lvl}
                                  onClick={() => setZoomMultiplier(lvl)}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition cursor-pointer ${
                                    zoomMultiplier === lvl
                                      ? "bg-emerald-500 text-gray-950 font-bold"
                                      : "text-gray-400 hover:text-white"
                                  }`}
                                >
                                  {lvl}x
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        /* Side-by-Side Direct Zoom Controls (up to 1000% / 10x) */
                        <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 rounded-xl p-1 animate-fade-in flex-wrap">
                          <button
                            onClick={() => setSideZoom((z) => Math.max(1, Number((z <= 4 ? z - 1 : z - 2).toFixed(1))))}
                            disabled={sideZoom <= 1}
                            className="p-1 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition cursor-pointer"
                            title="Zoom Out Side-by-Side View"
                          >
                            <ZoomOut className="h-3.5 w-3.5" />
                          </button>

                          <span className="px-1 text-[10px] font-mono text-emerald-400 font-bold min-w-[50px] text-center">
                            {Math.round(sideZoom * 100)}%
                          </span>

                          <button
                            onClick={() => setSideZoom((z) => Math.min(10, Number((z < 4 ? z + 1 : z + 2).toFixed(1))))}
                            disabled={sideZoom >= 10}
                            className="p-1 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition cursor-pointer"
                            title="Zoom In Side-by-Side View"
                          >
                            <ZoomIn className="h-3.5 w-3.5" />
                          </button>

                          <div className="h-3.5 w-[1px] bg-gray-800 mx-0.5 hidden sm:block" />

                          {/* Direct Preset Level Pills */}
                          <div className="hidden sm:flex items-center gap-1">
                            {[1, 2, 4, 6, 8, 10].map((lvl) => (
                              <button
                                key={lvl}
                                onClick={() => setSideZoom(lvl)}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition cursor-pointer ${
                                  sideZoom === lvl
                                    ? "bg-emerald-500 text-gray-950 font-bold"
                                    : "text-gray-400 hover:text-white"
                                }`}
                              >
                                {lvl * 100}%
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleClearSingleImage}
                        className="px-3 py-2 rounded-xl bg-gray-900 hover:bg-rose-500/10 border border-gray-800 hover:border-rose-500/30 text-gray-400 hover:text-rose-400 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
                        title="Clear workspace"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Clear</span>
                      </button>
                      <button
                        onClick={handleDownload}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download {upscaleResult.upscaledWidth}x{upscaleResult.upscaledHeight} PNG</span>
                      </button>
                    </div>
                  </div>

                  {/* COMPARISON VIEWPORT */}
                  {comparisonMode === "sideBySide" ? (
                    /* Side-by-Side Dual Viewport with Synced Zoom & Scroll */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[420px]">
                      {/* Left: Original Panel */}
                      <div
                        ref={leftSideRef}
                        onScroll={() => handleSideScroll("left")}
                        className="relative rounded-2xl overflow-auto border border-gray-800 bg-gray-950 flex items-center justify-center p-4 min-h-[420px] max-h-[550px] select-none"
                      >
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-gray-950/90 border border-gray-800 text-[10px] font-mono text-gray-400 font-bold z-10 backdrop-blur-md">
                          BEFORE: ORIGINAL ({upscaleResult.originalWidth}x{upscaleResult.originalHeight})
                        </span>
                        <div
                          className="flex items-center justify-center transition-all duration-150"
                          style={{
                            minWidth: `${sideZoom * 100}%`,
                            minHeight: `${sideZoom * 100}%`,
                          }}
                        >
                          <img
                            src={imageSrc}
                            alt="Original"
                            className="transition-transform duration-150 origin-center max-h-[380px] w-auto object-contain rounded-lg"
                            style={{
                              transform: `scale(${sideZoom})`,
                              transformOrigin: "center center",
                              imageRendering: sideZoom >= 3 ? "pixelated" : "auto",
                            }}
                          />
                        </div>
                      </div>

                      {/* Right: Upscaled Panel */}
                      <div
                        ref={rightSideRef}
                        onScroll={() => handleSideScroll("right")}
                        className="relative rounded-2xl overflow-auto border border-emerald-500/30 bg-gray-950 flex items-center justify-center p-4 min-h-[420px] max-h-[550px] select-none shadow-[0_0_20px_rgba(52,211,153,0.05)]"
                      >
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400 font-bold z-10 backdrop-blur-md">
                          AFTER: REAL-ESRGAN {upscaleResult.scaleFactor}X ({upscaleResult.upscaledWidth}x{upscaleResult.upscaledHeight})
                        </span>
                        <div
                          className="flex items-center justify-center transition-all duration-150"
                          style={{
                            minWidth: `${sideZoom * 100}%`,
                            minHeight: `${sideZoom * 100}%`,
                          }}
                        >
                          <img
                            src={upscaleResult.dataUrl}
                            alt="Upscaled"
                            className="transition-transform duration-150 origin-center max-h-[380px] w-auto object-contain rounded-lg"
                            style={{
                              transform: `scale(${sideZoom})`,
                              transformOrigin: "center center",
                              imageRendering: sideZoom >= 3 ? "pixelated" : "auto",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Split Comparison Canvas */
                    <div
                      ref={containerRef}
                      onMouseMove={handleMouseMove}
                      className="relative flex-1 min-h-[400px] w-full rounded-2xl overflow-hidden border border-gray-800 bg-gray-950 select-none cursor-crosshair"
                    >
                      {/* Before Image */}
                      <img
                        src={imageSrc}
                        alt="Original"
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                      />

                      {/* After Image (Clipped) */}
                      <div
                        className="absolute inset-0 overflow-hidden pointer-events-none"
                        style={{ width: `${sliderPosition}%` }}
                      >
                        <img
                          src={upscaleResult.dataUrl}
                          alt="Upscaled"
                          className="absolute inset-0 w-full h-full object-contain max-w-none pointer-events-none"
                          style={{ width: containerRef.current?.clientWidth || "100%" }}
                        />
                      </div>

                      {/* Split Line */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)] pointer-events-none z-10"
                        style={{ left: `${sliderPosition}%` }}
                      >
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-emerald-500 border-2 border-gray-950 shadow-xl flex items-center justify-center text-gray-950 text-xs font-black">
                          ↔
                        </div>
                      </div>

                      {/* Slider Drag Overlay */}
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sliderPosition}
                        onChange={(e) => setSliderPosition(Number(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                      />

                      {/* Badges */}
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400 font-bold z-10 backdrop-blur-md">
                        AFTER: REAL-ESRGAN {upscaleResult.scaleFactor}X
                      </span>
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-gray-950/80 border border-gray-800 text-[10px] font-mono text-gray-400 font-bold z-10 backdrop-blur-md">
                        BEFORE: ORIGINAL ({upscaleResult.originalWidth}x{upscaleResult.originalHeight})
                      </span>

                      {/* Precision Zoom Inspector Loupe */}
                      {isZoomMode && (
                        <div
                          className="absolute w-56 h-56 rounded-full border-2 border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.5)] pointer-events-none z-30 overflow-hidden bg-gray-950/90 backdrop-blur-md flex items-center justify-center"
                          style={{
                            left: `${mousePos.x}%`,
                            top: `${mousePos.y}%`,
                            transform: "translate(-50%, -50%)",
                          }}
                        >
                          {/* Target Crosshair */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40 opacity-40">
                            <div className="w-full h-[1px] bg-emerald-400" />
                            <div className="h-full w-[1px] bg-emerald-400 absolute" />
                          </div>

                          <img
                            src={mousePos.x < sliderPosition ? upscaleResult.dataUrl : imageSrc}
                            alt="Zoom Inspector"
                            className="absolute max-w-none"
                            style={{
                              imageRendering: "pixelated",
                              width: `${(containerRef.current?.clientWidth || 500) * zoomMultiplier}px`,
                              height: `${(containerRef.current?.clientHeight || 500) * zoomMultiplier}px`,
                              left: `-${(mousePos.x / 100) * (containerRef.current?.clientWidth || 500) * zoomMultiplier - 112}px`,
                              top: `-${(mousePos.y / 100) * (containerRef.current?.clientHeight || 500) * zoomMultiplier - 112}px`,
                            }}
                          />
                          <span className="absolute bottom-2 px-2 py-0.5 rounded bg-gray-950/90 text-[9px] font-mono text-emerald-400 border border-gray-800 z-50 font-bold">
                            {zoomMultiplier}x MAGNIFIER
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Metadata Stats Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-gray-950/60 border border-gray-800 rounded-2xl p-3 flex flex-col">
                      <span className="text-[10px] text-gray-500 font-mono uppercase">Scale Factor</span>
                      <span className="text-sm font-extrabold text-emerald-400">{upscaleResult.scaleFactor}x Upscale</span>
                    </div>

                    <div className="bg-gray-950/60 border border-gray-800 rounded-2xl p-3 flex flex-col">
                      <span className="text-[10px] text-gray-500 font-mono uppercase">Output Dimensions</span>
                      <span className="text-sm font-extrabold text-gray-200">
                        {upscaleResult.upscaledWidth} × {upscaleResult.upscaledHeight}
                      </span>
                    </div>

                    <div className="bg-gray-950/60 border border-gray-800 rounded-2xl p-3 flex flex-col">
                      <span className="text-[10px] text-gray-500 font-mono uppercase">Megapixels</span>
                      <span className="text-sm font-extrabold text-gray-200">{upscaleResult.megapixels} MP</span>
                    </div>

                    <div className="bg-gray-950/60 border border-gray-800 rounded-2xl p-3 flex flex-col">
                      <span className="text-[10px] text-gray-500 font-mono uppercase">Engine Time</span>
                      <span className="text-sm font-extrabold text-emerald-400">{upscaleResult.processingTimeMs} ms</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center relative rounded-2xl overflow-hidden border border-gray-800 bg-gray-950/80 p-6">
                  <img src={imageSrc} alt="Preview" className="max-h-[400px] w-auto object-contain rounded-xl mb-4" />
                  <span className="text-xs font-mono text-gray-400">
                    Ready to upscale. Click "Upscale Image" on the left panel to execute Real-ESRGAN GPU processing.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BULK BATCH MODE */}
      {workMode === "bulk" && (
        <div className="w-full max-w-6xl flex flex-col gap-6">
          {/* Top Control Bar */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <button
                onClick={() => bulkFileInputRef.current?.click()}
                className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Plus className="h-4 w-4" />
                <span>Add Images to Batch</span>
              </button>

              <input
                ref={bulkFileInputRef}
                type="file"
                multiple
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={(e) => e.target.files && handleBulkFilesSelect(e.target.files)}
              />

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-400">Target:</span>
                <div className="flex gap-1">
                  {(["2x", "4k", "8k"] as UpscaleTarget[]).map((tgt) => (
                    <button
                      key={tgt}
                      onClick={() => setSelectedTarget(tgt)}
                      className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition cursor-pointer uppercase ${
                        selectedTarget === tgt
                          ? "bg-emerald-500/20 border border-emerald-500 text-emerald-400"
                          : "bg-gray-950 border border-gray-800 text-gray-400 hover:text-white"
                      }`}
                    >
                      {tgt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {bulkItems.some((i) => i.status === "complete") && (
                <button
                  onClick={downloadBulkZip}
                  className="px-5 py-3 rounded-2xl bg-gray-900 hover:bg-gray-800 border border-emerald-500/40 text-emerald-400 font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-2 shadow-lg"
                >
                  <FolderDown className="h-4 w-4" />
                  <span>Download ZIP (All Upscaled)</span>
                </button>
              )}

              <button
                onClick={processBatchQueue}
                disabled={bulkItems.length === 0 || bulkProcessingActive}
                className={`px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-2 shadow-lg ${
                  bulkItems.length === 0 || bulkProcessingActive
                    ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                    : "bg-emerald-500 hover:bg-emerald-400 text-gray-950 shadow-emerald-500/20"
                }`}
              >
                {bulkProcessingActive ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Processing Batch Queue...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Process Batch Queue ({bulkItems.filter((i) => i.status !== "complete").length})</span>
                  </>
                )}
              </button>

              {bulkItems.length > 0 && (
                <button
                  onClick={() => setBulkItems([])}
                  disabled={bulkProcessingActive}
                  className="p-3 rounded-2xl bg-gray-950 border border-gray-800 text-gray-500 hover:text-rose-400 transition cursor-pointer"
                  title="Clear Batch Queue"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Batch Grid / Drop Area */}
          {bulkItems.length === 0 ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => bulkFileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-800 hover:border-emerald-500/50 rounded-3xl p-16 text-center cursor-pointer transition group bg-gray-900/40 hover:bg-gray-900/60 flex flex-col items-center justify-center min-h-[400px]"
            >
              <Upload className="h-12 w-12 text-emerald-400 group-hover:scale-110 transition duration-300 mb-3" />
              <h3 className="text-base font-bold text-gray-200 mb-1">Drop Multiple Images to Bulk Upscale</h3>
              <p className="text-xs text-gray-500 max-w-md mb-4">
                Select or drag multiple PNG, JPG, or WebP files to process in batch using Real-ESRGAN NCNN Vulkan.
              </p>
              <span className="px-4 py-2 rounded-xl bg-gray-950 border border-gray-800 text-emerald-400 font-mono text-xs font-semibold">
                Browse Files
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {bulkItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 flex flex-col justify-between shadow-xl backdrop-blur-xl relative overflow-hidden group"
                >
                  {/* Item Image Preview */}
                  <div className="relative h-40 w-full rounded-xl overflow-hidden bg-gray-950 border border-gray-850 flex items-center justify-center mb-3">
                    <img
                      src={item.result?.dataUrl || item.previewUrl}
                      alt={item.file.name}
                      className="h-full w-full object-contain"
                    />

                    {/* Status Badge */}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-gray-950/80 border border-gray-800 text-[10px] font-mono text-emerald-400 font-bold backdrop-blur-md flex items-center gap-1">
                      {item.status === "complete" ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          <span>Done</span>
                        </>
                      ) : item.status === "processing" ? (
                        <>
                          <RefreshCw className="h-3 w-3 text-amber-400 animate-spin" />
                          <span>Upscaling...</span>
                        </>
                      ) : item.status === "error" ? (
                        <>
                          <AlertCircle className="h-3 w-3 text-rose-400" />
                          <span>Error</span>
                        </>
                      ) : (
                        <span>Queued</span>
                      )}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex flex-col gap-1 mb-3">
                    <span className="text-xs font-mono text-gray-200 truncate font-semibold">
                      {item.file.name}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">
                      {item.result ? `${item.result.upscaledWidth}x${item.result.upscaledHeight} PNG` : `${item.category.toUpperCase()} image`}
                    </span>
                  </div>

                  {/* Progress Bar for Active Item */}
                  {item.status === "processing" && (
                    <div className="w-full bg-gray-950 h-1.5 rounded-full overflow-hidden mb-3 border border-gray-800">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${item.progressPct}%` }}
                      />
                    </div>
                  )}

                  {/* Item Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-800/60">
                    {item.result?.dataUrl ? (
                      <button
                        onClick={() => handleDownloadItem(item)}
                        className="w-full py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-gray-600">Waiting in queue</span>
                    )}

                    <button
                      onClick={() => setBulkItems((prev) => prev.filter((it) => it.id !== item.id))}
                      disabled={bulkProcessingActive}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-rose-400 transition cursor-pointer ml-2"
                      title="Remove from batch"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UpscalerWorkspace;
