import type { WorldDef } from '../../../game/registry';
import '../../extras';
import { blossomLook, blossomMid, blossomPalette, withMid } from '../../looks';
import { blossomBackdrop } from './backdrop';
import './entities';
import { BLOSSOM_MAP } from './map';
import { blossomStyle } from './tiles';

const decor = (sheet: string, extra: Record<string, unknown> = {}) => ({ kind: 'decor', sheet, ...extra });

const world: WorldDef = {
  id: 'blossom',
  name: 'Blossom Terrace',
  station: 'BLOSSOM',
  order: 6,
  palette: blossomPalette,
  tiles: blossomStyle,
  backdrop: withMid(blossomBackdrop, blossomMid),
  look: blossomLook,
  unlocks: 'skyharbor',
  // a bright music box in E major pentatonic: koto-like plucks over a soft walking bass
  music: {
    bpm: 92,
    root: 64,
    scale: [0, 2, 4, 7, 9, 12, 14],
    bars: [0, 3, 4, 2],
    melody: ['4.3.2...0.2.3...', '2...3.4.5...4...', '5.4.3.2.3...2...', '0...2.3.2...0...'],
    lead: 'sine',
    bass: 'triangle',
    sparkle: 0.12,
    drums: 'soft',
  },
  map: BLOSSOM_MAP,
  legend: {
    '!': 'extras:cleanup',
    // ---- creatures (old friends in spring colours) --------------------------------------------
    b: 'outskirts:hound',
    r: 'outskirts:beetle',
    c: 'outskirts:crow',
    w: 'outskirts:wisp',
    k: 'blossom:koi',
    f: 'blossom:butterflies',
    // ---- folk ----------------------------------------------------------------------------------
    N: {
      kind: 'npc',
      sheet: 'blossom-sage',
      name: 'SENSEI UME',
      talk: 'talk',
      lines: [
        'AH, A LITTLE LANTERN-BEARER. THE TREES TOLD ME YOU WERE COMING. THEY GOSSIP, YOU KNOW.',
        'FOR A HUNDRED SPRINGS THESE GARDENS GLOWED ALL NIGHT. THEN THE SHRINE LANTERN WENT OUT, AND THE PETALS STOPPED FALLING.',
        'CROSS THE KOI PONDS, CLIMB THE BAMBOO, MIND THE OLD ROOFS. THE SHRINE IS UP ON THE CLIFF.',
        'IF YOU FALL IN A POND, JUST SWIM. THE KOI ARE FRIENDLY. MOSTLY.',
      ],
      alt: [{ flag: 'goal:blossom', lines: ['THE PETALS FALL AGAIN. LISTEN... EVEN THE BAMBOO IS SINGING. THE SKYHARBOR LINE IS OPEN, LITTLE ONE.'] }],
    },
    // ---- decor ---------------------------------------------------------------------------------
    l: decor('blossom-lantern', { light: 34, halo: 10, glow: 11 }),
    B: decor('blossom-tree', { back: true }),
    g: decor('blossom-torii', { back: true }),
    s: decor('blossom-bamboo', { layer: 'terrain' }),
    q: decor('outskirts-lily', { anim: 'a', layer: 'terrain' }),
    p: decor('outskirts-lily', { anim: 'b', layer: 'terrain' }),
    y: decor('outskirts-reeds', { layer: 'terrain' }),
    h: decor('outskirts-bench'),
    e: decor('outskirts-fern', { layer: 'terrain' }),
    // ---- signs ---------------------------------------------------------------------------------
    '1': { kind: 'sign', text: ['BLOSSOM TERRACE STATION.', 'PLEASE DO NOT FEED THE KOI YOUR STICK.'] },
    '2': { kind: 'sign', text: ['BAMBOO POLES: JUMP UP THROUGH THEM.', 'THE SPRING BY THE LANTERN THROWS YOU HIGH.'] },
    '3': { kind: 'sign', text: ['STAND IN THE FOUNTAIN SPRAY TO FLOAT UP.', 'THE TEA ROOM BELOW THE CLIFF IS CLOSED. PROBABLY.'] },
    '4': { kind: 'sign', text: ['THE SHRINE IS ACROSS THE GAP.', 'DASH, DOUBLE JUMP, OR RIDE THE DRIFTING STONE.'] },
  },
};

export default world;
