import { hexToRgb } from './palette';
import { H, W, type Renderer } from './renderer';

/**
 * Visual-only helpers: a private random stream (so decoration never consumes Math.random, which
 * gameplay uses), colour mixing, cached gradients and soft light sprites, and a tiny particle
 * pool for decoration. Nothing in here touches world state.
 */

/** Mulberry32: a small seeded PRNG. */
export function makeRng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Shared decoration RNG. */
export const fxRand = makeRng(0x1a77e2);
export const fxRange = (lo: number, hi: number) => lo + fxRand() * (hi - lo);

export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `rgb(${c(ar, br)},${c(ag, bg)},${c(ab, bb)})`;
}

export function rgba(hex: string, a: number): string {
  const [r, g, b] = hex.startsWith('#') ? hexToRgb(hex) : parseRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

function parseRgb(s: string): [number, number, number] {
  const m = s.match(/\d+/g) ?? ['0', '0', '0'];
  return [Number(m[0]), Number(m[1]), Number(m[2])];
}

const mkCanvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

const cache = new Map<string, HTMLCanvasElement>();

/** A full-screen vertical gradient, given as [stop, colour] pairs. */
export function vGradient(stops: [number, string][]): HTMLCanvasElement {
  const key = `v|${stops.map((s) => s.join(':')).join('|')}`;
  let c = cache.get(key);
  if (c) return c;
  c = mkCanvas(1, H);
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  for (const [o, col] of stops) g.addColorStop(o, col);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1, H);
  cache.set(key, c);
  return c;
}

/** A soft round light sprite (radial gradient) of radius r in colour `col`. */
export function glowSprite(r: number, col: string): HTMLCanvasElement {
  const key = `g|${r}|${col}`;
  let c = cache.get(key);
  if (c) return c;
  c = mkCanvas(r * 2, r * 2);
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, rgba(col, 1));
  g.addColorStop(0.25, rgba(col, 0.55));
  g.addColorStop(0.6, rgba(col, 0.16));
  g.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, r * 2, r * 2);
  cache.set(key, c);
  return c;
}

/** Corner darkening, cached per colour/strength. */
export function vignette(col: string, strength: number): HTMLCanvasElement {
  const key = `vig|${col}|${strength}`;
  let c = cache.get(key);
  if (c) return c;
  c = mkCanvas(W, H);
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62);
  g.addColorStop(0, rgba(col, 0));
  g.addColorStop(1, rgba(col, strength));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  cache.set(key, c);
  return c;
}

/** Draw a cached canvas stretched over the whole screen with a composite mode and alpha. */
export function blit(r: Renderer, img: HTMLCanvasElement, op: GlobalCompositeOperation = 'source-over', alpha = 1, x = 0, y = 0, w = W, h = H) {
  const ctx = r.ctx;
  ctx.save();
  ctx.globalCompositeOperation = op;
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, x, y, w, h);
  ctx.restore();
}

/** Additive soft glow at a world point. */
export function glow(r: Renderer, x: number, y: number, rad: number, col: string, alpha: number) {
  const ctx = r.ctx;
  const R = Math.max(2, Math.round(rad));
  const sx = Math.round(x) + r.ox - R;
  const sy = Math.round(y) + r.oy - R;
  if (sx > W || sy > H || sx + R * 2 < 0 || sy + R * 2 < 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha;
  ctx.drawImage(glowSprite(R, col), sx, sy);
  ctx.restore();
}

interface DecorParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  c: number;
  grav: number;
  drag: number;
}

/** Decoration-only particles: same feel as engine Particles, but on the private RNG. */
export class DecorParticles {
  list: DecorParticle[] = [];
  burst(x: number, y: number, n: number, o: { speed?: [number, number]; angle?: [number, number]; life?: [number, number]; colors?: number[]; grav?: number; drag?: number; spread?: number } = {}) {
    for (let i = 0; i < n; i++) {
      const a = fxRange(...(o.angle ?? [0, Math.PI * 2]));
      const s = fxRange(...(o.speed ?? [20, 60]));
      const life = fxRange(...(o.life ?? [0.3, 0.6]));
      const sp = o.spread ?? 0;
      const cols = o.colors ?? [3];
      this.list.push({
        x: x + fxRange(-sp, sp),
        y: y + fxRange(-sp, sp),
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life,
        max: life,
        c: cols[Math.floor(fxRand() * cols.length)],
        grav: o.grav ?? 0,
        drag: o.drag ?? 2,
      });
    }
    if (this.list.length > 400) this.list.splice(0, this.list.length - 400);
  }
  update(dt: number) {
    for (const p of this.list) {
      p.life -= dt;
      p.vy += p.grav * dt;
      const k = Math.max(0, 1 - p.drag * dt);
      p.vx *= k;
      p.vy *= k;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.list = this.list.filter((p) => p.life > 0);
  }
  draw(r: Renderer) {
    for (const p of this.list) r.rect(p.x, p.y, 1, 1, p.c);
  }
}
