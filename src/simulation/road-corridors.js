// Broad Street block geometry: authentic Philadelphia street grid (2221 N Broad St campus).
// Intersecting East-West cross streets accurately calibrated to the North Broad photogrammetric survey:
// - W York St (2400 N, x = -167, north of 2309-13 PECO corner)
// - W Dauphin St (2300 N, x = -98, north of 2253 Doll Museum corner)
// - W Susquehanna Ave (2200 N, x = 53, south of 2200 Crown Chicken / deli corner)
// - W Diamond St (2100 N, x = 245, south of 2101-07 Berean Presbyterian Church corner)
// East-west street direction is the negative world Z axis; their road
// centerlines remain fixed through all distant-parallax blocks.
export const CROSS_STREETS = Object.freeze([
  { name: 'W York St', x: -167, roadHalfWidth: 8.0 },
  { name: 'W Dauphin St', x: -98, roadHalfWidth: 8.0 },
  { name: 'W Susquehanna Ave', x: 53, roadHalfWidth: 8.0 },
  { name: 'W Diamond St', x: 245, roadHalfWidth: 8.0 }
]);

// Reserve the road plus curb/sidewalk clearance on both sides of the street.
// A proposed building must NOT intersect the right-of-way corridor across all depths.
export function occupiesCrossStreet(x, buildingWidth = 0, clearance = 4.5) {
  return CROSS_STREETS.some(({ x: cx, roadHalfWidth }) =>
    Math.abs(x - cx) < roadHalfWidth + clearance + buildingWidth * 0.5
  );
}

export function roadClearance(x, buildingWidth = 0) {
  return Math.min(...CROSS_STREETS.map(({ x: cx, roadHalfWidth }) =>
    Math.abs(x - cx) - roadHalfWidth - buildingWidth * 0.5
  ));
}
