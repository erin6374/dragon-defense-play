// Training Missions: Prologue & Tutorial System for Dragon Defense
// Guided, low-stress early training missions introducing:
// 1. Flight & Locomotion (WASD / Arrows)
// 2. Dragon Fire Breath & Targeting (Left Click / Space)
// 3. Ground Gas Defense (F / E near street)
// 4. Full-Speed Flight Meteor Buster (Shift / Dive through meteor)

export function createTrainingMissions({
  message,
  sound,
  spawnTargetMeteor,
  onComplete
}) {
  let active = false;
  let currentStep = 0; // 0 = inactive, 1 = flight, 2 = fire, 3 = gas, 4 = buster, 5 = done
  let stepTimer = 0;
  let targetMeteor = null;
  let flightProgress = 0;

  function start() {
    active = true;
    currentStep = 1;
    stepTimer = 0;
    flightProgress = 0;
    targetMeteor = null;
    sound('bonus');
    message('✈️ TRAINING 1/4: FLIGHT ACADEMY — Use Arrow Keys or WASD to fly Paulo! Move left and right.');
  }

  function advanceToStep(step) {
    currentStep = step;
    stepTimer = 0;
    targetMeteor = null;

    if (step === 2) {
      sound('bonus');
      message('🔥 TRAINING 2/4: DRAGON BREATH — Left Click or Space to aim & shoot! Destroy the slow target meteor.');
      // Spawn slow target meteor
      if (spawnTargetMeteor) {
        targetMeteor = spawnTargetMeteor({ x: 0, y: 34, z: 15, size: 2.2, vy: -3.5 });
      }
    } else if (step === 3) {
      sound('bonus');
      message('💨 TRAINING 3/4: GROUND DEFENSE — Fly down near the street and press F or E to release ground gas!');
    } else if (step === 4) {
      sound('bonus');
      message('💥 TRAINING 4/4: METEOR BUSTER — Hold SHIFT to Boost or dive at high speed directly through the meteor!');
      if (spawnTargetMeteor) {
        targetMeteor = spawnTargetMeteor({ x: 12, y: 26, z: 15, size: 2.4, vy: -2.8, isBusterTarget: true });
      }
    } else if (step === 5) {
      sound('waveWin');
      sound('dragonRoar', { variant: 'challenge' });
      message('🏆 TRAINING COMPLETE! PREPARE FOR CHAPTER 1: THE METEOR STORM!');
      active = false;
      if (onComplete) onComplete();
    }
  }

  function update(dt, context) {
    if (!active) return;
    stepTimer += dt;

    const {
      dragonPos,
      dragonVelX,
      dragonVelY,
      dragonSpeed,
      isGasDeployed,
      hasBusterCollided,
      meteorsList
    } = context;

    // Step 1: Flight & Locomotion
    if (currentStep === 1) {
      if (Math.abs(dragonVelX) > 2.5 || Math.abs(dragonVelY) > 2.0) {
        flightProgress += dt;
      }
      if (flightProgress > 1.8 || stepTimer > 7.0) {
        advanceToStep(2);
      }
    }
    // Step 2: Dragon Fire Breath
    else if (currentStep === 2) {
      if (targetMeteor) {
        // If target meteor was destroyed or grounded
        const stillAlive = meteorsList && meteorsList.includes(targetMeteor) && !targetMeteor.grounded;
        if (!stillAlive) {
          advanceToStep(3);
        }
      } else if (stepTimer > 10.0) {
        advanceToStep(3);
      }
    }
    // Step 3: Ground Gas Attack
    else if (currentStep === 3) {
      if (isGasDeployed && dragonPos.y < 14.0) {
        advanceToStep(4);
      } else if (stepTimer > 10.0) {
        advanceToStep(4);
      }
    }
    // Step 4: Full-Speed Flight Meteor Buster
    else if (currentStep === 4) {
      if (hasBusterCollided || (targetMeteor && (!meteorsList || !meteorsList.includes(targetMeteor)))) {
        advanceToStep(5);
      } else if (stepTimer > 12.0) {
        advanceToStep(5);
      }
    }
  }

  function skip() {
    if (!active) return;
    active = false;
    currentStep = 5;
    if (onComplete) onComplete();
  }

  function reset() {
    active = false;
    currentStep = 0;
    stepTimer = 0;
    flightProgress = 0;
    targetMeteor = null;
  }

  function getStats() {
    return {
      active,
      currentStep,
      stepTimer,
      hasTargetMeteor: !!targetMeteor
    };
  }

  return {
    start,
    update,
    skip,
    reset,
    isActive: () => active,
    getStep: () => currentStep,
    getStats
  };
}
