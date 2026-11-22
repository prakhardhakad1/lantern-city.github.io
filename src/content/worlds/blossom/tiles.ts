import { bayer, hash2 } from '../../../engine/math';
import type { PixelBuffer } from '../../../engine/pixels';
import { T, type TileMap } from '../../../engine/tilemap';
import { hangers, makeStyle, paintSolid, tufts, type SolidLook } from '../../../game/tilekit';

/**
 * Blossom Terrace terrain:
 *   - terraced garden earth: rounded river stones set in soil, darker with depth,
 *   - lacquered timber for thin structures (pagoda walls, pillars, roofs),
 *   - bamboo poles for one-way platforms, sharpened bamboo stakes for spikes.
 */
function stones(x: number, y: number): number {
  // a staggered grid of rounded stones (10x6), each with a lit top-left
  const row = Math.floor(y / 6);
  const sx = x + (row & 1) * 5;
  const cx = Math.floor(sx / 10);
  const lx = sx - cx * 10;
  const ly = y - row * 6;
  const r = hash2(cx, row, 51);
  if (lx === 0 || lx === 9 || ly === 5) return 0;
  if ((lx === 1 || lx === 8) && (ly === 0 || ly === 4)) return 0;
  if (r < 0.18) return bayer(x, y) < 0.3 ? 1 : 0; // soil between stones
  if (ly === 0 || lx === 1) return 2;
  return r < 0.6 ? 1 : (x + y) % 5 === 0 ? 2 : 1;
}

function deepStones(x: number, y: number): number {
  const c = stones(x, y);
  return c === 2 ? 1 : c === 1 && bayer(x, y) < 0.5 ? 1 : 0;
}

/** Lacquered timber: vertical boards with pegs and dark seams. */
function timber(x: number, y: number): number {
  const col = Math.floor(x / 4);
  if (x % 4 === 3) return 0;
  if (y % 12 === 0) return 2;
  if (y % 12 === 6 && x % 4 === 1) return 2;
  return hash2(col, Math.floor(y / 12), 52) < 0.2 ? 0 : 1;
}

const EARTH: SolidLook = { texture: stones, edge: 2, top: 3, topThickness: 1, gap: true, rounded: true };
const DEEP: SolidLook = { ...EARTH, texture: deepStones };
const WOOD: SolidLook = { texture: timber, edge: 2, top: 2, topThickness: 2, gap: true, rounded: false };

const solid = (map: TileMap, tx: number, ty: number) => (ty >= map.h ? true : map.solidTile(tx, ty));
function openWithin(map: TileMap, tx: number, ty: number, dx: number, dy: number, n: number) {
  for (let i = 1; i <= n; i++) {
    const x = tx + dx * i;
    const y = ty + dy * i;
    if (x < 0 || x >= map.w || y >= map.h) return false;
    if (y < 0 || !map.solidTile(x, y)) return true;
  }
  return false;
}
const thin = (map: TileMap, tx: number, ty: number) =>
  (openWithin(map, tx, ty, 1, 0, 3) && openWithin(map, tx, ty, -1, 0, 3)) || (openWithin(map, tx, ty, 0, 1, 3) && openWithin(map, tx, ty, 0, -1, 3));
function depth(map: TileMap, tx: number, ty: number) {
  for (let d = 1; d <= 3; d++)
    for (let j = -d; j <= d; j++)
      for (let i = -d; i <= d; i++) if (Math.max(Math.abs(i), Math.abs(j)) === d && !solid(map, tx + i, ty + j)) return d;
  return 4;
}

const BAMBOO = ['33333333', '22122212', '11111111', '.1....1.', '.1....1.', '........', '........', '........'];
const STAKES = ['...3....', '..33..3.', '..32..3.', '.322.32.', '.212.22.', '.212.212', '22122212', '11111111'];
const CRACKED = ['22222222', '21101112', '2101.112', '2.0210.2', '21120112', '2110.212', '21021012', '22222222'];

export const blossomStyle = makeStyle({
  solid: EARTH,
  oneway: BAMBOO,
  spike: STAKES,
  breakable: CRACKED,
  detail(buf: PixelBuffer, map: TileMap, tx: number, ty: number) {
    if (thin(map, tx, ty)) {
      paintSolid(buf, map, tx, ty, WOOD);
      return;
    }
    if (depth(map, tx, ty) >= 3) paintSolid(buf, map, tx, ty, DEEP);
  },
  decorate(buf, map, tx, ty) {
    tufts(buf, map, tx, ty, 2, { density: 0.5, maxH: 3, seed: 5 });
    // tiny flowers and fallen petals in the grass
    if (map.get(tx, ty) === T.Empty && map.get(tx, ty + 1) === T.Solid) {
      for (let k = 0; k < 2; k++) {
        if (hash2(tx, ty, 61 + k) > 0.3) continue;
        const x = tx * 8 + 1 + Math.floor(hash2(tx, ty, 63 + k) * 6);
        const h = 2 + Math.floor(hash2(tx, ty, 65 + k) * 3);
        for (let i = 1; i < h; i++) buf.set(x, ty * 8 + 8 - i, 2);
        buf.set(x, ty * 8 + 8 - h, 3);
      }
      if (hash2(tx, ty, 67) < 0.4) buf.set(tx * 8 + Math.floor(hash2(tx, ty, 68) * 8), ty * 8 + 7, 3);
    }
    // wisteria and moss hanging under roofs and ledges
    hangers(buf, map, tx, ty, (_x, _y, i, len) => (i === len - 1 ? 3 : i % 3 === 2 ? 2 : 1), { chance: 0.32, maxLen: 14, seed: 7 });
  },
});
