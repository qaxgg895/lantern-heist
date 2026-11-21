// Lantern Heist — the thief, Moth. Walks, sneaks, throws pebbles to make
// noise elsewhere, and pockets relics. Running is loud; sneaking is slow
// but quiet and harder to spot.

import { TILE, PLAYER_SPEED, SNEAK_SPEED, PEBBLE_RANGE_TILES } from './config.js';

export class Player {
  constructor(start, pebbles) {
    this.x = start.x;
    this.y = start.y;
    this.dir = -Math.PI / 2;
    this.sneaking = false;
    this.moving = false;
    this.pebbles = pebbles;
    this.relics = 0;
    this.radius = 16;
  }

  update(dt, level, keys, sounds) {
    let mx = 0;
    let my = 0;
    if (keys['arrowleft'] || keys['a']) mx -= 1;
    if (keys['arrowright'] || keys['d']) mx += 1;
    if (keys['arrowup'] || keys['w']) my -= 1;
    if (keys['arrowdown'] || keys['s']) my += 1;
    this.sneaking = Boolean(keys['shift']);
    this.moving = mx !== 0 || my !== 0;
    if (!this.moving) return;
    const len = Math.hypot(mx, my);
    mx /= len;
    my /= len;
    const speed = (this.sneaking ? SNEAK_SPEED : PLAYER_SPEED) * TILE;
    const moved = level.moveCircle(this.x, this.y, mx * speed * dt, my * speed * dt, this.radius);
    this.x = moved.x;
    this.y = moved.y;
    this.dir = Math.atan2(my, mx);
    sounds.step(this.sneaking);
  }

  // Running feet carry. Returns the noise radius in tiles, 0 while still.
  noiseRadiusTiles() {
    if (!this.moving) return 0;
    return this.sneaking ? 0 : 2.6;
  }

  // Throw a pebble toward a pixel point. Returns the landing point, or
  // null when out of pebbles or out of throwing range.
  throwPebble(tx, ty) {
    if (this.pebbles <= 0) return null;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > PEBBLE_RANGE_TILES * TILE) return null;
    this.pebbles -= 1;
    return { x: tx, y: ty };
  }

  // The nearest relic within reach, if any.
  relicInReach(level) {
    for (const relic of level.relics) {
      if (relic.taken) continue;
      const rx = (relic.tx + 0.5) * TILE;
      const ry = (relic.ty + 0.5) * TILE;
      if (Math.hypot(rx - this.x, ry - this.y) < TILE * 0.95) return relic;
    }
    return null;
  }

  atExit(level) {
    if (!level.exit || !level.exit.open) return false;
    const ex = (level.exit.tx + 0.5) * TILE;
    const ey = (level.exit.ty + 0.5) * TILE;
    return Math.hypot(ex - this.x, ey - this.y) < TILE * 0.7;
  }
}
