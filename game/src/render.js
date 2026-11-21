// Lantern Heist — every pixel is drawn here by hand on one canvas: the
// night archive, its shelves and ferns, the guards and their cones of
// sight, the thief's lantern light, and the screens between levels.

import { TILE, COLS, ROWS, PLAY_W, PLAY_H, HUD_H, CANVAS_W, CANVAS_H } from './config.js';
import { CONE_RANGE_TILES, CONE_HALF_ANGLE } from './guards.js';

// March a ray from (x, y) along an angle until a sight-blocking tile or
// the range ends, and return the point where the gaze stops.
function rayHit(level, x, y, angle, range) {
  const step = 8;
  let px = x;
  let py = y;
  for (let d = step; d <= range; d += step) {
    px = x + Math.cos(angle) * d;
    py = y + Math.sin(angle) * d;
    if (level.blocksSight(level.tileAtPixel(px, py))) return { x: px, y: py };
  }
  return { x: x + Math.cos(angle) * range, y: y + Math.sin(angle) * range };
}

// The vision cone as a polygon that hugs the walls: a fan of short rays.
function conePolygon(level, guard) {
  const pts = [{ x: guard.x, y: guard.y }];
  const steps = 26;
  const range = guard.coneRange;
  for (let i = 0; i <= steps; i++) {
    const a = guard.dir - CONE_HALF_ANGLE + (2 * CONE_HALF_ANGLE * i) / steps;
    pts.push(rayHit(level, guard.x, guard.y, a, range));
  }
  return pts;
}

function coneColor(guard) {
  if (guard.state === 'chase') return 'rgba(255, 64, 64, 0.34)';
  if (guard.state === 'suspicious' || guard.state === 'investigate') return 'rgba(255, 170, 60, 0.30)';
  return 'rgba(255, 235, 130, 0.26)';
}

function drawCone(ctx, level, guard) {
  const poly = conePolygon(level, guard);
  ctx.beginPath();
  ctx.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
  ctx.closePath();
  ctx.fillStyle = coneColor(guard);
  ctx.fill();
  ctx.strokeStyle = coneColor(guard).replace(/0\.\d+\)$/, '0.55)');
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawFloor(ctx, level, time) {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const ch = level.grid[y][x];
      const px = x * TILE;
      const py = y * TILE;
      if (ch === '#') {
        ctx.fillStyle = '#2c2a44';
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = '#3a3757';
        ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
        ctx.fillStyle = '#232138';
        ctx.fillRect(px + 3, py + TILE - 8, TILE - 6, 5);
      } else {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#4a3a28' : '#453723';
        ctx.fillRect(px, py, TILE, TILE);
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
        ctx.strokeStyle = 'rgba(255,220,160,0.05)';
        ctx.beginPath();
        ctx.moveTo(px + 6, py + TILE / 2);
        ctx.lineTo(px + TILE - 6, py + TILE / 2);
        ctx.stroke();
      }
      if (ch === 'b') {
        // Fern bush: layered leaves the thief can crouch inside.
        ctx.fillStyle = '#1d4a26';
        ctx.beginPath();
        ctx.arc(px + 20, py + 40, 20, 0, Math.PI * 2);
        ctx.arc(px + 44, py + 30, 22, 0, Math.PI * 2);
        ctx.arc(px + 38, py + 48, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2e6b35';
        ctx.beginPath();
        ctx.arc(px + 26, py + 34, 13, 0, Math.PI * 2);
        ctx.arc(px + 46, py + 42, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4c9a4f';
        ctx.beginPath();
        ctx.arc(px + 32, py + 30, 5, 0, Math.PI * 2);
        ctx.arc(px + 48, py + 36, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      if (ch === 'L') {
        ctx.fillStyle = '#6b5a2e';
        ctx.fillRect(px + TILE / 2 - 4, py + TILE / 2 - 4, 8, 8);
        ctx.fillStyle = '#ffd970';
        ctx.beginPath();
        ctx.arc(px + TILE / 2, py + TILE / 2, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 217, 112, 0.35)';
        ctx.beginPath();
        ctx.arc(px + TILE / 2, py + TILE / 2, 12 + Math.sin(time * 2 + x) * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      if (ch === 'H') {
        ctx.fillStyle = '#5a3d22';
        ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
        ctx.fillStyle = '#7a5230';
        ctx.fillRect(px + 8, py + 8, TILE - 16, TILE - 16);
        const bookColors = ['#a33', '#36a', '#3a6', '#aa3', '#863'];
        for (let s = 0; s < 3; s++) {
          for (let b = 0; b < 6; b++) {
            ctx.fillStyle = bookColors[(b + s) % bookColors.length];
            ctx.fillRect(px + 10 + b * 8, py + 10 + s * 16, 6, 13);
          }
        }
      }
      if (ch === 'D') {
        ctx.fillStyle = '#3d3a55';
        ctx.fillRect(px + 6, py + 6, TILE - 12, TILE - 12);
        ctx.fillStyle = 'rgba(180, 220, 255, 0.35)';
        ctx.fillRect(px + 10, py + 10, TILE - 20, TILE - 20);
        ctx.fillStyle = '#ffd970';
        ctx.beginPath();
        ctx.arc(px + TILE / 2, py + TILE / 2, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2c2a44';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 6, py + 6, TILE - 12, TILE - 12);
      }
    }
  }
}

function drawRelicsAndExit(ctx, level, time) {
  for (const relic of level.relics) {
    if (relic.taken) continue;
    const cx = (relic.tx + 0.5) * TILE;
    const cy = (relic.ty + 0.5) * TILE;
    const bob = Math.sin(time * 2.4 + relic.tx) * 3;
    const glow = 0.25 + 0.12 * Math.sin(time * 3 + relic.ty);
    ctx.fillStyle = `rgba(255, 215, 110, ${glow})`;
    ctx.beginPath();
    ctx.arc(cx, cy + bob, 24, 0, Math.PI * 2);
    ctx.fill();
    // A little golden idol.
    ctx.fillStyle = '#e8b93a';
    ctx.beginPath();
    ctx.arc(cx, cy - 6 + bob, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - 7, cy + 2 + bob, 14, 10);
    ctx.fillStyle = '#7a4d12';
    ctx.fillRect(cx - 9, cy + 12 + bob, 18, 4);
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 8 + bob, 2.5, 0, Math.PI * 2);
    ctx.arc(cx + 4, cy - 8 + bob, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (level.exit) {
    const ex = (level.exit.tx + 0.5) * TILE;
    const ey = (level.exit.ty + 0.5) * TILE;
    const open = level.exit.open;
    ctx.fillStyle = open ? '#1f7a3a' : '#7a1f1f';
    ctx.fillRect(ex - 24, ey - 28, 48, 56);
    ctx.fillStyle = open ? '#37c25e' : '#a33';
    ctx.fillRect(ex - 18, ey - 22, 36, 44);
    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(open ? 'EXIT' : 'LOCKED', ex, ey - 34);
    if (open) {
      ctx.fillStyle = `rgba(80, 255, 140, ${0.25 + 0.15 * Math.sin(time * 4)})`;
      ctx.beginPath();
      ctx.arc(ex, ey, 30, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawGuard(ctx, guard, time) {
  const bob = guard.state === 'patrol' ? Math.sin(time * 6 + guard.x) * 1.5 : 0;
  ctx.save();
  ctx.translate(guard.x, guard.y + bob);
  // Body: a night watchman in a navy coat.
  ctx.fillStyle = '#22335e';
  ctx.beginPath();
  ctx.arc(0, 0, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#31457e';
  ctx.beginPath();
  ctx.arc(0, -2, 12, 0, Math.PI * 2);
  ctx.fill();
  // Cap and lamp on the helmet.
  ctx.fillStyle = '#16233f';
  ctx.beginPath();
  ctx.arc(0, -4, 10, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(-10, -5, 20, 4);
  ctx.fillStyle = '#ffd970';
  ctx.beginPath();
  ctx.arc(Math.cos(guard.dir) * 12, Math.sin(guard.dir) * 12 - 2, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // Eyes look where the guard looks.
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(Math.cos(guard.dir) * 5 - Math.sin(guard.dir) * 4, -3 + Math.sin(guard.dir) * 5, 2.2, 0, Math.PI * 2);
  ctx.arc(Math.cos(guard.dir) * 5 + Math.sin(guard.dir) * 4, -3 + Math.sin(guard.dir) * 5, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Suspicion: a ring filling above the head, then ? or !.
  const s = guard.suspicion;
  if (s > 0.03) {
    const gx = guard.x;
    const gy = guard.y - 30;
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(gx, gy, 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = s >= 1 ? '#ff4040' : s >= 0.55 ? '#ffaa3c' : '#ffeeb0';
    ctx.beginPath();
    ctx.arc(gx, gy, 9, -Math.PI / 2, -Math.PI / 2 + s * Math.PI * 2);
    ctx.stroke();
    if (guard.state === 'chase' || guard.state === 'investigate') {
      ctx.fillStyle = guard.state === 'chase' ? '#ff4040' : '#ffaa3c';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(guard.state === 'chase' ? '!' : '?', gx, gy - 14);
    }
  }
  if (guard.seenFlash > 0) {
    ctx.strokeStyle = `rgba(255, 64, 64, ${guard.seenFlash})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 26 + (0.6 - guard.seenFlash) * 20, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawPlayer(ctx, player, time) {
  const bob = player.moving ? Math.sin(time * (player.sneaking ? 7 : 11)) * 2 : Math.sin(time * 2) * 1;
  ctx.save();
  ctx.translate(player.x, player.y + bob);
  // Cloak.
  ctx.fillStyle = '#3d2b52';
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.quadraticCurveTo(15, -6, 13, 12);
  ctx.quadraticCurveTo(0, 17, -13, 12);
  ctx.quadraticCurveTo(-15, -6, 0, -18);
  ctx.fill();
  // Hood and face in shadow.
  ctx.fillStyle = '#2c1e3d';
  ctx.beginPath();
  ctx.arc(0, -8, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd9a0';
  ctx.beginPath();
  ctx.arc(Math.cos(player.dir) * 3, -8 + Math.sin(player.dir) * 3, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.arc(Math.cos(player.dir) * 4.5, -9 + Math.sin(player.dir) * 4.5, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // The lantern, swinging at the thief's side.
  const lx = Math.cos(player.dir + Math.PI / 2) * 14;
  const ly = Math.sin(player.dir + Math.PI / 2) * 14 + 4;
  ctx.fillStyle = '#ffd970';
  ctx.beginPath();
  ctx.arc(lx, ly, 4.5 + Math.sin(time * 5) * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPebbles(ctx, pebbles) {
  for (const p of pebbles) {
    const age = p.age ?? 0;
    const alpha = Math.max(0, 1 - age / 1.2);
    ctx.strokeStyle = `rgba(255, 240, 180, ${alpha * 0.8})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6 + age * 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#cfc4a0';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// The night itself: a dark veil with holes of lamplight and lantern light.
function drawDarkness(ctx, level, player, lightCanvas) {
  const lctx = lightCanvas.getContext('2d');
  lctx.clearRect(0, 0, PLAY_W, PLAY_H);
  lctx.globalCompositeOperation = 'source-over';
  lctx.fillStyle = 'rgba(5, 7, 24, 0.78)';
  lctx.fillRect(0, 0, PLAY_W, PLAY_H);
  lctx.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r, strength) => {
    const g = lctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(0,0,0,${strength})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    lctx.fillStyle = g;
    lctx.beginPath();
    lctx.arc(x, y, r, 0, Math.PI * 2);
    lctx.fill();
  };
  for (const lamp of level.lamps) hole(lamp.x, lamp.y, TILE * 2.6, 0.92);
  hole(player.x, player.y, TILE * 2.1, 0.85);
  if (level.exit && level.exit.open) {
    hole((level.exit.tx + 0.5) * TILE, (level.exit.ty + 0.5) * TILE, TILE * 1.6, 0.7);
  }
  ctx.drawImage(lightCanvas, 0, 0);
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.lightCanvas = document.createElement('canvas');
    this.lightCanvas.width = PLAY_W;
    this.lightCanvas.height = PLAY_H;
  }

  drawWorld(game, time) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, PLAY_W, PLAY_H);
    ctx.clip();
    drawFloor(ctx, game.level, time);
    drawRelicsAndExit(ctx, game.level, time);
    drawPebbles(ctx, game.pebbles);
    for (const guard of game.guards) drawGuard(ctx, guard, time);
    drawPlayer(ctx, game.player, time);
    drawDarkness(ctx, game.level, game.player, this.lightCanvas);
    // Cones glow through the dark so the danger is always readable.
    for (const guard of game.guards) drawCone(ctx, game.level, guard);
    ctx.restore();

    // A red edge when any guard is on the verge of spotting the thief.
    const hottest = Math.max(0, ...game.guards.map((g) => g.suspicion));
    if (hottest > 0.55) {
      const pulse = 0.12 + 0.08 * Math.sin(time * 6);
      ctx.strokeStyle = `rgba(255, 50, 50, ${pulse * hottest})`;
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, PLAY_W - 10, PLAY_H - 10);
    }
  }

  drawHud(game) {
    const ctx = this.ctx;
    const y0 = PLAY_H;
    ctx.fillStyle = '#14122b';
    ctx.fillRect(0, y0, CANVAS_W, HUD_H);
    ctx.fillStyle = '#2c2a44';
    ctx.fillRect(0, y0, CANVAS_W, 3);
    ctx.fillStyle = '#f5ead0';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Level ${game.levelIndex + 1} · ${game.level.name}`, 18, y0 + 30);
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillStyle = '#c9bfa5';
    ctx.fillText(game.level.intro, 18, y0 + 56);
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd970';
    const left = game.level.relicsLeft();
    ctx.fillText(`Relics ${game.level.relics.length - left}/${game.level.relics.length}`, CANVAS_W - 18, y0 + 30);
    ctx.fillStyle = '#e8e0c8';
    ctx.fillText(`Pebbles ${game.player.pebbles}  ·  Lanterns ${'◐'.repeat(game.attempts)}  ·  ${game.clock}`, CANVAS_W - 18, y0 + 56);
    ctx.fillStyle = '#8f86b8';
    ctx.font = '14px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('WASD move · Shift sneak · Click throw a pebble · E take relic · H help · M sound', 18, y0 + 82);
  }

  drawMessage(game) {
    if (!game.message) return;
    const ctx = this.ctx;
    ctx.font = 'bold 19px system-ui, sans-serif';
    const w = ctx.measureText(game.message).width + 36;
    ctx.fillStyle = 'rgba(10, 8, 24, 0.85)';
    ctx.beginPath();
    ctx.roundRect((CANVAS_W - w) / 2, PLAY_H - 118, w, 38, 10);
    ctx.fill();
    ctx.fillStyle = '#ffeeb0';
    ctx.textAlign = 'center';
    ctx.fillText(game.message, CANVAS_W / 2, PLAY_H - 92);
  }

  drawScreen(title, lines, accent) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(8, 6, 20, 0.62)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = accent || '#ffd970';
    ctx.font = 'bold 54px Georgia, serif';
    ctx.fillText(title, CANVAS_W / 2, 250);
    ctx.fillStyle = '#f5ead0';
    ctx.font = '21px system-ui, sans-serif';
    lines.forEach((line, i) => ctx.fillText(line, CANVAS_W / 2, 320 + i * 36));
  }
}
