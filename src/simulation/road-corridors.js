// Broad Street block geometry: authentic Philadelphia street grid (2221 N Broad St campus).
// Intersecting East-West cross streets:
// - W York St (2400 N, x = -160)
// - W Dauphin St (2300 N, x = -53)
// - W Susquehanna Ave (2200 N, x = 53)
// - W Diamond St (2100 N, x = 214)
// East-west street direction is the negative world Z axis; their road
// centerlines remain fixed through all distant-parallax blocks.
export const CROSS_STREETS=Object.freeze([
 {name:'W York St',x:-160,roadHalfWidth:6},
 {name:'W Dauphin St',x:-53,roadHalfWidth:6},
 {name:'W Susquehanna Ave',x:53,roadHalfWidth:6},
 {name:'W Diamond St',x:214,roadHalfWidth:6}
]);
// Reserve the road plus curb/sidewalk clearance on both sides of the street.
// A proposed building must NOT intersect the right-of-way.
export function occupiesCrossStreet(x,buildingWidth=0,clearance=1.65){
 return CROSS_STREETS.some(({x:cx,roadHalfWidth})=>Math.abs(x-cx)<roadHalfWidth+clearance+buildingWidth*.5);
}
export function roadClearance(x,buildingWidth=0){
 return Math.min(...CROSS_STREETS.map(({x:cx,roadHalfWidth})=>Math.abs(x-cx)-roadHalfWidth-buildingWidth*.5));
}
