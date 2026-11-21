// Rate-limited, normalized target direction for visual-only searchlight beams.
// Capped frame delta prevents huge aim jumps after browser tab suspension.
export function slewSearchlightDirection(previous,target,dt,rate=1.6){
 const normal=v=>{
  if(!v||![v.x,v.y,v.z].every(Number.isFinite))return null;
  const length=Math.hypot(v.x,v.y,v.z);
  return length>1e-8?{x:v.x/length,y:v.y/length,z:v.z/length}:null;
 };
 const from=normal(previous)||{x:0,y:1,z:0},to=normal(target);
 if(!to)return from;
 const t=1-Math.exp(-Math.max(0,Math.min(.08,Number.isFinite(dt)?dt:0))*Math.max(.1,Math.min(9,rate)));
 return normal({x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t,z:from.z+(to.z-from.z)*t})||to;
}
