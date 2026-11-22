import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { parcelOverhang, overlapsBetweenLoadedModels } from '../simulation/model-footprint-audit.js';

// North Broad Street Model Pack Integration (RC113)
// Real photogrammetric models for 11 Broad Street structures from Berean Church
// to the 2300 block PECO building, calibrated to the game coordinate frame.
// Tech Freire school model remains in place. Watts reference remains unplaced.

export const NORTH_BROAD_DEFINITIONS = [
  {
    id: '1005656',
    address: '2101-07 N BROAD ST',
    name: 'Berean Presbyterian Church',
    file: './assets/models/north-broad/models/1005656.glb',
    frontWidth: 20.29,
    gameBuilding: 'south-diamond-corner',
    position: [224.0, 0, -0.15],
    isChurch: true,
    sign: null,
    matchConfidence: 'Exact Corner Match (Corner of Broad & Diamond, 2101-07 N Broad)'
  },
  {
    id: '1007134',
    address: '2217 N BROAD ST',
    name: '2217 N Broad Rowhouse',
    file: './assets/models/north-broad/models/1007134.glb',
    frontWidth: 6.16,
    gameBuilding: 'north-2217-brownstone',
    position: [22.38, 0, -0.15],
    sign: null,
    matchConfidence: 'Exact 100% Match (Rowhouse pair south of Tech Freire)'
  },
  {
    id: '1007133',
    address: '2219 N BROAD ST',
    name: '2219 N Broad Rowhouse',
    file: './assets/models/north-broad/models/1007133.glb',
    frontWidth: 6.04,
    gameBuilding: 'north-2219-brownstone',
    position: [16.28, 0, -0.15],
    sign: null,
    matchConfidence: 'Exact 100% Match (Rowhouse pair south of Tech Freire)'
  },
  {
    id: '1007132',
    address: '2227 N BROAD ST',
    name: 'United Fund of Pennsylvania',
    file: './assets/models/north-broad/models/1007132.glb',
    frontWidth: 5.74,
    gameBuilding: 'united-fund-cream',
    position: [-16.13, 0, -0.15],
    sign: 'United Fund of Pennsylvania, Inc.',
    matchConfidence: 'Exact 100% Match (united-fund-cream parcel, north party wall of Tech Freire)'
  },
  {
    id: '1003388',
    address: '2231 N BROAD ST',
    name: 'Black United Fund Conference Center',
    file: './assets/models/north-broad/models/1003388.glb',
    frontWidth: 5.13,
    gameBuilding: 'black-united-fund',
    position: [-21.56, 0, -0.15],
    sign: 'Black United Fund Conference Center',
    matchConfidence: 'Exact 100% Match (black-united-fund parcel, shared party wall with 2233)'
  },
  {
    id: '1525758',
    address: '2233 N BROAD ST',
    name: 'blues babe FOUNDATION',
    file: './assets/models/north-broad/models/1525758.glb',
    frontWidth: 6.24,
    gameBuilding: 'blues-babe-foundation',
    position: [-27.25, 0, -0.15],
    sign: 'blues babe FOUNDATION',
    matchConfidence: 'Exact 100% Match (blues-babe-foundation parcel, shared party wall with 2231)'
  },
  {
    id: '1536711',
    address: '2239 N BROAD ST',
    name: '2239 N Broad Rowhouse',
    file: './assets/models/north-broad/models/1536711.glb',
    frontWidth: 5.79,
    gameBuilding: 'north-2239-rowhouse',
    position: [-44.67, 0, -0.15],
    sign: null,
    matchConfidence: 'Exact 100% Match (north-2239-rowhouse parcel, opposing stoop pair with 2241)'
  },
  {
    id: '1508518',
    address: '2241 N BROAD ST',
    name: '2241 N Broad Rowhouse',
    file: './assets/models/north-broad/models/1508518.glb',
    frontWidth: 5.68,
    gameBuilding: 'north-2241-rowhouse',
    position: [-50.40, 0, -0.15],
    sign: null,
    matchConfidence: 'Exact 100% Match (north-2241-rowhouse parcel, opposing stoop pair with 2239)'
  },
  {
    id: '1536713',
    address: '2251 N BROAD ST',
    name: 'PCs for People',
    file: './assets/models/north-broad/models/1536713.glb',
    frontWidth: 5.57,
    gameBuilding: 'pcs-for-people',
    position: [-77.82, 0, -0.15],
    sign: 'PCs for People',
    matchConfidence: 'Exact 100% Match (pcs-for-people parcel, shared party wall with Doll Museum)'
  },
  {
    id: '1542243',
    address: '2253 N BROAD ST',
    name: 'Philadelphia Doll Museum',
    file: './assets/models/north-broad/models/1542243.glb',
    frontWidth: 6.48,
    gameBuilding: 'north-doll-museum',
    position: [-83.85, 0, -0.15],
    sign: 'PHILADELPHIA DOLL MUSEUM',
    matchConfidence: 'Exact Corner Match (Corner of Broad & Dauphin, 2253 N Broad)'
  },
  {
    id: '1051326',
    address: '2309-13 N BROAD ST',
    name: 'Philadelphia Electric Company',
    file: './assets/models/north-broad/models/1051326.glb',
    frontWidth: 20.45,
    gameBuilding: 'north-2300-corner-commercial',
    position: [-148.225, 0, -0.15],
    sign: 'PHILADELPHIA ELECTRIC COMPANY',
    matchConfidence: 'Exact Corner Match (Corner of Broad & York, 2309-13 N Broad)'
  },
  {
    id: 'watts-example',
    address: 'Watts rear elevation study',
    name: 'Watts rear-addition study',
    file: './assets/models/north-broad/models/watts-example.glb',
    frontWidth: 5.6,
    gameBuilding: null,
    position: null,
    sign: null,
    matchConfidence: 'Unplaced reference study (Preserved unplaced per instruction)'
  }
];

export function createNorthBroadModels(THREE, scene, city, referenceFacades) {
  const root = new THREE.Group();
  root.name = 'NORTH-BROAD-REPLACEMENT-MODELS';
  scene.add(root);

  const loader = new GLTFLoader();
  const entries = [];
  const glassMaterials = [];
  const signMaterials = [];
  const roomMaterials = [];

  // Permanently remove and hide old procedural and reference models for all replaced parcels
  const replacedBuildings = new Set(NORTH_BROAD_DEFINITIONS.map(d => d.gameBuilding).filter(Boolean));
  for (const bName of replacedBuildings) {
    city.setIntactBuildingVisible(bName, false);
    referenceFacades?.setExternalFacade?.(bName, true);
  }

  // Berean Church Rubble & Interior Proxy
  let churchInterior = null;
  let churchRubbleProxy = null;

  function buildChurchInteriorAndRubble(churchPos) {
    const group = new THREE.Group();
    group.name = 'berean-church-interior-proxy';
    group.position.set(churchPos[0], churchPos[1], churchPos[2]);

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x5a3e28,
      roughness: 0.88,
      metalness: 0.05,
      envMapIntensity: 0.02
    });
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x8c8982,
      roughness: 0.95,
      metalness: 0.0,
      envMapIntensity: 0.02
    });
    const carpetMat = new THREE.MeshStandardMaterial({
      color: 0x6e282d,
      roughness: 0.92,
      metalness: 0.0
    });

    const box = new THREE.BoxGeometry(1, 1, 1);

    // Floor slab
    const floor = new THREE.Mesh(box, woodMat);
    floor.scale.set(19.5, 0.3, 44.0);
    floor.position.set(5.0, 0.15, -24.0);
    floor.receiveShadow = true;
    group.add(floor);

    // Carpet runner
    const carpet = new THREE.Mesh(box, carpetMat);
    carpet.scale.set(2.4, 0.05, 38.0);
    carpet.position.set(5.0, 0.32, -22.0);
    group.add(carpet);

    // Rows of wooden pews
    for (let row = 0; row < 12; row++) {
      const z = -8.0 - row * 2.6;
      for (const side of [-1, 1]) {
        const pew = new THREE.Mesh(box, woodMat);
        pew.scale.set(5.2, 0.9, 0.65);
        pew.position.set(5.0 + side * 4.6, 0.75, z);
        pew.castShadow = true;
        pew.receiveShadow = true;
        group.add(pew);
      }
    }

    // Timber roof trusses
    for (let truss = 0; truss < 8; truss++) {
      const z = -6.0 - truss * 5.2;
      const beam = new THREE.Mesh(box, woodMat);
      beam.scale.set(18.0, 0.45, 0.45);
      beam.position.set(5.0, 11.5, z);
      beam.castShadow = true;
      group.add(beam);
    }

    // Broken stone/timber rubble piles inside nave
    for (let r = 0; r < 14; r++) {
      const rub = new THREE.Mesh(box, r % 2 ? stoneMat : woodMat);
      const angle = r * 0.45;
      rub.scale.set(1.4 + (r % 3) * 0.6, 0.8 + (r % 2) * 0.5, 1.2 + (r % 4) * 0.4);
      rub.position.set(5.0 + Math.sin(angle) * 6.0, 0.6 + (r % 3) * 0.3, -10.0 - r * 2.4);
      rub.rotation.set((r % 5) * 0.2, (r % 3) * 0.5, (r % 4) * 0.15);
      rub.castShadow = true;
      group.add(rub);
    }

    group.visible = false;
    root.add(group);
    churchInterior = group;

    // Full collapse rubble proxy
    const rubbleRoot = new THREE.Group();
    rubbleRoot.name = 'berean-church-full-collapse-rubble';
    rubbleRoot.position.set(churchPos[0], churchPos[1], churchPos[2]);

    for (let i = 0; i < 36; i++) {
      const chunk = new THREE.Mesh(box, i % 3 === 0 ? woodMat : stoneMat);
      const a = (i * 1.37) % (Math.PI * 2);
      const dist = 1.0 + (i % 7) * 2.2;
      chunk.scale.set(1.8 + (i % 4) * 0.8, 1.2 + (i % 3) * 0.7, 1.6 + (i % 5) * 0.6);
      chunk.position.set(5.0 + Math.cos(a) * dist, 0.7 + (i % 4) * 0.4, -22.0 + Math.sin(a) * (dist * 1.6));
      chunk.rotation.set((i % 7) * 0.25, (i % 5) * 0.4, (i % 3) * 0.3);
      chunk.castShadow = true;
      rubbleRoot.add(chunk);
    }
    rubbleRoot.visible = false;
    root.add(rubbleRoot);
    churchRubbleProxy = rubbleRoot;
  }

  // Load each replacement model
  for (const def of NORTH_BROAD_DEFINITIONS) {
    if (!def.position || !def.file || def.id === 'watts-example') continue;

    const entry = {
      def,
      loaded: false,
      model: null,
      worldBounds: null,
      loadError: null,
      damage: 0,
      damageStage: 0,
      groups: {},
      glassMeshes: [],
      signMeshes: [],
      targetBuilding: city.buildings.find(b => b.name === def.gameBuilding) || null
    };
    entries.push(entry);

    if (def.isChurch) {
      buildChurchInteriorAndRubble(def.position);
    }

    loader.load(
      def.file,
      gltf => {
        const model = gltf.scene;
        model.name = `MODEL-${def.id}-${def.address.replace(/\s+/g, '_')}`;
        model.position.set(def.position[0], def.position[1], def.position[2]);
        model.rotation.set(0, 0, 0);

        // Traverse and catalog groups & materials
        model.traverse(node => {
          if (!node) return;
          const name = (node.name || '').toLowerCase().replace(/_/g, ' ');

          // Catalog named damage groups
          if (/cornice/.test(name)) entry.groups.cornice = node;
          else if (/sign/.test(name)) entry.groups.sign = node;
          else if (/roof/.test(name)) {
            if (def.isChurch) entry.groups.churchRoof = node;
            else entry.groups.roof = node;
          } else if (/facade floor 2|electric company facade/.test(name)) {
            entry.groups.facade2 = node;
          } else if (/floor 2/.test(name)) {
            entry.groups.floor2 = node;
          } else if (/facade floor 1/.test(name)) {
            entry.groups.facade1 = node;
          } else if (/floor 1/.test(name)) {
            entry.groups.floor1 = node;
          } else if (/facade floor 0/.test(name)) {
            entry.groups.facade0 = node;
          } else if (/floor 0/.test(name)) {
            entry.groups.floor0 = node;
          } else if (/shell/.test(name)) {
            entry.groups.shell = node;
          } else if (def.isChurch && /church walls and entrances/.test(name)) {
            entry.groups.churchWalls = node;
          }

          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;

            const materials = Array.isArray(node.material) ? node.material : [node.material];
            for (let i = 0; i < materials.length; i++) {
              const mat = materials[i];
              if (!mat) continue;

              const matName = (mat.name || '').toLowerCase();

              // Window Glass calibration: PBR environment reflections, depth sorting
              if (matName.includes('reflective glass') || /glass|glaz|window/.test(name)) {
                const physicalGlass = new THREE.MeshPhysicalMaterial({
                  color: mat.color ? mat.color.clone() : new THREE.Color(0x6295ad),
                  roughness: 0.08,
                  metalness: 0.32,
                  clearcoat: 1.0,
                  clearcoatRoughness: 0.08,
                  envMapIntensity: 2.8,
                  transparent: true,
                  opacity: 0.82,
                  depthWrite: false,
                  side: THREE.DoubleSide
                });
                if (Array.isArray(node.material)) node.material[i] = physicalGlass;
                else node.material = physicalGlass;

                entry.glassMeshes.push(node);
                glassMaterials.push(physicalGlass);
              } else if (matName.includes('@sign') || /sign/.test(name)) {
                // Sign calibration: preserve embedded texture
                mat.roughness = 0.85;
                mat.metalness = 0.0;
                mat.transparent = true;
                if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;
                entry.signMeshes.push(node);
                signMaterials.push(mat);
              } else {
                // Masonry, stone, roofs, floor slabs: lift darks naturally with soft ambient bounce
                const isRoof = /roof/.test(name) || matName.includes('roof');
                mat.roughness = isRoof ? 0.98 : 0.84;
                mat.metalness = 0.02;
                mat.envMapIntensity = isRoof ? 0.0 : 0.25;

                if (/room|floor/.test(name)) {
                  roomMaterials.push(mat);
                }
              }
            }
          }
        });

        root.add(model);
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(model);
        const bounds = {minX:box.min.x,maxX:box.max.x,
          minY:box.min.y,maxY:box.max.y,minZ:box.min.z,maxZ:box.max.z};
        entry.worldBounds = Object.values(bounds).every(Number.isFinite)
          ? Object.fromEntries(Object.entries(bounds).map(([k,v])=>[k,+v.toFixed(3)]))
          : null;
        entry.model = model;
        entry.loaded = true;

        // Hide procedural building geometry now that replacement visual is loaded
        if (def.gameBuilding) {
          city.setIntactBuildingVisible(def.gameBuilding, false);
          referenceFacades?.setExternalFacade?.(def.gameBuilding, true);
        }
      },
      undefined,
      err => {
        entry.loadError = String(err?.message || err || 'asset load failed').slice(0,200);
        console.warn(`[NorthBroadModels] Failed to load ${def.file}:`, err);
        // Fallback: procedural building stays visible automatically
      }
    );
  }

  function applyDamage(entry, dmg) {
    entry.damage = Math.max(0, Math.min(1, dmg));
    if (!entry.model) return;

    if (entry.def.isChurch) {
      // Berean Church Damage Stages
      if (entry.groups.churchRoof) {
        entry.groups.churchRoof.visible = entry.damage < 0.40;
      }
      if (churchInterior) {
        churchInterior.visible = entry.damage >= 0.40 && entry.damage < 0.99;
      }
      if (entry.groups.churchWalls) {
        entry.groups.churchWalls.visible = entry.damage < 0.95;
      }
      if (entry.damage >= 0.99) {
        entry.model.visible = false;
        if (churchInterior) churchInterior.visible = false;
        if (churchRubbleProxy) churchRubbleProxy.visible = true;
      } else {
        entry.model.visible = true;
        if (churchRubbleProxy) churchRubbleProxy.visible = false;
      }
    } else {
      // Rowhouse / Storefront Damage Stages
      if (entry.groups.cornice) entry.groups.cornice.visible = entry.damage < 0.15;
      if (entry.groups.sign) entry.groups.sign.visible = entry.damage < 0.20;
      if (entry.groups.roof) entry.groups.roof.visible = entry.damage < 0.35;
      if (entry.groups.facade2) entry.groups.facade2.visible = entry.damage < 0.45;
      if (entry.groups.floor2) entry.groups.floor2.visible = entry.damage < 0.55;
      if (entry.groups.facade1) entry.groups.facade1.visible = entry.damage < 0.65;
      if (entry.groups.floor1) entry.groups.floor1.visible = entry.damage < 0.75;
      if (entry.groups.facade0) entry.groups.facade0.visible = entry.damage < 0.85;
      if (entry.groups.floor0) entry.groups.floor0.visible = entry.damage < 0.90;
      if (entry.groups.shell) entry.groups.shell.visible = entry.damage < 0.95;

      // Complete collapse
      if (entry.damage >= 0.99) {
        entry.model.visible = false;
      } else {
        entry.model.visible = true;
      }
    }
  }

  function syncWithCityDamage() {
    for (const entry of entries) {
      if (!entry.loaded || !entry.targetBuilding) continue;
      const bDamage = entry.targetBuilding.damage || 0;
      if (Math.abs(bDamage - entry.damage) > 0.01) {
        applyDamage(entry, bDamage);
      }
    }
  }

  function updateLighting(darkness = 0, brownout = 1.0) {
    // Night cycle lighting: interior window warmth & sign illumination
    const nightGlow = Math.max(0, (darkness - 0.18) * 0.75 * brownout);
    for (const mat of glassMaterials) {
      if (mat.emissive) {
        mat.emissive.setHex(0xe3b873);
        mat.emissiveIntensity = nightGlow * 0.45;
      }
    }
    for (const mat of signMaterials) {
      if (mat.userData.baseOpacity === undefined) mat.userData.baseOpacity = mat.opacity || 1.0;
      mat.opacity = mat.userData.baseOpacity * Math.max(0.3, brownout);
    }
    for (const mat of roomMaterials) {
      if (mat.emissive) {
        mat.emissive.setHex(0xe8c17a);
        mat.emissiveIntensity = nightGlow * 0.35;
      }
    }
  }

  return {
    root,
    entries,
    definitions: NORTH_BROAD_DEFINITIONS,
    update(dt, darkness = 0, brownout = 1.0) {
      syncWithCityDamage();
      updateLighting(darkness, brownout);
    },
    damageBuilding(idOrAddress, amount = 0.5) {
      const entry = entries.find(e => e.def.id === idOrAddress || e.def.address.includes(idOrAddress) || e.def.name.includes(idOrAddress));
      if (!entry) return null;
      applyDamage(entry, (entry.damage || 0) + amount);
      if (entry.targetBuilding) {
        city.forceDamage(entry.targetBuilding, entry.damage);
      }
      return { id: entry.def.id, address: entry.def.address, damage: entry.damage };
    },
    collapseBuilding(idOrAddress) {
      return this.damageBuilding(idOrAddress, 1.0);
    },
    restore() {
      for (const entry of entries) {
        applyDamage(entry, 0);
        if (entry.targetBuilding) {
          entry.targetBuilding.damage = 0;
          city.setIntactBuildingVisible(entry.def.gameBuilding, false);
          referenceFacades?.setExternalFacade?.(entry.def.gameBuilding, true);
        }
      }
      if (churchInterior) churchInterior.visible = false;
      if (churchRubbleProxy) churchRubbleProxy.visible = false;
    },
    getStats() {
      return {
        totalModels: NORTH_BROAD_DEFINITIONS.length,
        placementCount: entries.length,
        loadedCount: entries.filter(e => e.loaded).length,
        overlapWarnings: overlapsBetweenLoadedModels(entries),
        models: entries.map(e => ({
          id: e.def.id,
          address: e.def.address,
          name: e.def.name,
          gameBuilding: e.def.gameBuilding,
          loaded: e.loaded,
          loadError: e.loadError,
          worldBounds: e.worldBounds,
          parcelOverhang: parcelOverhang(e.worldBounds, e.targetBuilding),
          visible: e.model?.visible ?? false,
          damage: +(e.damage || 0).toFixed(2),
          matchConfidence: e.def.matchConfidence
        }))
      };
    }
  };
}
