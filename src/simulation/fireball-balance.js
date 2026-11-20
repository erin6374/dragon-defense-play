// Deterministic player fireball and shockwave meteor balance.
export const MAX_PLAYABLE_METEORS = 24;

const OPENING_WAVES = [
  { count: 8, size: 13.5, kind: 'molten' },
  { count: 10, size: 10.0, kind: 'molten' },
  { count: 16, size: 10.0, kind: 'flaming' },
  { count: 18, size: 11.0, kind: 'flaming' }
];

export function openingMeteorWave(wave) {
  return OPENING_WAVES[wave - 1] ?? null;
}

export function getWave1SpawnConfig(spawnIndex) {
  if (spawnIndex === 0) {
    return {
      stage: 'colossus',
      isMassive: true,
      colossus: true,
      size: 13.5,
      hp: 7,
      kind: 'molten',
      x: 0,
      vy: -12.0,
      notice: '🚨 COLOSSAL METEOR INCOMING! INTERCEPT BEFORE IMPACT!'
    };
  }
  if (spawnIndex === 1) {
    return {
      stage: 'twin_massive',
      isMassive: true,
      colossus: false,
      size: 10.5,
      hp: 5,
      kind: 'molten',
      x: -42,
      vy: -13.5,
      notice: '⚠️ DUAL MASSIVE METEORS DETECTED! ESCORT THE NEIGHBORHOOD!'
    };
  }
  if (spawnIndex === 2) {
    return {
      stage: 'twin_massive',
      isMassive: true,
      colossus: false,
      size: 10.5,
      hp: 5,
      kind: 'molten',
      x: 42,
      vy: -13.5,
      notice: null
    };
  }
  const size = 2.8 + (spawnIndex % 3) * 0.6;
  return {
    stage: 'barrage',
    isMassive: false,
    colossus: false,
    size,
    hp: Math.max(2, Math.ceil(size * 0.8)),
    kind: 'flaming',
    x: ((spawnIndex % 2 === 0 ? 1 : -1) * (20 + (spawnIndex * 14) % 60)),
    vy: -16.0,
    notice: spawnIndex === 3 ? '☄️ SEVERE METEOR SQUALL — INTERCEPT MEDIUM & LARGE SPLITTERS!' : null
  };
}

export function fireballMeteorDamage(m, playerFire = true, ordinaryShockDamage = 0) {
  if (m.indestructible) return 0;
  if (!playerFire) return ordinaryShockDamage;
  if (m.boss) return 5; // preserve the multi-hit finale
  // Massive and Colossus meteors take multiple fire blasts to crack and shatter!
  if (m.isMassive || (m.size && m.size >= 5.0)) {
    return 2.5; // 3 hits for 7-HP Colossus, 2 hits for 5-HP Massive
  }
  if (m.size && m.size >= 2.8) {
    return 2.0;
  }
  return Math.max(1, Number.isFinite(m.hp) ? m.hp : 1);
}

export function meteorSplitPlan(m, activeCount = 0) {
  const room = Math.max(0, MAX_PLAYABLE_METEORS - activeCount);
  if (room <= 0 || m.indestructible || m.grounded || m.dragonHunter) return { count: 0, size: 0 };
  if (m.boss) return { count: Math.min(4, room), size: 1.52 };
  
  // Massive Colossus meteor fractures into 2 large pieces
  if (m.isMassive || m.size >= 5.5) {
    return { count: Math.min(2, room), size: 3.8, isLargeSplitter: true };
  }
  
  // Large splitters crack into 2 medium chunks
  if (m.size >= 3.0) {
    return { count: Math.min(2, room), size: 1.95 };
  }
  
  // Medium chunks break down into small fragments
  if ((m.generation || 0) < 2 && m.size >= 1.6) {
    return { count: Math.min(1, room), size: 0.95 };
  }
  
  return { count: 0, size: 0 };
}
