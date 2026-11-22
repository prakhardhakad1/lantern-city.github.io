import { bayer, hash2 } from '../../../engine/math';
import type { PixelBuffer } from '../../../engine/pixels';
import type { Backdrop } from '../../../game/registry';

/**
 * Far: a low sunset sun with long rays, floating islands trailing roots and waterfalls, a
 * lighthouse on the tallest one, and tall cloud towers. Near: kite strings and gull flocks.
 * Colour 1 only.
 */
const W = 640;
const wrap = (x: number) => ((x % W) + W) % W;

function island(b: PixelBuffer, cx: number, cy: number, rx: number, seed: number, tower: boolean) {
  // flat grassy top, a rocky underside tapering to a point
  for (let x = -rx; x <= rx; x++) {
    const k = 1 - Math.abs(x) / rx;
    const depth = Math.round(k * rx * 0.9 + hash2(x, seed, 1) * 3);
    b.set(wrap(cx + x), cy, 1);
    b.set(wrap(cx + x), cy + depth, 1);
    for (let y = 1; y < depth; y++) if (bayer(cx + x, cy + y) < 0.15 + y / (depth * 4)) b.set(wrap(cx + x), cy + y, 1);
    // dangling roots
    if (hash2(x, seed, 2) < 0.12) for (let y = 0; y < 6 + hash2(x, seed, 3) * 10; y++) b.set(wrap(cx + x), cy + depth + y, 1);
  }
  // a thin waterfall off one edge
  for (let y = 0; y < 50; y++) if (y % 3 !== 2) b.set(wrap(cx + rx - 2), cy + y, 1);
  if (tower) {
    for (let y = 0; y < 26; y++) {
      b.set(wrap(cx - 3 + Math.floor(y / 9)), cy - y, 1);
      b.set(wrap(cx + 3 - Math.floor(y / 9)), cy - y, 1);
    }
    for (let x = -3; x <= 3; x++) b.set(wrap(cx + x), cy - 26, 1);
    for (let x = -2; x <= 2; x++) b.set(wrap(cx + x), cy - 31, 1);
    b.set(wrap(cx - 2), cy - 28, 1);
    b.set(wrap(cx + 2), cy - 28, 1);
    b.set(wrap(cx), cy - 33, 1);
  }
}

export const skyBackdrop: Backdrop = {
  farScroll: 0.06,
  nearScroll: 0.28,
  far(b) {
    // sunset sun with rays
    const sx = 330;
    const sy = 118;
    for (let y = -24; y <= 24; y++)
      for (let x = -24; x <= 24; x++) {
        const d = Math.hypot(x, y);
        if (d <= 24 && (d > 23 || (y > 6 && (y & 1) === 0))) b.set(sx + x, sy + y, 1);
      }
    for (let k = 0; k < 14; k++) {
      const a = Math.PI + (k / 13) * Math.PI;
      for (let r = 32; r < 130; r += 2) if ((r >> 3) % 2 === 0) b.set(wrap(Math.round(sx + Math.cos(a) * r)), Math.round(sy + Math.sin(a) * r * 0.7), 1);
    }
    // towering clouds on the horizon
    for (let k = 0; k < 6; k++) {
      const cx = 40 + k * 110 + Math.floor(hash2(k, 1, 51) * 30);
      const h = 40 + Math.floor(hash2(k, 2, 51) * 50);
      for (let x = -30; x <= 30; x++) {
        const top = Math.round(150 - h * Math.sqrt(Math.max(0, 1 - (x / 30) ** 2)) - Math.sin(x * 0.4 + k) * 3);
        b.set(wrap(cx + x), top, 1);
        if ((x + k) % 6 === 0) for (let y = top + 3; y < top + 9; y++) b.set(wrap(cx + x), y, 1);
      }
    }
    island(b, 110, 60, 26, 1, true);
    island(b, 460, 44, 18, 2, false);
    island(b, 560, 84, 12, 3, false);
    // the horizon line of the cloud sea
    for (let x = 0; x < W; x++) {
      b.set(x, 150 + Math.round(Math.sin(x * 0.05) * 1.5), 1);
      for (let y = 156; y < 180; y += 4) if ((x + y * 3) % 13 < 7) b.set(x, y, 1);
    }
  },
  near(b) {
    // kite strings drifting up from below
    for (let k = 0; k < 3; k++) {
      let x = 80 + k * 210;
      for (let y = 180; y > 50; y--) {
        x += Math.sin(y * 0.05 + k) * 0.6;
        if (y % 2 === 0) b.set(wrap(Math.round(x)), y, 1);
      }
      const kx = Math.round(x);
      for (let i = -5; i <= 5; i++) {
        b.set(wrap(kx + i), 50 - (5 - Math.abs(i)), 1);
        b.set(wrap(kx + i), 50 + (5 - Math.abs(i)), 1);
      }
      for (let y = 55; y < 75; y += 3) b.set(wrap(kx + Math.round(Math.sin(y) * 2)), y, 1);
    }
    // gulls
    for (let k = 0; k < 10; k++) {
      const x = Math.floor(hash2(k, 4, 61) * W);
      const y = 20 + Math.floor(hash2(k, 5, 61) * 60);
      b.set(wrap(x - 2), y, 1);
      b.set(wrap(x - 1), y - 1, 1);
      b.set(wrap(x), y, 1);
      b.set(wrap(x + 1), y - 1, 1);
      b.set(wrap(x + 2), y, 1);
    }
  },
};
