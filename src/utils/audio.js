// Sound Controller using ffmpeg generated audio files with fallback support
class SoundController {
  constructor() {
    this.enabled = true;
    this.ctx = null;
    this.matchAudio = null;
    this.winAudio = null;

    if (typeof window !== 'undefined') {
      try {
        const baseUrl = import.meta.env.BASE_URL || '/';
        const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
        this.matchAudio = new Audio(`${cleanBase}sounds/match.mp3`);
        this.winAudio = new Audio(`${cleanBase}sounds/win.mp3`);
        this.matchAudio.preload = 'auto';
        this.winAudio.preload = 'auto';
      } catch {
        // ignore initialization errors
      }
    }
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleSound(force) {
    this.enabled = force !== undefined ? force : !this.enabled;
    return this.enabled;
  }

  // 翻牌音效
  playFlip() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // ignore
    }
  }

  // 配對成功時播放 ffmpeg 產生的短促「叮」聲 (/sounds/match.mp3)
  playMatch() {
    if (!this.enabled) return;

    try {
      if (this.matchAudio) {
        // cloneNode 確保快速連續配對時每次都能即時發聲
        const sound = this.matchAudio.cloneNode();
        sound.volume = 0.85;
        sound.play().catch(() => {});
      } else {
        const baseUrl = import.meta.env.BASE_URL || '/';
        const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
        const sound = new Audio(`${cleanBase}sounds/match.mp3`);
        sound.volume = 0.85;
        sound.play().catch(() => {});
      }
    } catch {
      // fallback
    }
  }

  // 配對失敗音效
  playMismatch() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.16);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.17);
    } catch {
      // ignore
    }
  }

  // 全部完成時播放 ffmpeg 產生的三個音上升勝利旋律 (/sounds/win.mp3)
  playWin() {
    if (!this.enabled) return;

    try {
      if (this.winAudio) {
        this.winAudio.currentTime = 0;
        this.winAudio.volume = 0.95;
        this.winAudio.play().catch(() => {});
      } else {
        const baseUrl = import.meta.env.BASE_URL || '/';
        const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
        const sound = new Audio(`${cleanBase}sounds/win.mp3`);
        sound.volume = 0.95;
        sound.play().catch(() => {});
      }
    } catch {
      // fallback
    }
  }
}

export const soundCtrl = new SoundController();
