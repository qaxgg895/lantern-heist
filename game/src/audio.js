// Lantern Heist — all sound is synthesized with WebAudio, no audio files.
// A soft pad hums underneath; footsteps tick, pebbles clink, the alarm stings.

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.padNodes = null;
    this.lastStep = 0;
  }

  ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.startPad();
  }

  resume() {
    this.ensure();
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
  }

  startPad() {
    const ctx = this.ctx;
    const gain = ctx.createGain();
    gain.gain.value = 0.035;
    gain.connect(ctx.destination);
    const o1 = ctx.createOscillator();
    o1.type = 'sine';
    o1.frequency.value = 55;
    const o2 = ctx.createOscillator();
    o2.type = 'triangle';
    o2.frequency.value = 110.3;
    const g2 = ctx.createGain();
    g2.gain.value = 0.4;
    o1.connect(gain);
    o2.connect(g2);
    g2.connect(gain);
    o1.start();
    o2.start();
    this.padNodes = { gain };
  }

  blip(freq, dur, type, vol, when = 0) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  step(sneaking) {
    if (!this.ctx || this.muted) return;
    const now = performance.now();
    if (now - this.lastStep < (sneaking ? 340 : 230)) return;
    this.lastStep = now;
    this.blip(sneaking ? 190 : 150, 0.07, 'sine', sneaking ? 0.03 : 0.06);
  }

  pebbleThrow() {
    this.blip(720, 0.08, 'sine', 0.08);
  }

  pebbleClink() {
    this.blip(1560, 0.1, 'triangle', 0.12);
    this.blip(1180, 0.14, 'triangle', 0.09, 0.07);
  }

  pickup() {
    this.blip(660, 0.12, 'sine', 0.1);
    this.blip(880, 0.14, 'sine', 0.1, 0.09);
    this.blip(1320, 0.22, 'sine', 0.09, 0.18);
  }

  alert() {
    this.blip(220, 0.22, 'sawtooth', 0.11);
    this.blip(311, 0.3, 'sawtooth', 0.11, 0.16);
  }

  caught() {
    this.blip(196, 0.35, 'sawtooth', 0.13);
    this.blip(147, 0.55, 'sawtooth', 0.13, 0.22);
  }

  exitOpen() {
    this.blip(523, 0.16, 'sine', 0.09);
    this.blip(784, 0.3, 'sine', 0.09, 0.12);
  }

  levelClear() {
    [523, 659, 784, 1047].forEach((f, i) => this.blip(f, 0.3, 'sine', 0.1, i * 0.11));
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
}
