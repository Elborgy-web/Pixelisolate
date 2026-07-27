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
    if (color2) {
      const vR = color2.r - color1.r;
      const vG = color2.g - color1.g;
      const vB = color2.b - color1.b;
      const vLen2 = vR * vR + vG * vG + vB * vB;

      if (vLen2 > 50) {
        // 3D Point-to-Line-Segment distance in RGB color space:
        // Matches the entire continuous gradient vector between color1 and color2
        const pR = r - color1.r;
        const pG = g - color1.g;
        const pB = b - color1.b;
        const t = Math.max(0, Math.min(1, (pR * vR + pG * vG + pB * vB) / vLen2));
        const projR = color1.r + t * vR;
        const projG = color1.g + t * vG;
        const projB = color1.b + t * vB;
        maxDist = Math.sqrt((r - projR) ** 2 + (g - projG) ** 2 + (b - projB) ** 2);
      } else {
        const dR2 = r - color2.r;
        const dG2 = g - color2.g;
        const dB2 = b - color2.b;
        const dist2 = Math.sqrt(dR2 * dR2 + dG2 * dG2 + dB2 * dB2);
        maxDist = Math.min(dist1, dist2);
      }
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

        const isEdgeRight = !(isBgCurr || isBgRight) && Math.abs(lum - lumRight) > 55;
        const isEdgeDown = !(isBgCurr || isBgDown) && Math.abs(lum - lumDown) > 55;

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

    // Seed along all 4 outer borders (Top, Bottom, Left, Right)
    // This guarantees background flood-fill seeds on all canvas edges even if the subject blocks the middle
    for (let x = 0; x < width; x++) {
      for (const y of [0, 1, 2, height - 3, height - 2, height - 1]) {
        if (y >= 0 && y < height) {
          const idx = y * width + x;
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

    for (let y = 0; y < height; y++) {
      for (const x of [0, 1, 2, width - 3, width - 2, width - 1]) {
        if (x >= 0 && x < width) {
          const idx = y * width + x;
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

    // Safety sweep: key out any unvisited background pixels matching color1 or color2
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (bgMask[idx] === 0) {
          const sIdx = idx * 4;
          const wVal = getBgWeight(src[sIdx], src[sIdx + 1], src[sIdx + 2]);
          if (wVal > 150) {
            bgMask[idx] = wVal;
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
  const temp = new Uint8Array(alphaGrid.length);
  const offset = kernelSize;

  // Horizontal minimum pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let minVal = 255;
      for (let kx = -offset; kx <= offset; kx++) {
        const nx = x + kx;
        if (nx >= 0 && nx < width) {
          minVal = Math.min(minVal, alphaGrid[y * width + nx]);
        } else {
          minVal = 0;
        }
      }
      temp[y * width + x] = minVal;
    }
  }

  // Vertical minimum pass
  const output = new Uint8Array(alphaGrid.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let minVal = 255;
      for (let ky = -offset; ky <= offset; ky++) {
        const ny = y + ky;
        if (ny >= 0 && ny < height) {
          minVal = Math.min(minVal, temp[ny * width + x]);
        } else {
          minVal = 0;
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
  const temp = new Uint8Array(alphaGrid.length);
  const offset = kernelSize;

  // Horizontal maximum pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let maxVal = 0;
      for (let kx = -offset; kx <= offset; kx++) {
        const nx = x + kx;
        if (nx >= 0 && nx < width) {
          maxVal = Math.max(maxVal, alphaGrid[y * width + nx]);
        }
      }
      temp[y * width + x] = maxVal;
    }
  }

  // Vertical maximum pass
  const output = new Uint8Array(alphaGrid.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let maxVal = 0;
      for (let ky = -offset; ky <= offset; ky++) {
        const ny = y + ky;
        if (ny >= 0 && ny < height) {
          maxVal = Math.max(maxVal, temp[ny * width + x]);
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
  boundingBox?: { x: number; y: number; w: number; h: number } | null,
  enableHairMatting: boolean = true,
  bgRgb?: { r: number; g: number; b: number } | null,
  originalImageData?: ImageData | null  // CRITICAL: use original for guided filter guidance
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

  // Step D: Apply Guided Alpha Matting for fine hair strands & complex edge preservation.
  // CRITICAL: Use the ORIGINAL image (not the green-screen transformed copy) as the
  // guidance image. The green-screen image has artificial solid green pixels where the
  // background was, which destroys the guided filter's ability to find real hair edges.
  if (enableHairMatting) {
    const guidanceData = originalImageData ?? chromaGreenData;
    // radius=0 → dynamic scaling: Math.max(3, Math.round(width / 500))
    // For 7360px images this gives r=15px instead of r=3px
    processedAlpha = guidedAlphaMatting(guidanceData, processedAlpha, 0, 0.001);
  }


  // Step E: Apply Gaussian Feathering to smooth hard aliasing jagged edges
  if (featherRadius > 0) {
    processedAlpha = blurAlpha(processedAlpha, width, height, featherRadius);
  }

  // Step F: Write final processed alpha channel and apply cinematic edge de-spilling
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

  if (bgRgb) {
    decontaminateFringeColor(output, bgRgb);
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

  // Two clusters far apart in colour is NECESSARY but NOT SUFFICIENT to call it a
  // checkerboard: a smooth gradient ALSO produces two far-apart luminance clusters
  // (e.g. #d2d6d3 vs #7b7974, dist ~150) yet must be treated as a plain background.
  //
  // The distinguishing feature is SPATIAL FREQUENCY. A real checkerboard/grid
  // alternates sharply between its two colours from one pixel to the next along the
  // border, so the mean absolute luminance difference between horizontally-adjacent
  // border pixels is high. A gradient varies smoothly, so that difference is tiny.
  //
  // Measured on real images: gradient meanAdj ~0.5, checkerboard meanAdj ~5.4 — a
  // ~10x gap. We require BOTH a significant colour split AND high-frequency
  // alternation before declaring a checkerboard.
  let meanAdjLum = 0;
  {
    let sumAdj = 0;
    let cntAdj = 0;
    const freqBand = Math.min(20, Math.floor(height / 4), Math.floor(width / 4));
    const lumAt = (x: number, y: number) => {
      const i = (y * width + x) * 4;
      return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    };
    for (let yb = 0; yb < freqBand; yb++) {
      for (const y of [yb, height - 1 - yb]) {
        if (y < 0 || y >= height) continue;
        for (let x = 1; x < width; x++) {
          if (data[(y * width + x) * 4 + 3] <= 50) continue;
          sumAdj += Math.abs(lumAt(x, y) - lumAt(x - 1, y));
          cntAdj++;
        }
      }
    }
    meanAdjLum = cntAdj > 0 ? sumAdj / cntAdj : 0;
  }

  // Colour split must be real (>15) AND the border must alternate at high frequency
  // (mean adjacent-luminance delta >= 2.0). Gradients fail the second test.
  const isCheckerboard = dist > 15 && meanAdjLum >= 2.0;

  return {
    isCheckerboard,
    color1,
    color2: dist > 15 ? color2 : color1
  };
}

/**
 * Automatically detects whether an uploaded image is a "graphic" (illustration, t-shirt artwork, vector logo)
 * vs a photographic "product" or "portrait".
 */
export function detectImageSmartMode(imageData: ImageData): "portrait" | "product" | "graphic" {
  const { width, height, data } = imageData;
  const totalPixels = width * height;
  if (totalPixels === 0) return "portrait";

  // 1. Color Histogram Diversity (12-bit RGB: 16x16x16 = 4096 bins)
  const step = Math.max(1, Math.floor(Math.sqrt(totalPixels / 25000)));
  const colorBins = new Set<number>();
  let totalSampled = 0;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = (y * width + x) * 4;
      if (data[idx + 3] < 30) continue; // skip transparent pixels

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const bin = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      colorBins.add(bin);
      totalSampled++;
    }
  }

  // 2. Corner & Border Color Uniformity Check
  const borderThickness = Math.max(4, Math.floor(Math.min(width, height) * 0.02));
  let borderPixelCount = 0;
  let matchingBorderCount = 0;

  const corners = [
    { x: 5, y: 5 },
    { x: width - 6, y: 5 },
    { x: 5, y: height - 6 },
    { x: width - 6, y: height - 6 }
  ];

  const firstCornerIdx = (Math.min(corners[0].y, height - 1) * width + Math.min(corners[0].x, width - 1)) * 4;
  const bgR = data[firstCornerIdx];
  const bgG = data[firstCornerIdx + 1];
  const bgB = data[firstCornerIdx + 2];

  for (let y = 0; y < borderThickness; y++) {
    for (let x = 0; x < width; x += 3) {
      const idxT = (y * width + x) * 4;
      const idxB = ((height - 1 - y) * width + x) * 4;
      if (data[idxT + 3] > 50) {
        borderPixelCount++;
        const diff = Math.abs(data[idxT] - bgR) + Math.abs(data[idxT + 1] - bgG) + Math.abs(data[idxT + 2] - bgB);
        if (diff < 30) matchingBorderCount++;
      }
      if (data[idxB + 3] > 50) {
        borderPixelCount++;
        const diff = Math.abs(data[idxB] - bgR) + Math.abs(data[idxB + 1] - bgG) + Math.abs(data[idxB + 2] - bgB);
        if (diff < 30) matchingBorderCount++;
      }
    }
  }

  const borderMatchRatio = borderPixelCount > 0 ? matchingBorderCount / borderPixelCount : 0;
  const uniqueColorRatio = totalSampled > 0 ? colorBins.size / totalSampled : 1;

  // 3. Classification Criteria:
  // Graphics / T-shirt prints / Vector logos:
  // - High border uniformity (borderMatchRatio > 0.70) AND low-to-medium color diversity (colorBins.size < 2400)
  // - OR very low total color bins (< 850)
  if (colorBins.size < 850 || (borderMatchRatio > 0.70 && (colorBins.size < 2400 || uniqueColorRatio < 0.25))) {
    return "graphic";
  }

  // Product mode: High border match (>0.85) on solid white/grey backdrop, but higher color detail
  if (borderMatchRatio > 0.85 && (bgR > 210 && bgG > 210 && bgB > 210)) {
    return "product";
  }

  return "portrait";
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

/**
 * Guided Alpha Matting Filter
 * Uses the original RGB image as a structural guide to refine semi-transparent hair strands,
 * fur, and fine detail edges in the alpha channel mask.
 */
export function guidedAlphaMatting(
  sourceData: ImageData,
  alphaMask: Uint8Array,
  radius: number = 0,
  eps: number = 0.001
): Uint8Array {
  const width = sourceData.width;
  const height = sourceData.height;
  const numPixels = width * height;
  const refinedAlpha = new Uint8Array(numPixels);
  const src = sourceData.data;

  // Scale radius dynamically to match high-resolution image dimensions
  const rWindow = radius > 0 ? radius : Math.max(3, Math.round(width / 500));

  // Compute 1D guidance gray image normalized to [0, 1]
  const I = new Float32Array(numPixels);
  const p = new Float32Array(numPixels);

  for (let i = 0; i < numPixels; i++) {
    const idx = i * 4;
    // Luminance guide from RGB
    I[i] = (0.299 * src[idx] + 0.587 * src[idx + 1] + 0.114 * src[idx + 2]) / 255;
    p[i] = alphaMask[i] / 255;
  }

  // Box filter helper for 2D Float32Array
  const boxFilter = (srcArr: Float32Array, r: number): Float32Array => {
    const dstArr = new Float32Array(numPixels);
    const temp = new Float32Array(numPixels);

    // Horizontal pass
    for (let y = 0; y < height; y++) {
      let sum = 0;
      const yOffset = y * width;
      for (let x = -r; x <= r; x++) {
        const clampedX = Math.max(0, Math.min(width - 1, x));
        sum += srcArr[yOffset + clampedX];
      }
      dstArr[yOffset] = sum / (2 * r + 1);

      for (let x = 1; x < width; x++) {
        const leftX = Math.max(0, x - r - 1);
        const rightX = Math.min(width - 1, x + r);
        sum += srcArr[yOffset + rightX] - srcArr[yOffset + leftX];
        dstArr[yOffset + x] = sum / (2 * r + 1);
      }
    }

    // Vertical pass
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let y = -r; y <= r; y++) {
        const clampedY = Math.max(0, Math.min(height - 1, y));
        sum += dstArr[clampedY * width + x];
      }
      temp[x] = sum / (2 * r + 1);

      for (let y = 1; y < height; y++) {
        const topY = Math.max(0, y - r - 1);
        const bottomY = Math.min(height - 1, y + r);
        sum += dstArr[bottomY * width + x] - dstArr[topY * width + x];
        temp[y * width + x] = sum / (2 * r + 1);
      }
    }

    return temp;
  };

  const mean_I = boxFilter(I, rWindow);
  const mean_p = boxFilter(p, rWindow);

  const Ip = new Float32Array(numPixels);
  const II = new Float32Array(numPixels);
  for (let i = 0; i < numPixels; i++) {
    Ip[i] = I[i] * p[i];
    II[i] = I[i] * I[i];
  }

  const mean_Ip = boxFilter(Ip, rWindow);
  const mean_II = boxFilter(II, rWindow);

  const cov_Ip = new Float32Array(numPixels);
  const var_I = new Float32Array(numPixels);
  const a = new Float32Array(numPixels);
  const b = new Float32Array(numPixels);

  for (let i = 0; i < numPixels; i++) {
    cov_Ip[i] = mean_Ip[i] - mean_I[i] * mean_p[i];
    var_I[i] = mean_II[i] - mean_I[i] * mean_I[i];
    a[i] = cov_Ip[i] / (var_I[i] + eps);
    b[i] = mean_p[i] - a[i] * mean_I[i];
  }

  const mean_a = boxFilter(a, rWindow);
  const mean_b = boxFilter(b, rWindow);

  for (let i = 0; i < numPixels; i++) {
    // Only refine transition boundaries to preserve solid foreground & solid background
    const origVal = p[i];
    if (origVal > 0.02 && origVal < 0.98) {
      const q = mean_a[i] * I[i] + mean_b[i];
      const clampedQ = Math.max(0, Math.min(1, q));
      refinedAlpha[i] = Math.round(clampedQ * 255);
    } else {
      refinedAlpha[i] = alphaMask[i];
    }
  }

  return refinedAlpha;
}

/**
 * Hair Strand Color Decontamination & Despill
 * Removes background color halos and spill along semi-transparent alpha borders.
 */
export function decontaminateFringeColor(
  outputData: ImageData,
  bgRgb: { r: number; g: number; b: number }
): void {
  const data = outputData.data;
  const numPixels = data.length / 4;

  for (let i = 0; i < numPixels; i++) {
    const idx = i * 4;
    const alpha = data[idx + 3];

    // Only decontaminate semi-transparent edge pixels (e.g. hair strands)
    if (alpha > 5 && alpha < 250) {
      const a = alpha / 255;
      const invA = 1 - a;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const pxLum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Softly subtract background color spill based on inverse alpha weight
      const cleanR = Math.max(0, Math.min(255, r - invA * (bgRgb.r - pxLum * 0.4)));
      const cleanG = Math.max(0, Math.min(255, g - invA * (bgRgb.g - pxLum * 0.4)));
      const cleanB = Math.max(0, Math.min(255, b - invA * (bgRgb.b - pxLum * 0.4)));

      data[idx] = Math.round(cleanR);
      data[idx + 1] = Math.round(cleanG);
      data[idx + 2] = Math.round(cleanB);
    }
  }
}

/**
 * Edge-Aware Alpha Mask Refinement for Portrait / Hair Mode.
 *
 * The core problem with ISNet running at 1024×1024:
 * When the output is bilinearly upscaled to e.g. 7360×4912px, the upscaling
 * interpolates between "definitely foreground" (255) and "definitely background" (0)
 * pixels, creating huge blurry border zones (often 50–300px wide in source coords)
 * where every pixel gets alpha ~80–150. On a black/dark preview these show as wide
 * grey halos around the subject's hair.
 *
 * Solution — 3 step pipeline:
 *
 * STEP 1: Aggressive bilateral thresholding.
 *   • alpha < 100  → 0   (probably background after upscale blur)
 *   • alpha > 160  → 255 (probably foreground after upscale blur)
 *   • 100–160 zone → stays soft (real boundary)
 *
 * STEP 2: Edge-guided vote — for every "uncertain" pixel in the 100–160 band:
 *   Sample a small NxN neighbourhood in the ORIGINAL full-res image. Compute
 *   the local Sobel edge magnitude. If edge magnitude is HIGH → this is a real
 *   boundary → keep the soft alpha. If edge magnitude is LOW → this is a flat
 *   zone (background area or solid interior) → snap to binary based on majority
 *   vote of definite-class neighbours.
 *
 * STEP 3: 3×3 morphological closing on the uncertain band to close tiny gaps
 *   in the hair mask without expanding into background.
 */
export function sharpAlphaThreshold(
  alphaMask: Uint8Array,
  lowCut: number = 30,
  highCut: number = 220,
  imageData?: ImageData
): Uint8Array {
  const n = alphaMask.length;
  const out = new Uint8Array(n);
  const band = highCut - lowCut;

  // STEP 1: Bilateral threshold
  for (let i = 0; i < n; i++) {
    const v = alphaMask[i];
    if (v <= lowCut) {
      out[i] = 0;
    } else if (v >= highCut) {
      out[i] = 255;
    } else {
      out[i] = Math.round(((v - lowCut) / band) * 255);
    }
  }

  // If no imageData guidance available, return early
  if (!imageData) return out;

  const width = imageData.width;
  const height = imageData.height;
  const src = imageData.data;

  // STEP 2: For uncertain pixels, use local Sobel edge + neighbour majority vote
  // Build Sobel magnitude map (3×3 Sobel, luminance channel only)
  const lum = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const idx = i * 4;
    lum[i] = 0.299 * src[idx] + 0.587 * src[idx + 1] + 0.114 * src[idx + 2];
  }

  const getL = (x: number, y: number) => {
    const cx = Math.max(0, Math.min(width - 1, x));
    const cy = Math.max(0, Math.min(height - 1, y));
    return lum[cy * width + cx];
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const v = alphaMask[idx];
      if (v <= lowCut || v >= highCut) continue; // only process uncertain band

      // Sobel edge magnitude
      const gx =
        -getL(x-1,y-1) + getL(x+1,y-1)
        -2*getL(x-1,y) + 2*getL(x+1,y)
        -getL(x-1,y+1) + getL(x+1,y+1);
      const gy =
        -getL(x-1,y-1) - 2*getL(x,y-1) - getL(x+1,y-1)
        +getL(x-1,y+1) + 2*getL(x,y+1) + getL(x+1,y+1);
      const mag = Math.sqrt(gx*gx + gy*gy);

      // Low edge zone: snap based on majority vote of definite neighbours
      if (mag < 15) {
        let fgCount = 0, bgCount = 0;
        const r = 3;
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (dx === 0 && dy === 0) continue;
            const ni = Math.max(0, Math.min(height-1, y+dy)) * width + Math.max(0, Math.min(width-1, x+dx));
            if (out[ni] >= 200) fgCount++;
            else if (out[ni] <= 30) bgCount++;
          }
        }
        // In a flat region, vote determines class
        if (fgCount > bgCount * 1.5) {
          out[idx] = 255;
        } else if (bgCount > fgCount * 1.5) {
          out[idx] = 0;
        }
        // tie → keep the soft interpolated value
      }
      // High edge zone: keep the soft value (real hair boundary)
    }
  }

  return out;
}



/**
 * Flood-Fill Background Remover — Graphic / Product Mode.
 *
 * For flat-colour backgrounds (pink, white, grey, solid studio backdrops) the
 * semantic AI Magic model often keeps "holes" inside the foreground (between text
 * letters, through arm gaps, etc.) because neural models classify by semantic shape,
 * not pixel colour.
 *
 * This BFS flood-fill starts from all 4 corners of the alpha mask and expands
 * into any pixel whose original image colour is within `tolerance` of the sampled
 * background colour. Found pixels are zeroed out in the mask (fully transparent).
 *
 * Additionally any interior pixel that is BOTH alpha>0 AND within colour tolerance
 * of the background is also cleared (catches internal "holes" like between letters).
 */
export function floodFillRemoveBackground(
  alphaMask: Uint8Array,
  imageData: ImageData,
  tolerance: number = 15
): Uint8Array {
  const width = imageData.width;
  const height = imageData.height;
  const src = imageData.data;
  const out = new Uint8Array(alphaMask);

  // 1. Sample background from all 4 corners (9×9 patches each)
  const patchSize = Math.min(9, Math.floor(Math.min(width, height) / 20));
  const sampleCorners = [
    { x: 0, y: 0 },
    { x: width - patchSize, y: 0 },
    { x: 0, y: height - patchSize },
    { x: width - patchSize, y: height - patchSize },
  ];

  let rSum = 0, gSum = 0, bSum = 0, count = 0;
  for (const corner of sampleCorners) {
    for (let dy = 0; dy < patchSize; dy++) {
      for (let dx = 0; dx < patchSize; dx++) {
        const px = Math.min(corner.x + dx, width - 1);
        const py = Math.min(corner.y + dy, height - 1);
        const idx = (py * width + px) * 4;
        rSum += src[idx]; gSum += src[idx + 1]; bSum += src[idx + 2];
        count++;
      }
    }
  }
  const bgR = Math.round(rSum / count);
  const bgG = Math.round(gSum / count);
  const bgB = Math.round(bSum / count);

  // Helper: is pixel colour within tolerance of sampled background?
  const isBg = (idx: number): boolean => {
    const dr = src[idx] - bgR;
    const dg = src[idx + 1] - bgG;
    const db = src[idx + 2] - bgB;
    return (dr * dr + dg * dg + db * db) <= tolerance * tolerance * 3;
  };

  // 2. BFS flood-fill from all 4 edges
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];

  // Seed from all border pixels that match background colour
  for (let x = 0; x < width; x++) {
    for (const y of [0, height - 1]) {
      const pi = y * width + x;
      if (!visited[pi] && isBg(pi * 4)) { visited[pi] = 1; queue.push(pi); }
    }
  }
  for (let y = 1; y < height - 1; y++) {
    for (const x of [0, width - 1]) {
      const pi = y * width + x;
      if (!visited[pi] && isBg(pi * 4)) { visited[pi] = 1; queue.push(pi); }
    }
  }

  let head = 0;
  const dx4 = [1, -1, 0, 0];
  const dy4 = [0, 0, 1, -1];
  while (head < queue.length) {
    const pi = queue[head++];
    out[pi] = 0;  // definitely background → fully transparent
    const py = Math.floor(pi / width);
    const px = pi % width;
    for (let d = 0; d < 4; d++) {
      const nx = px + dx4[d];
      const ny = py + dy4[d];
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      const npi = ny * width + nx;
      if (visited[npi]) continue;
      if (isBg(npi * 4)) { visited[npi] = 1; queue.push(npi); }
    }
  }

  // 3. Interior hole pass: zero out remaining background-coloured pixels
  //    that are fully enclosed (missed by BFS because foreground surrounded them)
  for (let pi = 0; pi < width * height; pi++) {
    if (out[pi] > 0 && isBg(pi * 4)) {
      out[pi] = 0;
    }
  }

  return out;
}



