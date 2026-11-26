import {assessments} from './assessment.js';
import {buildings,roads} from './district.js';
import {parkFacadePlan,renderParkFrontage,PARK_REVIEW_ADDRESSES} from './park-facades-20.mjs';
import {renderSouthDistrict} from './south-district-review25.mjs';
import {renderWattsTarget,renderWattsYards} from './watts-antigravity.mjs';
import {renderYorkDistrict} from './york-facades.mjs';
import {indexDistrict,renderSecondaryEdge} from './secondary-contact.mjs';
import {bostonProfile} from './boston-frontage.mjs';
import {hasDocumentedBrick} from './boston-masonry.mjs';
import {hasParkBrick} from './park-masonry.mjs';
import {renderSecondaryRoof} from './secondary-roofs-review43.mjs';
export function addDistrict({block,box,tree,mesh,T,audit=null,onlyAddress=null,onlyRecord=null}) {
  const districtIndex=indexDistrict(buildings);
  if(!onlyAddress&&onlyRecord===null){
  box(-165,-.56,-50,1110,.35,165,0xa6a394);
  box(185,-.15,0,370,.2,28,0x535759);
  for(let x=8;x<365;x+=9)box(x,-.025,0,4,.04,.16,0xe3c469);
  for(const [name,[[x,z],[u,v]]] of roads){
    box((x+u)/2,-.11,(z+v)/2,name==='WATTS'?6:10,.17,Math.hypot(u-x,v-z),0x535759,Math.atan2(u-x,v-z));
  }
  }
  const brick=[0x996e59,0xb39c88,0x9b8477,0xb7afa0];
  const parkMainFacadeDone=new Set();
  for(const [record,[polys,height,name]] of buildings.entries()){
    if((onlyAddress&&name!==onlyAddress)||(onlyRecord!==null&&record!==onlyRecord))continue;
    audit?.({type:"record",record,name,polys,height});
    if(renderYorkDistrict(polys,height,name,{block,box,mesh,T}))continue;
    if(renderSouthDistrict(polys,height,name,{block,box,mesh,T}))continue;
    for(const poly of polys){
      const ring=poly[0], twin=name==='2001-47 N BROAD ST';
      const shade=brick[Math.floor(Math.abs(ring[0][0]))%4];
      const boston=bostonProfile(poly,name);
      const secondaryEave=renderSecondaryRoof(poly,height,name,{block,box,mesh,T},shade);
      const h=secondaryEave??(twin?5.4:Math.max(2.3,height));
      if(secondaryEave===null){block(poly,h,shade,0,hasDocumentedBrick(name)?{wallFinish:"boston-brick"}:hasParkBrick(name,h)?{wallFinish:"park-brick"}:{});block(poly,.19,boston?.roof??0x797a76,h-.06,{aerialRoof:!boston});}
      const wattsHandled=renderWattsTarget(poly,h,name,{block,box,mesh,T,assessments});
      const parkHouse=/^2[234]\d{2} N PARK AVE$/.test(name) && !name.startsWith('2210 ');
      const rearZ=Math.max(...ring.map(point=>point[1]));
      const frontZ=Math.min(...ring.map(point=>point[1]));
      const rearEdges=ring.slice(1).map(([u,v],i)=>{
        const [x,z]=ring[i];
        return Math.min(z,v)>rearZ-1.9 && Math.abs(u-x)>2*Math.abs(v-z)?Math.abs(u-x):0;
      });
      const doorEdge=rearEdges.indexOf(Math.max(...rearEdges));
      for(let j=1;j<ring.length;j++){
        const [x,z]=ring[j-1],[u,v]=ring[j],dx=u-x,dz=v-z,len=Math.hypot(dx,dz);
        if(wattsHandled&&(Math.max(z,v)>frontZ+1.8||h<4.5))continue;
        if(len<(parkHouse&&rearEdges[j-1]>0?1.25:2.8))continue;
        if(parkHouse){
          // Park faces east. The exposed end of the rear wing faces west toward Watts.
          if(rearEdges[j-1]>0){
            const plan=renderSecondaryEdge(poly,h,j,{rear:true,doorEdge:j-1===doorEdge,stories:assessments[name]?.number_stories,index:districtIndex},box);
            audit?.({type:'secondary',record,name,poly,h,j,plan});
            continue;
          }
          if(Math.max(z,v)>frontZ+1.8)continue;
          if(PARK_REVIEW_ADDRESSES.includes(name))continue; // Review 20 controls this front instead.
        }
        const frontRow=boston?.edge===j;
        const plan=renderSecondaryEdge(poly,h,j,{index:districtIndex,...(frontRow?{frontRow:true,stories:boston.stories,doorBay:boston.doorBay}:{})},box);
        audit?.({type:'secondary',record,name,poly,h,j,plan});
      }
      // Render once per *address*, even if GIS contains two building pieces.
      // If two polygons represent one house, the longest road-facing edge is
      // selected from the full parcel geometry, not from a rear extension.
      if(parkHouse&&!parkMainFacadeDone.has(name)&&PARK_REVIEW_ADDRESSES.includes(name)){
        const plan=parkFacadePlan(polys,h,name,assessments[name]?.number_stories);
        if(plan){renderParkFrontage(plan,{box,mesh,T});parkMainFacadeDone.add(name);}
      }
      if(twin){
        for(const x of [40.7,89.0]){
          box(x,23,-71,19,36,44,0xae9980);box(x,41.2,-71,19.5,.5,44.5,0x787878);
          box(x,43,-71,9,3.6,27,0x9c9082);
          for(let y=8;y<41;y+=3.15){
            for(let z=-91;z<-50;z+=3.25)for(const side of [-1,1])box(x+side*9.52,y,z,.14,1.6,1.48,0x52626a);
            for(let u=-8;u<9;u+=3)box(x+u,y,-48.96,1.6,1.65,.15,0x52626a);
          }
        }
      }
    }
  }
  if(onlyAddress||onlyRecord!==null)return;
  audit?.({type:"public-realm"});
  renderWattsYards(buildings,{block,box,mesh,T});
  // The source aerial is the ground surface at y=.10. Construct the
  // identifiable curved Peabody-site walkway just above it, not a generic
  // rectangle covering the lawn. Existing landscape stays in the aerial.
  const path=[[157.0,-100.0],[154.9,-92.0],[149.5,-83.0],[143.2,-75.0],[139.0,-67.0],[138.7,-59.0],[141.4,-50.0],[146.2,-42.2],[152.5,-34.7],[158.6,-27.2],[159.7,-20.6]];
  for(let i=1;i<path.length;i++){
   const [x,z]=path[i-1],[u,v]=path[i],len=Math.hypot(u-x,v-z);
   box((x+u)/2,.145,(z+v)/2,3.0,.10,len+.25,0xc2beb0,Math.atan2(u-x,v-z));
  }
  for(const [x,z] of path)mesh(new T.CylinderGeometry(1.50,1.50,.10,18),0xc2beb0,x,.145,z);
  // Tree positions selected from the aerial canopy clusters rather than an
  // evenly spaced line. Approximate heights and canopy sizes.
  for(const [x,z,r] of [[26,-34,3.8],[47,-28,3.3],[64,-30,4.0],[79,-26,3.0],[102,-32,4.0],[112,-40,3.8],[121,-45,4.2],[130,-31,3.5],[145,-22,3.2],[154,-45,2.6]])tree(x,z,r);
}
