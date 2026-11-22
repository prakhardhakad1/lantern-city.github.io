import { bayer, hash2 } from '../../../engine/math';
import type { Backdrop } from '../../../game/registry';

/**
 * Far: a huge moon behind drifting rain clouds, mega-towers with antenna lights and a giant
 * billboard, and an elevated rail line. Near: cables strung between poles, with paper lanterns.
 * Colour 1 only.
 */
const W = 640;
const wrap = (x: number) => ((x % W) + W) % W;

export const bazaarBackdrop: Backdrop = {
  farScroll: 0.07,
  nearScroll: 0.3,
  far(b) {
    // the moon
    const mx = 500;
    const my = 40;
    for (let y = -26; y <= 26; y++)
      for (let x = -26; x <= 26; x++) {
        const d = Math.hypot(x, y);
        if (d > 26) continue;
        if (d > 25 || bayer(mx + x, my + y) < 0.1 + (x + 26) / 140) b.set(mx + x, my + y, 1);
      }
    // rain clouds drifting over it
    for (let k = 0; k < 12; k++) {
      const y = 14 + Math.floor(hash2(k, 1, 31) * 50);
      const x0 = Math.floor(hash2(k, 2, 31) * W);
      const len = 40 + Math.floor(hash2(k, 3, 31) * 90);
      for (let i = 0; i < len; i++) {
        b.set(wrap(x0 + i), y, 1);
        if (i % 2 === 0 && i > 4 && i < len - 4) b.set(wrap(x0 + i), y + 2, 1);
      }
    }
    // mega towers
    for (let k = 0; k < 9; k++) {
      const x = 20 + k * 72 + Math.floor(hash2(k, 4, 31) * 20);
      const w = 22 + Math.floor(hash2(k, 5, 31) * 20);
      const top = 40 + Math.floor(hash2(k, 6, 31) * 50);
      for (let y = top; y < 180; y++) {
        b.set(wrap(x), y, 1);
        b.set(wrap(x + w), y, 1);
      }
      for (let i = 0; i <= w; i++) b.set(wrap(x + i), top, 1);
      for (let y = top + 5; y < 180; y += 6) for (let i = 3; i < w - 2; i += 4) if (hash2(x + i, y, 32) < 0.35) b.set(wrap(x + i), y, 1);
      // antenna with a light
      const ax = x + (w >> 1);
      for (let y = top - 16; y < top; y++) b.set(wrap(ax), y, 1);
      b.set(wrap(ax - 1), top - 17, 1);
      b.set(wrap(ax + 1), top - 17, 1);
      b.set(wrap(ax), top - 18, 1);
    }
    // a giant billboard on stilts
    const bx = 250;
    for (let y = 60; y < 92; y++) {
      b.set(bx, y, 1);
      b.set(bx + 70, y, 1);
    }
    for (let x = 0; x <= 70; x++) {
      b.set(bx + x, 60, 1);
      b.set(bx + x, 92, 1);
    }
    for (let x = 8; x < 63; x += 2) for (let y = 66; y < 87; y += 2) if ((x * 7 + y * 3) % 17 < 3) b.set(bx + x, y, 1);
    for (const sx of [bx + 15, bx + 55]) for (let y = 92; y < 130; y++) if (y % 2 === 0) b.set(sx, y, 1);
    // elevated rail line
    for (let x = 0; x < W; x++) {
      b.set(x, 132, 1);
      b.set(x, 135, 1);
      if (x % 40 < 3) for (let y = 136; y < 180; y++) b.set(x, y, 1);
      if (x % 8 === 0) b.set(x, 133, 1), b.set(x, 134, 1);
    }
  },
  near(b) {
    // cables strung between poles, with paper lanterns
    for (let k = 0; k < 4; k++) {
      const x0 = k * 160;
      for (let y = 20; y < 180; y++) b.set(wrap(x0), y, 1);
      for (let x = 0; x < 160; x++) {
        const sag = Math.round(Math.sin((x / 160) * Math.PI) * 16);
        b.set(wrap(x0 + x), 24 + sag, 1);
        if (x % 20 === 10) {
          const ly = 26 + sag;
          for (let j = 0; j < 6; j++) for (let i = -2; i <= 2; i++) if (Math.abs(i) < 2 || (j > 0 && j < 5)) if (j === 0 || j === 5 || Math.abs(i) === 2 || (i + j) % 3 === 0) b.set(wrap(x0 + x + i), ly + j, 1);
        }
      }
    }
  },
};
