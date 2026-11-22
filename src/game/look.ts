import { blit, DecorParticles, fxRand, fxRange, glow, mix, rgba, vGradient, vignette } from '../engine/fx';
import { clamp, hash2 } from '../engine/math';
import type { Palette } from '../engine/palette';
import { H, W, type Renderer } from '../engine/renderer';
import type { Light } from './entity';
import type { Theme } from './layers';
import type { World } from './world';

/**
 * WORLD LOOK: the visual-only layer on top of each world's 4-colour art. A gradient sky, depth
 * haze between parallax layers, soft additive bloom around every light, ambient life (fireflies,
 * bats, light shafts, fog, bubbles, wisps, aurora…), a colour grade and a vignette.
 * Nothing here reads input, touches collision, or uses Math.random (gameplay RNG is untouched).
 */
export type LifeKind = 'fireflies' | 'shafts' | 'fog' | 'bats' | 'bubbles' | 'sparks' | 'wisps' | 'leaves' | 'aurora' | 'drips' | 'smoke';

export interface Look {
  /** Sky gradient: top, middle, horizon. */
  sky?: [string, string, string];
  /** Haze colour laid over the far (and lightly over the mid) parallax layers. */
  haze?: string;
  hazeA?: number;
  /** Bloom tint and strength around light sources. */
  glow?: string;
  bloom?: number;
  /** Soft glow carried by the avatar (radius in px, 0 = none). */
  playerLight?: number;
  /** Colour grade: a soft-light gradient over the whole frame. */
  grade?: { top: string; bottom: string; a: number };
  vignette?: number;
  /** Additive glow rising from the bottom of the screen (molten works, deep water). */
  floorGlow?: { col: string; a: number };
  life?: LifeKind[];
  /** Tint for life effects (fireflies, shafts, wisps). */
  lifeCol?: string;
  /** Per-layer recolour ramps (full redesign); without it the world keeps its 4 colours. */
  theme?: Theme;
}

export function defaultLook(p: Palette): Required<Pick<Look, 'sky' | 'haze' | 'hazeA' | 'glow' | 'bloom' | 'vignette' | 'playerLight'>> & Look {
  return {
    sky: [mix(p[0], '#000000', 0.35), p[0], mix(p[0], p[1], 0.45)],
    haze: mix(p[0], p[1], 0.5),
    hazeA: 0.4,
    glow: p[3],
    bloom: 0.22,
    vignette: 0.5,
    playerLight: 30,
  };
}

const resolved = new WeakMap<object, ReturnType<typeof defaultLook>>();
export function lookOf(def: { look?: Look; palette: Palette }) {
  let l = resolved.get(def);
  if (!l) resolved.set(def, (l = { ...defaultLook(def.palette), ...(def.look ?? {}) }));
  return l;
}

// ---------------------------------------------------------------------------------------------
// screen passes
// ---------------------------------------------------------------------------------------------

export function paintSky(r: Renderer, look: ReturnType<typeof defaultLook>) {
  const [a, b, c] = look.sky;
  blit(r, vGradient([[0, a], [0.55, b], [1, c]]));
}

/** Haze over the layers already drawn: `k` scales the strength (1 after far, ~0.4 after mid). */
export function haze(r: Renderer, look: ReturnType<typeof defaultLook>, k: number) {
  const a = look.hazeA * k;
  if (a <= 0) return;
  blit(r, vGradient([[0, rgba(look.haze, a * 0.35)], [0.6, rgba(look.haze, a * 0.8)], [1, rgba(look.haze, a)]]));
}

/** Grade + vignette: call last, before HUD/menus. */
export function finish(r: Renderer, look: ReturnType<typeof defaultLook>, palette: Palette) {
  if (look.floorGlow) blit(r, vGradient([[0, rgba(look.floorGlow.col, 0)], [0.55, rgba(look.floorGlow.col, 0)], [1, rgba(look.floorGlow.col, 1)]]), 'lighter', look.floorGlow.a);
  if (look.grade) blit(r, vGradient([[0, look.grade.top], [1, look.grade.bottom]]), 'soft-light', look.grade.a);
  if (look.vignette > 0) blit(r, vignette(palette[0], look.vignette));
}

export function bloom(r: Renderer, look: ReturnType<typeof defaultLook>, lights: Light[], t: number) {
  if (look.bloom <= 0) return;
  for (const l of lights) {
    const flick = 1 + Math.sin(t * 7.3 + l.x * 0.13) * 0.04 + Math.sin(t * 13.1 + l.y) * 0.03;
    glow(r, l.x, l.y, Math.min(56, l.r * 0.75 * flick), look.glow, look.bloom);
  }
}

// ---------------------------------------------------------------------------------------------
// ambient life
// ---------------------------------------------------------------------------------------------

interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ph: number;
}

export class Atmosphere {
  private motes: Mote[] = [];
  private bats: { x: number; y: number; ph: number; s: number }[] = [];
  private leaves: { x: number; y: number; ph: number; s: number }[] = [];
  private bubbles: { x: number; y: number; s: number; w: number }[] = [];
  private batT = 6;
  readonly decor = new DecorParticles();
  private has: Set<LifeKind>;
  private col: string;

  constructor(
    private look: ReturnType<typeof defaultLook>,
    palette: Palette,
  ) {
    this.has = new Set(look.life ?? []);
    this.col = look.lifeCol ?? palette[3];
    const n = this.has.has('fireflies') ? 22 : this.has.has('wisps') ? 14 : 0;
    for (let i = 0; i < n; i++) this.motes.push({ x: fxRange(0, W), y: fxRange(0, H), vx: 0, vy: 0, ph: fxRange(0, 7) });
    if (this.has.has('leaves')) for (let i = 0; i < 9; i++) this.leaves.push({ x: fxRange(0, W), y: fxRange(0, H), ph: fxRange(0, 7), s: fxRange(0.6, 1.2) });
    if (this.has.has('bubbles')) for (let i = 0; i < 16; i++) this.bubbles.push({ x: fxRange(0, W), y: fxRange(0, H), s: fxRange(8, 22), w: fxRange(0, 7) });
  }

  update(dt: number, t: number, camDX: number, camDY: number) {
    // screen-space motes drift against the camera so they feel like they live in the world
    for (const m of this.motes) {
      m.vx += (Math.sin(t * 0.9 + m.ph * 3) * 6 - m.vx) * dt;
      m.vy += (Math.cos(t * 0.7 + m.ph * 2) * 4 - m.vy) * dt;
      m.x += m.vx * dt - camDX * 0.9;
      m.y += m.vy * dt - camDY * 0.9;
      if (m.x < -8) m.x += W + 16;
      if (m.x > W + 8) m.x -= W + 16;
      if (m.y < -8) m.y += H + 16;
      if (m.y > H + 8) m.y -= H + 16;
    }
    for (const l of this.leaves) {
      l.x += (14 * l.s + Math.sin(t * 2 + l.ph) * 8) * dt - camDX;
      l.y += (10 * l.s + Math.cos(t * 3 + l.ph) * 6) * dt - camDY;
      if (l.x > W + 6) l.x -= W + 12;
      if (l.x < -6) l.x += W + 12;
      if (l.y > H + 6) {
        l.y = -6;
        l.x = fxRange(0, W);
      }
      if (l.y < -6) l.y += H + 12;
    }
    for (const b of this.bubbles) {
      b.y -= b.s * dt + camDY * 0.4;
      b.x += Math.sin(t * 2 + b.w) * 4 * dt - camDX * 0.4;
      if (b.y < -4) {
        b.y = H + fxRange(0, 20);
        b.x = fxRange(0, W);
      }
      if (b.x < -4) b.x += W + 8;
      if (b.x > W + 4) b.x -= W + 8;
    }
    if (this.has.has('bats')) {
      this.batT -= dt;
      if (this.batT <= 0) {
        this.batT = fxRange(9, 16);
        const n = 5 + Math.floor(fxRand() * 5);
        const y = fxRange(24, 80);
        for (let i = 0; i < n; i++) this.bats.push({ x: W + 10 + i * fxRange(6, 12), y: y + fxRange(-10, 10), ph: fxRange(0, 7), s: fxRange(40, 60) });
      }
      for (const b of this.bats) b.x -= b.s * dt;
      this.bats = this.bats.filter((b) => b.x > -10);
    }
    this.decor.update(dt);
  }

  /** Behind the near layer and the level (screen space): aurora, far bats, light shafts. */
  drawBack(r: Renderer, t: number, camX: number) {
    const ctx = r.ctx;
    if (this.has.has('aurora')) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let x = 0; x < W; x += 2) {
        const wx = x + camX * 0.08;
        const top = 10 + Math.sin(wx * 0.021 + t * 0.35) * 8 + Math.sin(wx * 0.053 - t * 0.6) * 4;
        const len = 26 + Math.sin(wx * 0.031 + t * 0.5) * 12;
        const a = 0.05 + 0.05 * Math.sin(wx * 0.04 + t * 0.9);
        ctx.globalAlpha = Math.max(0, a);
        ctx.drawImage(vGradient([[0, rgba(this.col, 0)], [0.3, rgba(this.col, 1)], [1, rgba(this.col, 0)]]), x, top, 2, len);
      }
      ctx.restore();
    }
    for (const b of this.bats) {
      const up = Math.floor(t * 10 + b.ph) % 2;
      const y = Math.round(b.y + Math.sin(t * 4 + b.ph) * 3);
      r.rect(b.x, y, 1, 1, 0);
      r.rect(b.x - 2, y + (up ? -1 : 1), 2, 1, 0);
      r.rect(b.x + 1, y + (up ? -1 : 1), 2, 1, 0);
    }
  }

  /** Light shafts from above (screen space, additive). */
  drawShafts(r: Renderer, t: number, camX: number) {
    if (!this.has.has('shafts')) return;
    const ctx = r.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const beam = vGradient([[0, rgba(this.col, 0.9)], [0.7, rgba(this.col, 0.25)], [1, rgba(this.col, 0)]]);
    for (let i = 0; i < 4; i++) {
      const x = ((i * 97 + 40 - camX * 0.35) % (W + 120) + W + 120) % (W + 120) - 60;
      const a = 0.05 + 0.035 * Math.sin(t * 0.4 + i * 1.7);
      ctx.globalAlpha = Math.max(0, a);
      ctx.setTransform(1, 0, -0.35, 1, x, 0);
      ctx.drawImage(beam, 0, 0, 14 + (i % 2) * 10, H);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.restore();
  }

  /** Fog banks near the bottom of the view. */
  drawFog(r: Renderer, t: number, camX: number, fogCol: string) {
    if (!this.has.has('fog')) return;
    const ctx = r.ctx;
    ctx.save();
    const g = vGradient([[0, rgba(fogCol, 0)], [0.5, rgba(fogCol, 1)], [1, rgba(fogCol, 0)]]);
    for (let i = 0; i < 5; i++) {
      const w = 140 + i * 30;
      const x = ((i * 131 - camX * (0.5 + i * 0.1) + t * (4 + i * 2)) % (W + w) + W + w) % (W + w) - w;
      ctx.globalAlpha = 0.09 + (i % 2) * 0.04;
      ctx.drawImage(g, x, H - 34 - (i % 3) * 8, w, 30);
    }
    ctx.restore();
  }

  /** In front of the level: fireflies / wisps / leaves / bubbles / sparks glow. */
  drawFront(r: Renderer, t: number, w: World | null) {
    const ox = r.ox;
    const oy = r.oy;
    r.screen();
    for (const m of this.motes) {
      const on = 0.5 + 0.5 * Math.sin(t * 2.2 + m.ph * 5);
      if (on < 0.2) continue;
      r.rect(m.x, m.y, 1, 1, on > 0.6 ? 3 : 2);
      glow(r, m.x, m.y, this.has.has('wisps') ? 9 : 6, this.col, 0.25 * on);
    }
    for (const l of this.leaves) {
      const f = Math.floor(t * 6 + l.ph) % 4;
      r.rect(l.x, l.y, f % 2 ? 2 : 1, f % 2 ? 1 : 2, 2);
    }
    for (const b of this.bubbles) {
      r.rect(b.x, b.y, 1, 1, 2);
      if (b.s > 17) {
        r.rect(b.x + 1, b.y, 1, 1, 2);
        r.rect(b.x, b.y - 1, 1, 1, 3);
      }
    }
    r.ox = ox;
    r.oy = oy;
    if (this.has.has('sparks') && w) {
      let n = 0;
      for (const p of w.particles.list) {
        if (p.c !== 3 || n++ > 60) continue;
        glow(r, p.x, p.y, 5, this.look.glow, 0.35 * clamp(p.life / p.max, 0, 1));
      }
    }
    if (this.has.has('drips')) {
      // slow drops falling in the foreground of the view
      for (let i = 0; i < 5; i++) {
        const sx = Math.floor(hash2(i, 7, 911) * W);
        const ph = (t * 0.45 + i * 0.37) % 1;
        if (ph < 0.6) r.rect(sx - r.ox, (ph / 0.6) * (ph / 0.6) * H - r.oy, 1, 2, 2);
      }
    }
    this.decor.draw(r);
  }
}
