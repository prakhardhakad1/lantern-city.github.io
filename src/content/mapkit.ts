/**
 * A tiny builder for ASCII maps: start from open air, carve terrain with rectangles, then drop
 * symbols. Rows are 8px tiles; "floor row r" means the player stands on top of row r.
 */
export class MapBuilder {
  readonly g: string[][];

  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    this.g = Array.from({ length: h }, () => Array<string>(w).fill(' '));
    // side walls so nobody leaves the map sideways
    this.fill(0, 0, 1, h, '#');
    this.fill(w - 1, 0, 1, h, '#');
  }

  fill(x: number, y: number, w: number, h: number, ch: string) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (j >= 0 && j < this.h && i >= 0 && i < this.w) this.g[j][i] = ch;
    return this;
  }

  /** Solid ground from row `top` to the bottom of the map, columns x0..x1 (inclusive). */
  ground(x0: number, x1: number, top: number, ch = '#') {
    return this.fill(x0, top, x1 - x0 + 1, this.h - top, ch);
  }

  /** A solid block (ledge, pillar, roof). */
  block(x: number, y: number, w: number, h: number) {
    return this.fill(x, y, w, h, '#');
  }

  /** Carve air. */
  air(x: number, y: number, w: number, h: number) {
    return this.fill(x, y, w, h, ' ');
  }

  /** Fill only the empty cells of a rectangle (water, updrafts, wind). */
  field(x: number, y: number, w: number, h: number, ch: string) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (this.g[j]?.[i] === ' ') this.g[j][i] = ch;
    return this;
  }

  put(x: number, y: number, ch: string) {
    if (y >= 0 && y < this.h && x >= 0 && x < this.w) this.g[y][x] = ch;
    return this;
  }

  /** Symbols in a row: put(x0 + i * step, y, ch) for i < n. */
  row(x0: number, y: number, n: number, step: number, ch: string) {
    for (let i = 0; i < n; i++) this.put(x0 + i * step, y, ch);
    return this;
  }

  /** Symbols in a column: put(x, y0 + i * step, ch) for i < n. */
  col(x: number, y0: number, n: number, step: number, ch: string) {
    for (let i = 0; i < n; i++) this.put(x, y0 + i * step, ch);
    return this;
  }

  rows(): string[] {
    return this.g.map((r) => r.join(''));
  }
}
