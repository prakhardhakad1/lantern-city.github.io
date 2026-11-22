import type { WorldDef } from '../../../game/registry';
import '../../extras';
import { skyharborLook, skyharborMid, skyharborPalette, withMid } from '../../looks';
import { skyBackdrop } from './backdrop';
import { SKYHARBOR_MAP } from './map';
import './sprites';
import { skyStyle } from './tiles';

const decor = (sheet: string, extra: Record<string, unknown> = {}) => ({ kind: 'decor', sheet, ...extra });

const world: WorldDef = {
  id: 'skyharbor',
  name: 'Skyharbor Docks',
  station: 'SKYHARBOR',
  order: 7,
  palette: skyharborPalette,
  tiles: skyStyle,
  backdrop: withMid(skyBackdrop, skyharborMid, 0.16),
  look: skyharborLook,
  unlocks: 'bazaar',
  // a breezy sea shanty in G mixolydian, with a bouncing bass
  music: {
    bpm: 118,
    root: 55,
    scale: [0, 2, 4, 5, 7, 9, 10],
    bars: [0, 3, 6, 4, 0, 3, 4, 0],
    melody: ['4.4.5.4.2...0...', '2.2.4.2.0.......', '4...5.6.7...6.4.', '5.4.2...4.......', '7.7.6.5.4...2...', '4.5.6...4.2.....', '2.4.5.4.2...1...', '0...2...0.......'],
    lead: 'square',
    bass: 'triangle',
    sparkle: 0.05,
    drums: 'soft',
  },
  map: SKYHARBOR_MAP,
  legend: {
    '!': 'extras:cleanup',
    // ---- creatures ---------------------------------------------------------------------------
    c: 'outskirts:crow',
    w: 'outskirts:wisp',
    d: 'foundry:drone',
    b: 'outskirts:hound',
    // ---- wind: '{' blows west in bursts (the same gusts as the Frostbell crown) -------------------
    '{': { kind: 'frostbell:gust', dir: -1, offset: 0.6, force: 60 },
    // ---- folk --------------------------------------------------------------------------------
    N: {
      kind: 'npc',
      sheet: 'skyharbor-captain',
      name: 'CAPTAIN GALE',
      talk: 'talk',
      lines: [
        'WELCOME ABOARD, SPARK! SKYHARBOR: THE HIGHEST DOCKS IN THE CITY. ALSO THE WINDIEST.',
        'WHEN THE HARBOR LANTERN WENT DARK, EVERY SHIP LOST ITS WAY HOME. MINE INCLUDED.',
        'THE BIG FANS IN THE CHASM STILL TURN. STEP INTO THE UPDRAFT AND LET IT CARRY YOU.',
        "AND IF YOU FIND MY CABIN KEY... NO WAIT, JUST HIT THE DOOR. IT'S AN OLD DOOR.",
      ],
      alt: [{ flag: 'goal:skyharbor', lines: ['LOOK AT THEM COME! EVERY SHIP IN THE SKY IS HEADING HOME. THE BAZAAR LINE IS OPEN, SPARK!'] }],
    },
    // ---- decor -------------------------------------------------------------------------------
    u: decor('skyharbor-strut', { anchor: 'ceiling', back: true }),
    g: decor('skyharbor-balloon', { back: true }),
    x: decor('skyharbor-cargo', { anim: 'crate' }),
    y: decor('skyharbor-cargo', { anim: 'barrel' }),
    z: decor('skyharbor-cargo', { anim: 'sacks' }),
    f: decor('skyharbor-flag'),
    B: decor('skyharbor-windsock'),
    F: decor('skyharbor-fan', { light: 30, halo: 10 }),
    M: decor('skyharbor-mast', { back: true }),
    // ---- signs -------------------------------------------------------------------------------
    '1': { kind: 'sign', text: ['SKYHARBOR DOCKS.', 'MIND THE EDGE: CLOUDS DO NOT HOLD YOU UP.'] },
    '2': { kind: 'sign', text: ['HEADWIND IN BURSTS.', 'WHEN THE STREAKS START, LEAN IN OR WAIT FOR THE CALM.'] },
    '3': { kind: 'sign', text: ['FAN NUMBER TWO IS ACROSS THE GAP.', 'DROP IN, LET GO OF THE STICK, AND RIDE IT UP.'] },
    '4': { kind: 'sign', text: ['HARBOR LANTERN AHEAD.', 'THE CARGO LIFT GOES UP. THE VIEW IS WORTH IT.'] },
  },
};

export default world;
