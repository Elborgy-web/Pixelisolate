/**
 * Local Background Estimation & True-Foreground Decontamination.
 *
 * The problem this solves:
 * When a subject (hair, fur) sits on a NON-uniform background — a gradient, a
 * two-tone studio sweep, uneven lighting — the classic "subtract one global
 * background colour" despill is wrong everywhere except the single point that
 * colour was sampled from. On a left→right grey gradient it leaves grey webbing
 * between the strands and a colour cast on the edges, because the true local
 * background behind each hair strand differs from the sampled global colour.
 *
 * The fix (matches the PhotoRoom / Bayesian-matting foreground-recovery pipeline):
 *   1. Treat every confidently-background pixel (alpha ≈ 0) as a known sample of
 *      the background colour at that location.
 *   2. Inpaint / diffuse those samples across the whole image with a multi-scale
 *      pull-push pyramid, producing a smooth per-pixel background colour FIELD
 *      B(x,y) — including behind the subject.
 *   3. For each semi-transparent edge pixel, recover the true foreground colour
 *      via the compositing equation  I = αF + (1-α)B   ⇒   F = (I − (1−α)B) / α.
 *
 * Because B is local, this cancels a gradient background just as well as a flat
 * one, and there is no single "spill colour" to leak into the result.
 */

export interface BackgroundField {
  r: Float32Array;
  g: Float32Array;
  b: Float32Array;
  width: number;
  height: number;
}

/**
 * Build a smooth per-pixel background colour field by pull-push pyramid
 * inpainting of the known-background pixels (alpha <= bgThreshold).
 *
 * Pull-push (a.k.a. "push-pull" / scattered-data interpolation, Gortler et al.)
 * is O(n) and fills large holes (the subject body) with smoothly extrapolated
 * background colour. We only ever READ the field at semi-transparent edge pixels,
 * which are adjacent to known background, so the field is highly accurate exactly
 * where it is used; deep-interior extrapolation (behind the face) is never read
 * for decontamination.
 */
export function buildBackgroundField(
  imageData: ImageData,
  alpha: Uint8Array,
  bgThreshold: number = 30
): BackgroundField {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const n = width * height;

  // Level 0: seed known-background pixels with weight 1, everything else weight 0.
  const r0 = new Float32Array(n);
  const g0 = new Float32Array(n);
  const b0 = new Float32Array(n);
  const w0 = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    if (alpha[i] <= bgThreshold) {
      r0[i] = data[i * 4];
      g0[i] = data[i * 4 + 1];
      b0[i] = data[i * 4 + 2];
      w0[i] = 1;
    }
  }

  type Level = { r: Float32Array; g: Float32Array; b: Float32Array; w: Float32Array; W: number; H: number };
  const levels: Level[] = [{ r: r0, g: g0, b: b0, w: w0, W: width, H: height }];

  // PULL phase: build a weighted pyramid, halving resolution until 1×1.
  let cur = levels[0];
  while (cur.W > 1 || cur.H > 1) {
    const W2 = Math.max(1, cur.W >> 1);
    const H2 = Math.max(1, cur.H >> 1);
    const dr = new Float32Array(W2 * H2);
    const dg = new Float32Array(W2 * H2);
    const db = new Float32Array(W2 * H2);
    const dw = new Float32Array(W2 * H2);
    for (let y = 0; y < H2; y++) {
      for (let x = 0; x < W2; x++) {
        let ar = 0, ag = 0, ab = 0, aw = 0;
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            const sx = Math.min(cur.W - 1, x * 2 + dx);
            const sy = Math.min(cur.H - 1, y * 2 + dy);
            const si = sy * cur.W + sx;
            const wgt = cur.w[si];
            ar += cur.r[si] * wgt;
            ag += cur.g[si] * wgt;
            ab += cur.b[si] * wgt;
            aw += wgt;
          }
        }
        const di = y * W2 + x;
        if (aw > 0) {
          dr[di] = ar / aw;
          dg[di] = ag / aw;
          db[di] = ab / aw;
          dw[di] = Math.min(1, aw); // saturate weight to [0,1]
        }
      }
    }
    cur = { r: dr, g: dg, b: db, w: dw, W: W2, H: H2 };
    levels.push(cur);
  }

  // PUSH phase: from coarsest to finest, fill unknown (low-weight) pixels with the
  // upsampled colour from the coarser level; keep known pixels as-is.
  for (let l = levels.length - 2; l >= 0; l--) {
    const fine = levels[l];
    const coarse = levels[l + 1];
    for (let y = 0; y < fine.H; y++) {
      for (let x = 0; x < fine.W; x++) {
        const fi = y * fine.W + x;
        const cx = Math.min(coarse.W - 1, x >> 1);
        const cy = Math.min(coarse.H - 1, y >> 1);
        const ci = cy * coarse.W + cx;
        const a = fine.w[fi]; // confidence this pixel already has a real value
        fine.r[fi] = fine.r[fi] * a + coarse.r[ci] * (1 - a);
        fine.g[fi] = fine.g[fi] * a + coarse.g[ci] * (1 - a);
        fine.b[fi] = fine.b[fi] * a + coarse.b[ci] * (1 - a);
        fine.w[fi] = Math.max(a, coarse.w[ci] * 0.999);
      }
    }
  }

  const lvl0 = levels[0];
  return { r: lvl0.r, g: lvl0.g, b: lvl0.b, width, height };
}

/**
 * Decontaminate an RGBA cutout in place using the local background field.
 *
 * For each semi-transparent pixel, recovers the true foreground colour with
 * F = (I − (1−α)·B) / α, removing the mixed-in background (grey webbing, colour
 * cast). Fully-opaque and fully-transparent pixels are left untouched.
 *
 * @param strength 0..1 — blend between original colour (0) and fully-recovered
 *   foreground (1). 1 = maximum decontamination.
 */
export function decontaminateWithField(
  outputData: ImageData,
  alpha: Uint8Array,
  field: BackgroundField,
  strength: number = 1
): void {
  const width = outputData.width;
  const height = outputData.height;
  const data = outputData.data;
  const n = width * height;

  for (let i = 0; i < n; i++) {
    const av = data[i * 4 + 3];
    if (av <= 2) continue; // process all non-zero alpha pixels

    const I_r = data[i * 4];
    const I_g = data[i * 4 + 1];
    const I_b = data[i * 4 + 2];

    const B_r = field.r[i];
    const B_g = field.g[i];
    const B_b = field.b[i];

    // Local Background Color Distance & Luminance Alpha Suppression:
    // 1. If pixel's RGB matches local background field B(x,y) (distToBg < 60), suppress alpha
    // 2. If background is light (lumB > 160) and pixel is light near background (lumI > lumB - 25),
    //    suppress alpha of trapped background gap pixels inside hair loops!
    const dr = I_r - B_r, dg = I_g - B_g, db = I_b - B_b;
    const distToBg = Math.sqrt(dr * dr + dg * dg + db * db);

    const lumI = 0.299 * I_r + 0.587 * I_g + 0.114 * I_b;
    const lumB = 0.299 * B_r + 0.587 * B_g + 0.114 * B_b;

    let cleanAv = av;
    if (distToBg < 60) {
      const bgWeight = distToBg <= 15 ? 1 : 1 - (distToBg - 15) / 45;
      const keepFactor = (1 - bgWeight) * (1 - bgWeight);
      cleanAv = Math.round(av * keepFactor);
    } else if (lumB > 160 && lumI > lumB - 25) {
      const diffRatio = Math.max(0, (lumB - lumI) / 25);
      cleanAv = Math.round(av * diffRatio);
    }

    if (cleanAv <= 2) {
      data[i * 4 + 3] = 0;
      data[i * 4] = 0;
      data[i * 4 + 1] = 0;
      data[i * 4 + 2] = 0;
      continue;
    }

    data[i * 4 + 3] = cleanAv;
    const a = cleanAv / 255;
    const eps = Math.max(a, 0.08);

    // True foreground color unmixing: I = a*F + (1-a)*B => F = (I - (1-a)*B) / a
    let F_r = (I_r - (1 - a) * B_r) / eps;
    let F_g = (I_g - (1 - a) * B_g) / eps;
    let F_b = (I_b - (1 - a) * B_b) / eps;

    // Luminance Constraint for Hair/Dark Subjects:
    // If background is bright (lumB > 140), hair RGB cannot be brighter than observed pixel I,
    // enforcing pure dark hair color and preventing any light-grey background tint from surviving!
    if (lumB > 140) {
      F_r = Math.min(I_r, F_r);
      F_g = Math.min(I_g, F_g);
      F_b = Math.min(I_b, F_b);
    }

    // Clamp recovered true foreground to valid 0..255 range
    F_r = Math.max(0, Math.min(255, F_r));
    F_g = Math.max(0, Math.min(255, F_g));
    F_b = Math.max(0, Math.min(255, F_b));

    data[i * 4] = Math.round(I_r * (1 - strength) + F_r * strength);
    data[i * 4 + 1] = Math.round(I_g * (1 - strength) + F_g * strength);
    data[i * 4 + 2] = Math.round(I_b * (1 - strength) + F_b * strength);
  }

}




