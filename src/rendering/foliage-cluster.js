import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Three intersecting branch cards, alpha-tested rather than transparent/sorted.
// Each silhouette has individual leaves and open sky between twigs.
export function createFoliageCluster(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
 const c=canvas.getContext('2d');
 c.strokeStyle='#5c6550';c.lineWidth=2;
 for(let branch=0;branch<5;branch++){
  const angle=-1.5+branch*.63,ex=64+Math.cos(angle)*49,ey=68+Math.sin(angle)*49;
  c.beginPath();c.moveTo(64,108);c.quadraticCurveTo(64,64,ex,ey);c.stroke();
  for(let leaf=0;leaf<7;leaf++){
   const t=.25+leaf*.10,x=64+(ex-64)*t,y=100+(ey-100)*t;
   const side=leaf%2?1:-1;
   c.save();c.translate(x+side*7,y);c.rotate(angle+side*.65);
   c.fillStyle=['#b6c99b','#97b884','#d0d6aa'][leaf%3];
   c.beginPath();c.ellipse(0,0,6.5,11,0,0,Math.PI*2);c.fill();
   c.strokeStyle='#6a875a';c.lineWidth=.7;c.beginPath();c.moveTo(0,-8);c.lineTo(0,9);c.stroke();c.restore();
  }
 }
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=2;
 const cards=[0,Math.PI/3,Math.PI*2/3].map(a=>new THREE.PlaneGeometry(2,2).rotateY(a));
 const geometry=mergeGeometries(cards);for(const g of cards)g.dispose();
 return {geometry,map};
}
