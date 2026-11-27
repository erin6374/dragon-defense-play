import * as THREE from 'three';

// Cached annular scorch decal textures with 100% transparent center aperture
let _cachedSubwayScorchTexture = null;
let _cachedSurfaceScorchTexture = null;

function getAnnularScorchDecalTexture(isSubway = false) {
  if (isSubway && _cachedSubwayScorchTexture) return _cachedSubwayScorchTexture;
  if (!isSubway && _cachedSurfaceScorchTexture) return _cachedSurfaceScorchTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const cx = 256, cy = 256;

  // Aperture radius in pixels (relative to canvas radius 256):
  // For subway breach: aperture is ~45% of decal diameter (rHole ≈ 114px).
  // For surface crater: parabolic bowl is ~38% of decal diameter (rHole ≈ 96px).
  const rHole = isSubway ? 114 : 96;
  const rRim = rHole + 16;
  const rOuter = 252;

  // Clear entire canvas to transparent
  ctx.clearRect(0, 0, 512, 512);

  // Annular radial gradient: 100% transparent at center, ramping up at rim, then feathering out
  const grad = ctx.createRadialGradient(cx, cy, rHole - 6, cx, cy, rOuter);
  grad.addColorStop(0.0, 'rgba(0, 0, 0, 0.0)'); // Center aperture is 100% transparent
  grad.addColorStop(0.08, 'rgba(0, 0, 0, 0.0)'); // Inner lip transparent
  grad.addColorStop(0.14, 'rgba(10, 8, 7, 0.82)'); // Jet-black charred rim lip
  grad.addColorStop(0.35, 'rgba(16, 13, 11, 0.68)'); // Heavy soot blanket
  grad.addColorStop(0.60, 'rgba(28, 24, 22, 0.38)'); // Mid-distance ash fallout
  grad.addColorStop(0.85, 'rgba(38, 34, 32, 0.12)'); // Outer singe
  grad.addColorStop(1.0, 'rgba(40, 36, 34, 0.0)'); // Soft asymptotic fade

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
  ctx.fill();

  // Explicitly punch out inner hole with destination-out so center is guaranteed 100% empty
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(cx, cy, rHole, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // Add scorched soot splatters & supersonic radial blast spall rays radiating outward from rim
  const numRays = isSubway ? 64 : 48;
  for (let s = 0; s < numRays; s++) {
    const angle = (s / numRays) * Math.PI * 2 + (Math.sin(s * 4.3) * 0.08);
    const startDist = rHole + 2 + Math.abs(Math.sin(s * 2.7)) * 12;
    const endDist = startDist + 35 + Math.abs(Math.cos(s * 5.1)) * 95;

    ctx.strokeStyle = `rgba(10, 8, 7, ${0.28 + (s % 5) * 0.08})`;
    ctx.lineWidth = 1.5 + (s % 4) * 0.8;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * startDist, cy + Math.sin(angle) * startDist);
    ctx.lineTo(cx + Math.cos(angle) * endDist, cy + Math.sin(angle) * endDist);
    ctx.stroke();

    // Occasional soot deposit clot
    if (s % 3 === 0) {
      const spDist = (startDist + endDist) * 0.5;
      const spX = cx + Math.cos(angle) * spDist;
      const spY = cy + Math.sin(angle) * spDist;
      ctx.fillStyle = `rgba(8, 7, 6, ${0.20 + (s % 4) * 0.07})`;
      ctx.beginPath();
      ctx.arc(spX, spY, 3 + (s % 4) * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  if (isSubway) _cachedSubwayScorchTexture = tex;
  else _cachedSurfaceScorchTexture = tex;
  return tex;
}

const _boxGeo = new THREE.BoxGeometry(1, 1, 1);
const _cylinderGeo = new THREE.CylinderGeometry(0.022, 0.022, 1.2, 6);
const _asphaltChunkMat = new THREE.MeshStandardMaterial({ color: 0x1c1a18, roughness: 0.96, metalness: 0.04 });
const _rebarSteelMat = new THREE.MeshStandardMaterial({ color: 0x5a4d42, roughness: 0.65, metalness: 0.82 });

// Crater rims borrow these four module-lifetime resources. Everything else
// in the crater's geometry/material graph is local to that crater.
export function collectCraterResources(roots) {
  const resources = new Set();
  const borrowed = new Set([_boxGeo, _cylinderGeo, _asphaltChunkMat, _rebarSteelMat]);
  const visit = (node) => {
    if (!node) return;
    for (const resource of [node.geometry, ...(Array.isArray(node.material) ? node.material : [node.material])]) {
      if (resource && !borrowed.has(resource)) resources.add(resource);
    }
  };
  for (const root of roots) {
    if (!root) continue;
    if (typeof root.traverse === 'function') root.traverse(visit);
    else visit(root);
  }
  return resources;
}
export function releaseCraterResources(resources, retained = new Set()) {
  for (const resource of resources) if (!retained.has(resource)) resource.dispose?.();
}

/**
 * Creates 3D realistic fractured asphalt rim with inward-drooping broken slabs,
 * protruding rebar rods, and radial tensile pavement fracture cracks.
 */
export function createHeavedAsphaltRim(radius, isSubway = false) {
  const root = new THREE.Group();
  root.name = 'crater-heaved-asphalt-rim';

  const segments = 36;
  const positions = [];
  const colors = [];
  const indices = [];

  const rInnerBase = radius * (isSubway ? 0.98 : 0.82);
  const rOuterBase = radius * (isSubway ? 1.55 : 1.42);

  // Charred jet-black soot color for inner lip
  const sootR = 0.04, sootG = 0.035, sootB = 0.03;
  // Weathered asphalt grey for outer edge
  const roadR = 0.16, roadG = 0.175, roadB = 0.19;

  for (let i = 0; i <= segments; i++) {
    const seg = i % segments;
    const angle = (seg / segments) * Math.PI * 2;
    const jaggedNoise = Math.sin(seg * 3.7 + 1.2) * 0.14 + Math.cos(seg * 7.1) * 0.07;
    const rIn = rInnerBase * (1.0 + jaggedNoise);
    const rOut = rOuterBase * (1.0 + jaggedNoise * 0.45);

    // If subway breach, pavement droops inward/downward (-0.18m to -0.32m);
    // If surface crater, kinetic shock buckles inner lip slightly upward (+0.18m to +0.28m).
    const yIn = isSubway
      ? (-0.22 - (Math.sin(seg * 4.3 + 0.8) * 0.06 + Math.cos(seg * 8.9) * 0.04))
      : (0.22 + (Math.sin(seg * 4.3 + 0.8) * 0.06 + Math.cos(seg * 8.9) * 0.04) * radius * 0.06);
    const yOut = 0.02;

    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // Inner vertex
    positions.push(cosA * rIn, yIn, sinA * rIn);
    colors.push(sootR, sootG, sootB);

    // Outer vertex
    positions.push(cosA * rOut, yOut, sinA * rOut);
    colors.push(roadR, roadG, roadB);
  }

  for (let i = 0; i < segments; i++) {
    const i0 = i * 2;
    const i1 = i0 + 1;
    const i2 = (i + 1) * 2;
    const i3 = i2 + 1;

    indices.push(i0, i1, i2);
    indices.push(i1, i3, i2);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.94,
    metalness: 0.06,
    side: THREE.DoubleSide
  });

  const rimMesh = new THREE.Mesh(geometry, material);
  rimMesh.name = 'crater-rim-lip';
  root.add(rimMesh);

  // Radial pavement crack fracture lines radiating across street and curbs
  const crackPoints = [];
  const numCracks = isSubway ? 14 : 9;
  for (let c = 0; c < numCracks; c++) {
    const startAngle = (c / numCracks) * Math.PI * 2 + (Math.sin(c * 2.3) * 0.2);
    let curX = Math.cos(startAngle) * rInnerBase * 1.05;
    let curZ = Math.sin(startAngle) * rInnerBase * 1.05;
    const crackLength = radius * (1.2 + (c % 4) * 0.45);
    const crackSteps = 4 + (c % 3) * 2;
    for (let st = 0; st < crackSteps; st++) {
      const stepAngle = startAngle + (Math.sin(c * 5.1 + st * 2.1) - 0.48) * 0.45;
      const stepDist = (crackLength / crackSteps);
      const nextX = curX + Math.cos(stepAngle) * stepDist;
      const nextZ = curZ + Math.sin(stepAngle) * stepDist;

      crackPoints.push(curX, 0.035, curZ);
      crackPoints.push(nextX, 0.035, nextZ);

      // Occasional branch crack
      if (st === 2 && (c % 2 === 0)) {
        const branchAngle = stepAngle + (c % 4 === 0 ? 0.75 : -0.75);
        crackPoints.push(curX, 0.035, curZ);
        crackPoints.push(curX + Math.cos(branchAngle) * stepDist * 0.8, 0.035, curZ + Math.sin(branchAngle) * stepDist * 0.8);
      }

      curX = nextX;
      curZ = nextZ;
    }
  }

  if (crackPoints.length > 0) {
    const crackGeo = new THREE.BufferGeometry();
    crackGeo.setAttribute('position', new THREE.Float32BufferAttribute(crackPoints, 3));
    const crackMat = new THREE.LineBasicMaterial({
      color: 0x141210,
      transparent: true,
      opacity: 0.92,
      depthWrite: false
    });
    const cracks = new THREE.LineSegments(crackGeo, crackMat);
    cracks.name = 'crater-radial-cracks';
    root.add(cracks);
  }

  // Broken reinforced asphalt slab chunks and exposed steel rebar
  const numChunks = isSubway ? Math.min(16, Math.max(8, Math.round(radius * 1.8))) : 6;
  for (let k = 0; k < numChunks; k++) {
    const chunkAngle = (k / numChunks) * Math.PI * 2 + (Math.sin(k * 3.1) * 0.15);
    const chunkDist = rInnerBase * (0.94 + (k % 3) * 0.06);
    const cx = Math.cos(chunkAngle) * chunkDist;
    const cz = Math.sin(chunkAngle) * chunkDist;

    const slab = new THREE.Mesh(_boxGeo, _asphaltChunkMat);
    const sw = 0.75 + (k % 4) * 0.35;
    const sh = 0.18 + (k % 3) * 0.08;
    const sd = 0.65 + (k % 5) * 0.30;
    slab.scale.set(sw, sh, sd);

    // Slabs tilt inward and downward into the crater or breach
    const tiltZ = Math.sin(chunkAngle) * (isSubway ? 0.55 : -0.25);
    const tiltX = -Math.cos(chunkAngle) * (isSubway ? 0.55 : -0.25);
    slab.position.set(cx, isSubway ? -0.28 - (k % 3) * 0.12 : 0.12 + (k % 3) * 0.04, cz);
    slab.rotation.set(tiltX + (k % 3) * 0.1, chunkAngle, tiltZ + (k % 4) * 0.1);
    slab.castShadow = true;
    slab.receiveShadow = true;
    root.add(slab);

    // Protruding twisted rebar rod extending from broken slab
    if (k % 2 === 0) {
      const rebar = new THREE.Mesh(_cylinderGeo, _rebarSteelMat);
      rebar.position.set(cx * 0.95, isSubway ? -0.38 - (k % 3) * 0.15 : 0.14, cz * 0.95);
      rebar.rotation.set(tiltX * 1.4, chunkAngle + 0.4, tiltZ * 1.4);
      root.add(rebar);
    }
  }

  return root;
}

/**
 * Creates true 3D volumetric parabolic bowl for non-subway impacts with granular basaltic interior.
 */
export function createVolumetricImpactBowl(radius) {
  const depth = Math.min(3.2, 1.1 + radius * 0.32);
  const rings = 5;
  const segments = 28;

  const positions = [];
  const colors = [];
  const indices = [];

  for (let r = 0; r < rings; r++) {
    const frac = r / (rings - 1); // 0 to 1
    const rRad = radius * (0.84 - frac * 0.56);
    const yDepth = (r === 0) ? 0.18 : (-depth * Math.pow(frac, 1.35));

    for (let s = 0; s < segments; s++) {
      const angle = (s / segments) * Math.PI * 2;
      const noise = (r === 0) ? 0 : (Math.sin(s * 4.7 + r * 2.1) * 0.08 * radius);
      const px = Math.cos(angle) * (rRad + noise);
      const pz = Math.sin(angle) * (rRad + noise);
      const py = yDepth + (r > 0 ? (Math.cos(s * 3.3) * 0.06 * depth) : 0);

      positions.push(px, py, pz);

      // Charred granular rock color: darker with depth
      const shade = 0.055 - frac * 0.038;
      colors.push(shade, shade * 0.88, shade * 0.78);
    }
  }

  // Quads between rings
  for (let r = 0; r < rings - 1; r++) {
    const r0 = r * segments;
    const r1 = (r + 1) * segments;
    for (let s = 0; s < segments; s++) {
      const sNext = (s + 1) % segments;
      const i0 = r0 + s;
      const i1 = r0 + sNext;
      const i2 = r1 + s;
      const i3 = r1 + sNext;

      indices.push(i0, i2, i1);
      indices.push(i1, i2, i3);
    }
  }

  // Center bottom cap
  const centerIdx = positions.length / 3;
  positions.push(0, -depth, 0);
  colors.push(0.018, 0.015, 0.012);

  const bottomRingStart = (rings - 1) * segments;
  for (let s = 0; s < segments; s++) {
    const sNext = (s + 1) % segments;
    indices.push(bottomRingStart + s, centerIdx, bottomRingStart + sNext);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.94,
    metalness: 0.06,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'crater-volumetric-bowl';
  return { mesh, depth };
}

/**
 * Creates pulsating subsurface thermal fissure core with glowing magma veins.
 */
export function createPulsatingThermalFissures(radius, depth, {externalLighting = false} = {}) {
  const group = new THREE.Group();
  group.name = 'crater-thermal-core';

  const fissureRadius = radius * 0.42;
  const segments = 16;
  const positions = [];
  const colors = [];
  const indices = [];

  // Multi-tier radial veins: center white-hot, branches orange, outer cooling black
  positions.push(0, 0.03, 0);
  colors.push(1.0, 0.94, 0.82);

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const isVein = (i % 2 === 0);
    const rDist = fissureRadius * (isVein ? (0.85 + Math.random() * 0.3) : 0.55);
    const px = Math.cos(angle) * rDist;
    const pz = Math.sin(angle) * rDist;
    positions.push(px, isVein ? 0.025 : 0.015, pz);

    if (isVein) {
      colors.push(1.0, 0.32, 0.02);
    } else {
      colors.push(0.12, 0.06, 0.04);
    }
  }

  for (let i = 0; i < segments; i++) {
    const iNext = ((i + 1) % segments) + 1;
    indices.push(0, i + 1, iNext);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.45,
    metalness: 0.1,
    emissive: 0xff3b00,
    emissiveIntensity: 1.8,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'crater-magma-fissure-mesh';
  group.add(mesh);

  // Scattered molten obsidian and concrete chunks resting on the crater floor
  const rubbleGeo = new THREE.DodecahedronGeometry(0.18, 0);
  const rubbleMat = new THREE.MeshStandardMaterial({ color: 0x181412, roughness: 0.92, metalness: 0.25 });
  for (let r = 0; r < 7; r++) {
    const chunk = new THREE.Mesh(rubbleGeo, rubbleMat);
    const rAngle = (r / 7) * Math.PI * 2 + Math.sin(r * 2.1) * 0.3;
    const rDist = (radius * 0.22) * (0.4 + (r % 3) * 0.25);
    chunk.scale.set(0.6 + (r % 3) * 0.3, 0.4 + (r % 2) * 0.2, 0.6 + (r % 4) * 0.3);
    chunk.position.set(Math.cos(rAngle) * rDist, 0.08, Math.sin(rAngle) * rDist);
    chunk.rotation.set(r * 0.8, r * 1.4, r * 0.5);
    group.add(chunk);
  }

  // Deep subsurface warm thermal glow illuminating bowl walls from beneath
  const light = externalLighting ? null : new THREE.PointLight(0xff5511, 2.8, Math.max(8.0, radius * 3.5));
  if (light) {
    light.position.set(0, 0.28, 0);
    light.name = 'crater-thermal-glow-light';
    group.add(light);
  }

  group.position.y = -depth + 0.06;

  return {
    group,
    mesh,
    light,
    material,
    update: (elapsed) => {
      const pulse = 1.4 + Math.sin(elapsed * 2.8) * 0.5;
      material.emissiveIntensity = pulse;
      const intensity = pulse * 1.6;
      if (light) light.intensity = intensity;
      return intensity;
    }
  };
}

// Select the nearest active thermal craters without mutating simulation order.
// Slots remain attached to the scene even when unused, preserving shader light counts.
export function syncThermalCraterLights(slots, craters, observer) {
  const candidates = craters.filter(c => !c.disposed && c.life > 0 && c.thermalGroup)
    .map(c => ({c, distance: (c.x - observer.x) ** 2 + (c.z - observer.z) ** 2}))
    .sort((a, b) => a.distance - b.distance);
  for (let i = 0; i < slots.length; i++) {
    const light = slots[i], c = candidates[i]?.c;
    if (!c) {
      light.intensity = 0;
      light.userData.thermalCrater = null;
      continue;
    }
    light.position.set(c.x, c.thermalGroup.position.y + 0.28, c.z);
    light.distance = Math.max(8, c.radius * 3.5);
    light.intensity = c.thermalIntensity ?? 2.8;
    light.userData.thermalCrater = c;
  }
}

/**
 * Creates smooth feathered radial soot blast decal with annular aperture.
 */
export function createFeatheredRadialSootDecal(radius, isSubway = false) {
  const decalR = radius * (isSubway ? 2.3 : 2.1);
  const geom = new THREE.PlaneGeometry(decalR * 2, decalR * 2);
  const texture = getAnnularScorchDecalTexture(isSubway);
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.038;
  mesh.name = 'crater-feathered-radial-soot-decal';
  return mesh;
}
