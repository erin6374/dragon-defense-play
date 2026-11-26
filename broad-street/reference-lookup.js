// Link-only discovery. Geographic candidates are NEVER silently treated as verified.
const KEY='broad-street-reference-lookup-v1';
export const loadLookup=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
export const saveLookup=data=>localStorage.setItem(KEY,JSON.stringify(data));
const deg=Math.PI/180;
export function approximatePosition(building,anchor,bearing){
  if(!anchor||!Number.isFinite(+anchor.lat)||!Number.isFinite(+anchor.lon))return null;
  // Game x axis points along Broad Street, z across; user-calibrated compass bearing.
  const theta=+bearing*deg, north=building.x*Math.cos(theta)-building.z*Math.sin(theta),east=building.x*Math.sin(theta)+building.z*Math.cos(theta);
  const lat=+anchor.lat+north/111132,lon=+anchor.lon+east/(111320*Math.cos(+anchor.lat*deg));
  return {lat,lon,accuracy:'Estimated from RC86 game coordinates; NOT a surveyed location'};
}
export function streetLinks({lat,lon},address=''){
  const p=`${lat.toFixed(6)},${lon.toFixed(6)}`;
  return [
    {name:'Google Street View',url:`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${encodeURIComponent(p)}`,note:'Opens Google imagery at nearby viewpoint; may show a different building'},
    {name:'Google Maps address search',url:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address||p)}`,note:'Confirm address and facade manually'},
    {name:'Mapillary street imagery',url:`https://www.mapillary.com/app/?lat=${lat.toFixed(6)}&lng=${lon.toFixed(6)}&z=18`,note:'Coverage varies; original attribution remains with provider'},
    {name:'OpenStreetMap',url:`https://www.openstreetmap.org/?mlat=${lat.toFixed(6)}&mlon=${lon.toFixed(6)}#map=19/${lat.toFixed(6)}/${lon.toFixed(6)}`,note:'Inspect footprints and address tags'},
    {name:'Wikimedia Commons image search',url:`https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(address||'North Broad Street Philadelphia')}&title=Special:MediaSearch&type=image`,note:'Inspect licenses and whether image depicts correct facade'}
  ];
}
export async function geocodeSchool(){
  // One user-triggered request; OSM Nominatim requires identifiable app UA and max 1 request/sec.
  const url='https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&addressdetails=1&q='+encodeURIComponent('2221 North Broad Street, Philadelphia, Pennsylvania, USA');
  const res=await fetch(url,{headers:{Accept:'application/json'}});if(!res.ok)throw Error('Geocoding HTTP '+res.status);
  const data=await res.json();return data.filter(x=>Number.isFinite(+x.lat)&&Number.isFinite(+x.lon)).map(x=>({lat:+x.lat,lon:+x.lon,label:x.display_name,type:x.type}));
}
export async function osmFootprints(lat,lon,radius=160){
  // Explicit user action only. OSM Overpass is not a guaranteed service.
  const q=`[out:json][timeout:20];(way["building"](around:${radius},${lat},${lon}););out center tags;`;
  const res=await fetch('https://overpass.kumi.systems/api/interpreter',{method:'POST',body:new URLSearchParams({data:q})});
  if(!res.ok)throw Error('OSM footprints HTTP '+res.status);
  const data=await res.json();return (data.elements||[]).filter(x=>x.center).map(x=>({id:x.id,lat:x.center.lat,lon:x.center.lon,address:[x.tags?.['addr:housenumber'],x.tags?.['addr:street']].filter(Boolean).join(' '),name:x.tags?.name||'',source:'© OpenStreetMap contributors · ODbL',url:`https://www.openstreetmap.org/way/${x.id}`}));
}
export function nearbyCandidates(point,footprints,maxMeters=40){
  return footprints.map(f=>{const dn=(f.lat-point.lat)*111132,de=(f.lon-point.lon)*111320*Math.cos(point.lat*deg),distance=Math.hypot(dn,de);return {...f,distance:Math.round(distance*10)/10}}).filter(f=>f.distance<=maxMeters).sort((a,b)=>a.distance-b.distance).slice(0,5);
}
export function confidenceLabel(match,point){
  if(!match)return 'Unverified · no geographic match';
  if(match.manualVerified)return 'User-verified reference';
  if(match.manual)return 'Manually selected · not photo-verified';
  if(!point)return 'Unverified';
  return 'Low · approximate location only';
}

// Public Wikimedia Commons API: geotagged photos only, no scraping or copied assets.
// The returned image URLs remain on Wikimedia servers; candidates are never silently approved.
export async function commonsNearbyPhotos(lat,lon,radius=120,limit=12){
 const api=new URL('https://commons.wikimedia.org/w/api.php');
 const params={action:'query',generator:'geosearch',ggscoord:`${lat}|${lon}`,ggsradius:String(radius),ggslimit:String(limit),prop:'imageinfo|coordinates',iiprop:'url|extmetadata',iiurlwidth:'900',format:'json',origin:'*'};
 for(const [k,v] of Object.entries(params))api.searchParams.set(k,v);
 const response=await fetch(api,{headers:{Accept:'application/json'}});
 if(!response.ok)throw Error('Wikimedia Commons returned HTTP '+response.status);
 const payload=await response.json();
 return Object.values(payload.query?.pages||{}).filter(x=>x.imageinfo?.[0]?.thumburl).map(x=>{
   const i=x.imageinfo[0],m=i.extmetadata||{},coord=x.coordinates?.[0];
   const plain=v=>String(v?.value||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
   const d=coord?Math.hypot((coord.lat-lat)*111132,(coord.lon-lon)*111320*Math.cos(lat*Math.PI/180)):null;
   return {provider:'Wikimedia Commons',title:x.title,thumbnail:i.thumburl,original:i.descriptionurl,license:plain(m.LicenseShortName)||'Check source',author:plain(m.Artist)||'See original source',date:plain(m.DateTimeOriginal)||'',distanceMeters:d===null?null:Math.round(d),confidence:'candidate',note:'Geotag proximity does not prove this is the building facade'};
 }).sort((a,b)=>(a.distanceMeters??999999)-(b.distanceMeters??999999));
}
export function googleStreetViewCandidate(lat,lon,key){
 if(!key)return null;
 // Official Google Street View Static API; display only, do not save/cache imagery.
 // API key should be restricted to localhost HTTP referrers in Google Cloud Console.
 const image=new URL('https://maps.googleapis.com/maps/api/streetview');
 for(const [k,v] of Object.entries({size:'640x480',location:`${lat},${lon}`,radius:'35',return_error_code:'true',key}))image.searchParams.set(k,v);
 return {provider:'Google Street View Static API',title:'Nearest available panorama (not a confirmed facade)',thumbnail:image.toString(),original:`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lon}`,license:'Google Maps Platform terms · display only',author:'Google / imagery providers',confidence:'candidate',note:'Street View may show the wrong direction or building; inspect before confirming'};
}


// Free-source retrieval: Mapillary Graph API requires a free access token; Commons does not.
// Rank candidates by camera-facing bearing and distance, but NEVER auto-confirm a facade.
export function compassBearing(lat1,lon1,lat2,lon2){
 const a=lat1*deg,b=lat2*deg,d=(lon2-lon1)*deg;
 const y=Math.sin(d)*Math.cos(b),x=Math.cos(a)*Math.sin(b)-Math.sin(a)*Math.cos(b)*Math.cos(d);
 return (Math.atan2(y,x)/deg+360)%360;
}
export function bearingError(a,b){return Math.abs(((a-b+540)%360)-180)}
export function scoreCandidate(c,point){
 const distance=Number.isFinite(c.distanceMeters)?c.distanceMeters:999;
 const distanceScore=Math.max(0,1-distance/110);
 const directionScore=Number.isFinite(c.headingError)?Math.max(0,1-c.headingError/100):null;
 const sourceScore=c.provider==='Mapillary'?0.08:0;
 const score=Math.min(0.89,Math.max(0,0.55*distanceScore+0.37*(directionScore??0.2)+sourceScore));
 return {...c,matchScore:Math.round(score*100),confidence:'unverified',note:(c.note||'')+' Proximity and orientation score is NOT a verified building match.'};
}
export async function mapillaryNearbyPhotos(lat,lon,token,radius=85){
 if(!token)return [];
 const north=lat+radius/111132,south=lat-radius/111132,east=lon+radius/(111320*Math.cos(lat*deg)),west=lon-radius/(111320*Math.cos(lat*deg));
 const api=new URL('https://graph.mapillary.com/images');
 api.searchParams.set('bbox',[west,south,east,north].join(','));
 api.searchParams.set('limit','150');
 api.searchParams.set('fields','id,computed_geometry,geometry,computed_compass_angle,compass_angle,captured_at,thumb_1024_url,creator');
 const res=await fetch(api,{headers:{Authorization:'OAuth '+token,Accept:'application/json'}});
 if(!res.ok)throw Error('Mapillary API HTTP '+res.status);
 const json=await res.json();
 return (json.data||[]).filter(i=>i.thumb_1024_url&&(i.computed_geometry||i.geometry)?.coordinates?.length===2).map(i=>{
  const [lon2,lat2]=(i.computed_geometry||i.geometry).coordinates;
  const distance=Math.hypot((lat2-lat)*111132,(lon2-lon)*111320*Math.cos(lat*deg));
  const heading=Number(i.computed_compass_angle??i.compass_angle);
  const toward=compassBearing(lat2,lon2,lat,lon);
  return {provider:'Mapillary',title:'Street-level image '+i.id,thumbnail:i.thumb_1024_url,original:'https://www.mapillary.com/app/?pKey='+encodeURIComponent(i.id)+'&focus=photo',license:'Mapillary imagery · see original source and attribution',author:i.creator?.username||'Mapillary contributor',date:i.captured_at?new Date(i.captured_at).toISOString().slice(0,10):'',distanceMeters:Math.round(distance),headingError:Number.isFinite(heading)?Math.round(bearingError(heading,toward)):null,note:'Camera direction is estimated; building identity requires visual confirmation.'};
 }).filter(i=>i.distanceMeters<=radius).map(i=>scoreCandidate(i,{lat,lon})).sort((a,b)=>b.matchScore-a.matchScore).slice(0,20);
}
