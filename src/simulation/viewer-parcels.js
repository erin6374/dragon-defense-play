import { buildings } from '../../broad-street/district.js';

export const VIEWER_TO_GAME_X = 255.88;
export const VIEWER_TO_GAME_Z = 22.06;

export async function loadViewerGrid() {
  const response = await fetch(new URL('../../broad-street/mapped-data.json', import.meta.url));
  if (!response.ok) throw new Error(`Viewer layout HTTP ${response.status}`);
  return response.json();
}

export function viewerParcels(rows) {
  const parcels = rows.filter(row => !row.school && row.polys?.length).map(row => ({
    id: String(row.id), name: row.address, sourceRow: row, h: row.h, polys: row.polys
  }));
  for (const [index, [polys, h, name]] of buildings.entries()) {
    parcels.push({ id: `district-${index}`, name, record: index, h, polys, background: true });
  }
  return parcels.map(parcel => {
    const polys = parcel.polys.map(poly => poly.map(ring => ring.map(([x,z]) =>
      [x + VIEWER_TO_GAME_X, z + VIEWER_TO_GAME_Z])));
    const points = polys.flat(2);
    const xs = points.map(point => point[0]), zs = points.map(point => point[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minZ = Math.min(...zs), maxZ = Math.max(...zs);
    return { ...parcel, polys, x: (minX+maxX)/2, z: (minZ+maxZ)/2,
      w: maxX-minX, d: maxZ-minZ, h: Math.max(2.3,parcel.h),
      stories: Math.max(1,Math.min(8,Math.round(parcel.h/3))), viewerParcel: true };
  });
}

function insideRing(x,z,ring) {
  let inside = false;
  for (let i=0,j=ring.length-1;i<ring.length;j=i++) {
    const [ax,az]=ring[i], [bx,bz]=ring[j];
    if ((az>z)!==(bz>z) && x<(bx-ax)*(z-az)/(bz-az)+ax) inside=!inside;
  }
  return inside;
}

export function containsParcel(building,x,z) {
  if (Math.abs(x-building.x)>building.w/2 || Math.abs(z-building.z)>building.d/2) return false;
  return !building.polys || building.polys.some(([outer,...holes]) =>
    insideRing(x,z,outer) && !holes.some(ring=>insideRing(x,z,ring)));
}

// Swept side contacts can land exactly on an edge that the interior ray
// predicate excludes. Accept that contact only for the assigned parcel.
export function touchesParcel(building,x,z,tolerance=.025){
  if(containsParcel(building,x,z))return true;
  if(!building.polys||Math.abs(x-building.x)>building.w/2+tolerance||
    Math.abs(z-building.z)>building.d/2+tolerance)return false;
  for(const poly of building.polys)for(const ring of poly)for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const [ax,az]=ring[j],[bx,bz]=ring[i];
    const dx=bx-ax,dz=bz-az,length=dx*dx+dz*dz;
    const t=length?Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/length)):0;
    if((x-ax-t*dx)**2+(z-az-t*dz)**2<=tolerance*tolerance)return true;
  }
  return false;
}

// The visually emphasized school overlaps parts of its real neighboring
// parcels. Ownership stays with those mapped parcels even after collapse.
export function ownsSchoolFootprint(bounds,buildings,x,z){
 if(!Number.isFinite(x)||!Number.isFinite(z)||x<bounds.min.x||x>bounds.max.x||z<bounds.min.z||z>bounds.max.z)return false;
 return !buildings.some(b=>!b.school&&containsParcel(b,x,z));
}

// Keep the school taller than its surveyed roof for readability, but do
// not enlarge its footprint into the two adjacent mapped rowhouses.
export function schoolGameEnvelope(rows){
 const row=rows.find(r=>r.school);
 if(!row||!row.polys?.length)throw Error('Mapped school footprint missing');
 const extent=r=>{
  const points=r.polys.flat(2);
  return {minX:Math.min(...points.map(p=>p[0]))+VIEWER_TO_GAME_X,maxX:Math.max(...points.map(p=>p[0]))+VIEWER_TO_GAME_X,
   minZ:Math.min(...points.map(p=>p[1]))+VIEWER_TO_GAME_Z,maxZ:Math.max(...points.map(p=>p[1]))+VIEWER_TO_GAME_Z};
 };
 const box=extent(row);
 const north=rows.find(r=>String(r.id)==='1007132'),south=rows.find(r=>String(r.id)==='1007133');
 const minX=Math.max(box.minX,north?extent(north).maxX+.08:box.minX);
 const maxX=Math.min(box.maxX,south?extent(south).minX-.08:box.maxX);
 const minZ=box.minZ,maxZ=box.maxZ+.25;
 const h=Math.max(28,row.h);
 if(![minX,maxX,minZ,maxZ,h].every(Number.isFinite)||maxX<=minX||maxZ<=minZ)throw Error('Invalid mapped school envelope');
 return {x:(minX+maxX)/2,z:(minZ+maxZ)/2,w:maxX-minX,d:maxZ-minZ,h,minX,maxX,minZ,maxZ,sourceId:String(row.id)};
}
