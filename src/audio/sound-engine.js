// High-Fidelity Synthesized Web Audio Engine for Dragon Defense
// Provides procedural noise synthesis, resonant biquad filtering, FM modulation,
// continuous atmospheric sub-bass celestial rumble, and per-entity audio cues.

export function createSoundEngine() {
  let ctx = null;
  let muted = false;
  let masterGain = null;
  let rumbleGain = null;
  let rumbleOsc = null;
  let rumbleOsc2 = null;
  let rumbleFilter = null;
  let noiseBuffer = null;
  let pinkNoiseBuffer = null;

  function init() {
    if (ctx) return ctx;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
      masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(muted ? 0 : 1, ctx.currentTime);
      masterGain.connect(ctx.destination);

      // Generate procedural white and pink noise buffers (2 seconds each)
      const sampleRate = ctx.sampleRate;
      const bufferSize = sampleRate * 2;
      noiseBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      pinkNoiseBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
      const pOutput = pinkNoiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        pOutput[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }

      // Initialize continuous Sub-Bass Titan Celestial Rumble
      rumbleGain = ctx.createGain();
      rumbleGain.gain.setValueAtTime(0.0001, ctx.currentTime);

      rumbleFilter = ctx.createBiquadFilter();
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.setValueAtTime(68, ctx.currentTime);
      rumbleFilter.Q.setValueAtTime(2.8, ctx.currentTime);

      rumbleOsc = ctx.createOscillator();
      rumbleOsc.type = 'sine';
      rumbleOsc.frequency.setValueAtTime(42, ctx.currentTime);

      rumbleOsc2 = ctx.createOscillator();
      rumbleOsc2.type = 'triangle';
      rumbleOsc2.frequency.setValueAtTime(46.5, ctx.currentTime);

      rumbleOsc.connect(rumbleFilter);
      rumbleOsc2.connect(rumbleFilter);
      rumbleFilter.connect(rumbleGain);
      rumbleGain.connect(masterGain);

      rumbleOsc.start();
      rumbleOsc2.start();
    } catch (e) {
      console.warn('AudioContext init failed', e);
    }
    return ctx;
  }

  function playNoise(duration, filterType, startFreq, endFreq, peakGain, Q = 1.0, isPink = false) {
    if (!ctx || muted) return;
    try {
      const now = ctx.currentTime;
      const buf = (isPink && pinkNoiseBuffer) ? pinkNoiseBuffer : (noiseBuffer || null);
      if (!buf) return;

      const source = ctx.createBufferSource();
      source.buffer = buf;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = filterType;
      filter.Q.setValueAtTime(Q, now);
      filter.frequency.setValueAtTime(startFreq, now);
      if (endFreq !== startFreq) {
        filter.frequency.exponentialRampToValueAtTime(Math.max(10, endFreq), now + duration);
      }

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peakGain), now + Math.min(0.03, duration * 0.2));
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      source.start(now);
      source.stop(now + duration + 0.05);
    } catch (e) {
      // safe fallback
    }
  }

  function playTone(type, startFreq, endFreq, duration, peakGain) {
    if (!ctx || muted) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(10, startFreq), now);
      if (endFreq !== startFreq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(10, endFreq), now + duration);
      }
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(peakGain, now + Math.min(0.02, duration * 0.15));
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + duration + 0.03);
    } catch (e) {
      // safe fallback
    }
  }

  function playFM(carrierFreq, modFreq, modIndex, duration, peakGain) {
    if (!ctx || muted) return;
    try {
      const now = ctx.currentTime;
      const carrier = ctx.createOscillator();
      const modulator = ctx.createOscillator();
      const modGain = ctx.createGain();
      const gain = ctx.createGain();

      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(carrierFreq, now);

      modulator.type = 'sine';
      modulator.frequency.setValueAtTime(modFreq, now);

      modGain.gain.setValueAtTime(modFreq * modIndex, now);
      modGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      modulator.connect(modGain);
      modGain.connect(carrier.frequency);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      carrier.connect(gain);
      gain.connect(masterGain);

      carrier.start(now);
      modulator.start(now);
      carrier.stop(now + duration + 0.02);
      modulator.stop(now + duration + 0.02);
    } catch (e) {
      // safe fallback
    }
  }

  // Flamethrower looping sound state
  let flameLoopSource = null;
  let flameLoopGain = null;
  let flameLoopFilter = null;

  function setFlameStreamAudio(active, isMega = false) {
    if (!ctx || muted) return;
    try {
      const now = ctx.currentTime;
      if (active) {
        if (!flameLoopSource && noiseBuffer) {
          flameLoopSource = ctx.createBufferSource();
          flameLoopSource.buffer = noiseBuffer;
          flameLoopSource.loop = true;

          flameLoopFilter = ctx.createBiquadFilter();
          flameLoopFilter.type = 'bandpass';
          flameLoopFilter.frequency.setValueAtTime(isMega ? 520 : 740, now);
          flameLoopFilter.Q.setValueAtTime(2.2, now);

          flameLoopGain = ctx.createGain();
          flameLoopGain.gain.setValueAtTime(0.0001, now);
          flameLoopGain.gain.exponentialRampToValueAtTime(isMega ? 0.22 : 0.16, now + 0.08);

          flameLoopSource.connect(flameLoopFilter);
          flameLoopFilter.connect(flameLoopGain);
          flameLoopGain.connect(masterGain);
          flameLoopSource.start();
        } else if (flameLoopFilter && flameLoopGain) {
          flameLoopFilter.frequency.setTargetAtTime(isMega ? 520 : 740, now, 0.05);
          flameLoopGain.gain.setTargetAtTime(isMega ? 0.22 : 0.16, now, 0.05);
        }
      } else {
        if (flameLoopGain && flameLoopSource) {
          flameLoopGain.gain.setTargetAtTime(0.0001, now, 0.08);
          setTimeout(() => {
            try {
              if (flameLoopSource) {
                flameLoopSource.stop();
                flameLoopSource.disconnect();
                flameLoopSource = null;
              }
              if (flameLoopGain) {
                flameLoopGain.disconnect();
                flameLoopGain = null;
              }
            } catch (err) {}
          }, 120);
        }
      }
    } catch (e) {
      // safe fallback
    }
  }

  function sound(kind, opt = {}) {
    if (muted) return;
    init();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    switch (kind) {
      // Multi-layer Meteor / Bombardment Impact
      case 'impact':
      case 'crash': {
        // Layer 1: Sub-thud punch
        playTone('sine', 180, 24, 0.55, 0.22);
        // Layer 2: Resonant noise blast
        playNoise(0.65, 'lowpass', 850, 60, 0.24, 3.2, true);
        break;
      }

      // Building Collapse / Structural Shatter
      case 'buildingCollapse': {
        playTone('sawtooth', 95, 20, 0.85, 0.18);
        playNoise(1.1, 'bandpass', 620, 90, 0.28, 2.0, true);
        break;
      }

      // Meteor Collision in Mid-Air
      case 'meteorCollision': {
        playTone('triangle', 320, 55, 0.45, 0.19);
        playNoise(0.48, 'bandpass', 1100, 180, 0.22, 4.5, false);
        break;
      }

      // Dragon Fireball Launch
      case 'shoot': {
        playTone('triangle', 580, 190, 0.16, 0.14);
        playNoise(0.12, 'highpass', 400, 1200, 0.06, 1.2, false);
        break;
      }

      // Intercept / Precision Hit
      case 'intercept': {
        playTone('triangle', 920, 280, 0.24, 0.15);
        playNoise(0.20, 'bandpass', 1400, 300, 0.10, 3.0, false);
        break;
      }

      // Powerup Pickup / Sparkle Chime
      case 'bonus': {
        const now = ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          setTimeout(() => {
            playTone('sine', freq, freq * 1.05, 0.22, 0.12);
          }, idx * 45);
        });
        break;
      }

      // High-Tech Satellite Laser Strike
      case 'satLaser': {
        playTone('sawtooth', 2600, 280, 0.14, 0.12);
        playTone('square', 1400, 180, 0.10, 0.06);
        break;
      }

      // Electric Arc / Satellite Shock Defense
      case 'shock':
      case 'satShield': {
        playFM(840, 120, 6.0, 0.35, 0.18);
        playNoise(0.25, 'highpass', 1600, 2400, 0.09, 2.5, false);
        break;
      }

      // Dragon Footstep on Broad Street Pavement
      case 'dragonStep': {
        playNoise(0.045, 'bandpass', 1200, 400, 0.08, 2.0, true);
        playTone('sine', 110, 45, 0.06, 0.09);
        break;
      }

      // Dragon Shoving Car / Props
      case 'carCrunch': {
        playFM(340, 75, 4.2, 0.28, 0.16);
        playNoise(0.30, 'bandpass', 900, 250, 0.15, 2.4, false);
        break;
      }

      // Purple Ramming Detonation
      case 'purpleRamHit': {
        playTone('sine', 480, 40, 0.45, 0.26);
        playFM(980, 180, 8.5, 0.35, 0.22);
        playNoise(0.5, 'bandpass', 1800, 140, 0.25, 3.8, true);
        break;
      }

      // Victory Fanfare / Wave Win
      case 'waveWin': {
        const notes = [440, 554.37, 659.25, 880, 1108.73];
        notes.forEach((freq, idx) => {
          setTimeout(() => {
            playTone('triangle', freq, freq * 1.02, 0.38, 0.16);
          }, idx * 75);
        });
        break;
      }

      // Classic Sounds Retained with Enhanced Fidelity
      case 'siren':
        playTone('sine', 520, 780, 0.35, 0.06);
        break;
      case 'car':
        playTone('sawtooth', 190, 105, 0.25, 0.08);
        break;
      case 'fire':
        playNoise(0.35, 'bandpass', 550, 180, 0.10, 2.0, true);
        break;
      case 'helicopter':
        playTone('sawtooth', 105, 78, 0.38, 0.06);
        playNoise(0.18, 'lowpass', 180, 70, 0.08, 1.5, true);
        break;
      case 'gas':
        playNoise(0.45, 'bandpass', 850, 120, 0.12, 1.8, false);
        break;
      case 'warning':
        playTone('square', 950, 620, 0.20, 0.09);
        break;
      case 'steam':
        playNoise(0.28, 'highpass', 1200, 400, 0.08, 1.0, false);
        break;
      case 'combo':
        playTone('triangle', 480, 1400, 0.35, 0.15);
        break;
      case 'nearmiss':
        playTone('sine', 260, 720, 0.22, 0.11);
        break;
      case 'fanfare':
        playTone('triangle', 520, 1040, 0.45, 0.16);
        break;

      default:
        playTone('triangle', 220, 110, 0.25, 0.1);
        break;
    }
  }

  // Update dynamic atmospheric audio parameters (Sub-Bass Titan celestial rumble)
  function update(dt, cameraAltitude, titanAltitude, titanOnScreen) {
    if (!ctx || muted || !rumbleGain) return;
    try {
      const now = ctx.currentTime;
      // Rumble intensifies as altitude approaches orbit (y > 70) and Titan is on screen
      const altNorm = Math.min(1.0, Math.max(0.0, (cameraAltitude - 30) / 280));
      const targetVolume = (titanOnScreen ? 0.18 : 0.04) * (0.15 + altNorm * 0.85);
      rumbleGain.gain.setTargetAtTime(targetVolume, now, 0.25);

      if (rumbleOsc && rumbleFilter) {
        // Slow seismic wobble modulation
        const wobble = Math.sin(now * 1.8) * 3.5;
        rumbleOsc.frequency.setTargetAtTime(42 + wobble, now, 0.1);
        rumbleFilter.frequency.setTargetAtTime(65 + wobble * 2.5, now, 0.1);
      }
    } catch (e) {}
  }

  function setMuted(val) {
    muted = !!val;
    if (masterGain && ctx) {
      masterGain.gain.setValueAtTime(muted ? 0 : 1, ctx.currentTime);
    }
    if (muted && flameLoopGain && ctx) {
      flameLoopGain.gain.setValueAtTime(0, ctx.currentTime);
    }
  }

  function isMuted() {
    return muted;
  }

  return {
    init,
    sound,
    setFlameStreamAudio,
    update,
    setMuted,
    isMuted
  };
}
