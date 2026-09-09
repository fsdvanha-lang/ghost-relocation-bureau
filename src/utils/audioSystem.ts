// Pure Web Audio API Sound Synthesizer for Luxury Digital Product Experience
// Completely self-contained: zero external MP3s, zero network requests, instant 60fps response.

class AudioSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('bureau_sound_enabled');
      this.isMuted = stored === 'false';
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('bureau_sound_enabled', (!this.isMuted).toString());
    }
    if (!this.isMuted) {
      this.playClick();
    }
    return !this.isMuted;
  }

  public getIsEnabled(): boolean {
    return !this.isMuted;
  }

  // Disabled for B2B operational UX: no annoying buzzes on mousemove
  public playHover() {
    // Meaningful audio feedback is reserved for clicks, matching resolution and actions
  }

  // Crisp luxury tactile click
  public playClick() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.045);
    } catch {
      // Ignore
    }
  }

  // Deep resonant scanning pulse (used in Auto-Matching HUD)
  public playScanPulse() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(85, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(140, this.ctx.currentTime + 0.12);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.15);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.16);
    } catch {
      // Ignore
    }
  }

  // Ethereal chord resolve when match locks
  public playMatchSuccess() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      const ctx = this.ctx;
      if (!ctx) return;

      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.04);

        gain.gain.setValueAtTime(0.03, ctx.currentTime + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6 + i * 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + i * 0.04);
        osc.stop(ctx.currentTime + 0.65 + i * 0.04);
      });
    } catch {
      // Ignore
    }
  }
}

export const sound = new AudioSystem();
