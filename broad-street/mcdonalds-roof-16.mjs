/** UNRELEASED Nov-2020 QA: light flat membrane and NEUTRAL parapet. Red sloped roofs were an obsolete historical assumption. Source GIS unchanged. */
export const MCD_ROOF_COLOR=0xd2d2c8;
export const MCD_FASCIA_COLOR=0xc7c8be;
export const MCD_ROOF_BUILDING='2109 N BROAD ST';
export function isMcDonalds(row){
 return (/^2109(?:[-–]\d+)?\s+N\s+BROAD\b/i.test(String(row?.address||''))) ||
  /mcdonald/i.test(String(row?.name||''));
}
export function redRoofPlan(row){
 if(!isMcDonalds(row)||!Array.isArray(row?.polys)||!Number.isFinite(row?.h))return null;
 const roofs=[],edges=[];
 for(const poly of row.polys){
  const ring=poly?.[0];if(!Array.isArray(ring)||ring.length<3)continue;
  roofs.push({poly,base:row.h+.035,thickness:.18,color:MCD_ROOF_COLOR,aerialRoof:false});
  // The inner edge of the parapet belongs INSIDE its city parcel. With
  // a box centered directly on the polygon boundary, half its thickness
  // previously extended into the sidewalk or neighboring parcel.
  const signed=ring.slice(1).reduce((sum,p,i)=>{
   const a=ring[i];return sum+a[0]*p[1]-p[0]*a[1];
  },0);
  const inwardSign=signed>=0?1:-1;
  for(let i=1;i<ring.length;i++){
   const [x,z]=ring[i-1],[xx,zz]=ring[i],dx=xx-x,dz=zz-z,len=Math.hypot(dx,dz);
   if(len<.03)continue;
   // Keep exposed main-side parapets pale gray. Notched rear edges
   // have a neutral aluminum-colored cap in the Google Earth roof context.
   const exposed=len>=Math.max(9,row.w*.60);
   const thickness=.25,offset=thickness*.5,inwardX=inwardSign*(-dz/len),inwardZ=inwardSign*(dx/len);
   edges.push({x:(x+xx)/2+inwardX*offset,y:row.h+.10,z:(z+zz)/2+inwardZ*offset,w:len,h:.28,d:thickness,
    color:exposed?MCD_FASCIA_COLOR:0xaeb0a9,angle:-Math.atan2(dz,dx),exposed});
  }
 }
 return {roofs,edges,color:MCD_ROOF_COLOR,fascia:MCD_FASCIA_COLOR};
}
