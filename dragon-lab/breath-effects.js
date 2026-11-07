import * as THREE from 'three';

// Anatomical animation reference only. The gameplay breath systems are separate.
// Every preview particle is an instance of reusable geometry: no per-frame meshes.
export function createBreathPreview(head) {
  const count = 24;
  const styles = {
    fire: {
      geometry: new THREE.ConeGeometry(.17, .65, 6),
      material: new THREE.MeshBasicMaterial({
        color: 0xff862c, transparent: true, opacity: .83,
        blending: THREE.AdditiveBlending, depthWrite: false
      }),
      speed: .85
    },
    wind: {
      geometry: new THREE.TorusGeometry(1, .055, 5, 16),
      material: new THREE.MeshBasicMaterial({
        color: 0xb6e9ff, transparent: true, opacity: .57,
        blending: THREE.AdditiveBlending, depthWrite: false
      }),
      speed: .9
    },
    gas: {
      geometry: new THREE.IcosahedronGeometry(1, 1),
      material: new THREE.MeshBasicMaterial({
        color: 0x78d95d, transparent: true, opacity: .48,
        depthWrite: false
      }),
      speed: .55
    }
  };
  const meshes = {};
  for (const [kind, style] of Object.entries(styles)) {
    const mesh = new THREE.InstancedMesh(style.geometry, style.material, count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    mesh.visible = false;
    head.add(mesh);
    meshes[kind] = mesh;
  }
  const dummy = new THREE.Object3D();
  let active = null;

  function update(state, t) {
    const kind = Object.hasOwn(meshes, state) ? state : null;
    for (const [name, mesh] of Object.entries(meshes)) mesh.visible = name === kind;
    active = kind;
    if (!kind) return;
    const mesh = meshes[kind];
    for (let i = 0; i < count; i++) {
      const progress = (t * styles[kind].speed + i / count) % 1;
      const spread = (kind === 'wind' ? .14 : kind === 'gas' ? .46 : .28) * progress;
      dummy.position.set(
        1.35 + 4.0 * progress,
        -.17 + (kind === 'gas' ? -.85 * progress * progress : Math.sin(i * 1.9 + t * 4) * .17 * progress),
        Math.sin(i * 2.4 + t * 2) * spread
      );
      dummy.rotation.set(0, kind === 'wind' ? Math.PI / 2 : 0,
        kind === 'fire' ? -Math.PI / 2 : 0);
      const size = kind === 'wind'
        ? .22 + 1.1 * progress
        : kind === 'gas'
          ? .15 + .65 * progress
          : .22 + .42 * (1 - progress);
      dummy.scale.setScalar(size);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  function snapshot() {
    return { active, poolSize: count, visibleEmitters:
      Object.values(meshes).filter(mesh => mesh.visible).length };
  }
  return { update, snapshot };
}
