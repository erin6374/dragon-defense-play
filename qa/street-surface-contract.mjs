import assert from 'node:assert/strict';
import * as THREE from '../vendor/three/build/three.module.js';
import {applyStreetSurfaceMaterials} from '../src/rendering/street-surface-materials.js';
const root=new THREE.Group(),cube=new THREE.BoxGeometry();
const bank={asphalt:new THREE.MeshStandardMaterial(),asphaltCross:new THREE.MeshStandardMaterial(),sidewalk:new THREE.MeshStandardMaterial()};
function box(w,h,d,color,y=-.45){const mesh=new THREE.Mesh(cube,new THREE.MeshStandardMaterial({color}));mesh.scale.set(w,h,d);mesh.position.y=y;root.add(mesh);return mesh;}
const broad=box(200,.13,24,0x34373b),cross=box(12,.16,133,0x34373b),walk=box(170,.16,4,0xa9a8a0);
const facade=box(20,.15,10,0xa9a8a0,8),stripe=box(100,.015,.13,0xe3e0d5,-.352),ground=box(230,.32,140,0xa9a8a0,-.65);
const untouched=[facade,stripe,ground].map(o=>o.material);
assert.equal(cube.isBoxGeometry,undefined,'fixture reproduces actual Three geometry flag absence');
assert.deepEqual(applyStreetSurfaceMaterials(root,bank),{asphalt:1,crossStreet:1,sidewalk:1});
assert.equal(broad.material,bank.asphalt);assert.equal(cross.material,bank.asphaltCross);assert.equal(walk.material,bank.sidewalk);
[facade,stripe,ground].forEach((o,i)=>assert.equal(o.material,untouched[i]));
assert.equal(root.children.length,6,'no geometry added');
console.log('Street PBR assignment/cross-street/geometry exclusions PASS');

for(const material of Object.values(bank)){
 const shader={vertexShader:THREE.ShaderLib.standard.vertexShader};
 material.onBeforeCompile(shader);
 assert.ok(shader.vertexShader.includes('streetWorld = instanceMatrix * streetWorld'));
 assert.ok(shader.vertexShader.includes('streetWorld = modelMatrix * streetWorld'));
 for(const name of ['vMapUv','vNormalMapUv','vRoughnessMapUv'])assert.ok(shader.vertexShader.includes(name+' = streetUv;'));
}
assert.equal(bank.asphalt.customProgramCacheKey(),bank.asphaltCross.customProgramCacheKey());
const version=bank.asphalt.version;applyStreetSurfaceMaterials(root,bank);
assert.equal(bank.asphalt.version,version,'repeated assignment does not recompile materials');
console.log('Street world mapping shader injection/channel alignment PASS (GPU compile pending)');
