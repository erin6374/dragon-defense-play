import * as THREE from 'three';

export function createOrbitalTheater(scene, camera, visualBank, flashAt, sound, message, emitImpact, cinematicFX) {
  const group = new THREE.Group();
  group.name = 'orbital-theater';
  scene.add(group);

  // 1. Enhanced Massive Skimming Titan Meteor
  // Radius 580, skimming horizontally across the upper atmosphere at y ~ 190-230.
  // Featuring multi-colored mineral rocks (obsidian, iron ochre, teal silicate, sulfur)
  // and glowing seething fissures of living magma fire.
  const titanRadius = 580;
  const titanGeo = new THREE.SphereGeometry(titanRadius, 64, 48);

  const titanCanvas = document.createElement('canvas');
  titanCanvas.width = 1024;
  titanCanvas.height = 1024;
  const tCtx = titanCanvas.getContext('2d');

  // Base deep space obsidian / basalt crust
  tCtx.fillStyle = '#120f0e';
  tCtx.fillRect(0, 0, 1024, 1024);

  // Multi-colored mineral patches: iron oxide rust, silicate teals, sulfur yellows, deep basalt
  const mineralColors = [
    { fill: '#802200', size: 140 }, // Iron rust red
    { fill: '#5c1d0c', size: 180 }, // Deep ochre
    { fill: '#1b3b3a', size: 110 }, // Silicate mineral teal
    { fill: '#3d3014', size: 130 }, // Sulfur olivine
    { fill: '#2a1a12', size: 160 }, // Dark basalt
    { fill: '#a84400', size: 90 }   // Raw magma basin
  ];

  for (let p = 0; p < 80; p++) {
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
  for (let i = 0; i < 120; i++) {
    const cx = Math.random() * 1024, cy = Math.random() * 1024;
    const cr = 12 + Math.random() * 42;
    const cg = tCtx.createRadialGradient(cx, cy, cr * 0.1, cx, cy, cr);
    cg.addColorStop(0, '#ff6600');
    cg.addColorStop(0.3, '#bb2200');
    cg.addColorStop(0.65, '#3a1e16');
    cg.addColorStop(0.85, '#1e1410');
    cg.addColorStop(1, 'transparent');
    tCtx.fillStyle = cg;
    tCtx.beginPath();
    tCtx.arc(cx, cy, cr, 0, Math.PI * 2);
    tCtx.fill();
  }

  // Seething glowing veins of fire (magma fissures)
  for (let j = 0; j < 55; j++) {
    let vx = Math.random() * 1024, vy = Math.random() * 1024;
    tCtx.strokeStyle = j % 3 === 0 ? '#ffcc33' : (j % 2 === 0 ? '#ff5500' : '#ff2200');
    tCtx.lineWidth = 2.0 + Math.random() * 3.5;
    tCtx.shadowColor = '#ff5500';
    tCtx.shadowBlur = 8;
    tCtx.beginPath();
    tCtx.moveTo(vx, vy);
    const steps = 6 + Math.floor(Math.random() * 8);
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
  titanTexture.repeat.set(3, 2);

  const titanMat = new THREE.MeshStandardMaterial({
    map: titanTexture,
    color: 0x5a4840,
    roughness: 0.82,
    metalness: 0.25,
    emissive: 0xff3800,
    emissiveIntensity: 0.65,
    emissiveMap: titanTexture
  });

  const titanMesh = new THREE.Mesh(titanGeo, titanMat);
  // Positioned lower so its immense smoldering lower curve skims along y ~ 190 across the upper sky
  titanMesh.position.set(0, titanRadius + 188, -25);
  group.add(titanMesh);

  // Atmospheric plasma burn rim along bottom arc of skimming meteor
  const rimGeo = new THREE.TorusGeometry(titanRadius * 0.985, 5.5, 12, 80, Math.PI * 0.75);
  const rimMat = new THREE.MeshBasicMaterial({
    color: 0xff8c1a,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide
  });
  const plasmaRim = new THREE.Mesh(rimGeo, rimMat);
  plasmaRim.rotation.x = Math.PI * 0.48;
  plasmaRim.rotation.z = Math.PI * 0.12;
  plasmaRim.position.set(0, -titanRadius + 10, 2);
  titanMesh.add(plasmaRim);

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

  for (let b = 0; b < 10; b++) {
    const sp = new THREE.Sprite(blastSpriteMat.clone());
    sp.visible = false;
    group.add(sp);
    surfaceExplosions.push({ sprite: sp, life: 0, maxLife: 0.55 });
  }

  function triggerTitanSurfaceBlast(x, y, z, scale = 14) {
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

  // 2. High-Tech Militaristic Satellites in Upper Orbit
  const satellites = [];
  const SAT_COUNT = 7;
  const satSpacing = 52;

  // Shared high-tech militaristic materials
  const satStealthMat = new THREE.MeshStandardMaterial({
    color: 0x181c22, // Matte stealth carbon gunmetal
    metalness: 0.88,
    roughness: 0.28
  });
  const satArmorPlatingMat = new THREE.MeshStandardMaterial({
    color: 0x2d3440, // Tactical armor plating
    metalness: 0.75,
    roughness: 0.38
  });
  const satGoldFoilMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37, // Gold thermal foil insulation
    metalness: 0.95,
    roughness: 0.18,
    emissive: 0x3d3008
  });
  const satSolarWingMat = new THREE.MeshStandardMaterial({
    color: 0x091c36, // Deep dark blue photovoltaic cells
    metalness: 0.65,
    roughness: 0.20,
    emissive: 0x040e1c
  });
  const satSolarFrameMat = new THREE.MeshStandardMaterial({
    color: 0x11161d, // Carbon composite frame
    metalness: 0.85,
    roughness: 0.30
  });
  const satIonThrusterMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
  const satLaserBarrelMat = new THREE.MeshStandardMaterial({
    color: 0x3b424d,
    metalness: 0.92,
    roughness: 0.22
  });
  const satLaserMuzzleMat = new THREE.MeshBasicMaterial({ color: 0x44ff88 });

  // Blinking light materials
  const navRedMat = new THREE.MeshBasicMaterial({ color: 0xff1122 });
  const navGreenMat = new THREE.MeshBasicMaterial({ color: 0x00ff66 });
  const beaconAmberMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
  const beaconWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const sensorCyanMat = new THREE.MeshBasicMaterial({ color: 0x00d9ff });

  // Forcefield shield material (INDEPENDENT INSTANCES - invisible by default)
  const shieldGeo = new THREE.SphereGeometry(6.6, 16, 12);

  for (let s = 0; s < SAT_COUNT; s++) {
    const satGroup = new THREE.Group();
    const baseX = (s - (SAT_COUNT - 1) / 2) * satSpacing;
    const baseY = 248 + Math.sin(s * 1.3) * 6;
    const baseZ = 2 + (s % 2) * 5;
    satGroup.position.set(baseX, baseY, baseZ);

    // Main faceted stealth bus chassis
    const busMain = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.95, 2.8), satStealthMat);
    satGroup.add(busMain);

    // Dorsal armor sloped top casing
    const topArmor = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.45, 2.2), satArmorPlatingMat);
    topArmor.position.set(0, 0.65, 0);
    satGroup.add(topArmor);

    // Gold thermal foil telemetry pod
    const foilPod = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 1.2), satGoldFoilMat);
    foilPod.position.set(0, 0.45, 0.85);
    satGroup.add(foilPod);

    // Ventral FLIR tactical sensor dome
    const sensorDome = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 10), sensorCyanMat);
    sensorDome.position.set(0, -0.65, 0.6);
    satGroup.add(sensorDome);

    // High-gain communications dish
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.1, 0.3, 12), satArmorPlatingMat);
    dish.rotation.x = Math.PI * 0.35;
    dish.position.set(-1.4, -0.6, -0.6);
    satGroup.add(dish);

    // Articulated dual solar array wings with structural carbon trusses
    const wingDir = s % 2 === 0 ? 1 : -1;
    const wingGroup = new THREE.Group();
    wingGroup.position.set(wingDir * 2.5, 0, 0);

    // Carbon boom arm
    const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.4, 8), satSolarFrameMat);
    boom.rotation.z = Math.PI * 0.5;
    boom.position.set(wingDir * 1.2, 0, 0);
    wingGroup.add(boom);

    // Inner solar panel
    const solarInner = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.08, 2.5), satSolarWingMat);
    solarInner.position.set(wingDir * 4.2, 0, 0);
    wingGroup.add(solarInner);

    // Outer solar panel
    const solarOuter = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.08, 2.5), satSolarWingMat);
    solarOuter.position.set(wingDir * 9.8, 0, 0);
    wingGroup.add(solarOuter);

    // Solar panel frame border
    const frame = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.12, 2.65), satSolarFrameMat);
    frame.position.set(wingDir * 7.0, 0, 0);
    wingGroup.add(frame);

    satGroup.add(wingGroup);

    // Heavy militaristic dual laser cannon rail turrets
    const turretL = new THREE.Group();
    const barrelL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 1.8, 8), satLaserBarrelMat);
    barrelL.position.y = 0.9;
    turretL.add(barrelL);
    // Cooling radiator heatsink fins
    for (let f = 0; f < 3; f++) {
      const fin = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 8), satArmorPlatingMat);
      fin.position.y = 0.5 + f * 0.35;
      turretL.add(fin);
    }
    // Luminous laser focus muzzle
    const muzzleL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 8), satLaserMuzzleMat);
    muzzleL.position.y = 1.85;
    turretL.add(muzzleL);
    turretL.position.set(-1.25, 0.6, 0.4);
    satGroup.add(turretL);

    const turretR = turretL.clone();
    turretR.position.x = 1.25;
    satGroup.add(turretR);

    // Twin ion plasma thrusters
    const thrusterL = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.18, 0.65, 8), satIonThrusterMat);
    thrusterL.rotation.x = Math.PI * 0.5;
    thrusterL.position.set(-wingDir * 1.5, 0, -1.5);
    satGroup.add(thrusterL);

    const thrusterR = thrusterL.clone();
    thrusterR.position.x = -wingDir * 0.4;
    satGroup.add(thrusterR);

    // --- HIGH-TECH BLINKING LIGHTS SUITE ---
    const blinkingLights = [];

    // Wingtip navigation strobes (Red / Green)
    const wingtipLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 8, 8),
      s % 2 === 0 ? navRedMat.clone() : navGreenMat.clone()
    );
    wingtipLight.position.set(wingDir * 15.6, 0.15, 0);
    satGroup.add(wingtipLight);
    blinkingLights.push({ mesh: wingtipLight, rate: 1.8, phase: s * 0.8, baseColor: s % 2 === 0 ? 0xff1122 : 0x00ff66 });

    // Chassis telemetry LEDs (Amber / White)
    const ledAmber = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), beaconAmberMat.clone());
    ledAmber.position.set(-1.8, 0.55, 1.42);
    satGroup.add(ledAmber);
    blinkingLights.push({ mesh: ledAmber, rate: 3.5, phase: s * 1.2, baseColor: 0xffaa00 });

    const ledWhite = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), beaconWhiteMat.clone());
    ledWhite.position.set(1.8, 0.55, 1.42);
    satGroup.add(ledWhite);
    blinkingLights.push({ mesh: ledWhite, rate: 4.8, phase: s * 0.5, baseColor: 0xffffff });

    // Dorsal tactical beacon (Cyan)
    const ledCyan = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), sensorCyanMat.clone());
    ledCyan.position.set(0, 0.95, -0.6);
    satGroup.add(ledCyan);
    blinkingLights.push({ mesh: ledCyan, rate: 2.2, phase: s * 1.5, baseColor: 0x00d9ff });

    // Translucent hexagonal energy shield bubble
    // CRITICAL REQUIREMENT: INVISIBLE BY DEFAULT! ONLY TRIGGERS ON DEFLECTION!
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

    // Upward coherent laser beam line
    const laserMat = new THREE.LineBasicMaterial({ color: 0x44ff88, linewidth: 3, transparent: true, opacity: 0 });
    const laserGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 1.8, 0.4),
      new THREE.Vector3(0, 85, 0)
    ]);
    const laserLine = new THREE.Line(laserGeo, laserMat);
    satGroup.add(laserLine);

    // Downward EMP shock beam line targeting dragon
    const empMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 3, transparent: true, opacity: 0 });
    const empGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -50, 0)
    ]);
    const empLine = new THREE.Line(empGeo, empMat);
    satGroup.add(empLine);

    group.add(satGroup);

    satellites.push({
      root: satGroup,
      bus: busMain,
      shield,
      laserLine,
      laserMat,
      empLine,
      empMat,
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
      empCooldown: 2.5,
      shieldFlash: 0
    });
  }

  let meteorEjectTimer = 3.2;
  let goldRedPowerupSpawned = false;

  return {
    group,
    satellites,
    titanMesh,
    update(dt, elapsed, wave, dragonPos, isMegaFireActive, onSpawnPowerup, onSpawnMeteor, onShockDragon) {
      // 1. Skimming Titan continuous drift across the top of the sky
      titanMesh.position.x += dt * 1.8;
      if (titanMesh.position.x > 340) titanMesh.position.x = -340;
      titanMesh.rotation.y += dt * 0.009;
      plasmaRim.material.opacity = 0.65 + Math.sin(elapsed * 5.5) * 0.22;

      // Update surface explosion blossoms
      for (const ex of surfaceExplosions) {
        if (ex.life > 0) {
          ex.life -= dt;
          const prog = 1 - (ex.life / ex.maxLife);
          ex.sprite.material.opacity = Math.max(0, 1 - prog);
          ex.sprite.scale.setScalar(12 + prog * 16);
          if (ex.life <= 0) ex.sprite.visible = false;
        }
      }

      // Titan periodically ejects falling chunks when ruptured by satellite laser fire
      meteorEjectTimer -= dt;
      if (meteorEjectTimer <= 0) {
        meteorEjectTimer = 2.8 + Math.random() * 2.6;
        const ejectX = (Math.random() - 0.5) * 160;
        // Trigger visual rupture on Titan surface where chunk breaks off
        triggerTitanSurfaceBlast(ejectX, 192, -18, 18);
        onSpawnMeteor?.(ejectX, 186, -5);
      }

      // In Wave 15 finale, after main armada, titan ejects sparkling gold-red powerup
      if (wave === 15 && !goldRedPowerupSpawned && satellites.some(s => !s.destroyed)) {
        goldRedPowerupSpawned = true;
        triggerTitanSurfaceBlast(0, 190, 0, 24);
        onSpawnPowerup?.('mega_fire_breath', 0, 184, 5);
        message?.('⚡ OVERHEAD TITAN FRACTURED — GOLD-RED MEGA POWERUP EJECTED! DESTROY FOR MEGA FIRE BREATH!');
      }

      // 2. Satellites update
      const activeSats = satellites.filter(s => !s.destroyed);
      const isFinaleEvasion = wave === 15 && isMegaFireActive;

      for (const s of activeSats) {
        // High-tech blinking lights animation
        for (const bl of s.blinkingLights) {
          const blink = Math.sin(elapsed * (bl.rate * Math.PI * 2) + bl.phase);
          const isOn = blink > 0.15;
          bl.mesh.visible = isOn;
        }

        // Laser firing at the titan meteor causing surface ruptures
        s.laserTimer -= dt;
        if (s.laserTimer <= 0) {
          s.laserFiring = !s.laserFiring;
          s.laserTimer = s.laserFiring ? 0.48 : (1.2 + Math.random() * 2.0);
          s.laserMat.opacity = s.laserFiring ? 0.95 : 0;
          if (s.laserFiring) {
            // Laser strikes titan: trigger explosion blossom and fissure
            const strikeX = s.root.position.x + (Math.random() - 0.5) * 12;
            const strikeY = s.root.position.y + 78;
            triggerTitanSurfaceBlast(strikeX, strikeY, s.root.position.z - 15, 14);
            sound?.('laser');
          }
        }

        // SHIELD DEFLECTION ANIMATION:
        // Shield ONLY visible when shieldFlash > 0! Completely invisible/dormant otherwise!
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

        // Proximity EMP shock attack on Dragon when dragon ascends into upper orbit
        s.empCooldown -= dt;
        const distToDragon = s.root.position.distanceTo(dragonPos);
        if (dragonPos.y > 155 && distToDragon < 65 && s.empCooldown <= 0) {
          s.empCooldown = 4.2;
          s.empMat.opacity = 1.0;
          const localDragon = s.root.worldToLocal(dragonPos.clone());
          const positions = s.empLine.geometry.attributes.position.array;
          positions[3] = localDragon.x;
          positions[4] = localDragon.y;
          positions[5] = localDragon.z;
          s.empLine.geometry.attributes.position.needsUpdate = true;
          onShockDragon?.('SATELLITE EMP SHOCK BEAM');
          sound?.('electric');
          setTimeout(() => { s.empMat.opacity = 0; }, 450);
        }

        // Finale evasive maneuvers (Wave 15): satellites dart and dodge to avoid Paulo
        if (isFinaleEvasion) {
          const avoidDir = s.root.position.x > dragonPos.x ? 1 : -1;
          s.dodgeX = THREE.MathUtils.lerp(s.dodgeX, avoidDir * 28 + Math.sin(elapsed * 4 + s.baseX) * 18, dt * 2.5);
          s.root.position.x = s.baseX + s.dodgeX;
          s.root.position.y = s.baseY + Math.cos(elapsed * 3.5 + s.baseX) * 12;
          s.root.rotation.z = THREE.MathUtils.lerp(s.root.rotation.z, -avoidDir * 0.32, dt * 4);
        } else {
          s.root.position.x = s.baseX + Math.sin(elapsed * 0.8 + s.baseX) * 5;
          s.root.position.y = s.baseY + Math.sin(elapsed * 1.2 + s.baseX) * 3;
          s.root.rotation.z = THREE.MathUtils.lerp(s.root.rotation.z, 0, dt * 2);
        }
      }
    },
    triggerShieldDeflection(sat) {
      if (sat.destroyed) return;
      sat.shieldFlash = 1.2;
      sat.shield.visible = true;
      sat.shield.material.opacity = 0.85;
      sat.shield.material.color.setHex(0xffffff);
      sound?.('clang');
      cinematicFX?.shock(sat.root.position, 6.5);
    },
    hitSatellite(sat, damage, isMegaFire) {
      if (sat.destroyed) return false;
      if (!isMegaFire) {
        // Shield absorbs and deflects ordinary fire with visible flash ripple
        this.triggerShieldDeflection(sat);
        message?.('🛡️ SATELLITE FORCEFIELD DEFLECTS ATTACK — REQUIRE MEGA FIRE BREATH!');
        return false;
      }
      // Mega Fire Breath penetrates and destroys satellite!
      sat.hp -= damage;
      sat.shieldFlash = 1.8;
      if (sat.hp <= 0) {
        sat.destroyed = true;
        sat.shield.visible = false;
        sat.laserMat.opacity = 0;
        sat.empMat.opacity = 0;
        for (const bl of sat.blinkingLights) bl.mesh.visible = false;
        sound?.('crash');
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
      meteorEjectTimer = 3.2;
      for (const s of satellites) {
        s.destroyed = false;
        s.hp = 100;
        s.root.position.set(s.baseX, s.baseY, s.baseZ);
        s.root.rotation.set(0, 0, 0);
        s.shield.visible = false;
        s.shield.material.opacity = 0;
        s.laserMat.opacity = 0;
        s.empMat.opacity = 0;
        s.shieldFlash = 0;
        for (const bl of s.blinkingLights) bl.mesh.visible = true;
        if (!group.children.includes(s.root)) group.add(s.root);
      }
    }
  };
}
