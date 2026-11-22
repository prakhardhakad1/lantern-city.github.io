import { hash2 } from '../../../engine/math';
import type { PixelBuffer } from '../../../engine/pixels';
import { T, type TileMap } from '../../../engine/tilemap';
import { hangers, makeStyle, paintSolid, type SolidLook } from '../../../game/tilekit';

/**
 * Neon Bazaar terrain:
 *   - wet cobbles for the street and the canal walls (rows 29 and below),
 *   - brick towers with rows of windows (some lit, some flickering) above street level,
 *   - striped awnings for one-way platforms, broken-glass spikes, boarded-up doors to break.
 */
function cobbles(x: number, y: number): number {
  const row = Math.floor(y / 3);
  const bx = x + (row % 3) * 2;
  if (y % 3 === 2 || bx % 6 === 5) return 0;
  if (y % 3 === 0 && bx % 6 === 0) return 2; // wet glint
  return hash2(Math.floor(bx / 6), row, 41) < 0.15 ? 0 : 1;
}

/** Brick facade with a grid of windows; ~1 in 3 windows is lit. */
function facade(x: number, y: number): number {
  const wx = x % 16;
  const wy = y % 16;
  if (wx >= 4 && wx <= 10 && wy >= 4 && wy <= 11) {
    const lit = hash2(Math.floor(x / 16), Math.floor(y / 16), 42);
    if (wx === 4 || wx === 10 || wy === 4 || wy === 11) return 1; // frame
    if (lit < 0.35) return wx === 7 ? 2 : wy === 5 ? 3 : 2; // lit, with a mullion and a bright top
    if (lit < 0.45) return wx === 5 && wy === 5 ? 2 : 0; // a dim lamp deep inside
    return wx === 7 || wy === 8 ? 1 : 0;
  }
  const row = Math.floor(y / 3);
  const bx = x + (row & 1) * 3;
  if (y % 3 === 2 || bx % 6 === 5) return 0;
  return hash2(Math.floor(bx / 6), row, 43) < 0.2 ? 0 : 1;
}

const STREET: SolidLook = { texture: cobbles, edge: 2, top: 3, topThickness: 1, gap: true, rounded: false };
const TOWER: SolidLook = { texture: facade, edge: 2, top: 3, topThickness: 1, gap: true, rounded: false };

const AWNING = ['23322332', '22222222', '1.1.1.1.', '.......1', '........', '........', '........', '........'];
const GLASS = ['........', '...3....', '..33..3.', '..32.33.', '.322.32.', '.2121221', '22222222', '11111111'];
const BOARDS = ['22222222', '21112112', '2.1..1.2', '22222222', '21.21112', '2.1..1.2', '21112112', '22222222'];

export const bazaarStyle = makeStyle({
  solid: STREET,
  oneway: AWNING,
  spike: GLASS,
  breakable: BOARDS,
  detail(buf: PixelBuffer, map: TileMap, tx: number, ty: number) {
    if (ty < 29) paintSolid(buf, map, tx, ty, TOWER);
  },
  decorate(buf, map, tx, ty) {
    // puddles shining on the street
    if (map.get(tx, ty) === T.Empty && map.get(tx, ty + 1) === T.Solid && hash2(tx, ty, 51) < 0.25) {
      const x0 = tx * 8 + Math.floor(hash2(tx, ty, 52) * 4);
      for (let i = 0; i < 4; i++) buf.set(x0 + i, ty * 8 + 7, i === 1 ? 3 : 2);
    }
    // cables and wires hanging under every ledge and awning, a few with a bulb
    hangers(buf, map, tx, ty, (_x, _y, i, len) => (i === len - 1 && len > 6 ? 3 : 1), { chance: 0.3, maxLen: 16, seed: 13 });
  },
});
