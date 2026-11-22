import { PixelBuffer } from '../engine/pixels';

/** One sprite frame painted procedurally into a w x h buffer. */
export function frame(w: number, h: number, paint: (b: PixelBuffer) => void): string[] {
  const b = new PixelBuffer(w, h);
  paint(b);
  return b.toRows();
}

/** A filled disc (inclusive radius). */
export function disc(b: PixelBuffer, cx: number, cy: number, r: number, c: number) {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) b.set(cx + x, cy + y, c);
}

/** Recolour every pixel of colour `from` that touches transparency with `to` (a 1px rim). */
export function rim(b: PixelBuffer, to: number) {
  const pts: [number, number][] = [];
  for (let y = 0; y < b.h; y++)
    for (let x = 0; x < b.w; x++) {
      if (b.get(x, y) === 255) continue;
      if (b.get(x - 1, y) === 255 || b.get(x + 1, y) === 255 || b.get(x, y - 1) === 255 || b.get(x, y + 1) === 255) pts.push([x, y]);
    }
  for (const [x, y] of pts) b.set(x, y, to);
}
