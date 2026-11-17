/**
 * Gameplay parity probe: replays fixed input scripts from several spots and prints a hash of the
 * player's trajectory (x, y, hp, state per frame). Run in two trees and compare the output.
 *   npx tsx scripts/parity.ts frostbell
 */
import { createHash } from 'node:crypto';
import { loadWorldDef, makeWorld, type Act } from './sim';

const id = process.argv[2] ?? 'frostbell';
const def = await loadWorldDef(id);
const spots: [number, number][] = [[60, 1024], [300, 1024], [424, 1024], [500, 1000], [760, 760], [700, 480]];
const scripts: { name: string; at: (t: number) => Act[] }[] = [
  { name: 'run-right-jump', at: (t) => (t < 4 ? ['right'] : []).concat(Math.floor(t * 2) % 3 === 0 ? ['jump'] : []) as Act[] },
  { name: 'run-left-dash', at: (t) => (t < 3 ? ['left'] : ['right']).concat(t % 1.5 < 0.05 ? ['dash'] : []) as Act[] },
  { name: 'strike-mash', at: (t) => ['right'].concat(t % 0.4 < 0.03 ? ['attack'] : []).concat(t % 1.3 < 0.2 ? ['jump'] : []) as Act[] },
];
for (const [sx, sy] of spots)
  for (const s of scripts) {
    const { world, input, profile } = makeWorld(def, { enemies: false });
    world.player.place(sx, sy);
    const h = createHash('sha1');
    let last = '';
    for (let i = 0; i < 60 * 8; i++) {
      const t = i / 60;
      input.held.clear();
      input.now.clear();
      const acts = s.at(t);
      for (const a of acts) {
        if (a === 'jump' || a === 'attack' || a === 'dash') input.now.add(a);
        input.held.add(a);
      }
      world.update(1 / 60);
      const p = world.player;
      last = `${p.x},${p.y},${p.state}`;
      h.update(`${p.x},${p.y},${p.state},${profile.hp}|`);
    }
    console.log(`${sx},${sy} ${s.name} ${h.digest('hex').slice(0, 10)} end=${last}`);
  }
