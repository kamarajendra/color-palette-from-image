import { describe, expect, it } from "vitest";

import { extractPalette } from "@/lib/palette";

function createMockImageData(pixels: number[]): ImageData {
  const data = new Uint8ClampedArray(pixels);
  return { data, width: 1, height: 1, colorSpace: "srgb" } as ImageData;
}

describe("extractPalette", () => {
  it("returns swatches with hex, oklch, and weight", () => {
    const pixels: number[] = [];
    for (let i = 0; i < 400; i++) {
      pixels.push(255, 0, 0, 255);
    }
    for (let i = 0; i < 200; i++) {
      pixels.push(0, 0, 255, 255);
    }

    const result = extractPalette(createMockImageData(pixels), 2);

    expect(result).toHaveLength(2);
    expect(result[0]?.hex).toBe("#ff0000");
    expect(result[0]?.weight).toBeGreaterThan(0);
    expect(result[1]?.hex).toBe("#0000ff");
  });

  it("handles empty images gracefully", () => {
    const pixels = new Array(400).fill(0);
    const result = extractPalette(createMockImageData(pixels), 5);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});
