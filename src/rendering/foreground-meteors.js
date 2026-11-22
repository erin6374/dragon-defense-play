import * as THREE from 'three';

// Atmospheric Foreground Meteors:
// 1. Rain of White Fire: slender, hyper-velocity incandescent white streaks raining down across the foreground.
// 2. Near-Camera Motion-Blurred Bolides: large out-of-focus bolides plunging close to the camera lens towards the viewer and off-screen.

export function createForegroundMeteors(THREE, scene) {
  // Rain effect removed per user request
  const RAIN_COUNT = 0;
  const rainGeo = new THREE.CylinderGeometry(0.08, 0.22, 6.0, 5, 1, true);
  rainGeo.rotateX(Math.PI / 2);

  const rainMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const rainMesh = new THREE.InstancedMesh(rainGeo, rainMat, 1);
  rainMesh.visible = false;

  const rainParticles = [];
  const dummyMatrix = new THREE.Matrix4();
  const dummyPos = new THREE.Vector3();
  const dummyScale = new THREE.Vector3(1, 1, 1);
  const dummyQuat = new THREE.Quaternion();
  const forwardAxis = new THREE.Vector3(0, 0, 1);

  for (let i = 0; i < RAIN_COUNT; i++) {
    rainParticles.push({
      x: (Math.random() - 0.5) * 220,
      y: 5 + Math.random() * 80,
      z: 22 + Math.random() * 18,
      vx: (Math.random() - 0.5) * 5.0,
      vy: -72.0 - Math.random() * 26.0,
      vz: (Math.random() - 0.5) * 1.5,
      length: 5.5 + Math.random() * 3.5,
      width: 0.12 + Math.random() * 0.14
    });
  }

  // --- Near-Camera Motion-Blurred Bolides ---
  // Soft out-of-focus Bokeh & Directional Motion-Blur Shader
  const bokehVertexShader = `
    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying vec3 vNormal;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorldPos = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }
  `;

  const bokehFragmentShader = `
    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying vec3 vNormal;
    uniform vec3 uColor;
    uniform vec3 uCoreColor;
    uniform vec3 uGlowColor;
    uniform float uOpacity;
    uniform float uTime;

    void main() {
      // Cylindrical/ellipsoidal radial falloff from centerline
      float dy = abs(vUv.y - 0.5) * 2.0; // 0.0 at center, 1.0 at ends
      // Radial cross-section distance
      float r = clamp(length(vNormal.xy), 0.0, 1.0);

      // Depth-of-field bokeh blur: soft gaussian falloff simulating out-of-focus foreground optics
      float bokehBlur = smoothstep(1.0, 0.15, r) * smoothstep(1.0, 0.05, dy);

      // Incandescent core with turbulent thermal noise
      float noise = sin(vWorldPos.y * 1.8 + uTime * 14.0) * cos(vWorldPos.x * 2.2) * 0.15;
      float coreIntensity = smoothstep(0.70, 0.05, r + noise);

      vec3 fieryEdge = mix(uGlowColor, uColor, smoothstep(0.1, 0.6, bokehBlur));
      vec3 finalColor = mix(fieryEdge, uCoreColor, coreIntensity);

      // Diffuse soft halo
      float alpha = clamp(bokehBlur * uOpacity * (0.65 + coreIntensity * 0.35), 0.0, 1.0);
      if (alpha < 0.01) discard;

      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  const BOLIDE_POOL_SIZE = 5;
  const bolideGeo = new THREE.CylinderGeometry(1.6, 0.4, 18.0, 12, 1, false);
  bolideGeo.rotateX(Math.PI / 2);

  const bolideMaterial = new THREE.ShaderMaterial({
    vertexShader: bokehVertexShader,
    fragmentShader: bokehFragmentShader,
    uniforms: {
      uColor: { value: new THREE.Color(0xff6a14) },
      uCoreColor: { value: new THREE.Color(0xfffbe8) },
      uGlowColor: { value: new THREE.Color(0xd92606) },
      uOpacity: { value: 0.82 },
      uTime: { value: 0.0 }
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const bolides = [];
  const bolideGroup = new THREE.Group();
  scene.add(bolideGroup);

  for (let i = 0; i < BOLIDE_POOL_SIZE; i++) {
    const mesh = new THREE.Mesh(bolideGeo, bolideMaterial);
    mesh.visible = false;
    bolideGroup.add(mesh);
    bolides.push({
      mesh,
      active: false,
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      scale: new THREE.Vector3(1, 1, 1),
      life: 0,
      maxLife: 2.5
    });
  }

  let spawnTimer = 1.8;
  let totalNearBolidesSpawned = 0;

  function spawnNearBolide(targetX = null, targetZ = null) {
    const b = bolides.find(item => !item.active);
    if (!b) return null;

    const startX = targetX !== null ? targetX : (Math.random() - 0.5) * 110;
    // Bolides spawn from the orbital ceiling (Y >= 330) plunging down through the entire map
    const startY = 330.0 + Math.random() * 35.0;
    const startZ = targetZ !== null ? targetZ : 45.0 + Math.random() * 16.0;

    b.pos.set(startX, startY, startZ);
    b.vel.set(
      (Math.random() - 0.5) * 8.0,
      -48.0 - Math.random() * 16.0,
      6.0 + Math.random() * 4.0
    );

    const thickness = 1.6 + Math.random() * 0.9;
    const length = 1.1 + Math.random() * 0.6;
    b.scale.set(thickness, thickness, length);
    b.mesh.scale.copy(b.scale);
    b.mesh.position.copy(b.pos);
    b.mesh.visible = true;
    b.active = true;
    b.life = 0;
    b.maxLife = 7.5;
    totalNearBolidesSpawned++;
    return b;
  }

  function update(dt, elapsed, onSpark = null) {
    bolideMaterial.uniforms.uTime.value = elapsed;

    // 1. White Fire Rain removed
    if (RAIN_COUNT > 0) {
      for (let i = 0; i < RAIN_COUNT; i++) {
        const p = rainParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;

        if (p.y <= 0.4) {
          if (onSpark && Math.random() < 0.28) {
            onSpark(p.x, 0.45, p.z);
          }
          p.x = (Math.random() - 0.5) * 220;
          p.y = 75.0 + Math.random() * 25.0;
          p.z = 22.0 + Math.random() * 18.0;
          p.vx = (Math.random() - 0.5) * 5.0;
          p.vy = -72.0 - Math.random() * 26.0;
        }

        dummyPos.set(p.x, p.y, p.z);
        const dir = new THREE.Vector3(p.vx, p.vy, p.vz).normalize();
        dummyQuat.setFromUnitVectors(forwardAxis, dir);
        dummyScale.set(p.width, p.width, p.length);
        dummyMatrix.compose(dummyPos, dummyQuat, dummyScale);
        rainMesh.setMatrixAt(i, dummyMatrix);
      }
      rainMesh.instanceMatrix.needsUpdate = true;
    }

    // 2. Spawn and update Near-Camera Motion-Blurred Bolides
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnTimer = 2.0 + Math.random() * 2.2;
      spawnNearBolide();
    }

    for (const b of bolides) {
      if (!b.active) continue;
      b.life += dt;
      b.pos.addScaledVector(b.vel, dt);
      b.mesh.position.copy(b.pos);

      // Align bolide geometry along velocity vector for motion blur
      const dir = b.vel.clone().normalize();
      b.mesh.quaternion.setFromUnitVectors(forwardAxis, dir);

      // Despawn once well below screen or past camera
      if (b.pos.y < -24.0 || b.pos.z > 135.0 || b.life >= b.maxLife) {
        b.active = false;
        b.mesh.visible = false;
      }
    }
  }

  function reset() {
    for (const b of bolides) {
      b.active = false;
      b.mesh.visible = false;
    }
    spawnTimer = 1.8;
  }

  function getStats() {
    return {
      rainActive: rainMesh.visible,
      rainCount: RAIN_COUNT,
      activeBolides: bolides.filter(b => b.active).length,
      totalNearBolidesSpawned
    };
  }

  return {
    update,
    reset,
    spawnNearBolide,
    getStats,
    group: bolideGroup,
    rainMesh
  };
}
