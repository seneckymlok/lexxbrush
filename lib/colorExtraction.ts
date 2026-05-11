/**
 * Vibrant accent gradient extraction — v3
 *
 * Problem with naive approaches: `count × avgSaturation` rewards large fabric
 * areas (white shirt, black hoodie, brown acid-wash) over the small but vivid
 * artwork patches that define each product's identity.
 *
 * This implementation solves that with three key ideas:
 *
 * ① FABRIC SUBTRACTION
 *    Detect the garment's base color (the "background" of the art) by
 *    averaging pixels with low saturation. Every subsequent pixel is weighted
 *    by its RGB distance from this fabric color. Artwork pixels are inherently
 *    different from the fabric → they get high weight automatically.
 *
 * ② QUADRATIC SATURATION SCORING
 *    Use S² instead of S. A vivid pixel (S = 0.85) scores 0.72; a muted
 *    fabric pixel (S = 0.35) scores only 0.12. The contrast between art and
 *    fabric is amplified, not just measured.
 *
 * ③ SMOOTH LIGHTNESS PENALTY
 *    sin(L · π)^1.5 — a smooth curve that peaks at L = 0.5 and fades
 *    gracefully to 0 at pure black (L = 0) and pure white (L = 1). No harsh
 *    cutoffs that accidentally kill chrome art (L ≈ 0.55) or pastel accents.
 *
 * Combined pixel weight: S² × dist_from_fabric × sin(L·π)^1.5
 *
 * Other improvements over v2:
 *   • 128 × 128 sample (vs 80) — preserves fine art details
 *   • 24 hue buckets (15° each, vs 30°) — distinguishes red vs orange, etc.
 *   • Score = Σ(weights) per bucket, not count × avgSat
 *   • "to" color requires only 60° gap (4 buckets) — related but distinct
 *   • Lower MIN_SCORE_RATIO (0.08) — don't miss secondary colors on busy art
 *   • Triadic (+120°) hue shift fallback when no second cluster qualifies
 */

const FALLBACK_FROM   = "#8800CC";
const FALLBACK_TO     = "#0088FF";
const SAMPLE_SIZE     = 128;     // px — larger than v2 (80) for finer art detail
const HUE_BUCKETS     = 24;      // 15° per bucket
const MIN_HUE_GAP     = 4;       // 60° — minimum bucket distance for `to`
const MIN_SCORE_RATIO = 0.08;    // `to` bucket must be ≥ 8% of `from` bucket score
const FABRIC_S_CUTOFF = 0.22;    // pixels below this saturation define "fabric"

export interface AccentGradient {
  from: string;
  to:   string;
}

// ── Main export ───────────────────────────────────────────────────────────

export async function extractAccentGradient(source: string | File | Blob): Promise<AccentGradient> {
  if (typeof window === "undefined") return { from: FALLBACK_FROM, to: FALLBACK_TO };

  let img: HTMLImageElement;
  try {
    img = await loadImage(source);
  } catch {
    return { from: FALLBACK_FROM, to: FALLBACK_TO };
  }

  const { width, height } = fitInto(
    img.naturalWidth || img.width,
    img.naturalHeight || img.height,
    SAMPLE_SIZE,
  );

  const canvas = document.createElement("canvas");
  canvas.width  = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { from: FALLBACK_FROM, to: FALLBACK_TO };

  ctx.drawImage(img, 0, 0, width, height);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, width, height).data;
  } catch {
    return { from: FALLBACK_FROM, to: FALLBACK_TO };
  }

  // ── Phase 1: Detect fabric base color ────────────────────────────────────
  // Fabric = large, muted, consistent area. We approximate it as the weighted
  // average of all low-saturation, non-transparent pixels. High-saturation
  // pixels (the artwork) are excluded so they can't pollute the fabric estimate.
  let fabricR = 0, fabricG = 0, fabricB = 0, fabricW = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 128) continue;
    const [, s] = rgbToHsl(r, g, b);
    if (s > FABRIC_S_CUTOFF) continue;
    // Weight by opacity so semi-transparent edges don't distort
    const w = a / 255;
    fabricR += r * w; fabricG += g * w; fabricB += b * w; fabricW += w;
  }

  // If no muted pixels (fully saturated image), fall back to simple average
  if (fabricW < 10) {
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 128) continue;
      const w = a / 255;
      fabricR += data[i]     * w;
      fabricG += data[i + 1] * w;
      fabricB += data[i + 2] * w;
      fabricW += w;
    }
  }

  const fR = fabricW > 0 ? fabricR / fabricW : 128;
  const fG = fabricW > 0 ? fabricG / fabricW : 128;
  const fB = fabricW > 0 ? fabricB / fabricW : 128;
  const maxFabricDist = Math.sqrt(fR ** 2 + fG ** 2 + fB ** 2) +
                        Math.sqrt((255 - fR) ** 2 + (255 - fG) ** 2 + (255 - fB) ** 2);
  const normFactor = maxFabricDist > 0 ? 1 / (maxFabricDist / 2) : 1 / 441;

  // ── Phase 2: Score hue buckets ────────────────────────────────────────────
  type Bucket = { weightedR: number; weightedG: number; weightedB: number; score: number; index: number };
  const buckets: Bucket[] = Array.from({ length: HUE_BUCKETS }, (_, i) => ({
    weightedR: 0, weightedG: 0, weightedB: 0, score: 0, index: i,
  }));

  // Fallback tracker: the single highest-weighted pixel (for greyscale images)
  let topPixelW = 0;
  let topPixelRgb: [number, number, number] = [136, 0, 204];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 128) continue;

    const [h, s, l] = rgbToHsl(r, g, b);

    // ① Smooth lightness penalty — sin curve peaks at L=0.5
    const lumPenalty = Math.sin(l * Math.PI) ** 1.5;
    if (lumPenalty < 0.05) continue;   // near-black or near-white — skip

    // ② Distance from fabric (normalized 0–1)
    const dr = r - fR, dg = g - fG, db = b - fB;
    const distFromFabric = Math.sqrt(dr * dr + dg * dg + db * db) * normFactor;

    // ③ Quadratic saturation
    const satScore = s * s;

    const weight = satScore * distFromFabric * lumPenalty;

    // Track best pixel for fallback
    if (weight > topPixelW) {
      topPixelW = weight;
      topPixelRgb = [r, g, b];
    }

    // Must have at least some saturation to enter a bucket
    if (s < 0.18) continue;

    const bi = Math.min(HUE_BUCKETS - 1, Math.floor(h * HUE_BUCKETS));
    const slot = buckets[bi];
    slot.score     += weight;
    slot.weightedR += r * weight;
    slot.weightedG += g * weight;
    slot.weightedB += b * weight;
  }

  // ── Phase 3: Rank buckets ─────────────────────────────────────────────────
  const ranked = buckets
    .filter((b) => b.score > 0)
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0) {
    // Fully greyscale — synthesise gradient from best pixel or fallbacks
    const from = rgbToHex(...topPixelRgb);
    return topPixelW > 0.001
      ? { from, to: shiftHue(from, 120) }
      : { from: FALLBACK_FROM, to: FALLBACK_TO };
  }

  const first  = ranked[0];
  const fromHex = weightedBucketToHex(first);

  // ── Phase 4: Find `to` — hue-distant, strong enough ──────────────────────
  let toHex: string | null = null;
  for (const b of ranked.slice(1)) {
    const gap   = circularGap(first.index, b.index, HUE_BUCKETS);
    const ratio = b.score / first.score;
    if (gap >= MIN_HUE_GAP && ratio >= MIN_SCORE_RATIO) {
      toHex = weightedBucketToHex(b);
      break;
    }
  }

  // Fallback: triadic hue shift if no qualifying second cluster
  if (!toHex) {
    // Try a 180° opposite first (complementary), then 120° (triadic)
    toHex = shiftHue(fromHex, 150);
  }

  return { from: fromHex, to: toHex };
}

/** Single-color convenience export (used in admin fallback). */
export async function extractAccentColor(source: string | File | Blob): Promise<string> {
  const { from } = await extractAccentGradient(source);
  return from;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function loadImage(source: string | File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src = typeof source === "string" ? source : URL.createObjectURL(source);
  });
}

function fitInto(w: number, h: number, max: number) {
  if (w <= max && h <= max) return { width: w, height: h };
  const s = Math.min(max / w, max / h);
  return { width: Math.max(1, Math.round(w * s)), height: Math.max(1, Math.round(h * s)) };
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r:  h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g:  h = ((b - r) / d + 2) / 6;               break;
    default: h = ((r - g) / d + 4) / 6;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  return [Math.round(hue(h + 1/3) * 255), Math.round(hue(h) * 255), Math.round(hue(h - 1/3) * 255)];
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`.toUpperCase();
}

function weightedBucketToHex(b: { weightedR: number; weightedG: number; weightedB: number; score: number }) {
  return rgbToHex(
    Math.round(b.weightedR / b.score),
    Math.round(b.weightedG / b.score),
    Math.round(b.weightedB / b.score),
  );
}

function circularGap(a: number, b: number, total: number) {
  const d = Math.abs(a - b);
  return Math.min(d, total - d);
}

function shiftHue(hex: string, degrees: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return FALLBACK_TO;
  const [h, s, l] = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return rgbToHex(...hslToRgb(
    (h + degrees / 360 + 1) % 1,
    Math.max(s, 0.55),         // ensure the shifted color is vivid
    Math.min(Math.max(l, 0.38), 0.62),
  ));
}

// ── Public utilities ──────────────────────────────────────────────────────

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function hexToRgbString(hex: string): string {
  const rgb = hexToRgb(hex);
  return rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : "136, 0, 204";
}
