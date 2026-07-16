import React, { useState } from "react";
import { Download, Copy, Check, FileCode, Play, AlertCircle } from "lucide-react";

interface PythonScriptProps {
  hueMin: number;
  hueMax: number;
  satMin: number;
  satMax: number;
  valMin: number;
  valMax: number;
  erosionSize: number;
  dilationSize: number;
  featherRadius: number;
  chromaHex: string;
}

export default function PythonScript({
  hueMin,
  hueMax,
  satMin,
  satMax,
  valMin,
  valMax,
  erosionSize,
  dilationSize,
  featherRadius,
  chromaHex,
}: PythonScriptProps) {
  const [copied, setCopied] = useState(false);

  // Convert Hex to RGB
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    return { r, g, b };
  };

  const rgb = hexToRgb(chromaHex);

  const scriptContent = `#!/usr/bin/env python3
"""
Pixel-Level Image Isolation & Chroma Extraction Engine
Automatically separate primary elements with high-precision HSV Masking.

Requirements:
    pip install opencv-python pillow numpy
"""

import cv2
import numpy as np
import os
from PIL import Image

def isolate_foreground_subject(input_path: str, output_path: str):
    print(f"[*] Loading source image: {input_path}")
    if not os.path.exists(input_path):
        print(f"[!] Error: File '{input_path}' not found.")
        return

    # Load image using OpenCV
    img = cv2.imread(input_path)
    
    # Convert image from BGR to HSV color space to isolate color channels
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    
    # Define exact HSV key bounds for your chosen chroma threshold
    # Target Hex: ${chromaHex} (RGB: ${rgb.r}, ${rgb.g}, ${rgb.b})
    lower_bound = np.array([${hueMin}, ${satMin}, ${valMin}])
    upper_bound = np.array([${hueMax}, ${satMax}, ${valMax}])
    
    print(f"[*] Filtering color range - HSV Lower: {lower_bound}, Upper: {upper_bound}")
    
    # Create the initial binary mask of the chroma background
    chroma_mask = cv2.inRange(hsv, lower_bound, upper_bound)
    
    # Invert mask to capture the subject (alpha values: 0 = transparent, 255 = opaque)
    subject_mask = cv2.bitwise_not(chroma_mask)
    
    # Apply morphological operations to fine-tune edges
    # Kernel shape config dynamically matching UI settings
    ${
      erosionSize > 0
        ? `kernel_erode = np.ones((${erosionSize}, ${erosionSize}), np.uint8)
    subject_mask = cv2.erode(subject_mask, kernel_erode, iterations=1)
    print("[*] Applied morphological erosion (remove border bleeding)")`
        : "# No erosion applied (erosion size = 0)"
    }
    
    ${
      dilationSize > 0
        ? `kernel_dilate = np.ones((${dilationSize}, ${dilationSize}), np.uint8)
    subject_mask = cv2.dilate(subject_mask, kernel_dilate, iterations=1)
    print("[*] Applied morphological dilation (expand subject core)")`
        : "# No dilation applied (dilation size = 0)"
    }
    
    # Apply edge feathering (smoothing) if requested
    ${
      featherRadius > 0
        ? `print("[*] Feathering mask boundaries to resolve anti-aliasing halos")
    subject_mask_blurred = cv2.GaussianBlur(subject_mask, (${featherRadius * 2 + 1}, ${featherRadius * 2 + 1}), 0)`
        : `subject_mask_blurred = subject_mask`
    }
    
    # Build a high-quality 4-channel transparent PNG
    b, g, r = cv2.split(img)
    alpha = subject_mask_blurred
    
    # Merge color channels with the isolated alpha mask
    final_rgba = cv2.merge([b, g, r, alpha])
    
    # Save the output high-resolution transparent PNG file
    cv2.imwrite(output_path, final_rgba)
    print(f"[✓] Successfully generated isolated asset: {output_path}")

if __name__ == "__main__":
    # Configure workspace file mappings
    input_file = "green_screen_masked.png"
    output_file = "isolated_subject.png"
    
    print("=" * 60)
    print("  PIXEL-LEVEL IMAGE ISOLATION PIPELINE: STEP 3 (PYTHON MASK EXTRACTION)")
    print("=" * 60)
    
    isolate_foreground_subject(input_file, output_file)
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([scriptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chroma_extract.py";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Tab Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-gray-950 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <FileCode className="h-5 w-5 text-emerald-400" />
          <span className="font-mono text-xs font-semibold tracking-wider text-gray-200">
            CHROMA_EXTRACT.PY
          </span>
          <span className="hidden sm:inline bg-emerald-950 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-md border border-emerald-900/50">
            OpenCV/PIL Pipeline
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-850 text-gray-300 hover:text-white transition text-xs font-medium border border-gray-800"
            title="Copy script to clipboard"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition text-xs font-medium"
            title="Download script file"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download .py</span>
          </button>
        </div>
      </div>

      {/* Code Area */}
      <div className="p-5 font-mono text-[13px] leading-relaxed text-gray-300 overflow-x-auto max-h-[420px] bg-gray-950/40">
        <pre className="whitespace-pre">{scriptContent}</pre>
      </div>

      {/* Footer Instructions */}
      <div className="p-4 bg-gray-950 border-t border-gray-800 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-950/40 border border-amber-900/50 rounded-lg text-amber-500">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div className="text-xs text-gray-400 max-w-lg">
            <p className="font-semibold text-gray-300">How to execute locally:</p>
            <p className="mt-0.5">
              Place your green-screen image as <code className="text-amber-400 font-mono">green_screen_masked.png</code> in the same folder as this script, then run:
            </p>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded px-3.5 py-2 font-mono text-xs text-gray-300 select-all shrink-0">
          pip install opencv-python numpy && python chroma_extract.py
        </div>
      </div>
    </div>
  );
}
