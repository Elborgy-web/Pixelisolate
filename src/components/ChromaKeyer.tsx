import React, { useRef, useState, useEffect } from "react";
import {
  Upload,
  Droplet,
  Sliders,
  Settings,
  Sparkles,
  Download,
  Maximize2,
  FileImage,
  RefreshCw,
  Eye,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Play,
  Trash2,
  Layers,
  Plus,
  Minus,
  Brush,
  RotateCcw,
  X,
  Crop,
  Search,
} from "lucide-react";
import { SubjectAnalysis, ProcessingSettings, BulkImageItem } from "../types";
import { rgbToHsv, createChromaGreenTransform, isolateSubjectFromChroma, detectBackgroundColorFromCorners, detectDualBackgroundColorsFromCorners, detectSafestChromaColor, CHROMA_OPTIONS, erodeAlpha, dilateAlpha, blurAlpha } from "../utils/imageProc";
import PythonScript from "./PythonScript";
import { removeBackground as imglyRemoveBackground } from "@imgly/background-removal";
import { supabase } from "../utils/supabaseClient";
import JSZip from "jszip";

function autoRecoverForeground(
  mask: Uint8Array,
  srcData: Uint8ClampedArray,
  w: number,
  h: number
): Uint8Array {
  const result = new Uint8Array(mask);
  const queue: number[] = [];
  const visited = new Uint8Array(w * h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (mask[idx] === 255) {
        queue.push(idx);
        visited[idx] = 1;
      }
    }
  }

  const dx = [1, -1, 0, 0];
  const dy = [0, 0, 1, -1];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const cx = curr % w;
    const cy = Math.floor(curr / w);

    for (let i = 0; i < 4; i++) {
      const nx = cx + dx[i];
      const ny = cy + dy[i];

      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const nIdx = ny * w + nx;
        if (!visited[nIdx]) {
          const sIdx = nIdx * 4;
          const r = srcData[sIdx];
          const g = srcData[sIdx + 1];
          const b = srcData[sIdx + 2];
          const isLight = r > 185 && g > 185 && b > 185;

          if (isLight) {
            result[nIdx] = 255;
            queue.push(nIdx);
            visited[nIdx] = 1;
          }
        }
      }
    }
  }

  return result;
}

interface ChromaKeyerProps {
  user: any;
  profile: any;
  onRefreshProfile: () => void;
  onOpenPricing: () => void;
  onOpenAuth: () => void;
}

export default function ChromaKeyer({
  user,
  profile,
  onRefreshProfile,
  onOpenPricing,
  onOpenAuth,
}: ChromaKeyerProps) {
  // Image sources
  const [sourceImageUri, setSourceImageUri] = useState<string | null>(null);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [greenScreenImageUri, setGreenScreenImageUri] = useState<string | null>(null);
  const [isolatedImageUri, setIsolatedImageUri] = useState<string | null>(null);

  // File metadata
  const [fileName, setFileName] = useState<string>("");
  const [fileDimensions, setFileDimensions] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  // Master Work Mode: single image isolator vs bulk background remover
  const [workMode, setWorkMode] = useState<"single" | "bulk">("single");
  const [bulkItems, setBulkItems] = useState<BulkImageItem[]>([]);
  const [bulkQueueActive, setBulkQueueActive] = useState(false);

  // Mode & UI State
  const [activeTab, setActiveTab] = useState<"original" | "greenscreen" | "isolated">("isolated");
  const [dropperActive, setDropperActive] = useState<"color1" | "color2" | null>(null);
  const [editingBulkId, setEditingBulkId] = useState<string | null>(null);
  const [activeBulkDropper, setActiveBulkDropper] = useState<{
    itemId: string;
    colorIndex: "color1" | "color2";
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // AI Segmenter states (IMG.LY PhotoRoom-quality local WASM engine)
  const [segmentationMode, setSegmentationMode] = useState<"ai" | "chroma" | "frame">("chroma"); // Default to Chroma Keying!
  const [isModelLoading, setIsModelLoading] = useState<boolean>(false);
  const [modelProgress, setModelProgress] = useState<string>("");
  const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [isInvertedMask, setIsInvertedMask] = useState<boolean>(false);

  // SaaS and Credit System State Variables
  const [showBatchUpsell, setShowBatchUpsell] = useState<boolean>(false);
  const [downloadingCloud, setDownloadingCloud] = useState<boolean>(false);
  const [selectedBgColor, setSelectedBgColor] = useState<string>("transparent");
  const [customBgColor, setCustomBgColor] = useState<string>("#ffffff");

  // Helper: Scale down canvas image and compress for lightweight history storage
  const scaleDownImage = (dataUri: string, maxDim = 500, format = "image/png", quality = 0.85): Promise<string> => {
    return new Promise((resolve) => {
      if (!dataUri) {
        resolve("");
        return;
      }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
        }
        resolve(canvas.toDataURL(format, quality));
      };
      img.onerror = () => {
        resolve("");
      };
      img.src = dataUri;
    });
  };

  // Helper: Convert base64 DataURI to Blob for Supabase storage uploads
  const dataURItoBlob = (dataURI: string) => {
    const splitIndex = dataURI.indexOf(",");
    if (splitIndex === -1) {
      return new Blob([dataURI], { type: "image/png" });
    }
    const byteString = atob(dataURI.substring(splitIndex + 1));
    const mimeString = dataURI.substring(0, splitIndex).split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  // Helper: Upload input + transparent result to user history storage via backend API
  const uploadImagePairToHistory = async (originalBase64: string, isolatedBase64: string) => {
    if (!originalBase64 || !isolatedBase64) return;
    
    // History saving is a Pro-only feature. Skip uploading silently for Free/Credit Bundle users.
    const isPro = profile?.is_pro === true;
    if (!isPro) {
      return;
    }
    
    try {
      // Scale down original and isolated images to max 450px and compress as JPEG for ultra-lightweight storage (under 50KB total!)
      const scaledOrig = await scaleDownImage(originalBase64, 450, "image/jpeg", 0.75);
      const scaledProc = await scaleDownImage(isolatedBase64, 450, "image/jpeg", 0.75);

      if (!scaledOrig || !scaledProc) {
        console.warn("Base64 image scaling failed, skipping history save.");
        return;
      }

      const apiBase = (import.meta.env.VITE_API_URL || "").trim();
      const response = await fetch(`${apiBase}/api/vault`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          originalBase64: scaledOrig,
          processedBase64: scaledProc,
        }),
      });

      if (!response.ok) {
        let errMsg = `Failed to save history via backend API (HTTP ${response.status} ${response.statusText}).`;
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errData = await response.json();
            errMsg = errData.error || errMsg;
          } else {
            const textData = await response.text();
            if (textData && textData.length < 200) {
              errMsg = textData;
            }
          }
        } catch (e) {
          console.warn("Could not parse error response:", e);
        }
        throw new Error(errMsg);
      }
    } catch (err: any) {
      console.error("Failed to upload image history:", err);
      alert(`Failed to save to history: ${err.message || JSON.stringify(err)}`);
    }
  };



  // Sampling background
  const [sampledColor, setSampledColor] = useState<{ r: number; g: number; b: number }>({ r: 240, g: 240, b: 240 }); // Default near-white
  const [sampledColorHex, setSampledColorHex] = useState<string>("#f0f0f0");

  // Checkerboard & Connectivity settings
  const [isCheckerboard, setIsCheckerboard] = useState<boolean>(false);
  const [useConnectivity, setUseConnectivity] = useState<boolean>(true); // Smart connectivity flood-fill by default (enabled!)
  const [sampledColor2, setSampledColor2] = useState<{ r: number; g: number; b: number }>({ r: 80, g: 80, b: 80 }); // Default grid grey
  const [sampledColor2Hex, setSampledColor2Hex] = useState<string>("#505050");
  const [chromaColorName, setChromaColorName] = useState<"Green" | "Magenta" | "Cyan">("Green");

  // Step 1: Subject Analysis Report state
  const [analysisReport, setAnalysisReport] = useState<SubjectAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [useBoundingBox, setUseBoundingBox] = useState(false); // Disabled by default to prevent cropping!

  // Custom sliders for Step 3 HSV masking (matching #00FF00 OpenCV defaults)
  const [hueMin, setHueMin] = useState<number>(35); // Lower bounds for chroma green
  const [hueMax, setHueMax] = useState<number>(85); // Upper bounds for chroma green
  const [satMin, setSatMin] = useState<number>(50);
  const [satMax, setSatMax] = useState<number>(255);
  const [valMin, setValMin] = useState<number>(50);
  const [valMax, setValMax] = useState<number>(255);

  // Edge and refinement settings
  const [similarity, setSimilarity] = useState<number>(0.10); // Local chroma tolerance
  const [erosionSize, setErosionSize] = useState<number>(1);
  const [dilationSize, setDilationSize] = useState<number>(0);
  const [featherRadius, setFeatherRadius] = useState<number>(1);

  // Hidden original image ref to draw from
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const greenScreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isolatedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const aiAlphaMaskRef = useRef<Uint8Array | null>(null);
  const lastDrawPosRef = useRef<{ x: number; y: number } | null>(null);

  // Manual brush mask refinement state
  const [brushMode, setBrushMode] = useState<"none" | "restore" | "erase">("none");
  const [brushSize, setBrushSize] = useState<number>(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [renderTrigger, setRenderTrigger] = useState(0);

  // Undo state stack
  const [undoStack, setUndoStack] = useState<Uint8Array[]>([]);

  // Zoom lens and Toast notification states
  const [isZoomLensActive, setIsZoomLensActive] = useState(false);
  const [zoomLensPos, setZoomLensPos] = useState<{ x: number; y: number } | null>(null);
  const lensCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "info" } | null>(null);

  const showToast = (text: string, type: "success" | "info" = "success") => {
    setToastMessage({ text, type });
    // Keep it displayed for 4 seconds
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  };

  // Generate dynamic SVG circle cursor matching selected brush size and mode
  const getBrushCursorStyle = () => {
    if (isZoomLensActive) return { cursor: "none" };
    if (brushMode === "none") return {};
    const displaySize = Math.max(10, Math.min(128, brushSize * 2));
    const r = displaySize / 2;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${displaySize}" height="${displaySize}" viewBox="0 0 ${displaySize} ${displaySize}">
        <circle cx="${r}" cy="${r}" r="${r - 1}" fill="none" stroke="${brushMode === 'restore' ? '#10B981' : '#EF4444'}" stroke-width="1.5" stroke-dasharray="3 2" />
        <circle cx="${r}" cy="${r}" r="1.5" fill="${brushMode === 'restore' ? '#10B981' : '#EF4444'}" />
      </svg>
    `.trim();
    const encoded = encodeURIComponent(svg);
    return {
      cursor: `url("data:image/svg+xml;utf8,${encoded}") ${r} ${r}, auto`,
    };
  };

  const saveToUndoStack = () => {
    if (aiAlphaMaskRef.current) {
      const nextState = new Uint8Array(aiAlphaMaskRef.current);
      setUndoStack(prev => {
        const nextStack = [...prev, nextState];
        if (nextStack.length > 20) {
          return nextStack.slice(1);
        }
        return nextStack;
      });
    }
  };

  const handleUndo = () => {
    if (undoStack.length === 0 || !aiAlphaMaskRef.current) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    aiAlphaMaskRef.current.set(previous);
    setRenderTrigger(prev => prev + 1);
  };

  const getActiveCanvas = () => {
    if (activeTab === "original") return originalCanvasRef.current;
    if (activeTab === "greenscreen") return greenScreenCanvasRef.current;
    if (activeTab === "isolated") return isolatedCanvasRef.current;
    return null;
  };

  const handleDraw = (x: number, y: number) => {
    if (brushMode === "none" || !aiAlphaMaskRef.current) return;
    const canvas = getActiveCanvas();
    if (!canvas) return;

    const w = canvas.width;
    const h = canvas.height;
    const radius = brushSize;
    const targetAlpha = brushMode === "restore" ? 255 : 0;
    const mask = aiAlphaMaskRef.current;

    let modified = false;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy <= radius * radius) {
          const px = x + dx;
          const py = y + dy;
          if (px >= 0 && px < w && py >= 0 && py < h) {
            const idx = py * w + px;
            if (mask[idx] !== targetAlpha) {
              mask[idx] = targetAlpha;
              modified = true;
            }
          }
        }
      }
    }

    if (modified) {
      setRenderTrigger(prev => prev + 1);
    }
  };

  const handleZoomLensMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = getActiveCanvas();
    if (!canvas) {
      setZoomLensPos(null);
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      setZoomLensPos({ x: e.clientX, y: e.clientY });
      
      const lensCanvas = lensCanvasRef.current;
      if (lensCanvas) {
        const ctxLens = lensCanvas.getContext("2d");
        if (ctxLens) {
          const canvasX = (x / rect.width) * canvas.width;
          const canvasY = (y / rect.height) * canvas.height;
          
          ctxLens.clearRect(0, 0, 200, 200);
          
          // Crop centered around canvasX, canvasY
          const cropW = 200;
          const cropH = 200;
          const cropX = canvasX - cropW / 2;
          const cropY = canvasY - cropH / 2;
          
          ctxLens.drawImage(
            canvas,
            cropX,
            cropY,
            cropW,
            cropH,
            0,
            0,
            200,
            200
          );
        }
      }
    } else {
      setZoomLensPos(null);
    }
  };

  const handleZoomLensTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const canvas = getActiveCanvas();
    if (!canvas || e.touches.length === 0) {
      setZoomLensPos(null);
      return;
    }

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      setZoomLensPos({ x: touch.clientX, y: touch.clientY });
      
      const lensCanvas = lensCanvasRef.current;
      if (lensCanvas) {
        const ctxLens = lensCanvas.getContext("2d");
        if (ctxLens) {
          const canvasX = (x / rect.width) * canvas.width;
          const canvasY = (y / rect.height) * canvas.height;
          
          ctxLens.clearRect(0, 0, 200, 200);
          
          const cropW = 200;
          const cropH = 200;
          const cropX = canvasX - cropW / 2;
          const cropY = canvasY - cropH / 2;
          
          ctxLens.drawImage(
            canvas,
            cropX,
            cropY,
            cropW,
            cropH,
            0,
            0,
            200,
            200
          );
        }
      }
    } else {
      setZoomLensPos(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isZoomLensActive) return;
    if (brushMode === "none" || !aiAlphaMaskRef.current) return;
    e.preventDefault();
    saveToUndoStack();
    setIsDrawing(true);
    
    const canvas = getActiveCanvas();
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
      const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height);
      lastDrawPosRef.current = { x, y };
      handleDraw(x, y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isZoomLensActive) {
      handleZoomLensMouseMove(e);
      return;
    }
    if (!isDrawing || brushMode === "none") return;
    e.preventDefault();

    const canvas = getActiveCanvas();
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
      const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height);

      if (lastDrawPosRef.current) {
        const last = lastDrawPosRef.current;
        const dist = Math.hypot(x - last.x, y - last.y);
        const steps = Math.max(1, Math.floor(dist / 3)); // Interpolation step every 3 pixels
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const ix = Math.round(last.x * (1 - t) + x * t);
          const iy = Math.round(last.y * (1 - t) + y * t);
          handleDraw(ix, iy);
        }
      } else {
        handleDraw(x, y);
      }
      lastDrawPosRef.current = { x, y };
    }
  };

  const handleMouseUp = () => {
    if (isZoomLensActive) {
      setZoomLensPos(null);
      return;
    }
    setIsDrawing(false);
    lastDrawPosRef.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isZoomLensActive) {
      handleZoomLensTouchMove(e);
      return;
    }
    if (brushMode === "none" || !aiAlphaMaskRef.current) return;
    saveToUndoStack();
    setIsDrawing(true);
    const canvas = getActiveCanvas();
    if (canvas) {
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor(((touch.clientX - rect.left) / rect.width) * canvas.width);
      const y = Math.floor(((touch.clientY - rect.top) / rect.height) * canvas.height);
      lastDrawPosRef.current = { x, y };
      handleDraw(x, y);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isZoomLensActive) {
      handleZoomLensTouchMove(e);
      return;
    }
    if (!isDrawing || brushMode === "none") return;
    const canvas = getActiveCanvas();
    if (canvas) {
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor(((touch.clientX - rect.left) / rect.width) * canvas.width);
      const y = Math.floor(((touch.clientY - rect.top) / rect.height) * canvas.height);

      if (lastDrawPosRef.current) {
        const last = lastDrawPosRef.current;
        const dist = Math.hypot(x - last.x, y - last.y);
        const steps = Math.max(1, Math.floor(dist / 3));
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const ix = Math.round(last.x * (1 - t) + x * t);
          const iy = Math.round(last.y * (1 - t) + y * t);
          handleDraw(ix, iy);
        }
      } else {
        handleDraw(x, y);
      }
      lastDrawPosRef.current = { x, y };
    }
  };

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (files.length > 1 && profile?.is_pro !== true) {
        setShowBatchUpsell(true);
        return;
      }
      loadImageFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      loadImageFile(files[0]);
    }
  };

  const loadImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Unsupported file format. Please upload an image file (PNG, JPG, WEBP).");
      return;
    }
    setFileName(file.name);
    setErrorMessage(null);
    setAnalysisReport(null);
    setGreenScreenImageUri(null);
    setIsolatedImageUri(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        const rawUri = event.target.result as string;
        setSourceImageUri(rawUri);
        
        // Generate a fast working preview image (capped at 2048px) for smooth real-time slider rendering
        const scaledPreview = await scaleDownImage(rawUri, 2048);
        setPreviewImageUri(scaledPreview);
        setActiveTab("original");
      }
    };
    reader.readAsDataURL(file);
  };

  // Image Loaded lifecycle - Read dimensions & perform Instant Corner Background Auto-Detection
  const handleOriginalImageLoad = () => {
    if (originalImageRef.current) {
      const img = originalImageRef.current;
      const w = img.naturalWidth;
      const h = img.naturalHeight;

      // Only set file dimensions when loading the original raw base64 source image URI
      if (sourceImageUri && img.src.startsWith(sourceImageUri.substring(0, 150))) {
        setFileDimensions({ w, h });
        setUndoStack([]);
        setBrushMode("none");
      }

      // Instant client-side Corner Background Color Detection!
      try {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext("2d");
        if (tempCtx) {
          tempCtx.drawImage(img, 0, 0, w, h);
          const imageData = tempCtx.getImageData(0, 0, w, h);
          const detected = detectDualBackgroundColorsFromCorners(imageData);
          
          setIsCheckerboard(detected.isCheckerboard);
          if (!detected.isCheckerboard) {
            setUseConnectivity(false);
          } else {
            setUseConnectivity(true);
          }
          
          setSampledColorHex(detected.color1.hex);
          setSampledColor({ r: detected.color1.r, g: detected.color1.g, b: detected.color1.b });
          
          setSampledColor2Hex(detected.color2.hex);
          setSampledColor2({ r: detected.color2.r, g: detected.color2.g, b: detected.color2.b });

          // Auto-detect the safest chroma key backdrop based on the image's design colors
          const safestColor = detectSafestChromaColor(imageData);
          setChromaColorName(safestColor.name);
          setHueMin(safestColor.hueRange.min);
          setHueMax(safestColor.hueRange.max);
        }
      } catch (err) {
        console.warn("Corner detection failed, using fallback:", err);
      }
    }
  };

  // Trigger GenAI analysis whenever a new image is ingested
  useEffect(() => {
    if (sourceImageUri) {
      runGenAIAnalysis();
    }
  }, [sourceImageUri]);

  // Run Step 1: GenAI Image analysis (Server-Side proxying of Groq Llama 3.2 Vision)
  const runGenAIAnalysis = async () => {
    const analysisTarget = previewImageUri || sourceImageUri;
    if (!analysisTarget) return;
    setIsAnalyzing(true);
    try {
      const apiBase = (import.meta.env.VITE_API_URL || "").trim();
      const res = await fetch(`${apiBase}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: analysisTarget,
          mimeType: analysisTarget.split(";")[0].split(":")[1] || "image/png",
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Groq analysis endpoint returned error code");
      }

      const report: SubjectAnalysis = await res.json();
      setAnalysisReport(report);

      // Automated color and parameter tuning based on Vision model analysis
      if (report.detectedBgColorHex && report.detectedBgColorRgb) {
        setSampledColorHex(report.detectedBgColorHex);
        setSampledColor({
          r: report.detectedBgColorRgb[0],
          g: report.detectedBgColorRgb[1],
          b: report.detectedBgColorRgb[2],
        });
      }

      if (report.autoTunedSliders) {
        const sliders = report.autoTunedSliders;
        if (typeof sliders.similarity === "number") setSimilarity(sliders.similarity);
        if (typeof sliders.erosionSize === "number") setErosionSize(sliders.erosionSize);
        if (typeof sliders.dilationSize === "number") setDilationSize(sliders.dilationSize);
        if (typeof sliders.featherRadius === "number") setFeatherRadius(sliders.featherRadius);

        // Instantly transition to show the beautifully isolated asset
        setActiveTab("isolated");
      } else {
        // Fallback older manual tuning parameters
        if (report.outlineComplexity === "high") {
          setFeatherRadius(2);
          setErosionSize(2);
        } else if (report.outlineComplexity === "low") {
          setFeatherRadius(1);
          setErosionSize(1);
        }
      }
    } catch (err: any) {
      console.warn("Could not retrieve AI report:", err);
      // Fallback local mock analysis to assure continuous flow
      setAnalysisReport({
        subjectName: "Main Foreground Subject",
        outlineComplexity: "medium",
        colorAnalysis: "Standard contrast. Background is easily separated from subject edge vectors.",
        edgeDifficulty: "No microstructures detected. Recommended standard 1px erosion.",
        boundingBox: { x: 10, y: 10, w: 80, h: 80 },
        segmentationAdvice: "Sample background directly on canvas. Set HSV parameters standard ranges [35-85] chroma green key.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Sample background color directly from Canvas (click event on original canvas)
  const handleOriginalCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dropperActive || !originalCanvasRef.current) return;

    const canvas = originalCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    const ctx = canvas.getContext("2d");
    if (ctx) {
      if (isCheckerboard) {
        // High-fidelity local 16x16 patch sampling for checkerboard grids!
        const patchSize = 16;
        const halfPatch = Math.floor(patchSize / 2);
        const xStart = Math.max(0, x - halfPatch);
        const yStart = Math.max(0, y - halfPatch);
        const wActual = Math.min(canvas.width - xStart, patchSize);
        const hActual = Math.min(canvas.height - yStart, patchSize);

        const patchData = ctx.getImageData(xStart, yStart, wActual, hActual).data;
        const patchPixels: { r: number; g: number; b: number; luminance: number }[] = [];

        for (let i = 0; i < patchData.length; i += 4) {
          const r = patchData[i];
          const g = patchData[i + 1];
          const b = patchData[i + 2];
          const a = patchData[i + 3];
          if (a > 50) {
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            patchPixels.push({ r, g, b, luminance });
          }
        }

        if (patchPixels.length > 4) {
          const sorted = [...patchPixels].sort((a, b) => a.luminance - b.luminance);
          const medianIdx = Math.floor(sorted.length / 2);
          const darkPixels = sorted.slice(0, medianIdx);
          const brightPixels = sorted.slice(medianIdx);

          if (darkPixels.length > 0 && brightPixels.length > 0) {
            const r1 = Math.round(brightPixels.reduce((sum, p) => sum + p.r, 0) / brightPixels.length);
            const g1 = Math.round(brightPixels.reduce((sum, p) => sum + p.g, 0) / brightPixels.length);
            const b1 = Math.round(brightPixels.reduce((sum, p) => sum + p.b, 0) / brightPixels.length);
            const hex1 = "#" + ((1 << 24) + (r1 << 16) + (g1 << 8) + b1).toString(16).slice(1);

            const r2 = Math.round(darkPixels.reduce((sum, p) => sum + p.r, 0) / darkPixels.length);
            const g2 = Math.round(darkPixels.reduce((sum, p) => sum + p.g, 0) / darkPixels.length);
            const b2 = Math.round(darkPixels.reduce((sum, p) => sum + p.b, 0) / darkPixels.length);
            const hex2 = "#" + ((1 << 24) + (r2 << 16) + (g2 << 8) + b2).toString(16).slice(1);

            setSampledColor({ r: r1, g: g1, b: b1 });
            setSampledColorHex(hex1);
            setSampledColor2({ r: r2, g: g2, b: b2 });
            setSampledColor2Hex(hex2);
            setDropperActive(null);
            return;
          }
        }
      }

      // Fallback single-pixel sampling
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const r = pixel[0];
      const g = pixel[1];
      const b = pixel[2];
      const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);

      if (dropperActive === "color1") {
        setSampledColor({ r, g, b });
        setSampledColorHex(hex);
      } else if (dropperActive === "color2") {
        setSampledColor2({ r, g, b });
        setSampledColor2Hex(hex);
      }
      setDropperActive(null);
    }
  };



  // Interactive Live Render of Step 2 (Chroma/AI mask) & Step 3 (Erosions/Dilation & isolate PNG)
  useEffect(() => {
    if (!previewImageUri || !originalImageRef.current) return;

    // Wait until image loads
    const imgObj = originalImageRef.current;
    if (!imgObj.complete) return;

    const canvasSrc = originalCanvasRef.current;
    const canvasGreen = greenScreenCanvasRef.current;
    const canvasIsolated = isolatedCanvasRef.current;

    if (!canvasSrc || !canvasGreen || !canvasIsolated) return;

    const ctxSrc = canvasSrc.getContext("2d");
    const ctxGreen = canvasGreen.getContext("2d");
    const ctxIsolated = canvasIsolated.getContext("2d");

    if (!ctxSrc || !ctxGreen || !ctxIsolated) return;

    // Set canvas dimensions to match the optimized preview file width & height
    const w = imgObj.naturalWidth || 800;
    const h = imgObj.naturalHeight || 600;

    canvasSrc.width = w;
    canvasSrc.height = h;
    canvasGreen.width = w;
    canvasGreen.height = h;
    canvasIsolated.width = w;
    canvasIsolated.height = h;

    // Draw original
    ctxSrc.drawImage(imgObj, 0, 0, w, h);
    const originalData = ctxSrc.getImageData(0, 0, w, h);

    const runRenderPipeline = async () => {
      try {
        const currentChroma = CHROMA_OPTIONS.find(c => c.name === chromaColorName) || CHROMA_OPTIONS[0];

        if (segmentationMode === "ai" || segmentationMode === "frame") {
          let initialAlpha = new Uint8Array(w * h);

          if (segmentationMode === "ai") {
            const rawAIAlpha = aiAlphaMaskRef.current;
            if (!rawAIAlpha) {
              // Draw original directly until the WASM model finishes loading
              ctxGreen.drawImage(imgObj, 0, 0, w, h);
              ctxIsolated.drawImage(imgObj, 0, 0, w, h);
              return;
            }

            // Apply Invert Mask Direction
            for (let i = 0; i < w * h; i++) {
              const alphaVal = rawAIAlpha[i];
              if (isInvertedMask) {
                initialAlpha[i] = alphaVal > 0 ? 0 : 255;
              } else {
                initialAlpha[i] = alphaVal;
              }
            }
          } else {
            // frame (Solid Border Crop / Design Frame) Mode
            const bgRgb = { r: originalData.data[0], g: originalData.data[1], b: originalData.data[2] };
            let minX = w;
            let maxX = 0;
            let minY = h;
            let maxY = 0;
            let found = false;
            const data = originalData.data;

            for (let y = 0; y < h; y++) {
              for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const a = data[idx + 3];

                if (a < 10) continue;

                const diff = Math.abs(r - bgRgb.r) + Math.abs(g - bgRgb.g) + Math.abs(b - bgRgb.b);
                if (diff > 35) {
                  if (x < minX) minX = x;
                  if (x > maxX) maxX = x;
                  if (y < minY) minY = y;
                  if (y > maxY) maxY = y;
                  found = true;
                }
              }
            }

            if (!found) {
              minX = 0;
              maxX = w - 1;
              minY = 0;
              maxY = h - 1;
            }

            for (let y = 0; y < h; y++) {
              for (let x = 0; x < w; x++) {
                const idx = y * w + x;
                const inside = x >= minX && x <= maxX && y >= minY && y <= maxY;
                const keepPixel = isInvertedMask ? !inside : inside;
                initialAlpha[idx] = keepPixel ? 255 : 0;
              }
            }
          }

          // Apply morphological filters on top of the mask
          let processedAlpha = initialAlpha;
          if (erosionSize > 0) {
            processedAlpha = erodeAlpha(processedAlpha, w, h, erosionSize);
          }
          if (dilationSize > 0) {
            processedAlpha = dilateAlpha(processedAlpha, w, h, dilationSize);
          }
          if (featherRadius > 0) {
            processedAlpha = blurAlpha(processedAlpha, w, h, featherRadius);
          }

          const src = originalData.data;
          // In AI and Frame modes, we use the processed alpha mask directly.
          // This avoids color-bleed contamination and provides clean, pixel-perfect cutouts.
          const hybridAlpha = processedAlpha;

          // Draw green mask canvas
          const greenData = ctxGreen.createImageData(w, h);
          const dstGreen = greenData.data;

          for (let i = 0; i < w * h * 4; i += 4) {
            const pixelIdx = i / 4;
            if (hybridAlpha[pixelIdx] === 0) {
              dstGreen[i] = currentChroma.rgb.r;
              dstGreen[i + 1] = currentChroma.rgb.g;
              dstGreen[i + 2] = currentChroma.rgb.b;
              dstGreen[i + 3] = 255;
            } else {
              dstGreen[i] = src[i];
              dstGreen[i + 1] = src[i + 1];
              dstGreen[i + 2] = src[i + 2];
              dstGreen[i + 3] = 255;
            }
          }
          ctxGreen.putImageData(greenData, 0, 0);

          // Draw isolated canvas with edge decontamination
          const isolatedData = ctxIsolated.createImageData(w, h);
          const dstIsolated = isolatedData.data;

          for (let i = 0; i < w * h * 4; i += 4) {
            const pixelIdx = i / 4;
            const alphaVal = hybridAlpha[pixelIdx];
            dstIsolated[i + 3] = alphaVal;

            if (alphaVal === 0) {
              dstIsolated[i] = 0;
              dstIsolated[i + 1] = 0;
              dstIsolated[i + 2] = 0;
            } else {
              let r = src[i];
              let g = src[i + 1];
              let b = src[i + 2];

              // If edge boundary, apply decontamination to remove color spill
              if (alphaVal < 255) {
                const alphaRatio = alphaVal / 255;
                if (segmentationMode === "ai") {
                  if (alphaRatio > 0.05) {
                    const bgR = sampledColor.r;
                    const bgG = sampledColor.g;
                    const bgB = sampledColor.b;
                    r = Math.max(0, Math.min(255, Math.round((r - bgR * (1 - alphaRatio)) / alphaRatio)));
                    g = Math.max(0, Math.min(255, Math.round((g - bgG * (1 - alphaRatio)) / alphaRatio)));
                    b = Math.max(0, Math.min(255, Math.round((b - bgB * (1 - alphaRatio)) / alphaRatio)));
                  }
                } else {
                  if (chromaColorName === "Green") {
                    const maxOther = Math.max(r, b);
                    if (g > maxOther) g = Math.round(maxOther * (1 - alphaRatio) + g * alphaRatio);
                  } else if (chromaColorName === "Magenta") {
                    const magentaComponent = Math.min(r, b) - g;
                    if (magentaComponent > 0) {
                      r = Math.round(r - magentaComponent * (1 - alphaRatio));
                      b = Math.round(b - magentaComponent * (1 - alphaRatio));
                    }
                  } else if (chromaColorName === "Cyan") {
                    const cyanComponent = Math.min(g, b) - r;
                    if (cyanComponent > 0) {
                      g = Math.round(g - cyanComponent * (1 - alphaRatio));
                      b = Math.round(b - cyanComponent * (1 - alphaRatio));
                    }
                  }
                }
              }

              dstIsolated[i] = r;
              dstIsolated[i + 1] = g;
              dstIsolated[i + 2] = b;
            }
          }
          if (selectedBgColor && selectedBgColor !== "transparent") {
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = w;
            tempCanvas.height = h;
            const tempCtx = tempCanvas.getContext("2d");
            if (tempCtx) {
              tempCtx.putImageData(isolatedData, 0, 0);
              ctxIsolated.fillStyle = selectedBgColor;
              ctxIsolated.fillRect(0, 0, w, h);
              ctxIsolated.drawImage(tempCanvas, 0, 0);
            }
          } else {
            ctxIsolated.putImageData(isolatedData, 0, 0);
          }

          // Update states (only if not drawing to prevent input lag)
          if (!isDrawing) {
            setGreenScreenImageUri(canvasGreen.toDataURL());
            setIsolatedImageUri(canvasIsolated.toDataURL());
          }
        } else {
          // Standard Chroma Key Mode
          const greenScreenData = createChromaGreenTransform(
            originalData,
            sampledColor,
            sampledColor2,
            isCheckerboard,
            useConnectivity,
            similarity,
            featherRadius,
            currentChroma.rgb
          );
          ctxGreen.putImageData(greenScreenData, 0, 0);

          if (!greenScreenImageUri || greenScreenImageUri.startsWith("data:image/svg")) {
            setGreenScreenImageUri(canvasGreen.toDataURL());
          }

          const isolatedData = isolateSubjectFromChroma(
            greenScreenData,
            hueMin,
            hueMax,
            satMin,
            satMax,
            valMin,
            valMax,
            erosionSize,
            dilationSize,
            featherRadius,
            useBoundingBox ? analysisReport?.boundingBox : null
          );
          if (selectedBgColor && selectedBgColor !== "transparent") {
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = w;
            tempCanvas.height = h;
            const tempCtx = tempCanvas.getContext("2d");
            if (tempCtx) {
              tempCtx.putImageData(isolatedData, 0, 0);
              ctxIsolated.fillStyle = selectedBgColor;
              ctxIsolated.fillRect(0, 0, w, h);
              ctxIsolated.drawImage(tempCanvas, 0, 0);
            }
          } else {
            ctxIsolated.putImageData(isolatedData, 0, 0);
          }
          if (!isDrawing) {
            setIsolatedImageUri(canvasIsolated.toDataURL());
          }
        }
      } catch (err) {
        console.error("Pipeline render error:", err);
      }
    };

    runRenderPipeline();
  }, [
    previewImageUri,
    fileDimensions,
    sampledColor,
    sampledColor2,
    isCheckerboard,
    useConnectivity,
    similarity,
    hueMin,
    hueMax,
    satMin,
    satMax,
    valMin,
    valMax,
    erosionSize,
    dilationSize,
    featherRadius,
    analysisReport,
    useBoundingBox,
    chromaColorName,
    segmentationMode,
    isInvertedMask,
    isModelLoaded,
    renderTrigger,
    isDrawing,
    selectedBgColor,
  ]);

  const preloadImglyModel = async () => {
    setIsModelLoading(true);
    setModelError(null);
    try {
      const tiny1x1 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
      const config = {
        model: "isnet" as const,
        progress: (key: string, current: number, total: number) => {
          const pct = Math.round((current / total) * 100);
          setModelProgress(`Loading AI Model (${pct}%)`);
        }
      };
      await imglyRemoveBackground(tiny1x1, config);
      setIsModelLoaded(true);
    } catch (err: any) {
      console.error("AI model pre-loading failed:", err);
      setModelError(err.message || "Failed to load model.");
    } finally {
      setIsModelLoading(false);
      setModelProgress("");
    }
  };

  // Trigger local IMG.LY high-precision background removal in AI Mode (PhotoRoom quality)
  useEffect(() => {
    const activeTarget = previewImageUri || sourceImageUri;
    if (!activeTarget || segmentationMode !== "ai") return;

    let active = true;
    const runImglyRemoval = async () => {
      setIsModelLoading(true);
      setErrorMessage(null);
      setModelError(null);
      try {
        const config = {
          model: "isnet" as const,
          progress: (key: string, current: number, total: number) => {
            if (!active) return;
            const pct = Math.round((current / total) * 100);
            setModelProgress(`Loading AI Model (${pct}%)`);
          }
        };
        
        // Feed the optimized preview base64 image URI directly into the WASM pipeline
        const blob = await imglyRemoveBackground(activeTarget, config);
        if (!active) return;
        
        const url = URL.createObjectURL(blob);
        
        // Load the transparent result image so we can extract its alpha channel mask
        const imgIsolated = new Image();
        imgIsolated.src = url;
        await new Promise((resolve, reject) => {
          imgIsolated.onload = resolve;
          imgIsolated.onerror = reject;
        });

        const w = imgIsolated.naturalWidth || 800;
        const h = imgIsolated.naturalHeight || 600;

        const canvasAI = document.createElement("canvas");
        canvasAI.width = w;
        canvasAI.height = h;
        const ctxAI = canvasAI.getContext("2d");
        if (!ctxAI) throw new Error("Could not create AI canvas context");
        ctxAI.drawImage(imgIsolated, 0, 0, w, h);
        const aiData = ctxAI.getImageData(0, 0, w, h);

        const initialAlpha = new Uint8Array(w * h);
        for (let i = 0; i < w * h; i++) {
          initialAlpha[i] = aiData.data[i * 4 + 3];
        }

        // Automatic Foreground Recovery for light objects (like books) against dark backgrounds
        const imgObj = originalImageRef.current;
        if (imgObj) {
          const canvasSrc = document.createElement("canvas");
          canvasSrc.width = w;
          canvasSrc.height = h;
          const ctxSrc = canvasSrc.getContext("2d");
          if (ctxSrc) {
            ctxSrc.drawImage(imgObj, 0, 0, w, h);
            const srcData = ctxSrc.getImageData(0, 0, w, h).data;
            const avgBgBrightness = (sampledColor.r + sampledColor.g + sampledColor.b) / 3;
            
            if (avgBgBrightness < 165) {
              const recovered = autoRecoverForeground(initialAlpha, srcData, w, h);
              aiAlphaMaskRef.current = recovered;
            } else {
              aiAlphaMaskRef.current = initialAlpha;
            }
          } else {
            aiAlphaMaskRef.current = initialAlpha;
          }
        } else {
          aiAlphaMaskRef.current = initialAlpha;
        }

        setIsModelLoaded(true);
      } catch (err: any) {
        console.error("Local AI background removal failed:", err);
        setModelError(err.message || "WASM pipeline execution failed.");
        setErrorMessage("AI magic cutout failed. Please switch to Chroma Key mode for full control.");
      } finally {
        if (active) {
          setIsModelLoading(false);
          setModelProgress("");
        }
      }
    };

    runImglyRemoval();
    
    return () => {
      active = false;
    };
  }, [previewImageUri, sourceImageUri, segmentationMode, chromaColorName, fileDimensions]);

  // Synchronize manual adjustments made in Single Mode back to the Bulk queue array in real-time!
  useEffect(() => {
    if (editingBulkId && workMode === "single") {
      setBulkItems((prev) =>
        prev.map((item) =>
          item.id === editingBulkId
            ? {
                ...item,
                detectedColorHex: sampledColorHex,
                detectedColorRgb: sampledColor,
                detectedColor2Hex: sampledColor2Hex,
                detectedColor2Rgb: sampledColor2,
                isCheckerboard,
                useConnectivity,
                similarity,
                erosionSize,
                dilationSize,
                featherRadius,
                chromaColorName,
                isolatedUri: isolatedImageUri,
                greenScreenUri: greenScreenImageUri,
                status: "complete" as const,
                progress: 100,
              }
            : item
        )
      );
    }
  }, [
    editingBulkId,
    workMode,
    sampledColorHex,
    sampledColor,
    sampledColor2Hex,
    sampledColor2,
    isCheckerboard,
    useConnectivity,
    similarity,
    erosionSize,
    dilationSize,
    featherRadius,
    chromaColorName,
    isolatedImageUri,
    greenScreenImageUri,
  ]);

  // Helper: Computes the full-resolution chroma key result on-the-fly for downloads
  const getFullResolutionUri = async (type: "greenscreen" | "isolated"): Promise<string> => {
    if (!sourceImageUri) throw new Error("No source image");

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;

        const resolveCanvas = (canvas: HTMLCanvasElement) => {
          if (selectedBgColor && selectedBgColor !== "transparent") {
            const compositeCanvas = document.createElement("canvas");
            compositeCanvas.width = w;
            compositeCanvas.height = h;
            const compositeCtx = compositeCanvas.getContext("2d");
            if (compositeCtx) {
              compositeCtx.fillStyle = selectedBgColor;
              compositeCtx.fillRect(0, 0, w, h);
              compositeCtx.drawImage(canvas, 0, 0);
              resolve(compositeCanvas.toDataURL("image/png"));
              return;
            }
          }
          resolve(canvas.toDataURL("image/png"));
        };

        const canvasSrc = document.createElement("canvas");
        const canvasGreen = document.createElement("canvas");
        const canvasIsolated = document.createElement("canvas");

        canvasSrc.width = w;
        canvasSrc.height = h;
        canvasGreen.width = w;
        canvasGreen.height = h;
        canvasIsolated.width = w;
        canvasIsolated.height = h;

        const ctxSrc = canvasSrc.getContext("2d");
        const ctxGreen = canvasGreen.getContext("2d");
        const ctxIsolated = canvasIsolated.getContext("2d");

        if (!ctxSrc || !ctxGreen || !ctxIsolated) {
          reject(new Error("Could not create canvas contexts"));
          return;
        }

        ctxSrc.drawImage(img, 0, 0, w, h);
        const originalData = ctxSrc.getImageData(0, 0, w, h);
        const currentChroma = CHROMA_OPTIONS.find(c => c.name === chromaColorName) || CHROMA_OPTIONS[0];

        if (segmentationMode === "ai" || segmentationMode === "frame") {
          let initialAlpha = new Uint8Array(w * h);

          if (segmentationMode === "ai") {
            const previewAlpha = aiAlphaMaskRef.current;
            if (previewAlpha && previewImageUri) {
              const scaleCanvas = document.createElement("canvas");
              const previewImg = new Image();
              previewImg.onload = () => {
                const pw = previewImg.width;
                const ph = previewImg.height;
                scaleCanvas.width = pw;
                scaleCanvas.height = ph;
                const sCtx = scaleCanvas.getContext("2d");
                if (sCtx) {
                  const alphaImgData = sCtx.createImageData(pw, ph);
                  for (let i = 0; i < pw * ph; i++) {
                    const val = previewAlpha[i];
                    alphaImgData.data[i * 4] = val;
                    alphaImgData.data[i * 4 + 1] = val;
                    alphaImgData.data[i * 4 + 2] = val;
                    alphaImgData.data[i * 4 + 3] = 255;
                  }
                  sCtx.putImageData(alphaImgData, 0, 0);

                  const targetCanvas = document.createElement("canvas");
                  targetCanvas.width = w;
                  targetCanvas.height = h;
                  const tCtx = targetCanvas.getContext("2d");
                  if (tCtx) {
                    tCtx.drawImage(scaleCanvas, 0, 0, w, h);
                    const scaledMaskData = tCtx.getImageData(0, 0, w, h);
                    for (let i = 0; i < w * h; i++) {
                      const alphaVal = scaledMaskData.data[i * 4];
                      if (isInvertedMask) {
                        initialAlpha[i] = alphaVal > 0 ? 0 : 255;
                      } else {
                        initialAlpha[i] = alphaVal;
                      }
                    }

                    let processedAlpha = initialAlpha;
                    if (erosionSize > 0) {
                      processedAlpha = erodeAlpha(processedAlpha, w, h, erosionSize);
                    }
                    if (dilationSize > 0) {
                      processedAlpha = dilateAlpha(processedAlpha, w, h, dilationSize);
                    }
                    if (featherRadius > 0) {
                      processedAlpha = blurAlpha(processedAlpha, w, h, featherRadius);
                    }

                    const src = originalData.data;
                    // In AI and Frame modes, we use the processed alpha mask directly.
                    // This avoids color-bleed contamination and provides clean, pixel-perfect cutouts.
                    const hybridAlpha = processedAlpha;

                    if (type === "greenscreen") {
                      const greenData = ctxGreen.createImageData(w, h);
                      const dstGreen = greenData.data;
                      for (let i = 0; i < w * h * 4; i += 4) {
                        const pixelIdx = i / 4;
                        if (hybridAlpha[pixelIdx] === 0) {
                          dstGreen[i] = currentChroma.rgb.r;
                          dstGreen[i + 1] = currentChroma.rgb.g;
                          dstGreen[i + 2] = currentChroma.rgb.b;
                          dstGreen[i + 3] = 255;
                        } else {
                          dstGreen[i] = src[i];
                          dstGreen[i + 1] = src[i + 1];
                          dstGreen[i + 2] = src[i + 2];
                          dstGreen[i + 3] = 255;
                        }
                      }
                      ctxGreen.putImageData(greenData, 0, 0);
                      resolve(canvasGreen.toDataURL("image/png"));
                    } else {
                      const isolatedData = ctxIsolated.createImageData(w, h);
                      const dstIsolated = isolatedData.data;
                      for (let i = 0; i < w * h * 4; i += 4) {
                        const pixelIdx = i / 4;
                        const alphaVal = hybridAlpha[pixelIdx];
                        dstIsolated[i + 3] = alphaVal;
                        
                        if (alphaVal === 0) {
                          dstIsolated[i] = 0;
                          dstIsolated[i + 1] = 0;
                          dstIsolated[i + 2] = 0;
                        } else {
                          let r = src[i];
                          let g = src[i + 1];
                          let b = src[i + 2];

                          if (alphaVal < 255) {
                            const alphaRatio = alphaVal / 255;
                            if (segmentationMode === "ai") {
                              if (alphaRatio > 0.05) {
                                const bgR = sampledColor.r;
                                const bgG = sampledColor.g;
                                const bgB = sampledColor.b;
                                r = Math.max(0, Math.min(255, Math.round((r - bgR * (1 - alphaRatio)) / alphaRatio)));
                                g = Math.max(0, Math.min(255, Math.round((g - bgG * (1 - alphaRatio)) / alphaRatio)));
                                b = Math.max(0, Math.min(255, Math.round((b - bgB * (1 - alphaRatio)) / alphaRatio)));
                              }
                            } else {
                              if (chromaColorName === "Green") {
                                const maxOther = Math.max(r, b);
                                if (g > maxOther) g = Math.round(maxOther * (1 - alphaRatio) + g * alphaRatio);
                              } else if (chromaColorName === "Magenta") {
                                const magentaComponent = Math.min(r, b) - g;
                                if (magentaComponent > 0) {
                                  r = Math.round(r - magentaComponent * (1 - alphaRatio));
                                  b = Math.round(b - magentaComponent * (1 - alphaRatio));
                                }
                              } else if (chromaColorName === "Cyan") {
                                const cyanComponent = Math.min(g, b) - r;
                                if (cyanComponent > 0) {
                                  g = Math.round(g - cyanComponent * (1 - alphaRatio));
                                  b = Math.round(b - cyanComponent * (1 - alphaRatio));
                                }
                              }
                            }
                          }

                          dstIsolated[i] = r;
                          dstIsolated[i + 1] = g;
                          dstIsolated[i + 2] = b;
                        }
                      }
                      ctxIsolated.putImageData(isolatedData, 0, 0);
                      resolveCanvas(canvasIsolated);
                    }
                  }
                }
              };
              previewImg.src = previewImageUri;
            } else {
              resolve(sourceImageUri);
            }
          } else {
            // frame mode
            const bgRgb = { r: originalData.data[0], g: originalData.data[1], b: originalData.data[2] };
            let minX = w;
            let maxX = 0;
            let minY = h;
            let maxY = 0;
            let found = false;
            const data = originalData.data;
            for (let y = 0; y < h; y++) {
              for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const a = data[idx + 3];
                if (a < 10) continue;
                const diff = Math.abs(r - bgRgb.r) + Math.abs(g - bgRgb.g) + Math.abs(b - bgRgb.b);
                if (diff > 35) {
                  if (x < minX) minX = x;
                  if (x > maxX) maxX = x;
                  if (y < minY) minY = y;
                  if (y > maxY) maxY = y;
                  found = true;
                }
              }
            }
            if (!found) {
              minX = 0;
              maxX = w - 1;
              minY = 0;
              maxY = h - 1;
            }
            for (let y = 0; y < h; y++) {
              for (let x = 0; x < w; x++) {
                const idx = y * w + x;
                const inside = x >= minX && x <= maxX && y >= minY && y <= maxY;
                const keepPixel = isInvertedMask ? !inside : inside;
                initialAlpha[idx] = keepPixel ? 255 : 0;
              }
            }
            let processedAlpha = initialAlpha;
            if (erosionSize > 0) processedAlpha = erodeAlpha(processedAlpha, w, h, erosionSize);
            if (dilationSize > 0) processedAlpha = dilateAlpha(processedAlpha, w, h, dilationSize);
            if (featherRadius > 0) processedAlpha = blurAlpha(processedAlpha, w, h, featherRadius);

            if (type === "greenscreen") {
              const greenData = ctxGreen.createImageData(w, h);
              const dstGreen = greenData.data;
              const src = originalData.data;
              for (let i = 0; i < w * h * 4; i += 4) {
                const pixelIdx = i / 4;
                if (processedAlpha[pixelIdx] === 0) {
                  dstGreen[i] = currentChroma.rgb.r;
                  dstGreen[i + 1] = currentChroma.rgb.g;
                  dstGreen[i + 2] = currentChroma.rgb.b;
                  dstGreen[i + 3] = 255;
                } else {
                  dstGreen[i] = src[i];
                  dstGreen[i + 1] = src[i + 1];
                  dstGreen[i + 2] = src[i + 2];
                  dstGreen[i + 3] = 255;
                }
              }
              ctxGreen.putImageData(greenData, 0, 0);
              resolve(canvasGreen.toDataURL("image/png"));
            } else {
              const isolatedData = ctxIsolated.createImageData(w, h);
              const dstIsolated = isolatedData.data;
              const src = originalData.data;
              for (let i = 0; i < w * h * 4; i += 4) {
                const pixelIdx = i / 4;
                dstIsolated[i] = src[i];
                dstIsolated[i + 1] = src[i + 1];
                dstIsolated[i + 2] = src[i + 2];
                dstIsolated[i + 3] = processedAlpha[pixelIdx];
                if (processedAlpha[pixelIdx] === 0) {
                  dstIsolated[i] = 0;
                  dstIsolated[i + 1] = 0;
                  dstIsolated[i + 2] = 0;
                }
              }
              ctxIsolated.putImageData(isolatedData, 0, 0);
              resolveCanvas(canvasIsolated);
            }
          }
        } else {
          // Standard Chroma Key Mode at full resolution
          const greenScreenData = createChromaGreenTransform(
            originalData,
            sampledColor,
            sampledColor2,
            isCheckerboard,
            useConnectivity,
            similarity,
            featherRadius,
            currentChroma.rgb
          );
          ctxGreen.putImageData(greenScreenData, 0, 0);

          if (type === "greenscreen") {
            resolve(canvasGreen.toDataURL("image/png"));
          } else {
            const isolatedData = isolateSubjectFromChroma(
              greenScreenData,
              hueMin,
              hueMax,
              satMin,
              satMax,
              valMin,
              valMax,
              erosionSize,
              dilationSize,
              featherRadius,
              useBoundingBox ? analysisReport?.boundingBox : null
            );
            ctxIsolated.putImageData(isolatedData, 0, 0);
            resolveCanvas(canvasIsolated);
          }
        }
      };
      img.onerror = reject;
      img.src = sourceImageUri;
    });
  };

  // Download Output files
  const downloadAsset = async (type: "greenscreen" | "isolated") => {
    let uri = "";
    try {
      uri = await getFullResolutionUri(type);
    } catch (e) {
      console.error("Full resolution render failed, falling back to preview", e);
      uri = type === "greenscreen" ? (greenScreenImageUri || "") : (isolatedImageUri || "");
    }
    let fileNameExt = type === "greenscreen" ? "chroma_greenscreen.png" : "isolated_asset.png";

    if (!uri) return;

    // 1. Check permissions & credits
    const isPro = profile?.is_pro === true;
    const hasHdCredits = (profile?.hd_credits_remaining ?? 0) > 0;
    const isDownloadingHD = isPro || hasHdCredits;
    const isSolidBgSelected = selectedBgColor && selectedBgColor !== "transparent";
    const solidBgTrialsRemaining = profile?.solid_bg_trials_remaining ?? 3;

    if (!user) {
      // Guest mode
      const guestTrialUsed = localStorage.getItem("guest_trial_used");
      if (guestTrialUsed === "true") {
        alert("You have already used your 1 free guest trial. Please sign up to get 10 free credits!");
        onOpenAuth();
        return;
      }
    } else {
      // Logged in user
      if (!isPro) {
        if (isSolidBgSelected && type === "isolated") {
          if (solidBgTrialsRemaining <= 0) {
            alert("You've used all 3 Free Solid Background exports. Upgrade to Pro for unlimited background colors & HD exports.");
            onOpenPricing();
            return;
          }
        }
        if ((profile?.credits ?? 0) <= 0) {
          alert("You have 0 credits remaining. Please upgrade or purchase credits to continue downloading.");
          onOpenPricing();
          return;
        }
      }
    }

    // 2. Perform scale down if not downloading in HD (longest edge max 500px)
    let finalUri = uri;
    if (!isDownloadingHD) {
      try {
        finalUri = await scaleDownImage(uri, 500);
      } catch (e) {
        console.error("Failed to scale down image resolution:", e);
      }
    }

    // 3. Trigger download
    const a = document.createElement("a");
    a.href = finalUri;
    a.download = fileNameExt;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // 4. Consume credit & upload to history
    if (!user) {
      localStorage.setItem("guest_trial_used", "true");
      alert("Guest trial used! Sign up for free to get 10 more credits.");
    } else {
      // Logged in user
      if (!isPro) {
        try {
          let usedSolidBgText = "";
          if (isSolidBgSelected && type === "isolated") {
            try {
              const { error: rpcError } = await supabase.rpc("decrement_user_solid_bg_trials", {
                user_id: user.id,
                amount: 1,
              });
              if (rpcError) throw rpcError;
              usedSolidBgText = `Used 1 Solid BG Trial (${solidBgTrialsRemaining - 1} remaining). `;
            } catch (rpcErr) {
              console.warn("decrement_user_solid_bg_trials RPC failed (database migration might not be executed):", rpcErr);
            }
          }

          if (hasHdCredits) {
            const { error: rpcError } = await supabase.rpc("decrement_user_hd_credits", {
              user_id: user.id,
              amount: 1,
            });
            if (rpcError) throw rpcError;
            showToast(`${usedSolidBgText}Used 1 HD Credit (${profile.hd_credits_remaining - 1} remaining)`, "success");
          } else {
            const { error: rpcError } = await supabase.rpc("decrement_user_credits", {
              user_id: user.id,
              amount: 1,
            });
            if (rpcError) throw rpcError;
            showToast(`${usedSolidBgText}Used Standard Credit. Upgrade to Pro for unlimited HD downloads.`, "info");
          }
          onRefreshProfile();
        } catch (err) {
          console.error("Failed to decrement credits:", err);
        }
      }

      // Save to cloud history
      try {
        setDownloadingCloud(true);
        await uploadImagePairToHistory(sourceImageUri || "", uri);
      } catch (err) {
        console.error("Failed to save to cloud history:", err);
      } finally {
        setDownloadingCloud(false);
      }
    }
  };

  // Bulk File Upload & Drop handlers
  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      addBulkFiles(Array.from(files));
    }
  };

  const addBulkFiles = (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    if (profile?.is_pro !== true) {
      if (imageFiles.length > 1) {
        setShowBatchUpsell(true);
        return;
      }
    }

    const newItems: BulkImageItem[] = [];
    let loadedCount = 0;

    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newItems.push({
            id: Math.random().toString(36).substring(2, 9),
            fileName: file.name,
            sourceUri: event.target.result as string,
            greenScreenUri: null,
            isolatedUri: null,
            status: "queued",
            progress: 0,
            detectedColorHex: "#ffffff",
            detectedColorRgb: { r: 255, g: 255, b: 255 },
          });

          loadedCount++;
          if (loadedCount === imageFiles.length) {
            setBulkItems((prev) => [...prev, ...newItems]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Sequential Asynchronous Bulk Processing Queue
  useEffect(() => {
    if (!bulkQueueActive) return;

    // Find the first queued item in the list
    const nextItemIndex = bulkItems.findIndex((item) => item.status === "queued");
    if (nextItemIndex === -1) {
      setBulkQueueActive(false);
      return;
    }

    const item = bulkItems[nextItemIndex];
    
    const processItem = async () => {
      setBulkItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "analyzing" as const, progress: 20 } : i))
      );

      try {
        const img = new Image();
        img.src = item.sourceUri;
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        const w = img.naturalWidth || 800;
        const h = img.naturalHeight || 600;

        const canvasSrc = document.createElement("canvas");
        canvasSrc.width = w;
        canvasSrc.height = h;
        const ctxSrc = canvasSrc.getContext("2d");
        if (!ctxSrc) throw new Error("Could not create source context");
        ctxSrc.drawImage(img, 0, 0, w, h);
        const srcData = ctxSrc.getImageData(0, 0, w, h);

        // Instant Corner Background Color Auto-Detection (Checkerboard-Aware!)
        const detectedColor = detectDualBackgroundColorsFromCorners(srcData);

        // Auto-detect the safest chroma key backdrop based on the image's design colors
        const safestColor = detectSafestChromaColor(srcData);
        const activeChromaName = item.chromaColorName || safestColor.name;
        const currentChroma = CHROMA_OPTIONS.find(c => c.name === activeChromaName) || CHROMA_OPTIONS[0];

        // Detect if we should use detected settings or respect custom settings already on the item
        const isGrid = item.isCheckerboard !== undefined ? item.isCheckerboard : detectedColor.isCheckerboard;
        const color1 = (item.detectedColorHex && item.detectedColorHex !== "#ffffff") ? item.detectedColorRgb : { r: detectedColor.color1.r, g: detectedColor.color1.g, b: detectedColor.color1.b };
        const color1Hex = (item.detectedColorHex && item.detectedColorHex !== "#ffffff") ? item.detectedColorHex : detectedColor.color1.hex;

        const color2 = item.detectedColor2Rgb ? item.detectedColor2Rgb : { r: detectedColor.color2.r, g: detectedColor.color2.g, b: detectedColor.color2.b };
        const color2Hex = item.detectedColor2Hex ? item.detectedColor2Hex : detectedColor.color2.hex;
        
        const conn = item.useConnectivity !== undefined ? item.useConnectivity : isGrid; // Default: ON for checkerboard, OFF for solid!
        const sim = item.similarity !== undefined ? item.similarity : similarity;
        const mode = item.segmentationMode !== undefined ? item.segmentationMode : segmentationMode;
        const inv = item.isInvertedMask !== undefined ? item.isInvertedMask : false;

        setBulkItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: "isolating" as const,
                  progress: 60,
                  detectedColorHex: color1Hex,
                  detectedColorRgb: color1,
                  detectedColor2Hex: color2Hex,
                  detectedColor2Rgb: color2,
                  isCheckerboard: isGrid,
                  useConnectivity: conn,
                  similarity: sim,
                  chromaColorName: activeChromaName,
                }
              : i
          )
        );

        // Optional Groq AI bounding box retrieval (staggered sequentially with a short timeout)
        let boundingBox = null;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout for fast bulk processing
          const apiBase = (import.meta.env.VITE_API_URL || "").trim();
          const res = await fetch(`${apiBase}/api/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageBase64: item.sourceUri,
              mimeType: item.sourceUri.split(";")[0].split(":")[1] || "image/png",
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (res.ok) {
            const report = await res.json();
            boundingBox = report.boundingBox;
          }
        } catch (groqErr) {
          console.warn("Groq spatial analysis failed in bulk mode, using client-side corner-isolation:", groqErr);
        }

        const erSize = item.erosionSize !== undefined ? item.erosionSize : 1;
        const dilSize = item.dilationSize !== undefined ? item.dilationSize : 0;
        const fRadius = item.featherRadius !== undefined ? item.featherRadius : 1;

        let isolatedUri = "";
        let greenScreenUri = "";

        if (mode === "ai" || mode === "frame") {
          let initialAlpha = new Uint8Array(w * h);

          if (mode === "ai") {
            // AI Magic Cutout Mode using local @imgly/background-removal
            const blob = await imglyRemoveBackground(item.sourceUri, { model: "isnet" as const });
            const url = URL.createObjectURL(blob);

            const imgIsolated = new Image();
            imgIsolated.src = url;
            await new Promise((resolve, reject) => {
              imgIsolated.onload = resolve;
              imgIsolated.onerror = reject;
            });

            const canvasAI = document.createElement("canvas");
            canvasAI.width = w;
            canvasAI.height = h;
            const ctxAI = canvasAI.getContext("2d");
            if (!ctxAI) throw new Error("Could not create AI canvas context");
            ctxAI.drawImage(imgIsolated, 0, 0, w, h);
            const aiData = ctxAI.getImageData(0, 0, w, h);

            for (let i = 0; i < w * h; i++) {
              const alphaVal = aiData.data[i * 4 + 3];
              if (inv) {
                initialAlpha[i] = alphaVal > 0 ? 0 : 255;
              } else {
                initialAlpha[i] = alphaVal;
              }
            }
            URL.revokeObjectURL(url);
          } else {
            // frame (Solid Border Crop / Design Frame) Mode
            const bgRgb = { r: srcData.data[0], g: srcData.data[1], b: srcData.data[2] };
            let minX = w;
            let maxX = 0;
            let minY = h;
            let maxY = 0;
            let found = false;
            const data = srcData.data;

            for (let y = 0; y < h; y++) {
              for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const a = data[idx + 3];

                if (a < 10) continue;

                const diff = Math.abs(r - bgRgb.r) + Math.abs(g - bgRgb.g) + Math.abs(b - bgRgb.b);
                if (diff > 35) {
                  if (x < minX) minX = x;
                  if (x > maxX) maxX = x;
                  if (y < minY) minY = y;
                  if (y > maxY) maxY = y;
                  found = true;
                }
              }
            }

            if (!found) {
              minX = 0;
              maxX = w - 1;
              minY = 0;
              maxY = h - 1;
            }

            for (let y = 0; y < h; y++) {
              for (let x = 0; x < w; x++) {
                const idx = y * w + x;
                const inside = x >= minX && x <= maxX && y >= minY && y <= maxY;
                const keepPixel = inv ? !inside : inside;
                initialAlpha[idx] = keepPixel ? 255 : 0;
              }
            }
          }

          let processedAlpha = initialAlpha;
          if (erSize > 0) {
            processedAlpha = erodeAlpha(processedAlpha, w, h, erSize);
          }
          if (dilSize > 0) {
            processedAlpha = dilateAlpha(processedAlpha, w, h, dilSize);
          }
          if (fRadius > 0) {
            processedAlpha = blurAlpha(processedAlpha, w, h, fRadius);
          }

          // Apply Step 2: Safety Backdrop Transform
          const canvasGreen = document.createElement("canvas");
          canvasGreen.width = w;
          canvasGreen.height = h;
          const ctxGreen = canvasGreen.getContext("2d");
          if (!ctxGreen) throw new Error("Could not create green context");

          const greenData = ctxGreen.createImageData(w, h);
          const dstGreen = greenData.data;
          const src = srcData.data;

          for (let i = 0; i < w * h * 4; i += 4) {
            const pixelIdx = i / 4;
            if (initialAlpha[pixelIdx] === 0) {
              dstGreen[i] = currentChroma.rgb.r;
              dstGreen[i + 1] = currentChroma.rgb.g;
              dstGreen[i + 2] = currentChroma.rgb.b;
              dstGreen[i + 3] = 255;
            } else {
              dstGreen[i] = src[i];
              dstGreen[i + 1] = src[i + 1];
              dstGreen[i + 2] = src[i + 2];
              dstGreen[i + 3] = 255;
            }
          }
          ctxGreen.putImageData(greenData, 0, 0);
          greenScreenUri = canvasGreen.toDataURL("image/png");

          // Apply Step 3: Alpha Isolation
          const canvasIsolated = document.createElement("canvas");
          canvasIsolated.width = w;
          canvasIsolated.height = h;
          const ctxIsolated = canvasIsolated.getContext("2d");
          if (!ctxIsolated) throw new Error("Could not create isolated context");

          const isolatedData = ctxIsolated.createImageData(w, h);
          const dstIsolated = isolatedData.data;

          for (let i = 0; i < w * h * 4; i += 4) {
            const pixelIdx = i / 4;
            dstIsolated[i] = src[i];
            dstIsolated[i + 1] = src[i + 1];
            dstIsolated[i + 2] = src[i + 2];
            dstIsolated[i + 3] = processedAlpha[pixelIdx];

            if (processedAlpha[pixelIdx] === 0) {
              dstIsolated[i] = 0;
              dstIsolated[i + 1] = 0;
              dstIsolated[i + 2] = 0;
            }
          }
          ctxIsolated.putImageData(isolatedData, 0, 0);
          isolatedUri = canvasIsolated.toDataURL("image/png");
        } else {
          // Standard Chroma Key Mode
          const canvasGreen = document.createElement("canvas");
          canvasGreen.width = w;
          canvasGreen.height = h;
          const ctxGreen = canvasGreen.getContext("2d");
          if (!ctxGreen) throw new Error("Could not create green context");
          const greenData = createChromaGreenTransform(
            srcData,
            color1,
            color2,
            isGrid,
            conn,
            sim,
            1,
            currentChroma.rgb
          );
          ctxGreen.putImageData(greenData, 0, 0);

          const canvasIsolated = document.createElement("canvas");
          canvasIsolated.width = w;
          canvasIsolated.height = h;
          const ctxIsolated = canvasIsolated.getContext("2d");
          if (!ctxIsolated) throw new Error("Could not create isolated context");
          
          const isolatedData = isolateSubjectFromChroma(
            greenData,
            currentChroma.hueRange.min,
            currentChroma.hueRange.max,
            50,
            255,
            50,
            255,
            erSize,
            dilSize,
            fRadius,
            boundingBox
          );
          ctxIsolated.putImageData(isolatedData, 0, 0);

          isolatedUri = canvasIsolated.toDataURL("image/png");
          greenScreenUri = canvasGreen.toDataURL("image/png");
        }

        setBulkItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: "complete" as const,
                  progress: 100,
                  isolatedUri,
                  greenScreenUri,
                  detectedColorHex: color1Hex,
                  detectedColorRgb: color1,
                  detectedColor2Hex: color2Hex,
                  detectedColor2Rgb: color2,
                  isCheckerboard: isGrid,
                  useConnectivity: conn,
                  similarity: sim,
                  chromaColorName: activeChromaName,
                }
              : i
          )
        );
      } catch (err: any) {
        console.error("Bulk item processing error:", err);
        setBulkItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: "failed" as const,
                  progress: 0,
                  errorMessage: err.message || "Failed to process",
                }
              : i
          )
        );
      }
    };

    processItem();
  }, [bulkQueueActive, bulkItems]);

  const downloadBulkItem = async (item: BulkImageItem) => {
    if (!item.isolatedUri) return;

    // 1. Check permissions & credits
    const isPro = profile?.is_pro === true;
    const hasHdCredits = (profile?.hd_credits_remaining ?? 0) > 0;
    const isDownloadingHD = isPro || hasHdCredits;

    if (!user) {
      // Guest mode
      const guestTrialUsed = localStorage.getItem("guest_trial_used");
      if (guestTrialUsed === "true") {
        alert("You have already used your 1 free guest trial. Please sign up to get 10 free credits!");
        onOpenAuth();
        return;
      }
    } else {
      // Logged in user
      if (!isPro) {
        if ((profile?.credits ?? 0) <= 0) {
          alert("You have 0 credits remaining. Please upgrade or purchase credits to continue downloading.");
          onOpenPricing();
          return;
        }
      }
    }

    // 2. Perform scale down if not downloading in HD (longest edge max 500px)
    let finalUri = item.isolatedUri;
    if (!isDownloadingHD) {
      try {
        finalUri = await scaleDownImage(item.isolatedUri, 500);
      } catch (e) {
        console.error("Failed to scale down image resolution:", e);
      }
    }

    // 3. Trigger download
    const a = document.createElement("a");
    a.href = finalUri;
    a.download = `isolated_${item.fileName.replace(/\.[^/.]+$/, "")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // 4. Consume credit & upload to history
    if (!user) {
      localStorage.setItem("guest_trial_used", "true");
      alert("Guest trial used! Sign up for free to get 10 more credits.");
    } else {
      // Logged in user
      if (!isPro) {
        try {
          if (hasHdCredits) {
            const { error: rpcError } = await supabase.rpc("decrement_user_hd_credits", {
              user_id: user.id,
              amount: 1,
            });
            if (rpcError) throw rpcError;
            showToast(`Used 1 HD Credit (${profile.hd_credits_remaining - 1} remaining)`, "success");
          } else {
            const { error: rpcError } = await supabase.rpc("decrement_user_credits", {
              user_id: user.id,
              amount: 1,
            });
            if (rpcError) throw rpcError;
            showToast("Used Standard Credit. Upgrade to Pro for unlimited HD downloads.", "info");
          }
          onRefreshProfile();
        } catch (err) {
          console.error("Failed to decrement credits:", err);
        }
      }

      // Save to cloud history
      try {
        setDownloadingCloud(true);
        await uploadImagePairToHistory(item.sourceUri, item.isolatedUri);
      } catch (err) {
        console.error("Failed to save bulk item to cloud history:", err);
      } finally {
        setDownloadingCloud(false);
      }
    }
  };

  const downloadAllBulkItems = async () => {
    const completedItems = bulkItems.filter((i) => i.status === "complete");
    if (completedItems.length === 0) return;

    const isPro = profile?.is_pro === true;
    if (isPro) {
      try {
        const zip = new JSZip();
        completedItems.forEach((item) => {
          if (!item.isolatedUri) return;
          const filename = `isolated_${item.fileName.replace(/\.[^/.]+$/, "")}.png`;
          const splitIdx = item.isolatedUri.indexOf(",");
          const base64Data = splitIdx === -1 ? item.isolatedUri : item.isolatedUri.substring(splitIdx + 1);
          zip.file(filename, base64Data, { base64: true });
        });

        // Upload batch items to cloud history in parallel
        completedItems.forEach((item) => {
          if (item.sourceUri && item.isolatedUri) {
            uploadImagePairToHistory(item.sourceUri, item.isolatedUri).catch((err) =>
              console.error("Failed to upload batch item to history:", err)
            );
          }
        });

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `isolated_batch_${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err: any) {
        console.error("Failed to generate batch zip archive:", err);
        alert(`Failed to package batch files: ${err.message || String(err)}`);
      }
    } else {
      completedItems.forEach((item, index) => {
        setTimeout(() => {
          downloadBulkItem(item);
        }, index * 400); // Stagger downloads to prevent browser blocking
      });
    }
  };

  const reprocessBulkItem = async (itemId: string, updatedFields: Partial<BulkImageItem>) => {
    setBulkItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? {
              ...i,
              ...updatedFields,
              status: "isolating" as const,
              progress: 50,
            }
          : i
      )
    );

    try {
      let mergedItem: BulkImageItem | undefined;
      setBulkItems((prev) => {
        mergedItem = prev.find((i) => i.id === itemId);
        return prev;
      });

      await new Promise((r) => setTimeout(r, 10));
      
      if (!mergedItem) return;

      const img = new Image();
      img.src = mergedItem.sourceUri;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const w = img.naturalWidth || 800;
      const h = img.naturalHeight || 600;

      const canvasSrc = document.createElement("canvas");
      canvasSrc.width = w;
      canvasSrc.height = h;
      const ctxSrc = canvasSrc.getContext("2d");
      if (!ctxSrc) throw new Error("Could not create source context");
      ctxSrc.drawImage(img, 0, 0, w, h);
      const srcData = ctxSrc.getImageData(0, 0, w, h);

      const isGrid = mergedItem.isCheckerboard || false;
      const color1 = mergedItem.detectedColorRgb;
      const color2 = mergedItem.detectedColor2Rgb || color1;
      const conn = mergedItem.useConnectivity !== false;
      const sim = mergedItem.similarity !== undefined ? mergedItem.similarity : similarity;
      const activeChromaName = mergedItem.chromaColorName || "Green";
      const currentChroma = CHROMA_OPTIONS.find(c => c.name === activeChromaName) || CHROMA_OPTIONS[0];
      const mode = mergedItem.segmentationMode !== undefined ? mergedItem.segmentationMode : segmentationMode;
      const inv = mergedItem.isInvertedMask !== undefined ? mergedItem.isInvertedMask : false;

      const erSize = mergedItem.erosionSize !== undefined ? mergedItem.erosionSize : 1;
      const dilSize = mergedItem.dilationSize !== undefined ? mergedItem.dilationSize : 0;
      const fRadius = mergedItem.featherRadius !== undefined ? mergedItem.featherRadius : 1;

      let isolatedUri = "";
      let greenScreenUri = "";

      if (mode === "ai" || mode === "frame") {
        let initialAlpha = new Uint8Array(w * h);

        if (mode === "ai") {
          // AI Segmentation Mode using local @imgly/background-removal
          const blob = await imglyRemoveBackground(mergedItem.sourceUri, { model: "isnet" as const });
          const url = URL.createObjectURL(blob);

          const imgIsolated = new Image();
          imgIsolated.src = url;
          await new Promise((resolve, reject) => {
            imgIsolated.onload = resolve;
            imgIsolated.onerror = reject;
          });

          const canvasAI = document.createElement("canvas");
          canvasAI.width = w;
          canvasAI.height = h;
          const ctxAI = canvasAI.getContext("2d");
          if (!ctxAI) throw new Error("Could not create AI canvas context");
          ctxAI.drawImage(imgIsolated, 0, 0, w, h);
          const aiData = ctxAI.getImageData(0, 0, w, h);

          for (let i = 0; i < w * h; i++) {
            const alphaVal = aiData.data[i * 4 + 3];
            if (inv) {
              initialAlpha[i] = alphaVal > 0 ? 0 : 255;
            } else {
              initialAlpha[i] = alphaVal;
            }
          }
          URL.revokeObjectURL(url);
        } else {
          // frame (Solid Border Crop / Design Frame) Mode
          const bgRgb = { r: srcData.data[0], g: srcData.data[1], b: srcData.data[2] };
          let minX = w;
          let maxX = 0;
          let minY = h;
          let maxY = 0;
          let found = false;
          const data = srcData.data;

          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const idx = (y * w + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const a = data[idx + 3];

              if (a < 10) continue;

              const diff = Math.abs(r - bgRgb.r) + Math.abs(g - bgRgb.g) + Math.abs(b - bgRgb.b);
              if (diff > 35) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
                found = true;
              }
            }
          }

          if (!found) {
            minX = 0;
            maxX = w - 1;
            minY = 0;
            maxY = h - 1;
          }

          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const idx = y * w + x;
              const inside = x >= minX && x <= maxX && y >= minY && y <= maxY;
              const keepPixel = inv ? !inside : inside;
              initialAlpha[idx] = keepPixel ? 255 : 0;
            }
          }
        }

        let processedAlpha = initialAlpha;
        if (erSize > 0) {
          processedAlpha = erodeAlpha(processedAlpha, w, h, erSize);
        }
        if (dilSize > 0) {
          processedAlpha = dilateAlpha(processedAlpha, w, h, dilSize);
        }
        if (fRadius > 0) {
          processedAlpha = blurAlpha(processedAlpha, w, h, fRadius);
        }

        // Apply Step 2: Safety Backdrop Transform
        const canvasGreen = document.createElement("canvas");
        canvasGreen.width = w;
        canvasGreen.height = h;
        const ctxGreen = canvasGreen.getContext("2d");
        if (!ctxGreen) throw new Error("Could not create green context");

        const greenData = ctxGreen.createImageData(w, h);
        const dstGreen = greenData.data;
        const src = srcData.data;

        for (let i = 0; i < w * h * 4; i += 4) {
          const pixelIdx = i / 4;
          if (initialAlpha[pixelIdx] === 0) {
            dstGreen[i] = currentChroma.rgb.r;
            dstGreen[i + 1] = currentChroma.rgb.g;
            dstGreen[i + 2] = currentChroma.rgb.b;
            dstGreen[i + 3] = 255;
          } else {
            dstGreen[i] = src[i];
            dstGreen[i + 1] = src[i + 1];
            dstGreen[i + 2] = src[i + 2];
            dstGreen[i + 3] = 255;
          }
        }
        ctxGreen.putImageData(greenData, 0, 0);
        greenScreenUri = canvasGreen.toDataURL("image/png");

        // Apply Step 3: Alpha Isolation
        const canvasIsolated = document.createElement("canvas");
        canvasIsolated.width = w;
        canvasIsolated.height = h;
        const ctxIsolated = canvasIsolated.getContext("2d");
        if (!ctxIsolated) throw new Error("Could not create isolated context");

        const isolatedData = ctxIsolated.createImageData(w, h);
        const dstIsolated = isolatedData.data;

        for (let i = 0; i < w * h * 4; i += 4) {
          const pixelIdx = i / 4;
          dstIsolated[i] = src[i];
          dstIsolated[i + 1] = src[i + 1];
          dstIsolated[i + 2] = src[i + 2];
          dstIsolated[i + 3] = processedAlpha[pixelIdx];

          if (processedAlpha[pixelIdx] === 0) {
            dstIsolated[i] = 0;
            dstIsolated[i + 1] = 0;
            dstIsolated[i + 2] = 0;
          }
        }
        ctxIsolated.putImageData(isolatedData, 0, 0);
        isolatedUri = canvasIsolated.toDataURL("image/png");
      } else {
        // Standard Chroma Key Mode
        const canvasGreen = document.createElement("canvas");
        canvasGreen.width = w;
        canvasGreen.height = h;
        const ctxGreen = canvasGreen.getContext("2d");
        if (!ctxGreen) throw new Error("Could not create green context");
        
        const greenData = createChromaGreenTransform(
          srcData,
          color1,
          color2,
          isGrid,
          conn,
          sim,
          1,
          currentChroma.rgb
        );
        ctxGreen.putImageData(greenData, 0, 0);

        const canvasIsolated = document.createElement("canvas");
        canvasIsolated.width = w;
        canvasIsolated.height = h;
        const ctxIsolated = canvasIsolated.getContext("2d");
        if (!ctxIsolated) throw new Error("Could not create isolated context");

        const isolatedData = isolateSubjectFromChroma(
          greenData,
          currentChroma.hueRange.min,
          currentChroma.hueRange.max,
          50,
          255,
          50,
          255,
          erSize,
          dilSize,
          fRadius,
          mergedItem.boundingBox
        );
        ctxIsolated.putImageData(isolatedData, 0, 0);

        isolatedUri = canvasIsolated.toDataURL("image/png");
        greenScreenUri = canvasGreen.toDataURL("image/png");
      }

      setBulkItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                status: "complete" as const,
                progress: 100,
                isolatedUri,
                greenScreenUri,
                chromaColorName: activeChromaName,
                segmentationMode: mode,
              }
            : i
        )
      );
    } catch (err: any) {
      console.error("Error reprocessing single bulk item:", err);
      setBulkItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                status: "failed" as const,
                progress: 0,
                errorMessage: err.message || "Failed to process",
              }
            : i
        )
      );
    }
  };

  const handleBulkThumbnailClick = (
    e: React.MouseEvent<HTMLImageElement>,
    item: BulkImageItem
  ) => {
    if (!activeBulkDropper || activeBulkDropper.itemId !== item.id) return;

    const colorIndex = activeBulkDropper.colorIndex;
    const imgEl = e.currentTarget;
    const rect = imgEl.getBoundingClientRect();

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const tempImg = new Image();
    tempImg.src = item.sourceUri;
    tempImg.onload = () => {
      const naturalW = tempImg.naturalWidth;
      const naturalH = tempImg.naturalHeight;

      const boxW = rect.width;
      const boxH = rect.height;

      const imgRatio = naturalW / naturalH;
      const boxRatio = boxW / boxH;

      let renderedW = boxW;
      let renderedH = boxH;
      let xOffset = 0;
      let yOffset = 0;

      if (imgRatio > boxRatio) {
        renderedH = boxW / imgRatio;
        yOffset = (boxH - renderedH) / 2;
      } else {
        renderedW = boxH * imgRatio;
        xOffset = (boxW - renderedW) / 2;
      }

      const imageClickX = clickX - xOffset;
      const imageClickY = clickY - yOffset;

      if (
        imageClickX >= 0 &&
        imageClickX <= renderedW &&
        imageClickY >= 0 &&
        imageClickY <= renderedH
      ) {
        const scaleX = naturalW / renderedW;
        const scaleY = naturalH / renderedH;

        const originalX = Math.floor(imageClickX * scaleX);
        const originalY = Math.floor(imageClickY * scaleY);

        const canvas = document.createElement("canvas");
        const patchSize = item.isCheckerboard ? 16 : 1;
        canvas.width = patchSize;
        canvas.height = patchSize;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          if (item.isCheckerboard) {
            const halfPatch = Math.floor(patchSize / 2);
            const xStart = Math.max(0, originalX - halfPatch);
            const yStart = Math.max(0, originalY - halfPatch);
            ctx.drawImage(tempImg, -xStart, -yStart);

            const patchData = ctx.getImageData(0, 0, patchSize, patchSize).data;
            const patchPixels: { r: number; g: number; b: number; luminance: number }[] = [];

            for (let i = 0; i < patchData.length; i += 4) {
              const r = patchData[i];
              const g = patchData[i + 1];
              const b = patchData[i + 2];
              const a = patchData[i + 3];
              if (a > 50) {
                const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                patchPixels.push({ r, g, b, luminance });
              }
            }

            if (patchPixels.length > 4) {
              const sorted = [...patchPixels].sort((a, b) => a.luminance - b.luminance);
              const medianIdx = Math.floor(sorted.length / 2);
              const darkPixels = sorted.slice(0, medianIdx);
              const brightPixels = sorted.slice(medianIdx);

              if (darkPixels.length > 0 && brightPixels.length > 0) {
                const r1 = Math.round(brightPixels.reduce((sum, p) => sum + p.r, 0) / brightPixels.length);
                const g1 = Math.round(brightPixels.reduce((sum, p) => sum + p.g, 0) / brightPixels.length);
                const b1 = Math.round(brightPixels.reduce((sum, p) => sum + p.b, 0) / brightPixels.length);
                const hex1 = "#" + ((1 << 24) + (r1 << 16) + (g1 << 8) + b1).toString(16).slice(1);

                const r2 = Math.round(darkPixels.reduce((sum, p) => sum + p.r, 0) / darkPixels.length);
                const g2 = Math.round(darkPixels.reduce((sum, p) => sum + p.g, 0) / darkPixels.length);
                const b2 = Math.round(darkPixels.reduce((sum, p) => sum + p.b, 0) / darkPixels.length);
                const hex2 = "#" + ((1 << 24) + (r2 << 16) + (g2 << 8) + b2).toString(16).slice(1);

                const updatedFields = {
                  detectedColorHex: hex1,
                  detectedColorRgb: { r: r1, g: g1, b: b1 },
                  detectedColor2Hex: hex2,
                  detectedColor2Rgb: { r: r2, g: g2, b: b2 }
                };

                if (item.status === "complete" || item.status === "failed") {
                  reprocessBulkItem(item.id, updatedFields);
                } else {
                  setBulkItems((prev) =>
                    prev.map((i) => (i.id === item.id ? { ...i, ...updatedFields } : i))
                  );
                }
                setActiveBulkDropper(null);
                return;
              }
            }
          }

          // Fallback single-pixel sampling
          ctx.drawImage(tempImg, -originalX, -originalY);
          const pixel = ctx.getImageData(0, 0, 1, 1).data;
          const r = pixel[0];
          const g = pixel[1];
          const b = pixel[2];
          const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);

          const updatedFields: Partial<BulkImageItem> = {};
          if (colorIndex === "color1") {
            updatedFields.detectedColorHex = hex;
            updatedFields.detectedColorRgb = { r, g, b };
          } else {
            updatedFields.detectedColor2Hex = hex;
            updatedFields.detectedColor2Rgb = { r, g, b };
          }

          if (item.status === "complete" || item.status === "failed") {
            reprocessBulkItem(item.id, updatedFields);
          } else {
            setBulkItems((prev) =>
              prev.map((i) => (i.id === item.id ? { ...i, ...updatedFields } : i))
            );
          }
        }
      }

      setActiveBulkDropper(null);
    };
  };

  const handleFineTuneBulkItem = (item: BulkImageItem) => {
    // 1. Set the editing ID to trigger real-time synchronization
    setEditingBulkId(item.id);
    
    // 2. Populate Single Mode parameters from this bulk item
    setSourceImageUri(item.sourceUri);
    setPreviewImageUri(item.sourceUri); // ← CRITICAL: rendering pipeline requires previewImageUri to be non-null
    setFileName(item.fileName);
    
    setSampledColor(item.detectedColorRgb);
    setSampledColorHex(item.detectedColorHex);
    
    if (item.detectedColor2Rgb && item.detectedColor2Hex) {
      setSampledColor2(item.detectedColor2Rgb);
      setSampledColor2Hex(item.detectedColor2Hex);
    }
    
    setIsCheckerboard(item.isCheckerboard || false);
    setUseConnectivity(item.useConnectivity !== false); // Default true
    setSegmentationMode(item.segmentationMode || "chroma");
    setIsInvertedMask(item.isInvertedMask || false);
    
    if (typeof item.similarity === "number") setSimilarity(item.similarity);
    if (typeof item.erosionSize === "number") setErosionSize(item.erosionSize);
    if (typeof item.dilationSize === "number") setDilationSize(item.dilationSize);
    if (typeof item.featherRadius === "number") setFeatherRadius(item.featherRadius);
    
    setGreenScreenImageUri(item.greenScreenUri);
    setIsolatedImageUri(item.isolatedUri);
    
    // 3. Always start on the Original tab so user can see the source image
    setActiveTab("original");
    
    // 4. Switch view mode to "single" to load the advanced editor
    setWorkMode("single");
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Premium Work Mode Switcher */}
      <div className="flex justify-center mb-2">
        <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800/80 p-1.5 rounded-2xl flex gap-2 max-w-md w-full shadow-2xl relative overflow-hidden group">
          {/* Subtle moving back-glow */}
          <div className="absolute -inset-y-4 -inset-x-12 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 blur-xl opacity-50 group-hover:opacity-100 transition duration-500" />
          
          <button
            type="button"
            onClick={() => setWorkMode("single")}
            className={`flex-1 relative z-10 flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs font-mono font-bold tracking-wide uppercase transition-all duration-300 ${
              workMode === "single"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/10 scale-[1.02]"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/30"
            }`}
          >
            <Sliders className="h-4 w-4 shrink-0" />
            <span>Single Subject</span>
          </button>
          
          <button
            type="button"
            onClick={() => setWorkMode("bulk")}
            className={`flex-1 relative z-10 flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs font-mono font-bold tracking-wide uppercase transition-all duration-300 ${
              workMode === "bulk"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/10 scale-[1.02]"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/30"
            }`}
          >
            <Layers className="h-4 w-4 shrink-0" />
            <span>Bulk Remover</span>
          </button>
        </div>
      </div>

      {workMode === "single" ? (
        <div className="flex flex-col gap-4 animate-fade-in w-full">
          {editingBulkId && (
            <div className="bg-emerald-950/45 border border-emerald-900/50 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-emerald-400 font-mono shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-400 animate-pulse" />
                <span>
                  <strong>Connected Active Editor:</strong> Synchronizing adjustments in real-time to Bulk Card: <span className="text-white font-bold">{fileName}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingBulkId(null);
                  setSourceImageUri(null);
                  setGreenScreenImageUri(null);
                  setIsolatedImageUri(null);
                  setAnalysisReport(null);
                  setWorkMode("bulk");
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 shadow shadow-emerald-950/20 scale-[1.01]"
              >
                Save & Exit to Bulk
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* LEFT AREA: Work Control Board & Parameters (xl:7 cols) */}
          <div className="xl:col-span-5 flex flex-col gap-6">
            {/* Upload Terminal */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
              <div className="px-5 py-3 bg-gray-950 border-b border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-2 shrink-0">
                  <FileImage className="h-4.5 w-4.5 text-emerald-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300">
                    Source Terminal
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {sourceImageUri && (
                    <span className="text-[10px] font-mono text-gray-500 bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                      {fileDimensions.w}x{fileDimensions.h}px
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5">
                {!sourceImageUri ? (
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-gray-800 hover:border-emerald-500/50 bg-gray-950/40 rounded-xl p-8 text-center transition flex flex-col items-center justify-center cursor-pointer group"
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    <div className="p-4 rounded-full bg-gray-900 border border-gray-800 group-hover:scale-110 transition duration-300 text-gray-400 group-hover:text-emerald-400 mb-4">
                      <Upload className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-200">Drag & Drop Image</h3>
                    <p className="text-xs text-gray-500 mt-1.5 max-w-xs">
                      Supports PNG, JPG, or WEBP. High-resolution photos deliver superior mask pixel borders.
                    </p>
                    <button
                      type="button"
                      className="mt-5 px-4 py-2 bg-gray-900 hover:bg-gray-850 border border-gray-800 rounded-lg text-xs font-medium text-gray-300 transition"
                    >
                      Browse Files
                    </button>
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between p-3.5 bg-gray-950/80 rounded-lg border border-gray-850">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-950 text-emerald-400 rounded-lg border border-emerald-900/50">
                          <FileImage className="h-4 w-4" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-medium text-gray-300 truncate max-w-[180px] sm:max-w-xs">
                            {fileName}
                          </p>
                           <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                            Original Asset
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSourceImageUri(null);
                          setGreenScreenImageUri(null);
                          setIsolatedImageUri(null);
                          setAnalysisReport(null);
                          aiAlphaMaskRef.current = null;
                          setIsModelLoaded(false);
                          setUndoStack([]);
                          setBrushMode("none");
                        }}
                        className="p-1 px-2.5 rounded-md hover:bg-red-950/30 text-gray-500 hover:text-red-400 transition text-[11px] font-mono border border-transparent hover:border-red-900/40"
                      >
                        Clear
                      </button>
                    </div>

                    {/* Step 1 Report display */}
                    {isAnalyzing ? (
                      <div className="p-4 bg-gray-950 border border-gray-800 rounded-lg flex items-center justify-center gap-3">
                        <RefreshCw className="h-4 w-4 text-emerald-400 animate-spin" />
                        <span className="text-xs text-gray-400 font-mono">
                          Analyzing foreground subject details...
                        </span>
                      </div>
                    ) : (
                      analysisReport && (
                        <div className="p-4 bg-gray-950/60 border border-gray-850 rounded-lg flex flex-col gap-3">
                          <div className="flex justify-between items-center pb-2 border-b border-gray-850">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                              Step 1: AI Subject Vector Analysis
                            </span>
                            <div className="flex items-center gap-1.5 font-mono text-[9px] text-gray-500 bg-gray-900/50 px-2 py-0.5 rounded border border-gray-800">
                              <CheckCircle className="h-3 w-3 text-emerald-500" />
                              <span>Groq Llama 4</span>
                            </div>
                          </div>

                          {analysisReport.autoTunedSliders && (
                            <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-lg flex flex-col gap-2">
                              <div className="flex items-center justify-between gap-3 text-[11px] text-emerald-400">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
                                  <span>
                                    <strong>Smart Auto-Keying:</strong> Isolated subject and auto-tuned sliders.
                                  </span>
                                </div>
                                <div
                                  className="w-4 h-4 rounded-full border border-emerald-500/20 shadow-inner shrink-0"
                                  style={{ backgroundColor: analysisReport.detectedBgColorHex }}
                                  title={`Detected Dominant Background: ${analysisReport.detectedBgColorHex}`}
                                />
                              </div>
                              <div className="flex items-center justify-between border-t border-emerald-900/20 pt-2 mt-1.5">
                                <span className="text-[10px] text-gray-400 font-mono">AI Bounding Box Clean</span>
                                <button
                                  type="button"
                                  onClick={() => setUseBoundingBox(!useBoundingBox)}
                                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    useBoundingBox ? "bg-emerald-600" : "bg-gray-800"
                                  }`}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                      useBoundingBox ? "translate-x-4" : "translate-x-0"
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3 text-xs leading-relaxed">
                            <div>
                              <p className="text-[10px] font-mono text-gray-500">Subject Name:</p>
                              <p className="font-semibold text-gray-200 mt-0.5">{analysisReport.subjectName}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-mono text-gray-500">Outline Complexity:</p>
                              <span
                                className={`inline-block px-2 py-0.5 rounded-[4px] text-[10px] font-mono mt-1 ${
                                  analysisReport.outlineComplexity === "high"
                                    ? "bg-red-950 border border-red-900/50 text-red-400"
                                    : analysisReport.outlineComplexity === "medium"
                                    ? "bg-amber-950 border border-amber-900/50 text-amber-500"
                                    : "bg-emerald-950 border border-emerald-900/50 text-emerald-400"
                                }`}
                              >
                                {analysisReport.outlineComplexity.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-mono text-gray-500">Color Edge Bleed Risks:</p>
                            <p className="text-xs text-gray-300 mt-1 bg-gray-900/40 p-2.5 rounded border border-gray-850/60 leading-relaxed">
                              {analysisReport.colorAnalysis}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-mono text-gray-500">Sub-surface Extraction Advice:</p>
                            <p className="text-xs text-gray-400 italic mt-1 font-mono text-[11px]">
                              "{analysisReport.segmentationAdvice}"
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {sourceImageUri && (
              <>
                {/* Step 2 Transformation Panel */}
                <div className="bg-gray-900 border border-gray-850 rounded-xl overflow-hidden shadow-xl">
                  <div className="px-5 py-3.5 bg-gray-955 border-b border-gray-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Sliders className="h-4.5 w-4.5 text-emerald-400" />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300">
                        {segmentationMode === "ai"
                          ? "Step 2: AI Subject Segmentation"
                          : "Step 2: Green Screen Masking"}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col gap-4">
                    {/* Premium 2-Way Mode Selector Switch */}
                    <div className="flex flex-col gap-1.5 bg-gray-955/65 p-3 rounded-xl border border-gray-850">
                      <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Segmentation Mode</span>
                      <div className="flex gap-1.5 mt-1 bg-gray-900 p-1 rounded-xl border border-gray-805">
                        <button
                          type="button"
                          onClick={() => {
                            setSegmentationMode("chroma");
                            setErosionSize(1);
                            setFeatherRadius(1);
                            setDilationSize(0);
                          }}
                          className={`flex-1 py-1.5 px-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1 ${
                            segmentationMode === "chroma"
                              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/10 scale-[1.01]"
                              : "text-gray-400 hover:text-gray-205 hover:bg-gray-800/30"
                          }`}
                        >
                          <Droplet className="h-3 w-3 text-emerald-300 shrink-0" />
                          <span>Chroma Key</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSegmentationMode("ai");
                            setErosionSize(0);
                            setFeatherRadius(0);
                            setDilationSize(0);
                          }}
                          className={`flex-1 py-1.5 px-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1 ${
                            segmentationMode === "ai"
                              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/10 scale-[1.01]"
                              : "text-gray-400 hover:text-gray-205 hover:bg-gray-800/30"
                          }`}
                        >
                          <Sparkles className="h-3 w-3 text-emerald-300 shrink-0" />
                          <span>AI Magic</span>
                        </button>
                      </div>
                    </div>

                    {segmentationMode === "ai" && (
                      <div className="p-3.5 bg-gray-950/45 rounded-xl border border-gray-850 text-xs font-mono flex flex-col gap-2.5">
                        <div className="flex items-center justify-between text-gray-400">
                          <span>Model Status:</span>
                          {isModelLoading ? (
                            <span className="text-amber-500 flex items-center gap-1.5 font-bold animate-pulse">
                              <RefreshCw className="h-3 w-3 animate-spin text-amber-500" />
                              <span>Loading (2.7 MB)...</span>
                            </span>
                          ) : isModelLoaded ? (
                            <span className="text-emerald-400 flex items-center gap-1 font-bold">
                              <CheckCircle className="h-3 w-3 text-emerald-400" />
                              <span>Active (GPU accelerated)</span>
                            </span>
                          ) : modelError ? (
                            <span className="text-red-400 flex items-center gap-1 font-bold">
                              <AlertTriangle className="h-3 w-3 text-red-500 animate-bounce" />
                              <span>Error: {modelError}</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={preloadImglyModel}
                              className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
                            >
                              Pre-Load Model
                            </button>
                          )}
                        </div>
                        <div className="flex items-center justify-between border-t border-gray-850/60 pt-2.5">
                          <div className="flex flex-col">
                            <span className="text-gray-350 font-semibold">Invert Mask Direction</span>
                            <span className="text-[9px] text-gray-550 font-mono mt-0.5">Toggle subject vs background extraction</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsInvertedMask(!isInvertedMask)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isInvertedMask ? "bg-emerald-600" : "bg-gray-800"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                isInvertedMask ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                        
                        {/* Intelligent Recommendation Banner */}
                        <div className="border-t border-gray-850/60 pt-2.5 flex flex-col gap-1 text-[10px] leading-relaxed text-gray-400">
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold font-mono uppercase tracking-wider">
                            <Sparkles className="h-3 w-3 shrink-0 text-emerald-400" />
                            <span>AI Pro-Tip</span>
                          </div>
                          <p>
                            For cartoon illustrations, graphics, or vectors on solid color backdrops, the <strong className="text-gray-250 font-semibold">Chroma Key + Connected BFS (Smart Mask)</strong> mode is highly recommended. It delivers vector-sharp edges and preserves internal design colors, whereas the neural AI Segmenter is optimized for real-life human photo portraits.
                          </p>
                        </div>
                        
                        {/* Manual Mask Refinement Brush */}
                        <div className="border-t border-gray-850/60 pt-3 flex flex-col gap-3">
                          <div className="flex justify-between items-center text-[10px]">
                            <div className="flex items-center gap-1.5 text-amber-500 font-bold font-mono uppercase tracking-wider">
                              <Brush className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                              <span>Manual Mask Refinement</span>
                            </div>
                            {undoStack.length > 0 && (
                              <button
                                type="button"
                                onClick={handleUndo}
                                className="px-2 py-0.5 rounded bg-gray-850 hover:bg-gray-800 text-amber-400 font-mono text-[9px] font-bold border border-gray-750 transition cursor-pointer flex items-center gap-1 shadow"
                              >
                                <RotateCcw className="h-2.5 w-2.5 text-amber-400" />
                                <span>Undo ({undoStack.length})</span>
                              </button>
                            )}
                          </div>
                          
                          <div className="flex gap-1.5 bg-gray-900 p-0.5 rounded-lg border border-gray-800">
                            <button
                              type="button"
                              onClick={() => {
                                setBrushMode("none");
                                setIsDrawing(false);
                              }}
                              className={`flex-1 py-1 rounded-md text-[10px] font-semibold transition cursor-pointer ${
                                brushMode === "none" ? "bg-gray-800 text-white shadow" : "text-gray-400 hover:text-gray-250"
                              }`}
                            >
                              Off
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setBrushMode("restore");
                                setIsDrawing(false);
                              }}
                              className={`flex-1 py-1 rounded-md text-[10px] font-semibold transition cursor-pointer flex items-center justify-center gap-1 ${
                                brushMode === "restore" ? "bg-emerald-600 text-white shadow" : "text-gray-400 hover:text-gray-250"
                              }`}
                            >
                              <Plus className="h-2.5 w-2.5" />
                              Restore
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setBrushMode("erase");
                                setIsDrawing(false);
                              }}
                              className={`flex-1 py-1 rounded-md text-[10px] font-semibold transition cursor-pointer flex items-center justify-center gap-1 ${
                                brushMode === "erase" ? "bg-red-950/60 text-red-400 border border-red-900/50 shadow" : "text-gray-400 hover:text-gray-250"
                              }`}
                            >
                              <Minus className="h-2.5 w-2.5" />
                              Erase
                            </button>
                          </div>

                          {brushMode !== "none" && (
                            <div className="flex flex-col gap-1.5 bg-gray-900/40 p-2.5 rounded-lg border border-gray-850">
                              <div className="flex justify-between items-center text-[10px] text-gray-400">
                                <span>Brush Size:</span>
                                <span className="font-mono text-amber-500 font-bold">{brushSize}px</span>
                              </div>
                              <input
                                type="range"
                                min="5"
                                max="100"
                                step="5"
                                value={brushSize}
                                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                className="w-full accent-amber-500 bg-gray-955 h-1 cursor-ew-resize"
                              />
                              <p className="text-[9px] text-gray-500 leading-relaxed mt-1">
                                Click and drag directly on any of the workspace canvases above to paint corrections onto your image mask.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {segmentationMode === "chroma" && (
                      <div className="grid grid-cols-2 gap-3 bg-gray-950/60 p-3 rounded-xl border border-gray-850">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-mono text-gray-500 uppercase">Background Type</span>
                        <div className="flex gap-1 mt-1 bg-gray-900 p-0.5 rounded-lg border border-gray-800">
                          <button
                            type="button"
                            onClick={() => setIsCheckerboard(false)}
                            className={`flex-1 py-1 rounded-md text-[10px] font-semibold transition ${
                              !isCheckerboard ? "bg-emerald-600 text-white shadow" : "text-gray-405 hover:text-gray-200"
                            }`}
                          >
                            Solid
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsCheckerboard(true)}
                            className={`flex-1 py-1 rounded-md text-[10px] font-semibold transition ${
                              isCheckerboard ? "bg-emerald-600 text-white shadow" : "text-gray-405 hover:text-gray-200"
                            }`}
                          >
                            Grid
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-mono text-gray-500 uppercase">Smart Mask</span>
                        <button
                          type="button"
                          onClick={() => setUseConnectivity(!useConnectivity)}
                          className={`w-full py-1.5 mt-1 rounded-lg text-[10px] font-semibold border transition flex items-center justify-center gap-1 ${
                            useConnectivity
                              ? "bg-emerald-950 border-emerald-900 text-emerald-400 shadow-inner"
                              : "bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200"
                          }`}
                        >
                          <CheckCircle className={`h-3 w-3 ${useConnectivity ? "text-emerald-400" : "text-gray-500"}`} />
                          <span>{useConnectivity ? "Connected BFS" : "Global Key"}</span>
                        </button>
                      </div>
                    </div>)}

                    {/* Safety Backdrop Color Selector */}
                    <div className="flex flex-col gap-1.5 bg-gray-955/65 p-3 rounded-xl border border-gray-850">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-gray-500 uppercase">Safety Backdrop Color</span>
                        <span className="text-[9px] font-mono text-gray-500 bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                          Auto-Detected Safe Option
                        </span>
                      </div>
                      <div className="flex gap-2 mt-1">
                        {CHROMA_OPTIONS.map((opt) => (
                          <button
                            key={opt.name}
                            type="button"
                            onClick={() => {
                              setChromaColorName(opt.name);
                              setHueMin(opt.hueRange.min);
                              setHueMax(opt.hueRange.max);
                            }}
                            className={`flex-1 py-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 ${
                              chromaColorName === opt.name
                                ? "bg-emerald-950/45 border-emerald-500/40 text-emerald-400 font-bold shadow-md shadow-emerald-500/5 scale-[1.01]"
                                : "bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-250"
                            }`}
                          >
                            <div
                              className="w-2.5 h-2.5 rounded-full border border-gray-700 shadow-inner shrink-0 animate-pulse"
                              style={{ backgroundColor: opt.hex }}
                            />
                            <span>{opt.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {segmentationMode === "chroma" && (
                      <>
                        <div className="bg-gray-950 p-4 rounded-xl border border-gray-850 flex flex-col gap-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-gray-350">
                              {isCheckerboard ? "Checkerboard Grid Colors:" : "Target Core Background Color:"}
                            </span>
                            {!isCheckerboard && (
                              <button
                                onClick={() => setDropperActive(dropperActive === "color1" ? null : "color1")}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition ${
                                  dropperActive === "color1"
                                    ? "bg-amber-600 border-amber-500 text-white animate-pulse"
                                    : "bg-gray-900 hover:bg-gray-855 border-gray-800 text-gray-300"
                                }`}
                              >
                                <Droplet className="h-3 w-3" />
                                <span>{dropperActive === "color1" ? "Click on Canvas..." : "Color Dropper"}</span>
                              </button>
                            )}
                          </div>

                          {isCheckerboard ? (
                            <div className="grid grid-cols-2 gap-3 mt-1">
                              {/* Square 1 Color block */}
                              <div className="flex items-center justify-between p-2 bg-gray-900/60 rounded-lg border border-gray-850">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-7 h-7 rounded-md border border-gray-700 shadow-inner shrink-0"
                                    style={{ backgroundColor: sampledColorHex }}
                                  />
                                  <div className="text-[10px]">
                                    <p className="font-mono font-bold text-gray-300">{sampledColorHex.toUpperCase()}</p>
                                    <p className="text-[9px] text-gray-550 font-mono mt-0.5">Square 1</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setDropperActive(dropperActive === "color1" ? null : "color1")}
                                  className={`p-1.5 rounded-md border transition ${
                                    dropperActive === "color1"
                                      ? "bg-amber-600 border-amber-500 text-white animate-pulse"
                                      : "bg-gray-950 hover:bg-gray-850 border-gray-800 text-gray-400 hover:text-gray-205"
                                  }`}
                                  title="Sample Square 1 color from canvas"
                                >
                                  <Droplet className="h-3 w-3" />
                                </button>
                              </div>

                              {/* Square 2 Color block */}
                              <div className="flex items-center justify-between p-2 bg-gray-900/60 rounded-lg border border-gray-850">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-7 h-7 rounded-md border border-gray-700 shadow-inner shrink-0"
                                    style={{ backgroundColor: sampledColor2Hex }}
                                  />
                                  <div className="text-[10px]">
                                    <p className="font-mono font-bold text-gray-305">{sampledColor2Hex.toUpperCase()}</p>
                                    <p className="text-[9px] text-gray-550 font-mono mt-0.5">Square 2</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setDropperActive(dropperActive === "color2" ? null : "color2")}
                                  className={`p-1.5 rounded-md border transition ${
                                    dropperActive === "color2"
                                      ? "bg-amber-600 border-amber-500 text-white animate-pulse"
                                      : "bg-gray-955 hover:bg-gray-850 border-gray-800 text-gray-400 hover:text-gray-205"
                                  }`}
                                  title="Sample Square 2 color from canvas"
                                >
                                  <Droplet className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 mt-1.5">
                              <div
                                className="w-10 h-10 rounded-lg border border-gray-750 shadow-inner shrink-0"
                                style={{ backgroundColor: sampledColorHex }}
                              />
                              <div className="text-xs">
                                <p className="font-mono text-gray-305">{sampledColorHex.toUpperCase()}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  RGB: {sampledColor.r}, {sampledColor.g}, {sampledColor.b}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-medium text-gray-400">Tolerance Sensitivity</span>
                            <span className="font-mono text-emerald-400">{(similarity * 100).toFixed(similarity < 0.1 ? 1 : 0)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.05"
                            max="1"
                            step="0.005"
                            value={Math.sqrt(similarity / 0.8)}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setSimilarity(val * val * 0.8);
                            }}
                            className="w-full accent-emerald-500 bg-gray-950 border-transparent rounded h-1 cursor-ew-resize"
                          />
                          <p className="text-[10px] text-gray-550">
                            Controls the background replacement area range. Higher values expand green coverage. Lower values prevent subject cropping.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Step 3 Alpha Refiner Properties Card */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
                  <div className="px-5 py-3.5 bg-gray-950 border-b border-gray-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4.5 w-4.5 text-emerald-400" />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300">
                        {segmentationMode === "ai"
                          ? "Step 3: AI Edge Refiner & Morphological Controls"
                          : "Step 3: HSV Alpha Key Filter"}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col gap-5">
                    {segmentationMode === "chroma" && (
                      <div className="flex flex-col gap-2 bg-gray-950/40 p-3.5 rounded-lg border border-gray-880">
                        <span className="text-[11px] font-mono font-bold text-gray-400 uppercase tracking-wide">
                          HSV {chromaColorName}-Key Bounds ({CHROMA_OPTIONS.find(c => c.name === chromaColorName)?.hex || "#00ff00"} targets)
                        </span>

                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between text-[11px] font-mono">
                              <span className="text-gray-500">Hue Min</span>
                              <span className="text-emerald-400">{hueMin}</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="180"
                              value={hueMin}
                              onChange={(e) => setHueMin(parseInt(e.target.value))}
                              className="w-full accent-emerald-500 bg-gray-900 h-1 cursor-ew-resize"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between text-[11px] font-mono">
                              <span className="text-gray-500">Hue Max</span>
                              <span className="text-emerald-400">{hueMax}</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="180"
                              value={hueMax}
                              onChange={(e) => setHueMax(parseInt(e.target.value))}
                              className="w-full accent-emerald-500 bg-gray-900 h-1 cursor-ew-resize"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-1">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between text-[11px] font-mono">
                              <span className="text-gray-500">Sat Min</span>
                              <span className="text-emerald-400">{satMin}</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="255"
                              value={satMin}
                              onChange={(e) => setSatMin(parseInt(e.target.value))}
                              className="w-full accent-emerald-500 bg-gray-900 h-1 cursor-ew-resize"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between text-[11px] font-mono">
                              <span className="text-gray-500">Sat Max</span>
                              <span className="text-emerald-400">{satMax}</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="255"
                              value={satMax}
                              onChange={(e) => setSatMax(parseInt(e.target.value))}
                              className="w-full accent-emerald-500 bg-gray-900 h-1 cursor-ew-resize"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Edge fine-turning Morphological tweaking */}
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-gray-300">Erosion (Edge Shrinkage)</span>
                            <span className="text-[10px] text-gray-500 font-mono">cv2.erode</span>
                          </div>
                          <span className="font-mono text-amber-500">{erosionSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          step="1"
                          value={erosionSize}
                          onChange={(e) => setErosionSize(parseInt(e.target.value))}
                          className="w-full accent-amber-500 bg-gray-955 h-1 cursor-ew-resize"
                        />
                        <p className="text-[10px] text-gray-550">
                          Eliminates color boundaries, micro fringes, or green halo bleed-through.
                        </p>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-gray-300">Dilation (Core Expansion)</span>
                            <span className="text-[10px] text-gray-500 font-mono">cv2.dilate</span>
                          </div>
                          <span className="font-mono text-emerald-400">{dilationSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          step="1"
                          value={dilationSize}
                          onChange={(e) => setDilationSize(parseInt(e.target.value))}
                          className="w-full accent-emerald-500 bg-gray-955 h-1 cursor-ew-resize"
                        />
                        <p className="text-[10px] text-gray-550">
                          Fills interior mask voids and expands subject core outline parameters.
                        </p>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-gray-300">Feathering Gaussian Radius</span>
                            <span className="text-[10px] text-gray-500 font-mono">GaussianBlur</span>
                          </div>
                          <span className="font-mono text-blue-400">{featherRadius}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          step="1"
                          value={featherRadius}
                          onChange={(e) => setFeatherRadius(parseInt(e.target.value))}
                          className="w-full accent-blue-500 bg-gray-955 h-1 cursor-ew-resize"
                        />
                        <p className="text-[10px] text-gray-550">
                          Creates premium soft, natural transparent margins (excellent for hair/fibers).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* RIGHT AREA: Dual View Canvas, Previews, Script outputs (xl:7 cols) */}
          <div className="xl:col-span-7 flex flex-col gap-6">
            {sourceImageUri ? (
              <>
                {/* View Workboards Display */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
                  {/* Tab selectors */}
                  <div className="px-5 py-3 bg-gray-950 border-b border-gray-800 flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setActiveTab("original")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                          activeTab === "original"
                            ? "bg-gray-855 text-white border border-gray-700"
                            : "text-gray-400 hover:text-gray-200"
                        }`}
                      >
                        1. Original
                      </button>
                      <button
                        onClick={() => setActiveTab("greenscreen")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                          activeTab === "greenscreen"
                            ? "bg-emerald-950 border border-emerald-900 text-emerald-400"
                            : "text-gray-400 hover:text-gray-200"
                        }`}
                      >
                        2. Green Mask
                      </button>
                      <button
                        onClick={() => setActiveTab("isolated")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                          activeTab === "isolated"
                            ? "bg-blue-950 border border-blue-900 text-blue-400"
                            : "text-gray-400 hover:text-gray-200"
                        }`}
                      >
                        3. Isolated Asset
                      </button>
                      <button
                        onClick={() => {
                          setIsZoomLensActive(!isZoomLensActive);
                          setZoomLensPos(null);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition flex items-center gap-1.5 ${
                          isZoomLensActive
                            ? "bg-teal-950 border border-teal-900 text-teal-400"
                            : "text-gray-400 hover:text-gray-200"
                        }`}
                        title="Toggle 100% HD zoom magnifier lens to inspect pixel-level edges"
                      >
                        <Search className="h-3.5 w-3.5" />
                        <span>Inspect HD Edges</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {activeTab === "greenscreen" && (
                        <button
                          onClick={() => downloadAsset("greenscreen")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition text-xs font-medium"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Save Green Mask</span>
                        </button>
                      )}
                      {activeTab === "isolated" && (
                        <div className="flex flex-wrap items-center gap-3">
                          {/* Background Style Selector control group */}
                          <div className="flex items-center gap-1.5 bg-gray-900 p-1 rounded-xl border border-gray-800">
                            <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-gray-400 px-1.5">BG:</span>
                            
                            <button
                              type="button"
                              onClick={() => setSelectedBgColor("transparent")}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                selectedBgColor === "transparent"
                                  ? "bg-blue-600 text-white shadow-md font-bold"
                                  : "text-gray-400 hover:text-gray-200"
                              }`}
                            >
                              Transparent
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => setSelectedBgColor("#ffffff")}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                selectedBgColor === "#ffffff"
                                  ? "bg-gray-100 text-gray-950 shadow-md font-bold"
                                  : "text-gray-400 hover:text-gray-205"
                              }`}
                            >
                              White
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => setSelectedBgColor("#000000")}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                selectedBgColor === "#000000"
                                  ? "bg-gray-950 text-gray-100 border border-gray-850 shadow-md font-bold"
                                  : "text-gray-400 hover:text-gray-205"
                              }`}
                            >
                              Black
                            </button>

                            {/* Hex Picker & input */}
                            <div className="flex items-center gap-1 pl-1 border-l border-gray-800">
                              <input
                                type="color"
                                value={customBgColor}
                                onChange={(e) => {
                                  setCustomBgColor(e.target.value);
                                  setSelectedBgColor(e.target.value);
                                }}
                                className="w-5 h-5 rounded-md cursor-pointer border border-gray-700 bg-transparent shrink-0"
                                title="Choose Custom Hex Color"
                              />
                              <input
                                type="text"
                                value={customBgColor}
                                onChange={(e) => {
                                  let val = e.target.value;
                                  if (!val.startsWith("#")) val = "#" + val;
                                  setCustomBgColor(val);
                                  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                                    setSelectedBgColor(val);
                                  }
                                }}
                                className="w-14 bg-gray-950 border border-gray-800 rounded px-1 py-0.5 text-[9px] font-mono text-center focus:outline-none focus:border-blue-500"
                                placeholder="#FFFFFF"
                              />
                            </div>
                          </div>

                          {/* Gating Status Badge */}
                          {profile?.is_pro ? (
                            <span className="px-2 py-1 rounded-lg bg-emerald-950 border border-emerald-900 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                              PRO
                            </span>
                          ) : (
                            (profile?.solid_bg_trials_remaining ?? 3) > 0 ? (
                              <span className="px-2 py-1 rounded-lg bg-amber-950/60 border border-amber-900/60 text-amber-400 text-[10px] font-mono font-bold">
                                {profile?.solid_bg_trials_remaining ?? 3}/3 Free BG Trials
                              </span>
                            ) : (
                              <span 
                                onClick={onOpenPricing}
                                className="px-2 py-1 rounded-lg bg-red-950/60 border border-red-900/60 text-red-400 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer hover:bg-red-900/80 transition animate-pulse"
                                title="Solid backgrounds locked. Upgrade to Pro!"
                              >
                                <span>🔒</span>
                                <span className="uppercase tracking-wider font-bold">PRO Required</span>
                              </span>
                            )
                          )}

                          {/* Save Isolated Asset Button */}
                          <button
                            onClick={() => downloadAsset("isolated")}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition text-xs font-medium shadow-lg shadow-blue-900/10 cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Save Isolated Asset</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Viewport Canvas Frame */}
                  <div className="p-6 bg-gray-955 flex justify-center items-center overflow-hidden min-h-[360px] max-h-[580px] border-b border-gray-800 relative">
                    <div
                      className={`absolute inset-0 select-none pointer-events-none opacity-40 ${
                        activeTab === "isolated" ? "bg-[linear-gradient(45deg,#1c1e22_25%,transparent_25%),linear-gradient(-45deg,#1c1e22_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1c1e22_75%),linear-gradient(-45deg,transparent_75%,#1c1e22_75%)] bg-[size:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]" : "bg-gray-950"
                      }`}
                    />

                    {errorMessage && (
                      <div className="absolute top-4 left-4 right-4 bg-red-950 border border-red-900 text-red-400 px-4 py-3 rounded-lg text-xs flex items-center gap-2.5 z-10 shadow-xl">
                        <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <img
                      ref={originalImageRef}
                      src={previewImageUri || sourceImageUri || ""}
                      onLoad={handleOriginalImageLoad}
                      className="hidden"
                      crossOrigin="anonymous"
                      alt="original state mapping tool"
                    />

                    <div
                      className="relative max-w-full max-h-full z-1"
                      style={getBrushCursorStyle()}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleMouseUp}
                    >
                      <canvas
                        ref={originalCanvasRef}
                        onClick={handleOriginalCanvasClick}
                        className={`max-w-full max-h-[480px] rounded-lg border border-gray-800 object-contain shadow-inner ${
                          activeTab === "original" ? "block" : "hidden"
                        } ${dropperActive ? "cursor-crosshair ring-2 ring-amber-500" : ""}`}
                      />
                      <canvas
                        ref={greenScreenCanvasRef}
                        className={`max-w-full max-h-[480px] rounded-lg border border-gray-800 object-contain shadow-inner ${
                          activeTab === "greenscreen" ? "block font-bold text-green-500" : "hidden"
                        }`}
                      />
                      <canvas
                        ref={isolatedCanvasRef}
                        className={`max-w-full max-h-[480px] rounded-lg border border-transparent object-contain shadow-2xl ${
                          activeTab === "isolated" ? "block" : "hidden"
                        }`}
                      />

                      {/* Interactive 100% HD Zoom Lens Overlay */}
                      {isZoomLensActive && zoomLensPos && (
                        <div
                          className="pointer-events-none fixed z-50 rounded-full border-2 border-[#00A896] shadow-[0_0_15px_rgba(0,168,150,0.6)] overflow-hidden bg-gray-950 bg-[linear-gradient(45deg,#1c1e22_25%,transparent_25%),linear-gradient(-45deg,#1c1e22_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1c1e22_75%),linear-gradient(-45deg,transparent_75%,#1c1e22_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px]"
                          style={{
                            width: "200px",
                            height: "200px",
                            left: `${zoomLensPos.x - 100}px`,
                            top: `${zoomLensPos.y - 100}px`,
                          }}
                        >
                          <canvas
                            ref={lensCanvasRef}
                            width={200}
                            height={200}
                            className="w-full h-full"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Premium Glassmorphic Toast Notification */}
                  {toastMessage && (
                    <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-gray-900/90 border border-gray-800 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${toastMessage.type === "success" ? "bg-emerald-400 animate-pulse" : "bg-blue-400"}`} />
                      <span className="text-xs font-mono text-gray-200">{toastMessage.text}</span>
                    </div>
                  )}

                  {/* Bottom detail status margin lines */}
                  <div className="p-4 bg-gray-900/60 flex items-center justify-between text-[11px] font-mono text-gray-400">
                    <div className="flex gap-4">
                      <span>
                        Format: <span className="text-gray-200">PNG</span>
                      </span>
                      <span>
                        Mode:{" "}
                        <span className="text-emerald-400 font-bold uppercase">
                          {activeTab === "original"
                            ? "Analyst Target"
                            : activeTab === "greenscreen"
                            ? "Green Chroma Mask"
                            : "Isolated Transparency Channel"}
                        </span>
                      </span>
                    </div>
                    <span>Channel: RGBA (8-bit)</span>
                  </div>
                </div>


              </>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center text-gray-500 flex flex-col items-center justify-center min-h-[460px] h-full shadow-inner bg-gradient-to-b from-gray-900 to-gray-950">
                <div className="p-4 bg-gray-950 border border-gray-850 rounded-2xl mb-4 text-gray-650">
                  <Sliders className="h-10 w-10 text-emerald-500/30" />
                </div>
                <h3 className="text-sm font-semibold text-gray-300">No Image Uploaded</h3>
                <p className="text-xs text-gray-500 mt-2 max-w-sm leading-relaxed">
                  Upload a product image, human portrait, or visual asset in the Left Terminal to initialize the precise pixel-level background isolation pipeline.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      ) : (
        <div className="flex flex-col gap-6 w-full animate-fade-in">
          {/* BULK MODE WORKSPACE */}
          {bulkItems.length === 0 ? (
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => {
                e.preventDefault();
                const files = e.dataTransfer.files;
                if (files) addBulkFiles(Array.from(files));
              }}
              className="border-2 border-dashed border-gray-800 hover:border-emerald-500/50 bg-gray-950/40 rounded-2xl p-16 text-center transition-all duration-500 flex flex-col items-center justify-center cursor-pointer group shadow-2xl relative overflow-hidden min-h-[380px]"
              onClick={() => document.getElementById("bulk-file-upload")?.click()}
            >
              {/* Background gradient accents */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
              
              <div className="p-5 rounded-2xl bg-gray-900 border border-gray-800 group-hover:scale-110 group-hover:border-emerald-500/30 group-hover:shadow-lg group-hover:shadow-emerald-500/5 transition duration-500 text-gray-400 group-hover:text-emerald-400 mb-6 z-10">
                <Upload className="h-8 w-8" />
              </div>
              <h3 className="text-sm font-bold text-gray-200 z-10 tracking-tight">Upload a Batch of Images</h3>
              <p className="text-xs text-gray-500 mt-2 max-w-xs z-10 leading-relaxed">
                Drag & drop multiple files, or click to browse. Supports bulk PNG, JPG, and WEBP. Backgrounds are isolated in sequence.
              </p>
              
              <button
                type="button"
                className="mt-6 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg hover:shadow-emerald-500/10 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all duration-300 z-10 scale-[1.02]"
              >
                Browse Files
              </button>
              <input
                id="bulk-file-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleBulkFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Master Actions and Progress Bar Card */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
                
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 z-10 relative">
                  {/* Left Column: Progress Info */}
                  <div className="flex-1 w-full">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-emerald-400 animate-pulse" />
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-200">
                          Bulk Processing Pipeline
                        </span>
                      </div>
                      <span className="text-xs font-mono text-gray-405 bg-gray-950 px-3 py-1 rounded-md border border-gray-800">
                        {bulkItems.filter((i) => i.status === "complete").length} / {bulkItems.length} Isolated
                      </span>
                    </div>

                    {/* Master Progress Bar */}
                    {(() => {
                      const completed = bulkItems.filter((i) => i.status === "complete").length;
                      const failed = bulkItems.filter((i) => i.status === "failed").length;
                      const pct = Math.round(((completed + failed) / bulkItems.length) * 100) || 0;
                      return (
                        <div className="w-full">
                          <div className="w-full h-3 bg-gray-950 rounded-full overflow-hidden border border-gray-800 p-[2px]">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500 ease-out shadow-inner"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] font-mono text-gray-500 mt-2">
                            <span>Pipeline status: {bulkQueueActive ? "Processing Queue..." : pct === 100 ? "All Complete!" : "Ready"}</span>
                            <span>{pct}% Overall Progress</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Right Column: Action Buttons */}
                  <div className="flex flex-wrap gap-3 w-full xl:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => document.getElementById("bulk-file-add")?.click()}
                      className="px-4 py-2.5 bg-gray-950 hover:bg-gray-850 border border-gray-800 text-gray-300 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4 text-emerald-400" />
                      <span>Add More</span>
                    </button>
                    <input
                      id="bulk-file-add"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleBulkFileChange}
                      className="hidden"
                    />

                    <button
                      type="button"
                      disabled={bulkQueueActive || bulkItems.filter(i => i.status === "queued").length === 0}
                      onClick={() => setBulkQueueActive(true)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
                        bulkQueueActive || bulkItems.filter(i => i.status === "queued").length === 0
                          ? "bg-gray-800 text-gray-500 border border-transparent cursor-not-allowed"
                          : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/10 hover:scale-[1.02] cursor-pointer"
                      }`}
                    >
                      <Play className="h-4 w-4" />
                      <span>{bulkQueueActive ? "Running..." : "Process Batch"}</span>
                    </button>

                    <button
                      type="button"
                      disabled={bulkItems.filter((i) => i.status === "complete").length === 0}
                      onClick={downloadAllBulkItems}
                      className={`px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
                        bulkItems.filter((i) => i.status === "complete").length === 0
                          ? "bg-gray-800 text-gray-500 border border-transparent cursor-not-allowed"
                          : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/10 hover:scale-[1.02] cursor-pointer"
                      }`}
                    >
                      <Download className="h-4 w-4" />
                      <span>Download All</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBulkItems([]);
                        setBulkQueueActive(false);
                      }}
                      className="px-4 py-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 hover:border-red-900/50 text-red-400 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Clear All</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid of Bulk Image Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {bulkItems.map((item) => {
                  const isCompleted = item.status === "complete";
                  const isProcessing = item.status === "analyzing" || item.status === "isolating";
                  const isFailed = item.status === "failed";
                  
                  return (
                    <div
                      key={item.id}
                      className={`bg-gray-900 border rounded-2xl overflow-hidden shadow-xl flex flex-col group/card relative transition-all duration-500 ${
                        isCompleted
                          ? "border-emerald-500/30 hover:border-emerald-500/60 shadow-emerald-950/5"
                          : isFailed
                          ? "border-red-900/40 hover:border-red-900/60"
                          : isProcessing
                          ? "border-emerald-500/20"
                          : "border-gray-850 hover:border-gray-700"
                      }`}
                    >
                      {/* Individual Clear Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setBulkItems((prev) => prev.filter((i) => i.id !== item.id));
                        }}
                        className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-gray-950/80 hover:bg-red-950/40 text-gray-500 hover:text-red-400 border border-gray-800 hover:border-red-900/30 transition duration-300 z-20"
                        title="Remove from queue"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>

                      {/* Thumbnail Container */}
                      <div className="aspect-[4/3] bg-gray-950 relative overflow-hidden flex items-center justify-center border-b border-gray-850 select-none group/thumb">
                        {/* Checkerboard overlay only for completed assets */}
                        <div
                        className={`absolute inset-0 select-none pointer-events-none opacity-40 transition-opacity duration-300 ${
                            isCompleted ? "bg-[linear-gradient(45deg,#15171a_25%,transparent_25%),linear-gradient(-45deg,#15171a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#15171a_75%),linear-gradient(-45deg,transparent_75%,#15171a_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px]" : "bg-gray-950"
                          }`}
                        />

                        {activeBulkDropper?.itemId === item.id ? (
                          // Under dropper, show original source image only with crosshair
                          <img
                            src={item.sourceUri}
                            onClick={(e) => handleBulkThumbnailClick(e, item)}
                            className="max-w-full max-h-full object-contain p-2 z-30 cursor-crosshair ring-2 ring-amber-500 animate-pulse"
                            alt="dropper source thumbnail"
                          />
                        ) : isCompleted && item.isolatedUri ? (
                          <>
                            {/* Hover Comparison effect */}
                            <img
                              src={item.isolatedUri}
                              className="max-w-full max-h-full object-contain p-2 z-10 transition-transform duration-500 group-hover/thumb:scale-105"
                              alt="isolated output"
                            />
                            {/* Original overlay on hover */}
                            <img
                              src={item.sourceUri}
                              className="absolute inset-0 w-full h-full object-contain p-2 opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-500 z-15 bg-gray-950 pointer-events-none"
                              alt="original compared"
                            />
                            <div className="absolute bottom-2 left-2 z-20 px-2 py-0.5 bg-gray-950/80 backdrop-blur-md rounded-md text-[9px] font-mono text-gray-400 border border-gray-800 transition duration-300 pointer-events-none group-hover/thumb:opacity-0">
                              Hover to Compare
                            </div>
                          </>
                        ) : (
                          <img
                            src={item.sourceUri}
                            className={`max-w-full max-h-full object-contain p-2 transition-transform duration-500 ${
                              isProcessing ? "blur-[2px] opacity-60 scale-95" : ""
                            }`}
                            alt="source thumbnail"
                          />
                        )}

                        {/* Loader Overlay for active processes */}
                        {isProcessing && (
                          <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-[1px] flex flex-col justify-center items-center gap-3 z-10">
                            <RefreshCw className="h-6 w-6 text-emerald-400 animate-spin" />
                            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                              {item.status === "analyzing" ? "AI Analyzing..." : "Isolating..."}
                            </span>
                          </div>
                        )}

                        {/* Error Overlay for failed processes */}
                        {isFailed && (
                          <div className="absolute inset-0 bg-red-950/45 backdrop-blur-[1px] flex flex-col justify-center items-center gap-2 z-10 p-4 text-center">
                            <AlertTriangle className="h-6 w-6 text-red-500 animate-bounce" />
                            <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider">
                              Keying Failed
                            </span>
                          </div>
                        )}

                        {/* Dropper active overlay banner */}
                        {activeBulkDropper?.itemId === item.id && (
                          <div className="absolute inset-x-0 bottom-0 bg-amber-955/95 border-t border-amber-900/50 flex flex-col justify-center items-center py-2 z-25 text-center pointer-events-none">
                            <span className="text-[9px] font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <Droplet className="h-3 w-3 text-amber-400 animate-bounce animate-duration-1000" />
                              <span>Dropper: Click Thumbnail to Sample</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Details */}
                      <div className="p-4 flex flex-col gap-3 flex-1">
                        <div className="overflow-hidden">
                          <h4 className="text-xs font-semibold text-gray-200 truncate" title={item.fileName}>
                            {item.fileName}
                          </h4>
                          <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                            {isCompleted ? "Isolated transparency ready" : "Awaiting processing queue"}
                          </p>
                        </div>

                        {/* Card Interactive Controls */}
                        <div className="flex flex-col gap-2 p-2.5 bg-gray-950/50 rounded-xl border border-gray-850/60">
                          {/* Card Segmentation Mode Toggle */}
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Segmentation Mode</span>
                            <div className="flex gap-1 bg-gray-900 p-0.5 rounded-lg border border-gray-800">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = { segmentationMode: "chroma" as const };
                                  if (item.status === "complete" || item.status === "failed") {
                                    reprocessBulkItem(item.id, updated);
                                  } else {
                                    setBulkItems((prev) =>
                                      prev.map((i) => (i.id === item.id ? { ...i, ...updated } : i))
                                    );
                                  }
                                }}
                                className={`flex-1 py-1 rounded-md text-[8px] font-bold transition uppercase tracking-wide flex items-center justify-center gap-0.5 ${
                                  (item.segmentationMode || segmentationMode) === "chroma"
                                    ? "bg-emerald-600 text-white shadow-sm"
                                    : "text-gray-400 hover:text-gray-205"
                                }`}
                              >
                                <Droplet className="h-2.5 w-2.5 shrink-0" />
                                <span>Chroma</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = { segmentationMode: "ai" as const };
                                  if (item.status === "complete" || item.status === "failed") {
                                    reprocessBulkItem(item.id, updated);
                                  } else {
                                    setBulkItems((prev) =>
                                      prev.map((i) => (i.id === item.id ? { ...i, ...updated } : i))
                                    );
                                  }
                                }}
                                className={`flex-1 py-1 rounded-md text-[8px] font-bold transition uppercase tracking-wide flex items-center justify-center gap-0.5 ${
                                  (item.segmentationMode || segmentationMode) === "ai"
                                    ? "bg-emerald-600 text-white shadow-sm"
                                    : "text-gray-400 hover:text-gray-250"
                                }`}
                              >
                                <Sparkles className="h-2.5 w-2.5 shrink-0" />
                                <span>AI</span>
                              </button>
                            </div>
                          </div>

                          {/* Mini Invert Mask Toggle inside Card */}
                          {(item.segmentationMode || segmentationMode) === "ai" && (
                            <div className="flex flex-col gap-1 border-t border-gray-850/40 pt-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Invert Mask</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = { isInvertedMask: !item.isInvertedMask };
                                    if (item.status === "complete" || item.status === "failed") {
                                      reprocessBulkItem(item.id, updated);
                                    } else {
                                      setBulkItems((prev) =>
                                        prev.map((i) => (i.id === item.id ? { ...i, ...updated } : i))
                                      );
                                    }
                                  }}
                                  className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    item.isInvertedMask ? "bg-emerald-600" : "bg-gray-800"
                                  }`}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                      item.isInvertedMask ? "translate-x-3.5" : "translate-x-0"
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Bg Type Selection Toggle */}
                          {(item.segmentationMode || segmentationMode) === "chroma" && (
                            <div className="flex flex-col gap-1 border-t border-gray-850/40 pt-2">
                              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Background Type</span>
                              <div className="flex gap-1 bg-gray-900 p-0.5 rounded-lg border border-gray-800">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = { isCheckerboard: false };
                                    if (item.status === "complete" || item.status === "failed") {
                                      reprocessBulkItem(item.id, updated);
                                    } else {
                                      setBulkItems((prev) =>
                                        prev.map((i) => (i.id === item.id ? { ...i, ...updated } : i))
                                      );
                                    }
                                  }}
                                  className={`flex-1 py-1 rounded-md text-[9px] font-bold transition uppercase tracking-wide ${
                                    !item.isCheckerboard
                                      ? "bg-emerald-600 text-white shadow-sm"
                                      : "text-gray-400 hover:text-gray-250"
                                  }`}
                                >
                                  Solid
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = { isCheckerboard: true };
                                    if (item.status === "complete" || item.status === "failed") {
                                      reprocessBulkItem(item.id, updated);
                                    } else {
                                      setBulkItems((prev) =>
                                        prev.map((i) => (i.id === item.id ? { ...i, ...updated } : i))
                                      );
                                    }
                                  }}
                                  className={`flex-1 py-1 rounded-md text-[9px] font-bold transition uppercase tracking-wide ${
                                    item.isCheckerboard
                                      ? "bg-emerald-600 text-white shadow-sm"
                                      : "text-gray-400 hover:text-gray-250"
                                  }`}
                                >
                                  Grid
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Safety Backdrop Backdrop Color Selector */}
                          <div className="flex flex-col gap-1 border-t border-gray-850/40 pt-2">
                            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Safety Backdrop Color</span>
                            <div className="flex gap-1.5 bg-gray-900 p-0.5 rounded-lg border border-gray-800">
                              {CHROMA_OPTIONS.map((opt) => {
                                const activeName = item.chromaColorName || "Green";
                                const isActive = activeName === opt.name;
                                return (
                                  <button
                                    key={opt.name}
                                    type="button"
                                    onClick={() => {
                                      const updated = { chromaColorName: opt.name };
                                      if (item.status === "complete" || item.status === "failed") {
                                        reprocessBulkItem(item.id, updated);
                                      } else {
                                        setBulkItems((prev) =>
                                          prev.map((i) => (i.id === item.id ? { ...i, ...updated } : i))
                                        );
                                      }
                                    }}
                                    className={`flex-1 py-1 rounded text-[8px] font-mono font-bold uppercase transition flex items-center justify-center gap-1 ${
                                      isActive
                                        ? "bg-emerald-600 text-white shadow-sm font-extrabold"
                                        : "text-gray-400 hover:text-gray-250"
                                    }`}
                                  >
                                    <div
                                      className="w-1.5 h-1.5 rounded-full shadow-inner shrink-0"
                                      style={{ backgroundColor: opt.hex }}
                                    />
                                    <span>{opt.name.substring(0, 3)}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Swatches and Droppers directly on the Card */}
                          {(item.segmentationMode || segmentationMode) === "chroma" && (
                            <div className="border-t border-gray-850/40 pt-2 flex flex-col gap-1.5">
                              <div className="flex justify-between items-center text-[9px] font-mono text-gray-550 uppercase tracking-wider mb-0.5">
                                <span>Colors & Droppers:</span>
                              </div>

                              {item.isCheckerboard ? (
                                <div className="grid grid-cols-2 gap-2">
                                  {/* Square 1 Swatch & Dropper */}
                                  <div className="flex items-center justify-between p-1 px-1.5 bg-gray-900 rounded-lg border border-gray-800">
                                    <div className="flex items-center gap-1">
                                      <div
                                        className="w-3.5 h-3.5 rounded border border-gray-700 shadow-inner shrink-0"
                                        style={{ backgroundColor: item.detectedColorHex || "#ffffff" }}
                                      />
                                      <span className="text-[9px] font-mono font-bold text-gray-305 uppercase truncate max-w-[32px]">
                                        {item.detectedColorHex ? item.detectedColorHex.substring(1) : "FFF"}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setActiveBulkDropper(
                                          activeBulkDropper?.itemId === item.id && activeBulkDropper.colorIndex === "color1"
                                            ? null
                                            : { itemId: item.id, colorIndex: "color1" }
                                        )
                                      }
                                      className={`p-1 rounded transition border ${
                                        activeBulkDropper?.itemId === item.id && activeBulkDropper.colorIndex === "color1"
                                          ? "bg-amber-600 border-amber-500 text-white animate-pulse"
                                          : "bg-gray-950 hover:bg-gray-800 border-gray-850 text-gray-400 hover:text-gray-200"
                                      }`}
                                      title="Sample Color 1 from Thumbnail"
                                    >
                                      <Droplet className="h-3 w-3" />
                                    </button>
                                  </div>

                                  {/* Square 2 Swatch & Dropper */}
                                  <div className="flex items-center justify-between p-1 px-1.5 bg-gray-900 rounded-lg border border-gray-800">
                                    <div className="flex items-center gap-1">
                                      <div
                                        className="w-3.5 h-3.5 rounded border border-gray-700 shadow-inner shrink-0"
                                        style={{ backgroundColor: item.detectedColor2Hex || "#505050" }}
                                      />
                                      <span className="text-[9px] font-mono font-bold text-gray-305 uppercase truncate max-w-[32px]">
                                        {item.detectedColor2Hex ? item.detectedColor2Hex.substring(1) : "505"}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setActiveBulkDropper(
                                          activeBulkDropper?.itemId === item.id && activeBulkDropper.colorIndex === "color2"
                                            ? null
                                            : { itemId: item.id, colorIndex: "color2" }
                                        )
                                      }
                                      className={`p-1 rounded transition border ${
                                        activeBulkDropper?.itemId === item.id && activeBulkDropper.colorIndex === "color2"
                                          ? "bg-amber-600 border-amber-500 text-white animate-pulse"
                                          : "bg-gray-950 hover:bg-gray-850 text-gray-400 hover:text-gray-200"
                                      }`}
                                      title="Sample Color 2 from Thumbnail"
                                    >
                                      <Droplet className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                // Solid color swatch & dropper
                                <div className="flex items-center justify-between p-1.5 bg-gray-900 rounded-lg border border-gray-800">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3.5 h-3.5 rounded border border-gray-700 shadow-inner shrink-0"
                                      style={{ backgroundColor: item.detectedColorHex || "#ffffff" }}
                                    />
                                    <span className="text-[9px] font-mono font-bold text-gray-305 uppercase">
                                      {item.detectedColorHex || "#ffffff"}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveBulkDropper(
                                        activeBulkDropper?.itemId === item.id && activeBulkDropper.colorIndex === "color1"
                                          ? null
                                          : { itemId: item.id, colorIndex: "color1" }
                                      )
                                    }
                                    className={`p-1 rounded transition border ${
                                      activeBulkDropper?.itemId === item.id && activeBulkDropper.colorIndex === "color1"
                                        ? "bg-amber-600 border-amber-500 text-white animate-pulse"
                                        : "bg-gray-950 hover:bg-gray-800 border-gray-850 text-gray-400 hover:text-gray-200"
                                    }`}
                                    title="Sample Color from Thumbnail"
                                  >
                                    <Droplet className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Card Status Indicator */}
                        <div className="mt-1">
                          {(() => {
                            if (isCompleted) {
                              return (
                                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-semibold">
                                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                  <span>Complete</span>
                                </div>
                              );
                            }
                            if (isFailed) {
                              return (
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-1.5 text-xs text-red-400 font-mono font-semibold">
                                    <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                                    <span>Failed</span>
                                  </div>
                                  <p className="text-[9px] text-gray-500 leading-tight">
                                    {item.errorMessage || "Unknown error"}
                                  </p>
                                </div>
                              );
                            }
                            if (isProcessing) {
                              return (
                                <div className="w-full">
                                  <div className="w-full h-1 bg-gray-950 rounded-full overflow-hidden border border-gray-850">
                                    <div
                                      className="h-full bg-emerald-500 animate-pulse transition-all duration-300"
                                      style={{ width: `${item.progress}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-mono text-gray-550 mt-1 block">
                                    Progress: {item.progress}%
                                  </span>
                                </div>
                              );
                            }
                            return (
                              <div className="flex items-center gap-1.5 text-xs text-gray-550 font-mono">
                                <div className="h-2 w-2 rounded-full bg-gray-700 animate-pulse" />
                                <span>Queued</span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Card Action Footer */}
                      <div className="p-3 bg-gray-950/40 border-t border-gray-850/60 mt-auto flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleFineTuneBulkItem(item)}
                          className="flex-1 py-2 bg-gray-950 hover:bg-gray-800 border border-gray-850 hover:border-gray-700 text-gray-300 hover:text-white rounded-xl text-[10px] sm:text-[11px] font-mono font-bold uppercase transition flex items-center justify-center gap-1"
                          title="Fine-Tune this specific asset's colors and sliders"
                        >
                          <Sliders className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>Fine-Tune</span>
                        </button>
                        
                        <button
                          type="button"
                          disabled={!isCompleted}
                          onClick={() => downloadBulkItem(item)}
                          className={`flex-1 py-2 rounded-xl text-[10px] sm:text-[11px] font-mono font-bold uppercase transition duration-300 flex items-center justify-center gap-1 ${
                            isCompleted
                              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/10 hover:scale-[1.02] cursor-pointer"
                              : "bg-gray-905 border border-gray-850 text-gray-600 cursor-not-allowed"
                          }`}
                          title="Download transparent isolated PNG asset"
                        >
                          <Download className="h-3.5 w-3.5 shrink-0" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Batch Processing Upsell Warning Modal */}
      {showBatchUpsell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowBatchUpsell(false)}>
          <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl overflow-hidden text-center" onClick={(e) => e.stopPropagation()}>
            <div className="absolute -top-16 -left-16 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 w-fit mx-auto mb-4 animate-bounce">
              <Sparkles className="h-6 w-6" />
            </div>
            
            <h3 className="text-lg font-bold text-white tracking-tight">Batch Processing is a Pro Feature</h3>
            <p className="text-xs text-gray-400 mt-2 mb-6 leading-relaxed">
              Unlock the ability to drag and drop multiple files and isolate background batches in seconds. Free accounts are limited to single-image uploads.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowBatchUpsell(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gray-950 border border-gray-850 hover:bg-gray-800 text-gray-400 hover:text-white text-xs font-semibold transition cursor-pointer"
              >
                Maybe Later
              </button>
              <button
                onClick={() => {
                  setShowBatchUpsell(false);
                  onOpenPricing();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs hover:shadow-lg transition cursor-pointer"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
