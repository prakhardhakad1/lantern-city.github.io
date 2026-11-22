import type { WorldDef } from '../../../game/registry';
import '../../extras';
import { bazaarLook, bazaarMid, bazaarPalette, withMid } from '../../looks';
import { bazaarBackdrop } from './backdrop';
import { BAZAAR_MAP } from './map';
import './sprites';
import { bazaarStyle } from './tiles';

const decor = (sheet: string, extra: Record<string, unknown> = {}) => ({ kind: 'decor', sheet, ...extra });

const world: WorldDef = {
  id: 'bazaar',
  name: 'Neon Bazaar',
  station: 'BAZAAR',
  order: 8,
  palette: bazaarPalette,
  tiles: bazaarStyle,
  backdrop: withMid(bazaarBackdrop, bazaarMid, 0.18),
  look: bazaarLook,
  // the last line: relighting this lantern rolls the ending again, with every sector lit
  // a late-night groove in A dorian with a driving beat
  music: {
    bpm: 104,
    root: 57,
    scale: [0, 2, 3, 5, 7, 9, 10],
    bars: [0, 3, 0, 4, 5, 3, 6, 4],
    melody: ['0.2.3...4.3.2...', '3...5.4.3.......', '0.2.3...7.6.4...', '4.3.2.0.........', '5.5.4.3.4...2...', '3...4.5.6.......', '7.6.5.4.3.2.3...', '2...0...........'],
    lead: 'square',
    bass: 'sawtooth',
    sparkle: 0.08,
    drums: 'driving',
  },
  map: BAZAAR_MAP,
  legend: {
    '!': 'extras:cleanup',
    // ---- creatures --------------------------------------------------------------------------
    r: 'underworks:rat',
    i: 'foundry:imp',
    d: 'foundry:drone',
    b: 'outskirts:hound',
    // ---- folk -------------------------------------------------------------------------------
    N: {
      kind: 'npc',
      sheet: 'bazaar-merchant',
      name: 'MIRA',
      talk: 'talk',
      lines: [
        'OH! A CUSTOMER! WELCOME TO THE NEON BAZAAR. EVERYTHING IS FOR SALE, EXCEPT MY HAT.',
        'THE BAZAAR NEVER SLEEPS. BUT SINCE THE MARKET LANTERN WENT OUT, THE SIGNS KEEP FLICKERING. BAD FOR BUSINESS.',
        'DO NOT STEP IN THE GLOWING SLUDGE. TRUST ME. HOP THE AWNINGS, CLIMB THE BALCONIES, RUN THE ROOFTOPS.',
        'THE LANTERN IS AT THE END OF THE ARCADE. THE LAST DARK LANTERN IN THE WHOLE CITY, THEY SAY.',
      ],
      alt: [{ flag: 'goal:bazaar', lines: ['EVERY SIGN IS BURNING BRIGHT! YOU LIT THE WHOLE CITY, LITTLE SPARK. FIRST BOWL OF NOODLES IS ON ME.'] }],
    },
    // ---- decor: neon in the street's colours, lanterns in warm gold -------------------------
    g: decor('bazaar-neon', { anim: 'fish', anchor: 'center', layer: 'terrain', light: 34 }),
    h: decor('bazaar-neon', { anim: 'star', anchor: 'center', layer: 'terrain', light: 34 }),
    j: decor('bazaar-neon', { anim: 'noodle', anchor: 'center', layer: 'terrain', light: 34 }),
    p: decor('bazaar-signpost', { anim: 'noodle', layer: 'terrain', light: 34, glow: 24 }),
    q: decor('bazaar-signpost', { anim: 'tea', layer: 'terrain', light: 34, glow: 24 }),
    S: decor('bazaar-stall', { back: true }),
    a: decor('bazaar-lanterns', { anchor: 'ceiling', light: 30, halo: 10, glow: 6 }),
    k: decor('bazaar-cart', { light: 26, glow: 16 }),
    V: decor('bazaar-vending', { layer: 'terrain', light: 28, glow: 10 }),
    // ---- signs ------------------------------------------------------------------------------
    '1': { kind: 'sign', text: ['NEON BAZAAR STATION.', 'OPEN ALL NIGHT. MIND THE SLUDGE.'] },
    '2': { kind: 'sign', text: ['ROOFTOP ROUTE: UP THE BALCONIES.', 'THE CRATES ON THE ROOF ARE OLD. RUN, DO NOT STOP.'] },
    '3': { kind: 'sign', text: ['ARCADE STREET.', 'MARKET LANTERN AHEAD, PAST THE LAST CANAL.'] },
  },
};

export default world;
