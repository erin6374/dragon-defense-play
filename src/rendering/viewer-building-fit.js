import { VIEWER_TO_GAME_X, VIEWER_TO_GAME_Z } from '../simulation/viewer-parcels.js';
import * as THREE from 'three';
import { makeFrontages } from '../../broad-street/mapped-geometry.js';
import { renderBereanRose } from '../../broad-street/landmark-fidelity-21.mjs';

const sourceRows = fetch(new URL('../../broad-street/mapped-data.json', import.meta.url))
  .then(response => {
    if (!response.ok) throw new Error(`Viewer layout HTTP ${response.status}`);
    return response.json();
  })
  .then(data => new Map(data.rows.map(row => [String(row.id), row])));

export async function makeViewerBuilding(definition, target) {
  if (!target) throw new Error(`No RC174 parcel match for ${definition.id}`);
  const park = definition.id.startsWith('park-');
  const row = park ? { h: target.h } : (await sourceRows).get(definition.id);
  if (!row || row.school) throw new Error(`No Viewer-to-game parcel match for ${definition.id}`);

  const model = new THREE.Group();
  const source = new THREE.Group();
  model.add(source);
  // Keep the footprint centered in the gameplay slot and anchor its rear/front
  // edges to the same planes as RC174's destructible structure.
  if (park) {
    source.position.set(VIEWER_TO_GAME_X, 0, VIEWER_TO_GAME_Z);
  } else {
    source.scale.set(target.w / row.w, definition.isChurch ? 1 : target.h / row.h, target.d / row.d);
    source.position.set(target.x - row.x * source.scale.x, 0, target.front - row.front * source.scale.z);
  }

  const church = definition.isChurch;
  const sections = {};
  for (const name of church ? ['churchWalls', 'churchRoof', 'roseRoot'] :
    ['floor0', 'floor1', 'floor2', 'roof', 'shell', 'sign']) {
    sections[name] = new THREE.Group();
    sections[name].name = name;
    source.add(sections[name]);
  }
  function section(minY, maxY, name = '') {
    if (church) return minY >= 9.3 ? sections.churchRoof : sections.churchWalls;
    if (/sign|arches/i.test(name)) return sections.sign;
    if (minY >= row.h * .82) return sections.roof;
    if (maxY - minY >= row.h * .55) return sections.shell;
    const center = (minY + maxY) / (2 * row.h);
    return sections[center >= .52 ? 'floor2' : center >= .26 ? 'floor1' : 'floor0'];
  }

  const detail = new THREE.Group();
  makeFrontages(detail, park ? [] : [row], [], {
    hideTrees: true, auditOnly: true, buildingOnly: true, section,
    districtAddress: park ? definition.address : null
  });
  if (church) {
    const offset = 13.5 + 1.78;
    renderBereanRose(THREE, sections.roseRoot, {
      x: row.x + offset * Math.SQRT1_2, y: 9.9,
      z: row.front - 16.1 + offset * Math.SQRT1_2, angle: Math.PI / 4
    });
  }
  // Explicit meshes and finite bounds must exist before hiding the game fallback.
  detail.updateMatrixWorld(true);
  for (const object of [...detail.children]) {
    if (/^mcdonalds-(?:sign-|golden-arches)/i.test(object.name)) {
      // Preserve the complete sign assembly, fitted into RC174's drive-through apron.
      object.position.x -= 5 / source.scale.x;
      sections.sign.add(object);
      continue;
    }
    const bounds = new THREE.Box3().setFromObject(object);
    if (!bounds.isEmpty()) section(bounds.min.y, bounds.max.y, object.name).add(object);
  }
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model);
  if (bounds.isEmpty() || ![...bounds.min, ...bounds.max].every(Number.isFinite)) {
    throw new Error(`Viewer parcel ${definition.id} produced invalid bounds`);
  }
  const facade = definition.isChurch ? {
    group: model, roseRoot: sections.roseRoot, spiresGroup: sections.churchRoof
  } : null;
  return { model, bounds, sections, facade, architectureSource: 'Broad Street Viewer 21.1.33' };
}

