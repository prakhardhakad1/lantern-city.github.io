import type { Palette } from '../engine/palette';
import { recolor, type Ramp } from '../engine/recolor';
import { H, W, type Renderer } from '../engine/renderer';

/**
 * Off-screen layers for the recolour pass. Drawing code is unchanged: while a layer is active the
 * renderer simply draws into that layer's canvas. compose() recolours each layer with its ramp
 * and stacks them onto the real screen.
 */
export type LayerName = 'far' | 'near' | 'fluid' | 'terrain' | 'actors' | 'hero';
export const LAYER_ORDER: LayerName[] = ['far', 'near', 'fluid', 'terrain', 'actors', 'hero'];

export interface Theme {
  far: Ramp;
  near: Ramp;
  /** Water, acid and wind; defaults to the near-background ramp. */
  fluid?: Ramp;
  terrain: Ramp;
  actors: Ramp;
}

/** The hero keeps one look in every world: a red hood, an ember cloak and a lantern-bright face. */
export const HERO_RAMP: Ramp = { c: ['#160c1e', '#8c2840', '#e8603c', '#ffe9a8'], outline: '#0c0710' };

type Ctx = CanvasRenderingContext2D;
type Writable = { ctx: Ctx };

export class LayerStack {
  private cv = new Map<LayerName, HTMLCanvasElement>();
  private main: Ctx | null = null;

  private canvas(name: LayerName) {
    let c = this.cv.get(name);
    if (!c) {
      c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      // CPU-backed: the recolour pass reads these pixels back every frame
      c.getContext('2d', { willReadFrequently: true })!.imageSmoothingEnabled = false;
      this.cv.set(name, c);
    }
    return c;
  }

  /** Start drawing into a layer (clears it). Nested begin() calls switch layers. */
  begin(r: Renderer, name: LayerName, clear = true) {
    if (!this.main) this.main = r.ctx;
    const ctx = this.canvas(name).getContext('2d')!;
    if (clear) ctx.clearRect(0, 0, W, H);
    (r as unknown as Writable).ctx = ctx;
  }

  /** Back to the real screen. */
  end(r: Renderer) {
    if (this.main) (r as unknown as Writable).ctx = this.main;
    this.main = null;
  }

  /** Recolour every layer that was drawn this frame and stack them onto the screen. */
  /**
   * Recolour every layer that was drawn this frame and stack them onto the screen.
   * `heroBox` (screen pixels) limits the hero pass to the area around the avatar.
   */
  compose(
    r: Renderer,
    pal: Palette,
    theme: Theme,
    used: Set<LayerName>,
    after: Partial<Record<LayerName, () => void>> = {},
    heroBox?: { x: number; y: number; w: number; h: number },
  ) {
    this.end(r);
    const ramps: Record<LayerName, Ramp> = { ...theme, fluid: theme.fluid ?? theme.near, hero: HERO_RAMP };
    for (const name of LAYER_ORDER) {
      if (!used.has(name) && name !== 'far') continue;
      const c = this.canvas(name);
      if (!used.has(name)) c.getContext('2d')!.clearRect(0, 0, W, H);
      const box = name === 'hero' ? heroBox : undefined;
      recolor(c, pal, ramps[name], box);
      if (box) r.ctx.drawImage(c, box.x, box.y, box.w, box.h, box.x, box.y, box.w, box.h);
      else r.ctx.drawImage(c, 0, 0);
      if (after[name]) {
        r.screen();
        after[name]!();
      }
    }
  }
}
