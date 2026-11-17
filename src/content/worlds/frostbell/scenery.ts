import { bayer, clamp, hash2 } from '../../../engine/math';
import { PixelBuffer } from '../../../engine/pixels';
import type { Renderer } from '../../../engine/renderer';
import { Entity } from '../../../game/entity';
import { registerEntity } from '../../../game/registry';
import type { World } from '../../../game/world';

/**
 * COURTYARD SCENERY: purely decorative. Nothing here has a hitbox, blocks movement, hurts, or
 * changes any timing: trees, a hillside village with chimneys and lit windows, lamp posts,
 * bunting, ambient animals (sparrows, hare, cat, owl that flies to the rooftops, a dog, a flock),
 * villagers (lamplighter, a woman with a basket, two neighbours chatting, a waving neighbour, a
 * skater on the pond), and environmental animation (twinkling stars, shooting star, swaying
 * pines that shed snow, train steam, drifting ground snow, dripping icicles, footprints).
 *
 * Performance: everything that never changes is painted once into cached canvases (the village
 * and terrace, and 5-7 sway poses of each tree). Only small moving pieces are drawn per frame.
 * Everything uses palette indices 0-3 (3 is brightest).
 */

const FLOOR = 1024; // top of the courtyard floor (row 128)
const TER = FLOOR - 30; // the village street, on a terrace behind the courtyard
const ICE = FLOOR + 8; // surface of the frozen pond
const POND: [number, number] = [292, 364];
const LAYER_Y = FLOOR - 100; // top of the cached static village layer
const LAYER_W = 440;

/** Anything with rect + line: the live Renderer, or a BufPen painting into a cached buffer. */
interface Pen {
  rect(x: number, y: number, w: number, h: number, c: number): void;
  line(x0: number, y0: number, x1: number, y1: number, c: number): void;
}

/** Paints into a PixelBuffer using world coordinates shifted by (ox, oy). */
class BufPen implements Pen {
  constructor(
    private b: PixelBuffer,
    private ox: number,
    private oy: number,
  ) {}
  rect(x: number, y: number, w: number, h: number, c: number) {
    this.b.rect(Math.round(x) - this.ox, Math.round(y) - this.oy, w, h, c);
  }
  line(x0: number, y0: number, x1: number, y1: number, c: number) {
    this.b.line(x0 - this.ox, y0 - this.oy, x1 - this.ox, y1 - this.oy, c);
  }
}

const px = (r: Pen, x: number, y: number, c: number) => r.rect(x, y, 1, 1, c);

function inView(w: World, x0: number, x1: number) {
  const c = w.camera;
  return x1 > c.x - 12 && x0 < c.x + 332 && c.y + 190 > FLOOR - 230 && c.y < FLOOR + 40;
}

// ---------------------------------------------------------------------------------------------
// static art (painted once into cached canvases)
// ---------------------------------------------------------------------------------------------

/** A snow-laden pine; `sway` shears the upper tiers sideways. */
function pine(r: Pen, sway: number, cx: number, base: number, h: number, seed: number) {
  const tiers = h > 46 ? 4 : 3;
  const tierH = Math.round(h * (tiers === 4 ? 0.38 : 0.46));
  const step = (h - tierH) / (tiers - 1);
  r.rect(cx - 1, base - 8, 3, 8, 1);
  for (let k = tiers - 1; k >= 0; k--) {
    const top = Math.round(base - h + k * step);
    const half = (4 + k * 3) * (h / 50 + 0.35);
    for (let j = 0; j < tierH; j++) {
      const y = top + j;
      const lean = Math.round(sway * clamp((base - y) / h, 0, 1) * 1.6);
      const hw = Math.max(1, Math.round(((j + 1) / tierH) * half));
      const x0 = cx - hw + lean;
      for (let xx = x0; xx <= x0 + hw * 2; xx++) px(r, xx, y, bayer(xx - lean, y) < 0.42 ? 1 : 0);
      px(r, x0, y, 1);
      px(r, x0 + hw * 2, y, 1);
      if (j < 3) r.rect(cx + lean - j, y, j * 2 + 1, 1, 2);
      else if (j === tierH - 1) {
        for (let x = x0; x <= x0 + hw * 2; x++) px(r, x, y, (x - lean + seed) % 3 === 0 ? 2 : 1);
      } else {
        if ((j + k) % 4 === 0) px(r, x0 + 1, y, 2);
        if ((j + k) % 4 === 2) px(r, x0 + hw * 2 - 1, y, 2);
        if (hash2(x0 - lean + j, y, 91) < 0.18) px(r, x0 + 2 + Math.floor(hash2(j, k, 92) * (hw * 2 - 3)), y, 1);
      }
    }
    r.rect(cx - Math.round(half) + Math.round(sway * clamp((base - top - tierH) / h, 0, 1) * 1.6), top + tierH, sway > 0 ? 2 : 1, 1, 2);
  }
}

/** A bare, frost-furred birch. */
function birch(r: Pen, sway: number, cx: number, base: number, h: number) {
  for (let y = 0; y < h; y++) {
    const lean = Math.round(sway * (y / h) * 1.5);
    r.rect(cx + lean - 1, base - y, 2, 1, y % 5 === 2 ? 1 : 2);
  }
  const branches: [number, number, number][] = [
    [0.4, -1, 9],
    [0.55, 1, 11],
    [0.7, -1, 8],
    [0.82, 1, 7],
    [0.92, -1, 5],
  ];
  for (const [at, dir, len] of branches) {
    const by = base - Math.round(h * at);
    const bx = cx + Math.round(sway * at * 1.5);
    const flex = sway * 0.9 * dir;
    r.line(bx, by, bx + dir * len, by - Math.round(len * 0.6 + flex), 1);
    r.line(bx + dir * Math.round(len * 0.5), by - Math.round(len * 0.3), bx + dir * Math.round(len * 0.9), by - Math.round(len * 0.1) + 3, 1);
    px(r, bx + dir * len, by - Math.round(len * 0.6 + flex) - 1, 2);
  }
}

function lampBody(r: Pen, x: number, base: number, h: number) {
  r.rect(x, base - h, 1, h, 1);
  r.rect(x - 1, base - 2, 3, 2, 1);
  r.rect(x - 1, base - h - 1, 3, 1, 2);
  r.rect(x - 1, base - h + 3, 3, 1, 1);
  r.rect(x - 1, base - h + 1, 3, 2, 1);
  r.rect(x - 2, base - h - 2, 5, 1, 2); // snow cap
}

interface HouseDef {
  x: number;
  w: number;
  h: number;
  roof: number;
  seed: number;
  chimney: boolean;
  windows: [number, number][]; // offsets from the house origin / terrace
  door?: number;
}

const HOUSES: HouseDef[] = [
  { x: 204, w: 32, h: 22, roof: 12, seed: 11, chimney: true, windows: [[6, 15], [20, 15]], door: 15 },
  { x: 244, w: 28, h: 25, roof: 12, seed: 12, chimney: false, windows: [[5, 18], [17, 18]] },
  { x: 286, w: 28, h: 30, roof: 15, seed: 13, chimney: true, windows: [[5, 24], [17, 24]], door: 13 },
  { x: 326, w: 32, h: 20, roof: 11, seed: 14, chimney: true, windows: [[6, 14], [20, 14]] },
];

function chimneyPos(h: HouseDef) {
  const apex = TER - h.h - h.roof;
  return { x: Math.round(h.x + h.w * 0.72), y: apex + Math.round(h.roof * 0.45) - 2 };
}

function drawHouse(r: Pen, h: HouseDef) {
  const { x, w, roof, seed } = h;
  const top = TER - h.h;
  r.rect(x, top, w, h.h, 0);
  r.rect(x, top, 1, h.h, 1);
  r.rect(x + w - 1, top, 1, h.h, 1);
  for (let y = top + 3; y < TER; y += 4) for (let xx = x + 1; xx < x + w - 1; xx += 2) if (hash2(xx, y, seed) < 0.7) px(r, xx, y, 1);
  r.rect(x, top, w, 1, 1);
  r.rect(x + Math.floor(w / 2), top, 1, h.h, 1);
  const apex = top - roof;
  const cxr = x + w / 2;
  for (let j = 0; j <= roof; j++) {
    const y = apex + j;
    const hw = Math.round(((j + 1) / (roof + 1)) * (w / 2 + 3));
    const x0 = Math.round(cxr - hw);
    r.rect(x0, y, hw * 2, 1, j < roof * 0.45 ? 2 : 1);
    if (j >= roof * 0.45 && j % 2 === 0) for (let xx = x0 + (j % 4); xx < x0 + hw * 2; xx += 4) px(r, xx, y, 0);
    if (j < roof * 0.45) for (let xx = x0; xx < x0 + hw * 2; xx++) if (bayer(xx, y) > 0.55 + j / roof) px(r, xx, y, 1);
    px(r, x0, y, 2);
    px(r, x0 + hw * 2 - 1, y, 2);
  }
  r.rect(x - 3, top - 1, w + 6, 1, 2);
  if (h.chimney) {
    const c = chimneyPos(h);
    r.rect(c.x, c.y, 4, 8, 1);
    r.rect(c.x - 1, c.y - 1, 6, 2, 2);
  }
  for (const [wx, wy] of h.windows) windowStatic(r, x + wx, TER - wy);
  if (h.door) r.rect(x + h.door, TER - 10, 3, 10, 1);
}

function windowStatic(r: Pen, x: number, y: number) {
  r.rect(x - 1, y - 1, 6, 7, 1);
  r.rect(x, y, 4, 5, 2);
  px(r, x + 2, y, 1);
  r.rect(x, y + 2, 4, 1, 1);
  r.rect(x + 2, y, 1, 5, 1);
  r.rect(x - 2, y + 6, 8, 1, 2); // snowy sill
}

const LAMPS: [number, number][] = [
  [240, 20],
  [279, 20],
  [322, 20],
  [366, 20],
];
const BUNT = { ax: 190, ay: FLOOR - 58, bx: 378, by: 959 };
const bunY = (x: number) => {
  const k = (x - BUNT.ax) / (BUNT.bx - BUNT.ax);
  return Math.round(BUNT.ay + (BUNT.by - BUNT.ay) * k + Math.sin(k * Math.PI) * 15);
};

/** Everything in the village that never moves. */
function paintVillage(r: Pen) {
  const tx0 = 196;
  const tx1 = 374;
  r.rect(tx0, TER, tx1 - tx0, FLOOR - TER, 0);
  for (let y = TER + 4; y < FLOOR; y += 5) for (let x = tx0 + ((y / 5) % 2) * 4; x < tx1; x += 8) r.rect(x, y, 4, 1, 1);
  r.rect(tx0, TER, tx1 - tx0, 1, 2);
  for (let x = tx0; x < tx1; x += 3) if (hash2(x, 5, 703) < 0.6) px(r, x, TER - 1, 2);
  for (let i = 0; i < 14; i++) {
    for (let y = TER + i; y < FLOOR; y++) {
      if (bayer(tx0 - 14 + i, y) < i / 14 + 0.1) px(r, tx0 - 14 + i, y, 0);
      if (bayer(tx1 + 13 - i, y) < i / 14 + 0.1) px(r, tx1 + 13 - i, y, 0);
    }
    px(r, tx0 - 14 + i, TER + 13 - i, 2);
    px(r, tx1 + 13 - i, TER + 13 - i, 2);
  }
  for (const h of HOUSES) drawHouse(r, h);
  // attic window of the third house (a neighbour waves from it)
  r.rect(298, TER - 40, 5, 5, 0);
  r.rect(297, TER - 41, 7, 1, 1);
  r.rect(297, TER - 36, 7, 1, 2);
  windowStatic(r, 298, TER - 41);
  // woodpile
  r.rect(362, TER - 5, 9, 5, 1);
  for (let i = 0; i < 4; i++) px(r, 364 + i * 2, TER - 3, 2);
  r.rect(361, TER - 6, 11, 1, 2);
  for (const [x, h] of LAMPS) lampBody(r, x, TER, h);
  lampBody(r, BUNT.ax, FLOOR, 58);
  // bunting string (pennants are animated separately)
  let prevX = BUNT.ax;
  let prevY = BUNT.ay;
  for (let x = BUNT.ax + 1; x <= BUNT.bx; x++) {
    const y = bunY(x);
    r.line(prevX, prevY, x, y, 1);
    prevX = x;
    prevY = y;
  }
}

// ---------------------------------------------------------------------------------------------
// animated actors
// ---------------------------------------------------------------------------------------------

type Pose = 'walk' | 'idle' | 'wave' | 'lift' | 'talk' | 'skate';

/** A villager, about 11px tall. (x, feet) is the point between the feet. */
function person(r: Pen, t: number, x: number, feet: number, face: 1 | -1, pose: Pose, o: { hat?: number; coat?: number; carry?: boolean; pole?: boolean; phase?: number } = {}) {
  const ph = (o.phase ?? 0) + t;
  const coat = o.coat ?? 2;
  const walking = pose === 'walk';
  const step = Math.floor(ph * 5) % 2;
  const bob = walking ? (Math.floor(ph * 10) % 2 === 0 ? 0 : -1) : pose === 'idle' || pose === 'talk' ? (Math.sin(ph * 2) > 0.6 ? -1 : 0) : 0;
  const y = feet + bob;
  if (pose === 'skate') {
    const glide = Math.sin(ph * 3);
    r.rect(x - 2, feet - 3, 1, 3, 1);
    r.rect(x + 1 + (glide > 0 ? face : 0), feet - 3, 1, 3, 1);
    r.rect(x - 3 - (glide > 0 ? 0 : face), feet, 3, 1, 3);
    r.rect(x + 1, feet, 3, 1, 3);
  } else if (walking) {
    r.rect(x - 1 + (step ? -face : face), feet - 3, 1, 3, 1);
    r.rect(x + 1 + (step ? face : -face), feet - 3, 1, 3, 1);
  } else {
    r.rect(x - 1, feet - 3, 1, 3, 1);
    r.rect(x + 1, feet - 3, 1, 3, 1);
  }
  r.rect(x - 2, y - 8, 4, 5, coat);
  r.rect(x - 2, y - 4, 4, 1, 1);
  r.rect(x - 2, y - 9, 4, 1, 3);
  r.rect(x - 1, y - 12, 3, 3, 3);
  px(r, x + face, y - 11, 0);
  r.rect(x - 2, y - 13, 5, 2, o.hat ?? 1);
  px(r, x, y - 14, 2);
  const ax = x + face * 2;
  if (pose === 'wave') {
    const up = Math.floor(ph * 6) % 2;
    r.rect(ax, y - 11 - up, 1, 4, coat);
    px(r, ax, y - 12 - up, 3);
  } else if (pose === 'lift') {
    r.rect(ax, y - 9, 1, 2, coat);
  } else if (pose === 'talk') {
    const g = Math.floor(ph * 3) % 3;
    r.rect(ax, y - 8 - (g === 1 ? 2 : 0), 1, 2, coat);
    px(r, ax + face, y - 8 - (g === 1 ? 2 : 0), 3);
  } else {
    const sw = walking ? (step ? 1 : -1) : 0;
    r.rect(x - face * 2, y - 8, 1, 3, coat);
    r.rect(ax + sw * face, y - 8, 1, 3, coat);
  }
  if (o.carry) {
    r.rect(x + face * 2, y - 5, 4, 3, 1);
    r.rect(x + face * 2, y - 6, 4, 1, 2);
    px(r, x + face * 3, y - 7, 2);
  }
  if (o.pole) {
    const lift = pose === 'lift' ? 1 : 0;
    r.line(x + face * 3, feet, x + face * (3 + 5 * lift), feet - 15 - 7 * lift, 1);
    px(r, x + face * (3 + 5 * lift), feet - 16 - 7 * lift, 3);
  }
}

function sparrow(r: Pen, x: number, y: number, face: 1 | -1, flap: number, peck: boolean) {
  const bx = Math.round(x);
  const by = Math.round(y);
  r.rect(bx - 2, by - 3, 4, 3, 2);
  r.rect(bx + face * 2 - (face < 0 ? 1 : 0), by - (peck ? 2 : 4), 2, 2, 3);
  px(r, bx + face * 3 + (face < 0 ? -1 : 0), by - (peck ? 1 : 3), 3);
  r.rect(bx - face * 3 - (face > 0 ? 0 : -1), by - 3, 2, 1, 1);
  if (flap === 1) r.rect(bx - 1, by - 6, 3, 2, 2);
  else if (flap === 2) r.rect(bx - 1, by - 1, 3, 2, 2);
  else px(r, bx, by - 2, 1);
  if (!flap) {
    px(r, bx - 1, by, 1);
    px(r, bx + 1, by, 1);
  }
}

class Sparrow {
  x: number;
  y = FLOOR;
  face: 1 | -1 = 1;
  mode: 'peck' | 'hop' | 'flee' | 'perch' | 'return' = 'peck';
  t = 0;
  fx = 0;
  fy = 0;
  tx = 0;
  ty = 0;
  constructor(
    readonly home: number,
    readonly perch: [number, number],
    readonly range: number,
  ) {
    this.x = home;
    this.t = Math.random() * 2;
  }
  update(dt: number, w: World) {
    const p = w.player;
    this.t -= dt;
    const dist = Math.abs(p.cx - this.x);
    const near = dist < 34 && Math.abs(p.bottom - FLOOR) < 30;
    if ((this.mode === 'peck' || this.mode === 'hop') && near) {
      this.mode = 'flee';
      this.t = 0;
      this.fx = this.x;
      this.fy = this.y;
      this.tx = this.perch[0];
      this.ty = this.perch[1];
      this.face = this.tx > this.x ? 1 : -1;
      return;
    }
    if (this.mode === 'flee' || this.mode === 'return') {
      this.t += dt;
      const k = clamp(this.t / 1.1, 0, 1);
      this.x = this.fx + (this.tx - this.fx) * k;
      this.y = this.fy + (this.ty - this.fy) * k - Math.sin(k * Math.PI) * 14;
      if (k >= 1) {
        if (this.mode === 'flee') {
          this.mode = 'perch';
          this.t = 3 + Math.random() * 2;
        } else {
          this.mode = 'peck';
          this.t = 1 + Math.random();
        }
      }
      return;
    }
    if (this.mode === 'perch') {
      if (this.t <= 0 && dist > 70) {
        this.mode = 'return';
        this.t = 0;
        this.fx = this.perch[0];
        this.fy = this.perch[1];
        this.tx = this.home + (Math.random() - 0.5) * this.range;
        this.ty = FLOOR;
        this.face = this.tx > this.fx ? 1 : -1;
      }
      return;
    }
    if (this.t <= 0) {
      if (this.mode === 'peck' && Math.random() < 0.55) {
        this.mode = 'hop';
        this.t = 0.28;
        this.face = Math.random() < 0.5 ? 1 : -1;
        this.fx = this.x;
      } else {
        this.mode = 'peck';
        this.t = 0.8 + Math.random() * 1.6;
      }
    }
    if (this.mode === 'hop') {
      const k = 1 - this.t / 0.28;
      this.x = clamp(this.fx + this.face * 5 * k, this.home - this.range, this.home + this.range);
      this.y = FLOOR - Math.sin(clamp(k, 0, 1) * Math.PI) * 3;
    } else this.y = FLOOR;
  }
  draw(r: Pen, time: number) {
    const air = this.mode === 'flee' || this.mode === 'return';
    sparrow(r, this.x, this.y, this.face, air ? (Math.floor(time * 18) % 2 ? 1 : 2) : 0, this.mode === 'peck' && Math.floor(time * 3 + this.home) % 3 === 0);
  }
}

class Hare {
  x = 340;
  y = ICE;
  face: 1 | -1 = -1;
  mode: 'sit' | 'hop' | 'flee' = 'sit';
  t = 1.5;
  fx = 0;
  tx = 0;
  update(dt: number, w: World) {
    const p = w.player;
    this.t -= dt;
    const near = Math.abs(p.cx - this.x) < 38 && Math.abs(p.bottom - FLOOR) < 24;
    if (this.mode !== 'flee' && near) {
      this.mode = 'flee';
      this.fx = this.x;
      this.tx = p.cx < this.x ? POND[1] : POND[0];
      this.face = this.tx > this.x ? 1 : -1;
      this.t = 0.55;
    }
    if (this.mode === 'flee') {
      const k = 1 - clamp(this.t / 0.55, 0, 1);
      this.x = this.fx + (this.tx - this.fx) * k;
      this.y = ICE - Math.sin(k * Math.PI * 3) * 3;
      if (this.t <= 0) {
        this.mode = 'sit';
        this.t = 2.5;
        this.y = ICE;
      }
      return;
    }
    if (this.t <= 0) {
      if (this.mode === 'sit') {
        this.mode = 'hop';
        this.t = 0.4;
        this.fx = this.x;
        this.face = this.x < POND[0] + 14 ? 1 : this.x > POND[1] - 14 ? -1 : Math.random() < 0.5 ? 1 : -1;
        this.tx = clamp(this.x + this.face * 9, POND[0] + 4, POND[1] - 4);
      } else {
        this.mode = 'sit';
        this.t = 1.5 + Math.random() * 3;
      }
    }
    if (this.mode === 'hop') {
      const k = 1 - clamp(this.t / 0.4, 0, 1);
      this.x = this.fx + (this.tx - this.fx) * k;
      this.y = ICE - Math.sin(k * Math.PI) * 5;
    }
  }
  draw(r: Pen, time: number) {
    const f = this.face;
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const hop = this.mode !== 'sit';
    r.rect(x - 4, y - 5, 7, 5, 3);
    r.rect(x - 4, y - 2, 7, 2, 2);
    r.rect(x + f * 3 - (f < 0 ? 1 : 0), y - 7, 3, 3, 3);
    px(r, x + f * 4, y - 6, 0);
    const twitch = Math.floor(time * 2.3) % 7 === 0 ? 1 : 0;
    r.rect(x + f * 2 - (f < 0 ? 1 : 0), y - (hop ? 10 : 12), 1, hop ? 3 : 5, 3);
    r.rect(x + f * 3 - (f < 0 ? 1 : 0) + (twitch ? f : 0), y - (hop ? 9 : 11), 1, hop ? 2 : 4, 2);
    px(r, x + f * 2 - (f < 0 ? 1 : 0), y - (hop ? 10 : 12), 1);
    r.rect(x - f * 4 - (f > 0 ? 1 : 0), y - 4, 2, 2, 3);
    if (hop) r.rect(x - 4, y - 1, 3, 1, 3);
  }
}

class Skater {
  x = 300;
  dir: 1 | -1 = 1;
  trail: { x: number; age: number }[] = [];
  tt = 0;
  update(dt: number) {
    this.tt += dt;
    this.x += this.dir * 16 * dt * (0.75 + 0.25 * Math.sin(this.tt * 1.6));
    if (this.x > POND[1] - 8) this.dir = -1;
    if (this.x < POND[0] + 8) this.dir = 1;
    if (Math.random() < dt * 14) this.trail.push({ x: this.x - this.dir * 4, age: 0 });
    for (const t of this.trail) t.age += dt;
    this.trail = this.trail.filter((t) => t.age < 1.6);
  }
  draw(r: Pen, time: number) {
    for (const t of this.trail) px(r, Math.round(t.x), ICE, t.age < 0.9 ? 3 : 2);
    person(r, time, Math.round(this.x), ICE, this.dir, 'skate', { hat: 2, coat: 3, phase: 3 });
  }
}

/** The owl perches in the tall pine, then glides over to a rooftop and back. */
class Owl {
  static PERCH: [number, number] = [332, FLOOR - 67];
  static ROOST: [number, number] = [300, TER - 46];
  mode: 'perch' | 'out' | 'roost' | 'back' = 'perch';
  t = 14;
  x = Owl.PERCH[0];
  y = Owl.PERCH[1];
  update(dt: number) {
    this.t -= dt;
    if (this.mode === 'perch' && this.t <= 0) {
      this.mode = 'out';
      this.t = 2.6;
    } else if (this.mode === 'roost' && this.t <= 0) {
      this.mode = 'back';
      this.t = 2.6;
    }
    if (this.mode === 'out' || this.mode === 'back') {
      const k = 1 - clamp(this.t / 2.6, 0, 1);
      const [fx, fy] = this.mode === 'out' ? Owl.PERCH : Owl.ROOST;
      const [tx, ty] = this.mode === 'out' ? Owl.ROOST : Owl.PERCH;
      this.x = fx + (tx - fx) * k;
      this.y = fy + (ty - fy) * k - Math.sin(k * Math.PI) * 12;
      if (this.t <= 0) {
        this.mode = this.mode === 'out' ? 'roost' : 'perch';
        this.t = this.mode === 'roost' ? 7 + Math.random() * 4 : 20 + Math.random() * 10;
        [this.x, this.y] = this.mode === 'roost' ? Owl.ROOST : Owl.PERCH;
      }
    }
  }
  draw(r: Pen, time: number, playerX: number) {
    const ox = Math.round(this.x);
    const oy = Math.round(this.y);
    const flying = this.mode === 'out' || this.mode === 'back';
    const turn = clamp(Math.round((playerX - ox) / 60), -1, 1);
    r.rect(ox - 3, oy - 6, 7, 9, 2);
    r.rect(ox - 3, oy - 7, 1, 1, 2);
    r.rect(ox + 3, oy - 7, 1, 1, 2);
    r.rect(ox - 2, oy - 5, 5, 3, 3);
    if (flying) {
      const up = Math.floor(time * 9) % 2 === 0;
      const dir = this.mode === 'out' ? (Owl.ROOST[0] > Owl.PERCH[0] ? 1 : -1) : Owl.ROOST[0] > Owl.PERCH[0] ? -1 : 1;
      r.rect(ox - 8, oy - (up ? 8 : 2), 5, 2, 2);
      r.rect(ox + 4, oy - (up ? 8 : 2), 5, 2, 2);
      px(r, ox - 1 + dir, oy - 4, 0);
      px(r, ox + 1 + dir, oy - 4, 0);
      return;
    }
    if (Math.floor(time * 5) % 23 === 0) r.rect(ox - 2 + turn, oy - 4, 5, 1, 0);
    else {
      px(r, ox - 1 + turn, oy - 4, 0);
      px(r, ox + 1 + turn, oy - 4, 0);
    }
    px(r, ox, oy - 3, 1);
    r.rect(ox - 2, oy + 3, 5, 1, 1);
    r.rect(ox - 2, oy, 5, 2, 1);
    px(r, ox - 1, oy + 1, 2);
    px(r, ox + 1, oy + 1, 2);
  }
}

function dog(r: Pen, t: number, x: number, y: number, face: 1 | -1, moving: boolean) {
  const f = face;
  const leg = moving ? Math.floor(t * 8) % 2 : 0;
  r.rect(x - 4, y - 5, 8, 3, 2);
  r.rect(x - 4, y - 4, 8, 1, 3);
  r.rect(x + f * 4 - (f < 0 ? 2 : 0), y - 7, 3, 3, 2);
  px(r, x + f * 5 - (f < 0 ? 1 : 0), y - 6, 0);
  px(r, x + f * 3 - (f < 0 ? 1 : 0), y - 8, 1);
  r.rect(x - 3 + leg, y - 2, 1, 2, 1);
  r.rect(x + 2 - leg, y - 2, 1, 2, 1);
  r.rect(x - 4 - (moving ? 0 : 0), y - 2, 1, 2, 1);
  const wag = Math.floor(t * 9) % 2;
  r.rect(x - f * 5 - (f > 0 ? 0 : -1), y - 6 - wag, 1, 2, 2);
}

// ---------------------------------------------------------------------------------------------
// the scenery entity
// ---------------------------------------------------------------------------------------------

const PINES: { x: number; h: number; seed: number }[] = [
  { x: 54, h: 62, seed: 1 },
  { x: 332, h: 66, seed: 3 },
  { x: 410, h: 36, seed: 6 },
];
const BIRCHES: { x: number; h: number; seed: number }[] = [
  { x: 286, h: 40, seed: 7 },
  { x: 384, h: 34, seed: 8 },
];

class Scenery extends Entity {
  private sparrows = [new Sparrow(120, [176, FLOOR - 60], 40), new Sparrow(24, [54, FLOOR - 36], 14), new Sparrow(236, [332, FLOOR - 58], 22)];
  private hare = new Hare();
  private skater = new Skater();
  private owl = new Owl();
  private lampFlare = 0;
  private lx = 214;
  private ldir: 1 | -1 = 1;
  private lpose: Pose = 'walk';
  private ltimer = 0;
  private bx = 330;
  private bdir: 1 | -1 = 1;
  private bwait = 0;
  private shed = 3;
  // cached art
  private palette: unknown = null;
  private village: HTMLCanvasElement | null = null;
  private trees = new Map<string, HTMLCanvasElement>();

  constructor(world: World) {
    super(world, 0, 0, 1, 1);
    this.depth = -6;
  }

  update(dt: number) {
    const w = this.world;
    if (!inView(w, 0, 440)) return;
    for (const s of this.sparrows) s.update(dt, w);
    this.hare.update(dt, w);
    this.skater.update(dt);
    this.owl.update(dt);
    this.lampFlare = Math.max(0, this.lampFlare - dt);
    if (this.lpose === 'walk') {
      this.lx += this.ldir * 11 * dt;
      for (const lamp of [240, 279]) {
        if (Math.abs(this.lx + this.ldir * 6 - lamp) < 0.6) {
          this.lpose = 'lift';
          this.ltimer = 1.6;
          break;
        }
      }
      if (this.lx > 282) this.ldir = -1;
      if (this.lx < 208) this.ldir = 1;
    } else {
      this.ltimer -= dt;
      if (this.ltimer < 1.0 && this.ltimer + dt >= 1.0) this.lampFlare = 1.2;
      if (this.ltimer <= 0) {
        this.lpose = 'walk';
        this.lx += this.ldir * 2;
      }
    }
    if (this.bwait > 0) this.bwait -= dt;
    else {
      this.bx += this.bdir * 8 * dt;
      if (this.bx > 362) {
        this.bdir = -1;
        this.bwait = 2.5;
      }
      if (this.bx < 326) {
        this.bdir = 1;
        this.bwait = 2.5;
      }
    }
    this.shed -= dt;
    if (this.shed <= 0) {
      this.shed = 2.5 + Math.random() * 3;
      const pn = PINES[Math.floor(Math.random() * PINES.length)];
      const cam = w.camera;
      if (pn.x > cam.x - 10 && pn.x < cam.x + 330)
        w.particles.burst(pn.x + (Math.random() - 0.5) * 12, FLOOR - pn.h * 0.55, 4, { colors: [2, 3], speed: [2, 8], angle: [1.2, 1.9], grav: 90, life: [0.7, 1.3], size: [1, 1] });
    }
  }

  /** (Re)build the cached village layer for the current palette. */
  private build(r: Renderer) {
    if (this.village && this.palette === r.palette) return;
    this.palette = r.palette;
    this.trees.clear();
    const b = new PixelBuffer(LAYER_W, FLOOR - LAYER_Y + 1);
    paintVillage(new BufPen(b, 0, LAYER_Y));
    this.village = b.toCanvas(r.palette, this.village ?? undefined);
  }

  private tree(r: Renderer, kind: 'pine' | 'birch', i: number, step: number): HTMLCanvasElement {
    const key = `${kind}${i}:${step}`;
    let c = this.trees.get(key);
    if (c) return c;
    if (kind === 'pine') {
      const p = PINES[i];
      const b = new PixelBuffer(72, p.h + 12);
      pine(new BufPen(b, 0, 0), step * 0.5, 36, p.h + 10, p.h, p.seed);
      c = b.toCanvas(r.palette);
    } else {
      const p = BIRCHES[i];
      const b = new PixelBuffer(56, p.h + 22);
      birch(new BufPen(b, 0, 0), step * 0.45, 28, p.h + 6, p.h);
      c = b.toCanvas(r.palette);
    }
    this.trees.set(key, c);
    return c;
  }

  drawBack(r: Renderer) {
    const w = this.world;
    if (!inView(w, 0, 440)) return;
    this.build(r);
    const t = w.time;
    const cam = w.camera;

    // sky: twinkling stars in screen space (same parallax as the backdrop) and a shooting star
    const ox = r.ox;
    const oy = r.oy;
    r.ox = 0;
    r.oy = 0;
    const par = Math.round(cam.x * 0.1);
    for (let i = 0; i < 26; i++) {
      const hx = Math.floor(hash2(i, 3, 701) * 640);
      const sx = (((hx - par) % 640) + 640) % 640;
      if (sx > 316) continue;
      const sy = 4 + Math.floor(hash2(i, 4, 701) * 84);
      const ph = Math.sin(t * (1.2 + hash2(i, 5, 701) * 2) + i * 5);
      if (ph > 0.55) {
        px(r, sx, sy, 3);
        if (ph > 0.85) {
          px(r, sx - 1, sy, 2);
          px(r, sx + 1, sy, 2);
          px(r, sx, sy - 1, 2);
          px(r, sx, sy + 1, 2);
        }
      } else if (ph > 0.1) px(r, sx, sy, 2);
    }
    const cyc = (t % 21) / 21;
    if (cyc < 0.07) {
      const k = cyc / 0.07;
      const sx = 250 - k * 150;
      const sy = 10 + k * 46;
      for (let i = 0; i < 9; i++) px(r, sx + i * 1.6, sy - i * 0.9, i < 2 ? 3 : i < 5 ? 2 : 1);
    }
    r.ox = ox;
    r.oy = oy;

    // a flock crossing the sky behind the village
    for (let i = 0; i < 5; i++) {
      const phase = (t * 9 + i * 14) % 760;
      const bx = 460 - phase + (i % 2) * 6;
      const by = FLOOR - 118 + Math.abs(i - 2) * 6 + Math.sin(t * 0.6 + i) * 3;
      const up = Math.floor(t * 6 + i) % 2;
      px(r, bx, by, 1);
      px(r, bx - 1, by + (up ? 1 : -1), 1);
      px(r, bx + 1, by + (up ? 1 : -1), 1);
      px(r, bx - 2, by + (up ? 2 : -2), 1);
      px(r, bx + 2, by + (up ? 2 : -2), 1);
    }

    // the cached village layer, then its moving parts
    if (this.village) r.image(this.village, 0, LAYER_Y);
    for (const h of HOUSES) {
      if (h.chimney) {
        const c = chimneyPos(h);
        for (let k = 0; k < 6; k++) {
          const age = (t * 0.28 + k / 6 + h.seed * 0.13) % 1;
          const sx = c.x + 2 + Math.sin(age * 7 + h.seed + k) * 2 + age * 9;
          const sy = c.y - 2 - age * 30;
          const s = age < 0.35 ? 1 : 2;
          r.rect(sx, sy, s, s, age < 0.65 ? 2 : 1);
        }
      }
      for (const [wx, wy] of h.windows) {
        const flick = Math.sin(t * 6 + (h.x + wx) * 0.7) > 0.92;
        if (flick) r.rect(h.x + wx + 1, TER - wy + 1, 2, 1, 3);
      }
    }
    // bunting pennants flutter
    for (let x = BUNT.ax + 4; x <= BUNT.bx; x += 8) {
      const y = bunY(x);
      const flap = Math.sin(t * 3 + x * 0.2) > 0.3 ? 1 : 0;
      const c = ((x - BUNT.ax) / 8) % 2 === 0 ? 2 : 3;
      r.rect(x, y + 1, 3, 1, c);
      r.rect(x + flap, y + 2, 2, 1, c);
      px(r, x + 1 + flap, y + 3, c);
    }
    // lamp glow and flames
    const flare = clamp(this.lampFlare, 0, 1);
    const glow = (x: number, base: number, h: number, f: number) => {
      const flick = Math.sin(t * 9 + x) > 0.85 ? 1 : 0;
      r.halo(x, base - h + 1, 4 + flick + Math.round(f * 3), 1);
      r.rect(x - 1, base - h + 1, 3, 2, 1);
      r.rect(x, base - h + 1, 1, 2, f > 0.3 ? 3 : 3);
    };
    glow(240, TER, 20, this.lpose === 'lift' ? flare : 0);
    glow(279, TER, 20, this.lampFlare > 0 && this.lx > 262 ? flare : 0);
    glow(322, TER, 20, 0);
    glow(366, TER, 20, 0);
    glow(BUNT.ax, FLOOR, 58, 0);

    // village people
    const waving = Math.abs(w.player.cx - 300) < 70;
    if (waving) person(r, t, 300, TER - 31, w.player.cx < 300 ? -1 : 1, 'wave', { hat: 2, coat: 2 });
    person(r, t, Math.round(this.lx), TER, this.ldir, this.lpose, { hat: 1, pole: true, coat: 2, phase: 0 });
    person(r, t, 294, TER, 1, 'talk', { hat: 2, coat: 2, phase: 0.4 });
    person(r, t, 302, TER, -1, 'talk', { hat: 1, coat: 1, phase: 1.7 });
    const dots = Math.floor(t * 1.5) % 4;
    for (let i = 0; i < dots; i++) px(r, 296 + i * 2, TER - 17, 3);
    const moving = this.bwait <= 0;
    person(r, t, Math.round(this.bx), TER, this.bdir, moving ? 'walk' : 'idle', { hat: 2, coat: 1, carry: true, phase: 0.8 });
    dog(r, t, Math.round(this.bx - this.bdir * 12), TER, this.bdir, moving);

    // trees: pick the cached sway pose
    PINES.forEach((p, i) => {
      const s = Math.sin(t * 0.8 + p.seed * 2.1) * 1.1 + Math.sin(t * 1.9 + p.seed) * 0.4;
      const step = clamp(Math.round(s / 0.5), -3, 3);
      r.image(this.tree(r, 'pine', i, step), p.x - 36, FLOOR - p.h - 10);
    });
    BIRCHES.forEach((p, i) => {
      const s = Math.sin(t * 0.7 + p.seed) * 0.8;
      const step = clamp(Math.round(s / 0.45), -2, 2);
      r.image(this.tree(r, 'birch', i, step), p.x - 28, FLOOR - p.h - 6);
    });
    // the owl lives in the tallest pine (and sometimes visits the rooftops)
    this.owl.draw(r, t, w.player.cx);
  }

  draw(r: Renderer) {
    const w = this.world;
    if (!inView(w, 0, 440)) return;
    const t = w.time;
    // steam leaking from under the parked train
    for (const sx of [100, 150]) {
      for (let k = 0; k < 4; k++) {
        const age = (t * 0.33 + k / 4 + sx * 0.011) % 1;
        const x = sx + age * 7 + Math.sin(age * 9 + k) * 1.5;
        const y = FLOOR - 4 - age * 15;
        const s = age < 0.3 ? 1 : age < 0.7 ? 2 : 3;
        if (age < 0.9) r.rect(x, y, s, s, age < 0.55 ? 3 : 2);
      }
    }
    // drifting ground snow
    for (let k = 0; k < 6; k++) {
      const sp = 22 + hash2(k, 1, 711) * 26;
      const x = ((t * sp + k * 83) % 520) - 20;
      const y = FLOOR - 2 - k * 2 - Math.round(Math.sin(t * 1.3 + k) * 1);
      r.rect(x, y, 3 + (k % 2) * 2, 1, k % 2 ? 2 : 1);
    }
    const b = Math.floor(t * 4);
    for (let k = 0; k < 5; k++) px(r, Math.floor(hash2(b, k, 721) * 430), FLOOR - 1, 3);
    for (const x of [150, 232, 396]) {
      r.rect(x - 4, FLOOR - 4, 9, 4, 1);
      r.rect(x - 3, FLOOR - 5, 7, 1, 1);
      r.rect(x - 3, FLOOR - 6, 6, 1, 2);
      px(r, x + 1, FLOOR - 4, 2);
      px(r, x - 2, FLOOR - 3, 2);
    }
    // icicles under the porch awning, with glints and slow drips
    for (let k = 0; k < 9; k++) {
      const x = 378 + k * 6;
      const len = 3 + Math.floor(hash2(k, 2, 731) * 4);
      r.rect(x, 968, 1, len, 2);
      px(r, x, 968 + len, 3);
      if ((t * 0.6 + k * 0.37) % 1 < 0.05) {
        px(r, x, 968 + len - 1, 3);
        px(r, x - 1, 968 + len - 1, 2);
        px(r, x + 1, 968 + len - 1, 2);
      }
      if (k % 3 === 0) {
        const ph = (t * 0.33 + k * 0.21) % 1;
        if (ph < 0.3) px(r, x, 968 + len + 1 + Math.round(ph * ph * 260), 2);
      }
    }
    // ground-level creatures stay behind the NPCs and the player (depth -6)
    for (const s of this.sparrows) s.draw(r, t);
    this.hare.draw(r, t);
    this.skater.draw(r, t);
    // the cat naps on the terrace wall; its tail swishes and a tiny z floats up
    const cx = 278;
    const cy = TER;
    r.rect(cx - 4, cy - 4, 8, 4, 1);
    r.rect(cx - 3, cy - 5, 6, 1, 1);
    r.rect(cx - 4, cy - 6, 2, 2, 1);
    r.rect(cx - 3, cy - 7, 1, 1, 2);
    px(r, cx - 4, cy - 7, 1);
    px(r, cx - 3, cy - 5, 2);
    r.rect(cx + 4, cy - 2 + (Math.sin(t * 2) > 0 ? 0 : 1), 3, 1, 1);
    px(r, cx + 6, cy - 3 + (Math.sin(t * 2) > 0 ? 0 : 1), 1);
    const z = (t * 0.4) % 1;
    if (z < 0.8) r.text('z', cx + 3 + Math.round(Math.sin(z * 6) * 1), cy - 9 - Math.round(z * 8), z < 0.5 ? 3 : 2);
  }
}

/** Frost-world polish for the avatar: visible breath, a small scarf and footprints. Visuals only. */
class PlayerFx extends Entity {
  private breath = 1.5;
  private prints: { x: number; age: number }[] = [];
  private lastPrint = -99;

  constructor(world: World) {
    super(world, 0, 0, 1, 1);
    this.depth = 11; // after the player sprite
  }

  update(dt: number) {
    const p = this.world.player;
    for (const f of this.prints) f.age += dt;
    this.prints = this.prints.filter((f) => f.age < 7);
    if (!p.alive) return;
    if (Math.abs(p.bottom - FLOOR) <= 1 && p.cx < 430 && Math.abs(p.vx) > 25 && Math.abs(p.cx - this.lastPrint) > 7) {
      this.lastPrint = p.cx;
      this.prints.push({ x: Math.round(p.cx - p.facing * 2), age: 0 });
    }
    this.breath -= dt;
    if (this.breath <= 0) {
      this.breath = 1.9 + Math.random() * 1.2;
      const idle = Math.abs(p.vx) < 8;
      this.world.particles.burst(p.cx + p.facing * 4, p.y + 5, idle ? 3 : 2, {
        colors: [3, 2],
        speed: [4, 12],
        angle: p.facing > 0 ? [-0.8, -0.1] : [-3.0, -2.3],
        life: [0.6, 1.0],
        drag: 1.2,
        size: [1, 1],
      });
    }
  }

  draw(r: Renderer) {
    for (const f of this.prints) r.rect(f.x, FLOOR, 2, 1, f.age < 4 ? 1 : 2);
    const p = this.world.player;
    if (!p.alive || p.state !== 'normal') return;
    const t = this.world.time;
    const trail: 1 | -1 = Math.abs(p.vx) > 12 ? (p.vx > 0 ? -1 : 1) : (-p.facing as 1 | -1);
    const speed = clamp(Math.abs(p.vx) / 90, 0, 1);
    const rise = clamp(-p.vy / 200, -1, 1);
    const nx = Math.round(p.cx);
    const ny = Math.round(p.bottom - 11);
    for (let i = 1; i <= 4; i++) {
      const wave = Math.sin(t * 9 - i * 1.1) * (0.5 + speed * 0.9);
      const x = nx + trail * Math.round(i * (0.9 + speed * 0.9));
      const y = ny + Math.round(wave + i * 0.35 * (1 - speed) + rise * i * 0.8);
      px(r, x, y, i < 3 ? 3 : 2);
      px(r, x, y + 1, 2);
    }
  }
}

registerEntity('frostbell:scenery', (w) => {
  w.add(new PlayerFx(w));
  return new Scenery(w);
});
