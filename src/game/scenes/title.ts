import { AVATARS, setAvatar } from '../../art/player';
import { allWorlds, worldById } from '../../content/worlds';
import { glow, glowSprite, rgba, vGradient } from '../../engine/fx';
import { hash2 } from '../../engine/math';
import type { Palette } from '../../engine/palette';
import { recolor } from '../../engine/recolor';
import { H, W, type Renderer } from '../../engine/renderer';
import { Anim, frameCanvas, getSheet } from '../../engine/sprites';
import type { Game, Scene } from '../game';
import { HERO_RAMP } from '../layers';
import { clearProfile, loadProfile, newProfile, saveProfile, type Profile } from '../profile';
import type { WorldDef } from '../registry';
import { GalleryScene } from './gallery';
import { PlayScene } from './play';
import { postcard } from './postcard';

/**
 * HOME SCREEN: Lantern City at night. Every district stands on the skyline with its own landmark
 * and beacon (bright once its lantern is relit), the Great Lantern burns in the middle, the Spirit
 * Rail train crosses the bridge, and a postcard on the right shows each district in turn.
 * The menu works exactly as before.
 */
const PAL: Palette = ['#0c0a1e', '#6a5aa8', '#ffb45a', '#fff4dc'];
const SHOW_SECONDS = 5;
const BRIDGE = 156;
const SKY = '#1d1540';
const SKY_LIT = '#2e2466';
const LANDMARK_X = [16, 52, 88, 124, 196, 232, 268, 304];

type Ctx = CanvasRenderingContext2D;
/** A colour as the 32-bit pixel value getImageData gives (little-endian ABGR). */
const pk = (hex: string) => (0xff000000 | (parseInt(hex.slice(5, 7), 16) << 16) | (parseInt(hex.slice(3, 5), 16) << 8) | parseInt(hex.slice(1, 3), 16)) >>> 0;
const box = (c: Ctx, x: number, y: number, w: number, h: number, col: string) => {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), w, h);
};

/** One silhouette landmark per district, drawn in the order of the Spirit Rail. Returns the beacon point. */
function landmark(c: Ctx, i: number, x: number): [number, number] {
  const D = SKY;
  const L = SKY_LIT;
  switch (i) {
    case 0: {
      // Mossgate: a broken aqueduct arch and an old tree
      box(c, x - 12, 104, 5, 52, D);
      box(c, x + 6, 98, 5, 58, D);
      for (let a = 0; a <= 18; a++) {
        const px = x - 10 + a;
        const py = 104 - Math.round(Math.sin((a / 18) * Math.PI) * 9);
        box(c, px, py, 1, 4, D);
      }
      box(c, x - 1, 112, 2, 44, D);
      for (const [dx, dy, r] of [
        [-4, 104, 5],
        [3, 101, 6],
        [0, 96, 5],
      ])
        for (let yy = -r; yy <= r; yy++) box(c, x + dx - Math.round(Math.sqrt(r * r - yy * yy)), dy + yy, Math.round(Math.sqrt(r * r - yy * yy)) * 2, 1, D);
      return [x + 8, 94];
    }
    case 1: {
      // Underworks: a water tower on stilts beside a great pipe
      box(c, x - 8, 84, 16, 14, D);
      box(c, x - 9, 82, 18, 2, L);
      for (const dx of [-7, -1, 5]) box(c, x + dx, 98, 2, 58, D);
      box(c, x - 7, 112, 14, 1, D);
      box(c, x + 9, 120, 8, 36, D);
      box(c, x + 8, 118, 10, 3, L);
      return [x, 79];
    }
    case 2: {
      // Frostbell: a tall spire with a bell window
      box(c, x - 6, 86, 12, 70, D);
      for (let j = 0; j < 22; j++) box(c, x - Math.round(6 - j * 0.27), 64 + j, Math.round(12 - j * 0.55) + 1, 1, D);
      box(c, x - 6 + 6 - 1, 60, 1, 6, D);
      box(c, x - 3, 92, 6, 8, L);
      box(c, x - 1, 94, 2, 4, D);
      return [x, 58];
    }
    case 3: {
      // Gloomroot: a domed mausoleum with a cross
      box(c, x - 11, 110, 22, 46, D);
      for (let yy = 0; yy <= 10; yy++) {
        const hw = Math.round(Math.sqrt(100 - yy * yy));
        box(c, x - hw, 110 - yy, hw * 2, 1, D);
      }
      box(c, x - 1, 92, 2, 8, D);
      box(c, x - 3, 94, 6, 2, D);
      for (const dx of [-8, -3, 2, 7]) box(c, x + dx, 116, 1, 30, L);
      return [x, 90];
    }
    case 4: {
      // Ember Foundry: smokestacks and a shed with a sawtooth roof
      box(c, x - 12, 120, 24, 36, D);
      for (let k = 0; k < 4; k++) for (let j = 0; j < 5; j++) box(c, x - 12 + k * 6, 115 + j, 6 - j, 1, D);
      box(c, x - 8, 76, 5, 44, D);
      box(c, x + 3, 86, 5, 34, D);
      box(c, x - 9, 74, 7, 2, L);
      box(c, x + 2, 84, 7, 2, L);
      return [x - 6, 72];
    }
    case 5: {
      // Blossom Terrace: a three-tier pagoda under a blossom tree
      let y = 156;
      for (let f = 0; f < 4; f++) {
        const hw = 10 - f * 2;
        const h = f === 0 ? 22 : 9;
        box(c, x - hw + 2, y - h, (hw - 2) * 2, h, D);
        y -= h;
        for (let k = -hw - 3; k <= hw + 3; k++) box(c, x + k, y - (Math.abs(k) > hw ? Math.abs(k) - hw : 0), 1, 2, D);
        y -= 2;
      }
      box(c, x, y - 8, 1, 8, D);
      for (let yy = -6; yy <= 6; yy++) {
        const hw = Math.round(Math.sqrt(36 - yy * yy) * 1.3);
        box(c, x + 14 - hw, 124 + yy, hw * 2, 1, L);
      }
      box(c, x + 13, 130, 2, 26, D);
      return [x, y - 10];
    }
    case 6: {
      // Skyharbor: a mooring mast with an airship tied to it
      box(c, x - 1, 70, 3, 86, D);
      for (let j = 74; j < 156; j += 8) box(c, x - 4, j, 9, 1, D);
      for (let yy = -5; yy <= 5; yy++) {
        const hw = Math.round(Math.sqrt(25 - yy * yy) * 3.4);
        box(c, x - 4 - hw * 2 + 17, 78 + yy, hw * 2, 1, L);
      }
      box(c, x - 6, 85, 6, 3, L);
      return [x, 66];
    }
    default: {
      // Neon Bazaar: a crowded tower with an antenna and a vertical sign
      box(c, x - 9, 82, 18, 74, D);
      box(c, x - 6, 76, 12, 6, D);
      box(c, x, 60, 1, 16, D);
      box(c, x - 13, 92, 3, 30, L);
      return [x, 58];
    }
  }
}

/** The static night city: sky gradient, far towers, landmarks, the Great Lantern tower, the bridge and river. */
function paintCity(): { img: HTMLCanvasElement; beacons: [number, number][]; windows: [number, number][] } {
  const img = document.createElement('canvas');
  img.width = W;
  img.height = H;
  const c = img.getContext('2d')!;
  c.drawImage(
    vGradient([
      [0, '#07061a'],
      [0.35, '#1c1446'],
      [0.62, '#5a2a6e'],
      [0.82, '#c8566e'],
      [1, '#f0905a'],
    ]),
    0,
    0,
    W,
    H,
  );
  // far towers, hazy
  for (let x = 0; x < W; x += 7) {
    const h = 18 + Math.floor(hash2(x, 1, 901) * 34);
    const w = 5 + Math.floor(hash2(x, 2, 901) * 6);
    box(c, x, 150 - h, w, h, '#3a2a6e');
    if (hash2(x, 3, 901) < 0.3) box(c, x + 2, 150 - h - 6, 1, 6, '#3a2a6e');
  }
  // near city blocks between the landmarks
  for (let x = 0; x < W; x += 9) {
    const h = 14 + Math.floor(hash2(x, 4, 902) * 22);
    box(c, x, BRIDGE - h, 8 + Math.floor(hash2(x, 5, 902) * 4), h, SKY);
  }
  const beacons = LANDMARK_X.map((x, i) => landmark(c, i, x));
  // the Great Lantern tower in the middle of the city
  const gx = 160;
  box(c, gx - 9, 88, 18, 68, SKY);
  box(c, gx - 12, 84, 24, 4, SKY);
  for (let j = 0; j < 14; j++) box(c, gx - Math.round(7 - j * 0.3), 70 + j, Math.round(14 - j * 0.6) + 1, 1, SKY);
  box(c, gx - 8, 56, 16, 3, SKY);
  box(c, gx - 6, 59, 2, 11, SKY);
  box(c, gx + 4, 59, 2, 11, SKY);
  box(c, gx - 5, 50, 10, 6, SKY);
  box(c, gx - 1, 44, 2, 6, SKY);
  for (let j = 94; j < 150; j += 10) box(c, gx - 4, j, 8, 4, SKY_LIT);
  // moonlight catches the top and left edge of every silhouette
  const id = c.getImageData(0, 0, W, BRIDGE);
  const d = new Uint32Array(id.data.buffer);
  const dark = (v: number) => v === pk(SKY) || v === pk(SKY_LIT) || v === pk('#3a2a6e');
  const rimmed: number[] = [];
  for (let y = 1; y < BRIDGE; y++)
    for (let x = 1; x < W; x++) {
      const i = y * W + x;
      if (!dark(d[i])) continue;
      if (!dark(d[i - W]) || !dark(d[i - 1])) rimmed.push(i);
    }
  for (const i of rimmed) d[i] = d[i] === pk('#3a2a6e') ? pk('#5a4a96') : pk('#4a3c8a');
  c.putImageData(id, 0, 0);
  // lit windows scattered over the city
  const windows: [number, number][] = [];
  for (let k = 0; k < 90; k++) {
    const x = Math.floor(hash2(k, 6, 903) * W);
    const y = 104 + Math.floor(hash2(k, 7, 903) * 48);
    const p = c.getImageData(x, y, 1, 1).data;
    if (p[0] === 0x1d && p[1] === 0x15 && p[2] === 0x40) windows.push([x, y]);
  }
  // the bridge: deck, parapet and arches over the river
  box(c, 0, BRIDGE, W, 8, '#120d2a');
  box(c, 0, BRIDGE, W, 1, '#6a5aa8');
  box(c, 0, BRIDGE + 7, W, 1, '#2a2050');
  c.fillStyle = '#0a0820';
  c.fillRect(0, BRIDGE + 8, W, H - BRIDGE - 8);
  for (let x = 0; x < W; x += 40) {
    box(c, x, BRIDGE + 8, 6, 16, '#120d2a');
    for (let a = 0; a < 34; a++) {
      const yy = Math.round(Math.sin((a / 34) * Math.PI) * 5);
      box(c, x + 6 + a, BRIDGE + 8, 1, 6 - yy, '#120d2a');
    }
  }
  return { img, beacons, windows };
}

export class TitleScene implements Scene {
  private t = 0;
  private index = 0;
  private items: string[];
  private save: Profile | null = loadProfile();
  /** The world a new game starts in. */
  private def: WorldDef;
  private worlds: WorldDef[];
  /** The postcard on the right cycles through every district. */
  private card = 0;
  private cardT = 0;
  private city: ReturnType<typeof paintCity> | null = null;
  private hero: HTMLCanvasElement | null = null;
  private twig = new Anim('player', 'idle');
  private flame = new Anim('lantern', 'on');
  private wheels = new Anim('train', 'roll');
  private avatars = Object.keys(AVATARS);
  private avatar: number;

  constructor(private game: Game) {
    this.def = worldById('outskirts') ?? allWorlds()[0];
    this.worlds = allWorlds();
    game.r.setPalette(PAL);
    document.body.style.background = '#07061a';
    game.audio.playSong(this.def.music);
    this.items = [...(this.save ? ['CONTINUE'] : []), 'NEW GAME', 'AVATAR', 'ANIMATION GALLERY'];
    this.avatar = Math.max(0, this.avatars.indexOf(this.save?.avatar ?? 'sprout'));
    setAvatar(this.avatars[this.avatar]);
  }

  /** Cycle the avatar topper; the twig on screen (and the save, if any) updates at once. */
  private cycleAvatar(step: number) {
    this.avatar = (this.avatar + step + this.avatars.length) % this.avatars.length;
    const name = this.avatars[this.avatar];
    setAvatar(name);
    if (this.save) {
      this.save.avatar = name;
      saveProfile(this.save);
    }
    this.game.audio.play('blip');
  }

  update(dt: number) {
    this.t += dt;
    this.cardT += dt;
    this.twig.update(dt);
    this.flame.update(dt);
    this.wheels.update(dt);
    if (this.cardT >= SHOW_SECONDS && this.worlds.length > 1) {
      this.cardT = 0;
      this.card = (this.card + 1) % this.worlds.length;
    }
    const { input, audio } = this.game;
    if (this.game.transitioning) return;
    if (input.pressed('up')) {
      this.index = (this.index + this.items.length - 1) % this.items.length;
      audio.play('blip');
    }
    if (input.pressed('down')) {
      this.index = (this.index + 1) % this.items.length;
      audio.play('blip');
    }
    if (this.items[this.index] === 'AVATAR') {
      if (input.pressed('left')) this.cycleAvatar(-1);
      if (input.pressed('right') || input.pressed('confirm')) this.cycleAvatar(1);
      return;
    }
    if (!input.pressed('confirm')) return;
    audio.play('select');
    const g = this.game;
    switch (this.items[this.index]) {
      case 'CONTINUE': {
        const p = this.save!;
        const def = worldById(p.worldId) ?? this.def;
        g.transition(() => {
          g.profile = p;
          g.scene = new PlayScene(g, def, p.spawn);
        });
        break;
      }
      case 'NEW GAME':
        g.transition(() => {
          clearProfile();
          g.profile = newProfile();
          g.profile.avatar = this.avatars[this.avatar];
          g.scene = new PlayScene(g, this.def, { kind: 'start' });
        });
        break;
      case 'ANIMATION GALLERY':
        g.transition(() => (g.scene = new GalleryScene(g)));
        break;
    }
  }

  private progress() {
    const p = this.save ?? newProfile();
    return this.worlds.map((w) => ({ lit: !!p.flags[`goal:${w.id}`], open: p.unlocked.includes(w.id) }));
  }

  draw(r: Renderer) {
    if (!this.city) this.city = paintCity();
    const city = this.city;
    const ctx = r.ctx;
    const t = this.t;
    const prog = this.progress();
    r.screen();
    ctx.drawImage(city.img, 0, 0);

    // ---- sky life: stars, the moon, a shooting star ----------------------------------------
    for (let i = 0; i < 46; i++) {
      const x = Math.floor(hash2(i, 1, 911) * W);
      const y = Math.floor(hash2(i, 2, 911) * 88);
      const tw = Math.sin(t * (1 + hash2(i, 3, 911) * 2.5) + i * 4);
      if (tw < -0.2) continue;
      box(ctx, x, y, 1, 1, tw > 0.75 ? '#fff4dc' : '#a898e0');
      if (tw > 0.95) {
        box(ctx, x - 1, y, 3, 1, '#a898e0');
        box(ctx, x, y - 1, 1, 3, '#a898e0');
      }
    }
    glow(r, 34, 26, 26, '#fff1d6', 0.35);
    for (let yy = -10; yy <= 10; yy++) {
      const hw = Math.round(Math.sqrt(100 - yy * yy));
      box(ctx, 34 - hw, 26 + yy, hw * 2, 1, '#fff1d6');
      if (yy > -4) box(ctx, 34 + hw - Math.round(hw * 0.6), 26 + yy, Math.round(hw * 0.6), 1, '#e8d4b8');
    }
    box(ctx, 30, 22, 3, 3, '#e8d4b8');
    box(ctx, 37, 30, 2, 2, '#e8d4b8');
    const sc = (t % 13) / 13;
    if (sc < 0.06) {
      const k = sc / 0.06;
      for (let i = 0; i < 10; i++) box(ctx, 230 - k * 120 + i * 2, 12 + k * 30 - i, 1, 1, i < 3 ? '#fff4dc' : '#a898e0');
    }

    // ---- the city comes alive: windows, smoke, the Great Lantern and the district beacons -------
    for (const [i, [x, y]] of city.windows.entries()) if (Math.sin(t * 0.7 + i * 1.3) > -0.4) box(ctx, x, y, 1, 1, i % 5 ? '#ffcf7a' : '#ff9a5a');
    for (let k = 0; k < 6; k++) {
      const age = (t * 0.25 + k / 6) % 1;
      const sx = LANDMARK_X[4] - 6 + age * 14 + Math.sin(age * 6 + k) * 2;
      ctx.globalAlpha = 0.5 * (1 - age);
      box(ctx, sx, 70 - age * 34, 2 + Math.round(age * 3), 2 + Math.round(age * 3), '#6a5aa8');
      ctx.globalAlpha = 1;
    }
    // great lantern: a warm core, a pulsing glow and slow rays
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.1);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 7; k++) {
      const a = -Math.PI / 2 + (k - 3) * 0.32 + Math.sin(t * 0.3) * 0.05;
      ctx.globalAlpha = 0.05 + 0.03 * Math.sin(t * 0.8 + k);
      ctx.save();
      ctx.translate(160, 60);
      ctx.rotate(a + Math.PI / 2);
      ctx.drawImage(vGradient([[0, rgba('#ffd890', 1)], [1, rgba('#ffd890', 0)]]), -3, -150, 6, 150);
      ctx.restore();
    }
    ctx.restore();
    glow(r, 160, 63, 40 + Math.round(pulse * 6), '#ffc070', 0.5);
    box(ctx, 155, 59, 10, 10, '#ffd890');
    box(ctx, 157, 60, 6, 8, '#fff4dc');
    box(ctx, 159, 58, 2, 1, '#ffd890');
    city.beacons.forEach(([x, y], i) => {
      const w = this.worlds[i];
      if (!w) return;
      const col = lookOf(w);
      const lit = prog[i]?.lit;
      const sel = i === this.card;
      const b = 0.55 + 0.45 * Math.sin(t * 3 + i);
      glow(r, x, y, lit ? 14 + Math.round(b * 4) : sel ? 10 : 6, col, lit ? 0.7 : sel ? 0.45 : 0.25);
      box(ctx, x - 1, y - 1, 3, 3, lit || sel ? '#fff4dc' : col);
      if (sel) {
        const rr = 6 + Math.round((t * 8) % 6);
        ctx.globalAlpha = 1 - ((t * 8) % 6) / 6;
        ctx.strokeStyle = col;
        ctx.lineWidth = 1;
        ctx.strokeRect(x - rr + 0.5, y - rr + 0.5, rr * 2, rr * 2);
        ctx.globalAlpha = 1;
      }
    });

    // ---- the river: shimmering reflections of the city lights ---------------------------------------
    for (let y = BRIDGE + 10; y < H; y += 2) {
      for (let k = 0; k < 9; k++) {
        const x = Math.floor(((k * 41 + y * 7 + t * (6 + (y % 5))) % (W + 20)) - 10);
        box(ctx, x, y, 3 + (k % 3) * 2, 1, k % 3 === 0 ? '#8a4a8a' : '#3a2c6a');
      }
    }
    city.beacons.forEach(([x], i) => {
      if (!prog[i]?.lit && i !== this.card) return;
      const col = this.worlds[i] ? lookOf(this.worlds[i]) : '#ffcf7a';
      for (let y = BRIDGE + 10; y < H; y += 3) if (Math.sin(t * 4 + y * 0.7 + i) > -0.2) box(ctx, x - 1 + Math.round(Math.sin(t * 3 + y) * 1.5), y, 3, 1, col);
    });

    // ---- the Spirit Rail train crossing the bridge, behind the parapet lamps --------------------------
    const cyc = (t + 4) % 16;
    if (cyc < 7) {
      const s = getSheet('train');
      const tx = -80 + (cyc / 7) * 480;
      ctx.drawImage(frameCanvas('train', this.wheels.frame), Math.round(tx - s.ox), BRIDGE - s.oy + 1);
      glow(r, tx + 50, BRIDGE - 22, 18, '#ffd890', 0.35);
    }
    for (let x = 20; x < W; x += 48) {
      box(ctx, x, BRIDGE - 14, 1, 14, '#2a2050');
      box(ctx, x - 1, BRIDGE - 16, 3, 3, '#ffd890');
      glow(r, x, BRIDGE - 15, 9 + (Math.sin(t * 7 + x) > 0.8 ? 1 : 0), '#ffb45a', 0.4);
    }

    // ---- our hero, on the bridge, with its lantern ------------------------------------------------------
    this.drawHero(r, 160, BRIDGE);
    glow(r, 164, BRIDGE - 10, 22, '#ffb45a', 0.35);

    // ---- UI ---------------------------------------------------------------------------------------------
    this.drawLogo(r, t);
    this.drawMenu(r, t, prog);
    this.drawPostcard(r, t, prog);
    ctx.save();
    ctx.fillStyle = rgba('#07061a', 0.6);
    ctx.fillRect(0, H - 11, W, 11);
    ctx.restore();
    r.textCenter('↑↓ CHOOSE    Z / ENTER SELECT    ← → AVATAR    M MUSIC', W / 2, H - 8, 1);
  }

  private drawHero(r: Renderer, x: number, y: number) {
    if (!this.hero) {
      this.hero = document.createElement('canvas');
      this.hero.width = W;
      this.hero.height = H;
    }
    const c = this.hero.getContext('2d', { willReadFrequently: true })!;
    const s = getSheet('player');
    const bx = x - 20;
    const by = y - 28;
    c.clearRect(bx, by, 40, 30);
    c.drawImage(frameCanvas('player', this.twig.frame), x - s.ox, y - s.oy);
    const ls = getSheet('lantern');
    c.drawImage(frameCanvas('lantern', this.flame.frame), x + 9 - ls.ox, y - ls.oy);
    recolor(this.hero, PAL, HERO_RAMP, { x: bx, y: by, w: 40, h: 30 });
    r.ctx.drawImage(this.hero, bx, by, 40, 30, bx, by, 40, 30);
  }

  private drawLogo(r: Renderer, t: number) {
    const bob = Math.round(Math.sin(t * 1.4) * 1.5);
    const y = 9 + bob;
    // deep shadow, then the letters, then a warm gradient laid over them
    r.textCenter('LANTERN CITY', W / 2 + 2, y + 3, 0, 3, false);
    r.textCenter('LANTERN CITY', W / 2, y, 3, 3, true);
    // a light sweep across the title
    const sw = ((t * 0.4) % 1.8) - 0.4;
    if (sw > 0 && sw < 1) glow(r, 90 + sw * 140, y + 10, 12, '#fff4dc', 0.35);
    // hanging lanterns beside the title
    for (const lx of [66, W - 66]) {
      const sway = Math.sin(t * 1.5 + lx) * 1.5;
      r.line(lx, 0, lx + sway, y + 1, 1);
      r.sprite('lantern', this.flame.frame, lx + sway, y + 22);
      glow(r, lx + sway, y + 12, 18, '#ffb45a', 0.5);
    }
    r.textCenter('RELIGHT THE CITY, ONE DISTRICT AT A TIME', W / 2, 36, 2, 1, true);
  }

  private drawMenu(r: Renderer, t: number, prog: { lit: boolean; open: boolean }[]) {
    const ctx = r.ctx;
    const x = 8;
    const y = 84;
    const w = 104;
    const h = 14 + this.items.length * 12 + 14;
    panel(r, x, y, w, h);
    r.text('SPIRIT RAIL', x + 8, y + 5, 2);
    this.items.forEach((item, i) => {
      const ty = y + 17 + i * 12;
      const sel = i === this.index;
      const label = item === 'AVATAR' ? `AVATAR: ${this.avatars[this.avatar].toUpperCase()}` : item;
      if (sel) {
        ctx.save();
        ctx.drawImage(vGradient([[0, rgba('#ffb45a', 0.35)], [1, rgba('#ff7a5a', 0.15)]]), x + 3, ty - 2, w - 6, 10);
        ctx.restore();
        // a tiny lantern marks the choice
        const fl = Math.sin(t * 9) > 0.6 ? '#fff4dc' : '#ffd890';
        box(ctx, x + 6, ty - 1, 4, 1, '#6a5aa8');
        box(ctx, x + 5, ty, 6, 5, '#6a5aa8');
        box(ctx, x + 6, ty + 1, 4, 3, fl);
        glow(r, x + 8, ty + 2, 8, '#ffb45a', 0.5);
      }
      const arrows = sel && item === 'AVATAR';
      r.text(arrows ? `${label} →` : label, x + 14 + (sel ? 1 : 0), ty, sel ? 3 : 1);
    });
    // progress: one little lantern per district
    const py = y + h - 11;
    const lit = prog.filter((p) => p.lit).length;
    r.text(`LANTERNS ${lit}/${this.worlds.length}`, x + 8, py, 2);
    prog.forEach((p, i) => {
      const lx = x + 70 + i * 4;
      const col = this.worlds[i] ? lookOf(this.worlds[i]) : '#ffb45a';
      box(ctx, lx, py, 3, 5, p.lit ? col : p.open ? '#6a5aa8' : '#2a2050');
      if (p.lit) box(ctx, lx + 1, py + 1, 1, 2, '#fff4dc');
    });
  }

  private drawPostcard(r: Renderer, t: number, prog: { lit: boolean; open: boolean }[]) {
    const def = this.worlds[this.card];
    if (!def) return;
    const ctx = r.ctx;
    const x = 208;
    const y = 84;
    const w = 104;
    const ih = 48;
    panel(r, x, y, w, ih + 30);
    const img = postcard(def, PAL);
    // pan slowly across the scene
    const sw = (w - 6) * 2;
    const sh = ih * 2;
    const pan = Math.round(((Math.sin((this.cardT / SHOW_SECONDS) * Math.PI - Math.PI / 2) + 1) / 2) * (W - sw));
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, pan, H - sh, sw, sh, x + 3, y + 3, w - 6, ih);
    ctx.restore();
    // a soft wipe between districts
    const edge = Math.min(this.cardT, SHOW_SECONDS - this.cardT);
    if (edge < 0.3) {
      ctx.save();
      ctx.fillStyle = rgba('#07061a', 1 - edge / 0.3);
      ctx.fillRect(x + 3, y + 3, w - 6, ih);
      ctx.restore();
    }
    ctx.strokeStyle = '#ffb45a';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 2.5, y + 2.5, w - 5, ih + 1);
    const p = prog[this.card];
    const name = def.name.toUpperCase();
    r.textCenter(name, x + w / 2, y + ih + 7, 3, 1, true);
    const tag = p?.lit ? 'LANTERN RELIT' : p?.open ? 'LINE OPEN' : 'LINE CLOSED';
    r.textCenter(`LINE ${this.card + 1}  ${tag}`, x + w / 2, y + ih + 16, p?.lit ? 2 : 1, 1, false);
    // which district is showing
    this.worlds.forEach((wd, i) => {
      const dx = x + w / 2 - this.worlds.length * 3 + i * 6 + 1;
      const col = lookOf(wd);
      if (i === this.card) box(ctx, dx - 1, y + ih + 24, 4, 4, col);
      else box(ctx, dx, y + ih + 25, 2, 2, i < this.card ? col : '#3a2a6e');
    });
  }
}

/** The world's signature light colour, for beacons and reflections. */
function lookOf(def: WorldDef): string {
  return def.look?.glow ?? def.palette[3];
}

/** A dark glass panel with a gold rim and corner studs. */
function panel(r: Renderer, x: number, y: number, w: number, h: number) {
  const ctx = r.ctx;
  ctx.save();
  ctx.fillStyle = rgba('#07061a', 0.88);
  ctx.fillRect(x, y, w, h);
  ctx.drawImage(glowSprite(Math.round(w / 2), '#6a5aa8'), x, y - w / 2 + 6, w, w);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#07061a';
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  ctx.strokeStyle = '#6a5aa8';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  box(ctx, x + 1, y + 1, w - 2, 1, '#ffb45a');
  for (const [cx, cy] of [
    [x, y],
    [x + w - 2, y],
    [x, y + h - 2],
    [x + w - 2, y + h - 2],
  ])
    box(ctx, cx, cy, 2, 2, '#ffd890');
}
