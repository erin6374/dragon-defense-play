import * as THREE from 'three';

export function createOrbitalTheater(scene, camera, visualBank, flashAt, sound, message, emitImpact, cinematicFX) {
  const group = new THREE.Group();
  group.name = 'orbital-theater';
  scene.add(group);

  // 1. Skimming Titan Meteor (Massive screen-stretching celestial body)
  // Only shows a colossal sliver of its cratered, smoldering bottom skimming Earth
  const titanRadius = 540;
  const titanGeo = new THREE.SphereGeometry(titanRadius, 48, 32);
  const titanCanvas = document.createElement('canvas');
  titanCanvas.width = 512;
  titanCanvas.height = 512;
  const tCtx = titanCanvas.getContext('2d');
  tCtx.fillStyle = '#1c1614';
  tCtx.fillRect(0, 0, 512, 512);
  // Magma fissures and crater noise
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * 512, y = Math.random() * 512, r = 8 + Math.random() * 26;
    const g = tCtx.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, '#ff5500');
    g.addColorStop(0.35, '#882200');
    g.addColorStop(0.8, '#2b201a');
    g.addColorStop(1, '#1c1614');
    tCtx.fillStyle = g;
    tCtx.beginPath();
    tCtx.arc(x, y, r, 0, Math.PI * 2);
    tCtx.fill();
  }
  for (let j = 0; j < 35; j++) {
    tCtx.strokeStyle = '#ff7700';
    tCtx.lineWidth = 1.5 + Math.random() * 2.5;
    tCtx.beginPath();
    let cx = Math.random() * 512, cy = Math.random() * 512;
    tCtx.moveTo(cx, cy);
    for (let k = 0; k < 6; k++) {
      cx += (Math.random() - 0.5) * 60;
      cy += (Math.random() - 0.5) * 60;
      tCtx.lineTo(cx, cy);
    }
    tCtx.stroke();
  }

  const titanTexture = new THREE.CanvasTexture(titanCanvas);
  titanTexture.wrapS = THREE.RepeatWrapping;
  titanTexture.wrapT = THREE.RepeatWrapping;
  titanTexture.repeat.set(4, 2);

  const titanMat = new THREE.MeshStandardMaterial({
    map: titanTexture,
    color: 0x4a3c36,
    roughness: 0.88,
    metalness: 0.15,
    emissive: 0xff3b00,
    emissiveIntensity: 0.42,
    emissiveMap: titanTexture
  });

  const titanMesh = new THREE.Mesh(titanGeo, titanMat);
  // Position titan so its bottom curve skims along y ~ 210 across the top of the sky
  titanMesh.position.set(0, titanRadius + 205, -15);
  group.add(titanMesh);

  // Atmospheric ablation / plasma burn rim along bottom of skimming meteor
  const rimGeo = new THREE.TorusGeometry(titanRadius * 0.98, 4.2, 12, 64, Math.PI * 0.7);
  const rimMat = new THREE.MeshBasicMaterial({
    color: 0xff9922,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide
  });
  const plasmaRim = new THREE.Mesh(rimGeo, rimMat);
  plasmaRim.rotation.x = Math.PI * 0.48;
  plasmaRim.rotation.z = Math.PI * 0.15;
  plasmaRim.position.set(0, -titanRadius + 8, 2);
  titanMesh.add(plasmaRim);

  // 2. Rows of Elon Musk Satellites (Starlink-style) in Upper Orbit
  const satellites = [];
  const SAT_COUNT = 7;
  const satSpacing = 48;

  // Shared satellite components
  const satBodyMat = new THREE.MeshStandardMaterial({ color: 0xadb5bd, metalness: 0.85, roughness: 0.22 });
  const satSolarMat = new THREE.MeshStandardMaterial({ color: 0x0f294a, metalness: 0.45, roughness: 0.25, emissive: 0x071526 });
  const satIonMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
  const satShieldMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.35,
    wireframe: true,
    depthWrite: false
  });

  for (let s = 0; s < SAT_COUNT; s++) {
    const satGroup = new THREE.Group();
    const baseX = (s - (SAT_COUNT - 1) / 2) * satSpacing;
    const baseY = 245 + Math.sin(s * 1.3) * 6;
    const baseZ = 2 + (s % 2) * 5;
    satGroup.position.set(baseX, baseY, baseZ);

    // Main flat-panel bus
    const bus = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.7, 2.4), satBodyMat);
    satGroup.add(bus);

    // Single large Starlink-style deployed solar array wing
    const wingDir = s % 2 === 0 ? 1 : -1;
    const solarWing = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.08, 2.6), satSolarMat);
    solarWing.position.set(wingDir * 7.8, 0, 0);
    satGroup.add(solarWing);

    // Phased array antenna bottom panel
    const antenna = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.15, 2.0), satBodyMat);
    antenna.position.set(0, -0.42, 0);
    satGroup.add(antenna);

    // Dual upward laser cannon turrets
    const turretL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.9, 8), satBodyMat);
    turretL.position.set(-1.1, 0.6, 0.4);
    satGroup.add(turretL);
    const turretR = turretL.clone();
    turretR.position.x = 1.1;
    satGroup.add(turretR);

    // Glowing blue ion thruster
    const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.2, 0.5, 8), satIonMat);
    thruster.rotation.x = Math.PI * 0.5;
    thruster.position.set(-wingDir * 2.2, 0, -1.3);
    satGroup.add(thruster);

    // Translucent hexagonal energy shield bubble
    const shield = new THREE.Mesh(new THREE.SphereGeometry(6.2, 12, 10), satShieldMat.clone());
    shield.visible = true;
    satGroup.add(shield);

    // Upward laser beam line
    const laserMat = new THREE.LineBasicMaterial({ color: 0x38ef7d, linewidth: 2, transparent: true, opacity: 0 });
    const laserGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.8, 0),
      new THREE.Vector3(0, 95, 0)
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
      bus,
      shield,
      laserLine,
      laserMat,
      empLine,
      empMat,
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

  let meteorEjectTimer = 4.0;
  let goldRedPowerupSpawned = false;

  return {
    group,
    satellites,
    titanMesh,
    update(dt, elapsed, wave, dragonPos, isMegaFireActive, onSpawnPowerup, onSpawnMeteor, onShockDragon) {
      // 1. Skimming Titan continuous drift across the top of the sky
      titanMesh.position.x += dt * 1.5;
      if (titanMesh.position.x > 320) titanMesh.position.x = -320;
      titanMesh.rotation.y += dt * 0.008;
      plasmaRim.material.opacity = 0.55 + Math.sin(elapsed * 5) * 0.18;

      // Titan ejects falling meteors periodically when struck by lasers
      meteorEjectTimer -= dt;
      if (meteorEjectTimer <= 0) {
        meteorEjectTimer = 3.5 + Math.random() * 3.0;
        const ejectX = (Math.random() - 0.5) * 140;
        onSpawnMeteor?.(ejectX, 195, -5);
      }

      // In Wave 15 finale, after main armada, eject sparkling gold-red power-up meteor
      if (wave === 15 && !goldRedPowerupSpawned && satellites.some(s => !s.destroyed)) {
        goldRedPowerupSpawned = true;
        onSpawnPowerup?.('mega_fire_breath', 0, 190, 5);
        message?.('OVERHEAD TITAN METEOR EJECTED SPARKLING GOLD-RED POWERUP! DESTROY IT FOR MEGA FIRE BREATH!');
      }

      // 2. Satellites update
      const activeSats = satellites.filter(s => !s.destroyed);
      const isFinaleEvasion = wave === 15 && isMegaFireActive;

      for (const s of activeSats) {
        // Laser firing at the titan meteor
        s.laserTimer -= dt;
        if (s.laserTimer <= 0) {
          s.laserFiring = !s.laserFiring;
          s.laserTimer = s.laserFiring ? 0.45 : (1.4 + Math.random() * 2.2);
          s.laserMat.opacity = s.laserFiring ? 0.95 : 0;
          if (s.laserFiring) {
            flashAt?.(s.root.position.x, s.root.position.y + 75, s.root.position.z, 2.2);
            cinematicFX?.shock(new THREE.Vector3(s.root.position.x, s.root.position.y + 75, s.root.position.z), 3.5);
          }
        }

        // Shield flash decay
        if (s.shieldFlash > 0) {
          s.shieldFlash -= dt * 3.5;
          s.shield.material.opacity = Math.max(0.35, s.shieldFlash);
          s.shield.material.color.setHex(0xffffff);
        } else {
          s.shield.material.color.setHex(0x38bdf8);
        }

        // Proximity EMP shock attack on Dragon when dragon ascends into upper orbit
        s.empCooldown -= dt;
        const distToDragon = s.root.position.distanceTo(dragonPos);
        if (dragonPos.y > 155 && distToDragon < 65 && s.empCooldown <= 0) {
          s.empCooldown = 4.2;
          s.empMat.opacity = 1.0;
          // Point EMP beam at dragon
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
    hitSatellite(sat, damage, isMegaFire) {
      if (sat.destroyed) return false;
      if (!isMegaFire) {
        // Shield absorbs and deflects ordinary fire
        sat.shieldFlash = 1.0;
        sound?.('clang');
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
        sound?.('crash');
        flashAt?.(sat.root.position.x, sat.root.position.y, sat.root.position.z, 5.0);
        cinematicFX?.shock(sat.root.position, 9.0);
        emitImpact?.(sat.root.position.x, sat.root.position.y, sat.root.position.z, 95, 2.2);
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
      meteorEjectTimer = 4.0;
      for (const s of satellites) {
        s.destroyed = false;
        s.hp = 100;
        s.root.position.set(s.baseX, s.baseY, s.baseZ);
        s.root.rotation.set(0, 0, 0);
        s.shield.visible = true;
        s.laserMat.opacity = 0;
        s.empMat.opacity = 0;
        s.shieldFlash = 0;
        if (!group.children.includes(s.root)) group.add(s.root);
      }
    }
  };
}
