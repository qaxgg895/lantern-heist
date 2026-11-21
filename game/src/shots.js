// Lantern Heist — scripted scenes for the screenshots (?shot=start|play|
// alert|win). Each one places the thief and the guards by hand and freezes
// the game, so a screenshot is the same render every time it is taken.

import { TILE } from './config.js';

function place(game, tx, ty) {
  return { x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE };
}

function setGuard(guard, tx, ty, dir, state, suspicion) {
  const p = place(null, tx, ty);
  guard.x = p.x;
  guard.y = p.y;
  guard.dir = dir;
  guard.state = state;
  guard.suspicion = suspicion;
}

export function applyShot(game, shot) {
  if (shot === 'start') {
    // The title screen over the Reading Room, guards mid-patrol.
    game.loadLevel(0);
    setGuard(game.guards[0], 7, 6, 0, 'patrol', 0);
    setGuard(game.guards[1], 9, 8, Math.PI, 'patrol', 0);
    game.state = 'title';
  } else if (shot === 'play') {
    // Mid-heist: one relic pocketed, Moth crouched in the ferns while a
    // guard turns toward the noise, his cone sweeping the shelves.
    game.loadLevel(0);
    game.level.relics[1].taken = true; // the (6,5) relic
    game.player.relics = 1;
    game.player.pebbles = 4;
    const p = place(null, 5, 1); // the fern bush by the entrance
    game.player.x = p.x;
    game.player.y = p.y;
    game.player.dir = Math.PI / 2;
    setGuard(game.guards[0], 7, 3, Math.PI / 2, 'suspicious', 0.45);
    game.guards[0].lastSeen = { x: p.x, y: p.y };
    setGuard(game.guards[1], 11, 8, Math.PI, 'patrol', 0);
    game.elapsed = 74;
    game.state = 'playing';
  } else if (shot === 'alert') {
    // The chase: two relics taken in the Gallery, a guard in full pursuit
    // with a red cone, Moth breaking for the ferns.
    game.loadLevel(1);
    game.level.relics[0].taken = true;
    game.level.relics[1].taken = true;
    game.player.relics = 2;
    game.player.pebbles = 3;
    const p = place(null, 10, 1); // the fern bush at the top of the gallery
    game.player.x = p.x;
    game.player.y = p.y;
    game.player.dir = Math.PI;
    game.player.sneaking = true;
    setGuard(game.guards[0], 12, 2, Math.PI * 0.85, 'chase', 1);
    game.guards[0].lastSeen = { x: p.x, y: p.y };
    game.guards[0].seenFlash = 0.5;
    setGuard(game.guards[1], 4, 7, -Math.PI / 2, 'patrol', 0.2);
    setGuard(game.guards[2], 15, 5, Math.PI, 'suspicious', 0.6);
    game.guards[2].lastSeen = { x: p.x, y: p.y };
    game.elapsed = 148;
    game.state = 'playing';
  } else if (shot === 'win') {
    // The room cleared: every relic pocketed, Moth standing in the open
    // exit doorway as the level-clear screen comes up.
    game.loadLevel(0);
    for (const relic of game.level.relics) relic.taken = true;
    game.level.exit.open = true;
    game.player.relics = 2;
    game.player.pebbles = 5;
    const p = place(null, 17, 8); // the exit doorway
    game.player.x = p.x;
    game.player.y = p.y;
    game.player.dir = Math.PI / 2;
    setGuard(game.guards[0], 7, 4, 0, 'patrol', 0);
    setGuard(game.guards[1], 13, 6, -Math.PI / 2, 'patrol', 0);
    game.elapsed = 187;
    game.state = 'levelclear';
  } else {
    game.state = 'title';
  }
}
