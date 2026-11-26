/** 1940 Residence Hall roof study, saved city-aerial-2.jpg, 5px/m.
 * Pale bands and equipment envelopes interpreted from aerial, not surveyed.
 * Roof footprint, elevation, facade and original equipment are preserved.
 */
export const RESIDENCE_ROOF_COLOR=0x50524d;
export const RESIDENCE_BANDS=[
 ['north',193,-97.65,32,1.15],['east',208.9,-66.25,1.3,63.3],
 ['south',193.3,-38.85,31.8,1.25],['west',177.8,-32.5,1.25,12.8],
 ['inner-east',203.5,-65,1.05,8],['inner-cross',201.5,-67.4,7,1],
 ['inner-return',198.5,-64.8,1.2,4],['inner-lower',197.3,-63,3.3,1.1],
 ['south-return',201.8,-32.5,13.7,1.1]
];
export const RESIDENCE_UNITS=[
 ['north-extra',192,-94.2,1.1,1.3,.40],['east-upper',205,-87,1.25,1.45,.42],
 ['central-large',202.5,-60.2,3.4,2.4,.65],['east-mid',206.7,-55.1,1.2,1.2,.40],
 ['south-extra',190.2,-41.6,1.1,1.2,.40],['south-lower',190.1,-33.2,2.7,2.2,.55],
 ['west-lower',186.2,-24.1,1.8,1.5,.45]
];
export function renderResidenceRoofDetails(height,roofBox){
 for(const [id,x,z,w,d] of RESIDENCE_BANDS){
  if(!roofBox(x,z,w,d,.06,height+.08,0xa7a79a))throw Error('1940 roof band outside footprint: '+id);
 }
 for(const [id,x,z,w,d,h] of RESIDENCE_UNITS){
  if(!roofBox(x,z,w,d,.18,height+.08,0x91958b)||!roofBox(x,z,w*.79,d*.79,h,height+.22,0xb6b8ae))throw Error('1940 roof equipment outside footprint: '+id);
 }
}
