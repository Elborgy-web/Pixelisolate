/**
 * High-precision Pixel-Level image processing utilities.
 * Implements real-time chroma transformations, 2D matrix morphological erosion/dilation,
 * and gaussian feathering in TypeScript matching OpenCV functionality.
 */

// Helper to convert RGB to HSV
export function rgbToHsv(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 180), // OpenCV Hue scale is 0-180
    s: Math.round(s * 255), // OpenCV Saturation scale is 0-255
    v: Math.round(v * 255), // OpenCV Value scale is 0-255
  };
}

// Check if an HSV pixel is within bounds
export function isWithinHsvRange(
  h: number,
  s: number,
  v: number,
  hMin: number,
  hMax: number,
  sMin: number,
  sMax: number,
  vMin: number,
  vMax: number
): boolean {
  // Handle circular Hue wrap-around if max is less than min (for red-like hues)
  const hueMatch =
    hMin <= hMax ? h >= hMin && h <= hMax : h >= hMin || h <= hMax;
  const satMatch = s >= sMin && s <= sMax;
  const valMatch = v >= vMin && v <= vMax;

  return hueMatch && satMatch && valMatch;
}

/**
 * Creates step 2 Chroma-Keyed Image:
 * Replaces any pixel close to selected color with pure solid green (#00FF00).
 */
export function createChromaGreenTransform(
  sourceData: ImageData,
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number } | null,
  isCheckerboard: boolean,
  useConnectivity: boolean,
  similarity: number,
  feather: number,
  chromaColorRgb: { r: number; g: number; b: number } = { r: 0, g: 255, b: 0 }
): ImageData {
  const width = sourceData.width;
  const height = sourceData.height;
  const output = new ImageData(new Uint8ClampedArray(sourceData.data.length), width, height);

  const src = sourceData.data;
  const dst = output.data;

  const maxDistance = 441.67;
  const threshold = similarity * maxDistance;

  // Helper to check if a pixel is background-like, returns 0 (foreground) to 255 (100% background)
  const getBgWeight = (r: number, g: number, b: number): number => {
    const dR1 = r - color1.r;
    const dG1 = g - color1.g;
    const dB1 = b - color1.b;
    const dist1 = Math.sqrt(dR1 * dR1 + dG1 * dG1 + dB1 * dB1);

    let maxDist = dist1;
    if (isCheckerboard) {
      const activeColor2 = (color2 && (Math.abs(color2.r - color1.r) + Math.abs(color2.g - color1.g) + Math.abs(color2.b - color1.b) > 10))
        ? color2
        : { r: 204, g: 204, b: 204 }; // Fallback standard checkerboard grey (#cccccc)

      const dR2 = r - activeColor2.r;
      const dG2 = g - activeColor2.g;
      const dB2 = b - activeColor2.b;
      const dist2 = Math.sqrt(dR2 * dR2 + dG2 * dG2 + dB2 * dB2);
      maxDist = Math.min(dist1, dist2);
    }

    // Dynamic transition band: narrow and sharp at low tolerances, capped at 25px for soft natural feathering
    const transitionBand = Math.min(25, 0.25 * threshold);
    const innerThreshold = Math.max(0, threshold - transitionBand);

    if (maxDist < innerThreshold) return 255;
    if (maxDist < threshold) {
      const ratio = (maxDist - innerThreshold) / (threshold - innerThreshold);
      return Math.round(255 * (1 - ratio));
    }
    return 0;
  };

  const bgMask = new Uint8Array(width * height);

  if (useConnectivity) {
    // High-contrast edge detection to block BFS flood-fill leakage
    const edgeMap = new Uint8Array(width * height);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const r = src[idx];
        const g = src[idx + 1];
        const b = src[idx + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        const idxRight = (y * width + (x + 1)) * 4;
        const rR = src[idxRight];
        const gR = src[idxRight + 1];
        const bR = src[idxRight + 2];
        const lumRight = 0.299 * rR + 0.587 * gR + 0.114 * bR;

        const idxDown = ((y + 1) * width + x) * 4;
        const rD = src[idxDown];
        const gD = src[idxDown + 1];
        const bD = src[idxDown + 2];
        const lumDown = 0.299 * rD + 0.587 * gD + 0.114 * bD;

        // Skip marking edges if BOTH compared pixels are background-like (e.g. grid transitions)
        const isBgCurr = getBgWeight(r, g, b) > 0;
        const isBgRight = getBgWeight(rR, gR, bR) > 0;
        const isBgDown = getBgWeight(rD, gD, bD) > 0;

        const isEdgeRight = !(isBgCurr && isBgRight) && Math.abs(lum - lumRight) > 25;
        const isEdgeDown = !(isBgCurr && isBgDown) && Math.abs(lum - lumDown) > 25;

        if (isEdgeRight || isEdgeDown) {
          edgeMap[y * width + x] = 1;
        }
      }
    }

    // Dilate edges by 1px radius to perfectly seal any tiny outline gaps
    const dilatedEdgeMap = new Uint8Array(width * height);
    const kSize = 1;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (edgeMap[idx] === 1) {
          for (let dy = -kSize; dy <= kSize; dy++) {
            for (let dx = -kSize; dx <= kSize; dx++) {
              dilatedEdgeMap[(y + dy) * width + (x + dx)] = 1;
            }
          }
        }
      }
    }

    // 8-way BFS Flood-Fill from Borders
    const queue: number[] = [];
    const visited = new Uint8Array(width * height);

    // Seed strictly from a 3x3 patch at the 4 canvas corners
    // This blocks the flood-fill from ever starting inside cropped subjects at borders (leakage prevention)
    const corners = [
      { x: 0, y: 0 },
      { x: width - 1, y: 0 },
      { x: 0, y: height - 1 },
      { x: width - 1, y: height - 1 }
    ];

    for (const pt of corners) {
      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          const px = pt.x === 0 ? dx : pt.x - dx;
          const py = pt.y === 0 ? dy : pt.y - dy;
          if (px >= 0 && px < width && py >= 0 && py < height) {
            const idx = py * width + px;
            if (!visited[idx]) {
              const sIdx = idx * 4;
              const w = getBgWeight(src[sIdx], src[sIdx + 1], src[sIdx + 2]);
              if (w > 0) {
                queue.push(idx);
                visited[idx] = 1;
                bgMask[idx] = w;
              }
            }
          }
        }
      }
    }

    // BFS Queue loop
    let head = 0;
    const dx = [0, 0, -1, 1, -1, -1, 1, 1];
    const dy = [-1, 1, 0, 0, -1, 1, -1, 1];

    while (head < queue.length) {
      const currIdx = queue[head++];
      const cx = currIdx % width;
      const cy = Math.floor(currIdx / width);

      for (let i = 0; i < 8; i++) {
        const nx = cx + dx[i];
        const ny = cy + dy[i];

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nIdx = ny * width + nx;
          if (dilatedEdgeMap[nIdx] === 1) {
            continue; // Blocked by Morphological Edge Guard!
          }

          if (!visited[nIdx]) {
            const sIdx = nIdx * 4;
            const wNeigh = getBgWeight(src[sIdx], src[sIdx + 1], src[sIdx + 2]);
            if (wNeigh > 0) {
              queue.push(nIdx);
              visited[nIdx] = 1;
              bgMask[nIdx] = wNeigh;
            }
          }
        }
      }
    }

    // Scan all unvisited internal pixels to key out any isolated checkerboard grid backgrounds in the interior!
    if (isCheckerboard) {
      const activeColor2 = (color2 && (Math.abs(color2.r - color1.r) + Math.abs(color2.g - color1.g) + Math.abs(color2.b - color1.b) > 10))
        ? color2
        : { r: 204, g: 204, b: 204, hex: "#cccccc" }; // Standard checkerboard grey fallback!

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          if (bgMask[idx] === 0) {
            const sIdx = idx * 4;
            const r = src[sIdx];
            const g = src[sIdx + 1];
            const b = src[sIdx + 2];
            
            const dR1 = r - color1.r;
            const dG1 = g - color1.g;
            const dB1 = b - color1.b;
            const dist1 = Math.sqrt(dR1 * dR1 + dG1 * dG1 + dB1 * dB1);

            const dR2 = r - activeColor2.r;
            const dG2 = g - activeColor2.g;
            const dB2 = b - activeColor2.b;
            const dist2 = Math.sqrt(dR2 * dR2 + dG2 * dG2 + dB2 * dB2);

            const isBgColor = dist1 < threshold || dist2 < threshold;
            if (isBgColor && isPixelInCheckerboardGrid(src, width, height, x, y, color1, activeColor2)) {
              bgMask[idx] = 255;
            }
          }
        }
      }
    }
  } else {
    // Global Mode: Key out matching pixels globally
    for (let i = 0; i < width * height; i++) {
      const sIdx = i * 4;
      if (src[sIdx + 3] === 0) {
        bgMask[i] = 255;
      } else {
        bgMask[i] = getBgWeight(src[sIdx], src[sIdx + 1], src[sIdx + 2]);
      }
    }
  }

  // Draw dynamic safety chroma color backdrop with soft blending
  for (let i = 0; i < width * height; i++) {
    const sIdx = i * 4;
    const bgAlpha = bgMask[i]; // 0 (fg) to 255 (bg)

    if (bgAlpha > 0) {
      const weight = bgAlpha / 255; // 1 for pure background, 0 for pure foreground
      dst[sIdx] = Math.round(src[sIdx] * (1 - weight) + chromaColorRgb.r * weight);
      dst[sIdx + 1] = Math.round(src[sIdx + 1] * (1 - weight) + chromaColorRgb.g * weight);
      dst[sIdx + 2] = Math.round(src[sIdx + 2] * (1 - weight) + chromaColorRgb.b * weight);
      dst[sIdx + 3] = 255;
    } else {
      dst[sIdx] = src[sIdx];
      dst[sIdx + 1] = src[sIdx + 1];
      dst[sIdx + 2] = src[sIdx + 2];
      dst[sIdx + 3] = src[sIdx + 3];
    }
  }

  return output;
}

/**
 * Performs Morphological Erosion on an 8-bit single-channel/alpha grid
 */
export function erodeAlpha(
  alphaGrid: Uint8Array,
  width: number,
  height: number,
  kernelSize: number
): Uint8Array {
  if (kernelSize <= 0) return alphaGrid;
  const output = new Uint8Array(alphaGrid.length);
  const offset = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let minVal = 255;

      // Scan kernel neighborhood
      for (let ky = -offset; ky <= offset; ky++) {
        for (let kx = -offset; kx <= offset; kx++) {
          const nx = x + kx;
          const ny = y + ky;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const idx = ny * width + nx;
            minVal = Math.min(minVal, alphaGrid[idx]);
          } else {
            // Treat border values as transparent/background during erosion
            minVal = 0;
          }
        }
      }
      output[y * width + x] = minVal;
    }
  }

  return output;
}

/**
 * Performs Morphological Dilation on an 8-bit single-channel/alpha grid
 */
export function dilateAlpha(
  alphaGrid: Uint8Array,
  width: number,
  height: number,
  kernelSize: number
): Uint8Array {
  if (kernelSize <= 0) return alphaGrid;
  const output = new Uint8Array(alphaGrid.length);
  const offset = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let maxVal = 0;

      // Scan kernel neighborhood
      for (let ky = -offset; ky <= offset; ky++) {
        for (let kx = -offset; kx <= offset; kx++) {
          const nx = x + kx;
          const ny = y + ky;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const idx = ny * width + nx;
            maxVal = Math.max(maxVal, alphaGrid[idx]);
          }
        }
      }
      output[y * width + x] = maxVal;
    }
  }

  return output;
}

/**
 * Performs Gaussian-equivalent blur feathering on isolated masks
 */
export function blurAlpha(
  alphaGrid: Uint8Array,
  width: number,
  height: number,
  radius: number
): Uint8Array {
  if (radius <= 0) return alphaGrid;

  // Horizontal blur pass followed by Vertical blur pass (Separable filter)
  const temp = new Uint8Array(alphaGrid.length);
  const output = new Uint8Array(alphaGrid.length);

  const kernelSize = radius * 2 + 1;
  const kernel = new Float32Array(kernelSize);
  const sigma = radius / 2;
  let sum = 0;

  // Compute 1D Gaussian kernel
  for (let i = 0; i < kernelSize; i++) {
    const x = i - radius;
    kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
    sum += kernel[i];
  }
  for (let i = 0; i < kernelSize; i++) {
    kernel[i] /= sum;
  }

  // Row pass (horizontal)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let val = 0;
      for (let k = -radius; k <= radius; k++) {
        let nx = x + k;
        if (nx < 0) nx = 0;
        if (nx >= width) nx = width - 1;
        val += alphaGrid[y * width + nx] * kernel[k + radius];
      }
      temp[y * width + x] = Math.min(255, Math.max(0, val));
    }
  }

  // Column pass (vertical)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let val = 0;
      for (let k = -radius; k <= radius; k++) {
        let ny = y + k;
        if (ny < 0) ny = 0;
        if (ny >= height) ny = height - 1;
        val += temp[ny * width + x] * kernel[k + radius];
      }
      output[y * width + x] = Math.min(255, Math.max(0, val));
    }
  }

  return output;
}

/**
 * Executes Step 3:
 * Isolates the subject from the green screen image based on HSV range
 */
export function isolateSubjectFromChroma(
  chromaGreenData: ImageData,
  hMin: number,
  hMax: number,
  sMin: number,
  sMax: number,
  vMin: number,
  vMax: number,
  erosionSize: number,
  dilationSize: number,
  featherRadius: number,
  boundingBox?: { x: number; y: number; w: number; h: number } | null
): ImageData {
  const width = chromaGreenData.width;
  const height = chromaGreenData.height;
  const output = new ImageData(new Uint8ClampedArray(chromaGreenData.data.length), width, height);

  const src = chromaGreenData.data;
  const dst = output.data;

  // Step A: Extract original colors into output, and create initial alpha mask using high-precision Linear Chroma Keying
  const initialAlpha = new Uint8Array(width * height);
  const originalHues = new Uint16Array(width * height); // Store hues to guide edge despill

  for (let i = 0; i < src.length; i += 4) {
    const r = src[i];
    const g = src[i + 1];
    const b = src[i + 2];
    const pixelIdx = i / 4;

    const px = pixelIdx % width;
    const py = Math.floor(pixelIdx / width);

    // Determine if pixel is outside bounding box
    let isOutsideBox = false;
    if (boundingBox) {
      const padding = 5; // 5% safety margin on all sides
      const boxLeft = Math.max(0, ((boundingBox.x - padding) / 100) * width);
      const boxTop = Math.max(0, ((boundingBox.y - padding) / 100) * height);
      const boxRight = Math.min(width, ((boundingBox.x + boundingBox.w + padding) / 100) * width);
      const boxBottom = Math.min(height, ((boundingBox.y + boundingBox.h + padding) / 100) * height);

      if (px < boxLeft || px > boxRight || py < boxTop || py > boxBottom) {
        isOutsideBox = true;
      }
    }

    // Convert pixels to HSV space
    const { h, s, v } = rgbToHsv(r, g, b);
    originalHues[pixelIdx] = h;

    // Is the pixel inside the #00FF00 green screen range?
    const isChromaGreen = isWithinHsvRange(h, s, v, hMin, hMax, sMin, sMax, vMin, vMax);

    if (isOutsideBox) {
      initialAlpha[pixelIdx] = 0;
    } else if (isChromaGreen) {
      // Linear Chroma Keying: calculate transparent weight based on backdrop dominance
      let dominance = 0;
      if (h >= 135 && h <= 165) {
        // Magenta dominance
        dominance = Math.min(r, b) - g;
      } else if (h >= 75 && h <= 105) {
        // Cyan dominance
        dominance = Math.min(g, b) - r;
      } else {
        // Green dominance
        dominance = g - Math.max(r, b);
      }

      if (dominance > 0) {
        const maxDominance = 100; // Threshold for 100% transparency
        const alphaRatio = Math.max(0, Math.min(1, dominance / maxDominance));
        initialAlpha[pixelIdx] = Math.round(255 * (1 - alphaRatio));
      } else {
        initialAlpha[pixelIdx] = 255;
      }
    } else {
      initialAlpha[pixelIdx] = 255;
    }

    // Keep RGB colors unaltered
    dst[i] = r;
    dst[i + 1] = g;
    dst[i + 2] = b;
  }

  // Step B: Apply Morphological Erosion to prevent border color bleeding
  let processedAlpha = initialAlpha;
  if (erosionSize > 0) {
    processedAlpha = erodeAlpha(processedAlpha, width, height, erosionSize);
  }

  // Step C: Apply Morphological Dilation to restore inside holes if needed
  if (dilationSize > 0) {
    processedAlpha = dilateAlpha(processedAlpha, width, height, dilationSize);
  }

  // Step D: Apply Gaussian Feathering to smooth hard aliasing jagged edges
  if (featherRadius > 0) {
    processedAlpha = blurAlpha(processedAlpha, width, height, featherRadius);
  }

  // Step E: Write final processed alpha channel and apply cinematic edge de-spilling
  const rangeCenter = hMin <= hMax ? (hMin + hMax) / 2 : hMin;

  for (let i = 0; i < dst.length; i += 4) {
    const pixelIdx = i / 4;
    const finalAlpha = processedAlpha[pixelIdx];
    dst[i + 3] = finalAlpha;

    if (finalAlpha === 0) {
      dst[i] = 0;
      dst[i + 1] = 0;
      dst[i + 2] = 0;
    } else {
      const h = originalHues[pixelIdx];
      let r = dst[i];
      let g = dst[i + 1];
      let b = dst[i + 2];

      const inKeyRange = hMin <= hMax 
        ? (h >= hMin - 5 && h <= hMax + 5) 
        : (h >= hMin - 5 || h <= hMax + 5);

      // De-spill green/magenta/cyan cast from edges and key-like zones to prevent colored fringes/halos
      if (finalAlpha < 255 || inKeyRange) {
        const alphaRatio = finalAlpha / 255;
        if (rangeCenter >= 35 && rangeCenter <= 85) {
          // Green backdrop: clamp green channel to prevent green spill
          const maxOther = Math.max(r, b);
          if (g > maxOther) {
            g = Math.round(maxOther * (1 - alphaRatio) + g * alphaRatio);
          }
        } else if (rangeCenter >= 120 && rangeCenter <= 175) {
          // Magenta backdrop: desaturate/clamp red and blue channels based on green channel
          const magentaComponent = Math.min(r, b) - g;
          if (magentaComponent > 0) {
            r = Math.round(r - magentaComponent * (1 - alphaRatio));
            b = Math.round(b - magentaComponent * (1 - alphaRatio));
          }
        } else if (rangeCenter >= 75 && rangeCenter <= 115) {
          // Cyan backdrop: desaturate/clamp green and blue channels based on red channel
          const cyanComponent = Math.min(g, b) - r;
          if (cyanComponent > 0) {
            g = Math.round(g - cyanComponent * (1 - alphaRatio));
            b = Math.round(b - cyanComponent * (1 - alphaRatio));
          }
        }
      }

      dst[i] = r;
      dst[i + 1] = g;
      dst[i + 2] = b;
    }
  }

  return output;
}

/**
 * Automatically detects the dominant background color of an image by sampling its 4 corners.
 * Samples a 10x10 patch in each corner, averages the colors, and finds the most dominant color.
 */
export function detectBackgroundColorFromCorners(imageData: ImageData): { r: number; g: number; b: number; hex: string } {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  const patchSize = 10;
  const rValues: number[] = [];
  const gValues: number[] = [];
  const bValues: number[] = [];

  // Define corner offsets
  const corners = [
    { xStart: 0, yStart: 0 }, // Top-Left
    { xStart: Math.max(0, width - patchSize), yStart: 0 }, // Top-Right
    { xStart: 0, yStart: Math.max(0, height - patchSize) }, // Bottom-Left
    { xStart: Math.max(0, width - patchSize), yStart: Math.max(0, height - patchSize) }, // Bottom-Right
  ];

  for (const corner of corners) {
    for (let dy = 0; dy < patchSize; dy++) {
      for (let dx = 0; dx < patchSize; dx++) {
        const px = corner.xStart + dx;
        const py = corner.yStart + dy;

        if (px < width && py < height) {
          const idx = (py * width + px) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          // Only sample opaque pixels
          if (a > 50) {
            rValues.push(r);
            gValues.push(g);
            bValues.push(b);
          }
        }
      }
    }
  }

  // Fallback if no opaque pixels in corners
  if (rValues.length === 0) {
    return { r: 255, g: 255, b: 255, hex: "#ffffff" };
  }

  // Calculate averages
  const rAvg = Math.round(rValues.reduce((sum, v) => sum + v, 0) / rValues.length);
  const gAvg = Math.round(gValues.reduce((sum, v) => sum + v, 0) / gValues.length);
  const bAvg = Math.round(bValues.reduce((sum, v) => sum + v, 0) / bValues.length);

  const hex = "#" + ((1 << 24) + (rAvg << 16) + (gAvg << 8) + bAvg).toString(16).slice(1);

  return { r: rAvg, g: gAvg, b: bAvg, hex };
}

/**
 * Automatically detects if the background is a solid color or a checkerboard pattern by sampling corners,
 * and splits corner pixels into two dominant clusters by luminance if a checkerboard is present.
 */
export function detectDualBackgroundColorsFromCorners(imageData: ImageData): {
  isCheckerboard: boolean;
  color1: { r: number; g: number; b: number; hex: string };
  color2: { r: number; g: number; b: number; hex: string };
} {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  const borderThickness = 20;
  const step = 8;
  const pixels: { r: number; g: number; b: number; luminance: number }[] = [];

  // Sample along the borders (Top, Bottom, Left, Right) to be robust against solid margins/borders
  // Top and Bottom strips
  for (let y = 0; y < borderThickness; y += 2) {
    for (let x = 0; x < width; x += step) {
      // Top
      const idxT = (y * width + x) * 4;
      if (idxT < data.length && data[idxT + 3] > 50) {
        const r = data[idxT];
        const g = data[idxT + 1];
        const b = data[idxT + 2];
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        pixels.push({ r, g, b, luminance });
      }
      // Bottom
      const by = height - 1 - y;
      if (by >= 0) {
        const idxB = (by * width + x) * 4;
        if (idxB < data.length && data[idxB + 3] > 50) {
          const r = data[idxB];
          const g = data[idxB + 1];
          const b = data[idxB + 2];
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          pixels.push({ r, g, b, luminance });
        }
      }
    }
  }

  // Left and Right strips (excluding corners we already sampled)
  for (let x = 0; x < borderThickness; x += 2) {
    for (let y = borderThickness; y < height - borderThickness; y += step) {
      // Left
      const idxL = (y * width + x) * 4;
      if (idxL < data.length && data[idxL + 3] > 50) {
        const r = data[idxL];
        const g = data[idxL + 1];
        const b = data[idxL + 2];
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        pixels.push({ r, g, b, luminance });
      }
      // Right
      const rx = width - 1 - x;
      if (rx >= 0) {
        const idxR = (y * width + rx) * 4;
        if (idxR < data.length && data[idxR + 3] > 50) {
          const r = data[idxR];
          const g = data[idxR + 1];
          const b = data[idxR + 2];
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          pixels.push({ r, g, b, luminance });
        }
      }
    }
  }

  // If borders are empty/transparent, fallback to corners
  if (pixels.length < 20) {
    const patchSize = 15;
    const corners = [
      { xStart: 0, yStart: 0 },
      { xStart: Math.max(0, width - patchSize), yStart: 0 },
      { xStart: 0, yStart: Math.max(0, height - patchSize) },
      { xStart: Math.max(0, width - patchSize), yStart: Math.max(0, height - patchSize) },
    ];
    for (const corner of corners) {
      for (let dy = 0; dy < patchSize; dy++) {
        for (let dx = 0; dx < patchSize; dx++) {
          const px = corner.xStart + dx;
          const py = corner.yStart + dy;
          if (px < width && py < height) {
            const idx = (py * width + px) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];
            if (a > 50) {
              const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
              pixels.push({ r, g, b, luminance });
            }
          }
        }
      }
    }
  }

  const fallback = { r: 255, g: 255, b: 255, hex: "#ffffff" };

  if (pixels.length === 0) {
    return { isCheckerboard: false, color1: fallback, color2: fallback };
  }

  // Sort pixels by luminance to find median-split threshold
  const sorted = [...pixels].sort((a, b) => a.luminance - b.luminance);
  const medianIdx = Math.floor(sorted.length / 2);

  // Split pixels into two groups based on median luminance
  // Using median splits the groups exactly in half, separating grid square colors perfectly
  const darkPixels = sorted.slice(0, medianIdx);
  const brightPixels = sorted.slice(medianIdx);

  if (darkPixels.length === 0 || brightPixels.length === 0) {
    const rSum = pixels.reduce((sum, p) => sum + p.r, 0);
    const gSum = pixels.reduce((sum, p) => sum + p.g, 0);
    const bSum = pixels.reduce((sum, p) => sum + p.b, 0);
    const r = Math.round(rSum / pixels.length);
    const g = Math.round(gSum / pixels.length);
    const b = Math.round(bSum / pixels.length);
    const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    const color = { r, g, b, hex };
    return { isCheckerboard: false, color1: color, color2: color };
  }

  // Bright cluster average
  const rSum1 = brightPixels.reduce((sum, p) => sum + p.r, 0);
  const gSum1 = brightPixels.reduce((sum, p) => sum + p.g, 0);
  const bSum1 = brightPixels.reduce((sum, p) => sum + p.b, 0);
  const r1 = Math.round(rSum1 / brightPixels.length);
  const g1 = Math.round(gSum1 / brightPixels.length);
  const b1 = Math.round(bSum1 / brightPixels.length);
  const hex1 = "#" + ((1 << 24) + (r1 << 16) + (g1 << 8) + b1).toString(16).slice(1);
  const color1 = { r: r1, g: g1, b: b1, hex: hex1 };

  // Dark cluster average
  const rSum2 = darkPixels.reduce((sum, p) => sum + p.r, 0);
  const gSum2 = darkPixels.reduce((sum, p) => sum + p.g, 0);
  const bSum2 = darkPixels.reduce((sum, p) => sum + p.b, 0);
  const r2 = Math.round(rSum2 / darkPixels.length);
  const g2 = Math.round(gSum2 / darkPixels.length);
  const b2 = Math.round(bSum2 / darkPixels.length);
  const hex2 = "#" + ((1 << 24) + (r2 << 16) + (g2 << 8) + b2).toString(16).slice(1);
  const color2 = { r: r2, g: g2, b: b2, hex: hex2 };

  // Calculate Euclidean distance between bright and dark cluster averages
  const dist = Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
  
  // If the Euclidean RGB distance between clusters is significant (> 15), it is a checkerboard!
  // Normal solid backgrounds will have very small variance (< 10 Euclidean distance)
  const isCheckerboard = dist > 15;

  return {
    isCheckerboard,
    color1,
    color2: isCheckerboard ? color2 : color1
  };
}

export interface ChromaColorOption {
  name: "Green" | "Magenta" | "Cyan";
  hex: string;
  rgb: { r: number; g: number; b: number };
  hueRange: { min: number; max: number };
}

export const CHROMA_OPTIONS: ChromaColorOption[] = [
  { name: "Green", hex: "#00ff00", rgb: { r: 0, g: 255, b: 0 }, hueRange: { min: 35, max: 85 } },
  { name: "Magenta", hex: "#ff00ff", rgb: { r: 255, g: 0, b: 255 }, hueRange: { min: 135, max: 165 } },
  { name: "Cyan", hex: "#00ffff", rgb: { r: 0, g: 255, b: 255 }, hueRange: { min: 75, max: 105 } },
];

/**
 * Automatically inspects the image design to find which candidate chroma color is the SAFEST.
 * Safe chroma color = the color with the least presence in the subject design.
 */
export function detectSafestChromaColor(imageData: ImageData): ChromaColorOption {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  // Sample a grid of pixels to check color presence
  const sampleStep = Math.max(1, Math.floor(Math.sqrt((width * height) / 1000))); // Sample ~1000 pixels
  const presenceCounts = [0, 0, 0]; // Green, Magenta, Cyan

  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      // Only analyze opaque, foreground-ish pixels
      if (a > 100) {
        const { h, s, v } = rgbToHsv(r, g, b);

        // Filter out desaturated or dark pixels (grays, whites, shadows don't clash with primary backdrops)
        if (s > 40 && v > 40) {
          // Green Hue range: 35 to 85 (OpenCV scale 0-180)
          if (h >= 35 && h <= 85) {
            presenceCounts[0]++;
          }
          // Magenta/Pink Hue range: 135 to 170 (OpenCV scale 0-180)
          else if (h >= 135 && h <= 170) {
            presenceCounts[1]++;
          }
          // Cyan/Teal/Blue Hue range: 75 to 125 (OpenCV scale 0-180)
          else if (h >= 75 && h <= 125) {
            presenceCounts[2]++;
          }
        }
      }
    }
  }

  // Find the candidate color with the absolute lowest presence count
  let minIdx = 0;
  let minCount = presenceCounts[0];

  for (let i = 1; i < presenceCounts.length; i++) {
    if (presenceCounts[i] < minCount) {
      minCount = presenceCounts[i];
      minIdx = i;
    }
  }

  return CHROMA_OPTIONS[minIdx];
}

/**
 * Detects if a pixel at (px, py) is part of a checkerboard grid pattern
 * by examining its neighborhood for alternating color1 and color2 pixels.
 */
export function isPixelInCheckerboardGrid(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  px: number,
  py: number,
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number },
  tolerance: number = 30
): boolean {
  const halfSize = 4;
  let count1 = 0;
  let count2 = 0;
  let countOther = 0;
  let total = 0;

  for (let dy = -halfSize; dy <= halfSize; dy++) {
    const y = py + dy;
    if (y < 0 || y >= height) continue;

    for (let dx = -halfSize; dx <= halfSize; dx++) {
      const x = px + dx;
      if (x < 0 || x >= width) continue;

      total++;
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      if (a < 10) {
        count1++;
        continue;
      }

      const d1 = Math.abs(r - color1.r) + Math.abs(g - color1.g) + Math.abs(b - color1.b);
      const d2 = Math.abs(r - color2.r) + Math.abs(g - color2.g) + Math.abs(b - color2.b);

      if (d1 < tolerance) {
        count1++;
      } else if (d2 < tolerance) {
        count2++;
      } else {
        countOther++;
      }
    }
  }

  if (total === 0) return false;
  const pct1 = count1 / total;
  const pct2 = count2 / total;
  const pctOther = countOther / total;

  // Checkerboard grid has substantial presence of both colors and very little other colors
  return pct1 > 0.15 && pct2 > 0.15 && pctOther < 0.25;
}

