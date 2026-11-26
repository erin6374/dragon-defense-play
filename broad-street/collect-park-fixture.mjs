import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as T from './vendor/three.module.js';
import { addDistrict } from './district-geometry.js';
import { createBrickWallMaterial } from './boston-masonry.mjs';

const output = resolve(process.argv[2]);
const address = '2228 N PARK AVE';
const sourceCommit = '1145173923c9b54abcefa1391de8f21c8d99812e';
const sourceBlobs = {
  "district-geometry.js": "bb404015b24021eaad4461a4da7a3a0e71ca73bc",
  "boston-masonry.mjs": "fd21057f527d9521c8e6ef948bc5bc21e006ec7f",
  "assessment.js": "d8d466c1a668d4a80b0b2b0fbd6b485c855e617a",
  "park-facades-20.mjs": "7103b80a1f10d60de8dd6089bba0064b06609192",
  "park-masonry.mjs": "551677f4bec6f98701b05f83a46fd34392568d01",
  "secondary-roofs-review43.mjs": "1d2f694f4f5c1a86f7ad5c158c6fd889e9e131e2",
  "york-facades.mjs": "60ca4b4cbba730069216853dfe9a20e8d2d887ac",
  "south-district-review25.mjs": "8b7b64659c507c5cfa28ae80bacc2a568b87d02e",
  "secondary-contact.mjs": "f57127e7fd062012e26af8754e4ccce0bd6a7455",
  "boston-frontage.mjs": "7ec306cd34b4419f7ca102afc7f3c364371c5f49",
  "district.js": "77d87f28405673e0405d1418ce55e822c7844df5",
  "watts-antigravity.mjs": "cb4cf290a98f46c8e1eb73d2e891f387a544c9ff",
  "residence-roof.mjs": "ef2cd4250034ceaf026005e1c73b866ecf97dba5",
  "vendor/three.module.js": "0bcc7a286da2c115853ceec9deea19923e10ddc1"
};
for (const [name, expected] of Object.entries(sourceBlobs)) {
  // The Windows checkout may expand tracked LF endings to CRLF.
  const bytes = Buffer.from(readFileSync(new URL(name,import.meta.url),'utf8').replaceAll('\r\n','\n'));
  const actual = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  assert.equal(actual,expected,`Source changed: ${name}. Use the pinned viewer source.`);
}
const parts = [];
const textureColors = new Set();
const roles = new Map([
  [0xa68f7f, 'cornice'], [0xc9bba5, 'stone-trim'], [0x536870, 'glazing-relief'],
  [0x6b6661, 'window-frame'], [0x384b51, 'door-leaf'], [0xdcc88e, 'door-hardware'],
]);
const cube = new T.BoxGeometry();
const ids = new Map();
let active = false;
let origin;
let record;

function capture(geometry, role, color, x=0, y=0, z=0, angle=0, width=1, height=1, depth=1, brick=false) {
  const id = (ids.get(role) ?? 0) + 1;
  ids.set(role, id);
  const index = geometry.index;
  const pos = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  const vertices = [];
  const offset = new T.Vector3(x-origin[0], y, z-origin[2]);
  const basis = new T.Vector3(0, 1, 0);
  const dimensions = new T.Vector3(width, height, depth);
  for (let i=0; i<pos.count; i++) {
    vertices.push(new T.Vector3().fromBufferAttribute(pos,i).multiply(dimensions).applyAxisAngle(basis,angle).add(offset).toArray());
  }
  const faces = [];
  const palette = [role];
  if (brick) {
    palette.push('brick-wall');
    textureColors.add(color);
  }
  for (let i=0; i<(index?.count ?? pos.count); i+=3) {
    const corners = Array.from({length:3}, (_, k) => index?.getX(i+k) ?? i+k);
    const side = brick && geometry.groups.some(g => g.materialIndex===1 && g.start<=i && i<g.start+g.count);
    faces.push({ corners, material: Number(side), uv: corners.map(j => uv
      ? [uv.getX(j)/(side?1.72:1),uv.getY(j)/(side?.6:1)] : [0,0]) });
  }
  parts.push({ id: `park-2228_${role}_${String(id).padStart(2,'0')}`, role, palette, color, vertices, faces });
}

addDistrict({
  T,
  audit(event) {
    if (event.type==='public-realm') active = false;
    if (event.type!=='record') return;
    active = event.name===address && event.height>=4.5;
    if (!active) return;
    assert.equal(record, undefined, 'Fixture expects one main district record');
    record = event.record;
    const points = event.polys.flatMap(poly => poly[0]);
    const xs = points.map(p => p[0]);
    origin = [(Math.min(...xs)+Math.max(...xs))/2,0,Math.min(...points.map(p=>p[1]))];
  },
  box(x,y,z,w,h,d,color,angle=0) {
    if (!active) return;
    capture(cube,roles.get(color)??'secondary-detail',color,x,y,z,angle,w,h,d);
  },
  mesh(geo,color) {
    if (active) capture(geo,'secondary-mesh',color);
    return new T.Mesh(geo);
  },
  block(poly,h,color,base=0,{wallFinish,aerialRoof}={}) {
    if (!active) return;
    const ringPath = (ring, Path) => {
      const path = new Path();
      ring.forEach(([x,z],i) => i ? path.lineTo(x,-z) : path.moveTo(x,-z));
      path.closePath();
      return path;
    };
    const shape = ringPath(poly[0],T.Shape);
    shape.holes = poly.slice(1).map(ring=>ringPath(ring,T.Path));
    const geo = new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false});
    geo.rotateX(-Math.PI/2);
    capture(geo,aerialRoof ? 'roof' : 'wall',color,0,base,0,0,1,1,1,wallFinish==='park-brick');
  },
  tree() {},
});

assert.ok(origin);
assert.equal(textureColors.size,1);
assert.equal(ids.get('door-leaf'),1);
assert.ok(ids.get('glazing-relief')>0);
const brick = createBrickWallMaterial(T,[...textureColors][0]).map.image;
mkdirSync(output,{recursive:true});
writeFileSync(resolve(output,'brick-rgba.bin'),brick.data);
writeFileSync(resolve(output,'park-2228-meshes.json'),JSON.stringify({
  address, sourceCommit, sourceBlobs, record, origin, unit:'meter', streetDirection:[0,0,-1],
  brick:{width:brick.width,height:brick.height}, parts,
}));
console.log(JSON.stringify({address,record,origin,parts:parts.length,roles:Object.fromEntries(ids)},null,2));
