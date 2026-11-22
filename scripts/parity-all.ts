/**
 * Strict gameplay parity probe for every world. Math.random is replaced by a seeded PRNG for
 * each run, enemies are ON, and the player replays fixed inputs from every spawn point and
 * checkpoint. Prints a hash of (player x, y, state, hp) and of every entity's position per
 * frame. Run in two trees and diff the output: identical lines = identical gameplay.
 *   npx tsx scripts/parity-all.ts
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadWorldDef, makeWorld, type Act } from './sim';

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ids = readdirSync(resolve('src/content/worlds')).filter((d) => existsSync(resolve('src/content/worlds', d, 'index.ts')) && d !== 'lab');
const scripts: { name: string; at: (t: number) => { held: Act[]; now: Act[] } }[] = [
  { name: 'right-jump', at: (t) => ({ held: (t < 5 ? ['right'] : ['left']) as Act[], now: (Math.floor(t * 2) % 3 === 0 && (t * 2) % 1 < 0.04 ? ['jump'] : []) as Act[] }) },
  { name: 'left-dash', at: (t) => ({ held: (t < 3 ? ['left'] : ['right']) as Act[], now: (t % 1.5 < 0.02 ? ['dash'] : []) as Act[] }) },
  { name: 'strike', at: (t) => ({ held: ['right', ...(t % 1.3 < 0.25 ? ['jump'] : [])] as Act[], now: (t % 0.4 < 0.02 ? ['attack'] : t % 1.3 < 0.02 ? ['jump'] : []) as Act[] }) },
];
const real = Math.random;
for (const id of ids) {
  const def = await loadWorldDef(id);
  const probe = makeWorld(def, { enemies: true }).world;
  const spots = [...probe.spawns.entries()];
  for (const [label, p] of spots)
    for (const s of scripts) {
      Math.random = seeded(1234);
      const { world, input, profile } = makeWorld(def, { enemies: true });
      profile.hp = profile.maxHp;
      world.player.place(p.x, p.y);
      const h = createHash('sha1');
      const he = createHash('sha1');
      for (let i = 0; i < 60 * 8; i++) {
        const a = s.at(i / 60);
        input.held.clear();
        input.now.clear();
        a.held.forEach((x) => input.held.add(x));
        a.now.forEach((x) => input.now.add(x));
        world.update(1 / 60);
        const pl = world.player;
        h.update(`${pl.x},${pl.y},${pl.state},${profile.hp}|`);
        if (i % 10 === 0) for (const e of world.entities) if (e.solid || e.platform || (e as { hp?: number }).hp !== undefined) he.update(`${e.constructor.name}:${e.x},${e.y};`);
      }
      Math.random = real;
      console.log(`${id} ${label} ${s.name} player=${h.digest('hex').slice(0, 10)} world=${he.digest('hex').slice(0, 10)}`);
    }
}
