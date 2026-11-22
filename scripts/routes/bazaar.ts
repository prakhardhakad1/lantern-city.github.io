/** Route test for the Neon Bazaar: npx tsx scripts/routes/bazaar.ts */
import { loadWorldDef } from '../sim';
import { jump, section, summary, walk } from './kit';

const def = await loadWorldDef('bazaar');

section('S2 market lane');
jump(def, 'over gutter 1', [43, 30], [47, 54, 30]);
jump(def, 'over gutter 2', [54, 30], [58, 62, 30]);
jump(def, 'street -> canal awning 1', [62, 30], [63, 66, 28]);
jump(def, 'awning 1 -> 2', [66, 28], [69, 72, 28]);
jump(def, 'awning 2 -> 3', [72, 28], [75, 78, 28]);
jump(def, 'awning 3 -> street', [78, 28], [81, 98, 30]);

section('S3 rooftops');
jump(def, 'street -> balcony 1', [93, 30], [95, 98, 27]);
jump(def, 'balcony 1 -> 2', [96, 27], [95, 98, 24]);
jump(def, 'balcony 2 -> 3', [96, 24], [95, 98, 21]);
jump(def, 'balcony 3 -> roof A', [97, 21], [99, 116, 18]);
jump(def, 'roof A -> roof B', [116, 18], [121, 132, 20]);
jump(def, 'roof B -> roof C (wings help)', [132, 20], [137, 146, 17], 'dj');
walk(def, 'run over the old crates to roof D', [143, 17], [{ t: 1.1, hold: ['right'] }], [151, 160, 17]);
jump(def, 'roof D -> arcade street', [160, 17], [161, 181, 30]);

section('S4 neon arcade');
jump(def, 'street -> canal island', [181, 30], [186, 188, 30]);
jump(def, 'island -> awning', [188, 30], [190, 192, 28]);
jump(def, 'awning -> lantern street', [192, 28], [195, 209, 30]);
jump(def, 'island -> lantern street direct (wings or dash)', [188, 30], [195, 209, 30], 'any');

summary('bazaar');
