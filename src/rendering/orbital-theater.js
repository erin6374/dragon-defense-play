import * as THREE from 'three';

export function createOrbitalTheater(scene, camera, visualBank, flashAt, sound, message, emitImpact, cinematicFX, onSatWarning, onHideSatWarning) {
  const group = new THREE.Group();
  group.name = 'orbital-theater';
  scene.add(group);

  // =========================================================================
  // 1. COLOSSAL TITAN METEOR AT ABSOLUTE CEILING (RADIUS 1450, Y_BASE = R + 368, Z = -180)
  // Positioned at the very top reachable screen of the map (flight ceiling ~ 378).
  // The bottom curve skims along y = 368 across the top of the sky (x from -560 to +560).
  // Rotated 90 deg along X to position equator at bottom rim (zero UV pole distortion).
  // =========================================================================
  const titanRadius = 1450;
  const titanGeo = new THREE.SphereGeometry(titanRadius, 72, 54);
  titanGeo.rotateX(Math.PI * 0.5); // Orient equator at bottom rim to eliminate pole pinch!

  const titanCanvas = document.createElement('canvas');
  titanCanvas.width = 1024;
  titanCanvas.height = 1024;
  const tCtx = titanCanvas.getContext('2d');

  // Deep space basalt/obsidian mantle
  tCtx.fillStyle = '#0a0908';
  tCtx.fillRect(0, 0, 1024, 1024);

  // Multi-colored mineral patches: iron oxide rust, silicate teals, sulfur yellows, deep basalt
  const mineralColors = [
    { fill: '#7c1c00', size: 160 }, // Iron rust red
    { fill: '#54160a', size: 190 }, // Deep ochre / terracotta
    { fill: '#123432', size: 120 }, // Silicate mineral teal
    { fill: '#362d0e', size: 140 }, // Sulfur olivine
    { fill: '#1e120d', size: 170 }, // Dark basalt
    { fill: '#a83c00', size: 100 }  // Magma caldera basin
  ];

  for (let p = 0; p < 90; p++) {
    const min = mineralColors[p % mineralColors.length];
    const mx = Math.random() * 1024, my = Math.random() * 1024;
    const rad = (min.size * 0.5) + Math.random() * (min.size * 0.8);
    const mg = tCtx.createRadialGradient(mx, my, rad * 0.1, mx, my, rad);
    mg.addColorStop(0, min.fill);
    mg.addColorStop(1, 'transparent');
    tCtx.fillStyle = mg;
    tCtx.beginPath();
    tCtx.arc(mx, my, rad, 0, Math.PI * 2);
    tCtx.fill();
  }

  // Deep impact craters with glowing molten centers
  for (let i = 0; i < 150; i++) {
    const cx = Math.random() * 1024, cy = Math.random() * 1024;
    const cr = 14 + Math.random() * 48;
    const cg = tCtx.createRadialGradient(cx, cy, cr * 0.08, cx, cy, cr);
    cg.addColorStop(0, '#ff7700');
    cg.addColorStop(0.32, '#c42000');
    cg.addColorStop(0.68, '#3d1c14');
    cg.addColorStop(0.88, '#1b120e');
    cg.addColorStop(1, 'transparent');
    tCtx.fillStyle = cg;
    tCtx.beginPath();
    tCtx.arc(cx, cy, cr, 0, Math.PI * 2);
    tCtx.fill();
  }

  // Seething glowing veins of fire (magma fissures)
  for (let j = 0; j < 70; j++) {
    let vx = Math.random() * 1024, vy = Math.random() * 1024;
    tCtx.strokeStyle = j % 3 === 0 ? '#ffcc22' : (j % 2 === 0 ? '#ff5500' : '#ff1a00');
    tCtx.lineWidth = 2.4 + Math.random() * 3.6;
    tCtx.shadowColor = '#ff5500';
    tCtx.shadowBlur = 10;
    tCtx.beginPath();
    tCtx.moveTo(vx, vy);
    const steps = 7 + Math.floor(Math.random() * 9);
    for (let k = 0; k < steps; k++) {
      vx += (Math.random() - 0.5) * 85;
      vy += (Math.random() - 0.5) * 85;
      tCtx.lineTo(vx, vy);
    }
    tCtx.stroke();
    tCtx.shadowBlur = 0;
  }

  const titanTexture = new THREE.CanvasTexture(titanCanvas);
  titanTexture.wrapS = THREE.RepeatWrapping;
  titanTexture.wrapT = THREE.RepeatWrapping;
  titanTexture.repeat.set(4, 2);

  const titanMat = new THREE.MeshStandardMaterial({
    map: titanTexture,
    color: 0x5a4840,
    roughness: 0.88,
    metalness: 0.20,
    emissive: 0xff3300,
    emissiveIntensity: 0.75,
    emissiveMap: titanTexture
  });

  const titanMesh = new THREE.Mesh(titanGeo, titanMat);
  // Positioned at the very ceiling of the vertical map: bottom contour at y = 368
  const TITAN_BASE_Y = titanRadius + 368;
  const TITAN_BASE_Z = -180;
  titanMesh.position.set(0, TITAN_BASE_Y, TITAN_BASE_Z);
  group.add(titanMesh);

  // Surface explosion sparks on Titan where lasers blast fissures
  const surfaceExplosions = [];
  const blastSpriteMat = new THREE.SpriteMaterial({
    map: visualBank.images.flash,
    color: 0xff5511,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  for (let b = 0; b < 12; b++) {
    const sp = new THREE.Sprite(blastSpriteMat.clone());
    sp.visible = false;
    group.add(sp);
    surfaceExplosions.push({ sprite: sp, life: 0, maxLife: 0.55 });
  }

  function triggerTitanSurfaceBlast(x, y, z, scale = 18) {
    const b = surfaceExplosions.find(e => e.life <= 0) || surfaceExplosions[0];
    b.sprite.position.set(x, y, z);
    b.sprite.scale.setScalar(scale);
    b.sprite.visible = true;
    b.sprite.material.opacity = 1.0;
    b.life = b.maxLife;
    flashAt?.(x, y, z, 3.8);
    cinematicFX?.shock(new THREE.Vector3(x, y, z), 7.5);
    emitImpact?.(x, y, z, 45, 1.4);
  }

  // =========================================================================
  // 2. ROWS OF HIGH-TECH MILITARISTIC SATELLITES AT MAP CEILING (ALTITUDE Y ~ 325)
  // Hovering on the final top reachable screen in a 2-tier Starlink orbital constellation.
  // =========================================================================
  const satellites = [];
  const SAT_ROWS = 2;
  const SATS_PER_ROW = 6;
  const SAT_COUNT = SAT_ROWS * SATS_PER_ROW;
  const satSpacing = 48;

  const satStealthMat = new THREE.MeshStandardMaterial({
    color: 0x222730,
    metalness: 0.88,
    roughness: 0.30
  });
  const satArmorPlatingMat = new THREE.MeshStandardMaterial({
    color: 0x364150,
    metalness: 0.82,
    roughness: 0.32
  });
  const satGoldFoilMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.95,
    roughness: 0.18,
    emissive: 0x3d3008
  });
  const satSolarWingMat = new THREE.MeshStandardMaterial({
    color: 0x0a1e38,
    metalness: 0.75,
    roughness: 0.18,
    emissive: 0x040f1f
  });
  const satSolarFrameMat = new THREE.MeshStandardMaterial({
    color: 0x141820,
    metalness: 0.90,
    roughness: 0.25
  });
  const satIonThrusterMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
  const satLaserBarrelMat = new THREE.MeshStandardMaterial({
    color: 0x3b424d,
    metalness: 0.92,
    roughness: 0.22
  });
  const satLaserMuzzleMat = new THREE.MeshBasicMaterial({ color: 0x44ff88 });

  const navRedMat = new THREE.MeshBasicMaterial({ color: 0xff1122 });
  const navGreenMat = new THREE.MeshBasicMaterial({ color: 0x00ff66 });
  const beaconAmberMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
  const beaconWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const sensorCyanMat = new THREE.MeshBasicMaterial({ color: 0x00d9ff });

  const satElectricArcMat = new THREE.LineBasicMaterial({
    color: 0x55cbff,
    transparent: true,
    opacity: 0.95,
    depthWrite: false
  });
  const satElectricCoreMat = new THREE.MeshBasicMaterial({
    color: 0xbaf6ff,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  });
  const satElectricCoreGeo = new THREE.CylinderGeometry(0.18, 0.18, 1, 8);
  const shieldGeo = new THREE.SphereGeometry(7.2, 16, 12);

  const electricFrom = new THREE.Vector3();
  const electricTo = new THREE.Vector3();
  const electricDiff = new THREE.Vector3();

  for (let s = 0; s < SAT_COUNT; s++) {
    const satGroup = new THREE.Group();
    satGroup.scale.setScalar(1.35);
    const row = Math.floor(s / SATS_PER_ROW);
    const col = s % SATS_PER_ROW;
    const baseX = (col - (SATS_PER_ROW - 1) / 2) * satSpacing + (row * 24);
    // Row 0: Front tier at y ~ 320, z ~ 4; Row 1: Upper tier at y ~ 338, z ~ -18
    const baseY = (row === 0 ? 320 : 338) + Math.sin(col * 1.3 + row) * 8;
    const baseZ = (row === 0 ? 4 : -18) + (col % 2) * 8;
    satGroup.position.set(baseX, baseY, baseZ);

    const busMain = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.1, 3.0), satStealthMat);
    satGroup.add(busMain);

    const topArmor = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.55, 2.4), satArmorPlatingMat);
    topArmor.position.set(0, 0.75, 0);
    satGroup.add(topArmor);

    const foilPod = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.65, 1.4), satGoldFoilMat);
    foilPod.position.set(0, 0.55, 0.95);
    satGroup.add(foilPod);

    const turretBase = new THREE.Group();
    turretBase.position.set(0, -0.75, 0.6);
    const sensorDome = new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 10), sensorCyanMat);
    turretBase.add(sensorDome);
    satGroup.add(turretBase);

    const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.12, 0.35, 12), satArmorPlatingMat);
    dish.rotation.x = Math.PI * 0.35;
    dish.position.set(-1.6, -0.65, -0.7);
    satGroup.add(dish);

    const wingDir = s % 2 === 0 ? 1 : -1;
    const wingGroup = new THREE.Group();
    wingGroup.position.set(wingDir * 2.8, 0, 0);

    const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 2.6, 8), satSolarFrameMat);
    boom.rotation.z = Math.PI * 0.5;
    boom.position.set(wingDir * 1.3, 0, 0);
    wingGroup.add(boom);

    const solarInner = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.08, 2.8), satSolarWingMat);
    solarInner.position.set(wingDir * 4.6, 0, 0);
    wingGroup.add(solarInner);

    const solarOuter = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.08, 2.8), satSolarWingMat);
    solarOuter.position.set(wingDir * 10.8, 0, 0);
    wingGroup.add(solarOuter);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.12, 2.95), satSolarFrameMat);
    frame.position.set(wingDir * 7.7, 0, 0);
    wingGroup.add(frame);

    satGroup.add(wingGroup);

    const turretL = new THREE.Group();
    const barrelL = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.28, 2.0, 8), satLaserBarrelMat);
    barrelL.position.y = 1.0;
    turretL.add(barrelL);
    for (let f = 0; f < 3; f++) {
      const fin = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.08, 8), satArmorPlatingMat);
      fin.position.y = 0.55 + f * 0.38;
      turretL.add(fin);
    }
    const muzzleL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.22, 8), satLaserMuzzleMat);
    muzzleL.position.y = 2.05;
    turretL.add(muzzleL);
    turretL.position.set(-1.4, 0.7, 0.4);
    satGroup.add(turretL);

    const turretR = turretL.clone();
    turretR.position.x = 1.4;
    satGroup.add(turretR);

    const thrusterL = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.20, 0.75, 8), satIonThrusterMat);
    thrusterL.rotation.x = Math.PI * 0.5;
    thrusterL.position.set(-wingDir * 1.6, 0, -1.6);
    satGroup.add(thrusterL);

    const thrusterR = thrusterL.clone();
    thrusterR.position.x = -wingDir * 0.5;
    satGroup.add(thrusterR);

    const blinkingLights = [];
    const wingtipLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 8, 8),
      s % 2 === 0 ? navRedMat.clone() : navGreenMat.clone()
    );
    wingtipLight.position.set(wingDir * 16.8, 0.15, 0);
    satGroup.add(wingtipLight);
    blinkingLights.push({ mesh: wingtipLight, rate: 1.8, phase: s * 0.8 });

    const ledAmber = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.20, 0.20), beaconAmberMat.clone());
    ledAmber.position.set(-2.0, 0.65, 1.55);
    satGroup.add(ledAmber);
    blinkingLights.push({ mesh: ledAmber, rate: 3.5, phase: s * 1.2 });

    const ledWhite = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.20, 0.20), beaconWhiteMat.clone());
    ledWhite.position.set(2.0, 0.65, 1.55);
    satGroup.add(ledWhite);
    blinkingLights.push({ mesh: ledWhite, rate: 4.8, phase: s * 0.5 });

    const ledCyan = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), sensorCyanMat.clone());
    ledCyan.position.set(0, 1.1, -0.7);
    satGroup.add(ledCyan);
    blinkingLights.push({ mesh: ledCyan, rate: 2.2, phase: s * 1.5 });

    const satShieldMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
      wireframe: true,
      depthWrite: false
    });
    const shield = new THREE.Mesh(shieldGeo, satShieldMat);
    shield.visible = false;
    satGroup.add(shield);

    const laserMat = new THREE.LineBasicMaterial({ color: 0x44ff88, linewidth: 3, transparent: true, opacity: 0 });
    const laserGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 2.0, 0.4),
      new THREE.Vector3(0, 55, 0)
    ]);
    const laserLine = new THREE.Line(laserGeo, laserMat);
    satGroup.add(laserLine);

    // Sustained 3D electric shock beam
    const electricGroup = new THREE.Group();
    electricGroup.visible = false;
    const arcSegments = 14;
    const arcPositions = new Float32Array(arcSegments * 2 * 3);
    const arcGeo = new THREE.BufferGeometry();
    const arcAttr = new THREE.BufferAttribute(arcPositions, 3);
    arcAttr.setUsage(THREE.DynamicDrawUsage);
    arcGeo.setAttribute('position', arcAttr);
    const electricArcs = new THREE.LineSegments(arcGeo, satElectricArcMat);
    electricArcs.frustumCulled = false;
    electricGroup.add(electricArcs);

    const electricCore = new THREE.Mesh(satElectricCoreGeo, satElectricCoreMat);
    electricGroup.add(electricCore);
    group.add(electricGroup);

    group.add(satGroup);

    satellites.push({
      root: satGroup,
      bus: busMain,
      turretBase,
      shield,
      laserLine,
      laserMat,
      electricGroup,
      electricArcs,
      electricCore,
      blinkingLights,
      baseX,
      baseY,
      baseZ,
      hp: 100,
      destroyed: false,
      dodgeX: 0,
      dodgeSpeed: 24,
      laserTimer: 0.8 + Math.random() * 2.2,
      laserFiring: false,
      contactTime: 0,
      shockCooldown: 0,
      shieldFlash: 0
    });
  }

  let meteorEjectTimer = 3.2;
  let goldRedPowerupSpawned = false;
  let goldRedPowerupTimer = 1.5;
  let satelliteBattery = 1.0;

  return {
    group,
    satellites,
    titanMesh,
    getBattery() { return satelliteBattery; },
    setBattery(v) { satelliteBattery = Math.max(0, Math.min(1, v)); },
    update(dt, elapsed, wave, dragonPos, isMegaFireActive, onSpawnPowerup, onSpawnMeteor, onShockDragon, onBatteryDepleted) {
      // 1. Skimming Titan continuous drift across the upper exosphere
      titanMesh.position.x += dt * 1.5;
      if (titanMesh.position.x > 380) titanMesh.position.x = -380;
      titanMesh.rotation.z += dt * 0.008;

      titanMat.emissiveIntensity = 0.85 + Math.sin(elapsed * 2.5) * 0.28;

      // Update surface explosion blossoms
      for (const ex of surfaceExplosions) {
        if (ex.life > 0) {
          ex.life -= dt;
          const prog = 1 - (ex.life / ex.maxLife);
          ex.sprite.material.opacity = Math.max(0, 1 - prog);
          ex.sprite.scale.setScalar(14 + prog * 18);
          if (ex.life <= 0) ex.sprite.visible = false;
        }
      }

      // Battery drains while satellites operate (Waves 1-14 have finite battery pacing)
      const prevBattery = satelliteBattery;
      if (wave < 15 && satelliteBattery > 0) {
        const waveDuration = Math.min(48, 26 + wave * 1.6);
        satelliteBattery = Math.max(0, satelliteBattery - dt / waveDuration);
        if (satelliteBattery === 0 && prevBattery > 0) {
          onBatteryDepleted?.();
        }
      }

      // Titan periodically ejects falling chunks ONLY while satellite battery is active
      if (satelliteBattery > 0) {
        meteorEjectTimer -= dt;
        if (meteorEjectTimer <= 0) {
          meteorEjectTimer = 2.8 + Math.random() * 2.6;
          const ejectX = (Math.random() - 0.5) * 180;
          triggerTitanSurfaceBlast(ejectX, 368, -165, 20);
          onSpawnMeteor?.(ejectX, 355, -5);
        }
      }

      // In Wave 15 finale, titan periodically ejects sparkling gold-red mega powerups until all satellites are destroyed!
      if (wave === 15 && satellites.some(s => !s.destroyed)) {
        goldRedPowerupTimer -= dt;
        if (!goldRedPowerupSpawned || (!isMegaFireActive && goldRedPowerupTimer <= 0) || goldRedPowerupTimer <= 0) {
          goldRedPowerupSpawned = true;
          goldRedPowerupTimer = 11.0;
          const ejectX = (Math.random() - 0.5) * 120;
          triggerTitanSurfaceBlast(ejectX, 368, -165, 26);
          onSpawnPowerup?.('mega_fire_breath', ejectX, 350, 5);
          message?.('⚡ TITAN OVERCHARGE — GOLD-RED MEGA POWERUP EJECTED! DESTROY FOR MEGA FIRE BREATH!');
        }
      }

      // 2. Satellites update
      const activeSats = satellites.filter(s => !s.destroyed);
      const isFinaleEvasion = wave === 15 && isMegaFireActive;

      let anySatShocking = false;
      let maxContactProgress = 0;

      for (const s of activeSats) {
        for (const bl of s.blinkingLights) {
          const blink = Math.sin(elapsed * (bl.rate * Math.PI * 2) + bl.phase);
          bl.mesh.visible = blink > (satelliteBattery > 0 ? 0.15 : 0.55);
        }

        // Laser firing at the titan meteor causing surface ruptures - ONLY while battery > 0!
        if (satelliteBattery > 0) {
          s.laserTimer -= dt;
          if (s.laserTimer <= 0) {
            s.laserFiring = !s.laserFiring;
            s.laserTimer = s.laserFiring ? 0.48 : (1.2 + Math.random() * 2.0);
            s.laserMat.opacity = s.laserFiring ? 0.95 : 0;
            if (s.laserFiring) {
              const strikeX = s.root.position.x + (Math.random() - 0.5) * 14;
              const strikeY = 368 + (Math.random() - 0.5) * 8;
              triggerTitanSurfaceBlast(strikeX, strikeY, -170, 16);
              sound?.('satLaser');
              if (Math.random() < 0.40) {
                onSpawnMeteor?.(strikeX, strikeY - 14, -5);
              }
            }
          }
        } else {
          s.laserFiring = false;
          s.laserMat.opacity = 0;
        }

        // Shield Deflection Flash
        if (s.shieldFlash > 0) {
          s.shieldFlash -= dt * 3.2;
          s.shield.visible = true;
          s.shield.material.opacity = Math.max(0, Math.min(0.85, s.shieldFlash));
          s.shield.material.color.setHex(s.shieldFlash > 0.7 ? 0xffffff : 0x38bdf8);
          s.shield.scale.setScalar(1.0 + (1.0 - Math.min(1, s.shieldFlash)) * 0.12);
        } else {
          s.shield.visible = false;
          s.shield.material.opacity = 0;
        }

        s.shockCooldown = Math.max(0, s.shockCooldown - dt);

        // ===================================================================
        // HELICOPTER-STYLE ELECTRICAL SHOCK BEAM TARGETING PAULO
        // Activates when dragon enters top orbital sector (altitude > 280, dist < 48)
        // ===================================================================
        const distToDragon = s.root.position.distanceTo(dragonPos);
        const inShockRange = dragonPos.y > 280 && distToDragon < 48 && s.shockCooldown <= 0;

        if (inShockRange) {
          anySatShocking = true;
          s.electricGroup.visible = true;

          s.turretBase.lookAt(dragonPos);

          electricFrom.set(s.root.position.x, s.root.position.y - 1.0, s.root.position.z + 0.6);
          electricTo.copy(dragonPos).add(new THREE.Vector3(0, 0.4, 0));
          electricDiff.subVectors(electricTo, electricFrom);
          const len = electricDiff.length();
          const segments = 14;
          const arr = s.electricArcs.geometry.attributes.position.array;

          for (let i = 0; i < segments; i++) {
            const a = i / segments, b = (i + 1) / segments;
            for (const [idx, t] of [[0, a], [1, b]]) {
              const nearEnd = Math.sin(t * Math.PI), jitter = nearEnd * 1.5;
              const off = Math.sin(elapsed * 36 + i * 5 + idx * 2 + s.baseX) * jitter;
              const k = Math.cos(elapsed * 42 + i * 3 + idx * 4 + s.baseX) * jitter;
              const n = i * 6 + idx * 3;
              arr[n] = electricFrom.x + electricDiff.x * t;
              arr[n + 1] = electricFrom.y + electricDiff.y * t + off;
              arr[n + 2] = electricFrom.z + electricDiff.z * t + k;
            }
          }
          s.electricArcs.geometry.attributes.position.needsUpdate = true;

          s.electricCore.position.copy(electricFrom).addScaledVector(electricDiff, 0.5);
          s.electricCore.scale.set(1, len, 1);
          s.electricCore.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), electricDiff.clone().normalize());

          s.contactTime += dt;
          const progress = Math.min(1.0, s.contactTime / 2.2);
          maxContactProgress = Math.max(maxContactProgress, progress);

          if (Math.random() < 0.28) sound?.('electric');

          if (s.contactTime >= 2.2) {
            s.contactTime = 0;
            s.shockCooldown = 4.8;
            s.electricGroup.visible = false;
            onShockDragon?.('SATELLITE ELECTRICAL DEFENSE GRID');
            sound?.('warning');
          }
        } else {
          if (s.contactTime > 0.05) s.shockCooldown = Math.max(s.shockCooldown, 1.2);
          s.contactTime = 0;
          s.electricGroup.visible = false;
        }

        // Finale evasive maneuvers (Wave 15)
        if (isFinaleEvasion) {
          const avoidDir = s.root.position.x > dragonPos.x ? 1 : -1;
          s.dodgeX = THREE.MathUtils.lerp(s.dodgeX, avoidDir * 32 + Math.sin(elapsed * 4 + s.baseX) * 20, dt * 2.5);
          s.root.position.x = s.baseX + s.dodgeX;
          s.root.position.y = s.baseY + Math.cos(elapsed * 3.5 + s.baseX) * 14;
          s.root.rotation.z = THREE.MathUtils.lerp(s.root.rotation.z, -avoidDir * 0.35, dt * 4);
        } else {
          s.root.position.x = s.baseX + Math.sin(elapsed * 0.8 + s.baseX) * 6;
          s.root.position.y = s.baseY + Math.sin(elapsed * 1.2 + s.baseX) * 3.5;
          s.root.rotation.z = THREE.MathUtils.lerp(s.root.rotation.z, 0, dt * 2);
        }
      }

      if (anySatShocking) {
        onSatWarning?.(maxContactProgress);
      } else {
        onHideSatWarning?.();
      }
    },
    triggerShieldDeflection(sat) {
      if (sat.destroyed) return;
      sat.shieldFlash = 1.2;
      sat.shield.visible = true;
      sat.shield.material.opacity = 0.85;
      sat.shield.material.color.setHex(0xffffff);
      sound?.('clang', { x: sat.root.position.x });
      cinematicFX?.shock(sat.root.position, 6.5);
    },
    hitSatellite(sat, damage, isMegaFire) {
      if (sat.destroyed) return false;
      if (!isMegaFire) {
        this.triggerShieldDeflection(sat);
        message?.('🛡️ SATELLITE FORCEFIELD DEFLECTS ATTACK — REQUIRE MEGA FIRE BREATH!');
        return false;
      }
      sat.hp -= damage;
      sat.shieldFlash = 1.8;
      if (sat.hp <= 0) {
        sat.destroyed = true;
        sat.shield.visible = false;
        sat.laserMat.opacity = 0;
        sat.electricGroup.visible = false;
        for (const bl of sat.blinkingLights) bl.mesh.visible = false;
        sound?.('crash', { x: sat.root.position.x });
        flashAt?.(sat.root.position.x, sat.root.position.y, sat.root.position.z, 5.5);
        cinematicFX?.shock(sat.root.position, 9.5);
        emitImpact?.(sat.root.position.x, sat.root.position.y, sat.root.position.z, 95, 2.4);
        group.remove(sat.root);
        message?.('💥 SATELLITE DISINTEGRATED BY MEGA FIRE BREATH! +1,000 PTS');
        return true;
      }
      return false;
    },
    allSatellitesDestroyed() {
      return satellites.every(s => s.destroyed);
    },
    reset() {
      goldRedPowerupSpawned = false;
      goldRedPowerupTimer = 1.5;
      meteorEjectTimer = 3.2;
      satelliteBattery = 1.0;
      onHideSatWarning?.();
      for (const s of satellites) {
        s.destroyed = false;
        s.hp = 100;
        s.root.position.set(s.baseX, s.baseY, s.baseZ);
        s.root.rotation.set(0, 0, 0);
        s.shield.visible = false;
        s.shield.material.opacity = 0;
        s.laserMat.opacity = 0;
        s.electricGroup.visible = false;
        s.shieldFlash = 0;
        s.contactTime = 0;
        s.shockCooldown = 0;
        for (const bl of s.blinkingLights) bl.mesh.visible = true;
        if (!group.children.includes(s.root)) group.add(s.root);
      }
    }
  };
}
