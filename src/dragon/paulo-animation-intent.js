// Paulo integration boundary: pure animation intent derived from existing
// Dragon Defense simulation signals. No Three.js, DOM, allocations per tick,
// controls, timers, health, hitboxes or gameplay side effects live here.
// The laboratory and upcoming gameplay renderer must honor these state names.
export const PAULO_POSES = Object.freeze([
  'idle','hover','flight','glide','bank','ground-turn','inhale',
  'wind','fire','gas','hit','land','takeoff'
]);

/**
 * Choose the one visible animation pose for the current gameplay frame.
 * The actual game must own cooldowns, attack events and movement; this
 * function only decides which pose should be presented.
 * A paused game should freeze its previous pose time rather than call this.
 */
export function choosePauloPose(signals = {}) {
  if(signals.stunned) return 'hit';
  if(signals.recovering) return 'takeoff';
  if(signals.windGust) return 'wind';
  if(signals.gasAttack) return 'gas';
  if(signals.windCharging) return 'inhale';
  if(signals.fireAttack) return 'fire';
  if(signals.landing) return 'land';
  // A grounded direction reversal uses a rear-up/pivot instead of an aerial bank.
  if(signals.turning && (signals.perched || signals.active === false)) return 'ground-turn';
  if(signals.turning) return 'bank';
  if(signals.gliding) return 'glide';
  if(signals.perched || signals.active === false) return 'idle';
  if(signals.moving || signals.rising) return 'flight';
  return 'hover';
}

/** Mirror the bank rig according to horizontal travel, then facing. */
export function choosePauloBankDirection({horizontal=0,facing=1} = {}) {
  const direction = horizontal || facing;
  return direction < 0 ? -1 : 1;
}
