// Non-interceptable distant bolides: cool, subdued atmospheric streaks.
// Distinct from warm, solid foreground meteors even during late-wave escalation.
export function createDistantMeteorVisual(THREE){
 const c=document.createElement('canvas');c.width=128;c.height=320;
 const x=c.getContext('2d');

 // 1. Aerodynamic ionization wake (cool atmospheric gradient)
 const plume=x.createLinearGradient(0,0,0,320);
 plume.addColorStop(0,'rgba(110,150,192,0)');
 plume.addColorStop(.30,'rgba(100,145,190,.12)');
 plume.addColorStop(.70,'rgba(125,165,202,.26)');
 plume.addColorStop(.88,'rgba(170,200,228,.40)');
 plume.addColorStop(1,'rgba(200,220,240,0)');

 x.save();x.translate(64,300);x.rotate(.28);
 // Feathered incandescent thermal taper with narrow glowing core
 for(let i=0;i<8;i++){
  const grad=x.createRadialGradient(0,-38-i*23,1,0,-38-i*23,19-i*1.8);
  grad.addColorStop(0,`rgba(${135+i*7},${165+i*7},${200+i*5},${.20-i*.012})`);
  grad.addColorStop(1,'rgba(90,130,170,0)');
  x.fillStyle=grad;x.beginPath();x.ellipse(0,-38-i*23,17-i*.9,36,0,0,Math.PI*2);x.fill();
 }
 x.restore();

 // 2. Trailing dark slate atmospheric condensation / smoke plume
 const smoke=x.createLinearGradient(0,75,0,300);
 smoke.addColorStop(0,'rgba(30,43,57,0)');
 smoke.addColorStop(.8,'rgba(55,72,90,.20)');
 smoke.addColorStop(1,'rgba(104,135,165,.36)');
 x.fillStyle=smoke;x.beginPath();x.moveTo(62,300);x.bezierCurveTo(42,210,43,158,60,73);x.bezierCurveTo(67,136,91,233,70,300);x.closePath();x.fill();

 // 3. Pale blue core with a muted slate-blue fringe
 const head=x.createRadialGradient(64,282,1,64,282,19);
 head.addColorStop(0,'rgba(215,230,246,.85)'); // Pale atmospheric center
 head.addColorStop(.30,'rgba(168,199,230,.74)'); // Cool blue
 head.addColorStop(.70,'rgba(99,145,191,.40)');  // Subdued fringe
 head.addColorStop(1,'rgba(65,105,150,0)');        // Outer fade
 x.fillStyle=head;x.beginPath();x.ellipse(64,281,17,19,-.2,0,Math.PI*2);x.fill();

 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=2;
 const material=new THREE.SpriteMaterial({map:tex,color:0xffffff,transparent:true,opacity:.78,depthWrite:false,depthTest:true});
 return {texture:tex,material};
}
