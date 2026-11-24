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
    position: [223.2, 0, -0.15],
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
  let effectsHooks = null;
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
  let churchFeatures = null;
  const churchStainedGlassMaterials = [];

  function buildBereanRoseWindowAndSpires(THREE, parentGroup, churchPos) {
    const group = new THREE.Group();
    group.name = 'berean-church-rose-window-and-spires';
    group.position.set(churchPos[0], churchPos[1], churchPos[2]);

    // Materials
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8a8176, roughness: 0.92, metalness: 0.02 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xd3c4a8, roughness: 0.88, metalness: 0.02 });
    const spireSlateMat = new THREE.MeshStandardMaterial({ color: 0x45474b, roughness: 0.95, metalness: 0.05 });

    // Multi-color jewel-toned stained glass materials (sapphire cobalt, ruby red, amber gold)
    const cobaltGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x164273,
      emissive: 0x1e5a9c,
      emissiveIntensity: 0.90,
      roughness: 0.10,
      metalness: 0.20,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      transparent: true,
      opacity: 0.90,
      side: THREE.DoubleSide
    });
    const rubyGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x7a1824,
      emissive: 0x992230,
      emissiveIntensity: 0.90,
      roughness: 0.10,
      metalness: 0.20,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      transparent: true,
      opacity: 0.90,
      side: THREE.DoubleSide
    });
    const amberGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xca8c2a,
      emissive: 0xe5a336,
      emissiveIntensity: 0.95,
      roughness: 0.08,
      metalness: 0.22,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide
    });
    churchStainedGlassMaterials.push(cobaltGlassMat, rubyGlassMat, amberGlassMat);
    const portalDoorMat = new THREE.MeshStandardMaterial({ color: 0x782e27, roughness: 0.82, metalness: 0.05 });

    // 1. FRONT GRAND CIRCULAR STAINED GLASS ROSE WINDOW (Facing Broad Street / Camera at Z = 0.25, X = 5.3, Y = 11.2)
    const roseRoot = new THREE.Group();
    roseRoot.name = 'berean-rose-window-front';
    roseRoot.position.set(5.3, 11.2, 0.25);

    // Multi-ring jewel-toned stained glass:
    // Outer sapphire cobalt ring (radius 1.05m to 2.18m)
    const outerCobaltGeo = new THREE.RingGeometry(1.05, 2.18, 48);
    const outerCobaltMesh = new THREE.Mesh(outerCobaltGeo, cobaltGlassMat);
    roseRoot.add(outerCobaltMesh);

    // Middle ruby crimson ring (radius 0.35m to 1.05m)
    const midRubyGeo = new THREE.RingGeometry(0.35, 1.05, 36);
    const midRubyMesh = new THREE.Mesh(midRubyGeo, rubyGlassMat);
    midRubyMesh.position.z = 0.01;
    roseRoot.add(midRubyMesh);

    // Center amber gold rosette disc (radius 0.35m)
    const centerAmberGeo = new THREE.CircleGeometry(0.35, 24);
    const centerAmberMesh = new THREE.Mesh(centerAmberGeo, amberGlassMat);
    centerAmberMesh.position.z = 0.02;
    roseRoot.add(centerAmberMesh);

    // Outer carved stone surround ring
    const ringGeo = new THREE.RingGeometry(2.18, 2.62, 48);
    const ringMesh = new THREE.Mesh(ringGeo, trimMat);
    ringMesh.position.z = 0.04;
    roseRoot.add(ringMesh);

    // Inner tracery stone ring
    const innerRingGeo = new THREE.RingGeometry(0.85, 1.05, 36);
    const innerRingMesh = new THREE.Mesh(innerRingGeo, trimMat);
    innerRingMesh.position.z = 0.06;
    roseRoot.add(innerRingMesh);

    // 8 Radial stone mullions (cross spokes)
    const spokeGeo = new THREE.BoxGeometry(0.11, 4.4, 0.12);
    for (let i = 0; i < 4; i++) {
      const spoke = new THREE.Mesh(spokeGeo, trimMat);
      spoke.position.z = 0.08;
      spoke.rotation.z = (i * Math.PI) / 4;
      roseRoot.add(spoke);
    }

    // Central decorative rosette hub
    const hubGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.18, 16);
    const hubMesh = new THREE.Mesh(hubGeo, trimMat);
    hubMesh.rotation.x = Math.PI / 2;
    hubMesh.position.z = 0.10;
    roseRoot.add(hubMesh);

    // Gothic arched entrance portal directly below rose window (Y = 2.4, Z = 0.22)
    const doorGeo = new THREE.BoxGeometry(3.4, 4.2, 0.3);
    const doorMesh = new THREE.Mesh(doorGeo, portalDoorMat);
    doorMesh.position.set(5.3, 2.2, 0.22);
    group.add(doorMesh);

    const doorArchGeo = new THREE.RingGeometry(1.68, 2.12, 32, 1, 0, Math.PI);
    const doorArchMesh = new THREE.Mesh(doorArchGeo, trimMat);
    doorArchMesh.position.set(5.3, 4.25, 0.28);
    group.add(doorArchMesh);

    // Carved stone entrance steps
    for (let s = 0; s < 3; s++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(5.2 - s * 0.4, 0.2, 0.7), trimMat);
      step.position.set(5.3, 0.1 + s * 0.2, 0.45 + (2 - s) * 0.4);
      group.add(step);
    }

    group.add(roseRoot);

    // 2. TWIN OCTAGONAL BELFRY TOWERS & CONICAL SPIRES (Front corners at X = -7.0 and X = 17.6)
    const spiresGroup = new THREE.Group();
    spiresGroup.name = 'berean-church-twin-spires';
    for (const tx of [-7.0, 17.6]) {
      // Tower stone shaft
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 12, 8), stoneMat);
      shaft.position.set(tx, 6.0, -1.5);
      shaft.castShadow = true;
      spiresGroup.add(shaft);

      // Stone decorative belfry cornice
      const cornice = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 1.7, 0.8, 8), trimMat);
      cornice.position.set(tx, 12.4, -1.5);
      cornice.castShadow = true;
      spiresGroup.add(cornice);

      // Conical spire roof
      const spire = new THREE.Mesh(new THREE.ConeGeometry(2.0, 6.0, 8), spireSlateMat);
      spire.position.set(tx, 15.8, -1.5);
      spire.castShadow = true;
      spiresGroup.add(spire);

      // Spire cross finial
      const finialV = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.4, 0.12), trimMat);
      finialV.position.set(tx, 19.3, -1.5);
      const finialH = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.12), trimMat);
      finialH.position.set(tx, 19.1, -1.5);
      spiresGroup.add(finialV);
      spiresGroup.add(finialH);
    }
    group.add(spiresGroup);

    // 3. SOUTH TRANSEPT CIRCULAR ROSE WINDOW (Facing Diamond Street at X = 20.85, Y = 10.5, Z = -22.0)
    const southRose = new THREE.Group();
    southRose.name = 'berean-rose-window-diamond-street';
    southRose.position.set(20.85, 10.5, -22.0);
    southRose.rotation.y = Math.PI / 2;

    // Multi-ring jeweled glass for south transept rose window
    const southCobaltGeo = new THREE.RingGeometry(0.85, 1.85, 36);
    const southCobaltMesh = new THREE.Mesh(southCobaltGeo, cobaltGlassMat);
    southRose.add(southCobaltMesh);

    const southRubyGeo = new THREE.CircleGeometry(0.85, 24);
    const southRubyMesh = new THREE.Mesh(southRubyGeo, rubyGlassMat);
    southRubyMesh.position.z = 0.01;
    southRose.add(southRubyMesh);
    const southRing = new THREE.Mesh(new THREE.RingGeometry(1.83, 2.22, 36), trimMat);
    southRing.position.z = 0.04;
    southRose.add(southRing);
    for (let i = 0; i < 4; i++) {
      const sp = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.7, 0.1), trimMat);
      sp.position.z = 0.06;
      sp.rotation.z = (i * Math.PI) / 4;
      southRose.add(sp);
    }
    group.add(southRose);

    parentGroup.add(group);
    return { group, roseRoot, spiresGroup, southRose };
  }

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

  const rubbleBox = new THREE.BoxGeometry(1, 1, 1);
  const rubbleWood = new THREE.MeshStandardMaterial({ color: 0x5a3e28, roughness: 0.88, metalness: 0.05 });
  const rubbleStone = new THREE.MeshStandardMaterial({ color: 0x8c8982, roughness: 0.95, metalness: 0.0 });

  function buildBuildingRubbleProxy(entry) {
    if (entry.def.isChurch) return;
    const rubbleRoot = new THREE.Group();
    rubbleRoot.name = `rubble-${entry.def.id}`;
    const pos = entry.def.position;
    rubbleRoot.position.set(pos[0], pos[1], pos[2]);
    const width = entry.def.frontWidth || 6.0;
    const depth = entry.targetBuilding?.d || 18.0;
    const count = Math.max(14, Math.round(width * 2.5));
    for (let i = 0; i < count; i++) {
      const chunk = new THREE.Mesh(rubbleBox, i % 3 === 0 ? rubbleWood : rubbleStone);
      const rx = (Math.random() - 0.5) * (width * 0.85);
      const rz = -depth * 0.45 + (Math.random() - 0.5) * (depth * 0.7);
      const ry = 0.35 + Math.random() * 0.85;
      chunk.scale.set(0.6 + Math.random() * 0.9, 0.4 + Math.random() * 0.6, 0.6 + Math.random() * 0.9);
      chunk.position.set(rx, ry, rz);
      chunk.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
      chunk.castShadow = true;
      rubbleRoot.add(chunk);
    }
    rubbleRoot.visible = false;
    root.add(rubbleRoot);
    entry.rubbleProxy = rubbleRoot;
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
      sectionDamage: { floor0: 0, floor1: 0, floor2: 0, roof: 0, cornice: 0, sign: 0, roseWindow: 0, churchRoof: 0, churchWalls: 0 },
      churchFeatures: null,
      rubbleProxy: null,
      groups: {},
      glassMeshes: [],
      signMeshes: [],
      targetBuilding: city.buildings.find(b => b.name === def.gameBuilding) || null
    };
    entries.push(entry);

    if (def.isChurch) {
      buildChurchInteriorAndRubble(def.position);
      entry.churchFeatures = buildBereanRoseWindowAndSpires(THREE, root, def.position);
    } else {
      buildBuildingRubbleProxy(entry);
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

  // Realistic procedural physics damage: localized by 3D meteor impact coordinates
  // Realistic procedural physics damage: localized by 3D meteor impact coordinates
  function applyLocalizedImpact(entry, origin, radius = 5.0, strength = 1.0) {
    if (!entry.model) return 0;
    entry.sectionDamage = entry.sectionDamage || {
      floor0: 0, floor1: 0, floor2: 0, roof: 0, cornice: 0, sign: 0,
      roseWindow: 0, churchRoof: 0, churchWalls: 0
    };

    const bHeight = entry.targetBuilding?.h || (entry.worldBounds ? entry.worldBounds.maxY - entry.worldBounds.minY : 16.0);
    const relY = origin.y;
    const normY = Math.max(0, Math.min(1.0, relY / bHeight));

    if (entry.def.isChurch) {
      if (relY >= 8.0 || origin.z < -8.0) {
        // High strike on church roof / spires / nave: crumple roof, reveal interior trusses and pews!
        entry.sectionDamage.churchRoof = Math.min(1.0, entry.sectionDamage.churchRoof + strength * 0.95);
        if (entry.sectionDamage.churchRoof >= 0.28) {
          if (entry.groups.churchRoof) entry.groups.churchRoof.visible = false;
          if (churchInterior) churchInterior.visible = true;
          if (entry.churchFeatures?.spiresGroup) entry.churchFeatures.spiresGroup.visible = false;
        }
      } else {
        // Lower strike: breach entrance / lower walls
        entry.sectionDamage.churchWalls = Math.min(1.0, entry.sectionDamage.churchWalls + strength * 0.85);
        if (entry.sectionDamage.churchWalls >= 0.28 && entry.groups.churchWalls) {
          entry.groups.churchWalls.visible = false;
        }
      }

      // Check direct rose window strike (Y ≈ 11.2, near front facade)
      if (Math.abs(relY - 11.2) < 4.5 && origin.z > -16.0) {
        entry.sectionDamage.roseWindow = Math.min(1.0, entry.sectionDamage.roseWindow + strength * 0.95);
        if (entry.sectionDamage.roseWindow >= 0.28 && entry.churchFeatures?.roseRoot) {
          entry.churchFeatures.roseRoot.visible = false;
        }
      }

      entry.damage = (entry.sectionDamage.churchRoof * 0.5 + entry.sectionDamage.churchWalls * 0.5);
      if (entry.damage >= 0.70) {
        entry.model.visible = false;
        if (entry.churchFeatures?.group) entry.churchFeatures.group.visible = false;
        if (churchInterior) churchInterior.visible = false;
        if (churchRubbleProxy) churchRubbleProxy.visible = true;
      }
    } else {
      // Rowhouse / Storefront localized height sectioning:
      if (normY >= 0.80 || relY >= bHeight - 2.8) {
        // Meteor hit roof / cornice level! Roof crumples while lower floors stay standing!
        entry.sectionDamage.roof = Math.min(1.0, entry.sectionDamage.roof + strength * 0.95);
        entry.sectionDamage.cornice = Math.min(1.0, entry.sectionDamage.cornice + strength * 0.95);
        if (entry.sectionDamage.roof >= 0.28 && entry.groups.roof) entry.groups.roof.visible = false;
        if (entry.sectionDamage.cornice >= 0.28 && entry.groups.cornice) entry.groups.cornice.visible = false;
      } else if (normY >= 0.52) {
        // Floor 2 hit (upper story)!
        entry.sectionDamage.floor2 = Math.min(1.0, entry.sectionDamage.floor2 + strength * 0.95);
        if (entry.sectionDamage.floor2 >= 0.28) {
          if (entry.groups.facade2) entry.groups.facade2.visible = false;
          if (entry.groups.floor2) entry.groups.floor2.visible = false;
        }
      } else if (normY >= 0.26) {
        // Floor 1 hit (middle story)!
        entry.sectionDamage.floor1 = Math.min(1.0, entry.sectionDamage.floor1 + strength * 0.95);
        if (entry.sectionDamage.floor1 >= 0.28) {
          if (entry.groups.facade1) entry.groups.facade1.visible = false;
          if (entry.groups.floor1) entry.groups.floor1.visible = false;
        }
      } else {
        // Floor 0 hit (first floor / ground level)!
        entry.sectionDamage.floor0 = Math.min(1.0, entry.sectionDamage.floor0 + strength * 0.95);
        if (entry.sectionDamage.floor0 >= 0.28) {
          if (entry.groups.facade0) entry.groups.facade0.visible = false;
          if (entry.groups.floor0) entry.groups.floor0.visible = false;
          if (entry.groups.sign) entry.groups.sign.visible = false;
        }
      }

      // When exterior facades breach, open shell so interior floor slabs & furniture are clearly exposed!
      if (entry.groups.shell && (entry.sectionDamage.floor0 >= 0.28 || entry.sectionDamage.floor1 >= 0.28 || entry.sectionDamage.floor2 >= 0.28 || entry.sectionDamage.roof >= 0.28)) {
        entry.groups.shell.visible = false;
      }

      // Windows shatter in vicinity
      if (entry.glassMeshes) {
        for (const g of entry.glassMeshes) {
          if (Math.abs(relY - (normY * bHeight)) < 5.0 || Math.random() < 0.75) {
            g.visible = false;
          }
        }
      }

      entry.damage = (entry.sectionDamage.floor0 + entry.sectionDamage.floor1 + entry.sectionDamage.floor2 + entry.sectionDamage.roof) / 4.0;
      if (entry.damage >= 0.85) {
        entry.model.visible = false;
      }
    }

    if (entry.targetBuilding) {
      entry.targetBuilding.damage = Math.max(entry.targetBuilding.damage || 0, entry.damage);
      // Forward physical impact into structural-city so floor slabs and interior furniture physically detach!
      city.impact(entry.targetBuilding, origin, radius, strength);
    }
    return 1;
  }

  function applyDamage(entry, dmg) {
    entry.damage = Math.max(0, Math.min(1, dmg));
    if (!entry.model) return;

    if (entry.def.isChurch) {
      // Berean Church Damage Stages
      if (entry.groups.churchRoof) {
        entry.groups.churchRoof.visible = entry.damage < 0.85;
      }
      if (churchInterior) {
        churchInterior.visible = entry.damage >= 0.35 && entry.damage < 0.99;
      }
      if (entry.churchFeatures?.spiresGroup) {
        entry.churchFeatures.spiresGroup.visible = entry.damage < 0.80;
      }
      if (entry.churchFeatures?.roseRoot) {
        entry.churchFeatures.roseRoot.visible = entry.damage < 0.92;
      }
      if (entry.groups.churchWalls) {
        entry.groups.churchWalls.visible = entry.damage < 0.96;
      }
      if (entry.damage >= 0.99) {
        entry.model.visible = false;
        if (entry.churchFeatures?.group) entry.churchFeatures.group.visible = false;
        if (churchInterior) churchInterior.visible = false;
        if (churchRubbleProxy) churchRubbleProxy.visible = true;
      } else {
        entry.model.visible = true;
        if (entry.churchFeatures?.group) entry.churchFeatures.group.visible = true;
        if (churchRubbleProxy) churchRubbleProxy.visible = false;
      }
    } else {
      // Rowhouse / Storefront Damage Stages
      // Realistic procedural damage: mid-level facade blows out as big chunks,
      // exposing interior floor slabs while the roof and top level stay perched overhead!
      if (entry.glassMeshes) {
        for (const g of entry.glassMeshes) g.visible = entry.damage < 0.15;
      }
      if (entry.groups.sign) entry.groups.sign.visible = entry.damage < 0.25;
      if (entry.groups.cornice) entry.groups.cornice.visible = entry.damage < 0.40;
      // Mid-level facade breaches first, creating a huge cavity through the middle
      if (entry.groups.facade1) entry.groups.facade1.visible = entry.damage < 0.55;
      if (entry.groups.floor1) entry.groups.floor1.visible = entry.damage < 0.75;
      // Upper facade breaches next, but roof and floor2 stay intact
      if (entry.groups.facade2) entry.groups.facade2.visible = entry.damage < 0.82;
      if (entry.groups.facade0) entry.groups.facade0.visible = entry.damage < 0.88;
      // Roof and top level (floor2) remain standing overhead until catastrophic damage (90%+)!
      if (entry.groups.roof) entry.groups.roof.visible = entry.damage < 0.90;
      if (entry.groups.floor2) entry.groups.floor2.visible = entry.damage < 0.92;
      if (entry.groups.floor0) entry.groups.floor0.visible = entry.damage < 0.90;
      if (entry.groups.shell) entry.groups.shell.visible = entry.damage < 0.95;

      // Complete collapse
      if (entry.damage >= 0.95) {
        entry.model.visible = false;
        if (entry.rubbleProxy) entry.rubbleProxy.visible = true;
      } else {
        entry.model.visible = true;
        if (entry.rubbleProxy) entry.rubbleProxy.visible = false;
      }
    }

    if (entry.damage >= 0.90 && !entry.collapsedCascadeTriggered) {
      entry.collapsedCascadeTriggered = true;
      const wb = entry.worldBounds;
      const cx = wb ? (wb.minX + wb.maxX) * 0.5 : entry.def.position[0];
      const frontZ = wb ? wb.maxZ : entry.def.position[2];
      const width = wb ? (wb.maxX - wb.minX) : 14.0;
      const height = wb ? (wb.maxY - wb.minY) : 12.0;

      // Dust clouds billowing from base and frontage
      effectsHooks?.onDust?.(new THREE.Vector3(cx, 0.5, frontZ), 2.8);
      effectsHooks?.onDustWave?.(
        new THREE.Vector3(cx - width * 0.5, 0.4, frontZ),
        new THREE.Vector3(cx + width * 0.5, 0.4, frontZ),
        2.4
      );

      // Dynamic crumbling debris fragments falling from the facade toward the street
      const debrisCount = entry.def.isChurch ? 36 : 22;
      for (let i = 0; i < debrisCount; i++) {
        const px = cx + (Math.random() - 0.5) * width * 0.85;
        const py = 2.0 + Math.random() * (height - 3.0);
        const pz = frontZ + Math.random() * 0.6;
        const type = Math.random() < 0.28 ? 'glass' : (Math.random() < 0.35 ? 'roof' : 'brick');
        const flaming = Math.random() < 0.40;
        const origin = new THREE.Vector3(cx, py + 1.5, frontZ - 2.5);
        effectsHooks?.onDebris?.(new THREE.Vector3(px, py, pz), type, origin, flaming);
      }

      // Smoldering, flaming rubble heaps left on the street frontage
      const rubbleCount = entry.def.isChurch ? 14 : 7;
      for (let k = 0; k < rubbleCount; k++) {
        const rx = cx + (Math.random() - 0.5) * width * 0.8;
        const rz = frontZ + 0.8 + Math.random() * 3.6;
        const scale = 0.45 + Math.random() * 0.55;
        const isFlaming = Math.random() < 0.45;
        effectsHooks?.onRubble?.({ position: new THREE.Vector3(rx, 0.3, rz), scale, isFlaming });
      }
    }
  }

  function syncWithCityDamage() {
    for (const entry of entries) {
      if (!entry.loaded || !entry.targetBuilding) continue;
      const bDamage = entry.targetBuilding.damage || 0;
      if (bDamage > entry.damage + 0.08) {
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
      const res = this.damageBuilding(idOrAddress, 1.0);
      const entry = entries.find(e => e.def.id === idOrAddress || e.def.address.includes(idOrAddress) || e.def.name.includes(idOrAddress));
      if (entry) {
        if (entry.model) entry.model.visible = false;
        if (entry.rubbleProxy) entry.rubbleProxy.visible = true;
        if (entry.def.isChurch && churchRubbleProxy) churchRubbleProxy.visible = true;
      }
      return res;
    },
    setEffectsHooks(hooks) {
      effectsHooks = hooks;
    },
    impact(point, radius = 5.0, strength = 1.0) {
      const origin = (point?.isVector3 || typeof point?.clone === 'function') ? point : new THREE.Vector3(point?.x || 0, point?.y || 0, point?.z || 0);
      let hits = 0;
      for (const entry of entries) {
        if (!entry.loaded || !entry.model || !entry.worldBounds) continue;
        const wb = entry.worldBounds;
        const margin = radius * 1.5 + 4.0;
        if (origin.x >= wb.minX - margin && origin.x <= wb.maxX + margin &&
            origin.z >= wb.minZ - margin && origin.z <= wb.maxZ + margin) {
          applyLocalizedImpact(entry, origin, radius, strength);
          hits++;
        }
      }
      return hits;
    },
    setNight(darkness) {
      for (const mat of churchStainedGlassMaterials) {
        mat.emissiveIntensity = 0.60 + 0.85 * darkness;
      }
      for (const mat of signMaterials) {
        if (mat.emissiveIntensity !== undefined) {
          mat.emissiveIntensity = 0.40 + 0.60 * darkness;
        }
      }
    },
    restore() {
      for (const entry of entries) {
        entry.damage = 0;
        entry.collapsedCascadeTriggered = false;
        entry.sectionDamage = { floor0: 0, floor1: 0, floor2: 0, roof: 0, cornice: 0, sign: 0, roseWindow: 0, churchRoof: 0, churchWalls: 0 };
        if (entry.model) {
          entry.model.visible = true;
          for (const key of Object.keys(entry.groups)) {
            if (entry.groups[key]) entry.groups[key].visible = true;
          }
          for (const g of entry.glassMeshes) g.visible = true;
        }
        if (entry.churchFeatures?.group) entry.churchFeatures.group.visible = true;
        if (entry.churchFeatures?.roseRoot) entry.churchFeatures.roseRoot.visible = true;
        if (entry.churchFeatures?.spiresGroup) entry.churchFeatures.spiresGroup.visible = true;
        if (entry.rubbleProxy) entry.rubbleProxy.visible = false;
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
