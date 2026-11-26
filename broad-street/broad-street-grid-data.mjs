export const BROAD_EXTENTS=[-716,386];
// Sampled from curb edges in the three actual aerial tiles.
export const CURB_SAMPLES=[[-716,-16.5,5.5],[-525,-16.4,5.6],[-357,-16.1,5.8],[-178,-16.1,5.8],[0,-15.9,6.2],[166,-16.0,6.2],[338,-15.8,6.1],[386,-15.8,6.1]];
// Centerlines from saved municipal road records. Half opening widths are
// approximate readings of the aerial intersection mouths.
export const JUNCTIONS=[
 {name:'Cumberland',x:-692.98,half:6.0},
 {name:'York',x:-525.92,half:5.6},
 {name:'Dauphin',x:-357.69,half:6.2},
 {name:'Susquehanna',x:-178.32,half:7.0},
 {name:'Diamond',x:0,half:7.8},
 {name:'Norris',x:166.26,half:6.4},
 {name:'Polett / Berks',x:338.2,half:5.8}
];
export function curbAt(x){
 let i=CURB_SAMPLES.findIndex(v=>v[0]>=x);
 if(i<=0)return (i===0?CURB_SAMPLES[0]:CURB_SAMPLES.at(-1)).slice(1);
 const a=CURB_SAMPLES[i-1],b=CURB_SAMPLES[i],t=(x-a[0])/(b[0]-a[0]);
 return [a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
}
