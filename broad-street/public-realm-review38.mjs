/** Review38: photo-informed Broad Street public realm fixtures.
 * 2025-04 Street View 031037, 030432; 2026-10 031158.
 * Only observed fixture TYPES at three locations; offsets and dimensions
 * are provisional visual estimates. No inferred signal phases or controls.
 * All work is on Broad-facing sidewalk, separate from Antigravity rear scope.
 */
import * as T from 'three';
export const FIXTURES=[
 {id:'dauphin-pedestrian',type:'pedestrian',x:-348.7,z:-17.05,evidence:'031037 Apr 2025'},
 {id:'dauphin-planter',type:'planter',x:-339.0,z:-18.20,evidence:'031037 Apr 2025'},
 {id:'school-light',type:'light',x:-232.4,z:-16.95,evidence:'030432 Apr 2025'},
 {id:'crown-light',type:'light',x:-195.1,z:-16.95,evidence:'030432 Apr 2025'},
 {id:'susquehanna-signal',type:'signal',x:-188.0,z:-17.05,armSign:1,evidence:'030432 Apr 2025; corner visible, mast layout estimated'},
 {id:'york-signal',type:'signal',x:-534.1,z:-17.25,armSign:1,evidence:'031158 Oct 2026'},
 {id:'york-hydrant',type:'hydrant',x:-516.8,z:-17.40,evidence:'031158 Oct 2026'},
 {id:'york-light',type:'light',x:-511.5,z:-16.95,evidence:'031158 Oct 2026'}
];
export function createPublicRealm(){
 const root=new T.Group();root.name='Review38 Broad Street public realm';
 const mats=new Map(),mat=c=>{if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.80}));return mats.get(c);};
 const iron=0x363a37,gray=0x797971,bronze=0x615c50,yellow=0xc99b45;
 const sidewalk=.29;
 for(const f of FIXTURES){
  const group=new T.Group();group.name=f.id;group.position.set(f.x,sidewalk,f.z);group.userData={...f,baseY:sidewalk};root.add(group);
  const shape=(geo,c,x,y,z,name)=>{const m=new T.Mesh(geo,mat(c));m.position.set(x,y,z);m.name=name;group.add(m);return m;};
  const box=(x,y,z,w,h,d,c,name)=>shape(new T.BoxGeometry(w,h,d),c,x,y,z,name);
  const cyl=(x,y,z,r0,r1,h,c,name)=>shape(new T.CylinderGeometry(r0,r1,h,16),c,x,y,z,name);
  const beam=(a,b,r,c,name)=>{
   const u=new T.Vector3(...a),v=new T.Vector3(...b),d=v.clone().sub(u),mid=u.clone().add(v).multiplyScalar(.5);
   const m=cyl(mid.x,mid.y,mid.z,r,r,d.length()+r*.6,c,name);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;
  };
  const pole=(h,c=iron)=>{
   box(0,.06,0,.43,.18,.43,gray,'grounded footing');
   cyl(0,.35,0,.15,.19,.65,c,'base collar');cyl(0,h/2,0,.085,.13,h+.04,c,'pole');
  };
  const lamp=(h,reach=1.6)=>{
   beam([0,h-.18,0],[0,h+.25,.55],.066,iron,'lamp arm elbow');
   beam([0,h+.25,.55],[0,h+.30,reach],.060,iron,'lamp arm');
   box(0,h+.27,reach,.29,.16,.62,iron,'lamp head');
   box(0,h+.18,reach,.20,.045,.42,0xc7c6ab,'unlit diffuser');
  };
  const ped=(x,y,z,yaw)=>{
   const b=box(x,y,z,.37,.39,.25,iron,'pedestrian signal housing');b.rotation.y=yaw;
   const dir=new T.Vector3(0,0,1).applyAxisAngle(new T.Vector3(0,1,0),yaw);
   const face=box(x+dir.x*.132,y,z+dir.z*.132,.30,.31,.044,0x292c29,'unlit pedestrian face');face.rotation.y=yaw;
  };
  const signal=(x,y,z,yaw)=>{
   const body=box(x,y,z,.35,1.03,.25,yellow,'signal housing');body.rotation.y=yaw;
   const dir=new T.Vector3(0,0,1).applyAxisAngle(new T.Vector3(0,1,0),yaw);
   for(const [off,c] of [[.32,0x683630],[0,0x786435],[-.32,0x3d5341]]){
    const lens=cyl(x+dir.x*.137,y+off,z+dir.z*.137,.118,.118,.09,c,'unlit lens');
    lens.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir);
    const visor=box(x+dir.x*.19,y+off+.12,z+dir.z*.19,.29,.085,.23,yellow,'lens visor');visor.rotation.y=yaw;
   }
  };
  if(f.type==='light'){pole(6.75);lamp(6.75,1.75);}
  if(f.type==='pedestrian'){
   pole(6.7,bronze);beam([0,2.60,0],[.39,2.60,0],.065,iron,'pedestrian bracket');ped(.39,2.60,0,0);
   beam([0,5.0,0],[-.38,5.12,0],.055,iron,'upper fixture bracket');
   cyl(-.38,5.09,0,.12,.15,.16,0xc4c0ac,'upper fixture housing');
  }
  if(f.type==='signal'){
   pole(6.6,bronze);lamp(6.6,1.35);
   beam([0,4.8,0],[0,5.50,4.8],.095,iron,'signal mast arm');
   // Two opposite-facing housings carried by a short bracket at each station.
   for(const z of [2.25,4.55]){
    const y=4.8+.70*z/4.8;
    beam([0,y,z],[.33,y,z],.07,iron,'signal mount');
    signal(.33,y,z,Math.PI/2);signal(-.12,y,z,-Math.PI/2);
   }
   beam([0,2.55,0],[.35,2.55,0],.06,iron,'pedestrian bracket');ped(.35,2.55,0,0);
   // Green street-sign backing only; text is omitted where unreadable.
   beam([0,3.50,0],[-.35,3.50,0],.045,iron,'street sign bracket');
   box(-.35,3.50,0,.78,.21,.075,0x42694e,'street sign backing');
  }
  if(f.type==='hydrant'){
   const red=0xb44f3c;
   cyl(0,.06,0,.24,.25,.16,red,'hydrant base');
   cyl(0,.46,0,.13,.15,.79,red,'hydrant barrel');
   cyl(0,.90,0,.19,.16,.16,red,'bonnet');
   cyl(0,1.01,0,.065,.065,.12,iron,'bonnet nut');
   for(const side of [-1,1]){
    const n=cyl(side*.17,.53,0,.10,.10,.23,red,'side outlet');n.rotation.z=Math.PI/2;
    const cap=cyl(side*.29,.53,0,.12,.12,.08,red,'outlet cap');cap.rotation.z=Math.PI/2;
   }
  }
  if(f.type==='planter'){
   cyl(0,.06,0,.38,.42,.16,0x895a48,'planter footing');
   cyl(0,.35,0,.56,.37,.58,0x9c604b,'planter bowl');
   cyl(0,.65,0,.59,.58,.10,0x825443,'planter lip');
   cyl(0,.69,0,.50,.50,.06,0x5b5542,'soil');
   for(const [x,z] of [[-.16,0],[.17,.11],[0,-.17]])shape(new T.IcosahedronGeometry(.21,1),0x68794a,x,.86,z,'low planting');
  }
 }
 root.userData={fixtureCount:FIXTURES.length,fixtureIds:FIXTURES.map(f=>f.id),source:'user dated Street View screenshots; location and dimensions approximate; signal state unlit'};
 return root;
}
