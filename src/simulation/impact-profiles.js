// Impact profiles distinguish small penetrators from destructive and incendiary rocks.
export const METEOR_TYPES={stone:{radius:1,strength:1,fire:.15},iron:{radius:.65,strength:1.6,fire:.08},molten:{radius:1.3,strength:1.35,fire:1},flaming:{radius:1.1,strength:1,fire:1.4}};
export function impactProfile(size=1,type='stone'){const t=METEOR_TYPES[type]||METEOR_TYPES.stone;return {radius:Math.max(.65,Math.min(7,size*2.4))*t.radius,strength:Math.max(.18,Math.min(2.3,size*.9))*t.strength,fire:t.fire,penetrates:type==='iron'||size<.8,shockRadius:Math.max(1.6,size*4.2)};}
export function shockDamage(distance,radius,easy=false){const c=Math.max(0,1-distance/Math.max(.01,radius));return (easy?.8:.18)+(easy?14:8)*c*c;}
export const CAR_COLORS=[0xf0f0e9,0xe4e6e5,0x17191d,0x22272b,0x646a70,0x92999f,0xb8bec1,0x354452,0x254d70,0x8c2835,0x476355,0xc0ae90,0x76594e,0xabb7ad];
