"use client";

import { useRef, useState } from "react";

import { extractPalette, type Swatch } from "@/lib/palette";

export function PaletteApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [palette, setPalette] = useState<Swatch[]>([]);
  const [loading, setLoading] = useState(false);

  function handleImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
      processImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function processImage(url: string) {
    setLoading(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current!;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;

      const size = 200;
      const ratio = Math.min(size / img.width, size / img.height);
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const swatches = extractPalette(imageData);
      setPalette(swatches);
      setLoading(false);
    };
    img.src = url;
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6 lg:py-10">
      <header className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-400 via-purple-500 to-cyan-400 text-sm font-bold text-white">
            CP
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Color Palette</h1>
            <p className="text-sm text-zinc-500">Extract a color palette from any image.</p>
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-8 transition-colors hover:border-purple-400 hover:bg-purple-50/50">
            <svg className="mb-3 h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="text-sm font-medium text-zinc-600">Drop or click to upload an image</span>
            <span className="mt-1 text-xs text-zinc-400">PNG, JPG, WebP</span>
            <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
          </label>

          <canvas ref={canvasRef} className="hidden" />

          {imageUrl ? (
            <div className="overflow-hidden rounded-xl border border-zinc-200">
              <img src={imageUrl} alt="Source" className="max-h-64 w-full object-contain" />
            </div>
          ) : null}
        </div>

        <div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-purple-500" />
            </div>
          ) : palette.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">Extracted colors</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {palette.map((swatch, i) => (
                  <div key={i} className="group overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-md">
                    <div className="h-20 w-full" style={{ background: swatch.hex }} />
                    <div className="space-y-1 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{swatch.hex}</span>
                        <span className="text-[11px] text-zinc-400">{swatch.weight}%</span>
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono">{swatch.oklch}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">CSS variables</span>
                  <button
                    type="button"
                    onClick={() => {
                      const css = palette.map((s, i) => `  --color-${i + 1}: ${s.oklch};`).join("\n");
                      const code = `:root {\n${css}\n}`;
                      navigator.clipboard.writeText(code);
                    }}
                    className="text-xs text-purple-600 hover:text-purple-800"
                  >
                    Copy
                  </button>
                </div>
                <pre className="overflow-x-auto text-xs leading-relaxed text-zinc-600">
                  {palette.map((s, i) => `--color-${i + 1}: ${s.oklch};`).join("\n")}
                </pre>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Tailwind v4 config</span>
                  <button
                    type="button"
                    onClick={() => {
                      const colors = palette.map((s, i) => `    ${i + 1}: '${s.oklch}'`).join(",\n");
                      const code = `@import "tailwindcss";\n\n@theme {\n  --color-palette-: {\n${colors},\n  };\n}`;
                      navigator.clipboard.writeText(code);
                    }}
                    className="text-xs text-purple-600 hover:text-purple-800"
                  >
                    Copy
                  </button>
                </div>
                <pre className="overflow-x-auto text-xs leading-relaxed text-zinc-600">
                  {`@theme {\n  --color-palette-1: '${palette[0]?.oklch ?? ""}';\n  ...\n}`}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-zinc-200 py-16">
              <p className="text-sm text-zinc-400">Upload an image to see its palette.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
