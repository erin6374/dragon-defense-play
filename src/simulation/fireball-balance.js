// Deterministic player fireball and shockwave meteor balance.
export const MAX_PLAYABLE_METEORS=48;
export function fireballMeteorDamage(m,playerFire=true,ordinaryShockDamage=0){
 if(m.indestructible)return 0;
 if(!playerFire)return ordinaryShockDamage;
 if(m.boss)return 5; // preserve the multi-hit finale
 return Math.max(1,Number.isFinite(m.hp)?m.hp:1);
}
export function meteorSplitPlan(m,activeCount=0){
 const room=Math.max(0,MAX_PLAYABLE_METEORS-activeCount);
 if(!room||m.indestructible||m.grounded||m.dragonHunter)return {count:0,size:0};
 if(m.boss)return {count:Math.min(6,room),size:1.52};
 if((m.generation||0)>=2||m.size<1.1)return {count:0,size:0};
 if(m.size>=1.8)return {count:Math.min(3,room),size:Math.min(1.62,1.36+Math.max(0,m.size-1.8)*.18)};
 return {count:Math.min(3,room),size:Math.min(.88,.66+Math.max(0,m.size-1.1)*.23)};
}
