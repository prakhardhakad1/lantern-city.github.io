/** Route test for Skyharbor Docks: npx tsx scripts/routes/skyharbor.ts */
import { loadWorldDef } from '../sim';
import { jump, section, summary, walk } from './kit';

const def = await loadWorldDef('skyharbor');

section('S2 floating hops');
jump(def, 'pier -> deck 1', [38, 30], [42, 46, 28]);
jump(def, 'deck 1 -> deck 2', [46, 28], [50, 54, 27]);
jump(def, 'deck 2 -> deck 3', [54, 27], [58, 63, 28]);
jump(def, 'deck 3 -> windward pier', [63, 28], [64, 89, 30]);

section('S3 windward pier');
walk(def, 'push through the headwind and over the crates', [68, 30], [{ t: 16, hold: ['right', 'jump'], tap: ['jump'], every: 0.5, until: (x, _y, g) => x >= 87 && g }], [87, 89, 30]);

section('S4 fan chasm');
walk(
  def,
  'drop into fan 1 and ride it up to the high dock',
  [89, 30],
  [
    { t: 0.35, hold: ['right'] },
    { t: 3.4 },
    { t: 0.6, hold: ['right'] },
  ],
  [97, 105, 17],
);
walk(
  def,
  'hop into fan 2 and ride it up to the top deck',
  [105, 17],
  [
    { t: 0.4, hold: ['right', 'jump'], tap: ['jump'] },
    { t: 3.6 },
    { t: 0.55, hold: ['right'] },
  ],
  [115, 122, 11],
);
jump(def, 'top deck -> airship deck', [122, 11], [124, 159, 22]);

section('S5 airship');
walk(def, 'spring up into the rigging', [155, 22], [{ t: 0.25, hold: ['right'] }, { t: 1.5 }], [157, 163, 18]);

section('S6 gondola run');
jump(def, 'rigging -> gondola deck A', [163, 18], [168, 171, 20]);
jump(def, 'deck A -> deck B', [171, 20], [176, 179, 18]);
jump(def, 'deck B -> lantern dock', [179, 18], [183, 198, 21]);

summary('skyharbor');
