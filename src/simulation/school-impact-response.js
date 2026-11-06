// Deterministic, meteor-specific local energy model. No scripted floor order.
// Exposes small pure functions to unit-test without a renderer.
export function meteorImpactEnergy({type='stone',radius=3.8,strength=1,speed=0}={}){
 const tuning={
  stone:{penetration:0.85,shock:1,fracture:1,heat:0},
  iron:{penetration:2.5,shock:.76,fracture:.85,heat:0},
  molten:{penetration:1.10,shock:1.2,fracture:1.12,heat:1.4},
  flaming:{penetration:.88,shock:1.04,fracture:1.03,heat:1}
 }[type]||{penetration:1,shock:1,fracture:1,heat:0};
 const velocityFactor=1+Math.min(.65,Math.max(0,speed)*.017);
 return {type,radius:Math.max(.5,radius),energy:Math.max(.15,strength)*velocityFactor,
  penetration:tuning.penetration,shock:tuning.shock,fracture:tuning.fracture,heat:tuning.heat};
}
export function componentImpact({distance,radius,energy,penetration,shock,fracture,zone,
 structuralStrength=1,frontDepth=0,lateralDistance=distance}){
 const glass=zone==='glass',slab=zone==='floor',column=zone==='pier'||zone==='atrium-column';
 const localRadius=radius*(glass?1.22:slab?.82:1);
 const horizontal=Math.max(0,1-lateralDistance/Math.max(.1,localRadius));
 const radial=Math.max(0,1-distance/Math.max(.1,localRadius));
 const deep=Math.max(0,1-frontDepth/Math.max(1,radius*penetration));
 // Iron pierces deeper instead of destroying an entire wall all at once.
 const vulnerability=glass?2.4:column?.57:zone==='beam'?.65:1;
 return Math.max(0,horizontal*(radial*shock*.70+deep*.30*penetration)*energy*fracture*
   vulnerability/Math.max(.2,structuralStrength));
}
export function structuralSupportFraction({supports,failed,load=1}={}){
 const all=Math.max(1,supports||0);
 return Math.max(0,Math.min(1,(all-(failed||0)*Math.max(0,load))/all));
}
