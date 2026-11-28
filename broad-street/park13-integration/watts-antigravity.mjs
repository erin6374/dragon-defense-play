export const WATTS_BATCH_1 = Object.freeze([
'2228 N PARK AVE',
'2230 N PARK AVE',
'2232 N PARK AVE',
'2234 N PARK AVE',
'2236 N PARK AVE',
'2238 N PARK AVE',
]);
export const WATTS_BATCH_2 = Object.freeze([
'2240 N PARK AVE',
'2242 N PARK AVE',
'2244 N PARK AVE',
'2246 N PARK AVE',
'2248 N PARK AVE',
'2250 N PARK AVE',
]);
export const WATTS_BATCH_3 = Object.freeze([
'2252 N PARK AVE',
'2254 N PARK AVE',
'2256 N PARK AVE',
'2258 N PARK AVE',
'2260 N PARK AVE',
'2262 N PARK AVE',
'2264 N PARK AVE',
]);
const PROFILES = {
'2228 N PARK AVE': {batch: 1, stories: 3, brick: 0xa4745c, trim: 0xc5b8a4, frame: 0x57524c, glass: 0x3b4d56, door: 0x5b4638, rearStyle: 'chamfered-bay', sideReturnWindows: true, exposedEndWindows: true, chimney: true, yardFenceColor: 0x4b4e50,},
'2230 N PARK AVE': {batch: 1, stories: 3, brick: 0x9c7b69, trim: 0xc8bca8, frame: 0x5e5852, glass: 0x3d4f58, door: 0x4e423a, rearStyle: 'chamfered-bay', sideReturnWindows: true, chimney: false, yardFenceColor: 0x525557,},
'2232 N PARK AVE': {batch: 1, stories: 3, brick: 0xb19b86, trim: 0xcbc2b3, frame: 0x625d56, glass: 0x3f525b, door: 0x5d4c40, rearStyle: 'chamfered-bay', sideReturnWindows: true, chimney: true, yardFenceColor: 0x5a5853,},
'2234 N PARK AVE': {batch: 1, stories: 3, brick: 0x9d6b56, trim: 0xc4b7a3, frame: 0x55504a, glass: 0x3b4d56, door: 0x4b3f36, rearStyle: 'chamfered-bay', sideReturnWindows: true, chimney: false, yardFenceColor: 0x4d5052,},
'2236 N PARK AVE': {batch: 1, stories: 3, brick: 0xa87c65, trim: 0xc7bba7, frame: 0x58534d, glass: 0x3c4e57, door: 0x544439, rearStyle: 'chamfered-bay', sideReturnWindows: true, chimney: true, hasRearGarage: true, garageColor: 0x8f887d, garageDoorColor: 0xd4cfc4, yardFenceColor: 0x505355,},
'2238 N PARK AVE': {batch: 1, stories: 3, brick: 0x977360, trim: 0xc6baa6, frame: 0x57524c, glass: 0x3d4f58, door: 0x4d3f35, rearStyle: 'flat-wing', sideReturnWindows: true, chimney: true, yardFenceColor: 0x4e5153,},
'2240 N PARK AVE': {batch: 2, stories: 3, brick: 0xa1765f, trim: 0xc8bca8, frame: 0x59534d, glass: 0x3c4e57, door: 0x524238, rearStyle: 'flat-wing', sideReturnWindows: true, chimney: false, yardFenceColor: 0x4d5052,},
'2242 N PARK AVE': {batch: 2, stories: 3, brick: 0xae9680, trim: 0xcac0b0, frame: 0x605b54, glass: 0x3e515a, door: 0x5a493d, rearStyle: 'flat-wing', sideReturnWindows: true, chimney: true, yardFenceColor: 0x56544f,},
'2244 N PARK AVE': {batch: 2, stories: 3, brick: 0x9b6d58, trim: 0xc5b8a4, frame: 0x56514b, glass: 0x3b4d56, door: 0x4c3f36, rearStyle: 'chamfered-bay', sideReturnWindows: false, chimney: true, yardFenceColor: 0x4b4e50,},
'2246 N PARK AVE': {batch: 2, stories: 3, brick: 0xa67b64, trim: 0xc7bba7, frame: 0x58534d, glass: 0x3c4e57, door: 0x55453a, rearStyle: 'flat-wing', sideReturnWindows: true, chimney: false, hasRearAnnex: true, garageColor: 0x91887c, garageDoorColor: 0x6b645b, yardFenceColor: 0x505355,},
'2248 N PARK AVE': {batch: 2, stories: 3, brick: 0x9a7562, trim: 0xc6baa6, frame: 0x57524c, glass: 0x3d4f58, door: 0x4e4036, rearStyle: 'chamfered-bay', sideReturnWindows: true, chimney: true, yardFenceColor: 0x4f5254,},
'2250 N PARK AVE': {batch: 2, stories: 3, brick: 0xaf9883, trim: 0xcbc2b3, frame: 0x5f5a53, glass: 0x3e515a, door: 0x59483c, rearStyle: 'flat-wing', sideReturnWindows: true, chimney: false, yardFenceColor: 0x54534e,},
'2252 N PARK AVE': {batch: 3, stories: 3, brick: 0xa2745d, trim: 0xc7bba7, frame: 0x58534d, glass: 0x3c4e57, door: 0x534338, rearStyle: 'flat-wing', sideReturnWindows: true, chimney: true, yardFenceColor: 0x4e5153,},
'2254 N PARK AVE': {batch: 3, stories: 3, brick: 0x9b705c, trim: 0xc5b8a4, frame: 0x56514b, glass: 0x3b4d56, door: 0x4c3f36, rearStyle: 'flat-wing', sideReturnWindows: true, chimney: false, yardFenceColor: 0x4c4f51,},
'2256 N PARK AVE': {batch: 3, stories: 3, brick: 0xad9681, trim: 0xcac0b0, frame: 0x5e5952, glass: 0x3e515a, door: 0x58473b, rearStyle: 'flat-wing', sideReturnWindows: true, chimney: true, yardFenceColor: 0x55534e,},
'2258 N PARK AVE': {batch: 3, stories: 3, brick: 0xa07863, trim: 0xc6baa6, frame: 0x57524c, glass: 0x3d4f58, door: 0x504137, rearStyle: 'flat-wing', sideReturnWindows: true, chimney: false, yardFenceColor: 0x4e5153,},
'2260 N PARK AVE': {batch: 3, stories: 3, brick: 0x9c6e58, trim: 0xc5b8a4, frame: 0x56514b, glass: 0x3b4d56, door: 0x4d3f35, rearStyle: 'flat-wing', sideReturnWindows: true, chimney: true, yardFenceColor: 0x4d5052,},
'2262 N PARK AVE': {batch: 3, stories: 3, brick: 0xaa927d, trim: 0xc9bfb0, frame: 0x5d5851, glass: 0x3e515a, door: 0x56463a, rearStyle: 'flat-wing', sideReturnWindows: true, chimney: false, yardFenceColor: 0x53524d,},
'2264 N PARK AVE': {batch: 4, stories: 3, brick: 0x9f745e, trim: 0xc7bba7, frame: 0x58534d, glass: 0x3c4e57, door: 0x524238, rearStyle: 'flat-wing', sideReturnWindows: false, exposedEndWindows: true, chimney: true, yardFenceColor: 0x4e5153,},
};
export const WATTS_TARGET_ADDRESSES = Object.freeze(Object.keys(PROFILES));
function signedArea(ring) {
let a = 0;
for (let i = 0; i < ring.length - 1; i++) {
const [x1, z1] = ring[i];
const [x2, z2] = ring[i + 1];
a += x1 * z2 - x2 * z1;
}
return a * 0.5;
}
export function extractWallSegments(ring) {
if (!Array.isArray(ring) || ring.length < 4) return [];
const area = signedArea(ring);
const sign = area >= 0 ? 1 : -1;
const raw = [];
for (let j = 1; j < ring.length; j++) {
const [x1, z1] = ring[j - 1];
const [x2, z2] = ring[j];
const dx = x2 - x1;
const dz = z2 - z1;
const len = Math.hypot(dx, dz);
if (len < 1e-4) continue;
const tx = dx / len;
const tz = dz / len;
const nx = sign * tz;
const nz = sign * -tx;
raw.push({ x1, z1, x2, z2, dx, dz, len, tx, tz, nx, nz });
}
if (!raw.length) return [];
const merged = [{ ...raw[0] }];
for (let i = 1; i < raw.length; i++) {
const prev = merged[merged.length - 1];
const cur = raw[i];
const dot = prev.tx * cur.tx + prev.tz * cur.tz;
const gap = Math.hypot(cur.x1 - prev.x2, cur.z1 - prev.z2);
if (dot > 0.996 && gap < 0.03) {
prev.x2 = cur.x2;
prev.z2 = cur.z2;
prev.dx = prev.x2 - prev.x1;
prev.dz = prev.z2 - prev.z1;
prev.len = Math.hypot(prev.dx, prev.dz);
prev.tx = prev.dx / prev.len;
prev.tz = prev.dz / prev.len;
prev.nx = sign * prev.tz;
prev.nz = sign * -prev.tx;
} else {
merged.push({ ...cur });
}
}
return merged;
}
function addSashWindow(box, cx, cy, cz, nx, nz, w, h, colors) {
const angle = Math.atan2(nx, nz);
box(cx + nx * 0.03, cy, cz + nz * 0.03, w + 0.14, h + 0.12, 0.14, colors.frame, angle);
box(cx + nx * 0.075, cy, cz + nz * 0.075, w, h, 0.08, colors.glass, angle);
box(cx + nx * 0.105, cy, cz + nz * 0.105, w + 0.01, 0.055, 0.04, colors.frame, angle);
box(cx + nx * 0.105, cy, cz + nz * 0.105, 0.045, h, 0.04, colors.frame, angle);
box(cx + nx * 0.05, cy - h * 0.5 - 0.08, cz + nz * 0.05, w + 0.22, 0.12, 0.22, colors.trim, angle);
box(cx + nx * 0.04, cy + h * 0.5 + 0.09, cz + nz * 0.04, w + 0.20, 0.14, 0.16, colors.trim, angle);
}
function addRearDoor(box, cx, cz, nx, nz, w, h, colors, stoop=true) {
const angle = Math.atan2(nx, nz);
const doorY = h * 0.5;
box(cx + nx * 0.03, doorY, cz + nz * 0.03, w + 0.16, h + 0.10, 0.16, colors.trim, angle);
box(cx + nx * 0.08, doorY - 0.08, cz + nz * 0.08, w, h - 0.20, 0.08, colors.door, angle);
box(cx + nx * 0.09, h - 0.22, cz + nz * 0.09, w * 0.94, 0.22, 0.07, colors.glass, angle);
box(cx + nx * 0.04, h + 0.09, cz + nz * 0.04, w + 0.22, 0.15, 0.18, colors.trim, angle);
if(stoop) box(cx + nx * 0.25, 0.11, cz + nz * 0.25, w + 0.34, 0.22, 0.56, colors.trim, angle);
}
function addCoping(box, seg, h, color) {
const mx = (seg.x1 + seg.x2) * 0.5;
const mz = (seg.z1 + seg.z2) * 0.5;
const angle = Math.atan2(seg.nx, seg.nz);
box(mx + seg.nx * 0.02, h + 0.10, mz + seg.nz * 0.02, Math.max(.10,seg.len - 0.16), 0.22, 0.20, color, angle);
}
function renderRearGarage(ring, h, profile, { box }) {
const segs = extractWallSegments(ring);
const rearZ = Math.max(...ring.map((p) => p[1]));
const frontZ = Math.min(...ring.map((p) => p[1]));
for (const seg of segs) {
const mx = (seg.x1 + seg.x2) * 0.5;
const mz = (seg.z1 + seg.z2) * 0.5;
const angle = Math.atan2(seg.nx, seg.nz);
addCoping(box, seg, h, profile.trim);
if (seg.nz > 0.7 && mz > rearZ - 1.0 && seg.len >= 2.2) {
if (profile.hasRearAnnex) {
const dx = mx - seg.tx * (seg.len * 0.24);
const dz = mz - seg.tz * (seg.len * 0.24);
addRearDoor(box, dx, dz, seg.nx, seg.nz, 0.88, Math.min(2.10, h - 0.35), profile);
const wx = mx + seg.tx * (seg.len * 0.22);
const wz = mz + seg.tz * (seg.len * 0.22);
addSashWindow(box, wx, h * 0.56, wz, seg.nx, seg.nz, 0.88, 1.12, profile);
} else {
const dw = Math.min(2.45, seg.len * 0.72);
const dh = Math.min(2.02, h - 0.32);
box(mx + seg.nx * 0.03, dh * 0.5, mz + seg.nz * 0.03, dw + 0.18, dh + 0.12, 0.14, profile.trim, angle);
box(mx + seg.nx * 0.07, dh * 0.5, mz + seg.nz * 0.07, dw, dh, 0.08, profile.garageDoorColor, angle);
for (const frac of [0.25, 0.5, 0.75]) {
box(mx + seg.nx * 0.10, dh * frac, mz + seg.nz * 0.10, dw * 0.96, 0.04, 0.04, profile.frame, angle);
}
box(mx + seg.nx * 0.24, 0.09, mz + seg.nz * 0.24, dw + 0.32, 0.18, 0.48, 0xa8a49a, angle);
}
} else if (seg.nz < -0.7 && mz < frontZ + 1.0 && seg.len >= 2.2) {
const sx = mx - seg.tx * (seg.len * 0.22);
const sz = mz - seg.tz * (seg.len * 0.22);
addRearDoor(box, sx, sz, seg.nx, seg.nz, 0.84, Math.min(1.98, h - 0.30), profile, false);
const wx = mx + seg.tx * (seg.len * 0.22);
const wz = mz + seg.tz * (seg.len * 0.22);
addSashWindow(box, wx, h * 0.55, wz, seg.nx, seg.nz, 0.72, 0.92, profile);
}
}
}
export function renderWattsTarget(poly, height, name, { block, box, mesh, T, assessments }) {
const profile = PROFILES[name];
if (!profile || !poly || !poly[0] || poly[0].length < 4) return false;
const ring = poly[0];
const h = Math.max(2.3, height);
if (h < 4.5) {
renderRearGarage(ring, h, profile, { box });
return true;
}
const stories = assessments?.[name]?.number_stories || profile.stories || Math.max(1, Math.round(h / 3.2));
const pitch = h / stories;
const segs = extractWallSegments(ring);
const rearZ = Math.max(...ring.map((p) => p[1]));
const frontZ = Math.min(...ring.map((p) => p[1]));
const minX = Math.min(...ring.map((p) => p[0]));
const maxX = Math.max(...ring.map((p) => p[0]));
const rearSegs = segs.filter((s) => s.nz > 0.35 && Math.max(s.z1, s.z2) > rearZ - 2.6 && s.len >= 0.85);
const doorSeg = rearSegs.slice().sort((a, b) => b.nz * b.len - a.nz * a.len)[0] || null;
for (const seg of segs) {
const mx = (seg.x1 + seg.x2) * 0.5;
const mz = (seg.z1 + seg.z2) * 0.5;
if (Math.max(seg.z1, seg.z2) <= frontZ + 1.8 && seg.nz < -0.5) continue;
if (rearSegs.includes(seg)) {
addCoping(box, seg, h, profile.trim);
const isFlatWide = seg.len >= 2.8 && seg.nz > 0.85;
const bays = isFlatWide ? Math.max(2, Math.floor(seg.len / 2.0)) : 1;
for (let floor = 0; floor < stories; floor++) {
const wy = (floor + 0.52) * pitch;
for (let b = 0; b < bays; b++) {
const t = (b + 0.5) / bays - 0.5;
const cx = mx + seg.tx * (t * seg.len);
const cz = mz + seg.tz * (t * seg.len);
const isDoor = floor === 0 && seg === doorSeg && b === 0;
if (isDoor) {
addRearDoor(box, cx, cz, seg.nx, seg.nz, 0.90, Math.min(2.15, pitch * 0.72), profile);
} else {
const ww = Math.min(isFlatWide ? 0.92 : 0.74, seg.len * 0.54);
const wh = floor === 0 ? Math.min(1.36, pitch * 0.45) : Math.min(1.32, pitch * 0.44);
addSashWindow(box, cx, wy, cz, seg.nx, seg.nz, ww, wh, profile);
}
}
}
if (seg === doorSeg || seg.len >= 1.2) {
const angle = Math.atan2(seg.nx, seg.nz);
box(mx + seg.nx * 0.03, h - 0.16, mz + seg.nz * 0.03, Math.max(.10,seg.len - 0.14), 0.14, 0.14, profile.trim, angle);
}
continue;
}
const isSideReturn = Math.abs(seg.nx) > 0.85 && seg.len >= 5.0 && seg.len <= 13.0 && Math.max(seg.z1, seg.z2) > rearZ - 4.0;
if (isSideReturn && profile.sideReturnWindows && !(name==='2256 N PARK AVE' && seg.nx<-.85)) {
addCoping(box, seg, h, profile.trim);
const courtBays = 2;
for (let floor = 0; floor < stories; floor++) {
const wy = (floor + 0.52) * pitch;
for (let b = 0; b < courtBays; b++) {
const t = (b === 0 ? 0.34 : 0.72) - 0.5;
const cx = mx + seg.tx * (t * seg.len);
const cz = mz + seg.tz * (t * seg.len);
addSashWindow(box, cx, wy, cz, seg.nx, seg.nz, 0.78, Math.min(1.24, pitch * 0.42), profile);
}
}
const t = Math.min(0.20, 0.25 / seg.len);
const from = seg.z1 < seg.z2 ? t : 1 - t;
const px = seg.x1 + seg.dx * from, pz = seg.z1 + seg.dz * from;
box(px + seg.nx * 0.020, h * 0.48, pz + seg.nz * 0.020, 0.09, h * 0.94, 0.09, 0x5c5b58, Math.atan2(seg.nx, seg.nz));
continue;
}
const isExposedEnd = profile.exposedEndWindows && Math.abs(seg.nx) > 0.85 && seg.len > 18.0 && (Math.abs(mx - maxX) < 0.6 || Math.abs(mx - minX) < 0.6);
if (isExposedEnd && !(name==='2264 N PARK AVE' && seg.nx>.85) && !(name==='2228 N PARK AVE' && seg.nx<-.85)) {
addCoping(box, seg, h, profile.trim);
for (let floor = 1; floor < stories; floor++) {
const wy = (floor + 0.52) * pitch;
for (const zFrac of [0.22, 0.42]) {
const cz = seg.z1 + seg.dz * zFrac;
const cx = seg.x1 + seg.dx * zFrac;
addSashWindow(box, cx, wy, cz, seg.nx, seg.nz, 0.76, 1.18, profile);
}
}
}
}
if (profile.chimney) {
const cx = (minX + maxX) * 0.5 + (maxX - minX) * 0.30;
const cz = rearZ - 5.8;
box(cx, h + 0.55, cz, 0.56, 1.10, 0.56, profile.brick);
box(cx, h + 1.12, cz, 0.64, 0.10, 0.64, profile.trim);
}
return true;
}
export function renderWattsYards(buildings, { box }) {
const handledSites = new Map();
for (const [polys, height, name] of buildings) {
const profile = PROFILES[name];
if (!profile) continue;
const ring = polys?.[0]?.[0];
if (!ring) continue;
const xs = ring.map((p) => p[0]);
const zs = ring.map((p) => p[1]);
const prev = handledSites.get(name);
if (!prev) {
handledSites.set(name, {
x0: Math.min(...xs),
x1: Math.max(...xs),
maxRearZ: Math.max(...zs),
mainRearZ: height >= 4.5 ? Math.max(...zs) : -999,
annexFrontZ: height < 4.5 ? Math.min(...zs) : 999,
profile,
});
} else {
prev.maxRearZ = Math.max(prev.maxRearZ, ...zs);
if (height >= 4.5) {
prev.x0 = Math.min(prev.x0, ...xs);
prev.x1 = Math.max(prev.x1, ...xs);
prev.mainRearZ = Math.max(prev.mainRearZ, ...zs);
} else {
prev.annexFrontZ = Math.min(prev.annexFrontZ, ...zs);
}
}
}
const FENCE_Z = -80.72;
const YARD_TOP_Z = -80.62;
for (const [name, site] of handledSites) {
const x0 = Math.max(site.x0 + 0.08, name==='2244 N PARK AVE' ? -300.60 : -Infinity);
const x1 = site.x1 - 0.08;
const rearZ = site.maxRearZ;
const width = x1 - x0;
const { profile } = site;
if (site.mainRearZ > -900 && site.annexFrontZ < 900 && site.annexFrontZ > site.mainRearZ) {
const bz = site.annexFrontZ - site.mainRearZ;
box((x0 + x1) * 0.5, 0.15, site.mainRearZ + bz * 0.5, width, 0.10, bz + 0.04, 0x9b978d);
}
if (YARD_TOP_Z - rearZ < 0.8) continue;
const yardDepth = YARD_TOP_Z - rearZ;
box((x0 + x1) * 0.5, 0.15, rearZ + yardDepth * 0.5, width, 0.10, yardDepth, 0x9e9a90);
box((x0 + x1) * 0.5, 0.22, FENCE_Z, width, 0.18, 0.12, 0x8b877e);
const fenceColor = profile.yardFenceColor || 0x4b4e50;
const gateWidth = 1.05;
const gateCenter = x0 + width * 0.34;
const gateLeft = gateCenter - gateWidth * 0.5;
const gateRight = gateCenter + gateWidth * 0.5;
const postXs = [x0 + 0.06, gateLeft, gateRight, x1 - 0.06];
for (const px of postXs) {
box(px, 0.72, FENCE_Z, 0.07, 1.20, 0.07, fenceColor);
}
for (const [sx0, sx1] of [[x0 + 0.06, gateLeft], [gateRight, x1 - 0.06]]) {
const span = sx1 - sx0;
if (span < 0.15) continue;
const smid = (sx0 + sx1) * 0.5;
box(smid, 1.24, FENCE_Z, span, 0.05, 0.05, fenceColor);
box(smid, 0.40, FENCE_Z, span, 0.05, 0.05, fenceColor);
const nPickets = Math.max(1, Math.floor(span / 0.26));
for (let k = 1; k < nPickets; k++) {
const px = sx0 + (span * k) / nPickets;
box(px, 0.82, FENCE_Z, 0.028, 0.86, 0.028, fenceColor);
}
}
box(gateCenter, 1.20, FENCE_Z, gateWidth, 0.05, 0.045, fenceColor);
box(gateCenter, 0.42, FENCE_Z, gateWidth, 0.05, 0.045, fenceColor);
for (let k = 1; k <= 3; k++) {
box(gateLeft + (gateWidth * k) / 4, 0.81, FENCE_Z, 0.025, 0.80, 0.025, fenceColor);
}
}
}
