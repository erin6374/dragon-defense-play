// Broad Street block geometry: Dauphin (x=-53), Susquehanna (x=+53).
// East-west street direction is the negative world Z axis; their road
// centerlines remain fixed through all distant-parallax blocks.
export const CROSS_STREETS=Object.freeze([
 {name:'W Dauphin St',x:-53,roadHalfWidth:6},
 {name:'W Susquehanna Ave',x:53,roadHalfWidth:6}
]);
// Reserve the road plus curb/sidewalk clearance on both sides of the street.
// A proposed building must NOT intersect the right-of-way.
export function occupiesCrossStreet(x,buildingWidth=0,clearance=1.65){
 return CROSS_STREETS.some(({x:cx,roadHalfWidth})=>Math.abs(x-cx)<roadHalfWidth+clearance+buildingWidth*.5);
}
export function roadClearance(x,buildingWidth=0){
 return Math.min(...CROSS_STREETS.map(({x:cx,roadHalfWidth})=>Math.abs(x-cx)-roadHalfWidth-buildingWidth*.5));
}
