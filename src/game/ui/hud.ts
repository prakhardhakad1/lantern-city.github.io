import { glow, rgba } from '../../engine/fx';
import type { Renderer } from '../../engine/renderer';
import type { Profile } from '../profile';

/** Wooden hearts and the soul counter, top-left, on a soft dark plate so they read over any art. */
export function drawHud(r: Renderer, p: Profile, time: number) {
  r.screen();
  const ctx = r.ctx;
  const w = 8 + p.maxHp * 8 + 2;
  ctx.save();
  ctx.fillStyle = rgba(r.palette[0], 0.5);
  ctx.fillRect(3, 3, w, 21);
  ctx.fillStyle = rgba(r.palette[0], 0.3);
  ctx.fillRect(2, 4, 1, 19);
  ctx.fillRect(3 + w, 4, 1, 19);
  ctx.restore();
  for (let i = 0; i < p.maxHp; i++) {
    const full = i < p.hp;
    const beat = full && i === p.hp - 1 && p.hp <= 2 && Math.floor(time * 4) % 2 === 0 ? -1 : 0;
    r.sprite('hud', full ? 'full' : 'empty', 6 + i * 8, 6 + beat);
  }
  glow(r, 9, 19, 7, r.palette[3], 0.3 + 0.1 * Math.sin(time * 3));
  r.sprite('hud', 'soul', 6, 16);
  r.textOutlined(String(p.souls), 13, 16, 3);
}
