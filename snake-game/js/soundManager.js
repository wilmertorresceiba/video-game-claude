export class SoundManager {
  constructor() {
    this.enabled = true;
    this.audioContext = null;
  }

  getContext() {
    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContextClass();
    }
    return this.audioContext;
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  playTone(frequency, duration, type = 'sine') {
    if (!this.enabled) return;

    const context = this.getContext();
    if (context.state === 'suspended') {
      context.resume();
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(0.15, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }

  playEat() {
    this.playTone(660, 0.1, 'square');
  }

  playGameOver() {
    this.playTone(220, 0.4, 'sawtooth');
  }

  playLevelUp() {
    this.playTone(880, 0.2, 'triangle');
  }
}
