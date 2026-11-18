// Cinematic atmospheric bolide reentry: replacement for artificial white streaks.
// Softly feathered incandescent ionization wake with molten core and dark smoke tail.
export function createDistantMeteorVisual(THREE){
 const c=document.createElement('canvas');c.width=128;c.height=320;
 const x=c.getContext('2d');

 // 1. Aerodynamic ionization wake (warm atmospheric friction gradient)
 const plume=x.createLinearGradient(0,0,0,320);
 plume.addColorStop(0,'rgba(255,110,20,0)');
 plume.addColorStop(.30,'rgba(255,90,15,.12)');
 plume.addColorStop(.70,'rgba(255,145,30,.26)');
 plume.addColorStop(.88,'rgba(255,215,85,.45)');
 plume.addColorStop(1,'rgba(255,245,180,0)');

 x.save();x.translate(64,300);x.rotate(.28);
 // Feathered incandescent thermal taper with narrow glowing core
 for(let i=0;i<8;i++){
  const grad=x.createRadialGradient(0,-38-i*23,1,0,-38-i*23,19-i*1.8);
  grad.addColorStop(0,`rgba(255,${170+i*8},${40+i*14},${.20-i*.012})`);
  grad.addColorStop(1,'rgba(220,70,10,0)');
  x.fillStyle=grad;x.beginPath();x.ellipse(0,-38-i*23,17-i*.9,36,0,0,Math.PI*2);x.fill();
 }
 x.restore();

 // 2. Trailing dark amber atmospheric condensation / smoke plume
 const smoke=x.createLinearGradient(0,75,0,300);
 smoke.addColorStop(0,'rgba(45,35,25,0)');
 smoke.addColorStop(.8,'rgba(75,50,30,.20)');
 smoke.addColorStop(1,'rgba(160,85,35,.42)');
 x.fillStyle=smoke;x.beginPath();x.moveTo(62,300);x.bezierCurveTo(42,210,43,158,60,73);x.bezierCurveTo(67,136,91,233,70,300);x.closePath();x.fill();

 // 3. White-hot bolide detonation core with solar yellow and molten orange corona
 const head=x.createRadialGradient(64,282,1,64,282,19);
 head.addColorStop(0,'rgba(255,255,240,1.0)'); // Solar white-hot center
 head.addColorStop(.30,'rgba(255,210,75,.95)'); // Incandescent amber
 head.addColorStop(.70,'rgba(255,80,12,.50)');  // Molten fringe
 head.addColorStop(1,'rgba(200,30,0,0)');        // Outer fade
 x.fillStyle=head;x.beginPath();x.ellipse(64,281,17,19,-.2,0,Math.PI*2);x.fill();

 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=2;
 const material=new THREE.SpriteMaterial({map:tex,color:0xffffff,transparent:true,opacity:.85,depthWrite:false,depthTest:true});
 return {texture:tex,material};
}
