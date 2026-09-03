class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = globalThis.localStorage?.getItem('counter_sound_enabled') !== 'false';
  }

  initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    try {
      globalThis.localStorage?.setItem('counter_sound_enabled', String(this.enabled));
    } catch {
      // Storage unavailable
    }
    if (this.enabled) {
      this.playTone(600, 'sine', 0.08);
    }
    return this.enabled;
  }

  playTone(freq, type = 'sine', duration = 0.08, endFreq = null) {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const now = this.ctx.currentTime;
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (endFreq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), now + duration);
      }

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Audio not permitted or unsupported
    }
  }

  play(sound) {
    if (!this.enabled) return;
    switch (sound) {
      case 'increment':
        this.playTone(520, 'sine', 0.08, 680);
        break;
      case 'decrement':
        this.playTone(420, 'sine', 0.08, 300);
        break;
      case 'reset':
        this.playTone(400, 'triangle', 0.18, 180);
        break;
      case 'undo':
        this.playTone(360, 'sine', 0.06);
        setTimeout(() => this.playTone(540, 'sine', 0.08), 50);
        break;
      case 'multiplier':
        this.playTone(300, 'sine', 0.12, 900);
        break;
      case 'goal':
        // 3-note celebration arpeggio: C5 -> E5 -> G5
        this.playTone(523.25, 'triangle', 0.1);
        setTimeout(() => this.playTone(659.25, 'triangle', 0.1), 90);
        setTimeout(() => this.playTone(783.99, 'triangle', 0.22), 180);
        break;
      default:
        this.playTone(440, 'sine', 0.05);
    }
  }
}

export const sounds = new SoundManager();
