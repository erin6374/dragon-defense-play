// Deliberately cinematic: these are far behind gameplay meteors, with desaturated
// atmospheric color and a broad, softly feathered tail; no opaque black line mesh.
export function createDistantMeteorVisual(THREE){
 const c=document.createElement('canvas');c.width=128;c.height=320;
 const x=c.getContext('2d');
 const plume=x.createLinearGradient(0,0,0,320);
 plume.addColorStop(0,'rgba(173,194,214,0)');
 plume.addColorStop(.30,'rgba(157,178,197,.10)');
 plume.addColorStop(.70,'rgba(135,160,184,.22)');
 plume.addColorStop(.88,'rgba(187,206,219,.32)');
 plume.addColorStop(1,'rgba(197,212,226,0)');
 x.save();x.translate(64,300);x.rotate(.28);
 // Feathered taper with narrow bright core, not a single scribbled line.
 for(let i=0;i<8;i++){
  const grad=x.createRadialGradient(0,-38-i*23,1,0,-38-i*23,19-i*1.8);
  grad.addColorStop(0,`rgba(202,217,226,${.12-i*.008})`);
  grad.addColorStop(1,'rgba(128,159,184,0)');
  x.fillStyle=grad;x.beginPath();x.ellipse(0,-38-i*23,17-i*.9,36,0,0,Math.PI*2);x.fill();
 }
 x.restore();
 const smoke=x.createLinearGradient(0,75,0,300);
 smoke.addColorStop(0,'rgba(112,135,154,0)');smoke.addColorStop(.8,'rgba(133,161,181,.18)');smoke.addColorStop(1,'rgba(175,195,208,.40)');
 x.fillStyle=smoke;x.beginPath();x.moveTo(62,300);x.bezierCurveTo(42,210,43,158,60,73);x.bezierCurveTo(67,136,91,233,70,300);x.closePath();x.fill();
 const head=x.createRadialGradient(64,282,1,64,282,19);
 head.addColorStop(0,'rgba(214,234,249,1)');
 head.addColorStop(.35,'rgba(155,199,229,.90)');
 head.addColorStop(.75,'rgba(111,157,194,.40)');head.addColorStop(1,'rgba(111,157,194,0)');
 x.fillStyle=head;x.beginPath();x.ellipse(64,281,17,19,-.2,0,Math.PI*2);x.fill();
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=2;
 const material=new THREE.SpriteMaterial({map:tex,color:0xffffff,transparent:true,opacity:.78,depthWrite:false,depthTest:true});
 return {texture:tex,material};
}
