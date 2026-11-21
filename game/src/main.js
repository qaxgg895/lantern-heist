// Lantern Heist — the game itself: states, input, the loop, and the rules
// that tie the thief, the guards and the archive together. Played with
// keyboard and mouse in a desktop browser, from static files only.

import { TILE, CANVAS_W, CANVAS_H, LEVELS } from './config.js';
import { Level } from './level.js';
import { Guard } from './guards.js';
import { Player } from './player.js';
import { Renderer } from './render.js';
import { SoundBank } from './audio.js';
import { mulberry32 } from './random.js';
import { applyShot } from './shots.js';

const ATTEMPTS_PER_LEVEL = 3;

export class Game {
  constructor(canvas) {
    this.renderer = new Renderer(canvas);
    this.sounds = new SoundBank();
    this.keys = {};
    this.state = 'title'; // title | playing | paused | help | caught | levelclear | gameover | win
    this.levelIndex = 0;
    this.attempts = ATTEMPTS_PER_LEVEL;
    this.elapsed = 0;
    this.message = '';
    this.messageLeft = 0;
    this.pebbles = []; // landing rings, {x, y, age}
    this.frozen = false; // screenshot mode: render a scripted frame, advance nothing
    this.time = 0; // visual clock, frozen in screenshot mode
    this.loadLevel(0);
    this.bindInput(canvas);
  }

  get level() {
    return this._level;
  }

  get clock() {
    const s = Math.floor(this.elapsed);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }

  loadLevel(index) {
    this.levelIndex = index;
    const def = LEVELS[index];
    this._level = new Level(def);
    this.rng = mulberry32(0x9e3779b9 + index * 7919);
    this.player = new Player(this._level.playerStart, def.pebbles);
    this.guards = def.guards.map((g, i) => new Guard(g, this._level.guardStarts[i], this.rng));
    this.pebbles = [];
    this.message = '';
    this.messageLeft = 0;
    this.state = this.state === 'title' ? 'title' : 'playing';
  }

  showMessage(text, seconds = 2.5) {
    this.message = text;
    this.messageLeft = seconds;
  }

  startGame() {
    this.sounds.resume();
    this.levelIndex = 0;
    this.attempts = ATTEMPTS_PER_LEVEL;
    this.elapsed = 0;
    this.loadLevel(0);
    this.state = 'playing';
    this.showMessage('Steal every relic, then slip out the exit — unseen.', 3.5);
  }

  retryLevel() {
    this.attempts = ATTEMPTS_PER_LEVEL;
    this.loadLevel(this.levelIndex);
    this.state = 'playing';
  }

  nextLevel() {
    if (this.levelIndex + 1 >= LEVELS.length) {
      this.state = 'win';
      this.sounds.levelClear();
      return;
    }
    this.attempts = ATTEMPTS_PER_LEVEL;
    this.loadLevel(this.levelIndex + 1);
    this.state = 'playing';
    this.showMessage(`${this.level.name} — ${this.level.intro}`, 3.5);
  }

  bindInput(canvas) {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) e.preventDefault();
      this.keys[key] = true;
      this.sounds.resume();
      if (key === 'm') {
        const muted = this.sounds.toggleMute();
        this.showMessage(muted ? 'Sound off.' : 'Sound on.', 1.2);
      }
      if (key === 'h' && (this.state === 'playing' || this.state === 'help')) {
        this.state = this.state === 'help' ? 'playing' : 'help';
      }
      if (key === 'p' && this.state === 'playing') this.state = 'paused';
      else if (key === 'p' && this.state === 'paused') this.state = 'playing';
      if (key === 'r' && (this.state === 'caught' || this.state === 'gameover' || this.state === 'playing')) {
        this.retryLevel();
      }
      if (key === 'enter') {
        if (this.state === 'title') this.startGame();
        else if (this.state === 'levelclear') this.nextLevel();
        else if (this.state === 'win' || this.state === 'gameover') this.startGame();
      }
      if (key === 'e' && this.state === 'playing') this.tryTakeRelic();
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
    canvas.addEventListener('mousedown', (e) => {
      this.sounds.resume();
      if (this.state === 'title') {
        this.startGame();
        return;
      }
      if (this.state === 'levelclear') {
        this.nextLevel();
        return;
      }
      if (this.state === 'win' || this.state === 'gameover') {
        this.startGame();
        return;
      }
      if (this.state !== 'playing') return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const tx = (e.clientX - rect.left) * scaleX;
      const ty = (e.clientY - rect.top) * scaleY;
      if (ty > 704) return; // clicks on the HUD do nothing
      const landing = this.player.throwPebble(tx, ty);
      if (!landing) {
        this.showMessage(this.player.pebbles <= 0 ? 'No pebbles left.' : 'Too far to throw.', 1.4);
        return;
      }
      this.sounds.pebbleThrow();
      this.pebbles.push({ x: landing.x, y: landing.y, age: 0 });
      this.sounds.pebbleClink();
      for (const guard of this.guards) guard.hearNoise(landing.x, landing.y, 6);
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  tryTakeRelic() {
    const relic = this.player.relicInReach(this.level);
    if (!relic) return;
    relic.taken = true;
    this.player.relics += 1;
    this.player.pebbles += 1; // a pocketed relic leaves a pebble behind
    this.sounds.pickup();
    if (this.level.allRelicsTaken()) {
      this.level.exit.open = true;
      this.sounds.exitOpen();
      this.showMessage('All relics taken — the exit is open. Go!', 3);
    } else {
      this.showMessage(`Relic taken (${this.player.relics}/${this.level.relics.length}).`, 2);
    }
  }

  update(dt) {
    this.time += dt;
    if (this.messageLeft > 0) {
      this.messageLeft -= dt;
      if (this.messageLeft <= 0) this.message = '';
    }
    for (const p of this.pebbles) p.age += dt;
    this.pebbles = this.pebbles.filter((p) => p.age < 1.2);
    if (this.state !== 'playing') return;
    this.elapsed += dt;

    this.player.update(dt, this.level, this.keys, this.sounds);

    // Running feet carry: guards nearby turn toward the noise.
    const noise = this.player.noiseRadiusTiles();
    if (noise > 0) {
      for (const guard of this.guards) guard.hearNoise(this.player.x, this.player.y, noise);
    }

    for (const guard of this.guards) guard.update(dt, this.level, this.player, this.sounds);

    for (const guard of this.guards) {
      if (guard.catches(this.player)) {
        this.sounds.caught();
        this.attempts -= 1;
        this.state = this.attempts > 0 ? 'caught' : 'gameover';
        return;
      }
    }

    if (this.player.atExit(this.level)) {
      this.sounds.levelClear();
      this.state = 'levelclear';
    }
  }

  draw() {
    this.renderer.drawWorld(this, this.time);
    this.renderer.drawHud(this);
    this.renderer.drawMessage(this);
    const r = this.renderer;
    if (this.state === 'title') {
      r.drawScreen('LANTERN HEIST', [
        'A stealth game in the Hollow Archive.',
        'Steal every relic. Reach the exit. Stay out of the cones.',
        '',
        'Click or press Enter to begin · H for help',
      ]);
    } else if (this.state === 'help') {
      r.drawScreen('HOW TO PLAY', [
        'WASD / arrows — move     Shift — sneak (slow, quiet, hard to see)',
        'Mouse click — throw a pebble; guards go to investigate the noise',
        'E — take a relic when close     R — restart the level',
        'P — pause     M — sound on / off',
        'Ferns hide you. Lamps light you up. A full ring over a guard',
        'means he has seen you — break line of sight and slip away.',
      ]);
    } else if (this.state === 'paused') {
      r.drawScreen('PAUSED', ['Press P to keep sneaking.']);
    } else if (this.state === 'caught') {
      r.drawScreen('CAUGHT!', [
        `The watchman caught Moth in the lamplight.`,
        `${this.attempts} ${this.attempts === 1 ? 'lantern' : 'lanterns'} left — press R to try the room again.`,
      ], '#ff5a5a');
    } else if (this.state === 'gameover') {
      r.drawScreen('THE ARCHIVE KEEPS ITS SECRETS', [
        'Out of lanterns. Press Enter to start over from the Reading Room.',
      ], '#ff5a5a');
    } else if (this.state === 'levelclear') {
      r.drawScreen(`${this.level.name.toUpperCase()} — CLEAR`, [
        `Every relic pocketed in ${this.clock}.`,
        this.levelIndex + 1 >= LEVELS.length
          ? 'That was the last room.'
          : 'Click or press Enter for the next room.',
      ], '#7dff9a');
    } else if (this.state === 'win') {
      r.drawScreen('THE HEIST IS DONE', [
        `Moth slips into the night with every relic, in ${this.clock}.`,
        'Three rooms, no alarms that mattered. Press Enter to play again.',
      ], '#ffd970');
    }
  }

  frame(now) {
    const dt = Math.min(0.05, (now - (this._last ?? now)) / 1000 || 0);
    this._last = now;
    if (!this.frozen) this.update(dt);
    this.draw();
  }
}

function boot() {
  const canvas = document.getElementById('game');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const game = new Game(canvas);
  window.__game = game; // for play-testing from the console

  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (shot) {
    applyShot(game, shot);
    game.frozen = true;
    game.time = 12.5; // fixed light so screenshots are deterministic
    game.draw();
    return;
  }
  const loop = (now) => {
    game.frame(now);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

boot();
