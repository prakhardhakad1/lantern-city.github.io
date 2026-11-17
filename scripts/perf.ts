/** Draw-call and CPU cost probe: npx tsx scripts/perf.ts frostbell <tileX> <floorRow> */
import { loadWorldDef, makeRenderer, makeWorld } from './sim';

const [id, sx, sy] = process.argv.slice(2);
const def = await loadWorldDef(id);
const r = makeRenderer();
r.setPalette(def.palette);
let rects = 0;
let lines = 0;
let sprites = 0;
const rr = r.rect.bind(r);
const rl = r.line.bind(r);
const rs = r.sprite.bind(r);
r.rect = (...a: Parameters<typeof rr>) => (rects++, rr(...a));
r.line = (...a: Parameters<typeof rl>) => (lines++, rl(...a));
r.sprite = (...a: Parameters<typeof rs>) => (sprites++, rs(...a));
const { world } = makeWorld(def, { enemies: true });
world.player.place(Number(sx) * 8 + 4, Number(sy) * 8);
world.camera.snap(world.player.cx, world.player.cy);
for (let i = 0; i < 120; i++) world.update(1 / 60);
const N = 240;
let tu = 0;
let td = 0;
for (let i = 0; i < N; i++) {
  const a = performance.now();
  world.update(1 / 60);
  const b = performance.now();
  world.draw(r);
  const c = performance.now();
  tu += b - a;
  td += c - b;
}
console.log(`rect/frame ${(rects / (N + 0)).toFixed(0)}  line/frame ${(lines / N).toFixed(0)}  sprite/frame ${(sprites / N).toFixed(0)}  update ${(tu / N).toFixed(2)}ms  draw ${(td / N).toFixed(2)}ms  particles ${world.particles.list.length}  entities ${world.entities.length}`);
