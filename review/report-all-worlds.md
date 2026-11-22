# All-worlds visual upgrade: report

Self-rated (QA and Reviewer bots could not start: host had about 2.1 GB free, a bot needs 2.65-3 GB).
Scale 1-10, 5 = average indie pixel game.

| Part | Before | After |
|---|---|---|
| Title screen | 3 | 6.5 |
| Mossgate Outskirts | 4 | 6.5 |
| The Underworks | 4.5 | 6 |
| Frostbell courtyard | 3.5 | 6.5 |
| Frostbell tower inside | 4.5 | 5 |
| Gloomroot Catacombs | 4.5 | 5 |
| Ember Foundry | 4.5 | 6.5 |
| Train ride | 4 | 5.5 |
| HUD | 4 | 5 |
| Overall | 4 | 6 |

## What changed (all visual only)
- Gradient sky in every world, title and train (engine/fx.ts, game/look.ts).
- New middle parallax layer per world: ruined city + trees, cistern arches + pipes, snowy pine forest, crypt pillars, smokestacks (art/silhouettes.ts, content/looks.ts).
- Depth haze between parallax layers.
- Soft additive bloom around every light and the avatar.
- Ambient life: fireflies, leaves, moon shafts, fog (Outskirts); light shafts, bubbles, drips, fog (Underworks); aurora, shafts (Frostbell); wisps, bat flocks (Catacombs); glowing sparks, molten floor glow (Foundry).
- Colour grade + vignette per world.
- Title: walking twig, hanging lanterns, logo light sweep, menu panel, world card with palette.
- Train: middle layer, window glow, telegraph poles.
- HUD: dark plate behind hearts, glowing soul icon.
- Frostbell courtyard scenery from the earlier task; now on its own random stream.

## Gameplay check
- scripts/parity-all.ts: 78 runs (every spawn point and checkpoint in 5 worlds x 3 input scripts, 8 s each),
  enemies on, Math.random seeded. Player path and enemy/platform positions hash identically before and after.
- scripts/smoke.ts: all 5 worlds OK.
- Draw cost (node canvas): +1 to +3.6 ms per frame; worst 6.6 ms (Frostbell). Not checked in a real browser.

## Weak spots (honest)
- Catacombs and tower interiors changed only a little: the darkness and back walls cover most new art.
- Smooth gradients/bloom mix with the 4-colour pixel look; some may prefer pure pixel art.
- No new sprites or animation frames for characters or enemies outside Frostbell.
- Not run in a real browser; only headless.
