// Training Missions: Dedicated Astral Void Training Simulator
// Completely decoupled from Philadelphia street gameplay.
// Set in an ethereal Astral Simulation Void (celestial cosmos, glowing cyan grid).
// Features simulated mock assets:
// - Step 1: Flight & Maneuvers across the Astral Void
// - Step 2: Fire Breath Targeting on suspended practice meteor
// - Step 3: Supersonic Meteor Buster ramming on breakaway speed rock
// - Step 4: Floating Simulated Mock House with rooftop fire suppression
// - Step 5: Floating Simulated Police Cruiser with non-lethal defensive stasis gas (Harm No Humans)
// - Step 6: Graduation & immediate seamless warp to Philadelphia Chapter 1
// Skippable at any time via [TAB] or click button.

export function createTrainingMissions({
  scene,
  THREE,
  message,
  sound,
  flashAt,
  emitImpact,
  cinematicFX,
  spawnTargetMeteor,
  onComplete,
  setCitySceneVisible
}) {
  let active = false;
  let currentStep = 0; // 0 = inactive, 1 = flight, 2 = breath, 3 = buster, 4 = mock house, 5 = mock cruiser, 6 = graduated
  let stepTimer = 0;
  let transitionTimer = 0;
  let inTransition = false;
  let targetMeteor1 = null;
  let graduationPending = false;
  let gasObserved = false;
  let cameraFocus = { x: 0, y: 16, z: 15, zoom: 1.0, active: false };

  // Void Environment 3D Assets
  let voidGroup = null;
  let voidGrid = null;
  let voidRing = null;
  let mockHouse = null;
  let mockHouseFire = null;
  let mockHouseExtinguished = false;
  let mockCruiser = null;
  let mockCruiserStasis = null;
  let mockCruiserStrobes = [];
  let mockCruiserDisabled = false;
  let mockCruiserSparkTimer = 0;
  let flightDistance = 0;
  let lastDragonPos = null;

  // Dedicated HTML Training Banner
  let banner = document.getElementById('dd-training-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'dd-training-banner';
    banner.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 100;
      display: none;
      background: linear-gradient(180deg, rgba(7, 16, 32, 0.95), rgba(4, 9, 20, 0.98));
      border: 2px solid #38bdf8;
      border-radius: 12px;
      padding: 12px 24px;
      text-align: center;
      color: #fff;
      box-shadow: 0 10px 35px rgba(0, 0, 0, 0.85), 0 0 20px rgba(56, 189, 248, 0.35);
      max-width: 740px;
      width: 92%;
      pointer-events: auto;
      font-family: system-ui, -apple-system, sans-serif;
    `;
    banner.innerHTML = `
      <div id="dd-train-title" style="font-size: 16.5px; font-weight: 900; letter-spacing: 0.5px; color: #38bdf8; margin-bottom: 5px; text-transform: uppercase;"></div>
      <div id="dd-train-desc" style="font-size: 13.5px; color: #e0f2fe; line-height: 1.45;"></div>
      <div id="dd-train-progress-wrap" style="margin-top: 8px; height: 7px; background: #0c1e33; border-radius: 4px; overflow: hidden; border: 1px solid #1e3a5f;">
        <div id="dd-train-progress-fill" style="width: 0%; height: 100%; background: linear-gradient(90deg, #38bdf8, #818cf8); transition: width 0.15s ease-out;"></div>
      </div>
      <div style="margin-top: 7px; font-size: 11px; color: #93c5fd; display: flex; justify-content: space-between; align-items: center;">
        <span>Press <b style="color:#fde047;background:#1e3a5f;padding:1px 5px;border-radius:3px">[TAB]</b> to skip simulation</span>
        <button id="dd-skip-train-btn" type="button" style="background: linear-gradient(180deg, #1e3a5f, #0f2b48); border: 1px solid #38bdf8; color: #e0f2fe; padding: 3px 12px; border-radius: 5px; cursor: pointer; font-size: 11px; font-weight: bold; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">Skip to Philadelphia Campaign ⏭</button>
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

  // --- 3D Void Stage Builder ---
  function buildVoidStage() {
    if (voidGroup) return;
    if (!THREE || !scene) return;

    voidGroup = new THREE.Group();
    voidGroup.name = 'astral-simulation-void';

    // 1. Neon Cyber / Ethereal Floor Grid
    voidGrid = new THREE.GridHelper(180, 36, 0x38bdf8, 0x1e293b);
    voidGrid.position.set(0, 0, 15);
    voidGroup.add(voidGrid);

    // 2. Holographic Boundary Rings on the floor
    const ringGeo = new THREE.RingGeometry(55, 56.5, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45
    });
    voidRing = new THREE.Mesh(ringGeo, ringMat);
    voidRing.rotation.x = Math.PI / 2;
    voidRing.position.set(0, 0.05, 15);
    voidGroup.add(voidRing);

    // 3. Ethereal Corner Boundary Beacons
    for (const [bx, bz] of [[-45, 0], [45, 0], [-45, 30], [45, 30]]) {
      const beaconGeo = new THREE.CylinderGeometry(0.2, 0.2, 28, 8);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: 0.35,
        wireframe: true
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(bx, 14, bz);
      voidGroup.add(beacon);
    }

    // 4. Simulated Mock Rowhouse (Step 4 asset)
    mockHouse = new THREE.Group();
    mockHouse.position.set(14, 3.5, 15);

    // House Walls (Stylized holographic blueprint)
    const wallGeo = new THREE.BoxGeometry(7, 5, 5.5);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      emissive: 0x0f172a,
      roughness: 0.3,
      metalness: 0.8
    });
    const wallsMesh = new THREE.Mesh(wallGeo, wallMat);
    mockHouse.add(wallsMesh);

    // Blueprint wireframe accent
    const wireGeo = new THREE.WireframeGeometry(wallGeo);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 });
    const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
    mockHouse.add(wireMesh);

    // Pitched Gable Roof
    const roofGeo = new THREE.ConeGeometry(5.2, 2.6, 4);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      emissive: 0x78350f,
      roughness: 0.5
    });
    const roofMesh = new THREE.Mesh(roofGeo, roofMat);
    roofMesh.rotation.y = Math.PI / 4;
    roofMesh.position.set(0, 3.8, 0);
    mockHouse.add(roofMesh);

    // Windows (Glowing cyan/gold quads)
    for (const [wx, wy] of [[-1.8, 0.4], [1.8, 0.4], [-1.8, -1.2], [1.8, -1.2]]) {
      const winGeo = new THREE.PlaneGeometry(1.1, 1.2);
      const winMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const win = new THREE.Mesh(winGeo, winMat);
      win.position.set(wx, wy, 2.76);
      mockHouse.add(win);
    }

    // Crackling Roof Fire on Mock House
    const fireGeo = new THREE.IcosahedronGeometry(1.3, 1);
    const fireMat = new THREE.MeshBasicMaterial({
      color: 0xff4500,
      wireframe: true,
      transparent: true,
      opacity: 0.85
    });
    mockHouseFire = new THREE.Mesh(fireGeo, fireMat);
    mockHouseFire.position.set(0, 5.2, 0);
    mockHouse.add(mockHouseFire);

    mockHouse.visible = false;
    voidGroup.add(mockHouse);

    // 5. Simulated Mock Police Cruiser (Step 5 asset)
    mockCruiser = new THREE.Group();
    mockCruiser.position.set(-12, 1.5, 15.5);

    // Cruiser Chassis
    const chassisGeo = new THREE.BoxGeometry(4.4, 1.1, 2.2);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.4,
      metalness: 0.7
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    mockCruiser.add(chassis);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(2.4, 0.9, 1.8);
    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.2,
      metalness: 0.9
    });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(-0.2, 0.95, 0);
    mockCruiser.add(cabin);

    // Emergency Strobe Lights
    const strobeLeftGeo = new THREE.BoxGeometry(0.35, 0.2, 0.4);
    const strobeLeftMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const strobeLeft = new THREE.Mesh(strobeLeftGeo, strobeLeftMat);
    strobeLeft.position.set(-0.2, 1.55, -0.45);
    mockCruiser.add(strobeLeft);

    const strobeRightGeo = new THREE.BoxGeometry(0.35, 0.2, 0.4);
    const strobeRightMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
    const strobeRight = new THREE.Mesh(strobeRightGeo, strobeRightMat);
    strobeRight.position.set(-0.2, 1.55, 0.45);
    mockCruiser.add(strobeRight);

    mockCruiserStrobes = [strobeLeft, strobeRight];

    // Translucent Emerald Stasis Field Bubble
    const stasisGeo = new THREE.BoxGeometry(5.0, 2.2, 2.6);
    const stasisMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.0,
      roughness: 0.1,
      metalness: 0.8,
      emissive: 0x059669
    });
    mockCruiserStasis = new THREE.Mesh(stasisGeo, stasisMat);
    mockCruiserStasis.position.set(0, 0.6, 0);
    mockCruiser.add(mockCruiserStasis);

    mockCruiser.visible = false;
    voidGroup.add(mockCruiser);

    scene.add(voidGroup);
  }

  function cleanupVoidStage() {
    if (!voidGroup) return;
    if (scene) scene.remove(voidGroup);
    voidGroup.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
    voidGroup = null;
    mockHouse = null;
    mockHouseFire = null;
    mockCruiser = null;
    mockCruiserStasis = null;
    mockCruiserStrobes = [];
  }

  function start() {
    reset();
    active = true;
    currentStep = 1;
    stepTimer = 0;
    transitionTimer = 0;
    inTransition = false;
    flightDistance = 0;
    lastDragonPos = null;
    mockHouseExtinguished = false;
    mockCruiserDisabled = false;
    mockCruiserSparkTimer = 0;

    // Isolate scene: hide Philadelphia city geometry
    if (setCitySceneVisible) {
      setCitySceneVisible(false);
    }

    buildVoidStage();
    if (scene) {
      scene.background = new THREE.Color(0x020617);
    }

    sound('bonus');
    advanceToStep(1);
  }

  function advanceToStep(step) {
    if (!active || !Number.isInteger(step) || step < 1 || step > 6) return;
    currentStep = step;
    stepTimer = 0;
    gasObserved = false;
    inTransition = false;
    transitionTimer = 0;

    // --- STEP 1: Flight Controls & Void Maneuvers ---
    if (step === 1) {
      flightDistance = 0;
      cameraFocus = { x: 0, y: 16, z: 15, zoom: 1.15, active: true };
      sound('bonus');
      updateBannerUI(
        '🥋 ASTRAL VOID SIMULATOR — STEP 1/5: FLIGHT CONTROLS',
        '<b>DO THIS:</b> Steer Paulo using <b>Arrow Keys / WASD</b> . Hold <b>W / UP</b> to climb into the sky and test your wings in the Astral Void!',
        0
      );
      message('🥋 STEP 1/5: FLIGHT — Steer Paulo with WASD / Arrow Keys across the Astral Void!');
    }
    // --- STEP 2: Fire Breath Targeting on Practice Meteor ---
    else if (step === 2) {
      cameraFocus = { x: -6, y: 26, z: 15, zoom: 1.35, active: true };
      sound('bonus');
      updateBannerUI(
        '🔥 ASTRAL VOID SIMULATOR — STEP 2/5: FIRE BREATH',
        '<b>DO THIS:</b> Aim at the suspended practice meteor and press <b style="background:#dc2626;padding:2px 6px;border-radius:3px">SPACE</b> or <b style="background:#dc2626;padding:2px 6px;border-radius:3px">LEFT CLICK</b> to blast it with dragon fire breath!',
        0
      );
      message('🔥 STEP 2/5: FIRE BREATH — Blast the practice meteor with SPACE or Left Click!');
      if (spawnTargetMeteor) {
        targetMeteor1 = spawnTargetMeteor({ x: -6, y: 26, z: 15, size: 2.8, vy: 0.0 });
      }
    }
    // --- STEP 3: Supersonic Meteor Buster Ram ---
    else if (step === 3) {
      cameraFocus = { x: 12, y: 22, z: 15, zoom: 1.25, active: true };
      sound('bonus');
      updateBannerUI(
        '⚡ ASTRAL VOID SIMULATOR — STEP 3/5: SUPERSONIC METEOR BUSTER',
        '<b>DO THIS:</b> A fast breakaway chunk is speeding across the void! Hold <b style="background:#7c3aed;padding:2px 6px;border-radius:3px">F / RIGHT MOUSE</b> to Supersonic Boost and ram directly through the meteor to shatter it!',
        0
      );
      message('⚡ STEP 3/5: METEOR BUSTER — Hold F or Right Mouse to boost and ram through the breakaway rock!');
      if (spawnTargetMeteor) {
        targetMeteor1 = spawnTargetMeteor({ x: -36, y: 22, z: 15, size: 3.0, vx: 22.0, vy: -0.8, isBusterTarget: true });
      }
    }
    // --- STEP 4: Simulated Building Fire Suppression ---
    else if (step === 4) {
      if (mockHouse) mockHouse.visible = true;
      cameraFocus = { x: 14, y: 7, z: 15, zoom: 1.4, active: true };
      sound('fire');
      sound('bonus');
      updateBannerUI(
        '🧯 ASTRAL VOID SIMULATOR — STEP 4/5: SIMULATED FIRE SUPPRESSION',
        '<b>DO THIS:</b> The floating mock rowhouse is ablaze! Swoop down close to the roof or fire your breath across the flames to extinguish them!',
        0
      );
      message('🧯 STEP 4/5: FIRE SUPPRESSION — Swoop close or shoot breath to put out the mock house fire!');
    }
    // --- STEP 5: Guardian Code — Harm No Humans! (Defensive Stasis Gas) ---
    else if (step === 5) {
      if (mockCruiser) mockCruiser.visible = true;
      cameraFocus = { x: -12, y: 4.5, z: 15.5, zoom: 1.45, active: true };
      sound('warning');
      sound('bonus');
      updateBannerUI(
        '🛡️ ASTRAL VOID SIMULATOR — STEP 5/5: GUARDIAN CODE — HARM NO HUMANS!',
        '<b>DO THIS:</b> Panicked police are shooting! Paulo has a sacred oath to <b>HARM NO HUMANS</b>. Fly near the mock cruiser and press <b style="background:#059669;padding:2px 6px;border-radius:3px">F</b> or <b style="background:#059669;padding:2px 6px;border-radius:3px">RIGHT CLICK</b> to drop DEFENSIVE GAS to safely freeze the vehicle!',
        0
      );
      message('🛡️ STEP 5/5: HARM NO HUMANS — Deploy defensive stasis gas to freeze the police cruiser!');
    }
    // --- STEP 6: Simulation Mastered & Immediate Warp to Philadelphia ---
    else if (step === 6) {
      cameraFocus = { x: 0, y: 16, z: 15, zoom: 1.0, active: false };
      sound('waveWin');
      sound('dragonRoar', { variant: 'challenge' });
      updateBannerUI(
        '🏆 SIMULATION MASTERED — DEPLOYING TO PHILADELPHIA!',
        'All core dragon abilities verified! Warping Paulo to North Broad Street for <b>Chapter 1: The Initial Meteor Storm</b>...',
        100,
        true
      );
      message('🏆 SIMULATION MASTERED! PREPARE TO DEFEND PHILADELPHIA!');

      graduationPending = true;
    }
  }

  function update(dt, context) {
    if (!active) return;
    if (!Number.isFinite(dt) || dt < 0) return;
    stepTimer += dt;
    if (graduationPending) {
      if (stepTimer >= 2.2) completeAndExit();
      return;
    }

    const {
      dragonPos,
      dragonSpeed,
      isGasDeployed,
      hasBusterCollided,
      meteorsList
    } = context;

    // Animate mock house roof fire
    if (mockHouseFire && mockHouseFire.visible) {
      mockHouseFire.rotation.y += dt * 3.0;
      mockHouseFire.rotation.z += dt * 1.5;
      const s = 1.0 + Math.sin(stepTimer * 12) * 0.22;
      mockHouseFire.scale.set(s, s * 1.25, s);
    }

    // Animate mock cruiser emergency strobes & harmless spark pulses
    if (mockCruiser && mockCruiser.visible && !mockCruiserDisabled) {
      const strobeIdx = Math.floor(stepTimer * 8) % 2;
      if (mockCruiserStrobes[0]) mockCruiserStrobes[0].visible = (strobeIdx === 0);
      if (mockCruiserStrobes[1]) mockCruiserStrobes[1].visible = (strobeIdx === 1);

      mockCruiserSparkTimer += dt;
      if (mockCruiserSparkTimer >= 1.4) {
        mockCruiserSparkTimer = 0;
        if (flashAt) flashAt(mockCruiser.position.x, mockCruiser.position.y + 1.8, mockCruiser.position.z, 0.8);
      }
    }

    // Handle transition pause between steps
    if (inTransition) {
      transitionTimer += dt;
      if (transitionTimer >= 1.5) {
        advanceToStep(currentStep + 1);
      }
      return;
    }

    // --- STEP 1: Flight & Maneuvers ---
    if (currentStep === 1) {
      if (lastDragonPos) {
        flightDistance += Math.hypot(dragonPos.x - lastDragonPos.x, dragonPos.y - lastDragonPos.y);
      }
      lastDragonPos = { x: dragonPos.x, y: dragonPos.y };
      const pct = Math.min(100, (flightDistance / 14) * 100);
      updateBannerUI(
        '🥋 ASTRAL VOID SIMULATOR — STEP 1/5: FLIGHT CONTROLS',
        `<b>DO THIS:</b> Steer Paulo using <b>WASD / Arrow Keys</b> . Test your wings in the Astral Void! (${Math.round(pct)}%)`,
        pct
      );

      if (flightDistance >= 14) {
        inTransition = true;
        sound('bonus');
        updateBannerUI(
          '✅ FLIGHT MANEUVERS VALIDATED!',
          'Great flying! Preparing Step 2: Fire Breath Targeting...',
          100,
          true
        );
      }
    }

    // --- STEP 2: Fire Breath Targeting ---
    else if (currentStep === 2) {
      const alive1 = meteorsList && meteorsList.includes(targetMeteor1) && !targetMeteor1.grounded;
      if (!alive1 && targetMeteor1) {
        inTransition = true;
        sound('bonus');
        updateBannerUI(
          '✅ DIRECT HIT! PRACTICE METEOR DESTROYED!',
          'Fire breath locked and loaded! Preparing Step 3: Supersonic Meteor Buster...',
          100,
          true
        );
      }
    }

    // --- STEP 3: Supersonic Meteor Buster Ram ---
    else if (currentStep === 3) {
      const isHighSpeed = dragonSpeed > 11.0;
      updateBannerUI(
        '⚡ ASTRAL VOID SIMULATOR — STEP 3/5: SUPERSONIC METEOR BUSTER',
        `Hold <b style="background:#7c3aed;padding:2px 6px;border-radius:3px">F / RIGHT MOUSE</b> to Boost (${isHighSpeed ? '<b style="color:#a855f7">SUPERSONIC ACTIVE!</b>' : 'accelerate'}) directly through the breakaway rock!`,
        isHighSpeed ? 80 : 35
      );

      const alive = meteorsList && meteorsList.includes(targetMeteor1) && !targetMeteor1.grounded;
      if (hasBusterCollided) {
        inTransition = true;
        sound('bonus');
        sound('dragonRoar', { variant: 'furious' });
        updateBannerUI(
          '✅ METEOR SHATTERED! METEOR BUSTER MASTERED!',
          'Supersonic ramming validated! Preparing Step 4: Simulated Fire Suppression...',
          100,
          true
        );
      } else if (!alive || targetMeteor1?.mesh?.position.x > 50) {
        targetMeteor1 = spawnTargetMeteor?.({ x: -36, y: 22, z: 15, size: 3.0, vx: 22.0, vy: -0.8, isBusterTarget: true }) ?? null;
      }
    }

    // --- STEP 4: Simulated Building Fire Suppression ---
    else if (currentStep === 4) {
      const distToHouse = mockHouse ? Math.hypot(dragonPos.x - mockHouse.position.x, dragonPos.y - (mockHouse.position.y + 4.5)) : 999;
      const inRange = distToHouse < 8.5;

      updateBannerUI(
        '🧯 ASTRAL VOID SIMULATOR — STEP 4/5: SIMULATED FIRE SUPPRESSION',
        `Swoop down near the simulated roof (${inRange ? '<b style="color:#34d399">IN SUPPRESSION RANGE!</b>' : 'fly closer'}) or shoot your breath to put out the blaze!`,
        inRange ? 75 : 30
      );

      if ((inRange || mockHouseExtinguished) && stepTimer > 0.6) {
        mockHouseExtinguished = true;
        if (mockHouseFire) mockHouseFire.visible = false;
        inTransition = true;
        sound('splash');
        sound('bonus');
        if (flashAt) flashAt(mockHouse.position.x, mockHouse.position.y + 5.2, mockHouse.position.z, 2.5);
        updateBannerUI(
          '✅ SIMULATED ROOFTOP FIRE EXTINGUISHED!',
          'Structure saved! Preparing Step 5: Guardian Code — Harm No Humans...',
          100,
          true
        );
      }
    }

    // --- STEP 5: Guardian Code — Harm No Humans! (Defensive Gas) ---
    else if (currentStep === 5) {
      const distToCruiser = mockCruiser ? Math.hypot(dragonPos.x - mockCruiser.position.x, dragonPos.y - mockCruiser.position.y) : 999;
      const inGasRange = distToCruiser < 12.0;

      updateBannerUI(
        '🛡️ ASTRAL VOID SIMULATOR — STEP 5/5: GUARDIAN CODE — HARM NO HUMANS!',
        `Police cruiser below is shooting! Fly overhead (${inGasRange ? '<b style="color:#34d399">IN GAS RANGE!</b>' : 'fly lower'}) and press <b style="background:#059669;padding:2px 6px;border-radius:3px">F</b> or <b style="background:#059669;padding:2px 6px;border-radius:3px">RIGHT CLICK</b> to drop non-lethal gas!`,
        mockCruiserDisabled ? 100 : (inGasRange ? 65 : 25)
      );

      if (!isGasDeployed) gasObserved = true;
      if ((mockCruiserDisabled || (gasObserved && isGasDeployed && inGasRange)) && stepTimer > 0.6) {
        mockCruiserDisabled = true;
        if (mockCruiserStasis) {
          mockCruiserStasis.material.opacity = 0.75;
        }
        if (mockCruiserStrobes[0]) {
          mockCruiserStrobes[0].material.color.setHex(0x10b981);
          mockCruiserStrobes[0].visible = true;
        }
        if (mockCruiserStrobes[1]) {
          mockCruiserStrobes[1].material.color.setHex(0x10b981);
          mockCruiserStrobes[1].visible = true;
        }

        inTransition = true;
        sound('bonus');
        updateBannerUI(
          '✅ POLICE CRUISER NON-LETHALLY DISABLED!',
          'Guardian oath upheld: Paulo harms NO humans! All systems mastered...',
          100,
          true
        );
      }
    }
  }

  function completeAndExit() {
    if (!active) return;
    graduationPending = false;
    active = false;
    currentStep = 6;
    cameraFocus = { x: 0, y: 16, z: 15, zoom: 1.0, active: false };
    hideBanner();
    cleanupVoidStage();

    if (setCitySceneVisible) {
      setCitySceneVisible(true);
    }

    if (onComplete) {
      onComplete();
    }
  }

  function skip() {
    if (!active) return;
    graduationPending = false;
    active = false;
    currentStep = 6;
    cameraFocus = { x: 0, y: 16, z: 15, zoom: 1.0, active: false };
    hideBanner();
    cleanupVoidStage();

    if (setCitySceneVisible) {
      setCitySceneVisible(true);
    }

    sound('bonus');
    message('⏩ SIMULATION SKIPPED — WARPING TO PHILADELPHIA CAMPAIGN!');
    if (onComplete) {
      onComplete();
    }
  }

  function reset() {
    const wasActive=active;
    active = false;
    graduationPending=false;targetMeteor1=null;gasObserved=false;
    cameraFocus={x:0,y:16,z:15,zoom:1,active:false};
    currentStep = 0;
    hideBanner();
    cleanupVoidStage();
    if (wasActive && setCitySceneVisible) {
      setCitySceneVisible(true);
    }
  }

  return {
    start,
    reset,
    skip,
    advanceToStep,
    update,
    isActive: () => active,
    isVoidMode: () => active,
    getCameraFocus: () => cameraFocus,
    getStats: () => ({
      active,
      step: currentStep,
      flightDistance,
      mockHouseExtinguished,
      mockCruiserDisabled
    }),
    extinguishFire: () => {
      mockHouseExtinguished = true;
      if (mockHouseFire) mockHouseFire.visible = false;
    },
    disableCruiser: () => {
      mockCruiserDisabled = true;
      if (mockCruiserStasis) mockCruiserStasis.material.opacity = 0.75;
    }
  };
}
