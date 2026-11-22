/** Hero frames as they look in game (recoloured + outlined): npx tsx scripts/hero-sheet.ts <out.png> */
import { writeFileSync } from 'node:fs';
import { makeRenderer, realCanvas } from './sim';

const out = process.argv[2] ?? 'previews/hero.png';
const { getSheet } = await import('../src/engine/sprites');
await import('../src/art/player');
const { HERO_RAMP } = await import('../src/game/layers');
const { recolor } = await import('../src/engine/recolor');
const pal = ['#1b1226', '#5a3a7a', '#f08a5d', '#fff1d6'] as const;
const r = makeRenderer();
r.setPalette(pal);
r.clear(0);
const ctx = r.ctx;
ctx.clearRect(0, 0, 320, 180);
const names = Object.keys(getSheet('player').frames);
names.forEach((n, i) => r.sprite('player', n, 12 + (i % 12) * 25, 26 + Math.floor(i / 12) * 28));
recolor(r.canvas as unknown as HTMLCanvasElement, pal, { ...HERO_RAMP, sky: ['#3a2a5a', '#3a2a5a', '#3a2a5a'] });
const big = realCanvas!.createCanvas(320 * 4, 100 * 4);
const b = big.getContext('2d');
b.imageSmoothingEnabled = false;
b.drawImage(r.canvas as never, 0, 0, 320, 100, 0, 0, 1280, 400);
writeFileSync(out, big.toBuffer('image/png'));
console.log(`wrote ${out} (${names.length} frames)`);
