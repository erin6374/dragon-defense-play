import * as THREE from 'three';
import { CROSS_STREETS,BROAD_X } from '../simulation/road-corridors.js';
import { curbAt } from '../../broad-street/broad-street-grid-data.mjs';
import { VIEWER_TO_GAME_X,VIEWER_TO_GAME_Z } from '../simulation/viewer-parcels.js';

// Approximate drain offsets follow the mapped curb, not legacy lane centers.
function gutterZ(x,side){const c=curbAt(x-VIEWER_TO_GAME_X);return c[side]+VIEWER_TO_GAME_Z+(side===0?.45:-.45);}
function drainLocations(){return CROSS_STREETS.flatMap(j=>{
 const x=j.x+j.roadHalfWidth+2;
 return [0,1].map(side=>({id:`drain-${j.name.toLowerCase().replace(/[^a-z]+/g,'-')}-${side}`,x,z:gutterZ(x,side),side:side===0?'north':'south'}));
});}

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

  const GUTTER_MIN_X=BROAD_X[0],GUTTER_MAX_X=BROAD_X[1];
  const GUTTER_LENGTH=GUTTER_MAX_X-GUTTER_MIN_X;
  const NORTH_GUTTER_Z=gutterZ(0,0),SOUTH_GUTTER_Z=gutterZ(0,1);
  const DRAIN_LOCATIONS=drainLocations();

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

  // Segmented ribbons follow the varying curb and leave junction mouths clear.
  const gutterMeshes=[];
  const cuts=[GUTTER_MIN_X,...CROSS_STREETS.flatMap(j=>[j.x-j.roadHalfWidth,j.x+j.roadHalfWidth]),GUTTER_MAX_X];
  for(let i=0;i+1<cuts.length;i+=2){
    const from=cuts[i],to=cuts[i+1];if(to<=from)continue;
    for(const side of [0,1]){
      const geometry=new THREE.PlaneGeometry(to-from,.68,Math.max(1,Math.ceil((to-from)/12)),1);
      geometry.rotateX(-Math.PI/2);
      const positions=geometry.attributes.position,mid=(from+to)/2;
      for(let k=0;k<positions.count;k++)positions.setZ(k,positions.getZ(k)+gutterZ(mid+positions.getX(k),side));
      positions.needsUpdate=true;
      geometry.computeBoundingSphere();
      const mesh=new THREE.Mesh(geometry,waterFlowRibbonMat);
      mesh.position.set(mid,.035,0);mesh.visible=false;
      root.add(mesh);gutterMeshes.push(mesh);
    }
  }

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
      for(const mesh of gutterMeshes)mesh.visible=isFlowing;

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
    reset() {
      currentRunoffVolume=0;targetRunoffVolume=0;flowClock=0;ripplePulse=0;
      waterFlowRibbonMat.opacity=0;waterFilmMat.opacity=0;
      waterFlowRibbonMat.normalScale.set(.35,.35);rippleNormalTex.offset.x=0;
      for(const mesh of gutterMeshes)mesh.visible=false;
      for(const d of drainObjects){
        d.flowRate=0;d.vortexMesh.visible=false;d.vortexMat.opacity=0;
        d.vortexMesh.rotation.z=0;d.vortexMesh.scale.set(1,1,1);
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
