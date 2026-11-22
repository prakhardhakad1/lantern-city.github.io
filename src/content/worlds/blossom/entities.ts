import { hash2 } from '../../../engine/math';
import type { Renderer } from '../../../engine/renderer';
import { Entity } from '../../../game/entity';
import { registerEntity } from '../../../game/registry';
import type { World } from '../../../game/world';
import './sprites';

/** Decorative life for Blossom Terrace. No hitboxes, no randomness: pure drawing. */

/** A koi gliding back and forth under the pond surface, turning lazily at each end. */
class Koi extends Entity {
  private phase: number;
  private range: number;

  constructor(world: World, x: number, y: number) {
    super(world, x + 4, y + 4, 1, 1);
    this.depth = -8;
    this.phase = hash2(x, y, 3) * 10;
    this.range = 14 + Math.floor(hash2(x, y, 4) * 14);
  }

  draw(r: Renderer) {
    const t = this.world.time * 0.35 + this.phase;
    const x = this.x + Math.sin(t) * this.range;
    const dir = Math.cos(t) > 0 ? 1 : -1;
    const y = this.y + Math.round(Math.sin(t * 2.3) * 1.2);
    const tail = Math.floor(this.world.time * 6 + this.phase) % 2;
    r.rect(x - 3, y, 6, 2, 3);
    r.rect(x - 1, y, 2, 1, 2);
    r.rect(x + dir * 2, y, 1, 1, 2);
    r.rect(x - dir * 4, y - tail, 1, 2, 3);
    r.rect(x - dir * 5, y + tail - 1, 1, 2, 2);
  }
}

/** A few butterflies fluttering around a flower bed. */
class Butterflies extends Entity {
  constructor(world: World, x: number, y: number) {
    super(world, x + 4, y + 4, 1, 1);
    this.depth = 6;
  }

  draw(r: Renderer) {
    const t = this.world.time;
    for (let i = 0; i < 3; i++) {
      const ph = i * 2.1 + this.x * 0.01;
      const x = this.x + Math.sin(t * 0.9 + ph) * 18 + Math.sin(t * 2.3 + ph * 2) * 4;
      const y = this.y + Math.cos(t * 0.7 + ph) * 8 - Math.abs(Math.sin(t * 3 + ph)) * 3;
      const open = Math.floor(t * 12 + i) % 2 === 0;
      r.rect(x, y, 1, 2, 1);
      if (open) {
        r.rect(x - 2, y - 1, 2, 2, i === 1 ? 2 : 3);
        r.rect(x + 1, y - 1, 2, 2, i === 1 ? 2 : 3);
      } else {
        r.rect(x - 1, y - 1, 1, 2, 3);
        r.rect(x + 1, y - 1, 1, 2, 3);
      }
    }
  }
}

registerEntity('blossom:koi', (w, x, y) => new Koi(w, x, y));
registerEntity('blossom:butterflies', (w, x, y) => new Butterflies(w, x, y));
