import { bayer, hash2 } from '../engine/math';
import type { PixelBuffer } from '../engine/pixels';

/**
 * Mid-distance silhouettes for the new middle parallax layer. Shapes are filled with colour 0
 * (so they read as solid masses against the gradient sky) and rimmed with colour 1; a few colour
 * 2 / 3 pixels make lit windows. Everything wraps around the 640px layer width.
 */
const LW = 640;
const wrap = (x: number) => ((x % LW) + LW) % LW;
const put = (b: PixelBuffer, x: number, y: number, c: number) => b.set(wrap(Math.round(x)), Math.round(y), c);
const fillCol = (b: PixelBuffer, x: number, y0: number, y1: number, c = 0) => {
  for (let y = Math.max(0, Math.round(y0)); y < Math.min(b.h, Math.round(y1)); y++) put(b, x, y, c);
};

/** Rolling hills filled to the bottom, with a rim line. Returns the height profile. */
export function hills(b: PixelBuffer, base: number, amp: number, seed: number, rim = 1): number[] {
  const prof: number[] = [];
  for (let x = 0; x < LW; x++) {
    const t = (x / LW) * Math.PI * 2;
    const y = Math.round(base - Math.sin(t * 2 + seed) * amp * 0.6 - Math.sin(t * 5 + seed * 2) * amp * 0.3 - Math.sin(t * 11 + seed) * amp * 0.1);
    prof.push(y);
    fillCol(b, x, y, b.h, 0);
    put(b, x, y, rim);
  }
  return prof;
}

/** A dense pine forest standing on a profile. */
export function pines(b: PixelBuffer, prof: number[], seed: number, every = 7, size = 1, snow = false) {
  for (let x0 = 0; x0 < LW; x0 += every) {
    const r = hash2(x0, seed, 301);
    if (r < 0.25) continue;
    const x = x0 + Math.floor(hash2(x0, seed, 302) * every);
    const h = Math.round((10 + r * 18) * size);
    const base = prof[wrap(x)] + 2;
    for (let j = 0; j < h; j++) {
      const hw = Math.floor(((j + 1) / h) * (h * 0.32)) + ((j % 4 === 3 ? -1 : 0) as number);
      for (let i = -hw; i <= hw; i++) put(b, x + i, base - h + j, 0);
      put(b, x - hw, base - h + j, 1);
      put(b, x + hw, base - h + j, 1);
      if (snow && j % 4 === 3) for (let i = -hw; i <= -hw + 1; i++) put(b, x + i, base - h + j, 2);
    }
    put(b, x, base - h - 1, 1);
  }
}

/** Round-canopied trees (outskirts). */
export function leafyTrees(b: PixelBuffer, prof: number[], seed: number, every = 26) {
  for (let x0 = 0; x0 < LW; x0 += every) {
    if (hash2(x0, seed, 311) < 0.3) continue;
    const x = x0 + Math.floor(hash2(x0, seed, 312) * 10);
    const base = prof[wrap(x)] + 1;
    const h = 14 + Math.floor(hash2(x0, seed, 313) * 14);
    const cr = 6 + Math.floor(hash2(x0, seed, 314) * 6);
    fillCol(b, x, base - h, base, 0);
    fillCol(b, x + 1, base - h, base, 0);
    const cy = base - h - cr + 3;
    for (let k = 0; k < 3; k++) {
      const bx = x + (k - 1) * Math.round(cr * 0.7);
      const by = cy + (k === 1 ? -3 : 1);
      const rr = k === 1 ? cr : cr - 2;
      for (let yy = -rr; yy <= rr; yy++)
        for (let xx = -rr; xx <= rr; xx++) {
          const d = Math.hypot(xx, yy);
          if (d > rr) continue;
          const edge = d > rr - 1;
          put(b, bx + xx, by + yy, edge && yy < 1 ? 1 : bayer(bx + xx, by + yy) < 0.12 && yy < 0 ? 1 : 0);
        }
    }
  }
}

/** Ruined city blocks with a few lit windows. */
export function city(b: PixelBuffer, base: number, seed: number, lit = 2, opts: { every?: number; tall?: number; spires?: boolean } = {}) {
  const every = opts.every ?? 22;
  for (let x0 = 0; x0 < LW; x0 += every) {
    const r = hash2(x0, seed, 321);
    if (r < 0.15) continue;
    const w = 10 + Math.floor(hash2(x0, seed, 322) * 14);
    const h = 18 + Math.floor(r * (opts.tall ?? 46));
    const x = x0 + Math.floor(hash2(x0, seed, 323) * 6);
    const top = base - h;
    for (let i = 0; i < w; i++) fillCol(b, x + i, top, b.h, 0);
    for (let i = 0; i < w; i++) put(b, x + i, top, 1);
    fillCol(b, x, top, b.h, 1);
    // broken roofline
    if (hash2(x0, seed, 324) < 0.5) for (let i = 0; i < 4; i++) put(b, x + w - 1 - i, top - (3 - i), 1);
    if (opts.spires && hash2(x0, seed, 325) < 0.35) {
      const sx = x + Math.floor(w / 2);
      for (let j = 0; j < 10; j++) {
        put(b, sx - Math.floor((10 - j) / 4), top - 10 + j, 0);
        put(b, sx + Math.floor((10 - j) / 4), top - 10 + j, 0);
        put(b, sx, top - 10 + j, j < 2 ? 1 : 0);
      }
      put(b, sx, top - 12, 1);
    }
    // windows
    for (let wy = top + 4; wy < base - 4; wy += 6)
      for (let wx = x + 3; wx < x + w - 2; wx += 4) {
        const q = hash2(wx, wy, seed + 326);
        if (q < 0.1) {
          put(b, wx, wy, lit);
          put(b, wx, wy + 1, lit);
        } else if (q < 0.16) put(b, wx, wy, 1);
      }
  }
}

/** Big masonry arches (aqueduct / cistern). */
export function arches(b: PixelBuffer, top: number, span: number, pier: number, seed: number) {
  for (let x0 = 0; x0 < LW; x0 += span) {
    for (let i = 0; i < pier; i++) fillCol(b, x0 + i, top, b.h, 0);
    fillCol(b, x0, top, b.h, 1);
    fillCol(b, x0 + pier - 1, top + 6, b.h, 1);
    const rad = (span - pier) / 2;
    const cx = x0 + pier + rad;
    for (let x = x0 + pier; x < x0 + span; x++) {
      const dx = x + 0.5 - cx;
      const arcY = top + 10 + rad - Math.sqrt(Math.max(0, rad * rad - dx * dx));
      fillCol(b, x, top, arcY, 0);
      put(b, x, arcY, 1);
      put(b, x, top, 1);
      if (Math.abs(dx) < rad - 2 && hash2(x, seed, 331) < 0.08) put(b, x, arcY - 3, 1);
    }
  }
}

/** Fluted crypt pillars with skull niches between. */
export function crypt(b: PixelBuffer, seed: number) {
  for (let x0 = 0; x0 < LW; x0 += 80) {
    const pw = 14;
    for (let i = 0; i < pw; i++) fillCol(b, x0 + i, 0, b.h, 0);
    fillCol(b, x0, 0, b.h, 1);
    fillCol(b, x0 + pw - 1, 0, b.h, 1);
    for (let i = 3; i < pw - 2; i += 3) for (let y = 20; y < b.h; y += 2) put(b, x0 + i, y, 1);
    for (let i = -2; i < pw + 2; i++) {
      put(b, x0 + i, 16, 1);
      put(b, x0 + i, 18, 1);
    }
    // a lantern hanging between pillars
    const lx = x0 + 47;
    const ly = 38 + Math.floor(hash2(x0, seed, 341) * 30);
    for (let y = 0; y < ly; y += 2) put(b, lx, y, 1);
    b.rect(wrap(lx - 2), ly, 5, 6, 1);
    b.rect(wrap(lx - 1), ly + 1, 3, 4, 2);
  }
}

/** Smokestacks and sheds with glowing furnace windows (foundry). */
export function works(b: PixelBuffer, base: number, seed: number) {
  for (let x0 = 0; x0 < LW; x0 += 26) {
    const w = 18 + Math.floor(hash2(x0, seed, 351) * 10);
    const h = 16 + Math.floor(hash2(x0, seed, 352) * 14);
    for (let i = 0; i < w; i++) {
      const roof = base - h - ((i % 9) < 5 ? i % 9 : 9 - (i % 9));
      fillCol(b, x0 + i, roof, b.h, 0);
      put(b, x0 + i, roof, 1);
    }
    for (let i = 3; i < w - 3; i += 5) {
      put(b, x0 + i, base - h + 6, 3);
      put(b, x0 + i + 1, base - h + 6, 2);
      put(b, x0 + i, base - h + 7, 2);
    }
  }
  for (let x0 = 0; x0 < LW; x0 += 70) {
    const x = x0 + Math.floor(hash2(x0, seed, 353) * 30);
    const h = 60 + Math.floor(hash2(x0, seed, 354) * 40);
    for (let i = 0; i < 6; i++) fillCol(b, x + i, base - h, b.h, 0);
    fillCol(b, x, base - h, b.h, 1);
    fillCol(b, x + 5, base - h, b.h, 1);
    for (let i = -1; i < 7; i++) put(b, x + i, base - h, 1);
    for (let y = base - h + 8; y < base; y += 12) for (let i = 0; i < 6; i++) put(b, x + i, y, 1);
    put(b, x + 2, base - h + 3, 2);
  }
}

/** Big pipes with flanges running across (underworks). */
export function pipes(b: PixelBuffer, y: number, thick: number, seed: number) {
  for (let x = 0; x < LW; x++) {
    for (let j = 0; j < thick; j++) put(b, x, y + j, 0);
    put(b, x, y, 1);
    put(b, x, y + thick - 1, 1);
    if (x % 48 === 0) for (let j = -2; j < thick + 2; j++) {
      put(b, x, y + j, 1);
      put(b, x + 1, y + j, 1);
    }
    if (hash2(x, seed, 361) < 0.03) put(b, x, y + 2, 2);
  }
}

/** Round blossom canopies (filled 0, dithered with 1 for blooms) standing on a profile. */
export function blossomTrees(b: PixelBuffer, prof: number[], seed: number, every = 34) {
  for (let x0 = 0; x0 < LW; x0 += every) {
    if (hash2(x0, seed, 371) < 0.25) continue;
    const x = x0 + Math.floor(hash2(x0, seed, 372) * 12);
    const base = prof[wrap(x)] + 1;
    const h = 10 + Math.floor(hash2(x0, seed, 373) * 10);
    const cr = 7 + Math.floor(hash2(x0, seed, 374) * 6);
    fillCol(b, x, base - h, base, 0);
    put(b, x - 1, base - h + 4, 0);
    const cy = base - h - cr + 4;
    for (const [dx, dy, rr] of [
      [-cr * 0.6, 2, cr - 2],
      [0, -2, cr],
      [cr * 0.6, 2, cr - 2],
    ] as const)
      for (let yy = -rr; yy <= rr; yy++)
        for (let xx = -rr; xx <= rr; xx++) {
          const d = Math.hypot(xx, yy);
          if (d > rr) continue;
          const px = x + dx + xx;
          const py = cy + dy + yy;
          put(b, px, py, d > rr - 1 && yy < 1 ? 1 : bayer(Math.round(px), Math.round(py)) < 0.22 ? 1 : 0);
        }
  }
}

/** Small pagodas on the hills (three tiers, flicked roof tips). */
export function pagodas(b: PixelBuffer, prof: number[], seed: number, every = 150) {
  for (let x0 = 20; x0 < LW; x0 += every) {
    const x = x0 + Math.floor(hash2(x0, seed, 381) * 40);
    let y = prof[wrap(x)] + 1;
    for (let f = 0; f < 3; f++) {
      const hw = 9 - f * 2;
      const h = 6 - f;
      for (let j = 0; j < h; j++) for (let i = -hw + 2; i <= hw - 2; i++) put(b, x + i, y - j, 0);
      for (let j = 0; j < h; j++) {
        put(b, x - hw + 2, y - j, 1);
        put(b, x + hw - 2, y - j, 1);
      }
      if (f === 0) put(b, x, y - 2, 2);
      y -= h;
      for (let i = -hw - 3; i <= hw + 3; i++) {
        const lift = Math.abs(i) > hw ? Math.abs(i) - hw : 0;
        put(b, x + i, y - lift, 1);
        put(b, x + i, y - lift + 1, 0);
      }
      y -= 1;
    }
    fillCol(b, x, y - 7, y + 1, 1);
  }
}

/** A bank of cumulus clouds: filled 0 with a lit (1) rim on top. Returns the top profile. */
export function cloudBank(b: PixelBuffer, base: number, seed: number, lumps = 26) {
  const top = new Array<number>(LW).fill(base + 4);
  for (let k = 0; k < lumps * 2; k++) {
    const cx = Math.floor((k / (lumps * 2)) * LW + hash2(k, seed, 391) * 14);
    const r = 10 + Math.floor(hash2(k, seed, 392) * 16);
    const cy = base + 4 - Math.floor(hash2(k, seed, 393) * 8);
    for (let x = -r; x <= r; x++) {
      const y = Math.round(cy - Math.sqrt(r * r - x * x) * 0.8);
      const wx = wrap(cx + x);
      top[wx] = Math.min(top[wx], y);
    }
  }
  for (let x = 0; x < LW; x++) {
    fillCol(b, x, top[x], b.h, 0);
    put(b, x, top[x], 1);
    if (hash2(x, seed, 394) < 0.5) put(b, x, top[x] + 1, 1);
    for (let y = top[x] + 6; y < b.h; y += 7) if ((x + y) % 11 === 0) put(b, x, y, 1);
  }
  return top;
}

/** Airships moored in the distance: a cigar envelope, a gondola and a little fin. */
export function airships(b: PixelBuffer, seed: number, n = 3) {
  for (let k = 0; k < n; k++) {
    const cx = Math.floor((k + 0.3 + hash2(k, seed, 401) * 0.4) * (LW / n));
    const cy = 30 + Math.floor(hash2(k, seed, 402) * 40);
    const rx = 22 + Math.floor(hash2(k, seed, 403) * 14);
    const ry = Math.round(rx * 0.32);
    for (let y = -ry; y <= ry; y++)
      for (let x = -rx; x <= rx; x++) {
        const d = (x * x) / (rx * rx) + (y * y) / (ry * ry);
        if (d > 1) continue;
        put(b, cx + x, cy + y, d > 0.8 || (y === 0 && Math.abs(x) < rx - 3) || x % 9 === 0 ? 1 : 0);
      }
    for (let i = 0; i < 6; i++) put(b, cx - rx - i, cy - i, 1);
    for (let i = 0; i < 6; i++) put(b, cx - rx - i, cy + i, 1);
    const gy = cy + ry + 3;
    for (let x = -6; x <= 6; x++) for (let y = 0; y < 4; y++) put(b, cx + x, gy + y, y === 0 || Math.abs(x) === 6 ? 1 : 0);
    put(b, cx - 4, gy - 2, 1);
    put(b, cx + 4, gy - 2, 1);
    put(b, cx - 2, gy + 1, 2);
    put(b, cx + 2, gy + 1, 2);
  }
}

/** Neon towers: tall blocks with lit windows (2), rooftop signs and antennas. */
export function neonTowers(b: PixelBuffer, base: number, seed: number) {
  for (let x0 = 0; x0 < LW; x0 += 30) {
    const w = 16 + Math.floor(hash2(x0, seed, 411) * 14);
    const h = 40 + Math.floor(hash2(x0, seed, 412) * 70);
    const x = x0 + Math.floor(hash2(x0, seed, 413) * 6);
    const top = base - h;
    for (let i = 0; i < w; i++) fillCol(b, x + i, top, b.h, 0);
    fillCol(b, x, top, b.h, 1);
    fillCol(b, x + w - 1, top, b.h, 1);
    for (let i = 0; i < w; i++) put(b, x + i, top, 1);
    // antenna with a blinking tip
    if (hash2(x0, seed, 414) < 0.5) {
      fillCol(b, x + (w >> 1), top - 12, top, 1);
      put(b, x + (w >> 1), top - 13, 2);
    }
    // a vertical neon sign hanging off the side
    if (hash2(x0, seed, 415) < 0.55) {
      const sy = top + 8 + Math.floor(hash2(x0, seed, 416) * 20);
      for (let j = 0; j < 18; j++) {
        put(b, x + w, sy + j, 2);
        put(b, x + w + 3, sy + j, 2);
        if (j % 5 === 2) put(b, x + w + 1, sy + j, 2), put(b, x + w + 2, sy + j, 2);
      }
    }
    for (let wy = top + 4; wy < base; wy += 5)
      for (let wx = x + 3; wx < x + w - 2; wx += 3) {
        const q = hash2(wx, wy, seed + 417);
        if (q < 0.16) put(b, wx, wy, 2);
        else if (q < 0.3) put(b, wx, wy, 1);
      }
  }
}
