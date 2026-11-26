// PAPH2441728 and the address-matched Unit 2R exterior show the contemporary
// cladding, raised street entry and upper balcony. Dimensions are estimated.
export function render2318ParkFrontage(plan,{box,wallAt}){
 const {left,right,width,z}=plan.facade,height=plan.height;
 const at=fraction=>left+width*fraction;
 const wall=Math.max(wallAt(at(.05)),wallAt(at(.5)),wallAt(at(.95)));
 const cream=0xbfb5a2,grey=0x7f8b8d,dark=0x3c3936,white=0xdaddd6;
 const concrete=0x9d9a90,glass=0x536870;
 const panel=(x,y,w,h,front,back,color)=>box(x,y,(front+back)/2,w,h,back-front,color);
 const span=(a,b,y,h,front,back,color)=>panel((a+b)/2,y,b-a,h,front,back,color);
 const skin=(a,b,low,high,projection,color)=>span(at(a),at(b),(low+high)/2,high-low,z-projection,wall+.04,color);
 const upper=height-.18;

 skin(.015,.985,0,upper,.065,cream);
 skin(.034,.39,.80,upper,.085,grey);
 skin(.64,.966,.80,upper,.085,dark);
 // Corrugation is modeled as shallow relief at frontage scale.
 for(let i=0;i<17;i++){
  const x=at(.045)+i*width*.020;
  panel(x,(upper+.80)/2,.023,upper-.80,z-.103,z-.069,0x93a0a1);
 }
 for(let i=0;i<11;i++){
  const x=at(.653)+i*width*.029;
  panel(x,(upper+.80)/2,.021,upper-.80,z-.099,z-.072,0x534840);
 }
 skin(.018,.98,upper-.20,upper,.118,0xb2aa9a);

 const raised=.84,entryX=at(.205),entryW=1.12,deckFront=z-.87;
 panel(entryX,.40,entryW+.24,.80,deckFront,wall+.04,concrete);
 panel(entryX,.80,entryW+.26,.11,deckFront,wall+.04,concrete);
 for(let i=1;i<=4;i++){
  const top=raised*i/4;
  panel(entryX,top/2,entryW,top,deckFront-(5-i)*.245,deckFront+.06,concrete);
 }
 panel(entryX,raised+1.08,1.07,2.16,z-.18,wall+.025,dark);
 panel(entryX,raised+1.07,.92,2.08,z-.225,z-.15,0x384b51);
 panel(entryX+.28,raised+1.01,.045,.18,z-.25,z-.20,white);

 const frame=(x,y,w,h,rail)=>{
  panel(x,y,w+.12,h+.12,z-.175,z-.058,rail);
  panel(x,y,w,h,z-.23,z-.15,glass);
  panel(x,y,.052,h,z-.25,z-.20,rail);
 };
 const second=height*.437,third=height*.744;
 frame(at(.749),raised+1.13,1.58,1.55,white);
 frame(at(.209),second,1.34,2.07,0x302f2d);
 frame(at(.495),second+.10,.62,1.92,dark);
 frame(at(.756),second-.03,1.59,2.12,white);
 frame(at(.210),third,1.24,1.76,0x302f2d);
 frame(at(.498),third+.14,.61,1.84,dark);
 frame(at(.758),third-.02,1.61,1.82,white);

 const balconyY=second-1.13,balconyX=at(.762),balconyW=1.94;
 const balconyA=balconyX-balconyW/2,balconyB=balconyX+balconyW/2,balconyFront=z-.87;
 panel(balconyX,balconyY,balconyW,.17,balconyFront,wall+.045,concrete);
 for(const y of [balconyY+.18,balconyY+.98]){
  span(balconyA,balconyB,y,.066,balconyFront,balconyFront+.078,white);
  for(const x of [balconyA+.037,balconyB-.037])panel(x,y,.074,.066,balconyFront+.015,z-.045,white);
 }
 for(let i=0;i<=11;i++){
  const x=balconyA+.035+i*(balconyW-.07)/11;
  panel(x,balconyY+.51,.040,.95,balconyFront+.018,balconyFront+.064,white);
 }
 for(const x of [balconyA+.037,balconyB-.037]){
  for(const d of [.20,.35,.50,.65])panel(x,balconyY+.51,.040,.95,balconyFront+d,balconyFront+d+.042,white);
 }
}
