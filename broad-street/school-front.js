import {buildInterior} from './interiors.js';
import {assessments} from './assessment.js';
// Street-facing openings are placed on the actual forward edges of each footprint.
const profiles={
 2205:[0xa67865,3,2],2217:[0x695f59,3,2],2219:[0x605d59,3,2],
 2227:[0xd3cabe,3,2],2231:[0xb8b5ac,3,2],2233:[0x726f68,3,2],
 2235:[0x865f52,5,4],2239:[0x898279,3,2],2241:[0xc0b9ad,3,2],
 2245:[0xbcb6aa,3,2],2247:[0xc2bdb2,3,2],2249:[0x756f69,3,2],
 2251:[0xaf978d,3,2],2253:[0xab8578,3,2],2255:[0xd3cec0,4,2]
};
export function schoolFront(b,scene){
 const profile=profiles[parseInt(b.address)];
 if(!profile||b.front < -31)return false;
 buildInterior(b,scene,profile,assessments[b.address]?.number_stories||profile[1]);
 return true;
}
