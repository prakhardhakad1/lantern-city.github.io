import { AVATARS, setAvatar } from '../../art/player';
import { allWorlds, worldById } from '../../content/worlds';
import { PixelBuffer } from '../../engine/pixels';
import { H, W, type Renderer } from '../../engine/renderer';
import { Anim } from '../../engine/sprites';
import { T, TileMap } from '../../engine/tilemap';
import type { Game, Scene } from '../game';
import { clearProfile, loadProfile, newProfile, saveProfile, type Profile } from '../profile';
import { glow, rgba } from '../../engine/fx';
import { LayerStack, type LayerName } from '../layers';
import { Atmosphere, bloom, finish, haze, lookOf, paintSky } from '../look';
import type { WorldDef } from '../registry';
import { GalleryScene } from './gallery';
import { PlayScene } from './play';

export class TitleScene implements Scene {
  private t = 0;
  private index = 0;
  private items: string[];
  private save: Profile | null = loadProfile();
  /** The world a new game starts in. */
  private def: WorldDef;
  /** The title backdrop slowly cycles through every world: a window onto the whole city. */
  private shown: WorldDef;
  private showT = 0;
  private art: { far: HTMLCanvasElement | null; mid: HTMLCanvasElement | null; near: HTMLCanvasElement | null; ground: HTMLCanvasElement } | null = null;
  private look: ReturnType<typeof lookOf> | null = null;
  private atmo: Atmosphere | null = null;
  private twig = new Anim('player', 'idle');
  private walk = new Anim('player', 'run');
  private stack = new LayerStack();
  private flame = new Anim('lantern', 'on');
  private avatars = Object.keys(AVATARS);
  private avatar: number;

  constructor(private game: Game) {
    this.def = worldById('outskirts') ?? allWorlds()[0];
    this.shown = this.def;
    game.r.setPalette(this.def.palette);
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
    this.showT += dt;
    this.twig.update(dt);
    this.flame.update(dt);
    const worlds = allWorlds();
    if (this.showT >= SHOW_SECONDS && worlds.length > 1) {
      this.showT = 0;
      this.shown = worlds[(worlds.indexOf(this.shown) + 1) % worlds.length];
      this.game.r.setPalette(this.shown.palette);
      this.art = null;
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

  private build(r: Renderer) {
    const paint = (f?: (b: PixelBuffer) => void) => {
      if (!f) return null;
      const b = new PixelBuffer(640, H);
      f(b);
      return b.toCanvas(r.palette);
    };
    // the ground strip is drawn with the world's real tile style
    const map = new TileMap(W / 8, 4, this.shown.tiles);
    for (let x = 0; x < W / 8; x++) for (let y = 1; y < 4; y++) map.set(x, y, T.Solid);
    this.art = {
      far: paint(this.shown.backdrop.far),
      mid: paint(this.shown.backdrop.mid),
      near: paint(this.shown.backdrop.near),
      ground: map.render(r.palette),
    };
    this.look = lookOf(this.shown);
    this.atmo = new Atmosphere(this.look, this.shown.palette);
  }

  /** The twig strolls along the ground, stops to warm up by the lantern, and strolls back. */
  private twigPos() {
    const cyc = this.t % 16;
    if (cyc < 6) return { x: 40 + (cyc / 6) * 190, dir: 1 as const, walk: true };
    if (cyc < 8) return { x: 230, dir: 1 as const, walk: false };
    if (cyc < 14) return { x: 230 - ((cyc - 8) / 6) * 190, dir: -1 as const, walk: true };
    return { x: 40, dir: -1 as const, walk: false };
  }

  draw(r: Renderer) {
    if (!this.art) this.build(r);
    const art = this.art!;
    const look = this.look!;
    const atmo = this.atmo!;
    const ctx = r.ctx;
    const t = this.t;
    atmo.update(1 / 60, t, 0.2, 0);
    r.screen();
    r.clear(0);
    const theme = look.theme;
    const L = this.stack;
    const used = new Set<LayerName>();
    const to = (n: LayerName) => {
      if (!theme) return;
      L.begin(r, n, !used.has(n));
      used.add(n);
    };
    if (!theme) paintSky(r, look);
    const scroll = (img: HTMLCanvasElement | null, speed: number) => {
      if (!img) return;
      const off = -Math.floor((t * speed) % img.width);
      r.image(img, off, 0);
      r.image(img, off + img.width, 0);
    };
    to('far');
    scroll(art.far, 4);
    if (!theme) {
      haze(r, look, 1);
      atmo.drawBack(r, t, t * 20);
    }
    to('near');
    scroll(art.mid, 8);
    if (art.mid && !theme) haze(r, look, 0.35);
    scroll(art.near, 13);
    r.halo(256, H - 38, 22 + (Math.sin(t * 9) > 0.7 ? 1 : 0), 1);
    to('terrain');
    r.image(art.ground, 0, H - 32);
    // the lantern and the strolling twig
    to('actors');
    r.sprite('lantern', this.flame.frame, 256, H - 24);
    const tw = this.twigPos();
    this.walk.update(1 / 60);
    to('hero');
    r.sprite('player', tw.walk ? this.walk.frame : this.twig.frame, tw.x, H - 24, { flip: tw.dir < 0 });
    if (theme) L.compose(r, r.palette, theme, used, { far: () => atmo.drawBack(r, t, t * 20) });
    atmo.drawShafts(r, t, t * 20);
    bloom(r, look, [{ x: 256, y: H - 36, r: 70 }, { x: tw.x, y: H - 32, r: 34 }], t);
    atmo.drawFog(r, t, t * 20, look.haze);
    atmo.drawFront(r, t, null);
    finish(r, look, r.palette);
    // dithered cross-fade between worlds (behind the menu, so it stays readable)
    const edge = Math.min(this.showT, SHOW_SECONDS - this.showT);
    if (edge < 0.35) r.dither(1 - edge / 0.35, 0);

    // logo: deep shadow, outline, a light sweep across the letters, and a lantern at each end
    const bob = Math.round(Math.sin(t * 1.5) * 2);
    const ly = 22 + bob;
    r.textCenter('LANTERN CITY', W / 2 + 2, ly + 3, 1, 3, false);
    r.textCenter('LANTERN CITY', W / 2, ly, 3, 3, true);
    const sweep = ((t * 0.45) % 1.6) - 0.3;
    if (sweep > 0 && sweep < 1) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(60, ly - 2, 200, 22);
      ctx.clip();
      glow(r, 60 + sweep * 200, ly + 9, 11, r.palette[3], 0.28);
      ctx.restore();
    }
    for (const lx of [52, W - 52]) {
      const sway = Math.sin(t * 1.6 + lx) * 1.5;
      r.line(lx, 0, lx + sway, ly - 4, 1);
      r.sprite('lantern', this.flame.frame, lx + sway, ly + 12);
      glow(r, lx + sway, ly + 4, 22, look.glow, 0.45);
    }
    r.textCenter('A PIXEL WORLDS PROTOTYPE', W / 2, 50, 2, 1, true);

    // menu panel
    const py = 62;
    const ph = this.items.length * 11 + 8;
    ctx.save();
    ctx.fillStyle = rgba(r.palette[0], 0.62);
    ctx.fillRect(84, py, W - 168, ph);
    ctx.restore();
    r.frame(84, py, W - 168, ph, 1);
    r.rect(85, py, W - 170, 1, 2);
    this.items.forEach((item, i) => {
      const y = py + 6 + i * 11;
      const sel = i === this.index;
      const label = item === 'AVATAR' ? `AVATAR: ${this.avatars[this.avatar].toUpperCase()}` : item;
      if (sel) {
        ctx.save();
        ctx.fillStyle = rgba(r.palette[1], 0.55);
        ctx.fillRect(88, y - 2, W - 176, 9);
        ctx.restore();
        glow(r, W / 2, y + 2, 30, look.glow, 0.12 + 0.05 * Math.sin(t * 4));
      }
      const nudge = sel ? Math.round(Math.sin(t * 6)) : 0;
      r.textCenter(sel ? (item === 'AVATAR' ? `← ${label} →` : `→ ${label} ←`) : label, W / 2 + nudge * 0, y, sel ? 3 : 2, 1, true);
    });
    ctx.save();
    ctx.fillStyle = rgba(r.palette[0], 0.55);
    ctx.fillRect(60, py + ph + 3, W - 120, 11);
    ctx.restore();
    r.textCenter('↑↓ CHOOSE   Z / ENTER SELECT   M MUSIC', W / 2, py + ph + 6, 2, 1, true);

    // world card: station name and its palette
    const name = this.shown.station;
    const nx = W - 6 - name.length * 4;
    r.textOutlined(name, nx, H - 10, 3);
    this.shown.palette.forEach((_, i) => {
      r.rect(nx - 22 + i * 5, H - 9, 4, 4, i);
      r.frame(nx - 23 + i * 5, H - 10, 6, 6, 0);
    });
  }
}

const SHOW_SECONDS = 7;
