// Source bounds guide local effects; they are not triangle intersections.
const CELL=6,MAX_BUCKETS=96;
export function sourceComponentMaterial(category,name=''){
 const tag=name.toLowerCase();
 if(category==='glazing')return /mullion|frame|solid|spandrel/.test(tag)?'metal':'glass';
 if(category==='structure'||category==='circulation'&&/rail|metal|steel/.test(tag)||category==='lighting')return 'metal';
 if(category==='furniture')return /metal|monitor|computer/.test(tag)?'metal':'wood';
 if(category==='walls')return /brick|masonry|cmu/.test(tag)?'brick':'stone';
 if(category==='doors')return /wood/.test(tag)?'wood':'metal';
 return 'stone';
}
export function createSchoolComponentIndex(records){
 const grid=new Map(),large=[],axes=['x','y','z'];
 const key=(x,y,z)=>x+':'+y+':'+z,cell=v=>Math.floor(v/CELL);
 const valid=records.filter(r=>axes.every(k=>Number.isFinite(r.min[k])&&Number.isFinite(r.max[k])&&r.max[k]>=r.min[k]));
 for(const r of valid){
  const lo=axes.map(k=>cell(r.min[k])),hi=axes.map(k=>cell(r.max[k]));
  if(hi.reduce((n,v,i)=>n*(v-lo[i]+1),1)>MAX_BUCKETS){large.push(r);continue;}
  for(let x=lo[0];x<=hi[0];x++)for(let y=lo[1];y<=hi[1];y++)for(let z=lo[2];z<=hi[2];z++){
   const k=key(x,y,z);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(r);
  }
 }
 function query(point,radius,max=4){
  if(!Number.isFinite(radius)||radius<=0||!axes.every(k=>Number.isFinite(point[k])))return [];
  const r=Math.min(6,radius),seen=new Set(large);
  for(let x=cell(point.x-r);x<=cell(point.x+r);x++)for(let y=cell(point.y-r);y<=cell(point.y+r);y++)for(let z=cell(point.z-r);z<=cell(point.z+r);z++)for(const item of grid.get(key(x,y,z))||[])seen.add(item);
  const candidates=[];
  for(const item of seen){
   const closest=Object.fromEntries(axes.map(k=>[k,Math.max(item.min[k],Math.min(item.max[k],point[k]))]));
   const distance=Math.hypot(point.x-closest.x,point.y-closest.y,point.z-closest.z);
   if(distance<=r)candidates.push({category:item.category,material:item.material,point:closest,distance});
  }
  candidates.sort((a,b)=>a.distance-b.distance);
  const materials=new Set();
  return candidates.filter(c=>{if(materials.has(c.material))return false;materials.add(c.material);return true;}).slice(0,Math.max(0,Math.min(6,max)));
 }
 return {query,stats:()=>({components:valid.length,cells:grid.size,largeComponents:large.length})};
}
