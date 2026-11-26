import * as THREE from 'three';

// Cached scorch decal texture
let _cachedScorchTexture = null;
function getScorchDecalTexture() {
  if (_cachedScorchTexture) return _cachedScorchTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const cx = 128, cy = 128;
  const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 126);
  grad.addColorStop(0.0, 'rgba(8, 6, 5, 0.92)');
  grad.addColorStop(0.45, 'rgba(12, 10, 8, 0.85)');
  grad.addColorStop(0.70, 'rgba(18, 16, 14, 0.55)');
  grad.addColorStop(0.88, 'rgba(25, 22, 20, 0.22)');
  grad.addColorStop(1.0, 'rgba(30, 28, 25, 0.0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, 126, 0, Math.PI * 2);
  ctx.fill();

  // Add random scorched soot splatters around edges
  for (let s = 0; s < 48; s++) {
    const angle = (s / 48) * Math.PI * 2 + Math.random() * 0.15;
    const dist = 60 + Math.random() * 58;
    const spX = cx + Math.cos(angle) * dist;
    const spY = cy + Math.sin(angle) * dist;
    const spR = 3 + Math.random() * 9;
    const spAlpha = 0.25 + Math.random() * 0.45;
    ctx.fillStyle = `rgba(10, 8, 6, ${spAlpha})`;
    ctx.beginPath();
    ctx.arc(spX, spY, spR, 0, Math.PI * 2);
    ctx.fill();
  }

  _cachedScorchTexture = new THREE.CanvasTexture(canvas);
  return _cachedScorchTexture;
}

/**
 * Creates 3D procedural jagged heaved-asphalt crest geometry.
 * Displaces inner rim vertices upward by +0.28m to +0.44m (buckled pavement thrust upward by shockwave).
 * Outer rim slopes down to +0.02m to touch street pavement.
 * Inner vertices colored charred jet-black; outer vertices colored weathered asphalt grey.
 */
export function createHeavedAsphaltRim(radius, isSubway = false) {
  const segments = 32;
  const positions = [];
  const colors = [];
  const indices = [];

  const rInnerBase = radius * (isSubway ? 0.84 : 0.80);
  const rOuterBase = radius * (isSubway ? 1.38 : 1.42);

  // Charred jet-black soot color for inner lip
  const sootR = 0.045, sootG = 0.038, sootB = 0.032;
  // Weathered asphalt grey for outer edge
  const roadR = 0.165, roadG = 0.180, roadB = 0.200;

  for (let i = 0; i <= segments; i++) {
    const seg = i % segments;
    const angle = (seg / segments) * Math.PI * 2;
    // High-frequency pseudo-random radial perturbation for jagged fractured edge
    const jaggedNoise = Math.sin(seg * 3.7 + 1.2) * 0.12 + Math.cos(seg * 7.1) * 0.06;
    const rIn = rInnerBase * (1.0 + jaggedNoise);
    const rOut = rOuterBase * (1.0 + jaggedNoise * 0.5);

    // Inner lip buckled upward from kinetic blast
    const yIn = 0.26 + (Math.sin(seg * 4.3 + 0.8) * 0.08 + Math.cos(seg * 8.9) * 0.04) * radius * 0.08;
    const yOut = 0.02;

    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // Vertex 2*i: Inner vertex
    positions.push(cosA * rIn, yIn, sinA * rIn);
    colors.push(sootR, sootG, sootB);

    // Vertex 2*i + 1: Outer vertex
    positions.push(cosA * rOut, yOut, sinA * rOut);
    colors.push(roadR, roadG, roadB);
  }

  // Generate quad triangle indices
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

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'crater-heaved-asphalt-rim';
  return mesh;
}

/**
 * Creates true 3D volumetric parabolic bowl for non-subway impacts.
 */
export function createVolumetricImpactBowl(radius) {
  const depth = Math.min(2.4, 0.95 + radius * 0.26);
  const rings = 4;
  const segments = 24;

  const positions = [];
  const colors = [];
  const indices = [];

  // Ring 0: top inner rim connecting to asphalt lip (y = 0.22)
  // Ring 1: steep upper descent (y = -depth * 0.38)
  // Ring 2: fractured mid bowl (y = -depth * 0.75)
  // Ring 3: flat molten crater basin floor (y = -depth)
  // Center vertex: epicenter floor center (y = -depth)

  for (let r = 0; r < rings; r++) {
    const frac = r / (rings - 1); // 0 to 1
    const rRad = radius * (0.82 - frac * 0.52); // radius * 0.82 down to radius * 0.30
    const yDepth = (r === 0) ? 0.22 : (-depth * Math.pow(frac, 1.4));

    for (let s = 0; s < segments; s++) {
      const angle = (s / segments) * Math.PI * 2;
      const noise = (r === 0) ? 0 : (Math.sin(s * 4.7 + r * 2.1) * 0.08 * radius);
      const px = Math.cos(angle) * (rRad + noise);
      const pz = Math.sin(angle) * (rRad + noise);
      const py = yDepth + (r > 0 ? (Math.cos(s * 3.3) * 0.05 * depth) : 0);

      positions.push(px, py, pz);

      // Charred rock color: darker with depth
      const shade = 0.06 - frac * 0.035;
      colors.push(shade, shade * 0.9, shade * 0.8);
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
  colors.push(0.02, 0.018, 0.015);

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
    roughness: 0.96,
    metalness: 0.08,
    flatShading: true,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'crater-volumetric-bowl';
  return { mesh, depth };
}

/**
 * Creates pulsating subsurface thermal fissure core with glowing magma veins.
 */
export function createPulsatingThermalFissures(radius, depth) {
  const group = new THREE.Group();
  group.name = 'crater-thermal-core';

  const fissureRadius = radius * 0.38;
  const segments = 16;
  const positions = [];
  const colors = [];
  const indices = [];

  // Multi-tier radial veins: center white-hot, branches orange, outer cooling black
  positions.push(0, 0.02, 0);
  colors.push(1.0, 0.94, 0.82); // Core white-hot (r, g, b)

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const isVein = (i % 2 === 0);
    const rDist = fissureRadius * (isVein ? (0.85 + Math.random() * 0.3) : 0.55);
    const px = Math.cos(angle) * rDist;
    const pz = Math.sin(angle) * rDist;
    positions.push(px, 0.02, pz);

    if (isVein) {
      // Magma incandescent orange vein
      colors.push(1.0, 0.32, 0.02);
    } else {
      // Scorched basalt crust ridge
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
    emissiveIntensity: 1.6,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'crater-magma-fissure-mesh';
  group.add(mesh);

  // Deep subterranean magma glow light
  const light = new THREE.PointLight(0xff5511, 2.2, Math.max(8.0, radius * 3.5));
  light.position.set(0, 0.35, 0);
  light.name = 'crater-thermal-glow-light';
  group.add(light);

  group.position.y = -depth + 0.06;

  return {
    group,
    mesh,
    light,
    material,
    update: (elapsed) => {
      const pulse = 1.3 + Math.sin(elapsed * 2.8) * 0.45;
      material.emissiveIntensity = pulse;
      light.intensity = pulse * 1.5;
    }
  };
}

/**
 * Creates smooth feathered radial soot blast decal.
 */
export function createFeatheredRadialSootDecal(radius) {
  const decalR = radius * 2.2;
  const geom = new THREE.PlaneGeometry(decalR * 2, decalR * 2);
  const texture = getScorchDecalTexture();
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
  mesh.position.y = 0.04;
  mesh.name = 'crater-feathered-radial-soot-decal';
  return mesh;
}
