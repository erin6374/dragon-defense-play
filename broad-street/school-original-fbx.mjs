/** Original Tech Freire Revit FBX — only school in the mapped viewer.
 * The source is Z-up, feet. Preserve its original bytes and uniform scale.
 * The street model uses Y-up, meters. Only Revit BASIC_WALL extents are used
 * for aligning the source; loose furniture and Revit camera objects are ignored.
 */
import * as T from 'three';
import {FBXLoader} from './vendor/FBXLoader.bundle.mjs';

export const SCHOOL_GIS_ID='1003073';
export const ORIGINAL_FBX_RELATIVE_PATH='../assets/tech-freire-original.fbx';
export const ORIGINAL_FBX_SHA256='8fe8c980ea7b73795db4c5b947853615d861c2b0c50db37e8a5541560b1d77e4';
export const FEET_TO_METERS=0.3048;
export const REVIT_EXTERIOR_BOUNDS_FT=Object.freeze({
 xMin:-26.858800888061523,xMax:43.807865142822266,
 frontY:-46.78562545776367,rearY:105.99925231933594,
 basementZ:-14.864583015441895,roofZ:89.28821563720703
});
export const STREET_VISIBLE_MESH=/^(?:Basic_Wall|Rectangular_Mullion|System_Panel|Concrete[-_]|Column[_ ]|Floor[_ ]|Basic_Roof|Roof[_ ]|Ceiling[_ ]|Curtain[_ ]|Exterior[_ ]|Window[_ ]|Window-skylight-VELUX_|Fixed[_ ]|Door[_ ]|Door[-_ ]|Single[-_]Flush|Railing[_ ]|Top_Rail|Handrail[_ ]|Assembled_Stair|Stair[_ ]|M_Stair|Skylight|Generic[_ ]Model|Storefront[_ ]|CW[_ ])/i;

export function calculateRevitPlacement(schoolRow){
 if(!schoolRow||String(schoolRow.id)!==SCHOOL_GIS_ID||!schoolRow.school)
  throw Error('School FBX needs the actual 2221–25 N Broad municipal GIS record');
 const b=REVIT_EXTERIOR_BOUNDS_FT;
 const width=(b.xMax-b.xMin)*FEET_TO_METERS;
 const depth=(b.rearY-b.frontY)*FEET_TO_METERS;
 const roof=b.roofZ*FEET_TO_METERS;
 const differenceMeters={width:width-schoolRow.w,depth:depth-schoolRow.d,roof:roof-schoolRow.h};
 if(Object.values(differenceMeters).some(v=>Math.abs(v)>1.1))throw Error('School FBX dimension/footprint mismatch: '+JSON.stringify(differenceMeters));
 return {
  x:schoolRow.x-((b.xMin+b.xMax)/2)*FEET_TO_METERS,
  y:0,z:schoolRow.front+b.frontY*FEET_TO_METERS,
  rotationX:-Math.PI/2,scale:FEET_TO_METERS,
  wallFootprintMeters:{width,depth,roof},
  gisFootprintMeters:{width:schoolRow.w,depth:schoolRow.d,roof:schoolRow.h},
  differenceMeters,
 };
}

export function keepFBXExteriorOnly(original){
 const discard=[];let retainedMeshes=0,excludedMeshes=0;
 // Reversible street display materials, not changes to the original FBX.
 const mats={
  brick:new T.MeshStandardMaterial({color:0x957965,roughness:.91}),
  concrete:new T.MeshStandardMaterial({color:0xb5b2a7,roughness:.86}),
  panel:new T.MeshStandardMaterial({color:0x85928f,metalness:.12,roughness:.65}),
  glazing:new T.MeshStandardMaterial({color:0x405a63,metalness:.16,roughness:.22,side:T.DoubleSide}),
  mullion:new T.MeshStandardMaterial({color:0x6a7b7e,metalness:.48,roughness:.52}),
  roofing:new T.MeshStandardMaterial({color:0x686e70,roughness:.9}),
  frame:new T.MeshStandardMaterial({color:0x53666d,metalness:.25,roughness:.58}),
 };
 original.traverse(object=>{
  if(object.isCamera||object.isLight)discard.push(object);
  else if(object.isMesh){
   if(!STREET_VISIBLE_MESH.test(object.name)){excludedMeshes++;discard.push(object);return;}
   retainedMeshes++;object.castShadow=false;object.receiveShadow=false;
   const n=object.name;
   if(/^System_Panel_Glazed/i.test(n)||/^Window_/i.test(n))object.material=mats.glazing;
   else if(/^Rectangular_Mullion/i.test(n))object.material=mats.mullion;
   else if(/^System_Panel/i.test(n))object.material=mats.panel;
   else if(/^Basic_Wall/i.test(n))object.material=/Brick|CMU|Party_Wall|Exterior/i.test(n)?mats.brick:mats.concrete;
   else if(/^Basic_Roof|^Roof_|^Floor_5/i.test(n))object.material=mats.roofing;
   else if(/^Door_|^Door-|^Single-Flush|^Fixed_/i.test(n))object.material=mats.frame;
  }
 });
 for(const item of discard)item.parent?.remove(item);
 if(retainedMeshes<100)throw Error('School FBX street geometry returned too few Revit meshes');
 return {retainedMeshes,excludedMeshes,materials:'reversible Revit-category street palette'};
}
let pendingMount=null;
export async function mountOriginalSchoolFBX(scene,schoolRow,{onStatus=()=>{},exteriorOnly=true,onReady=()=>{}}={}){
 if(pendingMount)return pendingMount; // single school instance per scene
 const placement=calculateRevitPlacement(schoolRow);
 pendingMount=(async()=>{
  onStatus('Loading the original Tech Freire Revit FBX (36.2 MB)…');
  const url=new URL(ORIGINAL_FBX_RELATIVE_PATH,import.meta.url).href;
  const school=await new FBXLoader().loadAsync(url);
  school.name='tech-freire-original-FBX-2221-broad';
  const stats=exteriorOnly?keepFBXExteriorOnly(school):{retainedMeshes:'full-source',excludedMeshes:0};
  school.rotation.x=placement.rotationX;school.scale.setScalar(placement.scale);school.position.set(placement.x,placement.y,placement.z);
  school.updateMatrixWorld(true);
  scene.add(school);
  onStatus('Original Tech Freire FBX loaded — no duplicate school proxy');
  const result={school,placement,stats,source:url};onReady(result);return result;
 })();
 try{return await pendingMount;}catch(e){pendingMount=null;throw e;}
}
