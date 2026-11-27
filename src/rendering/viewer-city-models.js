import * as THREE from 'three';
import { makeViewerBuilding } from './viewer-building-fit.js';
import { containsParcel,touchesParcel } from '../simulation/viewer-parcels.js';
import { createParcelDamageMask } from './parcel-damage-mask.js';

// Cull entire static parcel hierarchies only for a synchronous render pass.
 // Never change simulation visibility, damage, collision or other cameras.
 // Shadow casters and custom/swapped models stay on the standard render path.
export function createParcelRenderCuller(T,entries) {
 const frustum=new T.Frustum(),projection=new T.Matrix4(),hidden=[];
 const stats={eligible:0,culled:0,skippedObjects:0,enabled:false};
 function render(camera,draw,{enabled=true,shadows=false}={}){
  stats.eligible=stats.culled=stats.skippedObjects=0;
  stats.enabled=!!(enabled&&!shadows&&camera);
  if(!stats.enabled)return draw();
  camera.updateWorldMatrix(true,false);
  projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
  frustum.setFromProjectionMatrix(projection);
  try{
   for(const entry of entries){
    const model=entry.model,info=entry.renderCull;
    if(!model?.visible||!info||info.model!==model||!info.bounds)continue;
    stats.eligible++;
    if(frustum.intersectsBox(info.bounds))continue;
    hidden.push(model);model.visible=false;
    stats.culled++;stats.skippedObjects+=info.objects;
   }
   return draw();
  }finally{
   for(const model of hidden)model.visible=true;
   hidden.length=0;
  }
 }
 return {render,stats:()=>({...stats})};
}

export function createViewerCityModels(scene,city) {
  const root=new THREE.Group();
  root.name='Broad Street Viewer buildings';
  scene.add(root);
  const entries=city.buildings.filter(b=>b.viewerParcel).map(targetBuilding=>{
    const b=targetBuilding,{model,bounds}=makeViewerBuilding(b);
    const def={id:b.id,name:b.name,address:b.name,gameBuilding:b.name,frontWidth:b.w,
      position:[b.x,0,b.front],isChurch:b.id==='1005656'};
    root.add(model);
    let objects=0,staticOnly=true;
    model.traverse(node=>{objects++;if(node.isLight||node.isSkinnedMesh||node.morphTargetInfluences?.length||node.isLOD)staticOnly=false;});
    // A small safety margin absorbs floating-point and bounds-edge variation.
    const renderCull=staticOnly?{model,bounds:bounds.clone().expandByScalar(.5),objects}:null;
    return {def,targetBuilding,model,renderCull,loaded:true,damage:0,
      anchor:new THREE.Vector3(b.x,0,b.z),architectureSource:'Broad Street Viewer',
      worldBounds:{minX:bounds.min.x,maxX:bounds.max.x,minY:bounds.min.y,maxY:bounds.max.y,minZ:bounds.min.z,maxZ:bounds.max.z}};
  });
  const renderCuller=createParcelRenderCuller(THREE,entries);
  const byId=new Map(entries.map(e=>[e.def.id,e]));
  const findEntry=id=>byId.get(id)||entries.find(e=>e.def.address===id);
  function clearImpactMask(e,{preserveHistory=false}={}){e.impactMask?.dispose();e.impactMask=null;if(!preserveHistory)e.impactHistory=[];}
  function stampImpact(e,point,radius,strength){
    if(!e.impactMask)e.impactMask=createParcelDamageMask(THREE,e.model,e.worldBounds);
    if(e.impactMask.stamp(point,radius,strength)){
      (e.impactHistory??=[]).push({point:{x:point.x,y:point.y,z:point.z},radius,strength});
      city.exposeInterior?.(e.targetBuilding,point,radius);
    }
  }
  function rebindImpactMask(e){
    if(e.damage>=.97||!e.impactHistory?.length)return;
    e.impactMask=createParcelDamageMask(THREE,e.model,e.worldBounds);
    for(const strike of e.impactHistory)e.impactMask.stamp(strike.point,strike.radius,strike.strength);
  }
  function apply(entry,damage) {
    // Repair restores the original materials and removes only this parcel's mask.
    if(damage<entry.damage){
      clearImpactMask(entry);
      entry.collapseRequested=false;
    }
    entry.damage=damage;
    entry.model.visible=damage<.97;
    if(!entry.model.visible)clearImpactMask(entry);
  }
  function update() {
    for(const e of entries)if(e.damage!==e.targetBuilding.damage)apply(e,e.targetBuilding.damage);
  }
  function damageBuilding(id,amount){
    const e=findEntry(id);
    if(!e)return null;
    city.forceDamage(e.targetBuilding,amount);
    apply(e,e.targetBuilding.damage);
    return {id:e.def.id,damage:e.damage};
  }
  function impact(point,radius,strength){
    if(!point||![point.x,point.y,point.z].every(Number.isFinite))return 0;
    const e=entries.find(e=>e.targetBuilding.damage<.97&&containsParcel(e.targetBuilding,point.x,point.z));
    return e?impactBuilding(e.def.id,point,radius,strength):0;
  }
  function impactBuilding(id,point,radius=5,strength=1,ownsSweep=false){
    if(!point||![point.x,point.y,point.z,radius,strength].every(Number.isFinite)||radius<=0||strength<=0)return 0;
    const e=findEntry(id);
    // A penetrating meteor retains its original parcel owner. Never redirect
    // damage to an adjacent footprint, even if geometry overlaps.
    const containsContact=ownsSweep?touchesParcel:containsParcel;
    if(!e||e.targetBuilding.damage>=.97||!containsContact(e.targetBuilding,point.x,point.z))return 0;
    city.impact(e.targetBuilding,point,radius,strength);
    apply(e,e.targetBuilding.damage);
    if(e.damage<.97)stampImpact(e,point,radius,strength);
    return 1;
  }
  return {
    root,entries,findEntry,update,impact,impactBuilding,damageBuilding,clearImpactMask,rebindImpactMask,renderCuller,
    collapseBuilding(id){
      const e=findEntry(id);
      if(!e)return null;
      // A crunching meteor can request collapse every simulation tick. Only
      // run the expensive structural detach pass once until a repair/reset.
      if(e.collapseRequested&&e.targetBuilding.damage>=.97)
        return {id:e.def.id,damage:e.targetBuilding.damage};
      const result=damageBuilding(e.def.id,1);
      e.collapseRequested=true;
      return result;
    },
    restore(){for(const e of entries){clearImpactMask(e);apply(e,0);e.collapseRequested=false;}},
    getStats(){return {loadedCount:entries.length,totalModels:entries.length,
      models:entries.map(e=>({id:e.def.id, address:e.def.address, loaded:true,
        architectureSource:e.architectureSource, worldBounds:e.worldBounds, damage:e.damage, localizedStrikes:e.impactMask?.strikes()??0}))};}
  };
}
