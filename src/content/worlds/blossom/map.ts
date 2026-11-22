import { MapBuilder } from '../../mapkit';

/**
 * Blossom Terrace: temple gardens on a hillside in spring.
 *
 *   S1 Station plaza   (x 1-40)     arrival, Sensei Ume, stone lanterns
 *   S2 Koi ponds       (x 41-80)    stepping stones over two ponds (falling in = a swim, not a death)
 *   S3 Bamboo grove    (x 81-124)   checkpoint, beetle, bamboo poles up to the high terrace
 *   S4 Pagoda roofs    (x 123-165)  three rooftops over the ravine, a hound, a crumbling bridge
 *   S5 Fountain garden (x 166-177)  checkpoint, the fountain spray lifts you up the cliff; hidden heart
 *   S6 Shrine terrace  (x 178-210)  a wide gap (dash / double jump, or the drifting stone), the lantern
 */
const m = new MapBuilder(212, 40);

// ---- S1 station plaza (floor row 30) ----------------------------------------------------------
m.ground(1, 40, 30);
m.put(5, 29, 'T');
m.put(26, 29, 'l');
m.put(29, 29, 'N');
m.put(32, 29, '1');
m.put(36, 29, 'B');
m.put(39, 29, 'l');
m.put(2, 29, 's');

// ---- S2 koi ponds ---------------------------------------------------------------------------
// pond A: two flat stepping stones flush with the plaza
m.ground(41, 54, 34);
m.field(41, 31, 14, 3, '~');
m.block(44, 30, 3, 4);
m.block(49, 30, 3, 4);
// the islet between the ponds
m.ground(55, 62, 30);
m.put(58, 29, 'c');
m.put(61, 29, 'l');
// pond B: stones that rise and fall
m.ground(63, 80, 34);
m.field(63, 31, 18, 3, '~');
m.block(66, 29, 4, 5);
m.block(72, 28, 3, 6);
m.block(77, 29, 4, 5);
for (const [x, ch] of [
  [42, 'q'],
  [48, 'p'],
  [64, 'q'],
  [71, 'p'],
  [76, 'q'],
] as const)
  m.put(x, 30, ch);
m.put(53, 30, 'y');
m.put(64, 30, 'y');
m.put(47, 32, 'k');
m.put(70, 32, 'k');
m.put(75, 32, 'k');
m.put(47, 27, 'o');
m.put(53, 27, 'o');
m.put(70, 25, 'o');
m.put(75, 24, 'o');
m.put(80, 25, 'o');
m.put(73, 21, 'w');

// ---- S3 bamboo grove (floor row 30), then bamboo poles up to the high terrace (row 24) -------
m.ground(81, 104, 30);
m.put(84, 29, 'C');
m.put(88, 29, '2');
m.put(86, 29, 'J');
m.put(86, 25, 'o');
m.put(86, 22, 'o');
m.put(91, 29, 's');
m.put(97, 29, 'r');
m.put(100, 26, 'f');
m.put(98, 29, 's');
m.fill(100, 28, 4, 1, '=');
m.ground(105, 122, 26);
m.put(109, 25, 'l');
m.put(112, 25, 'h');
m.put(116, 25, 'B');
m.put(120, 25, 'e');
m.row(110, 22, 4, 3, 'o');

// ---- S4 pagoda roofs over the ravine (pits fall out of the map) --------------------------------
m.ground(127, 135, 25);
m.put(130, 24, 'l');
m.put(125, 22, 'o');
m.ground(140, 153, 23);
m.put(138, 20, 'o');
m.put(146, 22, 'b');
m.put(152, 22, 'C');
m.fill(154, 23, 4, 1, 'K');
m.put(155, 20, 'o');
m.ground(158, 165, 23);
m.put(161, 22, 'l');

// ---- S5 fountain garden (floor row 30) ----------------------------------------------------------
m.ground(166, 177, 30);
m.put(168, 29, 'C');
m.put(171, 29, '3');
m.put(173, 29, 'l');
m.put(167, 25, 'f');
m.field(175, 11, 2, 19, 'W');
m.put(171, 22, 'w');
m.put(175, 23, 'o');
m.put(176, 19, 'o');
m.put(175, 15, 'o');

// ---- S6 the cliff and the shrine terrace (floor row 17) ----------------------------------------
m.ground(178, 190, 17);
// secret: a cracked stone at the foot of the cliff hides a tea room
m.fill(178, 27, 2, 3, 'X');
m.air(180, 26, 5, 4);
m.put(183, 29, 'H');
m.put(181, 29, 'o');
m.put(182, 29, 'o');
m.put(181, 16, 'B');
m.put(185, 16, 'g');
m.put(189, 16, '4');
// the drifting stone over the last gap
m.put(191, 17, 'm');
m.put(196, 17, ';');
m.put(194, 13, 'o');
m.put(195, 13, 'o');
m.ground(198, 210, 17);
m.put(200, 16, 'l');
m.put(204, 16, 'E');
m.put(208, 16, 'l');

m.put(3, 0, '!');

export const BLOSSOM_MAP: string[] = m.rows();
