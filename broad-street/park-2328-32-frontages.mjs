// The address-linked 2332 streetscape shows this run of three attached houses.
// Parcel order terminates at the gap next to 2332. All dimensions are estimated.
export const PARK_2328_32_FRONTAGES=Object.freeze({
 '2328 N PARK AVE':{split:.60,door:.25,windows:[.68],finish:0xbb8b60,trim:0xd6c9ae,ornament:0xcac2ac,gable:true,porchGable:true},
 '2330 N PARK AVE':{split:.498,door:.78,windows:[.25,.49],finish:0xb9875d,trim:0xb8a485,ornament:0x74574a,gable:true,porchGable:false},
 '2332 N PARK AVE':{split:.516,door:.22,windows:[.52,.77],finish:0xb8885e,trim:0xc3a684,ornament:0x7e5843,gable:false,porchGable:false}
});

export function render2328To2332Frontage(plan,{T,box,mesh,wallAt}){
 const model=PARK_2328_32_FRONTAGES[plan.address];
 const {left,width,z}=plan.facade,h=plan.height;
 const at=f=>left+width*f;
 const mid=at(.5),raised=.72,porchFront=z-1.18,porchW=width*.90;
 const gray=0x9d9789,iron=0x393b39,glass=0x536870,shadow=0x5e564f;
 const panel=(x,y,w,hh,front,back,c)=>box(x,y,(front+back)/2,w,hh,back-front,c);
 const support=(x,w)=>{
  const edges=[-.44,0,.44].map(offset=>wallAt(x+offset*w));
  return {front:Math.min(...edges),back:Math.max(...edges)+.055};
 };

 // Separate skins retain the original centerline step of each footprint.
 for(const [a,b] of [[.012,model.split],[model.split,.988]]){
  const x=(at(a)+at(b))/2,w=at(b)-at(a),where=support(x,w),front=where.front-.06;
  const hh=h-.08,y=hh/2,d=where.back-front;
  if(T&&mesh){
   const g=new T.BoxGeometry(w,hh,d),uv=g.getAttribute('uv'),pos=g.getAttribute('position'),face=g.groups[5];
   for(const i of new Set(g.index.array.slice(face.start,face.start+face.count))){
    uv.setXY(i,x-mid+pos.getX(i),y+pos.getY(i));
   }
   mesh(g,model.finish,x,y,(front+where.back)/2,{brickFace:face.materialIndex});
  }else panel(x,y,w,hh,front,where.back,model.finish);
 }

 const bands=[h*.34,h*.63,h*.95];
 for(const y of bands){
  const w=width*.94,{front,back}=support(mid,w);
  panel(mid,y,w,.115,front-.12,back,model.trim);
 }
 const window=(f,y,w,hh)=>{
  const x=at(f),{front,back}=support(x,w+.14),trimZ=front-.17;
  panel(x,y,w+.16,hh+.14,trimZ,back,model.trim);
  panel(x,y,w,hh,trimZ-.057,trimZ+.045,glass);
  panel(x,y,.046,hh,trimZ-.085,trimZ-.012,shadow);
  panel(x,y-.03,w,.060,trimZ-.087,trimZ-.02,model.trim);
  panel(x,y-hh/2-.09,w+.24,.12,trimZ-.13,back,model.trim);
 };
 const second=h*.493,third=h*.773;
 for(const f of [.33,.67])window(f,second,1.00,1.82);
 for(const f of [.34,.66])window(f,third,.94,1.57);
 for(const f of model.windows)window(f,raised+1.15,.84,1.55);

 // The two unobscured houses show projecting ornamental fascia below the
 // upper windows and a pitched front silhouette. Side/rear roof forms stay GIS-based.
 const ledgeY=h*.678,ledgeW=width*.70,orn=support(mid,ledgeW);
 if(model.gable){
  panel(mid,ledgeY,ledgeW,.34,orn.front-.53,orn.back,model.ornament);
  panel(mid,ledgeY+.20,ledgeW+.12,.10,orn.front-.57,orn.back,model.trim);
  panel(mid,ledgeY-.22,ledgeW+.02,.095,orn.front-.53,orn.back,shadow);
  for(const f of [.24,.39,.61,.76]){
   const x=at(f),where=support(x,.105);
   panel(x,ledgeY-.30,.105,.28,orn.front-.43,where.back,shadow);
  }
 }
 const gable=(center,y,span,rise,front,back,color)=>{
  if(!T||!mesh)return;
  const shape=new T.Shape();
  shape.moveTo(-span/2,-.11);shape.lineTo(span/2,-.11);shape.lineTo(0,rise);shape.closePath();
  mesh(new T.ExtrudeGeometry(shape,{depth:back-front,bevelEnabled:false}),color,center,y,front);
 };
 if(model.gable&&T&&mesh){
  const w=width*.94,where=support(mid,w);
  gable(mid,h-.45,w,1.13,where.front-.10,where.back,model.finish);
  for(const side of [-1,1]){
   const edge=new T.Shape();
   edge.moveTo(side*w/2,-.03);edge.lineTo(0,1.17);edge.lineTo(0,1.04);
   edge.lineTo(side*w/2,-.16);edge.closePath();
   mesh(new T.ExtrudeGeometry(edge,{depth:.18,bevelEnabled:false}),model.trim,mid,h-.45,where.front-.14);
  }
 }

 const deckBack=support(mid,porchW).back,doorX=at(model.door),stairW=1.12;
 panel(mid,.35,porchW,.70,porchFront+.03,deckBack,model.ornament);
 panel(mid,.69,porchW,.12,porchFront,deckBack,gray);
 for(let i=1;i<=4;i++){
  const top=raised*i/4;
  panel(doorX,top/2,stairW,top,porchFront-(5-i)*.19,porchFront+.08,gray);
 }
 const door=support(doorX,1.11);
 panel(doorX,raised+1.04,1.13,2.18,door.front-.17,door.back,model.trim);
 panel(doorX,raised+1.04,.98,2.04,door.front-.225,door.front-.13,0x384b51);
 for(const f of [-.28,0,.28])panel(doorX+f,raised+1.04,.033,2.02,door.front-.258,door.front-.206,iron);
 const roofY=h*.322,porchA=mid-porchW/2,porchB=mid+porchW/2;
 panel(mid,roofY,porchW+.09,.20,porchFront-.08,deckBack,model.trim);
 panel(mid,roofY+.11,porchW+.12,.06,porchFront-.105,deckBack,shadow);
 if(model.porchGable)gable(mid,roofY+.07,porchW,.57,porchFront-.12,porchFront+.23,model.trim);
 for(const x of [porchA+.12,porchB-.12])panel(x,(roofY+raised)/2,.145,roofY-raised+.095,porchFront+.015,porchFront+.16,model.trim);
 for(const [a,b] of [[porchA+.10,doorX-stairW/2-.06],[doorX+stairW/2+.06,porchB-.10]]){
  if(b-a<.11)continue;
  for(const y of [raised+.15,raised+.80])panel((a+b)/2,y,b-a+.04,.062,porchFront+.05,porchFront+.12,iron);
  const n=Math.ceil((b-a)/.16);
  for(let i=0;i<=n;i++)panel(a+(b-a)*i/n,raised+.44,.028,.91,porchFront+.07,porchFront+.109,iron);
 }
}
