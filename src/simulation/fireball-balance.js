// Deterministic player fireball and shockwave meteor balance.
export const MAX_PLAYABLE_METEORS=24;
const OPENING_WAVES=[
 {count:6,size:8,kind:'stone'},
 {count:10,size:8,kind:'stone'},
 {count:18,size:11,kind:'flaming'},
 {count:16,size:11,kind:'flaming'}
];
export function openingMeteorWave(wave){return OPENING_WAVES[wave-1]??null;}

export function fireballMeteorDamage(m,playerFire=true,ordinaryShockDamage=0){
 if(m.indestructible)return 0;
 if(!playerFire)return ordinaryShockDamage;
 if(m.boss)return 5; // preserve the multi-hit finale
 return Math.max(1,Number.isFinite(m.hp)?m.hp:1);
}
export function meteorSplitPlan(m,activeCount=0){
 const room=Math.max(0,MAX_PLAYABLE_METEORS-activeCount);
 if(room<=0||m.indestructible||m.grounded||m.dragonHunter)return {count:0,size:0};
 if(m.boss)return {count:Math.min(4,room),size:1.52};
 if(m.opening){
  const generation=m.generation||0;
  const childSizes=m.kind==='stone'?[2.5,1.45,.65]:[3.2,1.65,.8];
  const size=childSizes[generation]??0;
  return {count:size?Math.min(generation===0?2:2,room):0,size};
 }
 if((m.generation||0)>=2||m.size<1.25)return {count:0,size:0};
 if(m.size>=3.2)return {count:Math.min(2,room),size:Math.min(2.1,m.size*0.50)};
 if(m.size>=1.8)return {count:Math.min(2,room),size:Math.min(1.35,m.size*0.52)};
 return {count:Math.min(1,room),size:Math.min(.85,.62+Math.max(0,m.size-1.25)*.20)};
}
