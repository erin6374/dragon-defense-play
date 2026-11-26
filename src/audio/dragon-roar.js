// Procedural & Hybrid Cinematic Dragon Roar Engine for Dragon Defense
// Authentically synthesizes apex draconic vocalizations across 4 dramatic contexts:
// 1. 'furious': Protective battle roar when Tech Freire school or block takes damage.
// 2. 'mournful': Deep, sorrowful descending lamentation roar on defeat / game over.
// 3. 'challenge': Commanding, world-shaking roar on boss arrival, mega fire breath, or calling the block.
// 4. 'intense': High-threat combat snarl / battle fury in dense swarms and supersonic dives.

export function createDragonRoarEngine(ctx, destinationBus, playSampleFn) {
  let isMuted = false;
  let lastRoarTime = -999.0;
  const lastRoarTimes = {
    furious: -999.0,
    mournful: -999.0,
    challenge: -999.0,
    intense: -999.0,
    growl: -999.0
  };
  let totalRoarsTriggered = 0;
  let lastRoarVariant = null;

  // Shared 1-second noise buffer for lung air turbulence
  let noiseBuffer = null;
  function getNoiseBuffer() {
    if (!noiseBuffer && ctx) {
      const bufferSize = ctx.sampleRate;
      noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2.0 - 1.0;
      }
    }
    return noiseBuffer;
  }

  // Roar articulation configurations
  const ROAR_PROFILES = {
    // 1. Protective / Furious Roar (School Hit)
    furious: {
      duration: 1.85,
      cooldown: 1.4,
      startPitch: 88,
      peakPitch: 168,
      endPitch: 72,
      attackTime: 0.05,
      flutterRate: 16.5,
      flutterDepth: 22.0,
      tremoloRate: 7.2,
      tremoloDepth: 0.28,
      formant1: 340,
      formant2: 980,
      sampleLayer: 'dragon_roar_furious',
      sampleVolume: 1.05,
      sampleRate: 1.0,
      gainMaster: 1.25
    },

    // 2. Mournful Defeat Roar (Game Over / Defeat)
    mournful: {
      duration: 3.6,
      cooldown: 3.0,
      startPitch: 125,
      peakPitch: 128,
      endPitch: 32, // Melancholic downward pitch droop into infrasound
      attackTime: 0.35,
      flutterRate: 5.8, // Slow shivering vocal cord vibrato
      flutterDepth: 9.0,
      tremoloRate: 4.8,
      tremoloDepth: 0.48,
      formant1: 195,
      formant2: 540,
      sampleLayer: 'dragon_roar_mournful',
      sampleVolume: 1.10,
      sampleRate: 0.98,
      gainMaster: 1.30
    },

    // 3. Challenge / Apex Roar (Boss Arrival, Mega Fire, Call Block)
    challenge: {
      duration: 2.6,
      cooldown: 2.2,
      startPitch: 64,
      peakPitch: 156,
      endPitch: 68,
      attackTime: 0.09,
      flutterRate: 14.5,
      flutterDepth: 25.0,
      tremoloRate: 6.2,
      tremoloDepth: 0.22,
      formant1: 320,
      formant2: 1100,
      sampleLayer: 'dragon_roar_challenge',
      sampleVolume: 1.05,
      sampleRate: 1.0,
      gainMaster: 1.25
    },

    // 4. Intense Combat Roar (High Threat Swarms, Supersonic Dive)
    intense: {
      duration: 1.8,
      cooldown: 2.5,
      startPitch: 92,
      peakPitch: 180,
      endPitch: 64,
      attackTime: 0.04,
      flutterRate: 17.5,
      flutterDepth: 28.0,
      tremoloRate: 8.5,
      tremoloDepth: 0.32,
      formant1: 360,
      formant2: 1100,
      sampleLayer: 'dragon_roar_furious',
      sampleVolume: 0.95,
      sampleRate: 1.12,
      gainMaster: 1.15
    },

    // 5. Combat Growl (Meteor Buster Full-Speed Flight Collision)
    growl: {
      duration: 0.85,
      cooldown: 0.40,
      startPitch: 105,
      peakPitch: 132,
      endPitch: 56,
      attackTime: 0.03,
      flutterRate: 22.0,
      flutterDepth: 30.0,
      tremoloRate: 9.2,
      tremoloDepth: 0.35,
      formant1: 260,
      formant2: 780,
      sampleLayer: 'dragon_roar_furious',
      sampleVolume: 0.90,
      sampleRate: 1.25,
      gainMaster: 1.20
    }
  };

  function triggerRoar(variant = 'furious', opt = {}) {
    if (!ctx || isMuted) return false;

    const profile = ROAR_PROFILES[variant] || ROAR_PROFILES.furious;
    const now = ctx.currentTime;
    const lastForVariant = lastRoarTimes[variant] ?? -999.0;

    // Prevent machine-gun repetition of the same variant
    if (now - lastForVariant < profile.cooldown && variant !== 'mournful') {
      return false;
    }

    // Minimum inter-roar gap between different variants (0.35s) to prevent audio clash
    if (now - lastRoarTime < 0.35 && variant !== 'mournful') {
      return false;
    }

    lastRoarTime = now;
    lastRoarTimes[variant] = now;
    lastRoarVariant = variant;
    totalRoarsTriggered++;

    try {
      const panValue = typeof opt.pan === 'number' ? Math.max(-1, Math.min(1, opt.pan)) : 
                       (typeof opt.x === 'number' ? Math.max(-1, Math.min(1, opt.x / 140)) : 0.0);

      // Stereo panner
      let panner;
      if (ctx.createStereoPanner) {
        panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(panValue, now);
      } else {
        panner = ctx.createGain();
      }

      // Master roar gain node with profile scaling
      const roarGain = ctx.createGain();
      const peakVolume = (opt.volume !== undefined ? opt.volume : 1.0) * profile.gainMaster;
      roarGain.connect(panner);

      if (destinationBus) {
        panner.connect(destinationBus);
      } else {
        panner.connect(ctx.destination);
      }

      // --- 1. Laryngeal Core Oscillator (Sawtooth vocal fold harmonics) ---
      const oscCore = ctx.createOscillator();
      const oscSub = ctx.createOscillator();
      oscCore.type = 'sawtooth';
      oscSub.type = 'triangle';

      // Pitch automation curve
      const peakTime = now + (profile.duration * 0.26);
      const endTime = now + profile.duration;

      oscCore.frequency.setValueAtTime(profile.startPitch, now);
      oscCore.frequency.linearRampToValueAtTime(profile.peakPitch, peakTime);
      oscCore.frequency.exponentialRampToValueAtTime(Math.max(20, profile.endPitch), endTime);

      oscSub.frequency.setValueAtTime(profile.startPitch * 0.5, now);
      oscSub.frequency.linearRampToValueAtTime(profile.peakPitch * 0.5, peakTime);
      oscSub.frequency.exponentialRampToValueAtTime(Math.max(16, profile.endPitch * 0.5), endTime);

      // Throat Flutter LFO (Frequency Modulation)
      const flutterLFO = ctx.createOscillator();
      const flutterGain = ctx.createGain();
      flutterLFO.type = 'sine';
      flutterLFO.frequency.setValueAtTime(profile.flutterRate, now);
      flutterGain.gain.setValueAtTime(profile.flutterDepth, now);

      flutterLFO.connect(flutterGain);
      flutterGain.connect(oscCore.frequency);
      flutterGain.connect(oscSub.frequency);
      flutterLFO.start(now);
      flutterLFO.stop(endTime);

      // --- 2. Dual Formant Cavity Filter Bank (Acoustic Maw Resonance) ---
      const formantFilter1 = ctx.createBiquadFilter();
      formantFilter1.type = 'peaking';
      formantFilter1.frequency.setValueAtTime(profile.formant1, now);
      formantFilter1.Q.setValueAtTime(3.2, now);
      formantFilter1.gain.setValueAtTime(12.0, now);

      const formantFilter2 = ctx.createBiquadFilter();
      formantFilter2.type = 'peaking';
      formantFilter2.frequency.setValueAtTime(profile.formant2, now);
      formantFilter2.Q.setValueAtTime(2.6, now);
      formantFilter2.gain.setValueAtTime(8.5, now);

      const lowpassMaw = ctx.createBiquadFilter();
      lowpassMaw.type = 'lowpass';
      lowpassMaw.frequency.setValueAtTime(variant === 'mournful' ? 950 : 2800, now);
      lowpassMaw.frequency.exponentialRampToValueAtTime(450, endTime);

      // WaveShaper Distortion (Draconic vocal cord growl saturation)
      const shaper = ctx.createWaveShaper();
      const curveLen = 512;
      const curve = new Float32Array(curveLen);
      for (let i = 0; i < curveLen; i++) {
        const x = (i * 2) / curveLen - 1;
        curve[i] = Math.tanh(x * 1.85);
      }
      shaper.curve = curve;
      shaper.oversample = '2x';

      // Amplitude Envelope
      roarGain.gain.setValueAtTime(0.001, now);
      roarGain.gain.linearRampToValueAtTime(peakVolume, now + profile.attackTime);
      roarGain.gain.exponentialRampToValueAtTime(0.001, endTime);

      // Wire oscillator voice
      oscCore.connect(shaper);
      oscSub.connect(shaper);
      shaper.connect(formantFilter1);
      formantFilter1.connect(formantFilter2);
      formantFilter2.connect(lowpassMaw);
      lowpassMaw.connect(roarGain);

      oscCore.start(now);
      oscSub.start(now);
      oscCore.stop(endTime);
      oscSub.stop(endTime);

      // --- 3. Breath Turbulence Noise Layer (Air rushing through teeth) ---
      const noise = getNoiseBuffer();
      if (noise) {
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noise;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(1400, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(variant === 'mournful' ? 600 : 2600, now + profile.attackTime);
        noiseFilter.frequency.exponentialRampToValueAtTime(800, endTime);
        noiseFilter.Q.setValueAtTime(1.8, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.001, now);
        noiseGain.gain.linearRampToValueAtTime(peakVolume * 0.42, now + profile.attackTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, endTime);

        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(panner);

        noiseSource.start(now);
        noiseSource.stop(endTime);
      }

      // --- 4. Acoustic Foley Hybrid Layer (From SoundEngine manifest) ---
      if (playSampleFn && profile.sampleLayer) {
        playSampleFn(profile.sampleLayer, {
          volume: profile.sampleVolume * (opt.volume !== undefined ? opt.volume : 1.0),
          playbackRate: profile.sampleRate,
          pan: panValue
        });
      }

      return true;
    } catch (e) {
      console.warn('DragonRoar synthesis error', e);
      return false;
    }
  }

  function setMuted(val) {
    isMuted = !!val;
  }

  function getStats() {
    return {
      lastRoarTime: lastRoarTime < 0 ? 0 : +lastRoarTime.toFixed(3),
      totalRoars: totalRoarsTriggered,
      lastVariant: lastRoarVariant,
      muted: isMuted
    };
  }

  return {
    triggerRoar,
    setMuted,
    getStats
  };
}
