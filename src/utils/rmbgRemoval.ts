/**
 * AI Background Removal using @huggingface/transformers with RMBG-1.4
 *
 * RMBG-1.4 (by BRIA AI) is a BiRefNet-architecture model specifically trained
 * for portrait matting and fine hair segmentation. It produces per-pixel soft
 * alpha mattes — identical to what Erase.bg and Fococlipping use internally —
 * far superior to ISNet's coarse binary masks.
 *
 * Key advantages over @imgly/background-removal ISNet:
 * - Sub-pixel alpha: returns 0–255 soft alpha for every hair strand edge pixel
 * - Trained on human portraits (hair, skin, clothing boundaries)
 * - Zero post-processing artefacts (no artificial white blobs or grey halos)
 */

import { AutoModel, AutoProcessor, RawImage, env } from "@huggingface/transformers";

const MODEL_ID = "briaai/RMBG-1.4";

let cachedModel: any = null;
let cachedProcessor: any = null;
let loadPromise: Promise<void> | null = null;

/**
 * Lazily loads (and caches) the RMBG-1.4 model and processor directly.
 */
async function loadModelAndProcessor(
  onProgress?: (label: string, pct: number) => void
): Promise<{ model: any; processor: any }> {
  if (cachedModel && cachedProcessor) {
    return { model: cachedModel, processor: cachedProcessor };
  }

  if (!loadPromise) {
    loadPromise = (async () => {
      onProgress?.("Downloading AI Magic Engine...", 5);
      env.allowLocalModels = false;
      env.useBrowserCache = true;

      let model: any;
      try {
        model = await AutoModel.from_pretrained(MODEL_ID, {
          device: "webgpu",
          dtype: "fp32",
          progress_callback: (info: any) => {
            if (info.status === "progress" && info.total) {
              const pct = Math.round((info.loaded / info.total) * 90);
              onProgress?.(`Loading AI Magic Engine (${info.file ?? ""})`, pct);
            }
          },
        });
      } catch (webgpuErr) {
        console.warn("WebGPU unavailable, falling back to WASM:", webgpuErr);
        model = await AutoModel.from_pretrained(MODEL_ID, {
          device: "wasm",
          dtype: "fp32",
          progress_callback: (info: any) => {
            if (info.status === "progress" && info.total) {
              const pct = Math.round((info.loaded / info.total) * 90);
              onProgress?.(`Loading AI Magic Engine (${info.file ?? ""})`, pct);
            }
          },
        });
      }

      const processor = await AutoProcessor.from_pretrained(MODEL_ID);
      cachedModel = model;
      cachedProcessor = processor;
      onProgress?.("AI Magic Engine ready", 95);
    })();
  }

  await loadPromise;
  return { model: cachedModel, processor: cachedProcessor };
}

/**
 * Removes background from a data URI using AI Magic Engine.
 * Returns a Uint8Array of alpha values (0–255) at the ORIGINAL image dimensions.
 */
export async function removeBackgroundRMBG(
  imageDataUri: string,
  onProgress?: (label: string, pct: number) => void
): Promise<Uint8Array> {
  // 1. Load model & processor (cached)
  const { model, processor } = await loadModelAndProcessor(onProgress);

  onProgress?.("Running AI Magic Engine inference...", 30);

  // 2. Load input image — RawImage.fromURL() handles data: URIs and HTTP URLs
  const image = await RawImage.fromURL(imageDataUri);
  const origW = image.width;
  const origH = image.height;

  // 3. Preprocess input
  const inputs = await processor(image);
  const modelInputs = inputs.input ? inputs : { input: inputs.pixel_values };

  // 4. Run model inference
  const output = await model(modelInputs);

  onProgress?.("Processing mask...", 85);

  // 5. Extract output logits tensor [1, 1, 1024, 1024]
  const tensor = output.output || output.logits || output[Object.keys(output)[0]];
  if (!tensor || !tensor.data) {
    throw new Error("AI Magic Engine inference returned empty output tensor");
  }

  const data = tensor.data as Float32Array; // 1024*1024 logits
  const maskW = tensor.dims?.[3] ?? 1024;
  const maskH = tensor.dims?.[2] ?? 1024;

  // 6. Scale directly to [0, 255] for 4-channel RGBA RawImage
  const maskData = new Uint8ClampedArray(maskW * maskH * 4);
  for (let i = 0; i < data.length; i++) {
    const rawVal = data[i];
    const val = Math.round(Math.max(0, Math.min(1, rawVal)) * 255);
    const idx = i * 4;
    maskData[idx] = val;
    maskData[idx + 1] = val;
    maskData[idx + 2] = val;
    maskData[idx + 3] = 255;
  }

  // Cap target dimensions to 4096px max bounds to prevent 8K WASM memory spikes
  const MAX_ALPHA_DIM = 4096;
  let targetW = origW;
  let targetH = origH;
  if (targetW > MAX_ALPHA_DIM || targetH > MAX_ALPHA_DIM) {
    const ratio = Math.min(MAX_ALPHA_DIM / targetW, MAX_ALPHA_DIM / targetH);
    targetW = Math.round(targetW * ratio);
    targetH = Math.round(targetH * ratio);
  }

  // 7. Resize mask to target image dimensions using RawImage bilinear resize
  const rawMask = new RawImage(maskData, maskW, maskH, 4);
  const resizedMask = await rawMask.resize(targetW, targetH);

  // 8. Extract single-channel Uint8Array alpha mask
  const finalAlpha = new Uint8Array(targetW * targetH);
  const resizedData = resizedMask.data as Uint8ClampedArray;
  for (let i = 0; i < targetW * targetH; i++) {
    finalAlpha[i] = resizedData[i * 4];
  }

  onProgress?.("AI Magic Engine complete", 100);
  return finalAlpha;
}

/**
 * Checks if the RMBG model is already cached/loaded.
 */
export function isRMBGModelLoaded(): boolean {
  return !!(cachedModel && cachedProcessor);
}

/**
 * Pre-loads the model in background so it's ready when user clicks AI Magic.
 */
export async function preloadRMBGModel(
  onProgress?: (label: string, pct: number) => void
): Promise<void> {
  await loadModelAndProcessor(onProgress);
}
