export type Swatch = {
  hex: string;
  oklch: string;
  rgb: string;
  weight: number;
  isDark: boolean;
};

function rgbToOklch(r: number, g: number, b: number): [number, number, number] {
  const sr = r / 255;
  const sg = g / 255;
  const sb = b / 255;

  const lr = sr <= 0.04045 ? sr / 12.92 : Math.pow((sr + 0.055) / 1.055, 2.4);
  const lg = sg <= 0.04045 ? sg / 12.92 : Math.pow((sg + 0.055) / 1.055, 2.4);
  const lb = sb <= 0.04045 ? sb / 12.92 : Math.pow((sb + 0.055) / 1.055, 2.4);

  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const okl = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const oka = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const okb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  return [okl, oka, okb];
}

function toHex(c: number): string {
  const h = Math.round(c).toString(16);
  return h.length === 1 ? "0" + h : h;
}

function quantizePixels(pixels: Uint8ClampedArray, maxColors: number): Map<string, { r: number; g: number; b: number; count: number }> {
  const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();
  const step = 8;

  for (let i = 0; i < pixels.length; i += 4 * step) {
    const r = Math.round(pixels[i] / 20) * 20;
    const g = Math.round(pixels[i + 1] / 20) * 20;
    const b = Math.round(pixels[i + 2] / 20) * 20;
    const key = `${r},${g},${b}`;

    const existing = buckets.get(key);
    if (existing) {
      existing.count++;
    } else {
      buckets.set(key, { r: pixels[i], g: pixels[i + 1], b: pixels[i + 2], count: 1 });
    }
  }

  const sorted = Array.from(buckets.values()).sort((a, b) => b.count - a.count);
  return new Map(sorted.slice(0, maxColors).map((c) => [`${Math.round(c.r / 20) * 20},${Math.round(c.g / 20) * 20},${Math.round(c.b / 20) * 20}`, c]));
}

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function mergeSimilarColors(
  colors: { r: number; g: number; b: number; count: number }[],
  threshold = 60,
): { r: number; g: number; b: number; count: number }[] {
  const merged: { r: number; g: number; b: number; count: number }[] = [];

  for (const color of colors) {
    let found = false;
    for (const existing of merged) {
      if (colorDistance(color.r, color.g, color.b, existing.r, existing.g, existing.b) < threshold) {
        const totalCount = existing.count + color.count;
        existing.r = Math.round((existing.r * existing.count + color.r * color.count) / totalCount);
        existing.g = Math.round((existing.g * existing.count + color.g * color.count) / totalCount);
        existing.b = Math.round((existing.b * existing.count + color.b * color.count) / totalCount);
        existing.count = totalCount;
        found = true;
        break;
      }
    }
    if (!found) {
      merged.push({ ...color });
    }
  }

  return merged;
}

export function extractPalette(imageData: ImageData, maxColors = 8): Swatch[] {
  const raw = quantizePixels(imageData.data, maxColors * 3);
  const merged = mergeSimilarColors(Array.from(raw.values()));
  const total = merged.reduce((sum, c) => sum + c.count, 0);

  return merged
    .sort((a, b) => b.count - a.count)
    .slice(0, maxColors)
    .map((c) => {
      const [okl, oka, okb] = rgbToOklch(c.r, c.g, c.b);
      const lightness = Math.round(okl * 100);
      const chroma = Math.round(Math.sqrt(oka * oka + okb * okb) * 100);
      const hue = Math.round((Math.atan2(okb, oka) * 180) / Math.PI);
      const adjustedHue = hue < 0 ? hue + 360 : hue;

      return {
        hex: `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`,
        oklch: `oklch(${lightness}% ${(chroma / 100).toFixed(3)} ${adjustedHue})`,
        rgb: `${c.r}, ${c.g}, ${c.b}`,
        weight: Math.round((c.count / total) * 100),
        isDark: okl < 0.45,
      };
    });
}
