import { buildings } from '../../broad-street/district.js';

const SCHOOL_VIEWER_CENTER_X = -255.88;
const SCHOOL_VIEWER_FRONT_Z = -22.06;
const parkAddress = '2228 N PARK AVE';
const [parkPolygons, parkHeight] = buildings.find(([, , name]) => name === parkAddress);
const points = parkPolygons.flat();
const xs = points.flatMap(ring => ring.map(([x]) => x - SCHOOL_VIEWER_CENTER_X));
const zs = points.flatMap(ring => ring.map(([, z]) => z - SCHOOL_VIEWER_FRONT_Z));
const west = Math.min(...xs);
const east = Math.max(...xs);
const front = Math.min(...zs);
const rear = Math.max(...zs);

export const PARK_2228 = Object.freeze({
  name: 'park-2228-viewer',
  x: (west + east) / 2,
  z: (front + rear) / 2,
  w: east - west,
  d: rear - front,
  h: parkHeight,
  background: true,
  stories: 3,
  bays: 2,
  kind: 'brick'
});
