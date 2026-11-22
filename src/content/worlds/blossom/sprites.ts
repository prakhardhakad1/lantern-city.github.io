import { disc, frame, rim } from '../../../art/paint';
import { bayer, hash2 } from '../../../engine/math';
import type { PixelBuffer } from '../../../engine/pixels';
import { defineSheet } from '../../../engine/sprites';

/** Blossom Terrace sprites: blossom trees, stone lanterns, a torii gate, bamboo and the old gardener. */

// ---- a cherry tree in full bloom: a twisted trunk under a cloud of blossom (40x46) ------------
function tree(b: PixelBuffer, sway: number) {
  // trunk and two limbs
  for (let y = 46; y > 22; y--) {
    const x = 19 + Math.round(Math.sin(y * 0.22) * 1.5);
    b.rect(x, y, 3, 1, 1);
    if (y % 5 === 0) b.set(x + 1, y, 2);
  }
  b.line(20, 30, 11, 22, 1);
  b.line(21, 28, 30, 21, 1);
  b.rect(16, 45, 9, 1, 1);
  // canopy: overlapping puffs, lit from the upper left, shaded underneath
  const puffs: [number, number, number][] = [
    [12, 16, 8],
    [20, 11, 10],
    [29, 16, 8],
    [8, 22, 6],
    [32, 22, 6],
    [20, 20, 8],
  ];
  for (const [x, y, r] of puffs) disc(b, x + sway, y, r, 2);
  for (const [x, y, r] of puffs)
    for (let j = -r; j <= r; j++)
      for (let i = -r; i <= r; i++) {
        const px = x + sway + i;
        const py = y + j;
        if (b.get(px, py) !== 2) continue;
        if (i + j < -r * 0.6 && bayer(px, py) < 0.55) b.set(px, py, 3);
        else if (j > r * 0.45 && bayer(px, py) < 0.5) b.set(px, py, 1);
      }
  rim(b, 1);
  // a few blossoms catching the light
  for (let k = 0; k < 9; k++) {
    const x = 6 + Math.floor(hash2(k, 1, 91) * 28) + sway;
    const y = 4 + Math.floor(hash2(k, 2, 91) * 22);
    if (b.get(x, y) === 2 || b.get(x, y) === 1) b.set(x, y, 3);
  }
}

defineSheet('blossom-tree', {
  w: 42,
  h: 47,
  ox: 21,
  oy: 47,
  frames: {
    a: frame(42, 47, (b) => tree(b, 0)),
    b: frame(42, 47, (b) => {
      tree(b, 1);
      b.set(5, 36, 3);
      b.set(36, 40, 3);
    }),
  },
  anims: { sway: { frames: ['a', 'b'], fps: 1.4 } },
});

// ---- stone lantern (toro) with a flickering flame (10x17) -----------------------------------
function toro(b: PixelBuffer, flame: number) {
  b.rect(1, 15, 8, 2, 2);
  b.rect(2, 14, 6, 1, 1);
  b.rect(3, 9, 4, 5, 1);
  b.rect(4, 10, 1, 3, 2);
  b.rect(1, 8, 8, 1, 2);
  b.rect(2, 4, 6, 4, 1);
  b.rect(3, 5, 4, 2, flame);
  b.set(4, 5, 3);
  b.rect(0, 3, 10, 1, 2);
  b.rect(1, 2, 8, 1, 2);
  b.set(0, 2, 2);
  b.set(9, 2, 2);
  b.rect(3, 1, 4, 1, 1);
  b.set(4, 0, 2);
  b.set(5, 0, 2);
}
defineSheet('blossom-lantern', {
  w: 10,
  h: 17,
  ox: 5,
  oy: 17,
  frames: { a: frame(10, 17, (b) => toro(b, 3)), b: frame(10, 17, (b) => toro(b, 2)) },
  anims: { glow: { frames: ['a', 'a', 'b', 'a', 'a', 'a', 'b', 'b'], fps: 8 } },
});

// ---- torii gate (46x38), drawn behind the terrain ----------------------------------------------
defineSheet('blossom-torii', {
  w: 46,
  h: 38,
  ox: 23,
  oy: 38,
  frames: {
    a: frame(46, 38, (b) => {
      for (const px of [8, 35]) {
        b.rect(px, 8, 3, 30, 2);
        b.rect(px, 8, 1, 30, 3);
        b.rect(px - 1, 34, 5, 4, 1);
      }
      // kasagi: the top beam, swept up at both ends
      for (let x = 0; x < 46; x++) {
        const lift = x < 4 ? (4 - x) >> 1 : x > 41 ? (x - 41) >> 1 : 0;
        b.rect(x, 2 - lift, 1, 3, 2);
        b.set(x, 2 - lift, 3);
      }
      b.rect(3, 5, 40, 1, 1);
      // nuki: the lower tie beam
      b.rect(4, 12, 38, 2, 2);
      b.rect(4, 12, 38, 1, 3);
      // the name plaque
      b.rect(20, 5, 6, 7, 1);
      b.rect(21, 6, 4, 5, 2);
      b.set(22, 7, 3);
      b.set(23, 9, 3);
    }),
  },
  anims: { idle: { frames: ['a'], fps: 1 } },
});

// ---- bamboo clump (14x44) -------------------------------------------------------------------
function bamboo(b: PixelBuffer, sway: number) {
  const stalks: [number, number][] = [
    [3, 44],
    [7, 38],
    [11, 30],
  ];
  for (const [sx, h] of stalks) {
    for (let y = 0; y < h; y++) {
      const lean = Math.round((sway * (h - y)) / h);
      const x = sx + lean;
      const yy = 44 - y;
      b.set(x, yy, 2);
      b.set(x + 1, yy, 1);
      if (y % 7 === 6) {
        b.set(x - 1, yy, 1);
        b.set(x, yy, 3);
        b.set(x + 1, yy, 2);
        b.set(x + 2, yy, 1);
      }
      if (y > h - 12 && y % 5 === 0) {
        const d = (y / 5) % 2 ? 1 : -1;
        for (let k = 1; k <= 3; k++) b.set(x + d * k, yy - (k >> 1), k === 3 ? 3 : 2);
      }
    }
  }
}
defineSheet('blossom-bamboo', {
  w: 16,
  h: 45,
  ox: 8,
  oy: 45,
  frames: { a: frame(16, 45, (b) => bamboo(b, 0)), b: frame(16, 45, (b) => bamboo(b, 1)) },
  anims: { sway: { frames: ['a', 'b'], fps: 1.2 } },
});

// ---- Sensei Ume, the old gardener: a wide straw hat, a long white beard and a rake (18x22) -----
function sage(b: PixelBuffer, o: { bob: number; talk: boolean }) {
  const y = o.bob;
  // rake
  b.line(15, 2 + y, 15, 21, 1);
  b.rect(13, 1 + y, 5, 1, 2);
  for (const x of [13, 15, 17]) b.set(x, 2 + y, 2);
  // robe
  for (let j = 0; j < 9; j++) b.rect(5 - (j >> 2), 12 + j + y, 8 + (j >> 1), 1, j === 0 ? 2 : 1);
  b.rect(8, 12 + y, 1, 9, 2);
  b.rect(4, 21, 4, 1, 0);
  b.rect(10, 21, 4, 1, 0);
  // sleeve and hand on the rake
  b.rect(11, 14 + y, 4, 2, 2);
  b.set(14, 13 + y, 3);
  // face, eyes, beard
  b.rect(6, 7 + y, 6, 4, 3);
  b.set(7, 8 + y, 0);
  b.set(10, 8 + y, 0);
  b.rect(6, 10 + y, 6, 3, 3);
  b.rect(7, 13 + y, 4, 2, 3);
  b.set(8, 15 + y, 3);
  if (o.talk) b.rect(8, 10 + y, 2, 1, 0);
  // straw hat: a wide cone
  for (let j = 0; j < 5; j++) b.rect(8 - j * 2, 2 + j + y, 2 + j * 4, 1, j === 4 ? 1 : 2);
  b.rect(0, 7 + y, 18, 1, 1);
  b.set(9, 1 + y, 2);
  for (let x = 2; x < 16; x += 3) b.set(x, 6 + y, 3);
}
defineSheet('blossom-sage', {
  w: 18,
  h: 22,
  ox: 9,
  oy: 22,
  frames: {
    i1: frame(18, 22, (b) => sage(b, { bob: 0, talk: false })),
    i2: frame(18, 22, (b) => sage(b, { bob: 1, talk: false })),
    t1: frame(18, 22, (b) => sage(b, { bob: 0, talk: true })),
  },
  anims: {
    idle: { frames: ['i1', 'i1', 'i2', 'i2'], fps: 2 },
    talk: { frames: ['t1', 'i1'], fps: 6 },
  },
});
