// Lantern Heist — the level: parsing the ASCII map into walls, shelves,
// bushes, lamps, relics, the exit and spawn points, plus the sight and
// light questions the guards ask every frame.

import { TILE, COLS, ROWS } from './config.js';

export class Level {
  constructor(def) {
    this.def = def;
    this.name = def.name;
    this.intro = def.intro;
    this.grid = def.map.map((row) => row.split(''));
    this.relics = [];
    this.lamps = [];
    this.exit = null;
    this.playerStart = null;
    this.guardStarts = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const c = this.grid[y][x];
        if (c === 'R') this.relics.push({ tx: x, ty: y, taken: false });
        if (c === 'L') this.lamps.push({ x: (x + 0.5) * TILE, y: (y + 0.5) * TILE });
        if (c === 'E') this.exit = { tx: x, ty: y, open: false };
        if (c === 'P') this.playerStart = { x: (x + 0.5) * TILE, y: (y + 0.5) * TILE };
        if (c === 'G') this.guardStarts.push({ x: (x + 0.5) * TILE, y: (y + 0.5) * TILE });
      }
    }
  }

  tileAtPixel(px, py) {
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return '#';
    return this.grid[ty][tx];
  }

  // True for tiles the thief and the guards cannot walk through.
  blocksMovement(ch) {
    return ch === '#' || ch === 'H' || ch === 'D';
  }

  // True for tiles that stop a guard's gaze.
  blocksSight(ch) {
    return ch === '#' || ch === 'H' || ch === 'D';
  }

  isBush(ch) {
    return ch === 'b';
  }

  // Circle (in pixels) against the blocking tiles. Returns the position
  // after sliding along walls, so movement feels smooth in corridors.
  moveCircle(x, y, dx, dy, radius) {
    let nx = x + dx;
    let ny = y + dy;
    if (!this.circleHitsWall(nx, y, radius)) x = nx;
    else if (!this.circleHitsWall(x + dx * 0.5, y, radius)) x += dx * 0.5;
    if (!this.circleHitsWall(x, ny, radius)) y = ny;
    else if (!this.circleHitsWall(x, y + dy * 0.5, radius)) y += dy * 0.5;
    return { x, y };
  }

  circleHitsWall(px, py, radius) {
    const x0 = Math.floor((px - radius) / TILE);
    const x1 = Math.floor((px + radius) / TILE);
    const y0 = Math.floor((py - radius) / TILE);
    const y1 = Math.floor((py + radius) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const ch = tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS ? '#' : this.grid[ty][tx];
        if (!this.blocksMovement(ch)) continue;
        const cx = Math.max(tx * TILE, Math.min(px, (tx + 1) * TILE));
        const cy = Math.max(ty * TILE, Math.min(py, (ty + 1) * TILE));
        const ddx = px - cx;
        const ddy = py - cy;
        if (ddx * ddx + ddy * ddy < radius * radius) return true;
      }
    }
    return false;
  }

  // Line of sight between two pixel points, sampled finely enough that no
  // wall tile is ever stepped over.
  hasLineOfSight(x0, y0, x1, y1) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(dist / 8));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (this.blocksSight(this.tileAtPixel(x0 + dx * t, y0 + dy * t))) return false;
    }
    return true;
  }

  // How lit a pixel is, 0 (pitch dark) to 1 (under a lamp). Lamps pool
  // light; the thief's lantern adds its own glow at short range.
  lightAt(px, py, lanternX, lanternY) {
    let light = 0.12; // the archive is never fully black
    for (const lamp of this.lamps) {
      const d = Math.hypot(px - lamp.x, py - lamp.y) / TILE;
      if (d < 3.2) light = Math.max(light, 1 - d / 3.2);
    }
    if (lanternX !== undefined) {
      const d = Math.hypot(px - lanternX, py - lanternY) / TILE;
      if (d < 2.2) light = Math.max(light, 0.55 * (1 - d / 2.2));
    }
    return Math.min(1, light);
  }

  relicsLeft() {
    return this.relics.filter((r) => !r.taken).length;
  }

  allRelicsTaken() {
    return this.relicsLeft() === 0;
  }
}
