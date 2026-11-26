/** April 2025 Street View photographic sign sketches. Canvas is display-only;
 * before 3D printing, lettering must be converted to embossed vector relief.
 * The physically backed sign and its hidden supports remain solid geometry. */
export function paintDatedSign({T,mesh,x,y,z,width,height,fill,lines,emblem='',id}){
 if(typeof document==='undefined'||typeof document.createElement!=='function'||!T?.CanvasTexture||!T?.PlaneGeometry||!mesh)return false;
 const c=document.createElement('canvas');c.width=1536;c.height=320;
 const ctx=c.getContext('2d');if(!ctx)return false;
 ctx.fillStyle=fill;ctx.fillRect(0,0,c.width,c.height);
 const hasEmblem=Boolean(emblem);
 if(hasEmblem){
  ctx.save();ctx.translate(170,135);ctx.strokeStyle='#e8f3eb';ctx.lineWidth=11;
  ctx.beginPath();ctx.rect(-92,-91,180,171);ctx.stroke();
  for(let k=0;k<6;k++){
   ctx.beginPath();ctx.moveTo(-81,-63+k*26);ctx.lineTo(81,-100+k*26);ctx.stroke();
  }
  ctx.restore();
 }
 const start=hasEmblem?335:65;
 ctx.fillStyle='#f8f7eb';ctx.textAlign='left';ctx.textBaseline='middle';
 for(const [i,line] of lines.entries()){
  const yText=lines.length===3?[74,160,251][i]:lines.length===2?[113,225][i]:[160][i];
  ctx.font=(i===0&&lines.length>1?'bold 72px Georgia, serif':i===1?'bold 111px Georgia, serif':'bold 55px Arial, sans-serif');
  ctx.fillText(line,start,yText,1536-start-36);
 }
 const tex=new T.CanvasTexture(c);if(T.SRGBColorSpace)tex.colorSpace=T.SRGBColorSpace;
 const pane=mesh(new T.PlaneGeometry(width,height),0xffffff,x,y,z);
 if(!pane)return false;
 pane.material=new T.MeshBasicMaterial({map:tex,side:T.DoubleSide,toneMapped:false});
 pane.userData={...pane.userData,role:'dated-reference-sign-decal',buildingId:id,notPrintable:true};
 return true;
}
