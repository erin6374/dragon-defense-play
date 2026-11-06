export function chooseMeteorTarget(buildings,schoolFront,random=Math.random){
 const targets=buildings.filter(b=>b.damage<.98),r=random();
 if(r>.965)return {x:(random()-.5)*70,y:.6,z:17+Math.floor(random()*4)*4};
 if(r<.12||!targets.length)return {x:(random()-.5)*19,y:3+random()*15,z:schoolFront-.5};
 // The storm spreads across standing structures, instead of wasting repeated hits on rubble.
 const front=targets.filter(b=>!b.background),back=targets.filter(b=>b.background);
 const candidates=(r<.65&&front.length?front:back.length?back:front);
 const b=candidates[Math.floor(random()*candidates.length)];
 // Once a facade is open, falling rocks reach exposed surviving roof/floor bays.
 const exposed=b.structuralParts?.filter(p=>p.state==='attached'&&['roof','slab','column'].includes(p.type));
 if(b.damage>.15&&exposed?.length&&random()<.7){const p=exposed[Math.floor(random()*exposed.length)];return {x:p.position.x,y:p.position.y,z:p.position.z};}
 const roofHit=!b.background&&random()<.22;
 return roofHit?{x:b.x+(random()-.5)*b.w*.48,y:b.h+.13,z:b.z+(random()-.5)*b.d*.45}:{x:b.x+(random()-.5)*b.w*.75,y:1+random()*Math.min(13,b.h-1),z:b.front};
}
