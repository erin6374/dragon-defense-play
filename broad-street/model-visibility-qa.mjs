/** Pure screenshot parity QA. A textured street/background cannot prove the
 * specific building was drawn. Compare identical camera frames with the
 * building visible and with ONLY building meshes hidden. */
export function modelVisiblePixelCount(full,hidden,width,height,threshold=28){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1)
  throw Error('Invalid frame dimensions');
 const length=width*height*4;
 if(!full||!hidden||full.length!==length||hidden.length!==length)
  throw Error('RGBA frame sizes do not match');
 let count=0;
 for(let i=0;i<length;i+=4){
  const diff=(Math.abs(full[i]-hidden[i])+Math.abs(full[i+1]-hidden[i+1])+Math.abs(full[i+2]-hidden[i+2]))/3;
  if(diff>=threshold)count++;
 }
 return {count,fraction:count/(width*height)};
}
export function assertModelVisible(full,hidden,width,height,{threshold=28,minFraction=.015}={}){
 const result=modelVisiblePixelCount(full,hidden,width,height,threshold);
 if(result.fraction<minFraction)
  throw Error('Building is missing/too small in screenshot ('+(result.fraction*100).toFixed(2)+'% distinct pixels)');
 return result;
}
