// Original procedural assets: curved bodywork, fitted glazing and mechanical detail.
// Generic silhouettes and liveries; no third-party model downloads.
const caches=new WeakMap();
function kit(T){if(caches.has(T))return caches.get(T);const mats=new Map(),geo=new Map();
 const mat=(c,metal=.15,rough=.55)=>{const k=[c,metal,rough].join();if(!mats.has(k))mats.set(k,new T.MeshStandardMaterial({color:c,metalness:metal,roughness:rough}));return mats.get(k)};
 const sphere=new T.SphereGeometry(1,24,16),box=new T.BoxGeometry(1,1,1);
 function part(g,geometry,m,x,y,z,sx=1,sy=1,sz=1){const o=new T.Mesh(geometry,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);g.add(o);return o}
 const block=(g,m,x,y,z,w,h,d)=>part(g,box,m,x,y,z,w,h,d);
 const oval=(g,m,x,y,z,w,h,d)=>part(g,sphere,m,x,y,z,w,h,d);
 function rod(g,m,a,b,r=.05){const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av);const key=r+':c';if(!geo.has(key))geo.set(key,new T.CylinderGeometry(r,r,1,12));const o=part(g,geo.get(key),m,...av.clone().add(bv).multiplyScalar(.5).toArray(),1,v.length(),1);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o}
 function profile(g,m,points,width){const key=JSON.stringify([points,width]);if(!geo.has(key)){const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const e=new T.ExtrudeGeometry(shape,{depth:width,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.055,bevelThickness:.055,curveSegments:12});e.translate(0,0,-width/2);geo.set(key,e)}return part(g,geo.get(key),m,0,0,0)}
 const result={mat,part,block,oval,rod,profile,geo};caches.set(T,result);return result}
export function buildRoadVehicle(T,root,o){
 const k=kit(T),{mat,block,oval,rod,profile,part,geo}=k,L=o.length,body=mat(o.bodyHex,.32,.36),chrome=mat(0xaeb6ba,.78,.27),rubber=mat(0x171a1e,.03,.95),glass=mat(0x325264,.48,.16),black=mat(0x272e35,.22,.64),white=mat(0xe5e5df,.24,.42);
 const brakes=[];const tailDim=mat(0x7d1715,.1,.3),tailBright=new T.MeshStandardMaterial({color:0xff3023,emissive:0xff2014,emissiveIntensity:2.2,roughness:.2});
 const frontSteer=[];
 const wheel=(x,z,r=.44)=>{
  if(!geo.has('wheel'+r))geo.set('wheel'+r,new T.CylinderGeometry(r,r,.24,24));
  // The front axle is articulated independently from the chassis. Keep each
  // front wheel as a child group so vehicle batching cannot freeze its steering.
  const front=x>0&&!o.bike;
  const pivot=front?new T.Group():root;
  if(front){pivot.position.set(x,0,z);root.add(pivot);frontSteer.push(pivot);}
  const px=front?0:x,pz=front?0:z;
  const w=part(pivot,geo.get('wheel'+r),rubber,px,r,pz);w.rotation.x=Math.PI/2;
  const hub=part(pivot,new T.CylinderGeometry(r*.52,r*.52,.252,16),chrome,px,r,pz);hub.rotation.x=Math.PI/2;
  for(let n=0;n<5;n++){const a=n*Math.PI*.4;rod(pivot,black,[px,r,pz+Math.sign(z)*.13],[px+Math.cos(a)*r*.42,r+Math.sin(a)*r*.42,pz+Math.sign(z)*.13],.025)}
 };

 if(o.bike){for(const x of [-1,1])wheel(x,0,.43);rod(root,chrome,[-1,.45,0],[.1,1.1,0],.06);rod(root,chrome,[.1,1.1,0],[1,.45,0],.06);oval(root,body,0,.85,0,.7,.26,.25);block(root,black,-.45,1.1,0,.6,.15,.42);rod(root,chrome,[.75,.55,0],[.85,1.5,0],.06);rod(root,chrome,[.85,1.5,-.3],[.85,1.5,.3],.04);const rider=buildPerson(T,2);rider.position.set(-.2,.35,0);rider.scale.setScalar(.85);root.add(rider);return {brakes,tailDim,tailBright,beacon:null}}
 const heavy=o.bus||o.truck||o.fireTruck||o.ambulance,top=o.fireTruck?2.4:o.bus?2.6:heavy?2.2:o.van?1.95:1.42;
 if(o.fireTruck){
  profile(root,body,[[-L/2,.52],[L/2,.52],[L/2,1.85],[L/2-.35,2.4],[L/2-2.3,2.4],[L/2-2.55,1.95],[-L/2,1.95]],1.78);
  block(root,white,L/2-1.3,2.38,0,2.15,.15,1.85);
  for(const z of [-.97,.97]){block(root,white,0,1.05,z,L-.3,.15,.03);block(root,glass,L/2-1.2,1.98,z,1.85,.52,.03);
   for(let bay=0;bay<4;bay++){const x=-L/2+.55+bay*.88;block(root,chrome,x,1.32,z,.78,.91,.04);for(let slat=0;slat<6;slat++)block(root,black,x,1+slat*.12,z*1.025,.74,.015,.02);block(root,black,x,1.55,z*1.03,.24,.04,.025)}
   for(let outlet=0;outlet<3;outlet++)oval(root,chrome,.75,1.12+outlet*.19,z*1.03,.09,.09,.04);
  }
  for(const z of [-.6,.6])rod(root,chrome,[-L/2+.4,2.16,z],[.2,2.16,z],.09);
  if(o.ladder){const ladder=new T.Group();ladder.position.set(-1.2,2.35,0);root.add(ladder);for(let stage=0;stage<3;stage++){const half=.5-stage*.1;for(const z of [-half,half]){rod(ladder,chrome,[-2,stage*.14,z],[4.5-stage*.5,stage*.14,z],.055);rod(ladder,chrome,[-2,.34+stage*.14,z],[4.5-stage*.5,.34+stage*.14,z],.045)}for(let rung=-2;rung<4.5-stage*.5;rung+=.38){rod(ladder,chrome,[rung,stage*.14,-half],[rung,stage*.14,half],.035);for(const z of [-half,half])rod(ladder,chrome,[rung,stage*.14,z],[rung+.35,.34+stage*.14,z],.03)}}root.userData.ladder=ladder;
  }else{for(let hose=0;hose<5;hose++)rod(root,mat(0xc3ae88),[-L/2+.5,2.12,-.6+hose*.27],[.1,2.12,-.6+hose*.27],.105);rod(root,chrome,[1,2.1,0],[1,2.65,0],.13);rod(root,chrome,[1,2.65,0],[1.7,2.8,0],.12)}
 }else if(heavy||o.van){
  profile(root,body,[[-L/2,.48],[L/2,.48],[L/2,top-.5],[L/2-.45,top],[-L/2+.18,top],[-L/2,top-.2]],1.75);
  for(const z of [-.96,.96]){if(o.bus){for(let x=-L/2+.7;x<L/2-.4;x+=.86)block(root,glass,x,1.93,z,.73,.77,.025);block(root,white,0,.88,z,L-.2,.14,.025)}else block(root,glass,L/2-.86,top-.43,z,1.25,.58,.03)}
  if(o.ambulance)for(const z of [-.91,.91]){block(root,mat(0xb82824),-.5,1.35,z,.16,.65,.025);block(root,mat(0xb82824),-.5,1.35,z,.65,.16,.03)}
 }else{
  const cabin=o.style==='crossover'?1.78:1.49,rear=o.style==='wagon'||o.style==='crossover'?-L/2+.28:-.97;
  profile(root,body,[[-L/2,.47],[L/2,.47],[L/2,.87],[L/2-.55,.98],[.65,1.06],[.18,cabin],[rear,cabin],[-L/2,1.01],[-L/2,.88]],1.65);
  if(o.style==='wagon'||o.style==='crossover')for(const z of [-.60,.60])rod(root,chrome,[-1.35,cabin+.10,z],[.1,cabin+.10,z],.025);
  for(const z of [-.83,.83]){profile(root,glass,[[-1.3,1.04],[-.9,cabin-.1],[.12,cabin-.1],[.49,1.04]],.015).position.z=z;block(root,black,-.48,1.24,z*1.01,.075,.40,.035);block(root,chrome,-.7,.95,z*1.02,.20,.035,.035)}
 }
 if(o.fireTruck){const screen=block(root,glass,L/2-.065,2.12,0,.045,.51,1.5);screen.rotation.z=.56;rod(root,black,[L/2+.07,1.90,0],[L/2-.20,2.36,0],.035);}
 else if(heavy||o.van){block(root,glass,L/2+.07,top-.58,0,.045,.70,1.45);block(root,black,L/2+.10,top-.58,0,.02,.74,.045);}
 else {const tall=o.style==='crossover',long=o.style==='wagon'||tall;const screen=block(root,glass,.40,tall?1.40:1.28,0,.035,tall?.76:.56,1.43);screen.rotation.z=tall?.61:.83;const rear=block(root,glass,long?-L/2+.20:-1.24,tall?1.38:1.25,0,.025,tall?.73:.53,1.40);rear.rotation.z=long?-.28:-.93;}

 for(const z of [-.95,.95]){oval(root,body,L/2-1.15,heavy?1.85:1.16,z,.17,.10,.17);rod(root,chrome,[L/2-1.2,heavy?1.77:1.1,z*.85],[L/2-1.15,heavy?1.85:1.16,z],.025)}
 for(const x of [-L*.31,L*.31])for(const z of [-.9,.9])wheel(x,z,heavy?.50:.40);
 if(o.ladder||o.bus||o.garbage)for(const z of [-.9,.9])wheel(-L*.31+.98,z,.5);
 block(root,chrome,L/2+.07,.57,0,.14,.16,1.8);block(root,chrome,-L/2-.07,.57,0,.14,.16,1.8);
 for(let i=0;i<5;i++)block(root,black,L/2+.09,.78+i*.055,0,.035,.025,.74);
 const head=mat(0xffffd6,.08,.12);head.emissive.setHex(0xffedb4);head.emissiveIntensity=.15;
 // A feathered road pool follows the chassis without adding dynamic lights.
 const beamMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,
  blending:T.AdditiveBlending,uniforms:{strength:{value:0}},
  vertexShader:'varying vec2 beamUV;void main(){beamUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`varying vec2 beamUV;uniform float strength;
   void main(){float reach=beamUV.x;float lateral=abs(beamUV.y-.5);
    float width=mix(.14,.48,reach);float edge=1.-smoothstep(width*.35,width,lateral);
    float fade=smoothstep(0.,.06,reach)*pow(1.-reach,1.6);
    gl_FragColor=vec4(1.,.86,.61,edge*fade*strength);}`});
 const beam=new T.Mesh(new T.PlaneGeometry(9,3.8),beamMaterial);
 beam.name='vehicle-headlight-road-pool';beam.rotation.x=-Math.PI/2;
 beam.position.set(L/2+4.5,.045,0);beam.visible=false;root.add(beam);
 root.userData.headlightBeam=beam;root.userData.headlightMaterial=head;
 for(const z of [-.65,.65]){block(root,head,L/2+.08,.88,z,.06,.19,.35);brakes.push(block(root,tailDim,-L/2-.09,.88,z,.06,.18,.31))}
 if(o.taxi)block(root,mat(0xfff2b4),-.4,top+.12,0,.55,.18,.4);
 let beacon=null;if(o.emergency)beacon=block(root,mat(0x287eff),L/2-1.1,top+.13,0,.7,.17,.8);
 root.userData.frontSteer=frontSteer;root.userData.brakes=brakes;root.userData.tailDim=tailDim;root.userData.tailBright=tailBright;
 return {beacon,brakes,tailDim,tailBright};
}
export function setRoadVehicleNight(root,darkness,moving=true){
 const strength=Math.max(0,Math.min(1,(darkness-.18)/.62));
 const beam=root.userData.headlightBeam;
 if(beam){beam.visible=moving&&strength>.001;beam.material.uniforms.strength.value=strength*.24;}
 if(root.userData.headlightMaterial)root.userData.headlightMaterial.emissiveIntensity=.15+strength*1.8;
}
export function buildHelicopter(T,root,variant=0){
 const {mat,block,oval,rod,part}=kit(T),fire=variant===2,heavy=variant>0,color=mat(fire?0xb83525:heavy?0xe6e5dc:0x294f70,.30,.37),glass=mat(0x254450,.52,.14),metal=mat(0x5d6268,.65,.35),dark=mat(0x22292e,.2,.62),white=mat(0xe9e6d8);
 oval(root,color,-.25,0,0,heavy?2.15:1.75,.82,.91);oval(root,glass,1.13,.04,0,1.0,.68,.82);oval(root,color,1.24,-.42,0,.90,.24,.77);
 rod(root,color,[2.10,-.10,0],[1.56,.63,0],.045);rod(root,color,[1.56,.63,0],[.72,.72,0],.045);
 // Windscreen framing and segmented cabin glazing.
 for(const z of [-.76,.76]){rod(root,color,[1.84,-.2,z*.55],[1.45,.62,z*.6],.045);rod(root,color,[1.45,.62,z*.6],[.6,.66,z],.045);for(const x of [-1.15,-.25]){oval(root,glass,x,.16,z,.37,.39,.10);rod(root,metal,[x-.43,-.45,z],[x-.43,.64,z],.018)}block(root,white,-.7,-.35,z,1.8,.12,.025)}
 const tailBoom=part(root,new T.CylinderGeometry(.10,.36,4.3,20),color,-3.65,.27,0);tailBoom.rotation.z=-Math.PI/2;
 const fin=block(root,color,-5.6,.87,0,.65,1.4,.12);fin.rotation.z=-.24;block(root,color,-4.85,.3,0,1,.10,2);
 for(const z of heavy?[]:[-.95,.95]){rod(root,metal,[-1.7,-1,z],[1.8,-1,z],.065);rod(root,metal,[1.8,-1,z],[2,-.8,z],.065);for(const x of [-1,1])rod(root,metal,[x,-.48,z*.6],[x,-1,z],.055)}
 if(heavy){for(const x of [-1.25,1.15])for(const z of [-.86,.86]){rod(root,metal,[x,-.5,z*.7],[x,-1.05,z],.065);const wheel=part(root,new T.CylinderGeometry(.21,.21,.15,20),dark,x,-1.07,z);wheel.rotation.x=Math.PI/2;}block(root,white,-.75,-.60,0,1.9,.16,1.4);}
 for(const z of heavy?[-.4,.4]:[0]){oval(root,color,-.5,.73,z,.85,.30,.24);const exhaust=part(root,new T.CylinderGeometry(.18,.18,.5,18),dark,-1.35,.75,z);exhaust.rotation.z=Math.PI/2}
 rod(root,metal,[0,.6,0],[0,1.5,0],.09);oval(root,metal,0,1.42,0,.28,.12,.28);
 const rotor=new T.Group();rotor.position.y=1.5;root.add(rotor);for(let i=0;i<(heavy?5:4);i++){const blade=block(rotor,dark,2.1,.01,0,4.2,.035,.23);blade.rotation.y=i*Math.PI*2/(heavy?5:4);blade.position.set(Math.cos(blade.rotation.y)*2.1,0,-Math.sin(blade.rotation.y)*2.1)}
 const tail=new T.Group();tail.position.set(-5.62,.85,.18);root.add(tail);for(let i=0;i<4;i++){const a=i*Math.PI/2;const blade=block(tail,dark,Math.cos(a)*.43,Math.sin(a)*.43,0,.85,.07,.035);blade.rotation.z=a}
 if(fire){oval(root,white,-.35,-.72,0,1.25,.35,.64);rod(root,metal,[.2,-.85,0],[.5,-1.45,0],.14)}
 for(const [z,c] of [[-.94,0xff2424],[.94,0x35ff8a]]){const nav=new T.MeshBasicMaterial({color:c});oval(root,nav,-1,.1,z,.07,.07,.07)}
 const beacon=oval(root,new T.MeshBasicMaterial({color:0xff3423}),-.4,1.05,0,.10,.10,.10);
 root.userData.aircraftVariant=['news-camera-helicopter','police-patrol-helicopter','firefighting-tanker'][variant];return {rotor,tail,beacon,firefighting:fire};
}
export function buildPerson(T,seed=0){const {mat,oval,rod}=kit(T),g=new T.Group(),cloth=mat([0x4f687c,0x865853,0x5e685c,0xada394][seed%4]),skin=mat([0xb98564,0x76503a,0xd5ac87][seed%3]),pants=mat(0x303942),shoe=mat(0x252629);
 oval(g,cloth,0,.93,0,.20,.32,.14);oval(g,skin,0,1.39,0,.125,.16,.12);oval(g,mat(0x45382c),0,1.49,-.02,.128,.09,.12);const limbs=[];
 for(const side of [-1,1]){const leg=new T.Group();leg.position.set(side*.105,.71,0);g.add(leg);rod(leg,pants,[0,0,0],[0,-.58,0],.073);oval(leg,shoe,0,-.6,.055,.09,.06,.16);limbs.push(leg);const arm=new T.Group();arm.position.set(side*.22,1.12,0);g.add(arm);rod(arm,cloth,[0,0,0],[side*.04,-.35,0],.055);oval(arm,skin,side*.04,-.39,0,.055,.07,.05);limbs.push(arm)}g.userData.limbs=limbs;return g}
export function animatePerson(g,t,moving=true){g.userData.limbs?.forEach((limb,i)=>limb.rotation.x=moving?Math.sin(t)*.32*(i===0||i===3?1:-1):0)}
