/** Photo-indexed architectural relief for two historic Broad Street facades.
 * This work intentionally preserves the exact GIS outer polygon and source
 * principal opening count. All teeth and glazing muntins are real 3D boxes.
 */
export function addHistoricCornice(box,{edge,roofHeight,color,shadow,frieze,dentils=22}){
 const w=edge.width-.055,x=edge.x,z=edge.z;
 if(w<2.4)throw Error('Historic cornice cannot fit source frontage');
 box(x,roofHeight-.96,z+.13,w,.18,.34,shadow);
 box(x,roofHeight-.80,z+.18,w,.21,.45,frieze);
 box(x,roofHeight-.60,z+.24,w,.25,.52,color);
 box(x,roofHeight-.38,z+.28,w,.21,.59,shadow);
 box(x,roofHeight-.21,z+.25,w,.23,.63,color);
 box(x,roofHeight-.06,z+.21,w,.13,.67,frieze);
 for(let j=0;j<dentils;j++){
  const xx=edge.left+.13+(edge.width-.26)*(j+.5)/dentils;
  box(xx,roofHeight-.77,z+.43,.085,.21,.18,shadow);
 }
}
export function addWhiteSash(box,opening,{color=0xe4e4dd}){
 const o=opening,z=o.z+.48;
 // Model individual glazing muntins: not extra windows.
 for(const side of [-1,1])box(o.x+side*o.w*.44,o.y,z,.062,o.h*.95,.10,color);
 box(o.x,o.y-.11,z+.013,o.w*.94,.058,.105,color);
 for(const d of [o.h*.18,o.h*.39])box(o.x,o.y+d,z+.01,o.w*.92,.033,.105,color);
 box(o.x,o.y,z+.01,.035,o.h*.96,.105,color);
}
