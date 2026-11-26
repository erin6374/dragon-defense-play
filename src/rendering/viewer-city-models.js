import * as THREE from 'three';
import { makeViewerBuilding } from './viewer-building-fit.js';
import { containsParcel } from '../simulation/viewer-parcels.js';

export function createViewerCityModels(scene,city) {
  const root=new THREE.Group();
  root.name='Broad Street Viewer buildings';
  scene.add(root);
  const entries=city.buildings.filter(b=>b.viewerParcel).map(targetBuilding=>{
    const b=targetBuilding,{model,sections,bounds}=makeViewerBuilding(b);
    const def={id:b.id,name:b.name,address:b.name,gameBuilding:b.name,frontWidth:b.w,
      position:[b.x,0,b.front],isChurch:b.id==='1005656'};
    root.add(model);
    return {def,targetBuilding,model,sections,loaded:true,damage:0,
      anchor:new THREE.Vector3(b.x,0,b.z),architectureSource:'Broad Street Viewer',
      worldBounds:{minX:bounds.min.x,maxX:bounds.max.x,minY:bounds.min.y,maxY:bounds.max.y,minZ:bounds.min.z,maxZ:bounds.max.z}};
  });
  const findEntry=id=>entries.find(e=>e.def.id===id||e.def.address===id);
  function apply(entry,damage) {
    // Structural repair/chapter reset must restore the authored facade, not
    // merely its parent group's visibility. Impact hides individual sections.
    if(damage<entry.damage){
      for(const section of entry.sections)section.visible=true;
      entry.collapseRequested=false;
    }
    entry.damage=damage;
    entry.model.visible=damage<.97;
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
    const e=entries.find(e=>e.targetBuilding.damage<.97&&containsParcel(e.targetBuilding,point.x,point.z));
    return e?impactBuilding(e.def.id,point,radius,strength):0;
  }
  function impactBuilding(id,point,radius,strength){
    const e=findEntry(id);
    // A penetrating meteor retains its original parcel owner. Never redirect
    // damage to an adjacent footprint, even if geometry overlaps.
    if(!e||e.targetBuilding.damage>=.97||!containsParcel(e.targetBuilding,point.x,point.z))return 0;
    city.impact(e.targetBuilding,point,radius,strength);
    const band=Math.min(3,Math.max(0,Math.floor(point.y/e.targetBuilding.h*3.5)));
    if(e.targetBuilding.damage>.12)e.sections[band].visible=false;
    apply(e,e.targetBuilding.damage);
    return 1;
  }
  return {
    root,entries,findEntry,update,impact,impactBuilding,damageBuilding,
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
    restore(){for(const e of entries){apply(e,0);e.collapseRequested=false;for(const section of e.sections)section.visible=true;}},
    getStats(){return {loadedCount:entries.length,totalModels:entries.length,
      models:entries.map(e=>({id:e.def.id, address:e.def.address, loaded:true,
        architectureSource:e.architectureSource, worldBounds:e.worldBounds, damage:e.damage}))};}
  };
}
