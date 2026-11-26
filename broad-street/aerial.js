import * as T from 'three';
const start=-720,span=370,back=-130,depth=160;
const maps=[],surfaces=[];
function aerialMaterial(map){
 const material=new T.MeshBasicMaterial({map});surfaces.push(material);return material;
}
export function setAerialNight(night){
 for(const material of surfaces)material.color.setHex(night?0x555e72:0xffffff);
}
export function loadAerial(redraw){
 for(let i=0;i<3;i++){
  const texture=new T.TextureLoader().load('./city-aerial-'+i+'.jpg',redraw);
  texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;maps.push(texture);
 }
}
export function roofMaterial(geometry,side){
 const positions=geometry.attributes.position,uv=geometry.attributes.uv;
 let min=Infinity,max=-Infinity;
 for(let i=0;i<positions.count;i++){min=Math.min(min,positions.getX(i));max=Math.max(max,positions.getX(i))}
 const tile=Math.floor((min-start)/span);
 if(!maps[tile]||Math.floor((max-start)/span)!==tile)return side;
 for(let i=0;i<positions.count;i++){
  uv.setXY(i,(positions.getX(i)-start-tile*span)/span,1-(positions.getZ(i)-back)/depth);
 }
 return [aerialMaterial(maps[tile]),side];
}
export function addAerialGround(scene){
 const group=new T.Group();
 for(let i=0;i<maps.length;i++){
  const surface=new T.Mesh(new T.PlaneGeometry(span,depth),aerialMaterial(maps[i]));
  surface.rotation.x=-Math.PI/2;surface.position.set(start+(i+.5)*span,.10,back+depth/2);group.add(surface);
 }
 scene.add(group);
}
