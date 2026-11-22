/**
 * Headless screenshots of the menu scenes (title screen and train ride).
 *   npx tsx scripts/scenes.ts <outDir> [scale=3]
 * Writes title-<n>.png (the title cycles through worlds) and train-<world>.png.
 * With --frames <scene> <seconds>, writes a frame sequence instead (20 fps) for clips.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { FakeInput, makeRenderer, realCanvas } from './sim';

const args = process.argv.slice(2);
const fi = args.indexOf('--frames');
const frames = fi >= 0 ? { scene: args[fi + 1], seconds: Number(args[fi + 2]) } : null;
if (fi >= 0) args.splice(fi, 3);
const [outDir = 'previews/scenes', scaleArg = '3'] = args;
const scale = Number(scaleArg);
if (!realCanvas) throw new Error('needs @napi-rs/canvas');

const root = resolve('src/content/worlds');
const defs = [];
for (const dir of readdirSync(root)) {
  const f = resolve(root, dir, 'index.ts');
  if (!existsSync(f)) continue;
  defs.push((await import(pathToFileURL(f).href)).default);
}
const reg = await import('../src/content/worlds/index');
reg.setWorlds(defs);
const { TitleScene } = await import('../src/game/scenes/title');
const { TrainScene } = await import('../src/game/scenes/train');
const { newProfile } = await import('../src/game/profile');

const r = makeRenderer();
const noop = () => {};
const input = new FakeInput();
const game = {
  r,
  input,
  audio: { play: noop, tone: noop, noise: noop, playSong: noop, toggleMusic: noop, unlock: noop },
  profile: newProfile(),
  transitioning: false,
  transition: noop,
  scene: null,
} as unknown as ConstructorParameters<typeof TitleScene>[0];
game.profile.unlocked = defs.map((d) => d.id);

mkdirSync(outDir, { recursive: true });
function save(name: string) {
  const src = r.canvas as unknown as import('@napi-rs/canvas').Canvas;
  const big = realCanvas!.createCanvas(src.width * scale, src.height * scale);
  const ctx = big.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, big.width, big.height);
  writeFileSync(`${outDir}/${name}.png`, big.toBuffer('image/png'));
}
function run(scene: { update(dt: number): void; draw(r: unknown): void }, seconds: number) {
  for (let i = 0; i < Math.round(seconds * 60); i++) scene.update(1 / 60);
}

if (frames) {
  const visible = defs.filter((d) => !d.hidden).sort((a, b) => a.order - b.order);
  const scene = frames.scene === 'train' ? new TrainScene(game, visible[0], visible[2] ?? visible[1]) : new TitleScene(game);
  let n = 0;
  for (let i = 0; i < Math.round(frames.seconds * 60); i++) {
    scene.update(1 / 60);
    if (i % 3) continue;
    scene.draw(r);
    save(`f${String(n++).padStart(4, '0')}`);
  }
  console.log(`wrote ${n} frames`);
} else {
  const title = new TitleScene(game);
  // one shot per world as the title backdrop cycles (7 s per world)
  const visible = defs.filter((d) => !d.hidden);
  run(title, 2);
  for (let i = 0; i < visible.length; i++) {
    title.draw(r);
    save(`title-${i + 1}`);
    run(title, 7);
  }
  const sorted = [...visible].sort((a, b) => a.order - b.order);
  for (let i = 0; i < sorted.length; i++) {
    const to = sorted[i];
    const from = sorted[(i + sorted.length - 1) % sorted.length];
    const t = new TrainScene(game, from, to);
    run(t, 2.2);
    t.draw(r);
    save(`train-${to.id}`);
  }
  console.log(`wrote title + train shots to ${outDir}`);
}
