import { MapBuilder } from '../../mapkit';

/**
 * Skyharbor: airship docks floating above a sea of clouds at sunset. Everything below the decks is
 * open sky: falling off is a pit.
 *
 *   S1 Arrival pier    (x 1-38)     station, Captain Gale
 *   S2 Floating hops   (x 39-63)    three small decks
 *   S3 Windward pier   (x 64-89)    checkpoint, a headwind in bursts, two crates to hop
 *   S4 The fan chasm   (x 90-122)   two great fans: ride their updrafts up to the high docks
 *   S5 The airship     (x 123-162)  checkpoint, a hound on deck, a locked cabin, a spring up the rigging
 *   S6 Gondola run     (x 163-198)  small decks to the lantern dock
 */
const m = new MapBuilder(200, 46);

/** A floating deck: 3 tiles thick, struts hanging underneath. */
function deck(x: number, top: number, w: number, struts = true) {
  m.block(x, top, w, 3);
  if (!struts) return;
  m.put(x + 1, top + 3, 'u');
  if (w > 6) m.put(x + w - 2, top + 3, 'u');
}

// ---- S1 arrival pier (floor row 30) ---------------------------------------------------------------
deck(1, 30, 38);
m.put(18, 33, 'u');
m.put(5, 29, 'T');
m.put(26, 29, 'g');
m.put(29, 29, 'N');
m.put(32, 29, '1');
m.put(34, 29, 'x');
m.put(35, 29, 'y');
m.put(37, 29, 'f');
m.put(2, 29, 'B');

// ---- S2 floating hops --------------------------------------------------------------------------
deck(42, 28, 5);
deck(50, 27, 5);
deck(58, 28, 6);
m.put(44, 27, 'z');
m.put(40, 25, 'o');
m.put(48, 24, 'o');
m.put(56, 24, 'o');
m.put(52, 26, 'c');
m.put(54, 20, 'w');

// ---- S3 windward pier (floor row 30): a headwind blows in bursts --------------------------------
deck(64, 30, 26);
m.put(67, 29, 'C');
m.put(69, 29, '2');
m.put(72, 29, 'g');
m.block(79, 28, 2, 2);
m.block(85, 28, 2, 2);
m.field(71, 22, 18, 8, '{');
m.put(82, 22, 'd');
m.row(76, 25, 3, 5, 'o');
m.put(88, 29, 'f');

// ---- S4 the fan chasm: two updraft columns up to the high docks ------------------------------------
m.block(91, 41, 6, 3);
m.put(93, 40, 'F');
m.field(92, 14, 4, 27, 'W');
m.col(94, 34, 4, -5, 'o');
deck(97, 17, 9);
m.put(99, 16, 'C');
m.put(102, 16, '3');
m.put(104, 16, 'y');
m.block(108, 41, 6, 3);
m.put(110, 40, 'F');
m.field(109, 8, 4, 33, 'W');
m.col(111, 32, 4, -6, 'o');
deck(115, 11, 8);
m.put(118, 10, 'B');
m.put(121, 10, 'f');

// ---- S5 the airship (deck row 22) ---------------------------------------------------------------
m.block(124, 22, 36, 4);
m.block(126, 26, 32, 1);
m.block(129, 27, 26, 1);
m.put(127, 21, 'C');
m.put(130, 21, 'x');
m.put(138, 21, 'M');
m.put(136, 21, 'b');
// the captain's cabin, locked: three good strikes on its door
m.block(146, 17, 9, 5);
m.air(147, 18, 7, 4);
m.fill(146, 20, 1, 2, 'X');
m.put(152, 21, 'H');
m.put(149, 21, 'o');
m.put(150, 21, 'o');
m.put(150, 16, 'z');
// a spring up into the rigging
m.put(157, 21, 'J');
m.fill(157, 18, 7, 1, '=');
m.put(160, 14, 'o');

// ---- S6 gondola run to the lantern dock (floor row 21) ---------------------------------------------
deck(168, 20, 4);
m.put(166, 16, 'o');
deck(176, 18, 4);
m.put(174, 14, 'o');
m.put(178, 12, 'w');
deck(183, 21, 16);
m.put(186, 20, '4');
m.put(188, 20, 'n');
m.put(188, 11, ';');
m.put(189, 9, 'o');
m.put(190, 9, 'o');
m.put(193, 20, 'E');
m.put(197, 20, 'f');
m.put(184, 20, 'y');

m.put(3, 0, '!');

export const SKYHARBOR_MAP: string[] = m.rows();
