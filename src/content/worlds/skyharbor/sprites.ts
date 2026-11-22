import { disc, frame, rim } from '../../../art/paint';
import { bayer } from '../../../engine/math';
import type { PixelBuffer } from '../../../engine/pixels';
import { defineSheet } from '../../../engine/sprites';

/** Skyharbor sprites: tethered balloons, flags, cargo, fans, pier struts, a mast and Captain Gale. */

// ---- a tethered hot-air balloon bobbing above the deck (18x34) -------------------------------
function balloon(b: PixelBuffer, bob: number) {
  const cy = 9 + bob;
  for (let y = -9; y <= 9; y++)
    for (let x = -8; x <= 8; x++) {
      const d = (x * x) / 64 + (y * y) / 81;
      if (d > 1 && !(y > 4 && Math.abs(x) <= 9 - y)) continue;
      const stripe = Math.floor((x + 9) / 3.4) % 2 === 0;
      let c = stripe ? 2 : 1;
      if (x < -2 && y < -1 && bayer(x + 9, y + 9) < 0.5) c = 3;
      b.set(9 + x, cy + y, c);
    }
  rim(b, 1);
  // ropes and the basket
  b.line(5, cy + 8, 7, cy + 14, 1);
  b.line(13, cy + 8, 11, cy + 14, 1);
  b.rect(6, cy + 14, 7, 4, 2);
  b.rect(6, cy + 14, 7, 1, 3);
  b.rect(7, cy + 16, 5, 1, 1);
  // tether down to the deck
  for (let y = cy + 18; y < 34; y++) if ((y & 1) === 0) b.set(9, y, 1);
  b.rect(8, 32, 3, 2, 2);
}
defineSheet('skyharbor-balloon', {
  w: 18,
  h: 34,
  ox: 9,
  oy: 34,
  frames: { a: frame(18, 34, (b) => balloon(b, 0)), b: frame(18, 34, (b) => balloon(b, 1)) },
  anims: { bob: { frames: ['a', 'a', 'b', 'b'], fps: 2 } },
});

// ---- a pennant flapping on a pole (12x20) ------------------------------------------------------
function flag(b: PixelBuffer, f: number) {
  b.rect(1, 1, 1, 19, 1);
  b.set(1, 0, 3);
  for (let x = 0; x < 9; x++) {
    const wave = Math.round(Math.sin(x * 0.9 + f * 2.1));
    const h = Math.max(1, 5 - Math.floor(x / 2));
    for (let y = 0; y < h; y++) b.set(2 + x, 2 + wave + y + Math.floor(x / 4), y === 0 ? 3 : 2);
  }
  b.rect(0, 19, 3, 1, 2);
}
defineSheet('skyharbor-flag', {
  w: 12,
  h: 20,
  ox: 2,
  oy: 20,
  frames: { a: frame(12, 20, (b) => flag(b, 0)), b: frame(12, 20, (b) => flag(b, 1)), c: frame(12, 20, (b) => flag(b, 2)) },
  anims: { flap: { frames: ['a', 'b', 'c'], fps: 7 } },
});

// ---- cargo: crate, barrel and a stack of sacks (10x10) -----------------------------------------
defineSheet('skyharbor-cargo', {
  w: 10,
  h: 10,
  ox: 5,
  oy: 10,
  frames: {
    crate: frame(10, 10, (b) => {
      b.rect(0, 1, 10, 9, 2);
      b.rect(1, 2, 8, 7, 1);
      b.line(1, 2, 8, 8, 2);
      b.line(8, 2, 1, 8, 2);
      b.rect(0, 1, 10, 1, 3);
    }),
    barrel: frame(10, 10, (b) => {
      b.rect(2, 0, 6, 10, 1);
      b.rect(1, 1, 8, 8, 1);
      b.rect(1, 2, 8, 1, 2);
      b.rect(1, 7, 8, 1, 2);
      b.rect(3, 1, 1, 8, 2);
      b.rect(2, 0, 6, 1, 3);
    }),
    sacks: frame(10, 10, (b) => {
      disc(b, 3, 7, 3, 2);
      disc(b, 7, 7, 3, 1);
      disc(b, 5, 3, 3, 2);
      rim(b, 1);
      b.set(5, 1, 3);
      b.set(2, 5, 3);
    }),
  },
  anims: { crate: { frames: ['crate'], fps: 1 }, barrel: { frames: ['barrel'], fps: 1 }, sacks: { frames: ['sacks'], fps: 1 } },
});

// ---- the great fan under an updraft column (32x8), spinning --------------------------------------
function fan(b: PixelBuffer, f: number) {
  b.rect(0, 5, 32, 3, 1);
  b.rect(0, 5, 32, 1, 2);
  for (const x of [2, 29]) b.rect(x, 3, 1, 2, 2);
  b.rect(14, 2, 4, 3, 2);
  b.set(15, 2, 3);
  for (let k = 0; k < 4; k++) {
    const x = 2 + ((k * 7 + f * 2) % 28);
    b.rect(x, 3, 3, 1, k % 2 ? 3 : 2);
  }
}
defineSheet('skyharbor-fan', {
  w: 32,
  h: 8,
  ox: 16,
  oy: 8,
  frames: { a: frame(32, 8, (b) => fan(b, 0)), b: frame(32, 8, (b) => fan(b, 1)), c: frame(32, 8, (b) => fan(b, 2)) },
  anims: { spin: { frames: ['a', 'b', 'c'], fps: 18 } },
});

// ---- iron strut hanging under a pier (10x44), with a riding light at its tip -----------------------
defineSheet('skyharbor-strut', {
  w: 10,
  h: 44,
  ox: 5,
  oy: 0,
  frames: {
    a: frame(10, 44, (b) => {
      b.rect(2, 0, 1, 38, 1);
      b.rect(7, 0, 1, 38, 1);
      for (let y = 2; y < 36; y += 8) {
        b.line(2, y, 7, y + 6, 1);
        b.line(7, y, 2, y + 6, 1);
        b.rect(2, y, 6, 1, 2);
      }
      b.rect(3, 38, 4, 3, 2);
      b.rect(4, 41, 2, 2, 3);
    }),
  },
  anims: { idle: { frames: ['a'], fps: 1 } },
});

// ---- a ship's mast with a furled sail, a crow's nest and rigging (34x60), behind the deck ------------
defineSheet('skyharbor-mast', {
  w: 34,
  h: 60,
  ox: 17,
  oy: 60,
  frames: {
    a: frame(34, 60, (b) => {
      b.rect(16, 4, 2, 56, 1);
      b.rect(16, 4, 1, 56, 2);
      b.rect(11, 8, 12, 4, 1);
      b.rect(11, 8, 12, 1, 2);
      b.rect(2, 22, 30, 2, 2);
      for (let x = 3; x < 31; x++) for (let y = 24; y < 30 - Math.abs(x - 17) / 4; y++) b.set(x, y, (x + y) % 4 === 0 ? 1 : 2);
      b.rect(6, 40, 22, 1, 2);
      b.line(2, 23, 0, 59, 1);
      b.line(31, 23, 33, 59, 1);
      b.line(17, 4, 0, 40, 1);
      b.line(17, 4, 33, 40, 1);
      b.set(17, 2, 3);
      b.rect(17, 0, 1, 2, 2);
      b.rect(18, 0, 5, 2, 3);
    }),
  },
  anims: { idle: { frames: ['a'], fps: 1 } },
});

// ---- windsock (14x18) ---------------------------------------------------------------------------
function sock(b: PixelBuffer, f: number) {
  b.rect(1, 1, 1, 17, 1);
  for (let x = 0; x < 10; x++) {
    const droop = Math.round(x * 0.25 + Math.sin(x * 0.8 + f * 2) * 0.6);
    const h = 4 - Math.floor(x / 4);
    for (let y = 0; y < h; y++) b.set(2 + x, 2 + droop + y, Math.floor(x / 3) % 2 ? 3 : 2);
  }
}
defineSheet('skyharbor-windsock', {
  w: 14,
  h: 18,
  ox: 2,
  oy: 18,
  frames: { a: frame(14, 18, (b) => sock(b, 0)), b: frame(14, 18, (b) => sock(b, 1)), c: frame(14, 18, (b) => sock(b, 2)) },
  anims: { blow: { frames: ['a', 'b', 'c', 'b'], fps: 5 } },
});

// ---- Captain Gale: an aviator in a long coat, goggles up, scarf streaming (18x22) ---------------------
function captain(b: PixelBuffer, o: { bob: number; talk: boolean; scarf: number }) {
  const y = o.bob;
  // coat
  for (let j = 0; j < 10; j++) b.rect(5 - (j >> 3), 11 + j + y, 8 + (j >> 2), 1, j === 0 ? 2 : 1);
  b.rect(8, 11 + y, 1, 10, 2);
  b.set(7, 14 + y, 3);
  b.set(7, 17 + y, 3);
  b.rect(5, 21, 3, 1, 0);
  b.rect(10, 21, 3, 1, 0);
  // arm on hip
  b.rect(12, 13 + y, 2, 4, 1);
  b.set(13, 16 + y, 3);
  // scarf streaming behind
  for (let i = 0; i < 6; i++) b.set(4 - i, 11 + y + Math.round(Math.sin(i * 0.9 + o.scarf * 2) * 0.8), i < 3 ? 3 : 2);
  b.rect(5, 10 + y, 8, 2, 3);
  // head, cap and goggles
  b.rect(6, 5 + y, 6, 5, 3);
  b.set(10, 7 + y, 0);
  b.set(8, 7 + y, 0);
  if (o.talk) b.rect(9, 9 + y, 2, 1, 0);
  b.rect(5, 2 + y, 8, 3, 1);
  b.rect(6, 1 + y, 6, 1, 1);
  b.rect(6, 4 + y, 6, 1, 2);
  b.rect(7, 3 + y, 2, 1, 3);
  b.rect(10, 3 + y, 2, 1, 3);
  b.rect(4, 4 + y, 2, 3, 1);
}
defineSheet('skyharbor-captain', {
  w: 18,
  h: 22,
  ox: 9,
  oy: 22,
  frames: {
    i1: frame(18, 22, (b) => captain(b, { bob: 0, talk: false, scarf: 0 })),
    i2: frame(18, 22, (b) => captain(b, { bob: 0, talk: false, scarf: 1 })),
    i3: frame(18, 22, (b) => captain(b, { bob: 1, talk: false, scarf: 2 })),
    t1: frame(18, 22, (b) => captain(b, { bob: 0, talk: true, scarf: 1 })),
  },
  anims: {
    idle: { frames: ['i1', 'i2', 'i3', 'i2'], fps: 4 },
    talk: { frames: ['t1', 'i1'], fps: 6 },
  },
});
