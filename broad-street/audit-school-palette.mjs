import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
import * as T from './vendor/three.module.js';

globalThis.window = {innerWidth:1280,innerHeight:720};
const loaderUrl = new URL('./vendor/FBXLoader.bundle.mjs',import.meta.url);
const threeUrl = new URL('./vendor/three.module.js',import.meta.url);
const facadeUrl = new URL('./school-original-fbx.mjs',import.meta.url);
registerHooks({resolve(name,context,next) {
  return name==='three' ? {url:threeUrl.href,shortCircuit:true} : next(name,context);
}});
const {FBXLoader} = await import(loaderUrl);
const {keepFBXExteriorOnly,ORIGINAL_FBX_SHA256} = await import(facadeUrl);
const add = (map,key) => map.set(key,(map.get(key)??0)+1);
const tally = map => Object.fromEntries([...map].sort(([a],[b])=>a.localeCompare(b)));

const bytes = readFileSync(process.argv[2]);
const hash = data => createHash('sha256').update(data).digest('hex');
const sourceSha256 = hash(bytes);
assert.equal(sourceSha256,ORIGINAL_FBX_SHA256);
const root = new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const materialsBefore = new Map();
root.traverse(mesh => { if (mesh.isMesh) materialsBefore.set(mesh,mesh.material); });
const scope = keepFBXExteriorOnly(root);
const palette = new Map();
const fallbackFamilies = new Map();
const seen = new Set();
let withUv = 0;
root.traverse(mesh => {
  if (!mesh.isMesh) return;
  const material = mesh.material;
  const fallback = material === materialsBefore.get(mesh);
  assert.ok(!Array.isArray(material));
  seen.add(mesh);
  if (mesh.geometry.hasAttribute('uv')) withUv++;
  const color = '#' + material.color.getHexString();
  const signature = [fallback?'FBXLoader fallback':'viewer palette',material.type,color,
    material.roughness??null,material.metalness??null,material.side,material.transparent];
  add(palette,JSON.stringify(signature));
  if (fallback) {
    const family = mesh.name.match(/^(?:Window-skylight-VELUX|Floor_Metal_Grate|Exterior_[^_]+|(?:Basic_Wall|Floor|Ceiling|Window|Door)[-_][^_]+|[^_]+)/i)?.[0] ?? '(unnamed)';
    add(fallbackFamilies,family);
  }
});
assert.equal(seen.size,scope.retainedMeshes);
assert.equal(materialsBefore.size,scope.retainedMeshes+scope.excludedMeshes);
const assignments = [...palette].map(([signature,meshCount]) => {
  const [assignment,type,color,roughness,metalness,side,transparent] = JSON.parse(signature);
  return {assignment,type,color,roughness,metalness,side:side===T.DoubleSide?'double':'front',transparent,meshCount};
}).sort((a,b)=>a.assignment.localeCompare(b.assignment)||b.meshCount-a.meshCount);
console.log(JSON.stringify({
  schema:1, sourceSha256, scope, retainedMeshesWithUv:withUv,
  inputs:{browserPaletteSha256:hash(readFileSync(facadeUrl)),fbxLoaderSha256:hash(readFileSync(loaderUrl)),
    threeSha256:hash(readFileSync(threeUrl))},
  assignments, fallbackFamilies:tally(fallbackFamilies),
},null,2));
