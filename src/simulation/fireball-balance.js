// Deterministic player fireball and shockwave meteor balance.
export const MAX_PLAYABLE_METEORS = 24;

const OPENING_WAVES = [
  { count: 6, size: 13.5, kind: 'molten' },
  { count: 8, size: 10.0, kind: 'molten' },
  { count: 12, size: 10.0, kind: 'flaming' },
  { count: 16, size: 11.0, kind: 'flaming' }
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
      hp: 5,
      kind: 'molten',
      x: 0,
      vy: -8.5,
      notice: '🚨 EXTRA LARGE COLOSSAL METEOR INCOMING! INTERCEPT BEFORE IMPACT!'
    };
  }
  if (spawnIndex === 1) {
    return {
      stage: 'twin_massive',
      isMassive: true,
      colossus: false,
      size: 10.5,
      hp: 4,
      kind: 'molten',
      x: -36,
      vy: -9.0,
      notice: '⚠️ MASSIVE METEOR APPROACHING! DEFEND THE WEST FLANK!'
    };
  }
  if (spawnIndex === 2) {
    return {
      stage: 'twin_massive',
      isMassive: true,
      colossus: false,
      size: 10.5,
      hp: 4,
      kind: 'molten',
      x: 36,
      vy: -9.0,
      notice: '⚠️ MASSIVE METEOR APPROACHING! DEFEND THE EAST FLANK!'
    };
  }
  const size = 3.8 + (spawnIndex % 2) * 0.4;
  return {
    stage: 'barrage',
    isMassive: false,
    colossus: false,
    size,
    hp: 2,
    kind: 'flaming',
    x: ((spawnIndex % 2 === 0 ? 1 : -1) * (18 + (spawnIndex * 12) % 45)),
    vy: -9.5,
    notice: spawnIndex === 3 ? '☄️ LARGE METEORS DETECTED — INTERCEPT AND SHATTER!' : null
  };
}

export function fireballMeteorDamage(m, playerFire = true, ordinaryShockDamage = 0) {
  if (m.indestructible) return 0;
  if (!playerFire) return ordinaryShockDamage;
  if (m.boss) return 5;
  // Colossus & Massive meteors take 2 clean fire hits or 1 buster ram
  if (m.isMassive || (m.size && m.size >= 5.5)) {
    return 2.5;
  }
  if (m.size && m.size >= 2.8) {
    return 2.0;
  }
  // Medium and Small meteors shatter in 1 hit!
  return Math.max(1, Number.isFinite(m.hp) ? m.hp : 1);
}

// Universal 5-Tier Hierarchical Meteor Breakup:
// Tier 1: Giant/Colossal/Extra Large (size >= 5.5) -> 2 Large (size ~4.2)
// Tier 2: Large (size >= 2.8) -> 2 Medium (size ~2.2)
// Tier 3: Medium (size >= 1.4) -> 2 Small (size ~1.05)
// Tier 4: Small (size < 1.4) -> Harmless particles/dust/shrapnel rain (0 rock spawns)
// Tier 5: Harmless particle shower rains harmlessly down onto ground (0 damage)
export function meteorSplitPlan(m, activeCount = 0) {
  const room = Math.max(0, MAX_PLAYABLE_METEORS - activeCount);
  if (room <= 0 || m.indestructible || m.grounded || m.dragonHunter) {
    return { count: 0, size: 0, tier: 'particles', harmless: true };
  }
  if (m.boss) {
    return { count: Math.min(4, room), size: 2.2, tier: 'medium', harmless: false };
  }

  // Tier 1: Giant / Colossal / Extra Large -> 2 Large
  if (m.isMassive || m.colossus || (m.size && m.size >= 5.5)) {
    return { count: Math.min(2, room), size: 4.2, tier: 'large', isLargeSplitter: true, harmless: false };
  }

  // Tier 2: Large -> 2 Medium
  if (m.size && m.size >= 2.8) {
    return { count: Math.min(2, room), size: 2.2, tier: 'medium', harmless: false };
  }

  // Tier 3: Medium -> 2 Small
  if (m.size && m.size >= 1.4) {
    return { count: Math.min(2, room), size: 1.05, tier: 'small', harmless: false };
  }

  // Tier 4: Small -> Breaks into harmless particles
  return { count: 0, size: 0, tier: 'particles', harmless: true };
}
