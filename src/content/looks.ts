import { arches, city, crypt, hills, leafyTrees, pines, pipes, works } from '../art/silhouettes';
import type { Palette } from '../engine/palette';
import type { PixelBuffer } from '../engine/pixels';
import { fade, type Ramp } from '../engine/recolor';
import type { Theme } from '../game/layers';
import type { Look } from '../game/look';
import type { Backdrop } from '../game/registry';

/**
 * WORLD REDESIGN: every world gets new colours. The art is still drawn with indices 0-3, but the
 * sky, the far and near backgrounds, the terrain and the creatures each get their own 4-colour
 * ramp (see engine/recolor.ts), and the hero keeps one look everywhere (game/layers.ts).
 * `palette` is the world's UI / effects palette (HUD, dialogue, particles, snow, darkness).
 * Visual only: nothing here changes a map, a hitbox, a timer or a random roll.
 */

export const withMid = (bd: Backdrop, mid: (b: PixelBuffer) => void, midScroll = 0.2): Backdrop => ({ ...bd, mid, midScroll });

type C4 = [string, string, string, string];
function theme(o: { sky: [string, string, string]; bg: C4; terrain: C4; depth: string; lip: string; actors: C4; outline: string; farMix?: number }): Theme {
  const near: Ramp = { c: o.bg };
  return {
    far: { ...fade(near, o.sky[2], o.farMix ?? 0.5), sky: o.sky },
    near,
    terrain: { c: o.terrain, depth: { col: o.depth, max: 28, k: 0.75 }, lip: o.lip },
    actors: { c: o.actors, outline: o.outline },
  };
}

// ---- Mossgate Outskirts: a violet sunset over a mossy ruin -----------------------------------
export const outskirtsPalette: Palette = ['#1b1226', '#5a3a7a', '#f08a5d', '#fff1d6'];
export const outskirtsMid = (b: PixelBuffer) => {
  city(b, 150, 11, 2, { every: 26, tall: 40, spires: true });
  const prof = hills(b, 156, 10, 1.3);
  leafyTrees(b, prof, 4, 30);
};
export const outskirtsLook: Look = {
  glow: '#ffc27a',
  bloom: 0.3,
  playerLight: 26,
  vignette: 0.45,
  life: ['fireflies', 'leaves', 'shafts', 'fog'],
  lifeCol: '#ffe3a0',
  haze: '#6a3f6e',
  theme: theme({
    sky: ['#1b1340', '#6a2f6b', '#f59a62'],
    bg: ['#2a1b3d', '#9a6bb8', '#e7a3c8', '#fff1d0'],
    terrain: ['#2d1f33', '#3f7d5a', '#9bd25a', '#f4fbc8'],
    depth: '#120a18',
    lip: '#c8f070',
    actors: ['#141024', '#3f78b0', '#9fd4f0', '#ffffff'],
    outline: '#0e0816',
  }),
};

// ---- The Underworks: a neon canal under the city, violet brick and green glow ---------------
export const underworksPalette: Palette = ['#070c18', '#2a5a7a', '#5fe0c0', '#effff8'];
export const underworksMid = (b: PixelBuffer) => {
  arches(b, 26, 128, 18, 3);
  pipes(b, 70, 7, 5);
  pipes(b, 132, 5, 6);
};
export const underworksLook: Look = {
  glow: '#6ff0d0',
  bloom: 0.3,
  playerLight: 28,
  vignette: 0.5,
  life: ['shafts', 'bubbles', 'fog', 'drips'],
  lifeCol: '#7ff0d8',
  haze: '#1a3a50',
  theme: theme({
    sky: ['#04070f', '#0d2a40', '#1f6a72'],
    bg: ['#0a1a2a', '#2f8f9d', '#7fe0d0', '#e8fff7'],
    terrain: ['#1e1636', '#6a44b0', '#e861c4', '#ffd8f4'],
    depth: '#0a0716',
    lip: '#ff9ee8',
    actors: ['#0b0716', '#e0a030', '#ffe070', '#ffffff'],
    outline: '#06040c',
  }),
};

// ---- Frostbell Spire: a pink winter dawn, blue stone, warm lamps ----------------------------
export const frostbellPalette: Palette = ['#0b1428', '#4a6fb0', '#a8dcff', '#ffffff'];
export const frostbellMid = (b: PixelBuffer) => {
  const prof = hills(b, 160, 12, 2.1);
  pines(b, prof, 9, 6, 1.1, true);
};
export const frostbellLook: Look = {
  glow: '#ffd09a',
  bloom: 0.2,
  playerLight: 24,
  vignette: 0.45,
  life: ['aurora', 'shafts'],
  lifeCol: '#ffb8d0',
  haze: '#5a5f9a',
  theme: theme({
    sky: ['#0b1d3a', '#46509a', '#f7a8b8'],
    bg: ['#1f2c5a', '#7090d8', '#bcd4ff', '#ffffff'],
    terrain: ['#22335a', '#5078c0', '#aee6f8', '#ffffff'],
    depth: '#0e1528',
    lip: '#ffffff',
    actors: ['#181430', '#6a5ad8', '#c8b8ff', '#fff6ee'],
    outline: '#0a0818',
  }),
};

// ---- Gloomroot Catacombs: violet crypt, gold-green moss, ghost-teal spirits ------------------
export const catacombsPalette: Palette = ['#08070c', '#3a2f55', '#9be08a', '#f2ffe0'];
export const catacombsMid = (b: PixelBuffer) => crypt(b, 7);
export const catacombsLook: Look = {
  glow: '#c8f090',
  bloom: 0.26,
  playerLight: 32,
  vignette: 0.55,
  life: ['wisps', 'bats'],
  lifeCol: '#d6f0a0',
  haze: '#241a33',
  theme: theme({
    sky: ['#07070d', '#16102a', '#2a1c40'],
    bg: ['#120e1e', '#55407a', '#9a78d0', '#e2d4ff'],
    terrain: ['#1a1426', '#544874', '#d0b04a', '#fff4c0'],
    depth: '#0b0910',
    lip: '#e8d070',
    actors: ['#0a0810', '#2f9f8a', '#9df0c8', '#f8fff8'],
    outline: '#050408',
  }),
};

// ---- Ember Foundry: steel-blue machinery against a molten sunset ----------------------------
export const foundryPalette: Palette = ['#120a10', '#7a2a2a', '#ff9a3d', '#fff0c0'];
export const foundryMid = (b: PixelBuffer) => works(b, 152, 13);
export const foundryLook: Look = {
  glow: '#ffb35a',
  bloom: 0.3,
  playerLight: 22,
  vignette: 0.5,
  floorGlow: { col: '#ff6a20', a: 0.16 },
  life: ['sparks'],
  lifeCol: '#ffcf80',
  haze: '#4a1a2a',
  theme: theme({
    sky: ['#120a1a', '#5a1a30', '#ff8040'],
    bg: ['#2a1018', '#9a3a3a', '#ff9a4a', '#ffe2a0'],
    terrain: ['#252030', '#4a5578', '#9aa8c8', '#ffd27a'],
    depth: '#100a12',
    lip: '#ffb060',
    actors: ['#140c12', '#3a8a8a', '#90f0e0', '#fff4d0'],
    outline: '#0a0608',
  }),
};
