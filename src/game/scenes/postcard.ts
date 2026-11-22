import { vGradient } from '../../engine/fx';
import type { Palette } from '../../engine/palette';
import { PixelBuffer } from '../../engine/pixels';
import { recolor } from '../../engine/recolor';
import { H, W } from '../../engine/renderer';
import { frameCanvas, getSheet, setSpritePalette } from '../../engine/sprites';
import { T, TileMap } from '../../engine/tilemap';
import { lookOf } from '../look';
import type { WorldDef } from '../registry';

/**
 * A full-colour 320x180 snapshot of a world for the title screen: its sky, parallax layers,
 * a strip of its real terrain and its sector lantern, recoloured exactly like in game.
 * Built once per world (it repaints the backdrop buffers), then cached.
 */
const cache = new Map<string, HTMLCanvasElement>();

const canvas = () => {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  return c;
};

export function postcard(def: WorldDef, restorePalette: Palette): HTMLCanvasElement {
  const hit = cache.get(def.id);
  if (hit) return hit;
  const pal = def.palette;
  const look = lookOf(def);
  const theme = look.theme;
  const paint = (f?: (b: PixelBuffer) => void) => {
    if (!f) return null;
    const b = new PixelBuffer(640, H);
    f(b);
    return b.toCanvas(pal);
  };
  const far = paint(def.backdrop.far);
  const mid = paint(def.backdrop.mid);
  const near = paint(def.backdrop.near);
  const map = new TileMap(W / 8, 5, def.tiles);
  for (let x = 0; x < W / 8; x++) for (let y = 1; y < 5; y++) map.set(x, y, T.Solid);
  // a little step in the ground so the tile style's edges and grass show
  for (let x = 0; x < 9; x++) map.set(x, 1, T.Empty);
  const ground = map.render(pal);

  const out = canvas();
  const o = out.getContext('2d')!;
  o.imageSmoothingEnabled = false;
  const layer = (draw: (ctx: CanvasRenderingContext2D) => void, ramp?: Parameters<typeof recolor>[2]) => {
    const c = canvas();
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.imageSmoothingEnabled = false;
    draw(ctx);
    if (ramp) recolor(c, pal, ramp);
    o.drawImage(c, 0, 0);
  };
  if (!theme) o.drawImage(vGradient([[0, look.sky[0]], [0.55, look.sky[1]], [1, look.sky[2]]]), 0, 0, W, H);
  layer((ctx) => far && ctx.drawImage(far, -40, 0), theme?.far);
  layer((ctx) => {
    if (mid) ctx.drawImage(mid, -120, 0);
    if (near) ctx.drawImage(near, -200, 0);
  }, theme?.near);
  layer((ctx) => ctx.drawImage(ground, 0, H - 40), theme?.terrain);
  // the sector lantern, lit
  setSpritePalette(pal);
  layer((ctx) => {
    const s = getSheet('goal');
    ctx.drawImage(frameCanvas('goal', 'a'), 236 - s.ox, H - 32 - s.oy);
  }, theme?.actors);
  setSpritePalette(restorePalette);
  cache.set(def.id, out);
  return out;
}
