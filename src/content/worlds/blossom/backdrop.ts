import { bayer, hash2 } from '../../../engine/math';
import type { PixelBuffer } from '../../../engine/pixels';
import type { Backdrop } from '../../../game/registry';

/**
 * Far: a snow-capped volcano under a huge pale sun, wisps of cloud, a five-storey pagoda on a hill.
 * Near: blossom branches reaching in from the top of the frame and a torii gate.
 * Colour 1 only (the recolour pass turns it pink and lavender).
 */
const W = 640;
const wrap = (x: number) => ((x % W) + W) % W;

function pagoda(b: PixelBuffer, cx: number, base: number, floors: number) {
  let y = base;
  for (let f = 0; f < floors; f++) {
    const hw = 12 - f * 2;
    const h = 7 - Math.floor(f / 2);
    // walls
    for (let j = 0; j < h; j++) {
      b.set(wrap(cx - hw + 3), y - j, 1);
      b.set(wrap(cx + hw - 3), y - j, 1);
    }
    for (let i = -hw + 4; i < hw - 3; i += 3) b.set(wrap(cx + i), y - 3, 1);
    y -= h;
    // a curved roof whose tips flick up
    for (let i = -hw - 3; i <= hw + 3; i++) {
      const lift = Math.abs(i) > hw ? Math.abs(i) - hw : 0;
      b.set(wrap(cx + i), y - lift, 1);
      if (Math.abs(i) <= hw && (i + f) % 2 === 0) b.set(wrap(cx + i), y + 1, 1);
    }
    y -= 1;
  }
  for (let j = 0; j < 9; j++) b.set(wrap(cx), y - j, 1);
  for (const k of [2, 4, 6]) {
    b.set(wrap(cx - 1), y - k, 1);
    b.set(wrap(cx + 1), y - k, 1);
  }
}

export const blossomBackdrop: Backdrop = {
  farScroll: 0.08,
  nearScroll: 0.32,
  far(b) {
    // the sun: a big dithered disc low in the sky
    const sx = 420;
    const sy = 70;
    for (let y = -30; y <= 30; y++)
      for (let x = -30; x <= 30; x++) {
        const d = Math.hypot(x, y);
        if (d > 30) continue;
        if (d > 29 || bayer(sx + x, sy + y) < 0.18 + (y + 30) / 260) b.set(sx + x, sy + y, 1);
      }
    // thin bands of cloud across the sun and sky
    for (let k = 0; k < 9; k++) {
      const y = 20 + Math.floor(hash2(k, 1, 71) * 80);
      const x0 = Math.floor(hash2(k, 2, 71) * W);
      const len = 30 + Math.floor(hash2(k, 3, 71) * 70);
      for (let i = 0; i < len; i++) if ((i & 3) !== 3) b.set(wrap(x0 + i), y + (i > len / 2 ? 1 : 0), 1);
    }
    // the volcano: a long gentle cone with a snow cap
    for (let x = 0; x < W; x++) {
      const dx = Math.abs(((x - 180 + W * 1.5) % W) - W / 2);
      const top = 64 + dx * 0.36 + Math.sin(x * 0.11) * 1.5;
      if (top > 150) continue;
      b.set(x, Math.round(top), 1);
      if (top < 88 && dx > 6 && (x + Math.round(top)) % 3 === 0) b.set(x, Math.round(top) + 5 + (x % 5), 1);
      for (let y = Math.round(top) + 22; y < 150; y++) if (bayer(x, y) < 0.08) b.set(x, y, 1);
    }
    // rolling hills with tea-terrace stripes, and pagodas
    for (let x = 0; x < W; x++) {
      const t = (x / W) * Math.PI * 2;
      const y = Math.round(138 - Math.sin(t * 3 + 0.5) * 9 - Math.sin(t * 7) * 3);
      b.set(x, y, 1);
      for (let yy = y + 4; yy < 180; yy += 5) if ((x + yy) % 9 < 6) b.set(x, yy, 1);
    }
    pagoda(b, 96, 132, 5);
    pagoda(b, 520, 136, 3);
    // a flight of birds
    for (let k = 0; k < 7; k++) {
      const x = 260 + k * 9 + (k % 2) * 3;
      const y = 40 + Math.abs(k - 3) * 3;
      b.set(x - 1, y, 1);
      b.set(x, y + 1, 1);
      b.set(x + 1, y, 1);
    }
  },
  near(b) {
    // blossom branches hanging in from the top edge
    for (let k = 0; k < 5; k++) {
      let x = 40 + k * 128 + Math.floor(hash2(k, 1, 81) * 30);
      let y = 0;
      const dir = k % 2 ? 1 : -1;
      for (let i = 0; i < 46; i++) {
        x += dir * (i % 3 === 0 ? 1 : 0) + (i % 7 === 0 ? dir : 0);
        y += i % 4 === 0 ? 0 : 1;
        if (y > 34) break;
        b.set(wrap(x), y, 1);
        if (i % 6 === 3) {
          // a cluster of blossoms
          for (let p = 0; p < 7; p++) {
            const a = (p / 7) * Math.PI * 2;
            b.set(wrap(x + Math.round(Math.cos(a) * 3)), y + Math.round(Math.sin(a) * 2) + 2, 1);
          }
        }
      }
    }
    // a torii gate standing in the mid-distance
    const tx = 300;
    for (let y = 104; y < 160; y++) {
      b.set(tx, y, 1);
      b.set(tx + 3, y, 1);
      b.set(tx + 44, y, 1);
      b.set(tx + 47, y, 1);
    }
    for (let x = tx - 8; x <= tx + 55; x++) {
      const lift = x < tx - 2 ? (tx - 2 - x) >> 1 : x > tx + 49 ? (x - tx - 49) >> 1 : 0;
      b.set(x, 100 - lift, 1);
      b.set(x, 103 - lift, 1);
      if (x > tx - 2 && x < tx + 50) b.set(x, 112, 1);
    }
    for (let y = 104; y < 112; y++) b.set(tx + 23, y, 1);
  },
};
