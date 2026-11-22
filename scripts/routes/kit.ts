/**
 * Shared helpers for the route tests of the three new worlds (Blossom, Skyharbor, Bazaar).
 * They come after the Foundry, so the player has Spirit Dash and Ember Wings.
 *
 *   jump(name, from, to, how)   brute-force jump plans (scripts/sim.ts canReach)
 *   walk(name, from, steps, to) a scripted input sequence (updrafts, swimming, springs, timing)
 *
 * Coordinates are tiles: [col, floorRow] = standing on top of row floorRow; `to` is
 * [firstCol, lastCol, floorRow].
 */
import { canReach, makeWorld, type Act } from '../sim';
import type { WorldDef } from '../../src/game/registry';

const ALL = { dash: true, doubleJump: true };
let fails = 0;
let count = 0;

export type How = 'plain' | 'dj' | 'dash' | 'any';

export function jump(def: WorldDef, name: string, from: [number, number], to: [number, number, number], how: How = 'plain') {
  count++;
  const r = canReach(def, name, from, to, {
    abilities: ALL,
    useDJ: how === 'dj' || how === 'any',
    useDash: how === 'dash' || how === 'any',
    quiet: true,
  });
  const tight = r.ok && r.plans < 6;
  if (!r.ok) fails++;
  console.log(`  ${!r.ok ? 'FAIL ' : tight ? 'TIGHT' : 'OK   '} ${name}: ${r.plans}/${r.tried} plans${r.easiest ? `, easiest ${r.easiest}` : ''}`);
  return r.ok;
}

/** One scripted step: hold these actions for `t` seconds (tap actions fire on the first frame). */
export interface Step {
  t: number;
  hold?: Act[];
  tap?: Act[];
  /** Re-tap every `every` seconds while the step lasts (swimming strokes). */
  every?: number;
  /** End the step early once this is true (player position in tiles). */
  until?: (x: number, y: number, onGround: boolean) => boolean;
}

export function walk(def: WorldDef, name: string, from: [number, number], steps: Step[], to: [number, number, number]) {
  count++;
  const { world, input, profile } = makeWorld(def, { abilities: ALL });
  const p = world.player;
  p.place(from[0] * 8 + 4, from[1] * 8);
  world.update(1 / 60);
  const hp0 = profile.hp;
  let hurt = false;
  for (const s of steps) {
    const n = Math.round(s.t * 60);
    for (let i = 0; i < n; i++) {
      input.held.clear();
      input.now.clear();
      s.hold?.forEach((a) => input.held.add(a));
      const tapNow = i === 0 || (s.every && i % Math.round(s.every * 60) === 0);
      if (tapNow) s.tap?.forEach((a) => input.now.add(a));
      world.update(1 / 60);
      if (p.state === 'respawn' || profile.hp < hp0) hurt = true;
      if (s.until?.(p.cx / 8, p.bottom / 8, p.onGround())) break;
    }
  }
  // settle
  input.held.clear();
  input.now.clear();
  for (let i = 0; i < 60 && !p.onGround(); i++) world.update(1 / 60);
  const x = p.cx / 8;
  const y = p.bottom / 8;
  const ok = !hurt && p.onGround() && x >= to[0] && x <= to[1] + 1 && Math.abs(y - to[2]) < 0.01;
  if (!ok) fails++;
  console.log(`  ${ok ? 'OK   ' : 'FAIL '} ${name}: ended at ${x.toFixed(1)},${y.toFixed(2)}${hurt ? ' (hurt)' : ''}${p.onGround() ? '' : ' (airborne)'}`);
  return ok;
}

export function section(name: string) {
  console.log(`\n${name}`);
}

export function summary(id: string) {
  console.log(`\n${id}: ${count - fails}/${count} checks pass${fails ? ` - ${fails} FAILED` : ''}`);
  if (fails) process.exitCode = 1;
}
