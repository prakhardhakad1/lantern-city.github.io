import { MapBuilder } from '../../mapkit';

/**
 * Neon Bazaar: a night market in the rain, the last line on the Spirit Rail.
 *
 *   S1 Station        (x 1-34)     Mira the merchant
 *   S2 Market lane    (x 35-80)    sludge gutters, rats, then a canal crossed on awnings
 *   S3 Rooftops       (x 81-160)   checkpoint, balconies up a tower, four roofs over the sludge canal
 *   S4 Neon arcade    (x 161-210)  checkpoint, a hound, the last canal, the city's final lantern
 *
 * '%' is glowing sludge: it hurts like spikes.
 */
const m = new MapBuilder(212, 40);

/** A gutter of sludge cut into the street: open at row `top`, sludge below it. */
function gutter(x: number, w: number, top = 30, depth = 3) {
  m.air(x, top, w, depth);
  m.fill(x, top + 1, w, depth - 1, '%');
}

// ---- S1 station (floor row 30) -------------------------------------------------------------------
m.ground(1, 34, 30);
m.put(5, 29, 'T');
m.put(26, 29, 'V');
m.put(29, 29, 'N');
m.put(32, 29, '1');
m.put(2, 29, 'p');

// ---- S2 market lane ---------------------------------------------------------------------------------
m.ground(35, 62, 30);
m.put(39, 29, 'S');
m.fill(36, 26, 7, 1, '=');
m.put(39, 27, 'a');
gutter(44, 3);
m.put(45, 27, 'o');
m.put(51, 29, 'r');
m.put(53, 29, 'q');
gutter(55, 3);
m.put(56, 27, 'o');
m.put(61, 29, 'k');
// the canal: hop across on the awnings
m.ground(63, 80, 34);
m.field(63, 31, 18, 3, '%');
m.air(63, 30, 18, 1);
m.fill(63, 28, 4, 1, '=');
m.fill(69, 28, 4, 1, '=');
m.fill(75, 28, 4, 1, '=');
m.put(65, 29, 'a');
m.put(71, 29, 'a');
m.put(77, 29, 'a');
m.row(68, 24, 3, 6, 'o');
m.put(72, 21, 'd');

// ---- S3 rooftops ----------------------------------------------------------------------------------------
m.ground(81, 98, 30);
m.put(83, 29, 'C');
m.put(86, 29, '2');
m.put(90, 29, 'S');
// tower A, with balconies up its west face
m.ground(99, 116, 18);
m.fill(95, 27, 4, 1, '=');
m.fill(95, 24, 4, 1, '=');
m.fill(95, 21, 4, 1, '=');
m.put(104, 23, 'g');
m.put(111, 26, 'h');
m.put(108, 17, 'i');
m.put(114, 17, 'V');
m.col(97, 23, 3, -3, 'o');
// the sludge canal under the rooftops
m.ground(117, 160, 35);
m.ground(121, 132, 20);
m.ground(137, 146, 17);
m.ground(151, 160, 17);
m.field(117, 32, 44, 3, '%');
m.put(123, 19, 'C');
m.put(126, 25, 'j');
m.put(130, 19, 'p');
m.put(119, 16, 'o');
m.put(134, 14, 'o');
m.put(142, 12, 'd');
m.put(141, 21, 'g');
m.fill(147, 17, 4, 1, 'K');
m.put(148, 14, 'o');
m.put(155, 16, 'V');
// secret: a boarded-up door at the foot of tower D, opening onto the arcade street
m.fill(160, 28, 1, 2, 'X');
m.air(155, 27, 5, 3);
m.put(157, 29, 'H');
m.put(156, 29, 'o');
m.put(158, 29, 'o');

// ---- S4 neon arcade (floor row 30) -------------------------------------------------------------------
m.ground(161, 210, 30);
m.put(163, 29, 'C');
m.put(166, 29, '3');
m.put(170, 29, 'k');
m.put(174, 29, 'b');
m.put(179, 29, 'q');
// the last canal, with an island and an awning
gutter(182, 13);
m.block(186, 30, 3, 3);
m.fill(190, 28, 3, 1, '=');
m.put(191, 29, 'a');
m.put(184, 26, 'o');
m.put(191, 24, 'o');
m.put(198, 22, 'd');
m.put(197, 29, 'S');
m.put(201, 29, 'p');
m.put(204, 29, 'E');
m.put(208, 29, 'V');

m.put(3, 0, '!');

export const BAZAAR_MAP: string[] = m.rows();
