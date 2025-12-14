import { Howl, Howler } from 'howler';
import { WeaponType } from '@/store/gameStore';

// Audio URLs using Web Audio API oscillator for sound synthesis
// Since we don't have actual audio files, we'll generate sounds programmatically

class SoundGenerator {
  private audioContext: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  playShoot(weaponType: WeaponType, volume: number = 0.5): void {
    const ctx = this.getContext();
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.value = volume;

    const oscillator = ctx.createOscillator();
    const noise = ctx.createOscillator();

    switch (weaponType) {
      case 'pistol':
        oscillator.frequency.setValueAtTime(150, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        oscillator.connect(gainNode);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
        break;

      case 'rifle':
        oscillator.frequency.setValueAtTime(200, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        oscillator.connect(gainNode);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.05);
        break;

      case 'shotgun':
        // Louder, longer boom for shotgun
        const noiseGain = ctx.createGain();
        noiseGain.connect(ctx.destination);
        noiseGain.gain.value = volume * 0.8;
        noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        const bufferSize = ctx.sampleRate * 0.3;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        noiseSource.connect(filter);
        filter.connect(noiseGain);
        noiseSource.start(ctx.currentTime);
        noiseSource.stop(ctx.currentTime + 0.3);
        break;
    }
  }

  playHit(volume: number = 0.5): void {
    const ctx = this.getContext();
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.value = volume * 0.6;
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    const oscillator = ctx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);

    oscillator.connect(gainNode);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  }

  playExplosion(volume: number = 0.5): void {
    const ctx = this.getContext();
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.value = volume * 0.7;
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5);

    noiseSource.connect(filter);
    filter.connect(gainNode);
    noiseSource.start(ctx.currentTime);
  }

  playReload(volume: number = 0.5): void {
    const ctx = this.getContext();
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.value = volume * 0.4;

    // Click sound 1
    const osc1 = ctx.createOscillator();
    osc1.type = 'square';
    osc1.frequency.value = 1000;
    osc1.connect(gainNode);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.02);

    // Click sound 2
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      gain2.connect(ctx.destination);
      gain2.gain.value = volume * 0.4;
      osc2.type = 'square';
      osc2.frequency.value = 800;
      osc2.connect(gain2);
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 0.02);
    }, 200);

    // Chamber slide
    setTimeout(() => {
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      gain3.connect(ctx.destination);
      gain3.gain.value = volume * 0.3;
      gain3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc3.type = 'sawtooth';
      osc3.frequency.setValueAtTime(300, ctx.currentTime);
      osc3.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.1);
      osc3.connect(gain3);
      osc3.start(ctx.currentTime);
      osc3.stop(ctx.currentTime + 0.1);
    }, 400);
  }

  playEmpty(volume: number = 0.5): void {
    const ctx = this.getContext();
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.value = volume * 0.3;
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    const oscillator = ctx.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.value = 500;

    oscillator.connect(gainNode);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
  }

  playWeaponSwitch(volume: number = 0.5): void {
    const ctx = this.getContext();
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.value = volume * 0.3;
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    const oscillator = ctx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, ctx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.05);
    oscillator.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.1);

    oscillator.connect(gainNode);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  }
}

export const audioManager = new SoundGenerator();
