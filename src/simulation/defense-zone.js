// Street, school block and its immediate rear row are the player defense zone.
// All rocks in the playable meteor collection remain interceptable at any depth.
export const DEFENSE_REAR_Z=-36;
// Project viewed world positions onto a common world-Z plane. This preserves
// screen aim under perspective, including camera scroll, without 3D plane misses.
export function projectDefensePoint(point,camera,out){
 const scale=Math.abs(camera.z/(camera.z-point.z));
 out.set(camera.x+(point.x-camera.x)*scale,camera.y+(point.y-camera.y)*scale,0);
 return scale;
}
