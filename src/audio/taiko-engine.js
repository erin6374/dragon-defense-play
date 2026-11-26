// Dynamic Japanese War Drum (Taiko) Percussion Engine for Dragon Defense
// Authentically modeled on Kodō Ō-daiko ensemble war drumming (Jo-Ha-Kyū progression)
// Features physical acoustic synthesis for Ō-daiko, Chū-daiko, Shime-daiko, and Bachi rim clicks.
// Dynamically modulates tempo (108 -> 132 BPM), syncopation, and intensity with gameplay action.

export function createTaikoEngine(ctx, destinationBus, playSampleFn = null) {
  let isRunning = false;
  let isMuted = false;
  let masterGain = null;
  let limiter = null;

  // Pre-cached noise buffer for mallet attack transients (zero garbage collection)
  let noiseBuffer = null;

  // Sequencer clock state
  let timerId = null;
  let currentStep = 0;
  let nextNoteTime = 0;
  const lookaheadMs = 35.0; // Interval for scheduler tick
  const scheduleAheadTime = 0.12; // Lookahead schedule window in seconds

  // Dynamic battle state & threat evaluation
  let currentThreat = 0.0;
  let targetThreat = 0.0;
  let smoothedBPM = 108.0;
  let currentTier = 'jo'; // 'jo' | 'ha' | 'kyu' | 'climax'
  let bachiHand = 0; // Alternates left (-1) and right (+1) for stereo depth
  let totalHitsTriggered = 0;
  let lastTelemetry = null;

  // Pattern matrices: 16 steps per bar (16th notes in 4/4)
  const PATTERNS = {
    // Jo (序): Solemn, spacious solitary Ō-daiko heartbeat + distant bachi rim timekeeping
    jo: {
      odaiko:   [1.0, 0, 0, 0,  0, 0, 0, 0,  0.8, 0, 0, 0,  0, 0, 0, 0],
      chudaiko: [0,   0, 0, 0,  0, 0, 0, 0,  0,   0, 0, 0,  0, 0, 0, 0],
      shime:    [0,   0, 0, 0,  0, 0, 0, 0,  0,   0, 0, 0,  0, 0, 0, 0],
      rim:      [0,   0, 0.45, 0,  0, 0, 0.45, 0,  0, 0, 0.45, 0,  0, 0, 0.55, 0]
    },

    // Ha (破): Driving battle gallop (Kodō galloping cadence, "DON... don-don-DON, don-tsuku-DON!")
    ha: {
      odaiko:   [1.0, 0, 0, 0,    0, 0, 0.75, 0,  0.88, 0, 0, 0,    0, 0.65, 0, 0],
      chudaiko: [0.92, 0, 0.65, 0,  0.82, 0.55, 0, 0.75,  0.92, 0, 0.65, 0,  0.82, 0, 0.55, 0.75],
      shime:    [0, 0, 0, 0,      0.55, 0, 0, 0,  0, 0, 0, 0,       0.65, 0, 0.55, 0],
      rim:      [0, 0.55, 0, 0,   0, 0.55, 0, 0,  0, 0.55, 0, 0,    0, 0, 0.65, 0.85]
    },

    // Kyū (急): High threat war storm, syncopated Shime-daiko rolls & fierce rim-shots
    kyu: {
      odaiko:   [1.0, 0, 0, 0.65,   0, 0.75, 0, 0,    0.92, 0, 0, 0.75,   0.85, 0, 0.75, 0],
      chudaiko: [0.95, 0.55, 0.75, 0,  0.88, 0.65, 0.85, 0.55,  0.95, 0.65, 0.8, 0,   0.88, 0.75, 0.95, 0.65],
      shime:    [0.75, 0.55, 0.85, 0.65,  0.75, 0.95, 0.65, 0.75,  0.85, 0.65, 0.75, 0.95,  0.8, 0.85, 0.98, 0.75],
      rim:      [0, 0.75, 0, 0.65,  0, 0.85, 0, 0.55,  0, 0.75, 0, 0.65,  0.85, 0.95, 0.75, 1.0]
    },

    // Climax (怒り): Maximum intensity armada frenzy (Wave 15 Colossus / Boss Encounter)
    climax: {
      odaiko:   [1.0, 0.65, 0, 0.85,   0.75, 0.95, 0, 0.75,   1.0, 0.75, 0, 0.88,   0.85, 0.98, 0.75, 0.85],
      chudaiko: [0.98, 0.75, 0.88, 0.65,  0.95, 0.78, 0.88, 0.75,  0.98, 0.85, 0.92, 0.75,  0.95, 0.88, 0.98, 0.85],
      shime:    [0.88, 0.75, 0.95, 0.78,  0.85, 0.98, 0.78, 0.88,  0.95, 0.85, 0.88, 0.98,  0.95, 0.88, 1.0, 0.95],
      rim:      [0.65, 0.85, 0.55, 0.95,  0.65, 0.98, 0.75, 0.85,  0.65, 0.88, 0.75, 0.95,  0.88, 1.0, 0.95, 1.0]
    }
  };

  function initNodes() {
    if (!ctx || masterGain) return;

    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(isMuted ? 0 : 1.25, ctx.currentTime);

    // Warm analog saturation limiter for cinematic punch without harsh digital clipping
    limiter = ctx.createDynamicsCompressor();
    limiter.threshold.setValueAtTime(-6.0, ctx.currentTime);
    limiter.knee.setValueAtTime(6.0, ctx.currentTime);
    limiter.ratio.setValueAtTime(5.0, ctx.currentTime);
    limiter.attack.setValueAtTime(0.002, ctx.currentTime);
    limiter.release.setValueAtTime(0.18, ctx.currentTime);

    masterGain.connect(limiter);
    if (destinationBus) {
      limiter.connect(destinationBus);
    } else {
      limiter.connect(ctx.destination);
    }

    // Allocate single shared 1-second noise buffer for stick transient synthesis
    try {
      const bufferSize = ctx.sampleRate;
      noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2.0 - 1.0;
      }
    } catch (e) {
      noiseBuffer = null;
    }
  }

  function createPanner(panValue) {
    if (ctx.createStereoPanner) {
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(Math.max(-1.0, Math.min(1.0, panValue)), ctx.currentTime);
      return panner;
    }
    return ctx.createGain();
  }

  // --- Physical Modeling Acoustic Synthesis ---

  // 1. Ō-daiko (Giant Sacred War Drum)
  // Deep sub-bass chest thud: dual Bessel membrane modes + leather mallet slap
  function playOdaiko(time, velocity = 1.0, pan = 0.0) {
    if (!ctx || isMuted || !masterGain) return;
    try {
      const vel = Math.max(0.1, Math.min(1.2, velocity));
      const panner = createPanner(pan);
      panner.connect(masterGain);

      // Fundamental Bessel mode: 58 Hz dropping to 39 Hz
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(58.0 + (vel * 12.0), time);
      osc1.frequency.exponentialRampToValueAtTime(39.0, time + 0.16);

      gain1.gain.setValueAtTime(0.88 * vel, time);
      gain1.gain.exponentialRampToValueAtTime(0.001, time + 1.4);

      // First overtone Bessel mode (1.59x fundamental): ~92 Hz dropping to ~62 Hz
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime((58.0 + (vel * 12.0)) * 1.59, time);
      osc2.frequency.exponentialRampToValueAtTime(39.0 * 1.59, time + 0.12);

      gain2.gain.setValueAtTime(0.32 * vel, time);
      gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

      // Mallet leather impact transient (bandpassed noise burst)
      if (noiseBuffer) {
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(450.0, time);
        noiseFilter.Q.setValueAtTime(2.2, time);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.55 * vel, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(panner);

        noise.start(time);
        noise.stop(time + 0.05);
      }

      // Cedar wood acoustic body resonance
      const bodyFilter = ctx.createBiquadFilter();
      bodyFilter.type = 'lowpass';
      bodyFilter.frequency.setValueAtTime(140.0, time);

      osc1.connect(gain1);
      osc2.connect(gain2);
      gain1.connect(bodyFilter);
      gain2.connect(bodyFilter);
      bodyFilter.connect(panner);

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + 1.45);
      osc2.stop(time + 0.5);

      if (playSampleFn) {
        playSampleFn('taiko_odaiko_deep', { volume: 1.10 * vel, pan, bus: destinationBus });
      }
      totalHitsTriggered++;
    } catch (e) {}
  }

  // 2. Chū-daiko (Medium Barrel War Drum)
  // The galloping engine: 135 Hz dropping to 84 Hz with tight body resonance
  function playChudaiko(time, velocity = 1.0, pan = -0.15) {
    if (!ctx || isMuted || !masterGain) return;
    try {
      const vel = Math.max(0.1, Math.min(1.2, velocity));
      const panner = createPanner(pan);
      panner.connect(masterGain);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(138.0 + (vel * 22.0), time);
      osc.frequency.exponentialRampToValueAtTime(84.0, time + 0.08);

      gain.gain.setValueAtTime(0.72 * vel, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.42);

      // Mallet slap
      if (noiseBuffer) {
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(850.0, time);
        noiseFilter.Q.setValueAtTime(3.0, time);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.42 * vel, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(panner);

        noise.start(time);
        noise.stop(time + 0.04);
      }

      const bodyFilter = ctx.createBiquadFilter();
      bodyFilter.type = 'bandpass';
      bodyFilter.frequency.setValueAtTime(125.0, time);
      bodyFilter.Q.setValueAtTime(1.8, time);

      osc.connect(gain);
      gain.connect(bodyFilter);
      bodyFilter.connect(panner);

      osc.start(time);
      osc.stop(time + 0.45);

      if (playSampleFn) {
        playSampleFn('taiko_chudaiko_punch', { volume: 0.95 * vel, pan, bus: destinationBus });
      }
      totalHitsTriggered++;
    } catch (e) {}
  }

  // 3. Shime-daiko (High-Tension Roped War Drum)
  // Crisp, snappy, high-pitched double-time roll membrane
  function playShimedaiko(time, velocity = 1.0, pan = 0.35) {
    if (!ctx || isMuted || !masterGain) return;
    try {
      const vel = Math.max(0.1, Math.min(1.2, velocity));
      const panner = createPanner(pan);
      panner.connect(masterGain);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320.0 + (vel * 40.0), time);
      osc.frequency.exponentialRampToValueAtTime(195.0, time + 0.045);

      gain.gain.setValueAtTime(0.58 * vel, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

      // High stick snap
      if (noiseBuffer) {
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(1200.0, time);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.38 * vel, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(panner);

        noise.start(time);
        noise.stop(time + 0.03);
      }

      osc.connect(gain);
      gain.connect(panner);

      osc.start(time);
      osc.stop(time + 0.20);

      totalHitsTriggered++;
    } catch (e) {}
  }

  // 4. Bachi Rim Click ("Ka" / "Kara")
  // Hard wooden bachi strike against the iron-studded drum rim
  function playRim(time, velocity = 1.0, pan = 0.15) {
    if (!ctx || isMuted || !masterGain) return;
    try {
      const vel = Math.max(0.1, Math.min(1.2, velocity));
      const panner = createPanner(pan);
      panner.connect(masterGain);

      // High resonant wooden pitch ping
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1850.0, time);
      osc.frequency.exponentialRampToValueAtTime(1250.0, time + 0.02);

      gain.gain.setValueAtTime(0.18 * vel, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

      // Rim crack noise
      if (noiseBuffer) {
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(2400.0, time);
        noiseFilter.Q.setValueAtTime(3.5, time);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.20 * vel, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(panner);

        noise.start(time);
        noise.stop(time + 0.03);
      }

      osc.connect(gain);
      gain.connect(panner);

      osc.start(time);
      osc.stop(time + 0.035);

      totalHitsTriggered++;
    } catch (e) {}
  }

  // --- Sequencer Clock & Scheduling ---

  function scheduleStep(stepIndex, time) {
    const pattern = PATTERNS[currentTier] || PATTERNS.jo;

    // Alternating bachi hand gives subtle organic spatial movement
    bachiHand = (bachiHand === 0) ? 1 : 0;
    const handPanOffset = (bachiHand === 1 ? 0.08 : -0.08);

    // Humanization timing micro-jitter (+/- 1.5ms)
    const jitter = (Math.random() - 0.5) * 0.003;
    const hitTime = Math.max(ctx.currentTime, time + jitter);

    // 1. Ō-daiko check
    const oVel = pattern.odaiko[stepIndex];
    if (oVel > 0) {
      const humVel = oVel * (0.94 + Math.random() * 0.12);
      playOdaiko(hitTime, humVel, handPanOffset * 0.5);
    }

    // 2. Chū-daiko check
    const cVel = pattern.chudaiko[stepIndex];
    if (cVel > 0) {
      const humVel = cVel * (0.92 + Math.random() * 0.16);
      playChudaiko(hitTime, humVel, -0.22 + handPanOffset);
    }

    // 3. Shime-daiko check
    const sVel = pattern.shime[stepIndex];
    if (sVel > 0) {
      const humVel = sVel * (0.92 + Math.random() * 0.16);
      playShimedaiko(hitTime, humVel, 0.32 + handPanOffset);
    }

    // 4. Rim Click ("Ka") check
    const rVel = pattern.rim[stepIndex];
    if (rVel > 0) {
      const humVel = rVel * (0.90 + Math.random() * 0.20);
      playRim(hitTime, humVel, 0.12 + handPanOffset);
    }
  }

  function schedulerTick() {
    if (!isRunning || !ctx || ctx.state === 'suspended') return;

    while (nextNoteTime < ctx.currentTime + scheduleAheadTime) {
      scheduleStep(currentStep, nextNoteTime);

      // Advance step and calculate next 16th-note timestamp based on dynamic BPM
      const secondsPerBeat = 60.0 / Math.max(80.0, smoothedBPM);
      const secondsPer16th = secondsPerBeat / 4.0;
      nextNoteTime += secondsPer16th;

      currentStep = (currentStep + 1) % 16;
    }
  }

  // --- Public API ---

  function start() {
    if (isRunning) return;
    initNodes();
    if (!ctx) return;

    isRunning = true;
    currentStep = 0;
    nextNoteTime = ctx.currentTime + 0.05;

    if (timerId !== null) clearInterval(timerId);
    timerId = setInterval(schedulerTick, lookaheadMs);
  }

  function stop() {
    isRunning = false;
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function setMuted(val) {
    isMuted = !!val;
    if (masterGain && ctx) {
      masterGain.gain.setValueAtTime(isMuted ? 0 : 0.85, ctx.currentTime);
    }
  }

  // Real-time battle telemetry update
  // Computes continuous threat level and smoothly updates BPM, tier, and master intensity
  function update(dt, telemetry = {}) {
    if (!ctx) return;
    lastTelemetry = telemetry;
    if (!isRunning && telemetry.active) {
      start();
    }

    const {
      wave = 1,
      active = true,
      meteorsCount = 0,
      bossActive = false,
      schoolHp = 100,
      dragonVelY = 0,
      isBoosting = false
    } = telemetry;

    if (!active) {
      // Quiet battle intermission
      targetThreat = 0.0;
    } else {
      // Threat Formula:
      // - Wave progression (0.0 to 0.45)
      // - Active airborne meteors (0.0 to 0.35)
      // - Boss encounter (0.45 boost)
      // - School damage urgency (0.0 to 0.25)
      // - Dragon high-speed kinetic dive (0.10 boost)
      const waveFactor = Math.min(0.45, (wave - 1) * 0.065);
      const meteorFactor = Math.min(0.35, meteorsCount * 0.06);
      const bossFactor = (bossActive || wave >= 15) ? 0.45 : 0.0;
      const damageFactor = Math.max(0.0, (100.0 - schoolHp) / 100.0) * 0.25;
      const diveFactor = (dragonVelY < -15.0 || isBoosting) ? 0.10 : 0.0;

      targetThreat = Math.min(1.0, Math.max(0.0, waveFactor + meteorFactor + bossFactor + damageFactor + diveFactor));
    }

    // Smooth asymmetric attack / decay filter (fast attack on sudden danger, solemn decay)
    const rate = (targetThreat > currentThreat) ? 2.5 : 0.4;
    currentThreat += (targetThreat - currentThreat) * Math.min(1.0, dt * rate);

    // Map threat level to classical Jo-Ha-Kyū structure
    if (currentThreat < 0.30) {
      currentTier = 'jo';
    } else if (currentThreat < 0.55) {
      currentTier = 'ha';
    } else if (currentThreat < 0.85) {
      currentTier = 'kyu';
    } else {
      currentTier = 'climax';
    }

    // Dynamic tempo progression: 108 BPM (Jo) -> 132 BPM (Climax)
    const targetBPM = 108.0 + (currentThreat * 24.0);
    smoothedBPM += (targetBPM - smoothedBPM) * Math.min(1.0, dt * 1.5);

    // Dynamic master percussion gain: expands during climax, ducks subtly during low threat
    if (masterGain && !isMuted) {
      const targetGain = active ? (0.68 + (currentThreat * 0.24)) : 0.0;
      masterGain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.15);
    }
  }

  function getStats() {
    return {
      running: isRunning,
      muted: isMuted,
      tier: currentTier,
      threat: +currentThreat.toFixed(3),
      targetThreat: +targetThreat.toFixed(3),
      bpm: Math.round(smoothedBPM),
      currentStep,
      totalHits: totalHitsTriggered,
      lastTelemetry
    };
  }

  return {
    start,
    stop,
    setMuted,
    update,
    getStats,
    playOdaiko,
    playChudaiko,
    playShimedaiko,
    playRim
  };
}
