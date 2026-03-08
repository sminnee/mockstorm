import type { MantineColorsTuple } from "@mantine/core";

// sRGB → linear RGB
function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

// linear RGB → sRGB
function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
}

// linear RGB → OKLab
function linearRgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

// OKLab → linear RGB
function oklabToLinearRgb(L: number, a: number, b: number): [number, number, number] {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

// OKLab → OKLCH
function oklabToOklch(L: number, a: number, b: number): [number, number, number] {
  const C = Math.sqrt(a * a + b * b);
  const h = Math.atan2(b, a);
  return [L, C, h];
}

// OKLCH → OKLab
function oklchToOklab(L: number, C: number, h: number): [number, number, number] {
  return [L, C * Math.cos(h), C * Math.sin(h)];
}

// Parse hex (#rrggbb) → sRGB [0-1]
function hexToSrgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    Number.parseInt(h.slice(0, 2), 16) / 255,
    Number.parseInt(h.slice(2, 4), 16) / 255,
    Number.parseInt(h.slice(4, 6), 16) / 255,
  ];
}

// sRGB [0-1] → hex
function srgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v * 255)));
  const rr = clamp(r).toString(16).padStart(2, "0");
  const gg = clamp(g).toString(16).padStart(2, "0");
  const bb = clamp(b).toString(16).padStart(2, "0");
  return `#${rr}${gg}${bb}`;
}

// Clamp chroma so the resulting RGB stays in gamut
function clampChroma(L: number, C: number, h: number): number {
  let lo = 0;
  let hi = C;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    const [labL, labA, labB] = oklchToOklab(L, mid, h);
    const [r, g, b] = oklabToLinearRgb(labL, labA, labB);
    if (r < -0.001 || r > 1.001 || g < -0.001 || g > 1.001 || b < -0.001 || b > 1.001) {
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return lo;
}

// Lightness targets for 10 shades (index 0 = lightest, index 9 = darkest)
const LIGHTNESS_STEPS = [0.95, 0.9, 0.83, 0.75, 0.66, 0.56, 0.48, 0.39, 0.31, 0.22];

/**
 * Generate a Mantine 10-shade color tuple from a base hex color.
 * Uses OKLCH color space for perceptually uniform lightness interpolation.
 */
export function generatePalette(baseHex: string): MantineColorsTuple {
  const [sr, sg, sb] = hexToSrgb(baseHex);
  const [lr, lg, lb] = [srgbToLinear(sr), srgbToLinear(sg), srgbToLinear(sb)];
  const [labL, labA, labB] = linearRgbToOklab(lr, lg, lb);
  const [, baseC, baseH] = oklabToOklch(labL, labA, labB);

  const shades = LIGHTNESS_STEPS.map((targetL) => {
    const c = clampChroma(targetL, baseC, baseH);
    const [oL, oA, oB] = oklchToOklab(targetL, c, baseH);
    const [rl, gl, bl] = oklabToLinearRgb(oL, oA, oB);
    return srgbToHex(linearToSrgb(rl), linearToSrgb(gl), linearToSrgb(bl));
  });

  return shades as unknown as MantineColorsTuple;
}
