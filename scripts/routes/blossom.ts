/** Route test for Blossom Terrace: npx tsx scripts/routes/blossom.ts */
import { loadWorldDef } from '../sim';
import { jump, section, summary, walk } from './kit';

const def = await loadWorldDef('blossom');

section('S2 koi ponds');
jump(def, 'plaza -> stone A1', [40, 30], [44, 46, 30]);
jump(def, 'stone A1 -> A2', [46, 30], [49, 51, 30]);
jump(def, 'stone A2 -> islet', [51, 30], [55, 62, 30]);
jump(def, 'islet -> stone B1', [62, 30], [66, 69, 29]);
jump(def, 'B1 -> B2', [69, 29], [72, 74, 28]);
jump(def, 'B2 -> B3', [74, 28], [77, 80, 29]);
jump(def, 'B3 -> grove shore', [80, 29], [81, 104, 30]);
walk(def, 'fell in pond A: swim out onto a stone', [48, 34], [{ t: 0.9, hold: ['right', 'jump'], tap: ['jump'], every: 0.3 }], [49, 62, 30]);

section('S3 bamboo grove');
jump(def, 'grove -> bamboo poles', [97, 30], [100, 103, 28]);
jump(def, 'poles -> high terrace', [103, 28], [105, 122, 26]);

section('S4 pagoda roofs');
jump(def, 'terrace -> roof 1', [122, 26], [127, 135, 25]);
jump(def, 'roof 1 -> roof 2', [135, 25], [140, 153, 23]);
jump(def, 'roof 2 -> over the crumbling bridge -> roof 3', [153, 23], [158, 165, 23]);
walk(def, 'run straight across the crumbling bridge', [150, 23], [{ t: 1.2, hold: ['right'] }], [158, 165, 23]);
jump(def, 'roof 3 -> fountain garden', [165, 23], [166, 177, 30]);

section('S5 fountain garden');
walk(
  def,
  'ride the fountain spray up the cliff',
  [173, 30],
  [
    { t: 0.22, hold: ['right'] },
    { t: 2.6 },
    { t: 0.5, hold: ['right'] },
  ],
  [178, 190, 17],
);

section('S6 shrine terrace');
jump(def, 'cliff -> lantern terrace (wings or dash)', [190, 17], [198, 210, 17], 'any');

summary('blossom');
