import { hash2 } from '../../../engine/math';
import type { PixelBuffer } from '../../../engine/pixels';
import { T, type TileMap } from '../../../engine/tilemap';
import { hangers, makeStyle, paintSolid, type SolidLook } from '../../../game/tilekit';

/**
 * Skyharbor terrain: weathered deck planks bolted to iron bands, with ropes and chains hanging
 * from every pier. Thick masses (the airship hull) get a riveted plate look.
 */
function planks(x: number, y: number): number {
  const row = Math.floor(y / 3);
  const len = 10 + Math.floor(hash2(0, row, 31) * 6);
  const off = Math.floor(hash2(1, row, 31) * 16);
  const px = (x + off) % len;
  if (y % 3 === 2) return 0; // seam between planks
  if (px === 0) return 0; // plank end
  if (px === 2 && y % 3 === 0) return 2; // nail head
  if (x % 24 === 11 || x % 24 === 12) return y % 3 === 1 ? 2 : 1; // iron band
  return hash2(Math.floor((x + off) / len), row, 32) < 0.25 ? 0 : 1;
}

function plates(x: number, y: number): number {
  const px = x % 12;
  const py = y % 8;
  if (px === 0 || py === 0) return 0;
  if ((px === 2 || px === 10) && (py === 2 || py === 6)) return 2;
  return (x + y) % 9 === 0 ? 0 : 1;
}

const DECK: SolidLook = { texture: planks, edge: 2, top: 3, topThickness: 1, gap: true, rounded: false };
const HULL: SolidLook = { texture: plates, edge: 2, top: 3, topThickness: 1, gap: true, rounded: true };

function thick(map: TileMap, tx: number, ty: number) {
  for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (!map.solidTile(tx + i, ty + j)) return false;
  return true;
}

const ROPE_BRIDGE = ['22222222', '21212121', '1......1', '.1....1.', '........', '........', '........', '........'];
const SPIKES = ['........', '..3..3..', '..2..2..', '.22..22.', '.21..21.', '2211221.', '22222222', '11111111'];
const CRATE = ['22222222', '21111112', '21.11.12', '2.1..1.2', '2..11..2', '2.1..1.2', '21111112', '22222222'];

export const skyStyle = makeStyle({
  solid: DECK,
  oneway: ROPE_BRIDGE,
  spike: SPIKES,
  breakable: CRATE,
  detail(buf: PixelBuffer, map: TileMap, tx: number, ty: number) {
    if (thick(map, tx, ty)) paintSolid(buf, map, tx, ty, HULL);
  },
  decorate(buf, map, tx, ty) {
    // ropes, chains and the odd lantern hanging under the piers
    hangers(
      buf,
      map,
      tx,
      ty,
      (x, y, i, len) => {
        if (i === len - 1) return 3;
        if (hash2(tx, ty, 71) < 0.5) return (y & 1) === 0 ? 2 : 1; // chain
        return x % 2 === 0 || i % 4 ? 1 : 2; // rope
      },
      { chance: 0.42, maxLen: 30, seed: 9 },
    );
    // little bollards and coils of rope on the decks
    if (map.get(tx, ty) === T.Empty && map.get(tx, ty + 1) === T.Solid && hash2(tx, ty, 72) < 0.08) {
      const x = tx * 8 + 2;
      buf.rect(x, ty * 8 + 5, 3, 3, 2);
      buf.set(x + 1, ty * 8 + 5, 3);
    }
  },
});
