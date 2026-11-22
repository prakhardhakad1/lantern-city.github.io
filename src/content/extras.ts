import { Enemy } from '../game/enemy';
import { Entity } from '../game/entity';
import { registerEntity } from '../game/registry';
import type { World } from '../game/world';

/**
 * Housekeeping for the sky and rooftop worlds: a creature knocked into a bottomless pit is gone
 * for good, so stop simulating it once it has fallen well below the map. Place one '!' per map.
 */
class PitCleanup extends Entity {
  constructor(world: World) {
    super(world, 0, 0, 1, 1);
  }

  update() {
    const floor = this.world.map.ph + 64;
    for (const e of this.world.entities) if (e instanceof Enemy && e.y > floor) e.removed = true;
  }
}

registerEntity('extras:cleanup', (w) => new PitCleanup(w));
