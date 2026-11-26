import { buildings } from '../../broad-street/district.js';

export const VIEWER_TO_GAME_X = 255.88;
export const VIEWER_TO_GAME_Z = 22.06;

// Confirmed addresses with individual geometry in the pinned Viewer source.
const parkNumbers = [
  2228, 2250, 2252, 2316, 2318, 2328, 2330, 2332,
  2336, 2338, 2350, 2352, 2354, 2356, 2428, 2430, 2432
];

export const PARK_PARCELS = parkNumbers.map(number => {
  const address = `${number} N PARK AVE`;
  const records = buildings.filter(([, , name]) => name === address);
  const points = records.flatMap(([polygons]) => polygons.flat(2));
  const xs = points.map(([x]) => x + VIEWER_TO_GAME_X);
  const zs = points.map(([, z]) => z + VIEWER_TO_GAME_Z);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  const h = Math.max(...records.map(([, height]) => height));
  return {
    name: `park-${number}-viewer`, address,
    x: (minX + maxX) / 2, z: (minZ + maxZ) / 2,
    w: maxX - minX, d: maxZ - minZ, h,
    background: true, stories: h > 9 ? 3 : 2, bays: 2, kind: 'brick'
  };
});
