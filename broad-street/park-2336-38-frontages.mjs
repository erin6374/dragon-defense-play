// Numbered listing photos independently show the matched rowhouse pair.
// The canopy spans both houses. Each half meets the common GIS party line.
export const PARK_2336_38_MASONRY=0xae7b55;
export const PARK_2336_38_PORCH={joint:-461.04,front:-110.38,roofHeight:3.72,deckHeight:.80,gableHalfWidth:2.12};

export function render2336And2338Frontage(plan,{T,box,mesh,wallAt}){
 const is2336=plan.address==='2336 N PARK AVE';
 const {left,right,width}=plan.facade,height=plan.height;
 const {joint,front,roofHeight,deckHeight,gableHalfWidth}=PARK_2336_38_PORCH;
 const at=f=>left+f*width;
 const side=is2336?1:-1,mid=at(.5);
 const white=0xd9d1bd,stone=0xbfb29a,iron=0x41443c,glass=0x536870;
 const brick=PARK_2336_38_MASONRY,paint=is2336?0xb8a163:0xa87b66,concrete=0x99958c;
 const panel=(x,y,w,h,f,b,c)=>box(x,y,(f+b)/2,w,h,b-f,c);
 const span=(a,b,y,h,f,back,c)=>panel((a+b)/2,y,b-a,h,f,back,c);
 const support=(x,w)=>{
  const zs=[-.44,0,.44].map(k=>wallAt(x+w*k));
  return {front:Math.min(...zs),back:Math.max(...zs)+.06};
 };
 const profile=(points,x,y,f,b,c)=>{
  if(!T||!mesh)return;
  const shape=new T.Shape();
  points.forEach(([dx,dy],i)=>i?shape.lineTo(dx,dy):shape.moveTo(dx,dy));
  shape.closePath();
  mesh(new T.ExtrudeGeometry(shape,{depth:b-f,bevelEnabled:false}),c,x,y,f);
 };

 // Keep the slight step in the existing GIS street face.
 const split=is2336?.575:.515;
 for(const [a,b] of [[.018,split],[split,.982]]){
  const x=(at(a)+at(b))/2,w=at(b)-at(a),wall=support(x,w),f=wall.front-.055;
  const hh=height-roofHeight,y=(height+roofHeight)/2;
  if(T&&mesh){
   const skin=new T.BoxGeometry(w,hh,wall.back-f);
   const uv=skin.getAttribute('uv'),pos=skin.getAttribute('position'),face=skin.groups[5];
   for(const vertex of new Set(skin.index.array.slice(face.start,face.start+face.count))){
    uv.setXY(vertex,x-joint+pos.getX(vertex),y+pos.getY(vertex));
   }
   mesh(skin,brick,x,y,(f+wall.back)/2,{brickFace:face.materialIndex});
  }else panel(x,y,w,hh,f,wall.back,brick);
  panel(x,roofHeight/2,w,roofHeight,f,wall.back,paint);
 }
 const wall=support(mid,width*.94);
 for(const [y,thick] of [[height*.37,.12],[height*.63,.20],[height*.91,.13]]){
  panel(mid,y,width*.945,thick,wall.front-.14,wall.back,white);
 }

 const window=(f,y,w,h,barred=false)=>{
  const x=at(f),anchor=support(x,w+.19),frameZ=anchor.front-.17;
  panel(x,y,w+.18,h+.18,frameZ,anchor.back,white);
  panel(x,y,w,h,frameZ-.062,frameZ+.04,glass);
  panel(x,y-.04,w,.052,frameZ-.087,frameZ-.025,white);
  panel(x,y-h/2-.072,w+.16,.11,frameZ-.12,anchor.back,stone);
  if(barred){
   for(let i=-2;i<=2;i++)panel(x+i*w*.157,y,.027,h,frameZ-.106,frameZ-.04,iron);
   panel(x,y+.23,w,.035,frameZ-.115,frameZ-.04,iron);
  }
 };
 const porchAwning=roofHeight+.08;
 const groundY=deckHeight+1.21,secondY=height*.496,thirdY=height*.794;
 for(const f of (is2336?[.56,.79]:[.23,.47]))window(f,groundY,.81,1.58,true);
 const upperSpacing=is2336?.154:.118;
 for(const f of [.5-upperSpacing,.5+upperSpacing]){
  window(f,secondY,.97,1.76);
  window(f,thirdY,.90,1.67);
 }

 const eaveY=height-.17,upperW=width*.955;
 if(is2336){
  panel(mid,eaveY,upperW,.27,wall.front-.21,wall.back,stone);
  for(const f of [.065,.935])panel(at(f),eaveY+.13,.25,.52,wall.front-.24,wall.back,brick);
  panel(mid,thirdY+1.00,width*.56,.17,wall.front-.20,wall.back,white);
 }else{
  const g=width*.465;
  const curve=[[-g,-.13],[-g*.91,.28],[-g*.71,.70],[-g*.36,1.19],[0,1.60],[g*.36,1.19],[g*.71,.70],[g*.91,.28],[g,-.13]];
  profile(curve,mid,height-.73,wall.front-.105,wall.back,brick);
  for(let i=1;i<curve.length;i++){
   const [ax,ay]=curve[i-1],[bx,by]=curve[i];
   profile([[ax,ay+.05],[bx,by+.05],[bx,by-.095],[ax,ay-.095]],mid,height-.73,wall.front-.16,wall.front+.035,white);
  }
  const arch=width*.29;
  profile([[-arch,0],[-arch*.80,.26],[0,.49],[arch*.80,.26],[arch,0],[arch*.86,-.10],[0,.31],[-arch*.86,-.10]],mid,thirdY+.73,wall.front-.19,wall.back,stone);
  const y=height*.652,plaqueW=width*.56;
  panel(mid,y,plaqueW,.75,wall.front-.24,wall.back,white);
  for(const dx of [-.47,.47])profile([[0,.25],[.25,0],[0,-.25],[-.25,0]],mid+dx,y,wall.front-.28,wall.front-.18,stone);
 }

 const doorX=at(is2336?.22:.78),stairW=1.42;
 const a=is2336?joint:left+.10,b=is2336?right-.10:joint;
 const back=support(mid,width*.91).back;
 span(a,b,.39,.78,front+.025,back,paint);
 span(a,b,.777,.10,front,back,concrete);
 for(let i=1;i<=4;i++){
  const top=deckHeight*i/4;
  panel(doorX,top/2,stairW,top,front-(5-i)*.228,front+.075,concrete);
 }
 const door=support(doorX,1.15),df=door.front-.17;
 panel(doorX,deckHeight+1.15,1.15,2.32,df,door.back,white);
 panel(doorX,deckHeight+.984,.97,1.97,df-.065,df+.035,is2336?0xb4aea3:0x3d3047);
 panel(doorX,deckHeight+2.118,.91,.255,df-.062,df+.025,0x454643);
 panel(doorX+.33,deckHeight+.99,.038,.16,df-.093,df-.048,stone);

 span(a,b,roofHeight,.24,front-.075,back,white);
 span(a,b,porchAwning+.07,.065,front-.115,back,0x6b685e);
 // One shallow gable for the two entrances, split exactly at the party line.
 const gableFace=front-.175;
 profile([[0,-.06],[0,.69],[side*gableHalfWidth,-.015],[side*gableHalfWidth,-.09]],joint,porchAwning,gableFace,front+.68,white);
 profile([[0,0],[0,.54],[side*(gableHalfWidth-.30),0]],joint,porchAwning,gableFace-.026,gableFace+.028,0x777367);
 for(let i=1;i<=10;i++){
  const p=i*(gableHalfWidth-.34)/11,tall=.50*(1-p/(gableHalfWidth-.30));
  panel(joint+side*p,porchAwning+tall/2,.032,tall,gableFace-.042,gableFace-.013,white);
 }

 const pierNear=doorX+side*(stairW/2+.31),pierOuter=is2336?b-.24:a+.24;
 for(const x of [pierNear,pierOuter]){
  panel(x,deckHeight+.32,.38,.70,front-.012,front+.39,paint);
  panel(x,deckHeight+.655,.42,.095,front-.045,front+.43,white);
  for(const dx of (x===pierNear?[-.085,.085]:[0])){
   const baseY=deckHeight+.67;
   panel(x+dx,(roofHeight+baseY)/2,.116,roofHeight-baseY+.13,front+.062,front+.201,white);
   panel(x+dx,roofHeight-.195,.164,.15,front+.037,front+.228,white);
  }
 }
 const railA=Math.min(pierNear,pierOuter),railB=Math.max(pierNear,pierOuter);
 for(const y of [deckHeight+.20,deckHeight+.67])span(railA,railB,y,.059,front+.098,front+.167,white);
 const posts=Math.ceil((railB-railA)/.145);
 for(let i=1;i<posts;i++)panel(railA+(railB-railA)*i/posts,deckHeight+.411,.047,.49,front+.113,front+.153,white);
 if(!is2336){
  const labelY=deckHeight+.38;
  panel(pierNear,labelY,.29,.115,front-.052,front+.035,stone);
  const strokes=[[0,.035,.033,.009],[.017,.018,.009,.033],[.017,-.018,.009,.033],[0,-.036,.033,.009],[-.017,-.018,.009,.033],[-.017,.018,.009,.033],[0,0,.033,.009]];
  const digits=[[0,1,6,4,3],[0,1,2,3,6],[0,1,2,3,6],[0,1,2,3,4,5,6]];
  digits.forEach((parts,d)=>{
   for(const i of parts){
    const [dx,dy,w,h]=strokes[i];
    panel(pierNear+(.5-d)*.062+.062+dx,labelY+dy,w,h,front-.062,front-.046,iron);
   }
  });
 }
}
