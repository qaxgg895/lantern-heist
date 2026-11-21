// Lantern Heist — the night watchman. A guard walks a patrol route, scans
// with a visible cone of sight, grows suspicious when something moves in
// it, investigates noises, and gives chase when the thief is plainly seen.

import { TILE, GUARD_PATROL_SPEED, GUARD_CHASE_SPEED, GUARD_SEARCH_SPEED } from './config.js';

export const CONE_RANGE_TILES = 5.5;
export const CONE_HALF_ANGLE = 0.66; // radians, about 38 degrees

export class Guard {
  constructor(def, start, rng) {
    this.waypoints = def.waypoints.map(([tx, ty]) => ({
      x: (tx + 0.5) * TILE,
      y: (ty + 0.5) * TILE,
    }));
    this.x = start.x;
    this.y = start.y;
    this.dir = -Math.PI / 2; // facing up to start
    this.wpIndex = 1 % this.waypoints.length;
    this.pauseLeft = 0;
    this.pauseTime = def.pause ?? 1;
    this.state = 'patrol'; // patrol | suspicious | investigate | chase | return
    this.suspicion = 0; // 0..1, at 1 the guard gives chase
    this.lastSeen = null; // {x, y} where the thief was last plainly seen
    this.searchLeft = 0;
    this.loseSightLeft = 0;
    this.rng = rng;
    this.seenFlash = 0; // brief ring shown when the guard first spots the thief
  }

  get speed() {
    if (this.state === 'chase') return GUARD_CHASE_SPEED;
    if (this.state === 'investigate' || this.state === 'suspicious') return GUARD_SEARCH_SPEED;
    return GUARD_PATROL_SPEED;
  }

  get coneRange() {
    // A chasing guard sees further; a patrolling one scans the usual arc.
    return (this.state === 'chase' ? 7 : CONE_RANGE_TILES) * TILE;
  }

  // Can this guard see the thief right now? Range, cone angle, a clear
  // line of sight, and no bush to hide in (unless the guard is close).
  canSee(level, thief) {
    const dx = thief.x - this.x;
    const dy = thief.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > this.coneRange) return false;
    let angle = Math.atan2(dy, dx) - this.dir;
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    if (Math.abs(angle) > CONE_HALF_ANGLE && dist > TILE * 0.9) return false;
    if (!level.hasLineOfSight(this.x, this.y, thief.x, thief.y)) return false;
    if (level.isBush(level.tileAtPixel(thief.x, thief.y)) && dist > TILE * 1.6) return false;
    return true;
  }

  // How fast suspicion grows while the thief is in sight: closer, lit and
  // running thieves are noticed sooner; sneaking in the dark buys time.
  suspicionRate(level, thief, dist) {
    const lit = level.lightAt(thief.x, thief.y, thief.x, thief.y);
    let rate = 1.15 * (1 - (dist / this.coneRange) * 0.55);
    rate *= 0.55 + lit * 0.75; // dark halves the rate, lamplight raises it
    if (thief.sneaking) rate *= 0.6;
    return rate;
  }

  hearNoise(nx, ny, radiusTiles) {
    if (this.state === 'chase') return;
    const d = Math.hypot(nx - this.x, ny - this.y);
    if (d > radiusTiles * TILE) return;
    this.state = 'investigate';
    this.lastSeen = { x: nx, y: ny };
    this.suspicion = Math.max(this.suspicion, 0.55);
  }

  update(dt, level, thief, sounds) {
    const sees = this.canSee(level, thief);
    const dist = Math.hypot(thief.x - this.x, thief.y - this.y);

    if (sees) {
      const before = this.suspicion;
      this.suspicion = Math.min(1, this.suspicion + this.suspicionRate(level, thief, dist) * dt);
      this.lastSeen = { x: thief.x, y: thief.y };
      this.loseSightLeft = 2.5;
      if (before < 1 && this.suspicion >= 1 && this.state !== 'chase') {
        this.state = 'chase';
        this.seenFlash = 0.6;
        sounds.alert();
      } else if (this.suspicion >= 0.55 && this.state === 'patrol') {
        this.state = 'suspicious';
      }
    } else {
      this.suspicion = Math.max(0, this.suspicion - 0.22 * dt);
      if (this.state === 'chase') {
        this.loseSightLeft -= dt;
        if (this.loseSightLeft <= 0) {
          this.state = 'investigate';
          this.searchLeft = 3;
        }
      } else if (this.state === 'suspicious' && this.suspicion < 0.3) {
        this.state = 'return';
      }
    }
    if (this.seenFlash > 0) this.seenFlash -= dt;

    // Movement by state.
    if (this.state === 'patrol') this.walkPatrol(dt, level);
    else if (this.state === 'chase' && this.lastSeen) this.walkToward(dt, level, this.lastSeen.x, this.lastSeen.y);
    else if ((this.state === 'investigate' || this.state === 'suspicious') && this.lastSeen) {
      const arrived = this.walkToward(dt, level, this.lastSeen.x, this.lastSeen.y);
      if (arrived) {
        if (this.state === 'investigate') {
          this.searchLeft -= dt;
          this.dir += dt * 1.6; // look around the spot
          if (this.searchLeft <= 0) {
            this.suspicion = Math.max(0, this.suspicion - 0.3);
            this.state = 'return';
          }
        } else {
          this.state = 'return';
        }
      }
    } else if (this.state === 'return') {
      const target = this.waypoints[this.wpIndex];
      const arrived = this.walkToward(dt, level, target.x, target.y);
      if (arrived) this.state = 'patrol';
    }
  }

  walkPatrol(dt, level) {
    if (this.pauseLeft > 0) {
      this.pauseLeft -= dt;
      return;
    }
    const target = this.waypoints[this.wpIndex];
    const arrived = this.walkToward(dt, level, target.x, target.y);
    if (arrived) {
      this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
      this.pauseLeft = this.pauseTime * (0.7 + this.rng() * 0.6);
    }
  }

  // Walk toward a point, steering around blocking tiles by trying the
  // axes separately. Returns true when the point is reached.
  walkToward(dt, level, tx, ty) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) return true;
    const step = this.speed * TILE * dt;
    const nx = this.x + (dx / dist) * step;
    const ny = this.y + (dy / dist) * step;
    const moved = level.moveCircle(this.x, this.y, nx - this.x, ny - this.y, 18);
    // If a wall stopped us, slide along the other axis instead.
    if (Math.hypot(moved.x - this.x, moved.y - this.y) < step * 0.25) {
      const alt = level.moveCircle(this.x, this.y, 0, ny - this.y, 18);
      if (Math.hypot(alt.x - this.x, alt.y - this.y) > 2) {
        this.x = alt.x;
        this.y = alt.y;
      } else {
        const alt2 = level.moveCircle(this.x, this.y, nx - this.x, 0, 18);
        this.x = alt2.x;
        this.y = alt2.y;
      }
    } else {
      this.x = moved.x;
      this.y = moved.y;
    }
    // Face the direction of travel.
    this.dir = Math.atan2(dy, dx);
    return Math.hypot(tx - this.x, ty - this.y) < 10;
  }

  // Has this guard caught the thief?
  catches(thief) {
    return this.state === 'chase' && Math.hypot(thief.x - this.x, thief.y - this.y) < TILE * 0.75;
  }
}
