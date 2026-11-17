# Frostbell courtyard: self-review (Kiro, acting as QA + Reviewer)

The QA and Reviewer bots could not start (host free memory 1.4-2.1 GB, bots need 3.0 GB). Two runs timed out
and a third is still queued. This review was done by the same agent that built the work, so scores lean kind.
If a bot report arrives it will be in `qa.md` next to this file.

Scale: 1-10, 5 = average indie pixel game.

| Area | v0 before | v1 | v2 |
|---|---|---|---|
| Trees / nature | 1 | 5 | 6 |
| City scenery | 2 | 6 | 6 |
| Ambient animals | 1 | 5 | 6 |
| Ambient humans | 1 | 5 | 5 |
| Environmental animation | 3 | 6 | 7 |
| Character animation | 6 | 6 | 7 |
| Hurdle animation | 5 | 6 | 6 |
| Readability of gameplay | 8 | 6 | 7 |
| Overall | 3.5 | 6 | 6.5 |

## Measured facts
- Gameplay parity: 18 scripted runs (6 start spots x 3 input scripts, 8 s each). Player path hashes identical for v0, v1 and v2.
- Draw cost per frame, node canvas, courtyard: v0 2.6 ms, v1 17.1 ms (6,228 rect calls), v2 3.7 ms (487 rect calls).
- v1 was too heavy for 60 fps. v2 caches the village and tree sway poses into canvases.

## v1 problems found (fixed in v2)
1. Frame cost 6.6x the original (see above).
2. Tall pine sat right behind the statue and Hoot: clutter. Moved to the pond (x 332).
3. Pond skater was dark and hard to see. Coat is now bright.
4. Six pines made the village hard to read. Reduced to three pines and two birches.
5. Large lamp halos looked like blobs. Radius cut from 9 to 4.

## Still weak in v2 (honest)
- People and animals are tiny (5-11 px) with 2-frame animation. Fine as background, weak as "polished".
- Scarf on the avatar is 4 pixels. Not checked at pixel level for every pose or avatar topper.
- Hurdle polish covers bells, ice gates and icicles only. Gear platforms, spikes, crumbling blocks, springs, gusts untouched.
- Only the courtyard is done. The rest of the tower is unchanged.
- Never run in a real browser. Only the headless node canvas. Real 60 fps is unverified.
- Clips are scripted bot runs, not a human playthrough.
