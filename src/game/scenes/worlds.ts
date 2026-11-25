import { allWorlds } from '../../content/worlds';
import { glow, rgba, vGradient } from '../../engine/fx';
import type { Palette } from '../../engine/palette';
import { H, W, type Renderer } from '../../engine/renderer';
import type { Game, Scene } from '../game';
import { loadProfile, newProfile, saveProfile, type Profile } from '../profile';
import { BASE_LEGEND, type WorldDef } from '../registry';
import { PlayScene } from './play';
import { postcard } from './postcard';

/**
 * WORLD SELECT: pick any district and start playing there.
 * The big postcard shows the chosen world; the strip below shows all of them.
 * Starting a world keeps your save (lanterns, souls, avatar) and gives you every ability
 * found in the worlds before it, so no world is ever impossible to finish.
 */
const PAL: Palette = ['#0c0a1e', '#6a5aa8', '#ffb45a', '#fff4dc'];
const THUMB_W = 34;
const THUMB_H = 20;
const GAP = 4;

type Ability = keyof Profile['abilities'];

/** Abilities whose shrine sits somewhere in this world's map. */
export function shrinesIn(def: WorldDef): Ability[] {
  const found = new Set<Ability>();
  const chars = new Set(def.map.join(''));
  for (const ch of chars) {
    const e = def.legend?.[ch] ?? BASE_LEGEND[ch];
    if (e && typeof e === 'object' && e.kind === 'shrine' && typeof e.ability === 'string') found.add(e.ability as Ability);
  }
  return [...found];
}

/** The profile to play `def` with: the current save (or a fresh one), opened up to that world. */
export function profileFor(def: WorldDef, worlds: WorldDef[], save: Profile | null, avatar: string): Profile {
  const p: Profile = save ? { ...save, abilities: { ...save.abilities }, flags: { ...save.flags }, unlocked: [...save.unlocked] } : newProfile();
  p.avatar = avatar;
  const at = Math.max(0, worlds.findIndex((w) => w.id === def.id));
  for (const w of worlds.slice(0, at + 1)) if (!p.unlocked.includes(w.id)) p.unlocked.push(w.id);
  for (const w of worlds.slice(0, at)) for (const a of shrinesIn(w)) p.abilities[a] = true;
  p.worldId = def.id;
  p.spawn = { kind: 'start' };
  p.hp = p.maxHp;
  return p;
}

export class WorldSelectScene implements Scene {
  private t = 0;
  private moveT = 0;
  private worlds = allWorlds();
  private save = loadProfile();
  private index: number;

  constructor(
    private game: Game,
    private avatar: string,
    private back: () => Scene,
  ) {
    game.r.setPalette(PAL);
    const cur = this.worlds.findIndex((w) => w.id === this.save?.worldId);
    this.index = Math.max(0, cur);
  }

  private move(step: number) {
    const n = this.worlds.length;
    if (n < 2) return;
    this.index = (this.index + step + n) % n;
    this.moveT = 0;
    this.game.audio.play('blip');
  }

  update(dt: number) {
    this.t += dt;
    this.moveT += dt;
    const g = this.game;
    const { input, audio } = g;
    if (g.transitioning) return;
    if (input.pressed('left') || input.pressed('up')) this.move(-1);
    if (input.pressed('right') || input.pressed('down')) this.move(1);
    if (input.pressed('back') || input.pressed('pause')) {
      audio.play('blip');
      g.transition(() => (g.scene = this.back()));
      return;
    }
    if (!input.pressed('confirm')) return;
    const def = this.worlds[this.index];
    if (!def) return;
    audio.play('select');
    g.transition(() => {
      g.profile = profileFor(def, this.worlds, this.save, this.avatar);
      saveProfile(g.profile);
      g.scene = new PlayScene(g, def, g.profile.spawn);
    });
  }

  draw(r: Renderer) {
    const ctx = r.ctx;
    const t = this.t;
    const def = this.worlds[this.index];
    r.screen();
    ctx.fillStyle = '#07061a';
    ctx.fillRect(0, 0, W, H);
    if (!def) {
      r.textCenter('NO WORLDS FOUND', W / 2, H / 2, 3);
      return;
    }
    const col = def.look?.glow ?? def.palette[3];
    const p = this.save ?? newProfile();

    // ---- the chosen world fills the screen, drifting slowly ---------------------------------
    const img = postcard(def, PAL);
    const drift = Math.round(Math.sin(t * 0.35) * 8);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, -10 + drift, -6, W + 20, H + 12);
    ctx.restore();
    if (this.moveT < 0.25) {
      ctx.fillStyle = rgba('#07061a', 1 - this.moveT / 0.25);
      ctx.fillRect(0, 0, W, H);
    }
    // dark at the top and bottom so the text reads
    ctx.drawImage(vGradient([[0, rgba('#07061a', 0.9)], [1, rgba('#07061a', 0)]]), 0, 0, W, 60);
    ctx.drawImage(vGradient([[0, rgba('#07061a', 0)], [0.35, rgba('#07061a', 0.85)], [1, rgba('#07061a', 0.95)]]), 0, 96, W, H - 96);

    // ---- header -------------------------------------------------------------------------------
    r.textCenter('CHOOSE A WORLD', W / 2, 7, 3, 2, true);
    r.textCenter(`LINE ${this.index + 1} OF ${this.worlds.length}`, W / 2, 22, 2, 1, true);

    // ---- name card with arrows ----------------------------------------------------------------
    const lit = !!p.flags[`goal:${def.id}`];
    const open = p.unlocked.includes(def.id);
    const name = def.name.toUpperCase();
    const cy = 104;
    glow(r, W / 2, cy + 5, 60, col, 0.25);
    r.textCenter(name, W / 2, cy, 3, 2, true);
    const nudge = Math.round(Math.sin(t * 5) * 1.5);
    const half = Math.max(40, name.length * 4 + 8);
    if (this.worlds.length > 1) {
      r.text('←', W / 2 - half - 6 - nudge, cy + 3, 3);
      r.text('→', W / 2 + half + 2 + nudge, cy + 3, 3);
    }
    const tag = lit ? 'LANTERN RELIT' : open ? 'LINE OPEN' : 'NEW - FREE PLAY';
    r.textCenter(tag, W / 2, cy + 15, lit ? 2 : 1, 1, false);

    // ---- strip of every world -----------------------------------------------------------------
    const n = this.worlds.length;
    const total = n * THUMB_W + (n - 1) * GAP;
    const x0 = Math.round((W - total) / 2);
    const ty = 132;
    this.worlds.forEach((w, i) => {
      const x = x0 + i * (THUMB_W + GAP);
      const sel = i === this.index;
      const y = ty - (sel ? 2 : 0);
      const wc = w.look?.glow ?? w.palette[3];
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(postcard(w, PAL), 0, 0, W, H, x, y, THUMB_W, THUMB_H);
      ctx.restore();
      if (!sel) {
        ctx.fillStyle = rgba('#07061a', 0.45);
        ctx.fillRect(x, y, THUMB_W, THUMB_H);
      }
      ctx.strokeStyle = sel ? '#fff4dc' : '#3a2a6e';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 0.5, y - 0.5, THUMB_W + 1, THUMB_H + 1);
      if (sel) {
        glow(r, x + THUMB_W / 2, y + THUMB_H / 2, 26, wc, 0.3);
        ctx.strokeStyle = wc;
        ctx.strokeRect(x - 1.5, y - 1.5, THUMB_W + 3, THUMB_H + 3);
      }
      // little lantern under each card: bright once relit
      const done = !!p.flags[`goal:${w.id}`];
      ctx.fillStyle = done ? wc : '#3a2a6e';
      ctx.fillRect(x + THUMB_W / 2 - 1, ty + THUMB_H + 3, 3, 4);
      r.textCenter(String(i + 1), x + THUMB_W / 2, ty + THUMB_H + 9, sel ? 3 : 1);
    });

    // ---- controls -----------------------------------------------------------------------------
    ctx.fillStyle = rgba('#07061a', 0.7);
    ctx.fillRect(0, H - 11, W, 11);
    r.textCenter('← → CHOOSE    Z / ENTER PLAY    X BACK', W / 2, H - 8, 1);
  }
}
