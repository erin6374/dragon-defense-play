// Training Missions: Dedicated, Guided Early Training Levels for Dragon Defense
// Calibrated, low-stress prologue stages teaching:
// Level 1: Flight Academy (WASD / Arrow Keys)
// Level 2: Dragon Fire Breath (Space / Left Click on slow floating targets)
// Level 3: Ground Gas Defense (F / Down Arrow near street pavement)
// Level 4: Supersonic Meteor Buster (Shift / Boost flight ramming)

export function createTrainingMissions({
  message,
  sound,
  spawnTargetMeteor,
  onComplete
}) {
  let active = false;
  let currentStep = 0; // 0 = inactive, 1 = flight, 2 = breath, 3 = gas, 4 = buster, 5 = graduated
  let stepTimer = 0;
  let targetMeteor1 = null;
  let targetMeteor2 = null;
  let targetsDestroyed = 0;
  let flightProgress = 0;
  let transitionTimer = 0;
  let inTransition = false;

  // Dedicated HTML Training Banner
  let banner = document.getElementById('dd-training-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'dd-training-banner';
    banner.style.cssText = `
      position: fixed;
      top: 22px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 100;
      display: none;
      background: linear-gradient(180deg, rgba(10, 24, 44, 0.94), rgba(6, 15, 28, 0.96));
      border: 2px solid #57a6ff;
      border-radius: 12px;
      padding: 12px 24px;
      text-align: center;
      color: #fff;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.75), 0 0 15px rgba(87, 166, 255, 0.25);
      max-width: 680px;
      width: 90%;
      pointer-events: auto;
      font-family: system-ui, -apple-system, sans-serif;
    `;
    banner.innerHTML = `
      <div id="dd-train-title" style="font-size: 17px; font-weight: 900; letter-spacing: 0.5px; color: #ffe066; margin-bottom: 5px;"></div>
      <div id="dd-train-desc" style="font-size: 13.5px; color: #d6ecff; line-height: 1.45;"></div>
      <div id="dd-train-progress-wrap" style="margin-top: 8px; height: 7px; background: #132a40; border-radius: 4px; overflow: hidden; border: 1px solid #234c73;">
        <div id="dd-train-progress-fill" style="width: 0%; height: 100%; background: linear-gradient(90deg, #38bdf8, #818cf8); transition: width 0.15s ease-out;"></div>
      </div>
      <div style="margin-top: 7px; font-size: 11px; color: #8cb5d9; display: flex; justify-content: space-between; align-items: center;">
        <span>Press <b style="color:#ffe066">[TAB]</b> to skip tutorial</span>
        <button id="dd-skip-train-btn" type="button" style="background: #20415e; border: 1px solid #4a80a8; color: #e0f2fe; padding: 2px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold;">Skip Training</button>
      </div>
    `;
    document.body.appendChild(banner);

    document.getElementById('dd-skip-train-btn')?.addEventListener('click', () => {
      skip();
    });
  }

  const titleEl = document.getElementById('dd-train-title');
  const descEl = document.getElementById('dd-train-desc');
  const progressFill = document.getElementById('dd-train-progress-fill');

  function updateBannerUI(title, desc, percent, success = false) {
    if (!banner) return;
    banner.style.display = 'block';
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.innerHTML = desc;
    if (progressFill) {
      progressFill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
      if (success) {
        progressFill.style.background = 'linear-gradient(90deg, #34d399, #10b981)';
      } else {
        progressFill.style.background = 'linear-gradient(90deg, #38bdf8, #818cf8)';
      }
    }
  }

  function hideBanner() {
    if (banner) banner.style.display = 'none';
  }

  function start() {
    active = true;
    currentStep = 1;
    stepTimer = 0;
    flightProgress = 0;
    targetsDestroyed = 0;
    targetMeteor1 = null;
    targetMeteor2 = null;
    inTransition = false;
    transitionTimer = 0;

    sound('bonus');
    updateBannerUI(
      '🎓 TRAINING LEVEL 1/4: FLIGHT ACADEMY',
      'Take flight! Use <b style="background:#1d4ed8;padding:2px 6px;border-radius:3px">WASD</b> or <b style="background:#1d4ed8;padding:2px 6px;border-radius:3px">Arrow Keys</b> to steer Paulo through the sky. Practice flying for 3.5 seconds.',
      0
    );
    message('🎓 TRAINING LEVEL 1: FLIGHT ACADEMY — Use WASD or Arrows to fly!');
  }

  function advanceToStep(step) {
    currentStep = step;
    stepTimer = 0;
    inTransition = false;
    transitionTimer = 0;

    if (step === 2) {
      targetsDestroyed = 0;
      sound('bonus');
      updateBannerUI(
        '🔥 TRAINING LEVEL 2/4: DRAGON FIRE BREATH',
        'Aim and shoot fireballs! Press <b style="background:#dc2626;padding:2px 6px;border-radius:3px">SPACE</b> or <b style="background:#dc2626;padding:2px 6px;border-radius:3px">LEFT CLICK</b> to destroy the slow practice meteor.',
        0
      );
      message('🔥 TRAINING LEVEL 2: FIRE BREATH — Aim and shoot the practice meteor!');
      if (spawnTargetMeteor) {
        targetMeteor1 = spawnTargetMeteor({ x: -8, y: 36, z: 15, size: 2.4, vy: -2.0 });
      }
    } else if (step === 3) {
      sound('bonus');
      updateBannerUI(
        '💨 TRAINING LEVEL 3/4: GROUND DEFENSE GAS',
        'Fly down near the street and press <b style="background:#059669;padding:2px 6px;border-radius:3px">F</b> or <b style="background:#059669;padding:2px 6px;border-radius:3px">S / Down Arrow</b> to release defensive dragon gas!',
        0
      );
      message('💨 TRAINING LEVEL 3: GROUND GAS — Fly near street and deploy gas!');
    } else if (step === 4) {
      sound('bonus');
      updateBannerUI(
        '💥 TRAINING LEVEL 4/4: SUPERSONIC METEOR BUSTER',
        'Hold <b style="background:#7c3aed;padding:2px 6px;border-radius:3px">SHIFT</b> to Boost or dive full speed directly into the incoming meteor to shatter it!',
        0
      );
      message('💥 TRAINING LEVEL 4: METEOR BUSTER — Ram full-speed into the meteor!');
      if (spawnTargetMeteor) {
        targetMeteor1 = spawnTargetMeteor({ x: 10, y: 28, z: 15, size: 2.8, vy: -1.6, isBusterTarget: true });
      }
    } else if (step === 5) {
      // Graduation
      sound('waveWin');
      sound('dragonRoar', { variant: 'challenge' });
      updateBannerUI(
        '🏆 DRAGON ACADEMY GRADUATED!',
        'You have mastered Paulo\'s flight and combat powers! Preparing for <b>Chapter 1: The Initial Meteor Storm</b>...',
        100,
        true
      );
      message('🏆 DRAGON ACADEMY GRADUATED! PREPARE FOR CHAPTER 1!');

      setTimeout(() => {
        hideBanner();
        active = false;
        if (onComplete) onComplete();
      }, 3000);
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

    // Handle transition pause between steps
    if (inTransition) {
      transitionTimer += dt;
      if (transitionTimer >= 1.6) {
        advanceToStep(currentStep + 1);
      }
      return;
    }

    // --- LEVEL 1: Flight Academy ---
    if (currentStep === 1) {
      if (Math.abs(dragonVelX) > 2.0 || Math.abs(dragonVelY) > 1.6) {
        flightProgress += dt;
      }
      const pct = (flightProgress / 3.5) * 100;
      updateBannerUI(
        '🎓 TRAINING LEVEL 1/4: FLIGHT ACADEMY',
        'Take flight! Use <b style="background:#1d4ed8;padding:2px 6px;border-radius:3px">WASD</b> or <b style="background:#1d4ed8;padding:2px 6px;border-radius:3px">Arrow Keys</b> to steer Paulo through the sky. Practice flying for 3.5 seconds.',
        pct
      );

      if (flightProgress >= 3.5) {
        inTransition = true;
        sound('bonus');
        updateBannerUI(
          '✅ FLIGHT CONTROL MASTERED!',
          'Great maneuvering! Preparing Level 2: Fire Breath...',
          100,
          true
        );
      }
    }

    // --- LEVEL 2: Fire Breath Targeting ---
    else if (currentStep === 2) {
      // Target 1 check
      if (targetsDestroyed === 0 && targetMeteor1) {
        const alive1 = meteorsList && meteorsList.includes(targetMeteor1) && !targetMeteor1.grounded;
        if (!alive1) {
          targetsDestroyed = 1;
          sound('bonus');
          message('🎯 TARGET 1 DESTROYED! DESTROY TARGET 2!');
          updateBannerUI(
            '🔥 TRAINING LEVEL 2/4: DRAGON FIRE BREATH',
            '🎯 Direct hit! Now destroy the second practice meteor on the right!',
            50
          );
          if (spawnTargetMeteor) {
            targetMeteor2 = spawnTargetMeteor({ x: 12, y: 34, z: 15, size: 2.0, vy: -2.4 });
          }
        }
      }
      // Target 2 check
      else if (targetsDestroyed === 1 && targetMeteor2) {
        const alive2 = meteorsList && meteorsList.includes(targetMeteor2) && !targetMeteor2.grounded;
        if (!alive2) {
          targetsDestroyed = 2;
          inTransition = true;
          sound('bonus');
          updateBannerUI(
            '✅ FIRE BREATH MASTERED!',
            'Excellent marksmanship! Preparing Level 3: Ground Gas Defense...',
            100,
            true
          );
        }
      }
    }

    // --- LEVEL 3: Street-Level Gas Defense ---
    else if (currentStep === 3) {
      const nearStreet = dragonPos.y < 13.0;
      updateBannerUI(
        '💨 TRAINING LEVEL 3/4: GROUND DEFENSE GAS',
        `Fly down near the street (${nearStreet ? '<b style="color:#34d399">IN RANGE!</b>' : 'currently too high'}) and press <b style="background:#059669;padding:2px 6px;border-radius:3px">F</b> or <b style="background:#059669;padding:2px 6px;border-radius:3px">S / Down</b> to release gas!`,
        nearStreet ? 60 : 20
      );

      if (isGasDeployed && nearStreet) {
        inTransition = true;
        sound('bonus');
        updateBannerUI(
          '✅ STREET DEFENSE GAS DEPLOYED!',
          'Ground hazard cleared! Preparing Level 4: Supersonic Meteor Buster...',
          100,
          true
        );
      }
    }

    // --- LEVEL 4: Supersonic Meteor Buster ---
    else if (currentStep === 4) {
      const isHighSpeed = (dragonSpeed || Math.hypot(dragonVelX, dragonVelY)) > 12.0;
      updateBannerUI(
        '💥 TRAINING LEVEL 4/4: SUPERSONIC METEOR BUSTER',
        `Hold <b style="background:#7c3aed;padding:2px 6px;border-radius:3px">SHIFT</b> to Boost (${isHighSpeed ? '<b style="color:#a855f7">SUPERSONIC ACTIVE!</b>' : 'fly faster'}) directly through the practice meteor!`,
        isHighSpeed ? 75 : 30
      );

      if (hasBusterCollided || (targetMeteor1 && (!meteorsList || !meteorsList.includes(targetMeteor1)))) {
        inTransition = true;
        sound('bonus');
        sound('dragonRoar', { variant: 'furious' });
        updateBannerUI(
          '✅ METEOR SHATTERED! METEOR BUSTER MASTERED!',
          'Supersonic ramming validated! Completing training...',
          100,
          true
        );
      }
    }
  }

  function skip() {
    if (!active) return;
    active = false;
    currentStep = 5;
    hideBanner();
    sound('bonus');
    message('⏩ TRAINING SKIPPED — STARTING CHAPTER 1!');
    if (onComplete) onComplete();
  }

  function reset() {
    active = false;
    currentStep = 0;
    stepTimer = 0;
    flightProgress = 0;
    targetsDestroyed = 0;
    targetMeteor1 = null;
    targetMeteor2 = null;
    inTransition = false;
    transitionTimer = 0;
    hideBanner();
  }

  function getStats() {
    return {
      active,
      currentStep,
      stepTimer,
      targetsDestroyed,
      flightProgress
    };
  }

  return {
    start,
    update,
    skip,
    reset,
    advanceToStep,
    isActive: () => active,
    getStep: () => currentStep,
    getStats
  };
}
