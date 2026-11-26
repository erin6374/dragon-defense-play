// The 2350 sale photo shows the paired 2352 street number. A numbered 2356
// photo establishes that home's entry and adjacent masonry at close range.
export const PARK_2350_56_FRONTAGES=Object.freeze({
 '2350 N PARK AVE':{finish:0x853f31,door:0x694632,steps:6,rise:.176,full:true,fanlight:true},
 '2352 N PARK AVE':{finish:0x8c4436,door:0x385363,steps:5,rise:.170,full:true,fanlight:false},
 '2356 N PARK AVE':{finish:0x89483b,door:0x353638,steps:5,rise:.173,full:false,fanlight:true}
});

export function render2350To2356Frontage(plan,{T,box,mesh,wallAt}){
 const spec=PARK_2350_56_FRONTAGES[plan.address];
 const {left,width}=plan.facade,h=plan.height;
 const at=f=>left+width*f,mid=at(.5),white=0xd9d7cc,stone=0xbfb9a9,iron=0x363638;
 const glass=0x536870,concrete=0xaca293,doorX=at(.24),groundX=at(.655);
 const deck=spec.steps*spec.rise,tread=.225,stairW=1.14;
 const panel=(x,y,w,hh,front,back,c)=>box(x,y,(front+back)/2,w,hh,back-front,c);
 const support=(x,w)=>{
  const positions=[-.44,0,.44].map(k=>wallAt(x+w*k));
  return {front:Math.min(...positions),back:Math.max(...positions)+.055};
 };
 const masonry=(x,y,w,hh,extra,soldier=false)=>{
  const wall=support(x,w),f=wall.front-extra,d=wall.back-f;
  if(!T||!mesh){panel(x,y,w,hh,f,wall.back,spec.finish);return;}
  const g=new T.BoxGeometry(w,hh,d),uv=g.getAttribute('uv'),pos=g.getAttribute('position'),face=g.groups[5];
  for(const i of new Set(g.index.array.slice(face.start,face.start+face.count))){
   const px=x-mid+pos.getX(i),py=y+pos.getY(i);
   uv.setXY(i,soldier?py:px,soldier?px:py);
  }
  mesh(g,spec.finish,x,y,(f+wall.back)/2,{brickFace:face.materialIndex});
 };
 const skinHeight=spec.full?h-.1:4.02;
 masonry(mid,skinHeight/2,width*.976,skinHeight,.065);
 if(spec.full)masonry(mid,h*.393,width*.968,.203,.091,true);

 const window=(x,y,w,wh,{lower=false,divided=false,basement=false}={})=>{
  const wall=support(x,w+.24),face=wall.front-.14;
  panel(x,y,w+.115,wh+.12,face,wall.back,white);
  panel(x,y,w,wh,face-.055,face+.03,basement?0x63747a:glass);
  panel(x,y,w,.041,face-.083,face-.025,white);
  panel(x,y+wh/2+.09,w+.23,.13,face-.081,wall.back,stone);
  panel(x,y-wh/2-.063,w+.19,.088,face-.105,wall.back,stone);
  if(divided){
   const gridColor=lower?white:0xd2d0c6;
   panel(x,y,lower?.052:.033,wh,face-.087,face-.022,gridColor);
   for(const offset of [-.31,.31])panel(x+w*offset,y+wh*.25,.021,wh*.48,face-.086,face-.022,gridColor);
   panel(x,y+wh*.29,w,.028,face-.088,face-.024,gridColor);
  }else if(lower||basement)panel(x,y,.047,wh,face-.086,face-.023,white);
 };
 const sixStep=spec.steps===6;
 if(spec.full){
  for(const f of [.25,.70]){
   window(at(f),h*.540,.92,1.65,{divided:sixStep});
   // Upper sash retains the established two-opening rhythm above the photo crop.
   window(at(f),h*.803,.91,1.51,{divided:sixStep});
  }
  window(groundX,.39,width*.29,.43,{basement:true});
 }
 window(groundX,deck+.99,Math.min(width*.38,1.88),1.53,{lower:true,divided:sixStep||!spec.full});

 const door=support(doorX,1.16),df=door.front-.17,entryY=deck+1.05;
 panel(doorX,entryY,1.13,2.15,df,door.back,stone);
 panel(doorX,entryY,.96,2.10,df-.065,df+.033,spec.door);
 panel(doorX,deck+2.19,1.23,.15,df-.082,door.back,stone);
 const relief=sixStep?0x805c45:spec.full?0x496171:0x44464a;
 for(const dy of [-.47,.13])for(const dx of [-.237,.237])panel(doorX+dx,entryY+dy,.28,.42,df-.086,df-.049,relief);
 panel(doorX+.35,entryY-.07,.054,.12,df-.092,df-.047,stone);
 if(spec.fanlight&&T&&mesh){
  const fan=new T.Shape();
  fan.moveTo(-.337,0);
  for(let i=0;i<=10;i++){
   const theta=Math.PI*(1-i/10);
   fan.lineTo(.337*Math.cos(theta),.278*Math.sin(theta));
  }
  fan.closePath();
  mesh(new T.ExtrudeGeometry(fan,{depth:.047,bevelEnabled:false}),0x738692,doorX,entryY+.61,df-.089);
  for(let i=1;i<4;i++){
   const theta=i*Math.PI/4;
   const spoke=new T.BoxGeometry(.022,1,.033);
   spoke.scale(1,Math.hypot(Math.cos(theta)*.328,Math.sin(theta)*.265),1);
   spoke.rotateZ(-Math.atan2(Math.cos(theta)*.328,Math.sin(theta)*.265));
   mesh(spoke,relief,doorX+Math.cos(theta)*.164,entryY+.61+Math.sin(theta)*.1325,df-.090);
  }
 }
 if(!spec.full)panel(doorX,deck+.19,.87,.252,df-.091,df-.036,0xb8b9b7);
 if(!sixStep){
  const px=spec.full?doorX+.71:doorX,py=entryY+.033;
  if(spec.full)panel(px,py,.095,.355,df-.055,door.back,iron);
  const displayZ=spec.full?df-.055:df-.065;
  const strokes=[[0,.032,.033,.007],[.0165,.016,.007,.029],[.0165,-.016,.007,.029],[0,-.032,.033,.007],[-.0165,-.016,.007,.029],[-.0165,.016,.007,.029],[0,0,.033,.007]];
  const digits=[[0,1,6,4,3],[0,1,6,2,3],[0,5,6,2,3],spec.full?[0,1,6,4,3]:[0,5,6,4,2,3]];
  digits.forEach((parts,d)=>{
   for(const i of parts){
    const [dx,dy,w,hh]=strokes[i];
    panel(px+dx,py+(.1-.073*d)+dy,w,hh,displayZ-.014,displayZ+.009,white);
   }
  });
 }

 const landing=door.front-.57;
 panel(doorX,deck/2,stairW+.13,deck,landing,door.back,concrete);
 for(let i=1;i<=spec.steps;i++){
  const top=spec.rise*i;
  panel(doorX,top/2,stairW,top,landing-(spec.steps+1-i)*tread,landing+.072,concrete);
 }
 for(const side of (spec.full?[-1,1]:[1])){
  const x=doorX+side*(stairW/2-.047),start=landing-(spec.steps-.5)*tread;
  for(let i=0;i<spec.steps;i++){
   const stepTop=spec.rise*(i+1),z=start+i*tread;
   panel(x,stepTop+.394,.035,.84,z-.022,z+.022,iron);
  }
  if(T&&mesh){
   const dz=tread*(spec.steps-1),dy=spec.rise*(spec.steps-1);
   const topBar=new T.BoxGeometry(.054,.06,Math.hypot(dz,dy)+.087);
   topBar.rotateX(-Math.atan2(dy,dz));
   mesh(topBar,iron,x,spec.rise+.788+dy/2,start+dz/2);
  }
 }
}
