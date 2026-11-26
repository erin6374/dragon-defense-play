// Bright MLS PAPH2096128, sold in May 2022. Model the photographed street face.
export const PARK_2428={address:'2428 N PARK AVE',brick:0xae8c68,porchBrick:0xba9d79,door:0xd0c8ba,rail:0x403c37,awning:0x786b63};

export function render2428Frontage(plan,{T,box,mesh,wallAt}){
 const {left,right,width}=plan.facade;
 const height=plan.height,mid=(left+right)/2,at=f=>left+f*width;
 const streetX=x=>left+right-x;
 const depth=wallAt(mid),back=depth+.14,front=depth-1.34;
 const deck=.82,white=0xd8d3c9,brown=0x885b40,glass=0x536870;
 const panel=(x,y,w,h,z1,z2,color)=>box(streetX(x),y,(z1+z2)/2,w,h,z2-z1,color);
 const run=(x1,x2,y,h,z1,z2,color)=>panel((x1+x2)/2,y,x2-x1,h,z1,z2,color);
 const skin=(x,y,w,h,z1,z2,color)=>{
  if(!T||!mesh){panel(x,y,w,h,z1,z2,color);return;}
  const geometry=new T.BoxGeometry(w,h,z2-z1);
  const uv=geometry.getAttribute('uv'),position=geometry.getAttribute('position');
  const face=geometry.groups[5];
  for(const i of new Set(geometry.index.array.slice(face.start,face.start+face.count))){
   uv.setXY(i,position.getX(i),position.getY(i)+h/2);
  }
  mesh(geometry,color,streetX(x),y,(z1+z2)/2,{brickFace:face.materialIndex});
 };
 const sloped=(x,w,y,z,d,rise,h,color)=>{
  if(!T||!mesh)return;
  const geometry=new T.BoxGeometry(w,h,Math.hypot(d,rise));
  geometry.rotateX(-Math.atan2(rise,d));
  mesh(geometry,color,streetX(x),y,z);
 };
 const awning=(x,w,low,z1,z2,rise)=>{
  const d=z2-z1,y=low+rise/2,z=(z1+z2)/2;
  sloped(x,w,y,z,d,rise,.076,PARK_2428.awning);
  for(const f of [-.39,-.32,.32,.39])sloped(x+f*w,.045,y+.045,z,d,rise,.033,white);
  panel(x,low-.015,w,.074,z1-.025,z1+.083,white);
  if(!T||!mesh)return;
  const count=Math.ceil(w/.21),step=w/count;
  const scallop=new T.Shape();
  scallop.moveTo(-step/2,.02);scallop.lineTo(step/2,.02);
  scallop.quadraticCurveTo(0,-.11,-step/2,.02);
  for(let i=0;i<count;i++){
   mesh(new T.ExtrudeGeometry(scallop,{depth:.051,bevelEnabled:false}),white,streetX(x-w/2+(i+.5)*step),low-.024,z1-.026);
  }
 };
 skin(mid,height/2,width-.07,height,depth-.043,back,PARK_2428.brick);
 panel(mid,height-.185,width-.08,.32,depth-.20,back,0x625b56);
 panel(mid,height-.395,width-.12,.13,depth-.16,back,brown);
 for(let i=0;i<21;i++)panel(at(.07+.043*i),height-.50,.108,.153,depth-.18,back,0xa28162);
 for(const f of [.043,.958]){
  panel(at(f),height*.58,.29,height*.75,depth-.14,back,0x9d7957);
  for(let i=0;i<7;i++)panel(at(f),height*.44+i*.117,.32,.060,depth-.18,back,0xab8764);
 }
 panel(mid,height*.525,width*.89,.14,depth-.12,back,brown);
 panel(mid,1.14,width*.9,.63,depth-.075,back,brown);
 const sash=(f,y,w,h)=>{
  const x=at(f);
  panel(x,y,w+.12,h+.12,depth-.14,back,white);
  panel(x,y,w,h,depth-.199,depth-.10,glass);
  panel(x,y,w+.03,.035,depth-.212,depth-.151,white);
  panel(x,y-h/2-.058,w+.18,.085,depth-.216,back,white);
 };
 for(const f of [.29,.72]){
  const y=height*.645;
  sash(f,y,.94,1.53);
  awning(at(f),1.19,y+.61,depth-.72,depth+.067,.66);
 }
 for(const f of [.24,.47])sash(f,deck+1.08,.83,1.50);
 const entry=at(.76);
 panel(entry,deck+1.05,1.09,2.16,depth-.16,back,brown);
 panel(entry,deck+1.025,.88,2.04,depth-.204,depth-.14,PARK_2428.door);
 for(const y of [deck+.21,deck+1.02,deck+1.99])panel(entry,y,.92,.045,depth-.245,depth-.181,PARK_2428.rail);
 for(let i=0;i<7;i++)panel(entry+(i-3)*.138,deck+1.02,.029,1.99,depth-.244,depth-.18,PARK_2428.rail);
 const stairStart=at(.078),landing=at(.32),end=at(.978);
 skin((landing+end)/2,.392,end-landing,.784,front,back,PARK_2428.porchBrick);
 run(landing-.048,end,deck-.042,.103,front-.027,back,0xb6a795);
 for(let i=0;i<5;i++){
  const start=stairStart+(landing-stairStart)*i/5,top=deck*(i+1)/5;
  run(start,landing+.06,top/2,top,front+.012,back,PARK_2428.porchBrick);
 }
 panel(at(.65),.33,.77,.43,front-.08,front+.067,0x49443c);
 for(let i=0;i<9;i++)panel(at(.65)+(i-4)*.077,.33,.021,.45,front-.104,front-.044,PARK_2428.rail);
 const railZ=front+.102,railH=.67,landingRailEnd=end-.07;
 for(const y of [deck+.09,deck+railH])run(landing-.07,landingRailEnd,y,.049,railZ-.021,railZ+.022,PARK_2428.rail);
 for(let i=0;i<=17;i++)panel(landing+(landingRailEnd-landing)*i/17,deck+.34,.025,.69,railZ-.025,railZ+.026,PARK_2428.rail);
 for(let i=0;i<5;i++){
  const x=stairStart+(landing-stairStart)*(i+.44)/5,y=deck*(i+1)/5;
  panel(x,y+railH/2,.034,railH+.05,railZ-.025,railZ+.026,PARK_2428.rail);
 }
 if(T&&mesh){
  const runWidth=landing-stairStart;
  const handrail=new T.BoxGeometry(Math.hypot(runWidth,deck),.056,.049);
  handrail.rotateZ(-Math.atan2(deck,runWidth));
  mesh(handrail,PARK_2428.rail,streetX((landing+stairStart)/2),railH+deck/2,railZ);
 }
 const awningWidth=width*.938;
 awning(mid,awningWidth,deck+1.98,front-.12,depth+.12,.72);
 panel(mid,deck+2.68,awningWidth,.13,depth-.12,back,brown);
}
