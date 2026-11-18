// High-Fidelity Cinematic Sound Engine for Dragon Defense
// Powered by authentic open-source CC0 acoustic recordings (Kenney, Public Domain, Warfork)
// Delivers multi-layered physical impacts, continuous thruster combustion,
// celestial sub-bass drones, and organic foley with zero arcade beeps or bops.

import { createTaikoEngine } from './taiko-engine.js';
import { createDragonRoarEngine } from './dragon-roar.js';

const AUDIO_MANIFEST = {
  // Deep Impacts & Explosions
  impact_sub_deep: '/assets/audio/impact_sub_deep.ogg',
  impact_sub_deep_2: '/assets/audio/impact_sub_deep_2.ogg',
  explosion_crunch_0: '/assets/audio/explosion_crunch_0.ogg',
  explosion_crunch_1: '/assets/audio/explosion_crunch_1.ogg',
  explosion_crunch_2: '/assets/audio/explosion_crunch_2.ogg',
  warfork_rocket_boom: '/assets/audio/warfork_rocket_boom.ogg',
  warfork_grenade_boom: '/assets/audio/warfork_grenade_boom.ogg',
  warfork_plasma_boom: '/assets/audio/warfork_plasma_boom.ogg',

  // Rock Fracturing & Inter-Meteor Collisions
  rock_fracture_0: '/assets/audio/rock_fracture_0.ogg',
  rock_fracture_1: '/assets/audio/rock_fracture_1.ogg',
  rock_fracture_2: '/assets/audio/rock_fracture_2.ogg',

  // Structural Crumble & Glass Shatter
  building_crush_0: '/assets/audio/building_crush_0.ogg',
  building_crush_1: '/assets/audio/building_crush_1.ogg',
  glass_shatter_0: '/assets/audio/glass_shatter_0.ogg',
  glass_shatter_1: '/assets/audio/glass_shatter_1.ogg',

  // Vehicle Collisions & Metal Foley
  car_crunch_0: '/assets/audio/car_crunch_0.ogg',
  car_crunch_1: '/assets/audio/car_crunch_1.ogg',
  car_crunch_2: '/assets/audio/car_crunch_2.ogg',

  // Concrete Claw Footsteps
  footstep_concrete_0: '/assets/audio/footstep_concrete_0.ogg',
  footstep_concrete_1: '/assets/audio/footstep_concrete_1.ogg',
  footstep_concrete_2: '/assets/audio/footstep_concrete_2.ogg',
  footstep_concrete_3: '/assets/audio/footstep_concrete_3.ogg',

  // Orbital Satellite Cannons & Defense
  laser_heavy_0: '/assets/audio/laser_heavy_0.ogg',
  laser_heavy_1: '/assets/audio/laser_heavy_1.ogg',
  laser_heavy_2: '/assets/audio/laser_heavy_2.ogg',
  force_field_0: '/assets/audio/force_field_0.ogg',
  force_field_1: '/assets/audio/force_field_1.ogg',
  force_field_2: '/assets/audio/force_field_2.ogg',
  warfork_electro_shock: '/assets/audio/warfork_electro_shock.ogg',
  warfork_electro_hum: '/assets/audio/warfork_electro_hum.ogg',

  // Dragon Combustion & Flight Motion
  fire_thruster_0: '/assets/audio/fire_thruster_0.ogg',
  fire_thruster_1: '/assets/audio/fire_thruster_1.ogg',
  fireball_blast: '/assets/audio/fireball_blast.ogg',
  whoosh_launch: '/assets/audio/whoosh_launch.ogg',
  wing_whoosh: '/assets/audio/wing_whoosh.wav',

  // Celestial Space Engine & Loops
  titan_drone_sub: '/assets/audio/titan_drone_sub.ogg',
  titan_drone_deep: '/assets/audio/titan_drone_deep.ogg',
  helicopter_loop: '/assets/audio/helicopter_loop.ogg',
  siren_loop: '/assets/audio/siren_loop.ogg',
  alarm_warning: '/assets/audio/alarm_warning.ogg',

  // Cinematic Victories & Shimmers
  victory_fanfare_steel: '/assets/audio/victory_fanfare_steel.ogg',
  victory_fanfare_0: '/assets/audio/victory_fanfare_0.ogg',
  victory_fanfare_1: '/assets/audio/victory_fanfare_1.ogg'
};

export function createSoundEngine() {
  let ctx = null;
  let muted = false;
  let masterGain = null;
  let sfxBus = null;
  let ambientBus = null;
  let percussionBus = null;
  let taikoEngine = null;
  let roarEngine = null;

  // Buffer cache: Map<string, AudioBuffer>
  const buffers = new Map();
  let loadingInitiated = false;

  // Continuous looping sources
  let flameLoopSource = null;
  let flameLoopGain = null;
  let flameLoopFilter = null;

  let titanDroneSubSource = null;
  let titanDroneDeepSource = null;
  let titanRumbleGain = null;
  let titanRumbleFilter = null;

  function initContext() {
    if (ctx) return ctx;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();

      masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(muted ? 0 : 1, ctx.currentTime);

      // Hollywood Cinema Limiter / Dynamics Compressor on Master Bus
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-14, ctx.currentTime);
      compressor.knee.setValueAtTime(8, ctx.currentTime);
      compressor.ratio.setValueAtTime(4.5, ctx.currentTime);
      compressor.attack.setValueAtTime(0.003, ctx.currentTime);
      compressor.release.setValueAtTime(0.22, ctx.currentTime);

      masterGain.connect(compressor);
      compressor.connect(ctx.destination);

      sfxBus = ctx.createGain();
      sfxBus.gain.setValueAtTime(0.9, ctx.currentTime);
      sfxBus.connect(masterGain);

      ambientBus = ctx.createGain();
      ambientBus.gain.setValueAtTime(0.85, ctx.currentTime);
      ambientBus.connect(masterGain);

      percussionBus = ctx.createGain();
      percussionBus.gain.setValueAtTime(0.88, ctx.currentTime);
      percussionBus.connect(masterGain);

      taikoEngine = createTaikoEngine(ctx, percussionBus);
      taikoEngine.start();

      roarEngine = createDragonRoarEngine(ctx, sfxBus, playSample);

      loadAllAudioBuffers();
      startTitanCelestialRumble();
    } catch (e) {
      console.warn('SoundEngine AudioContext init failed', e);
    }
    return ctx;
  }

  async function loadAllAudioBuffers() {
    if (loadingInitiated || !ctx) return;
    loadingInitiated = true;

    for (const [key, url] of Object.entries(AUDIO_MANIFEST)) {
      fetch(url)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
          return res.arrayBuffer();
        })
        .then(arr => ctx.decodeAudioData(arr))
        .then(audioBuf => {
          buffers.set(key, audioBuf);
        })
        .catch(err => {
          // Keep silent fallback if individual sound fails
        });
    }
  }

  function playSample(key, { volume = 1.0, playbackRate = 1.0, detune = 0, delay = 0, pan = 0, bus = null } = {}) {
    if (!ctx || muted) return null;
    const buf = buffers.get(key);
    if (!buf) return null;

    try {
      const now = ctx.currentTime + Math.max(0, delay);
      const source = ctx.createBufferSource();
      source.buffer = buf;

      // Realistic pitch variation (subtle randomized detuning for organic feel)
      const randomPitch = 1.0 + (Math.random() - 0.5) * 0.08;
      source.playbackRate.setValueAtTime(playbackRate * randomPitch, now);
      if (detune !== 0 && source.detune) {
        source.detune.setValueAtTime(detune, now);
      }

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(Math.max(0.0001, volume), now);
      source.connect(gain);

      // Cinematic Stereo Panning based on horizontal world coordinate
      if (ctx.createStereoPanner && typeof pan === 'number' && pan !== 0) {
        const panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(Math.max(-0.95, Math.min(0.95, pan)), now);
        gain.connect(panner);
        panner.connect(bus || sfxBus || masterGain);
      } else {
        gain.connect(bus || sfxBus || masterGain);
      }

      source.start(now);
      return source;
    } catch (e) {
      return null;
    }
  }

  function startTitanCelestialRumble() {
    if (!ctx || titanDroneDeepSource) return;
    try {
      titanRumbleGain = ctx.createGain();
      titanRumbleGain.gain.setValueAtTime(0.0001, ctx.currentTime);

      titanRumbleFilter = ctx.createBiquadFilter();
      titanRumbleFilter.type = 'lowpass';
      titanRumbleFilter.frequency.setValueAtTime(120, ctx.currentTime);
      titanRumbleFilter.Q.setValueAtTime(1.8, ctx.currentTime);

      titanRumbleFilter.connect(titanRumbleGain);
      titanRumbleGain.connect(ambientBus || masterGain);

      // We hook up the deep drone loop once buffers are decoded
      const checkAndStartDrone = () => {
        if (!ctx) return;
        const deepBuf = buffers.get('titan_drone_deep');
        const subBuf = buffers.get('titan_drone_sub');
        if (deepBuf && !titanDroneDeepSource) {
          titanDroneDeepSource = ctx.createBufferSource();
          titanDroneDeepSource.buffer = deepBuf;
          titanDroneDeepSource.loop = true;
          titanDroneDeepSource.playbackRate.setValueAtTime(0.85, ctx.currentTime);
          titanDroneDeepSource.connect(titanRumbleFilter);
          titanDroneDeepSource.start();
        }
        if (subBuf && !titanDroneSubSource) {
          titanDroneSubSource = ctx.createBufferSource();
          titanDroneSubSource.buffer = subBuf;
          titanDroneSubSource.loop = true;
          titanDroneSubSource.playbackRate.setValueAtTime(0.92, ctx.currentTime);
          titanDroneSubSource.connect(titanRumbleFilter);
          titanDroneSubSource.start();
        }
        if (!titanDroneDeepSource || !titanDroneSubSource) {
          setTimeout(checkAndStartDrone, 300);
        }
      };
      checkAndStartDrone();
    } catch (e) {}
  }

  function setFlameStreamAudio(active, isMega = false) {
    if (!ctx || muted) return;
    try {
      const now = ctx.currentTime;
      if (active) {
        if (!flameLoopSource) {
          const buf = buffers.get(isMega ? 'fire_thruster_1' : 'fire_thruster_0');
          if (buf) {
            flameLoopSource = ctx.createBufferSource();
            flameLoopSource.buffer = buf;
            flameLoopSource.loop = true;
            flameLoopSource.playbackRate.setValueAtTime(isMega ? 0.92 : 1.05, now);

            flameLoopFilter = ctx.createBiquadFilter();
            flameLoopFilter.type = 'lowpass';
            flameLoopFilter.frequency.setValueAtTime(isMega ? 1800 : 2600, now);
            flameLoopFilter.Q.setValueAtTime(1.2, now);

            flameLoopGain = ctx.createGain();
            flameLoopGain.gain.setValueAtTime(0.0001, now);
            flameLoopGain.gain.exponentialRampToValueAtTime(isMega ? 0.48 : 0.38, now + 0.08);

            flameLoopSource.connect(flameLoopFilter);
            flameLoopFilter.connect(flameLoopGain);
            flameLoopGain.connect(sfxBus || masterGain);
            flameLoopSource.start();
          }
        } else if (flameLoopGain && flameLoopFilter) {
          flameLoopFilter.frequency.setTargetAtTime(isMega ? 1800 : 2600, now, 0.05);
          flameLoopGain.gain.setTargetAtTime(isMega ? 0.48 : 0.38, now, 0.05);
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
    } catch (e) {}
  }

  // Master Sound Dispatch: 100% Real Acoustic Samples & Multi-Layered Foley
  function sound(kind, opt = {}) {
    if (muted) return;
    initContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    // Stereophonic spatial panning: maps world X coordinate (-85 to +85) to stereo field (-0.95 to +0.95)
    const pan = typeof opt.x === 'number'
      ? Math.max(-0.95, Math.min(0.95, opt.x / 85.0))
      : (typeof opt.pan === 'number' ? Math.max(-0.95, Math.min(0.95, opt.pan)) : 0);

    switch (kind) {
      // 1. Heavy Meteor Impact / Ground Explosion
      case 'impact':
      case 'crash': {
        // Multi-track physical layering: Sub-bass shock + rocky crunch + deep explosion
        playSample('impact_sub_deep', { volume: 0.55, pan });
        playSample(Math.random() < 0.5 ? 'explosion_crunch_0' : 'explosion_crunch_1', { volume: 0.48, pan });
        playSample('warfork_rocket_boom', { volume: 0.35, delay: 0.02, pan });
        break;
      }

      // 2. School Structural Damage & Building Collapse
      case 'buildingCollapse': {
        playSample('building_crush_0', { volume: 0.58, pan });
        playSample('building_crush_1', { volume: 0.50, delay: 0.06, pan });
        playSample(Math.random() < 0.5 ? 'glass_shatter_0' : 'glass_shatter_1', { volume: 0.42, delay: 0.08, pan });
        playSample('impact_sub_deep_2', { volume: 0.52, delay: 0.04, pan });
        break;
      }

      // 3. Inter-Meteor Mid-Air Collisions & Fracturing
      case 'meteorCollision': {
        const rockSfx = ['rock_fracture_0', 'rock_fracture_1', 'rock_fracture_2'][Math.floor(Math.random() * 3)];
        playSample(rockSfx, { volume: 0.52, pan });
        playSample('warfork_plasma_boom', { volume: 0.38, playbackRate: 1.15, pan });
        playSample('explosion_crunch_2', { volume: 0.32, delay: 0.03, pan });
        // Secondary cascading rock crumb fracture foley
        playSample('rock_fracture_1', { volume: 0.38, playbackRate: 1.35, delay: 0.05, pan: pan * 0.9 });
        playSample('rock_fracture_2', { volume: 0.34, playbackRate: 1.55, delay: 0.08, pan: pan * 1.1 });
        break;
      }

      // 4. Dragon Fireball Launch / Flame Breath
      case 'shoot': {
        playSample('fireball_blast', { volume: 0.45, playbackRate: 1.05, pan });
        playSample('whoosh_launch', { volume: 0.32, playbackRate: 1.15, delay: 0.01, pan });
        break;
      }

      // 5. Fireball Meteor Hit (Damage without destruction)
      case 'meteorHit': {
        const rockSfx = ['rock_fracture_0', 'rock_fracture_1', 'rock_fracture_2'][Math.floor(Math.random() * 3)];
        playSample(rockSfx, { volume: 0.44, playbackRate: 1.18, pan });
        playSample('warfork_rocket_boom', { volume: 0.28, playbackRate: 1.35, pan });
        playSample('rock_fracture_2', { volume: 0.32, playbackRate: 1.45, delay: 0.04, pan });
        break;
      }

      // 6. Fireball Precision Intercept / Destruction
      case 'intercept': {
        const rockSfx = Math.random() < 0.5 ? 'rock_fracture_0' : 'rock_fracture_1';
        playSample(rockSfx, { volume: 0.46, playbackRate: 1.1, pan });
        playSample('warfork_plasma_boom', { volume: 0.38, pan });
        break;
      }

      // 6. Powerup Pickup / Plasma Shimmer (Warm harmonic resonance, NO arcade beeps)
      case 'bonus': {
        playSample('force_field_2', { volume: 0.42, playbackRate: 1.25, pan });
        playSample('warfork_electro_hum', { volume: 0.28, playbackRate: 1.4, delay: 0.03, pan });
        break;
      }

      // 7. Elon Musk Orbital Satellite Laser Cannon
      case 'satLaser': {
        const laser = ['laser_heavy_0', 'laser_heavy_1', 'laser_heavy_2'][Math.floor(Math.random() * 3)];
        playSample(laser, { volume: 0.52, pan });
        playSample('warfork_electro_shock', { volume: 0.32, playbackRate: 1.4, delay: 0.01, pan });
        break;
      }

      // 8. Satellite Forcefield Deflection / Impact Shield
      case 'clang':
      case 'satShield': {
        playSample('force_field_0', { volume: 0.46, pan });
        playSample('warfork_electro_shock', { volume: 0.35, delay: 0.02, pan });
        break;
      }

      // 9. Electric Arc / Satellite Shock Stun
      case 'electric':
      case 'shock': {
        playSample('warfork_electro_shock', { volume: 0.42, pan });
        playSample('warfork_electro_hum', { volume: 0.38, pan });
        break;
      }

      // 10. Dragon Broad Street Pavement Footstep (Quadruped Trot Gait)
      case 'dragonStep': {
        const stepSfx = ['footstep_concrete_0', 'footstep_concrete_1', 'footstep_concrete_2', 'footstep_concrete_3'][Math.floor(Math.random() * 4)];
        playSample(stepSfx, { volume: 0.36, playbackRate: 0.88, pan });
        break;
      }

      // 11. Dragon Heavy Aerodynamic Wing Flap
      case 'dragonFlap': {
        playSample('wing_whoosh', { volume: 0.45, playbackRate: 0.95, pan });
        break;
      }

      // 11b. Cinematic Draconic Roars (Furious, Mournful, Challenge, Intense)
      case 'dragonRoar': {
        const variant = (opt && opt.variant) || 'furious';
        if (roarEngine) roarEngine.triggerRoar(variant, opt);
        break;
      }

      case 'dragonMourn': {
        if (roarEngine) roarEngine.triggerRoar('mournful', opt);
        break;
      }

      // 12. Dragon Shoving Car / Metal Crunch Foley
      case 'carCrunch': {
        const carSfx = ['car_crunch_0', 'car_crunch_1', 'car_crunch_2'][Math.floor(Math.random() * 3)];
        playSample(carSfx, { volume: 0.52, pan });
        playSample('building_crush_1', { volume: 0.34, delay: 0.03, pan });
        break;
      }

      // 13. Purple "Meteor-Buster" Ramming Detonation
      case 'purpleRamHit': {
        playSample('warfork_plasma_boom', { volume: 0.56, playbackRate: 0.9, pan });
        playSample('force_field_1', { volume: 0.48, pan });
        playSample('explosion_crunch_2', { volume: 0.45, delay: 0.02, pan });
        playSample('impact_sub_deep', { volume: 0.42, delay: 0.01, pan });
        break;
      }

      // 14. Wave Victory Fanfare (Authentic Cinematic Music Fanfare)
      case 'waveWin': {
        playSample('victory_fanfare_steel', { volume: 0.55 });
        break;
      }

      // 15. Emergency Sirens with Dynamic Doppler Pitch & Panning
      case 'siren': {
        const rate = (opt && (opt.playbackRate || opt.doppler)) || 1.0;
        playSample('siren_loop', { volume: 0.35, bus: ambientBus, pan, playbackRate: rate });
        break;
      }

      case 'helicopter': {
        playSample('helicopter_loop', { volume: 0.32, bus: ambientBus, pan });
        break;
      }

      case 'warning': {
        playSample('alarm_warning', { volume: 0.40, pan });
        break;
      }

      case 'crowdPanic': {
        playSample('whoosh_launch', { volume: 0.30, playbackRate: 0.65, pan, bus: ambientBus });
        playSample('alarm_warning', { volume: 0.22, playbackRate: 1.15, delay: 0.05, pan, bus: ambientBus });
        break;
      }

      case 'glass': {
        playSample(Math.random() < 0.5 ? 'glass_shatter_0' : 'glass_shatter_1', { volume: 0.42, pan });
        break;
      }

      case 'fire': {
        playSample('fire_thruster_1', { volume: 0.32, playbackRate: 1.3, pan });
        break;
      }

      // Mega Fire Breath: Roaring furnace thruster + rocket detonation + deep wind whoosh
      case 'megaFire': {
        playSample('fire_thruster_1', { volume: 0.55, playbackRate: 0.88, pan });
        playSample('warfork_rocket_boom', { volume: 0.38, playbackRate: 1.25, pan });
        playSample('whoosh_launch', { volume: 0.42, playbackRate: 0.9, pan });
        break;
      }

      // Steam fire breath & fire truck water suppression hiss
      case 'steam': {
        playSample('whoosh_launch', { volume: 0.38, playbackRate: 1.75, pan });
        playSample('glass_shatter_1', { volume: 0.12, playbackRate: 0.45, pan });
        break;
      }

      // High-speed dive aerodynamic whoosh & supersonic dive boom
      case 'sonicBoom': {
        playSample('warfork_rocket_boom', { volume: 0.62, playbackRate: 0.85, pan });
        playSample('impact_sub_deep_2', { volume: 0.58, delay: 0.02, pan });
        playSample('whoosh_launch', { volume: 0.48, playbackRate: 1.15, pan });
        break;
      }

      case 'diveWhoosh': {
        playSample('whoosh_launch', { volume: 0.40, playbackRate: 1.5, pan });
        break;
      }

      case 'gas': {
        playSample('whoosh_launch', { volume: 0.34, playbackRate: 0.8, pan });
        break;
      }

      case 'combo':
      case 'fanfare': {
        playSample('victory_fanfare_0', { volume: 0.44 });
        break;
      }

      case 'nearmiss': {
        playSample('whoosh_launch', { volume: 0.38, playbackRate: 1.4, pan });
        break;
      }

      default: {
        playSample('rock_fracture_0', { volume: 0.35, pan });
        break;
      }
    }
  }

  // Update dynamic atmospheric audio parameters (Sub-Bass Titan celestial rumble & Taiko war drums)
  function update(dt, cameraAltitude, titanAltitude, titanOnScreen, battleTelemetry) {
    if (taikoEngine && battleTelemetry) {
      taikoEngine.update(dt, battleTelemetry);
    }
    if (!ctx || muted || !titanRumbleGain) return;
    try {
      const now = ctx.currentTime;
      // Rumble intensifies as altitude approaches orbit (y > 70) and Titan is on screen
      const altNorm = Math.min(1.0, Math.max(0.0, (cameraAltitude - 20) / 300));
      const targetVolume = (titanOnScreen ? 0.34 : 0.08) * (0.15 + altNorm * 0.85);
      titanRumbleGain.gain.setTargetAtTime(targetVolume, now, 0.25);

      if (titanRumbleFilter) {
        // High altitude opens filter for deep planetary bass roar
        const targetFreq = 90 + altNorm * 180 + (titanOnScreen ? 70 : 0);
        titanRumbleFilter.frequency.setTargetAtTime(targetFreq, now, 0.2);
      }
    } catch (e) {}
  }

  function setMuted(val) {
    muted = !!val;
    if (masterGain && ctx) {
      masterGain.gain.setValueAtTime(muted ? 0 : 1, ctx.currentTime);
    }
    if (flameLoopGain && ctx) {
      flameLoopGain.gain.setValueAtTime(muted ? 0 : 0.38, ctx.currentTime);
    }
    if (titanRumbleGain && ctx) {
      titanRumbleGain.gain.setValueAtTime(muted ? 0 : 0.25, ctx.currentTime);
    }
    if (taikoEngine) {
      taikoEngine.setMuted(muted);
    }
    if (roarEngine) {
      roarEngine.setMuted(muted);
    }
  }

  function isMuted() {
    return muted;
  }

  function getTaikoStats() {
    return taikoEngine ? taikoEngine.getStats() : null;
  }

  function getRoarStats() {
    return roarEngine ? roarEngine.getStats() : null;
  }

  return {
    init: initContext,
    sound,
    setFlameStreamAudio,
    update,
    setMuted,
    isMuted,
    getTaikoStats,
    getRoarStats,
    dragonRoar: (variant, opts) => (roarEngine ? roarEngine.triggerRoar(variant, opts) : false)
  };
}
