// Read the existing impact target. This hint never changes meteor motion.
export function selectMeteorWarning(meteors,school,buildings){
 let warning=null,priority=Infinity;
 for(const meteor of meteors){
  if(meteor.grounded||meteor.fragment||meteor.dragonHunter||meteor.vel.y>=-.1)continue;
  const target=meteor.target;
  const street=target.y<3&&target.z>13&&target.z<36;
  const within=building=>Math.abs(building.x-target.x)<building.w/2+1&&
   Math.abs(building.z-target.z)<building.d/2+1;
  const hitsSchool=!street&&within(school)&&!buildings.some(within);
  const label=meteor.boss?'BOSS':hitsSchool?'SCHOOL':street?'STREET':'BLOCK';
  const y=meteor.mesh.position.y;
  const height=y-(y>=target.y?Math.max(.7,target.y):.7);
  const eta=Math.max(0,height/-meteor.vel.y);
  if(!Number.isFinite(eta)||eta>7)continue;
  const rank=eta+(meteor.boss?-2:hitsSchool?-1:street?.6:0);
  if(rank>=priority)continue;
  priority=rank;
  warning={meteor,target,label,eta};
 }
 return warning;
}
