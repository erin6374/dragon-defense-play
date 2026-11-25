/**
 * Dragon Defense - Building Electrical Shorts & Arcing Infrastructure System
 * Simulates live severed electrical wiring, ceiling conduit short circuits,
 * dynamic jagged electric arc filaments (60Hz micro-jitter), localized flash
 * illumination, particle sparks, and subway 600V third-rail arcing cascades.
 */

export function createBuildingElectricalShorts(THREE, scene) {
  const group = new THREE.Group();
  group.name = 'building-electrical-shorts-system';
  scene.add(group);

  // Reusable arc line pool (jagged lightning filaments)
  const MAX_ARCS = 14;
  const SEGMENTS_PER_ARC = 6;
  const arcGeometries = [];
  const arcLines = [];

  const arcMaterial = new THREE.LineBasicMaterial({
    color: 0x7be8ff,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    linewidth: 2
  });

  for (let i = 0; i < MAX_ARCS; i++) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(SEGMENTS_PER_ARC * 2 * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const line = new THREE.LineSegments(geo, arcMaterial);
    line.frustumCulled = false;
    line.visible = false;
    group.add(line);

    arcGeometries.push(geo);
    arcLines.push({
      line,
      geo,
      active: false,
      timer: 0,
      duration: 0.12,
      start: new THREE.Vector3(),
      end: new THREE.Vector3(),
      centroid: new THREE.Vector3(),
      power: 1.0
    });
  }

  // Transient point light for dynamic electrical flash illumination
  const arcLight = new THREE.PointLight(0x6be0ff, 0, 16.0, 1.6);
  arcLight.castShadow = false;
  group.add(arcLight);

  let totalShortsTriggered = 0;

  // Function to generate jagged lightning vertices between two points
  function buildJaggedArc(geo, start, end, power = 1.0) {
    const pos = geo.attributes.position.array;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dz = end.z - start.z;
    const len = Math.hypot(dx, dy, dz) || 1.0;

    // Normal vectors perpendicular to arc direction
    const up = new THREE.Vector3(0, 1, 0);
    const dir = new THREE.Vector3(dx, dy, dz).normalize();
    let perp1 = new THREE.Vector3().crossVectors(dir, up).normalize();
    if (perp1.lengthSq() < 0.01) perp1 = new THREE.Vector3(1, 0, 0);
    const perp2 = new THREE.Vector3().crossVectors(dir, perp1).normalize();

    let curX = start.x;
    let curY = start.y;
    let curZ = start.z;

    const jitterScale = (0.15 + 0.18 * power) * Math.min(1.5, len * 0.5);

    for (let s = 0; s < SEGMENTS_PER_ARC; s++) {
      const tNext = (s + 1) / SEGMENTS_PER_ARC;
      let nextX = start.x + dx * tNext;
      let nextY = start.y + dy * tNext;
      let nextZ = start.z + dz * tNext;

      if (s < SEGMENTS_PER_ARC - 1) {
        const j1 = (Math.random() - 0.5) * 2.0 * jitterScale;
        const j2 = (Math.random() - 0.5) * 2.0 * jitterScale;
        nextX += perp1.x * j1 + perp2.x * j2;
        nextY += perp1.y * j1 + perp2.y * j2;
        nextZ += perp1.z * j1 + perp2.z * j2;
      }

      const idx = s * 6;
      pos[idx] = curX;
      pos[idx + 1] = curY;
      pos[idx + 2] = curZ;
      pos[idx + 3] = nextX;
      pos[idx + 4] = nextY;
      pos[idx + 5] = nextZ;

      curX = nextX;
      curY = nextY;
      curZ = nextZ;
    }

    geo.attributes.position.needsUpdate = true;
  }

  function triggerArc(start, end, power = 1.0, cinematicFX = null, soundFn = null) {
    const slot = arcLines.find(a => !a.active) || arcLines[0];
    slot.active = true;
    slot.duration = 0.08 + Math.random() * 0.10;
    slot.timer = slot.duration;
    slot.start.copy(start);
    slot.end.copy(end);
    slot.centroid.copy(start).add(end).multiplyScalar(0.5);
    slot.power = power;
    slot.line.visible = true;

    buildJaggedArc(slot.geo, start, end, power);

    // Dynamic electrical flash light
    arcLight.position.copy(slot.centroid);
    arcLight.intensity = Math.min(5.5, 2.8 * power);
    arcLight.color.setHex(Math.random() < 0.25 ? 0xffffff : 0x7be8ff);

    totalShortsTriggered++;

    if (cinematicFX?.sparks) {
      cinematicFX.sparks(slot.centroid, Math.round(5 + power * 8), 1.2 * power);
    }
    if (soundFn && Math.random() < 0.75) {
      soundFn('electric', { x: slot.centroid.x, volume: Math.min(0.7, 0.35 * power) });
    }
  }

  function update(dt, cinematicFX, soundFn, schoolDamage, targetBuildings, subwayExposed, hasWaterMainGeyser) {
    // Update active arcs & 60Hz rapid jitter
    let hasActiveArc = false;
    let highestIntensity = 0;

    for (const a of arcLines) {
      if (a.active) {
        a.timer -= dt;
        if (a.timer <= 0) {
          a.active = false;
          a.line.visible = false;
        } else {
          hasActiveArc = true;
          // 60Hz re-jitter every frame
          buildJaggedArc(a.geo, a.start, a.end, a.power);
          highestIntensity = Math.max(highestIntensity, (a.timer / a.duration) * 3.5 * a.power);
        }
      }
    }

    if (hasActiveArc) {
      arcLight.intensity = highestIntensity;
    } else {
      arcLight.intensity = Math.max(0, arcLight.intensity - dt * 24.0);
    }

    // 1. Tech Freire Classroom & Ceiling Conduit Shorts
    if (schoolDamage > 0.12) {
      const sparkRate = (schoolDamage - 0.10) * 4.5;
      if (Math.random() < dt * sparkRate) {
        const floorYLevels = [3.8, 6.8, 9.8, 12.8];
        const cy = floorYLevels[Math.floor(Math.random() * floorYLevels.length)];
        const cx = (Math.random() - 0.5) * 22.0;
        const cz = -42.0 + Math.random() * 38.0;

        const start = new THREE.Vector3(cx, cy, cz);
        const end = new THREE.Vector3(
          cx + (Math.random() - 0.5) * 1.6,
          cy - 0.3 - Math.random() * 0.9,
          cz + (Math.random() - 0.5) * 1.6
        );
        triggerArc(start, end, 1.0 + schoolDamage * 0.8, cinematicFX, soundFn);
      }
    }

    // 2. North Broad Damaged Neighborhood Buildings
    if (targetBuildings) {
      for (const b of targetBuildings) {
        if (!b.school && (b.damage || 0) > 0.15) {
          const bldgRate = (b.damage - 0.12) * 3.2;
          if (Math.random() < dt * bldgRate) {
            const bx = b.x + (Math.random() - 0.5) * b.w * 0.75;
            const by = Math.min(b.h * 0.88, 1.8 + Math.random() * (b.h - 2.5));
            const bz = b.front - 0.2 - Math.random() * (b.d * 0.6);

            const start = new THREE.Vector3(bx, by, bz);
            const end = new THREE.Vector3(
              bx + (Math.random() - 0.5) * 1.2,
              by - 0.2 - Math.random() * 0.6,
              bz + (Math.random() - 0.5) * 1.2
            );
            triggerArc(start, end, 0.9 + b.damage * 0.6, cinematicFX, soundFn);
          }
        }
      }
    }

    // 3. Broad Street Ruptured Subway 600V Third-Rail Violent Arcing
    if (subwayExposed) {
      const railRate = hasWaterMainGeyser ? 6.5 : 2.2;
      if (Math.random() < dt * railRate) {
        const railX = (Math.random() - 0.5) * 16.0;
        const trackZ = Math.random() < 0.5 ? 19.5 : 27.5;
        const railY = -5.1;

        const start = new THREE.Vector3(railX, railY, trackZ);
        const end = new THREE.Vector3(
          railX + (Math.random() - 0.5) * 2.2,
          railY + 0.3 + Math.random() * 0.6,
          trackZ + (Math.random() - 0.5) * 0.8
        );
        triggerArc(start, end, hasWaterMainGeyser ? 1.8 : 1.2, cinematicFX, soundFn);

        if (hasWaterMainGeyser && cinematicFX?.steamBurst) {
          cinematicFX.steamBurst(start, 0.8);
        }
      }
    }
  }

  return {
    group,
    update,
    triggerArc,
    getTotalShortsTriggered: () => totalShortsTriggered,
    getActiveArcsCount: () => arcLines.filter(a => a.active).length,
    reset: () => {
      for (const a of arcLines) {
        a.active = false;
        a.line.visible = false;
      }
      arcLight.intensity = 0;
      totalShortsTriggered = 0;
    }
  };
}
