/** Property-record confirmed material type only. No claim about actual hue,
 * bond, brick size, mortar, condition, or the date of the exterior finish. */
export const BOSTON_BRICK_EVIDENCE=Object.freeze({
 '1328 W BOSTON ST':'https://www.redfin.com/PA/Philadelphia/1328-W-Boston-St-19132/home/39050665',
 '1341 W BOSTON ST':'https://www.zillow.com/homedetails/1341-W-Boston-St-Philadelphia-PA-19132/10375022_zpid/',
 '1344 W BOSTON ST':'https://www.trulia.com/home/1344-w-boston-st-philadelphia-pa-19132-10375013',
 '1345 W BOSTON ST':'https://www.redfin.com/PA/Philadelphia/1345-W-Boston-St-19132/home/39050674'
});
export const hasDocumentedBrick=name=>Object.hasOwn(BOSTON_BRICK_EVIDENCE,name);
// WorldUVGenerator for ExtrudeGeometry gives meter-scaled side UV coordinates.
// Eight courses and eight bricks per tile; half-brick offset on alternating courses.
// Illustrative running bond, not a measured elevation or photographic texture.
export function createBrickWallMaterial(T,shade){
 const width=256,height=128,data=new Uint8Array(width*height*4);
 const base=[(shade>>>16)&255,(shade>>>8)&255,shade&255];
 const mortar=base.map(v=>Math.round(v*.68+190*.32));
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const course=Math.floor(y/16),shift=(course%2)*16,brick=Math.floor(((x+shift)%width)/32);
  const joint=(y%16===0||y%16===15||(x+shift)%32<2);
  const variation=((brick*37+course*59+brick*course*13)%17)-8;
  const grain=((x*73+y*151+x*y*11)%7)-3;
  const i=(y*width+x)*4;
  for(let c=0;c<3;c++)data[i+c]=Math.max(0,Math.min(255,(joint?mortar[c]:base[c]+variation)+grain));
  data[i+3]=255;
 }
 const map=new T.DataTexture(data,width,height,T.RGBAFormat,T.UnsignedByteType);
 map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;
 map.repeat.set(1/(8*.215),1/(8*.075));map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;
 map.generateMipmaps=true;map.anisotropy=4;map.needsUpdate=true;
 const m=new T.MeshStandardMaterial({color:0xffffff,map,roughness:.94});
 m.name='Boston masonry | illustrative running bond';return m;
}
