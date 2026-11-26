import * as THREE from 'three';

/**
 * Street Curb Gutter Water Runoff & Storm Drain Catch Basin System
 * 
 * Simulates crowned roadway surface water drainage along North Broad Street curbs,
 * flowing into cast-iron storm drain catch basins with swirling drainage vortices,
 * curb throat openings, and specular pavement runoff films.
 */
export function createStreetWaterRunoff(scene) {
  const root = new THREE.Group();
  root.name = 'STREET-WATER-RUNOFF-SYSTEM';
  scene.add(root);

  // Gutter lines along North and South edges of Broad Street roadway
  // Broad Street roadway runs roughly Z = 15.2 to Z = 32.8
  const NORTH_GUTTER_Z = 15.35;
  const SOUTH_GUTTER_Z = 32.65;
  const GUTTER_MIN_X = -280.0;
  const GUTTER_MAX_X = 260.0;
  const GUTTER_LENGTH = GUTTER_MAX_X - GUTTER_MIN_X;

  // Storm drain catch basin locations along Broad Street curb corners
  const DRAIN_LOCATIONS = [
    { id: 'drain-diamond-north', x: 215.0, z: NORTH_GUTTER_Z, side: 'north' },
    { id: 'drain-diamond-south', x: 215.0, z: SOUTH_GUTTER_Z, side: 'south' },
    { id: 'drain-techfreire-north', x: 5.0, z: NORTH_GUTTER_Z, side: 'north' },
    { id: 'drain-techfreire-south', x: 5.0, z: SOUTH_GUTTER_Z, side: 'south' },
    { id: 'drain-dauphin-north', x: -75.0, z: NORTH_GUTTER_Z, side: 'north' },
    { id: 'drain-dauphin-south', x: -75.0, z: SOUTH_GUTTER_Z, side: 'south' },
    { id: 'drain-york-north', x: -140.0, z: NORTH_GUTTER_Z, side: 'north' },
    { id: 'drain-york-south', x: -140.0, z: SOUTH_GUTTER_Z, side: 'south' }
  ];

  // Materials
  const castIronMat = new THREE.MeshStandardMaterial({
    color: 0x1f1d1b,
    roughness: 0.88,
    metalness: 0.72
  });

  const curbConcreteMat = new THREE.MeshStandardMaterial({
    color: 0x5a5652,
    roughness: 0.94,
    metalness: 0.04
  });

  const waterFilmMat = new THREE.MeshStandardMaterial({
    color: 0x386580,
    roughness: 0.08,
    metalness: 0.25,
    transparent: true,
    opacity: 0.0, // Fades in as water accumulates
    envMapIntensity: 2.2,
    depthWrite: false
  });

  // RC167: Procedural dynamic ripple normal map
  function createRippleNormalTexture() {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = (x / size) * 2 - 1;
        const ny = (y / size) * 2 - 1;
        const dist = Math.sqrt(nx * nx + ny * ny);
        const dx = Math.cos(dist * 20.0) * (nx / (dist + 0.001));
        const dy = Math.cos(dist * 20.0) * (ny / (dist + 0.001));
        const r = Math.floor((dx * 0.5 + 0.5) * 255);
        const g = Math.floor((dy * 0.5 + 0.5) * 255);
        const idx = (y * size + x) * 4;
        imgData.data[idx] = r;
        imgData.data[idx + 1] = g;
        imgData.data[idx + 2] = 255;
        imgData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(24, 2);
    return tex;
  }

  const rippleNormalTex = createRippleNormalTexture();

  const waterFlowRibbonMat = new THREE.MeshStandardMaterial({
    color: 0x5088aa,
    roughness: 0.12,
    metalness: 0.35,
    normalMap: rippleNormalTex,
    normalScale: new THREE.Vector2(0.35, 0.35),
    transparent: true,
    opacity: 0.0,
    depthWrite: false
  });

  // Build Storm Drain Grates & Curb Throat Inlets
  const drainObjects = [];
  for (const loc of DRAIN_LOCATIONS) {
    const drainGroup = new THREE.Group();
    drainGroup.name = loc.id;
    drainGroup.position.set(loc.x, 0.02, loc.z);

    // Cast-iron perimeter frame
    const frameGeo = new THREE.BoxGeometry(1.6, 0.06, 0.95);
    const frame = new THREE.Mesh(frameGeo, castIronMat);
    frame.position.y = 0.01;
    drainGroup.add(frame);

    // Slotted grate bars
    const numBars = 9;
    for (let b = 0; b < numBars; b++) {
      const bZ = ((b + 0.5) / numBars - 0.5) * 0.76;
      const bar = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.08, 0.045), castIronMat);
      bar.position.set(0, 0.02, bZ);
      drainGroup.add(bar);
    }

    // Curb throat aperture (recessed inlet slot beneath granite curb)
    const throatY = 0.08;
    const throatZ = loc.side === 'north' ? -0.48 : 0.48;
    const curbHood = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.22, 0.28), curbConcreteMat);
    curbHood.position.set(0, throatY, throatZ);
    drainGroup.add(curbHood);

    // Deep shadowed void beneath grate
    const voidMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.35, 0.72),
      new THREE.MeshBasicMaterial({ color: 0x050505, side: THREE.DoubleSide })
    );
    voidMesh.rotation.x = -Math.PI * 0.5;
    voidMesh.position.set(0, -0.02, 0);
    drainGroup.add(voidMesh);

    // Dynamic swirling water vortex inside drain
    const vortexGeo = new THREE.RingGeometry(0.12, 0.42, 16);
    const vortexMat = new THREE.MeshStandardMaterial({
      color: 0x82c8ec,
      transparent: true,
      opacity: 0.0,
      roughness: 0.15,
      side: THREE.DoubleSide
    });
    const vortexMesh = new THREE.Mesh(vortexGeo, vortexMat);
    vortexMesh.rotation.x = -Math.PI * 0.5;
    vortexMesh.position.set(0, 0.025, 0);
    drainGroup.add(vortexMesh);

    root.add(drainGroup);
    drainObjects.push({
      def: loc,
      group: drainGroup,
      vortexMesh,
      vortexMat,
      flowRate: 0.0
    });
  }

  // Continuous Gutter Water Flow Ribbons (North and South gutters)
  const northGutterGeo = new THREE.PlaneGeometry(GUTTER_LENGTH, 0.68, 64, 1);
  const northGutter = new THREE.Mesh(northGutterGeo, waterFlowRibbonMat);
  northGutter.rotation.x = -Math.PI * 0.5;
  northGutter.position.set((GUTTER_MIN_X + GUTTER_MAX_X) * 0.5, 0.035, NORTH_GUTTER_Z);
  root.add(northGutter);

  const southGutterGeo = new THREE.PlaneGeometry(GUTTER_LENGTH, 0.68, 64, 1);
  const southGutter = new THREE.Mesh(southGutterGeo, waterFlowRibbonMat);
  southGutter.rotation.x = -Math.PI * 0.5;
  southGutter.position.set((GUTTER_MIN_X + GUTTER_MAX_X) * 0.5, 0.035, SOUTH_GUTTER_Z);
  root.add(southGutter);

  let currentRunoffVolume = 0.0;
  let targetRunoffVolume = 0.0;
  let flowClock = 0;
  let ripplePulse = 0.0;

  return {
    root,
    drainObjects,
    setRunoffVolume(vol) {
      targetRunoffVolume = Math.max(0, Math.min(1.0, vol));
    },
    triggerWaterMainRupture(originX, originZ) {
      // Sudden surge of runoff water flowing to curbs
      targetRunoffVolume = Math.max(targetRunoffVolume, 0.85);
      ripplePulse = Math.min(2.5, ripplePulse + 1.2);
    },
    triggerRipple(x, z, intensity = 1.0) {
      // Trigger dynamic ripple normal surge along curb gutters
      ripplePulse = Math.min(2.5, ripplePulse + intensity * 0.65);
    },
    update(dt, hasActiveGeysers = false) {
      flowClock += dt;

      if (hasActiveGeysers) {
        targetRunoffVolume = Math.max(targetRunoffVolume, 0.90);
      } else {
        targetRunoffVolume = Math.max(0, targetRunoffVolume - dt * 0.04);
      }

      currentRunoffVolume = THREE.MathUtils.lerp(currentRunoffVolume, targetRunoffVolume, Math.min(1.0, dt * 2.5));

      // Update gutter ribbon visibility and opacity
      const activeOpacity = currentRunoffVolume * 0.72;
      waterFlowRibbonMat.opacity = activeOpacity;
      waterFilmMat.opacity = currentRunoffVolume * 0.45;

      // Animate downstream gutter wave scroll and ripple impulse decay
      rippleNormalTex.offset.x += dt * 0.32;
      if (ripplePulse > 0.01) {
        ripplePulse = Math.max(0, ripplePulse - dt * 1.8);
        waterFlowRibbonMat.normalScale.set(0.35 + ripplePulse * 0.85, 0.35 + ripplePulse * 0.85);
      } else {
        waterFlowRibbonMat.normalScale.set(0.35, 0.35);
      }

      const isFlowing = currentRunoffVolume > 0.04;
      northGutter.visible = isFlowing;
      southGutter.visible = isFlowing;

      // Animate drain catch basin vortex rotation and suction
      for (const d of drainObjects) {
        if (isFlowing) {
          d.vortexMesh.visible = true;
          d.vortexMat.opacity = Math.min(0.85, currentRunoffVolume * 0.95);
          d.vortexMesh.rotation.z += dt * (4.2 + currentRunoffVolume * 6.0);
          const pulse = 1.0 + Math.sin(flowClock * 8.0 + d.def.x * 0.1) * 0.08;
          d.vortexMesh.scale.set(pulse, pulse, 1.0);
        } else {
          d.vortexMesh.visible = false;
        }
      }
    },
    getStats() {
      return {
        activeDrains: drainObjects.length,
        runoffVolume: +currentRunoffVolume.toFixed(2),
        isFlowing: currentRunoffVolume > 0.04,
        ripplePulse: +ripplePulse.toFixed(2),
        gutterWidthMeters: 0.68,
        northGutterZ: NORTH_GUTTER_Z,
        southGutterZ: SOUTH_GUTTER_Z
      };
    }
  };
}
