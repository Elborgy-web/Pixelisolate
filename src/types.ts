export interface SubjectAnalysis {
  subjectName: string;
  outlineComplexity: "low" | "medium" | "high";
  colorAnalysis: string;
  edgeDifficulty: string;
  boundingBox: { x: number; y: number; w: number; h: number } | null;
  segmentationAdvice: string;
  detectedBgColorHex?: string;
  detectedBgColorRgb?: [number, number, number];
  autoTunedSliders?: {
    similarity?: number;
    hueMin?: number;
    hueMax?: number;
    satMin?: number;
    satMax?: number;
    valMin?: number;
    valMax?: number;
    erosionSize?: number;
    dilationSize?: number;
    featherRadius?: number;
  };
}

export interface ProcessingSettings {
  chromaColor: string; // Hex code, defaults to #00FF00
  colorTolerance: number; // For chromakeying
  colorSimilarity: number; // Tolerance for keying
  colorSmoothing: number; // For alpha margins
  erosionSize: number; // 0 to 5px
  dilationSize: number; // 0 to 5px
  featherRadius: number; // 0 to 5px
  alphaThreshold: number; // 1 to 255
}

export interface BulkImageItem {
  id: string;
  fileName: string;
  sourceUri: string;
  greenScreenUri: string | null;
  isolatedUri: string | null;
  status: "queued" | "analyzing" | "isolating" | "complete" | "failed";
  progress: number; // 0-100
  detectedColorHex: string;
  detectedColorRgb: { r: number; g: number; b: number };
  detectedColor2Hex?: string;
  detectedColor2Rgb?: { r: number; g: number; b: number };
  isCheckerboard?: boolean;
  useConnectivity?: boolean;
  similarity?: number;
  erosionSize?: number;
  dilationSize?: number;
  featherRadius?: number;
  boundingBox?: { x: number; y: number; w: number; h: number } | null;
  subjectName?: string;
  errorMessage?: string;
  chromaColorName?: "Green" | "Magenta" | "Cyan";
  segmentationMode?: "ai" | "chroma" | "frame";
  isInvertedMask?: boolean;
}
