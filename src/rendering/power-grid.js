/**
 * North Broad Street Power Grid & Utility Infrastructure
 * Authentic Philadelphia wooden utility poles, transformers, catenary sagging powerlines,
 * electrical arcing sparks, and neighborhood power outage / brownout simulation.
 */

// All sparks share the same opaque geometry/material. Keep the simulation
// records and transforms, but submit visible sparks in one bounded batch.
export function syncPowerSparkBatch(batch, sparks){
  if(!batch)return 0;
  let count=0;
  for(const spark of sparks){
    if(!spark.mesh.visible||spark.life<=0)continue;
    spark.mesh.updateMatrix();
    batch.setMatrixAt(count++,spark.mesh.matrix);
  }
  batch.count=count;batch.visible=count>0;
  batch.instanceMatrix.clearUpdateRanges();
  if(count){batch.instanceMatrix.addUpdateRange(0,count*16);batch.instanceMatrix.needsUpdate=true;}
  return count;
}

export function createPowerGrid(THREE, scene, {batchSparks=true}={}) {
  const group = new THREE.Group();
  group.name = 'power-grid-infrastructure';
  scene.add(group);

  // Materials
  const woodPoleMat = new THREE.MeshStandardMaterial({
    color: 0x3d3126,
    roughness: 0.94,
    metalness: 0.05
  });
  const crossarmMat = new THREE.MeshStandardMaterial({
    color: 0x4a3c2e,
    roughness: 0.90
  });
  const insulatorMat = new THREE.MeshStandardMaterial({
    color: 0x1f3438,
    roughness: 0.35,
    metalness: 0.25
  });
  const transformerMat = new THREE.MeshStandardMaterial({
    color: 0x48525a,
    roughness: 0.65,
    metalness: 0.55
  });
  const wireMat = new THREE.LineBasicMaterial({
    color: 0x181a1d,
    linewidth: 1.5,
    transparent: true,
    opacity: 0.88
  });
  const sparkMat = new THREE.MeshBasicMaterial({
    color: 0x99eeff
  });

  const poleXCoords = [-210, -165, -120, -75, -30, 25, 75, 120, 165, 210];
  const curbs = [
    { z: 13.5, name: 'east' },
    { z: 34.8, name: 'west' }
  ];

  const poles = [];
  const poleHeight = 10.8;
  const poleRadius = 0.22;

  const poleGeo = new THREE.CylinderGeometry(poleRadius * 0.85, poleRadius, poleHeight, 8);
  const crossarmGeo = new THREE.BoxGeometry(2.4, 0.14, 0.14);
  const transformerGeo = new THREE.CylinderGeometry(0.32, 0.30, 0.95, 10);
  const insulatorGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.16, 6);

  // Build utility poles along both curbs
  for (const curb of curbs) {
    for (let i = 0; i < poleXCoords.length; i++) {
      const x = poleXCoords[i];
      const z = curb.z;

      // Skip poles that obstruct school entrance
      if (curb.name === 'east' && Math.abs(x) < 14) continue;

      const poleMesh = new THREE.Mesh(poleGeo, woodPoleMat);
      poleMesh.position.set(x, poleHeight * 0.5 - 0.2, z);
      poleMesh.castShadow = true;
      group.add(poleMesh);

      // Top Crossarm
      const crossarmTop = new THREE.Mesh(crossarmGeo, crossarmMat);
      crossarmTop.position.set(0, poleHeight * 0.5 - 0.6, 0);
      poleMesh.add(crossarmTop);

      // Secondary Crossarm
      const crossarmBot = new THREE.Mesh(crossarmGeo, crossarmMat);
      crossarmBot.position.set(0, poleHeight * 0.5 - 1.4, 0);
      poleMesh.add(crossarmBot);

      // Insulators on crossarms
      for (const offset of [-0.95, 0, 0.95]) {
        const insTop = new THREE.Mesh(insulatorGeo, insulatorMat);
        insTop.position.set(offset, 0.12, 0);
        crossarmTop.add(insTop);

        const insBot = new THREE.Mesh(insulatorGeo, insulatorMat);
        insBot.position.set(offset, 0.12, 0);
        crossarmBot.add(insBot);
      }

      // Add transformer canister on alternating poles
      let hasTransformer = false;
      let transformerPos = null;
      if ((i + (curb.name === 'west' ? 1 : 0)) % 2 === 0) {
        hasTransformer = true;
        const trans = new THREE.Mesh(transformerGeo, transformerMat);
        trans.position.set(0.38, poleHeight * 0.5 - 2.1, 0.18);
        poleMesh.add(trans);
        transformerPos = new THREE.Vector3(x + 0.38, poleHeight - 2.3, z + 0.18);
      }

      poles.push({
        x,
        z,
        yTop: poleHeight - 0.4,
        curb: curb.name,
        hasTransformer,
        transformerPos,
        damaged: false
      });
    }
  }

  // Create catenary sagging powerline cables connecting adjacent poles
  const lines = [];
  for (const curb of curbs) {
    const curbPoles = poles.filter(p => p.curb === curb.name).sort((a, b) => a.x - b.x);
    for (let i = 0; i < curbPoles.length - 1; i++) {
      const p1 = curbPoles[i];
      const p2 = curbPoles[i + 1];

      // 3 parallel cables on top crossarm
      for (const wireOffset of [-0.85, 0, 0.85]) {
        const points = [];
        const segments = 12;
        const sag = 0.55 + Math.abs(p2.x - p1.x) * 0.008;

        for (let s = 0; s <= segments; s++) {
          const t = s / segments;
          const px = p1.x + (p2.x - p1.x) * t;
          // Parabolic catenary sag formula
          const catenary = 4 * sag * t * (1 - t);
          const py = p1.yTop - catenary;
          const pz = p1.z + wireOffset;
          points.push(new THREE.Vector3(px, py, pz));
        }

        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMesh = new THREE.Line(lineGeo, wireMat);
        group.add(lineMesh);

        lines.push({
          p1,
          p2,
          wireOffset,
          mesh: lineMesh,
          points,
          originalSag: sag,
          vibrateTime: 0,
          severed: false
        });
      }
    }
  }

  // Overhead cross-street powerline crossings (susquehanna, dauphin, diamond)
  const crossStreetX = [-120, -30, 75, 165];
  for (const cx of crossStreetX) {
    const eastPole = poles.find(p => p.curb === 'east' && Math.abs(p.x - cx) < 8);
    const westPole = poles.find(p => p.curb === 'west' && Math.abs(p.x - cx) < 8);
    if (eastPole && westPole) {
      const points = [];
      const segments = 16;
      const sag = 0.95;
      for (let s = 0; s <= segments; s++) {
        const t = s / segments;
        const px = eastPole.x + (westPole.x - eastPole.x) * t;
        const pz = eastPole.z + (westPole.z - eastPole.z) * t;
        const py = eastPole.yTop + 0.5 - 4 * sag * t * (1 - t);
        points.push(new THREE.Vector3(px, py, pz));
      }
      const crossLineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const crossLineMesh = new THREE.Line(crossLineGeo, wireMat);
      group.add(crossLineMesh);
      lines.push({
        p1: eastPole,
        p2: westPole,
        wireOffset: 0,
        mesh: crossLineMesh,
        points,
        originalSag: sag,
        vibrateTime: 0,
        severed: false
      });
    }
  }

  // Electrical spark particle pool
  const maxSparks = 120;
  const sparkGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
  const sparkPool = [];
  const sparkBatch=batchSparks?new THREE.InstancedMesh(sparkGeo,sparkMat,maxSparks):null;
  if(sparkBatch){
    sparkBatch.name='power-grid-spark-batch';sparkBatch.count=0;sparkBatch.visible=false;
    sparkBatch.frustumCulled=false;sparkBatch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    group.add(sparkBatch);
  }
  for (let i = 0; i < maxSparks; i++) {
    const mesh = new THREE.Mesh(sparkGeo, sparkMat);
    mesh.visible = false;
    if(!sparkBatch)group.add(mesh);
    sparkPool.push({
      mesh,
      vel: new THREE.Vector3(),
      life: 0,
      maxLife: 1
    });
  }

  // Power brownout state
  let brownoutTime = 0;
  let brownoutDuration = 0;
  let brownoutSeverity = 0;
  let brownoutFlicker = 1.0;
  let nextRandomSparkTime = 8 + Math.random() * 12;

  function spawnElectricalSparks(pos, count = 25) {
    let spawned = 0;
    for (const s of sparkPool) {
      if (s.life <= 0) {
        s.mesh.position.copy(pos);
        s.mesh.visible = true;
        const angle = Math.random() * Math.PI * 2;
        const speed = 3.8 + Math.random() * 8.5;
        s.vel.set(
          Math.cos(angle) * speed,
          2.0 + Math.random() * 5.8,
          Math.sin(angle) * speed * 0.45
        );
        s.maxLife = 0.45 + Math.random() * 0.65;
        s.life = s.maxLife;
        spawned++;
        if (spawned >= count) break;
      }
    }
    syncPowerSparkBatch(sparkBatch,sparkPool);
  }

  function triggerBrownout(duration = 4.2, severity = 0.85) {
    brownoutTime = duration;
    brownoutDuration = duration;
    brownoutSeverity = severity;
  }

  function sparkTransformer(pole, flashFn = null, soundFn = null) {
    if (!pole) return;
    const pos = pole.transformerPos || new THREE.Vector3(pole.x, pole.yTop - 1, pole.z);
    spawnElectricalSparks(pos, 48);
    if (typeof flashFn === 'function') {
      flashFn(pos.x, pos.y, pos.z, 3.4);
    }
    if (typeof soundFn === 'function') {
      soundFn('crash');
    }
    triggerBrownout(4.6 + Math.random() * 2.2, 0.92);
  }

  function checkMeteorInterception(meteorPos, radius, flashFn = null, soundFn = null) {
    let hitSomething = false;
    // Check line intersections
    for (const line of lines) {
      if (line.severed) continue;
      // Check midpoint bounding sphere
      const mid = line.points[Math.floor(line.points.length / 2)];
      if (meteorPos.distanceTo(mid) < radius + 4.5) {
        // Detailed point check
        for (let pIdx = 0; pIdx < line.points.length; pIdx++) {
          if (meteorPos.distanceTo(line.points[pIdx]) < radius + 1.2) {
            line.vibrateTime = 1.8;
            spawnElectricalSparks(line.points[pIdx], 28);
            if (typeof flashFn === 'function') {
              flashFn(line.points[pIdx].x, line.points[pIdx].y, line.points[pIdx].z, 2.6);
            }
            if (typeof soundFn === 'function') {
              soundFn('car');
            }
            triggerBrownout(4.0, 0.82);
            hitSomething = true;
            break;
          }
        }
      }
    }

    // Check pole/transformer hits
    for (const pole of poles) {
      const polePos = new THREE.Vector3(pole.x, pole.yTop * 0.5, pole.z);
      if (meteorPos.distanceTo(polePos) < radius + 3.0) {
        sparkTransformer(pole, flashFn, soundFn);
        hitSomething = true;
      }
    }
    return hitSomething;
  }

  function update(dt, flashFn = null, soundFn = null) {
    // Update sparks
    for (const s of sparkPool) {
      if (s.life > 0) {
        s.life -= dt;
        if (s.life <= 0) {
          s.mesh.visible = false;
        } else {
          s.vel.y -= 14.0 * dt; // gravity
          s.mesh.position.addScaledVector(s.vel, dt);
          if (s.mesh.position.y < 0.1) {
            s.mesh.position.y = 0.1;
            s.vel.y = -s.vel.y * 0.35; // bounce
            s.vel.x *= 0.65;
          }
        }
      }
    }

    syncPowerSparkBatch(sparkBatch,sparkPool);

    // Update vibrating lines
    for (const line of lines) {
      if (line.vibrateTime > 0) {
        line.vibrateTime = Math.max(0, line.vibrateTime - dt);
        const vib = Math.sin(line.vibrateTime * 35) * line.vibrateTime * 0.25;
        const posAttr = line.mesh.geometry.attributes.position;
        for (let i = 0; i < line.points.length; i++) {
          const t = i / (line.points.length - 1);
          const env = Math.sin(t * Math.PI);
          posAttr.setY(i, line.points[i].y + vib * env);
        }
        posAttr.needsUpdate = true;
      }
    }

    // Update brownout
    if (brownoutTime > 0) {
      brownoutTime = Math.max(0, brownoutTime - dt);
      const progress = 1 - brownoutTime / brownoutDuration;
      // Flickering surge dynamics during brownout
      const flicker = (Math.sin(brownoutTime * 28) * 0.5 + Math.sin(brownoutTime * 67) * 0.25) > 0.1 ? 0.35 : 0.08;
      brownoutFlicker = THREE.MathUtils.lerp(flicker, 1.0, Math.min(1, progress * progress));
    } else {
      brownoutFlicker = 1.0;
    }

    // Periodic random transformer sparks during emergency
    nextRandomSparkTime -= dt;
    if (nextRandomSparkTime <= 0) {
      nextRandomSparkTime = 14 + Math.random() * 20;
      const transPoles = poles.filter(p => p.hasTransformer);
      if (transPoles.length > 0) {
        const p = transPoles[Math.floor(Math.random() * transPoles.length)];
        sparkTransformer(p, flashFn, soundFn);
      }
    }
  }

  function getBrownoutFactor() {
    return brownoutFlicker;
  }

  function reset() {
    brownoutTime = 0;
    brownoutDuration = 0;
    brownoutSeverity = 0;
    brownoutFlicker = 1.0;
    nextRandomSparkTime = 8 + Math.random() * 12;
    for (const s of sparkPool) {
      s.life = 0;
      s.mesh.visible = false;
    }
    syncPowerSparkBatch(sparkBatch,sparkPool);
    for (const line of lines) {
      line.vibrateTime = 0;
      line.severed = false;
      const posAttr = line.mesh.geometry.attributes.position;
      for (let i = 0; i < line.points.length; i++) {
        posAttr.setY(i, line.points[i].y);
      }
      posAttr.needsUpdate = true;
    }
    for (const pole of poles) {
      pole.damaged = false;
    }
  }

  return {
    group,
    poles,
    lines,
    update,
    checkMeteorInterception,
    triggerBrownout,
    sparkTransformer,
    getBrownoutFactor,
    sparkRenderStats:()=>({active:sparkPool.filter(s=>s.life>0&&s.mesh.visible).length,batched:!!sparkBatch,instances:sparkBatch?.count??0}),
    reset
  };
}
