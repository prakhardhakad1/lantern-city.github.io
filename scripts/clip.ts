/**
 * Frame sequence of a scripted play-through, for animation clips (assemble with ffmpeg).
 *
 *   npx tsx scripts/clip.ts frostbell <courtyard|bell> <outDir> [seconds=10] [fps=20] [scale=3]
 *
 * courtyard: the avatar idles, runs east across the courtyard, jumps, strikes, and walks back.
 * bell:      the avatar walks to the door bell, strikes it, and waits while the gate lifts.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { loadWorldDef, makeRenderer, makeWorld, realCanvas, type Act } from './sim';

const [id, scenario, outDir, secs = '10', fpsArg = '20', scaleArg = '3'] = process.argv.slice(2);
if (!realCanvas || !id || !scenario || !outDir) {
  console.log('usage: npx tsx scripts/clip.ts <world> <courtyard|bell> <outDir> [seconds] [fps] [scale]');
  process.exit(1);
}
const seconds = Number(secs);
const fps = Number(fpsArg);
const scale = Number(scaleArg);
const def = await loadWorldDef(id);
const r = makeRenderer();
r.setPalette(def.palette);
const { world, input, profile } = makeWorld(def, { enemies: false });
profile.hp = profile.maxHp;
const st = world.spawns.get('station') ?? world.spawns.get('start')!;
if (id === 'frostbell') world.player.place(scenario === 'bell' ? 52 * 8 : 60, 128 * 8);
else world.player.place(st.x, st.y);
world.camera.snap(world.player.cx, world.player.cy);
mkdirSync(outDir, { recursive: true });

type Step = { from: number; to: number; hold?: Act[]; tap?: Act[] };
const courtyard: Step[] = [
  { from: 0.6, to: 4.2, hold: ['right'] },
  { from: 1.5, to: 1.52, tap: ['jump'] },
  { from: 3.0, to: 3.02, tap: ['jump'] },
  { from: 4.4, to: 4.42, tap: ['attack'] },
  { from: 5.2, to: 8.6, hold: ['left'] },
  { from: 6.4, to: 6.42, tap: ['jump'] },
];
const bell: Step[] = [
  { from: 0.4, to: 1.0, hold: ['right'] },
  { from: 1.3, to: 1.32, tap: ['attack'] },
  { from: 1.5, to: 1.52, tap: ['attack'] },
];
const plan = scenario === 'bell' ? bell : courtyard;

const total = Math.round(seconds * 60);
const every = Math.round(60 / fps);
let n = 0;
for (let i = 0; i < total; i++) {
  const t = i / 60;
  input.held.clear();
  input.now.clear();
  for (const s of plan) {
    if (t < s.from || t >= s.to) continue;
    s.hold?.forEach((a) => input.held.add(a));
    s.tap?.forEach((a) => input.now.add(a));
  }
  world.update(1 / 60);
  if (i % every !== 0) continue;
  world.draw(r);
  const src = r.canvas as unknown as import('@napi-rs/canvas').Canvas;
  const big = realCanvas.createCanvas(src.width * scale, src.height * scale);
  const ctx = big.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, big.width, big.height);
  writeFileSync(`${outDir}/f${String(n++).padStart(4, '0')}.png`, big.toBuffer('image/png'));
}
console.log(`wrote ${n} frames to ${outDir}`);
