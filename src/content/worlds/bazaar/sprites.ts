import { disc, frame, rim } from '../../../art/paint';
import type { PixelBuffer } from '../../../engine/pixels';
import { defineSheet } from '../../../engine/sprites';

/** Neon Bazaar sprites: neon signs, market stalls, lantern strings, a noodle cart, a vending machine and Mira. */

// ---- neon wall signs (24x12): a glyph in a glowing tube frame; flickers -----------------------------
type Glyph = (b: PixelBuffer, c: number) => void;
const GLYPHS: Record<string, Glyph> = {
  noodle: (b, c) => {
    // a bowl with chopsticks and steam
    b.line(6, 6, 17, 6, c);
    b.line(7, 7, 9, 9, c);
    b.line(16, 7, 14, 9, c);
    b.line(9, 9, 14, 9, c);
    b.line(13, 2, 18, 5, c);
    b.line(15, 2, 19, 4, c);
    b.set(9, 3, c);
    b.set(10, 2, c);
    b.set(11, 4, c);
  },
  tea: (b, c) => {
    b.line(7, 4, 15, 4, c);
    b.line(8, 4, 9, 9, c);
    b.line(14, 4, 13, 9, c);
    b.line(9, 9, 13, 9, c);
    b.line(15, 5, 17, 6, c);
    b.line(17, 6, 14, 8, c);
    b.set(10, 2, c);
    b.set(12, 1, c);
  },
  fish: (b, c) => {
    b.line(6, 6, 10, 3, c);
    b.line(10, 3, 15, 3, c);
    b.line(15, 3, 17, 6, c);
    b.line(17, 6, 15, 9, c);
    b.line(15, 9, 10, 9, c);
    b.line(10, 9, 6, 6, c);
    b.line(17, 6, 20, 3, c);
    b.line(17, 6, 20, 9, c);
    b.set(13, 5, c);
  },
  star: (b, c) => {
    b.line(12, 2, 12, 10, c);
    b.line(8, 6, 16, 6, c);
    b.line(9, 3, 15, 9, c);
    b.line(15, 3, 9, 9, c);
    b.set(5, 4, c);
    b.set(19, 8, c);
  },
};
function neon(b: PixelBuffer, glyph: string, on: boolean) {
  const c = on ? 3 : 1;
  b.rect(1, 0, 22, 1, on ? 2 : 1);
  b.rect(1, 11, 22, 1, on ? 2 : 1);
  b.rect(0, 1, 1, 10, on ? 2 : 1);
  b.rect(23, 1, 1, 10, on ? 2 : 1);
  b.rect(1, 1, 22, 10, 0);
  GLYPHS[glyph](b, c);
}
const neonFrames: Record<string, string[]> = {};
const neonAnims: Record<string, { frames: string[]; fps: number }> = {};
for (const g of Object.keys(GLYPHS)) {
  neonFrames[`${g}On`] = frame(24, 12, (b) => neon(b, g, true));
  neonFrames[`${g}Off`] = frame(24, 12, (b) => neon(b, g, false));
  const on = `${g}On`;
  const off = `${g}Off`;
  neonAnims[g] = { frames: [on, on, on, on, on, on, off, on, off, on, on, on, on, on, on, on], fps: 8 };
}
defineSheet('bazaar-neon', { w: 24, h: 12, ox: 12, oy: 6, frames: neonFrames, anims: neonAnims });

// ---- a neon sign on a post, standing in the street (24x30) -------------------------------------
const postFrames: Record<string, string[]> = {};
const postAnims: Record<string, { frames: string[]; fps: number }> = {};
for (const g of Object.keys(GLYPHS)) {
  for (const on of [true, false])
    postFrames[`${g}${on ? 'On' : 'Off'}`] = frame(24, 30, (b) => {
      const s = frame(24, 12, (bb) => neon(bb, g, on));
      b.stamp(s, 0, 0);
      b.rect(11, 12, 2, 17, 1);
      b.rect(9, 28, 6, 2, 2);
    });
  postAnims[g] = { ...neonAnims[g] };
}
defineSheet('bazaar-signpost', { w: 24, h: 30, ox: 12, oy: 30, frames: postFrames, anims: postAnims });

// ---- a market stall with a striped awning and a counter of goods (32x24) ---------------------------
function stall(b: PixelBuffer, f: number) {
  for (let x = 0; x < 32; x++) {
    b.rect(x, 2, 1, 5, Math.floor(x / 4) % 2 ? 3 : 2);
    if (x % 4 === 1) b.set(x, 7, Math.floor(x / 4) % 2 ? 3 : 2);
  }
  b.rect(0, 1, 32, 1, 1);
  b.rect(2, 8, 1, 16, 1);
  b.rect(29, 8, 1, 16, 1);
  b.rect(1, 16, 30, 2, 2);
  b.rect(1, 16, 30, 1, 3);
  b.rect(3, 18, 26, 6, 1);
  // goods on the counter: jars, a fish, fruit
  for (const x of [5, 9, 13]) {
    b.rect(x, 12, 3, 4, 1);
    b.set(x + 1, 13, 3);
  }
  disc(b, 20, 14, 2, 2);
  disc(b, 24, 14, 2, 3);
  // a hanging bulb swinging gently
  b.set(16 + f, 9, 1);
  b.set(16 + f, 10, 3);
}
defineSheet('bazaar-stall', {
  w: 32,
  h: 24,
  ox: 16,
  oy: 24,
  frames: { a: frame(32, 24, (b) => stall(b, 0)), b: frame(32, 24, (b) => stall(b, 1)) },
  anims: { idle: { frames: ['a', 'b'], fps: 1.5 } },
});

// ---- a string of paper lanterns under an awning (40x12) --------------------------------------------
function lanterns(b: PixelBuffer, f: number) {
  for (let x = 0; x < 40; x++) b.set(x, Math.round(Math.sin((x / 39) * Math.PI) * 3), 1);
  for (let k = 0; k < 4; k++) {
    const x = 5 + k * 10 + (k % 2 ? f : -f);
    const y = Math.round(Math.sin(((5 + k * 10) / 39) * Math.PI) * 3) + 1;
    b.rect(x - 1, y + 1, 4, 5, k % 2 ? 2 : 3);
    b.rect(x - 2, y + 2, 6, 3, k % 2 ? 2 : 3);
    b.rect(x - 1, y + 3, 4, 1, 1);
    b.set(x, y, 1);
    b.set(x + 1, y + 6, 1);
  }
}
defineSheet('bazaar-lanterns', {
  w: 40,
  h: 12,
  ox: 20,
  oy: 0,
  frames: { a: frame(40, 12, (b) => lanterns(b, 0)), b: frame(40, 12, (b) => lanterns(b, 1)) },
  anims: { sway: { frames: ['a', 'b'], fps: 1.2 } },
});

// ---- a noodle cart with steam rising from the pot (24x24) ----------------------------------------
function cart(b: PixelBuffer, f: number) {
  b.rect(1, 12, 22, 7, 1);
  b.rect(1, 12, 22, 1, 2);
  b.rect(3, 14, 8, 3, 2);
  b.rect(14, 9, 6, 3, 2);
  b.rect(14, 9, 6, 1, 3);
  disc(b, 6, 20, 3, 2);
  b.set(6, 20, 0);
  disc(b, 18, 20, 3, 2);
  b.set(18, 20, 0);
  b.rect(0, 4, 2, 9, 1);
  b.rect(0, 4, 13, 1, 2);
  for (let k = 0; k < 3; k++) {
    const y = 7 - ((k * 3 + f * 2) % 7);
    b.set(16 + ((k + f) % 3), y, k === 0 ? 3 : 2);
    b.set(17 + ((k + f) % 2), y - 1, 2);
  }
}
defineSheet('bazaar-cart', {
  w: 24,
  h: 24,
  ox: 12,
  oy: 24,
  frames: { a: frame(24, 24, (b) => cart(b, 0)), b: frame(24, 24, (b) => cart(b, 1)), c: frame(24, 24, (b) => cart(b, 2)) },
  anims: { steam: { frames: ['a', 'b', 'c'], fps: 5 } },
});

// ---- a glowing vending machine (12x18) ----------------------------------------------------------------
function vending(b: PixelBuffer, f: number) {
  b.rect(0, 0, 12, 18, 1);
  b.rect(1, 1, 7, 11, f ? 3 : 2);
  for (let y = 3; y < 12; y += 3) b.rect(2, y, 5, 1, 1);
  b.rect(9, 2, 2, 1, 3);
  b.rect(9, 4, 2, 1, 2);
  b.rect(9, 6, 2, 1, 2);
  b.rect(2, 14, 6, 2, 0);
  rim(b, 1);
}
defineSheet('bazaar-vending', {
  w: 12,
  h: 18,
  ox: 6,
  oy: 18,
  frames: { a: frame(12, 18, (b) => vending(b, 0)), b: frame(12, 18, (b) => vending(b, 1)) },
  anims: { hum: { frames: ['b', 'b', 'b', 'a', 'b', 'b', 'b', 'b', 'b', 'a'], fps: 6 } },
});

// ---- Mira, a cat merchant with a backpack shop and a little lantern (18x22) ---------------------------
function mira(b: PixelBuffer, o: { bob: number; talk: boolean; tail: number }) {
  const y = o.bob;
  // backpack shop: a tall pack with drawers and a dangling lantern
  b.rect(1, 6 + y, 6, 12, 1);
  b.rect(1, 6 + y, 6, 1, 2);
  for (let j = 9; j < 18; j += 3) b.rect(2, j + y, 4, 1, 2);
  b.set(0, 12 + y, 1);
  b.rect(0, 13 + y, 1, 2, 3);
  // body (short cloak) and legs
  for (let j = 0; j < 7; j++) b.rect(6, 12 + j + y, 7 + (j >> 2), 1, j === 0 ? 2 : 1);
  b.rect(7, 19, 2, 3, 1);
  b.rect(11, 19, 2, 3, 1);
  // tail
  for (let i = 0; i < 5; i++) b.set(13 + i, 17 + y - Math.round(Math.sin(i * 0.8 + o.tail) * 1.5) - i, 2);
  // head with ears, eyes and whiskers
  b.rect(7, 6 + y, 7, 6, 2);
  b.rect(7, 4 + y, 2, 2, 2);
  b.rect(12, 4 + y, 2, 2, 2);
  b.set(8, 5 + y, 3);
  b.set(12, 5 + y, 3);
  b.rect(9, 8 + y, 1, 2, 3);
  b.rect(12, 8 + y, 1, 2, 3);
  b.set(14, 9 + y, 1);
  b.set(15, 10 + y, 1);
  if (o.talk) b.rect(10, 11 + y, 2, 1, 0);
  else b.set(11, 11 + y, 1);
  // scarf
  b.rect(7, 12 + y, 7, 1, 3);
}
defineSheet('bazaar-merchant', {
  w: 18,
  h: 22,
  ox: 9,
  oy: 22,
  frames: {
    i1: frame(18, 22, (b) => mira(b, { bob: 0, talk: false, tail: 0 })),
    i2: frame(18, 22, (b) => mira(b, { bob: 0, talk: false, tail: 1.5 })),
    i3: frame(18, 22, (b) => mira(b, { bob: 1, talk: false, tail: 3 })),
    t1: frame(18, 22, (b) => mira(b, { bob: 0, talk: true, tail: 1 })),
  },
  anims: {
    idle: { frames: ['i1', 'i2', 'i3', 'i2'], fps: 3 },
    talk: { frames: ['t1', 'i1'], fps: 6 },
  },
});
