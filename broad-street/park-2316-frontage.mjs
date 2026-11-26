// The 2316 permit identifies second- and third-floor front bays. The
// adjoining 2318 listing's streetscape informs the red masonry/dark cladding.
export function render2316ParkFrontage(plan,{T,box,mesh,wallAt}){
 const {left,width,z}=plan.facade,h=plan.height;
 const at=fraction=>left+width*fraction;
 const streetWall=wallAt(at(.55));
 const brick=0x975d49,metal=0x44494a,rib=0x66696a,trim=0xa7a59c;
 const glass=0x536870,concrete=0xa49c8c;
 const panel=(x,y,w,height,front,back,color)=>box(x,y,(front+back)/2,w,height,back-front,color);

 // The GIS body has a narrow streetward wing and a broad recessed front.
 // Texture only the latter's street face; rear and side materials are retained.
 const brickLeft=at(.183),brickRight=at(.987),brickW=brickRight-brickLeft;
 const skinFront=streetWall-.065,skinBack=streetWall+.055,skinHeight=h-.11;
 const skinX=(brickLeft+brickRight)/2,skinY=skinHeight/2;
 if(mesh&&T){
  const skin=new T.BoxGeometry(brickW,skinHeight,skinBack-skinFront);
  const uv=skin.getAttribute('uv'),pos=skin.getAttribute('position'),face=skin.groups[5];
  for(const vertex of new Set(skin.index.array.slice(face.start,face.start+face.count))){
   uv.setXY(vertex,pos.getX(vertex),skinY+pos.getY(vertex));
  }
  mesh(skin,brick,skinX,skinY,(skinFront+skinBack)/2,{brickFace:face.materialIndex});
 }else{
  panel(skinX,skinY,brickW,skinHeight,skinFront,skinBack,brick);
 }
 const wingX=at(.087),wingW=width*.156,wingFront=z-.045;
 panel(wingX,skinY,wingW,skinHeight,wingFront,z+.065,metal);
 for(let i=0;i<7;i++){
  panel(at(.022+i*.021),skinY,.022,skinHeight-.12,wingFront-.017,wingFront+.018,rib);
 }

 const bayX=at(.475),bayW=width*.46,bayFront=streetWall-.76;
 const bayH=2.46;
 for(const y of [h*.458,h*.742]){
  panel(bayX,y,bayW,bayH,bayFront,streetWall+.075,metal);
  for(const offset of [-1,1]){
   panel(bayX,y+offset*(bayH/2-.025),bayW+.08,.11,bayFront-.045,streetWall+.065,trim);
  }
  const windowX=bayX+.12;
  panel(windowX,y,1.55,1.72,bayFront-.09,bayFront+.065,0x343639);
  panel(windowX,y,1.42,1.58,bayFront-.146,bayFront-.065,glass);
  panel(windowX,y,.052,1.58,bayFront-.178,bayFront-.123,0x343639);
  for(let i=0;i<3;i++){
   panel(bayX-bayW/2+.10+i*.103,y,.024,2.14,bayFront-.025,bayFront+.021,rib);
  }
  panel(wingX,y,.46,1.56,wingFront-.067,wingFront+.032,0x343639);
  panel(wingX,y,.36,1.43,wingFront-.111,wingFront-.043,glass);
 }

 const entryX=at(.79),deck=.70,landingFront=streetWall-.77;
 panel(entryX,.34,1.28,.71,landingFront,streetWall+.045,concrete);
 for(let i=1;i<=4;i++){
  const top=deck*i/4;
  panel(entryX,top/2,1.12,top,landingFront-(5-i)*.24,landingFront+.07,concrete);
 }
 panel(entryX,deck+1.08,1.03,2.15,streetWall-.14,streetWall+.05,0x333638);
 panel(entryX,deck+1.08,.91,2.02,streetWall-.21,streetWall-.11,0x384b51);
 panel(entryX+.29,deck+1.07,.044,.17,streetWall-.24,streetWall-.19,trim);
 const groundX=at(.43);
 panel(groundX,deck+1.25,1.19,1.52,streetWall-.15,streetWall-.03,trim);
 panel(groundX,deck+1.25,1.06,1.39,streetWall-.201,streetWall-.125,glass);
}
