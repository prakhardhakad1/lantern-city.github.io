import { hexToRgb, type Palette } from './palette';
import { H, W } from './renderer';

/**
 * RECOLOUR PASS: the art stays 4-colour (indices 0-3), but each screen layer is repainted with
 * its own 4-colour ramp at the end of the frame. Backgrounds, terrain, creatures and the hero
 * each get their own colours, so a scene shows 16+ colours instead of 4. Optional extras:
 *  - sky: transparent pixels become a vertical gradient
 *  - depth: terrain darkens with distance below the nearest open air above it
 *  - lip: the top pixel of every surface gets a highlight colour
 *  - outline: a 1px outline around everything on the layer (characters)
 * Purely visual: works on finished pixels, never on game state.
 */
export interface Ramp {
  /** Colours for palette indices 0..3. */
  c: [string, string, string, string];
  sky?: [string, string, string];
  depth?: { col: string; max: number; k: number };
  lip?: string;
  outline?: string;
}

type RGB = [number, number, number];
const toRgb = (s: string): RGB => (s.startsWith('#') ? hexToRgb(s) : (s.match(/\d+/g)!.slice(0, 3).map(Number) as RGB));
const pack = ([r, g, b]: RGB) => (0xff000000 | (b << 16) | (g << 8) | r) >>> 0;
const lerp = (a: RGB, b: RGB, t: number): RGB => [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];

interface Compiled {
  key: string;
  src: number[];
  dst: number[];
  sky: Uint32Array | null;
  depth: Uint32Array[] | null; // per index, per depth step
  depthMax: number;
  lip: number;
  outline: number;
}

const compiled = new Map<string, Compiled>();

function compile(pal: Palette, ramp: Ramp): Compiled {
  const key = `${pal.join()}|${ramp.c.join()}|${ramp.sky?.join()}|${ramp.depth?.col}${ramp.depth?.max}${ramp.depth?.k}|${ramp.lip}|${ramp.outline}`;
  let c = compiled.get(key);
  if (c) return c;
  const src = pal.map((p) => pack(hexToRgb(p)) & 0x00ffffff);
  const dstRgb = ramp.c.map(toRgb);
  let sky: Uint32Array | null = null;
  if (ramp.sky) {
    const [a, b, d] = ramp.sky.map(toRgb);
    sky = new Uint32Array(H);
    for (let y = 0; y < H; y++) {
      const t = y / (H - 1);
      sky[y] = pack(t < 0.55 ? lerp(a, b, t / 0.55) : lerp(b, d, (t - 0.55) / 0.45));
    }
  }
  let depth: Uint32Array[] | null = null;
  const dm = ramp.depth?.max ?? 0;
  if (ramp.depth) {
    const dc = toRgb(ramp.depth.col);
    depth = dstRgb.map((col) => {
      const arr = new Uint32Array(dm + 1);
      for (let d = 0; d <= dm; d++) arr[d] = pack(lerp(col, dc, (d / dm) * ramp.depth!.k));
      return arr;
    });
  }
  c = {
    key,
    src,
    dst: dstRgb.map(pack),
    sky,
    depth,
    depthMax: dm,
    lip: ramp.lip ? pack(toRgb(ramp.lip)) : 0,
    outline: ramp.outline ? pack(toRgb(ramp.outline)) : 0,
  };
  compiled.set(key, c);
  return c;
}

let alphaBuf = new Uint8Array(W * H);

/** Recolour a W x H layer canvas in place. */
export function recolor(canvas: HTMLCanvasElement, pal: Palette, ramp: Ramp, region?: { x: number; y: number; w: number; h: number }) {
  const ctx = canvas.getContext('2d')!;
  const rx = Math.max(0, Math.floor(region?.x ?? 0));
  const ry = Math.max(0, Math.floor(region?.y ?? 0));
  const RW = Math.min(W - rx, Math.ceil(region?.w ?? W));
  const RH = Math.min(H - ry, Math.ceil(region?.h ?? H));
  if (RW <= 0 || RH <= 0) return;
  const img = ctx.getImageData(rx, ry, RW, RH);
  const px = new Uint32Array(img.data.buffer, img.data.byteOffset, RW * RH);
  const c = compile(pal, ramp);
  const [s0, s1, s2, s3] = c.src;
  if (alphaBuf.length < RW * RH) alphaBuf = new Uint8Array(W * H);
  const al = alphaBuf;
  for (let i = 0; i < RW * RH; i++) al[i] = px[i] >>> 24 > 0 ? 1 : 0;
  const Wd = RW;
  for (let x = 0; x < RW; x++) {
    let run = c.depthMax; // pixels since open air above (start "deep" at the top edge)
    for (let y = 0; y < RH; y++) {
      const i = y * Wd + x;
      if (!al[i]) {
        run = 0;
        if (c.outline && ((x > 0 && al[i - 1]) || (x < RW - 1 && al[i + 1]) || (y > 0 && al[i - Wd]) || (y < RH - 1 && al[i + Wd]))) px[i] = c.outline;
        else if (c.sky) px[i] = c.sky[y + ry];
        continue;
      }
      const v = px[i] & 0x00ffffff;
      const idx = v === s0 ? 0 : v === s1 ? 1 : v === s2 ? 2 : v === s3 ? 3 : -1;
      run++;
      if (idx < 0) continue;
      if (c.lip && run === 1 && idx > 0 && y > 0) px[i] = c.lip;
      else if (c.depth) px[i] = c.depth[idx][Math.min(run - 1, c.depthMax)];
      else px[i] = c.dst[idx];
    }
  }
  ctx.putImageData(img, rx, ry);
}

/** Ramp colours mixed toward another colour (distance haze for far layers). */
export function fade(r: Ramp, toward: string, t: number): Ramp {
  const to = toRgb(toward);
  const m = (s: string) => {
    const [a, b, c] = lerp(toRgb(s), to, t);
    return `rgb(${a},${b},${c})`;
  };
  return { ...r, c: r.c.map(m) as Ramp['c'], depth: undefined, lip: undefined, outline: undefined };
}
