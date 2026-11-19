// Training Missions: Dedicated, Guided Early Training Levels for Dragon Defense
// Calibrated, low-stakes prologue stages teaching:
// Level 1: Satellite Meteor Intercept (Space / Left Click fire breath on falling chunk)
// Level 2: Supersonic Meteor Buster (Shift / Boost ramming breakaway meteor)
// Level 3: Rooftop Fire Suppression (Fly down near building and extinguish fire)
// Level 4: Police Cruiser & "Harm No Humans" Defensive Gas (Drop gas to safely disable cop car)
// Level 5: Final Practice Chunks (Intercept 2 large breaking chunks before Chapter 1)

export function createTrainingMissions({
  message,
  sound,
  spawnTargetMeteor,
  ignite,
  spawnTrainingCopCar,
  onComplete
}) {
  let active = false;
  let currentStep = 0; // 0 = inactive, 1 = intercept, 2 = buster, 3 = fire suppression, 4 = gas/cop, 5 = final chunks, 6 = graduated
  let stepTimer = 0;
  let targetMeteor1 = null;
  let targetMeteor2 = null;
  let targetsDestroyed = 0;
  let transitionTimer = 0;
  let inTransition = false;
  let copCarRef = null;
  let roofFireIgnited = false;
  let cameraFocus = { x: 0, y: 16, z: 15, zoom: 1.0, active: false };

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
      max-width: 720px;
      width: 92%;
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
    targetsDestroyed = 0;
    targetMeteor1 = null;
    targetMeteor2 = null;
    inTransition = false;
    transitionTimer = 0;
    roofFireIgnited = false;
    copCarRef = null;

    sound('bonus');
    advanceToStep(1);
  }

  function advanceToStep(step) {
    currentStep = step;
    stepTimer = 0;
    inTransition = false;
    transitionTimer = 0;

    // --- STEP 1: Satellite Blunder & Fire Breath Intercept ---
    if (step === 1) {
      targetsDestroyed = 0;
      cameraFocus = { x: -6, y: 36, z: 15, zoom: 1.45, active: true };
      sound('bonus');
      updateBannerUI(
        '🛰️ TRAINING LEVEL 1/5: SATELLITE METEOR INTERCEPT',
        'Satellites have blasted a harmless meteor! A large chunk is falling toward Tech Freire. Aim with mouse/keys and press <b style="background:#dc2626;padding:2px 6px;border-radius:3px">SPACE</b> or <b style="background:#dc2626;padding:2px 6px;border-radius:3px">LEFT CLICK</b> to shoot fire breath and destroy it!',
        0
      );
      message('🛰️ TRAINING LEVEL 1: FIRE BREATH — Aim and shoot the falling meteor chunk!');
      if (spawnTargetMeteor) {
        targetMeteor1 = spawnTargetMeteor({ x: -6, y: 36, z: 15, size: 3.4, vy: -1.8 });
      }
    }
    // --- STEP 2: Fast Breakaway Meteor & Supersonic Buster ---
    else if (step === 2) {
      targetsDestroyed = 0;
      cameraFocus = { x: 12, y: 26, z: 15, zoom: 1.35, active: true };
      sound('bonus');
      updateBannerUI(
        '⚡ TRAINING LEVEL 2/5: SUPERSONIC METEOR BUSTER',
        'A fast breakaway chunk is speeding across the sky! Hold <b style="background:#7c3aed;padding:2px 6px;border-radius:3px">SHIFT</b> to Boost and ram Paulo at supersonic speed directly through the meteor to shatter it!',
        0
      );
      message('⚡ TRAINING LEVEL 2: METEOR BUSTER — Hold SHIFT to ram the breakaway meteor!');
      if (spawnTargetMeteor) {
        targetMeteor1 = spawnTargetMeteor({ x: 12, y: 26, z: 15, size: 2.6, vx: 3.2, vy: -1.2, isBusterTarget: true });
      }
    }
    // --- STEP 3: Rooftop Fire Suppression ---
    else if (step === 3) {
      cameraFocus = { x: 12, y: 8, z: 2, zoom: 1.4, active: true };
      sound('fire');
      sound('bonus');
      if (ignite && !roofFireIgnited) {
        roofFireIgnited = true;
        ignite(12, 7.8, 0.5);
      }
      updateBannerUI(
        '🔥 TRAINING LEVEL 3/5: ROOFTOP FIRE SUPPRESSION',
        'Falling sparks ignited a North Broad rowhouse roof! Fly down near the building and swoop close or fire your breath to extinguish the flames!',
        0
      );
      message('🔥 TRAINING LEVEL 3: FIRE SUPPRESSION — Swoop down or use breath to extinguish roof fire!');
    }
    // --- STEP 4: Police Cruiser & "Harm No Humans" Defensive Gas ---
    else if (step === 4) {
      cameraFocus = { x: 6, y: 2.5, z: 17, zoom: 1.45, active: true };
      sound('warning');
      sound('bonus');
      if (spawnTrainingCopCar && !copCarRef) {
        copCarRef = spawnTrainingCopCar();
      }
      updateBannerUI(
        '🛡️ TRAINING LEVEL 4/5: GUARDIAN CODE — HARM NO HUMANS!',
        'Panicked police mistake Paulo for the threat and are shooting! Paulo has a sacred oath to <b>HARM NO HUMANS</b>. Fly down near the street and press <b style="background:#059669;padding:2px 6px;border-radius:3px">F</b> or <b style="background:#059669;padding:2px 6px;border-radius:3px">S / Down</b> to deploy DEFENSIVE GAS to safely disable their cruiser without harm!',
        0
      );
      message('🛡️ TRAINING LEVEL 4: HARM NO HUMANS — Deploy defensive gas to non-lethally disable police cruiser!');
    }
    // --- STEP 5: Final Practice Chunks ---
    else if (step === 5) {
      targetsDestroyed = 0;
      cameraFocus = { x: 0, y: 16, z: 15, zoom: 1.0, active: false };
      sound('bonus');
      updateBannerUI(
        '☄️ TRAINING LEVEL 5/5: FINAL PRACTICE CHUNKS',
        'A few more large chunks have broken off from the shattered asteroid! They break up easily when hit. Intercept them both to finish training!',
        0
      );
      message('☄️ TRAINING LEVEL 5: FINAL PRACTICE — Intercept the large breaking chunks!');
      if (spawnTargetMeteor) {
        targetMeteor1 = spawnTargetMeteor({ x: -12, y: 36, z: 15, size: 3.2, vy: -2.0 });
        targetMeteor2 = spawnTargetMeteor({ x: 14, y: 34, z: 15, size: 3.0, vy: -1.9 });
      }
    }
    // --- STEP 6: Graduation Fanfare ---
    else if (step === 6) {
      cameraFocus = { x: 0, y: 16, z: 15, zoom: 1.0, active: false };
      sound('waveWin');
      sound('dragonRoar', { variant: 'challenge' });
      updateBannerUI(
        '🏆 DRAGON ACADEMY GRADUATED!',
        'Paulo has mastered flight, fire breath, fire suppression, and non-lethal defense! The true defense of Philadelphia begins in <b>Chapter 1: The Initial Meteor Storm</b>...',
        100,
        true
      );
      message('🏆 DRAGON ACADEMY GRADUATED! PREPARE FOR CHAPTER 1!');

      setTimeout(() => {
        hideBanner();
        active = false;
        if (onComplete) onComplete();
      }, 2500);
    }
  }

  function update(dt, context) {
    if (!active) return;
    stepTimer += dt;

    const {
      dragonPos,
      dragonSpeed,
      isGasDeployed,
      hasBusterCollided,
      meteorsList,
      schoolFiresCount,
      carsList
    } = context;

    // Handle transition pause between steps
    if (inTransition) {
      transitionTimer += dt;
      if (transitionTimer >= 1.6) {
        advanceToStep(currentStep + 1);
      }
      return;
    }

    // --- LEVEL 1: Fire Breath Intercept ---
    if (currentStep === 1) {
      const alive1 = meteorsList && meteorsList.includes(targetMeteor1) && !targetMeteor1.grounded;
      if (!alive1 && targetMeteor1) {
        inTransition = true;
        sound('bonus');
        updateBannerUI(
          '✅ DIRECT HIT! METEOR DESTROYED!',
          'Great shooting! Preparing Level 2: Breakaway Meteor Buster...',
          100,
          true
        );
      }
    }

    // --- LEVEL 2: Fast Breakaway Meteor & Supersonic Buster ---
    else if (currentStep === 2) {
      const isHighSpeed = dragonSpeed > 11.0;
      updateBannerUI(
        '⚡ TRAINING LEVEL 2/5: SUPERSONIC METEOR BUSTER',
        `Hold <b style="background:#7c3aed;padding:2px 6px;border-radius:3px">SHIFT</b> to Boost (${isHighSpeed ? '<b style="color:#a855f7">SUPERSONIC ACTIVE!</b>' : 'fly faster'}) directly into the incoming breakaway meteor!`,
        isHighSpeed ? 75 : 30
      );

      const alive = meteorsList && meteorsList.includes(targetMeteor1) && !targetMeteor1.grounded;
      if (hasBusterCollided || (targetMeteor1 && !alive)) {
        inTransition = true;
        sound('bonus');
        sound('dragonRoar', { variant: 'furious' });
        updateBannerUI(
          '✅ METEOR SHATTERED! METEOR BUSTER MASTERED!',
          'Supersonic ramming validated! Preparing Level 3: Rooftop Fire Suppression...',
          100,
          true
        );
      }
    }

    // --- LEVEL 3: Rooftop Fire Suppression ---
    else if (currentStep === 3) {
      const firesActive = (schoolFiresCount || 0) > 0;
      updateBannerUI(
        '🔥 TRAINING LEVEL 3/5: ROOFTOP FIRE SUPPRESSION',
        'Fly down near the building and swoop close or fire your breath to extinguish the flames!',
        firesActive ? 40 : 100
      );

      if (!firesActive && stepTimer > 0.8) {
        inTransition = true;
        sound('bonus');
        updateBannerUI(
          '✅ ROOFTOP FIRE EXTINGUISHED!',
          'Building saved! Preparing Level 4: Guardian Code — Harm No Humans...',
          100,
          true
        );
      }
    }

    // --- LEVEL 4: Police Cruiser & "Harm No Humans" Defensive Gas ---
    else if (currentStep === 4) {
      const copFrozen = carsList && carsList.some(c => c.trainingCop && c.frozen);
      const nearStreet = dragonPos.y < 12.0;

      updateBannerUI(
        '🛡️ TRAINING LEVEL 4/5: GUARDIAN CODE — HARM NO HUMANS!',
        `Panicked police below are shooting! Fly near the street (${nearStreet ? '<b style="color:#34d399">IN RANGE!</b>' : 'fly lower'}) and press <b style="background:#059669;padding:2px 6px;border-radius:3px">F</b> or <b style="background:#059669;padding:2px 6px;border-radius:3px">S / Down</b> to deploy defensive gas!`,
        copFrozen ? 100 : (nearStreet ? 60 : 25)
      );

      if (copFrozen || (isGasDeployed && nearStreet)) {
        // Freeze cop car safely
        if (carsList) {
          carsList.forEach(c => {
            if (c.trainingCop) {
              c.frozen = true;
              c.stun = 999;
              c.speed = 0;
            }
          });
        }
        inTransition = true;
        sound('bonus');
        updateBannerUI(
          '✅ POLICE CRUISER NON-LETHALLY DISABLED!',
          'Paulo\'s ancient oath to harm no humans is upheld! Preparing Level 5: Final Practice Chunks...',
          100,
          true
        );
      }
    }

    // --- LEVEL 5: Final Practice Chunks ---
    else if (currentStep === 5) {
      const alive1 = meteorsList && meteorsList.includes(targetMeteor1) && !targetMeteor1.grounded;
      const alive2 = meteorsList && meteorsList.includes(targetMeteor2) && !targetMeteor2.grounded;

      let remaining = (alive1 ? 1 : 0) + (alive2 ? 1 : 0);
      const pct = ((2 - remaining) / 2) * 100;

      updateBannerUI(
        '☄️ TRAINING LEVEL 5/5: FINAL PRACTICE CHUNKS',
        `A few more large chunks are falling! Destroy both practice meteors (${2 - remaining}/2 destroyed).`,
        pct
      );

      if (remaining === 0 && (targetMeteor1 || targetMeteor2)) {
        inTransition = true;
        sound('bonus');
        advanceToStep(6);
      }
    }
  }

  function skip() {
    if (!active) return;
    active = false;
    currentStep = 6;
    cameraFocus = { x: 0, y: 16, z: 15, zoom: 1.0, active: false };
    hideBanner();
    sound('bonus');
    message('⏩ TRAINING SKIPPED — STARTING CHAPTER 1!');
    if (onComplete) onComplete();
  }

  function reset() {
    active = false;
    currentStep = 0;
    stepTimer = 0;
    targetsDestroyed = 0;
    targetMeteor1 = null;
    targetMeteor2 = null;
    copCarRef = null;
    roofFireIgnited = false;
    inTransition = false;
    transitionTimer = 0;
    cameraFocus = { x: 0, y: 16, z: 15, zoom: 1.0, active: false };
    hideBanner();
  }

  function getStats() {
    return {
      active,
      currentStep,
      stepTimer,
      targetsDestroyed,
      cameraFocus
    };
  }

  return {
    start,
    update,
    skip,
    reset,
    advanceToStep,
    getCameraFocus: () => cameraFocus,
    isActive: () => active,
    getStep: () => currentStep,
    getStats
  };
}
