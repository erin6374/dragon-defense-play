/**
 * North Broad Studio provenance, review queue, and approximate street-view geometry.
 * ONLY municipal polys are labeled surveyed-source; all photo-rebuilt volumes
 * remain provisional. Geographic projection derives from the frozen studio fit.
 */
import {review14Profile,REVIEW14_IDS} from './frontage-review-14.mjs';
export const MAPPING_VERSION='2026-11-22-accuracy-review-16';
export const FOOTPRINT_SOURCE='https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/LI_BUILDING_FOOTPRINTS/FeatureServer/0';
export const STREET_SOURCE='https://opendataphilly.org/datasets/street-centerlines/';
export const CITY_ATLAS='https://atlas.phila.gov/';
export const REFERENCE_ORIGIN=Object.freeze({lat:39.984708102796,lon:-75.1566156804781,bearingDegrees:9.3});
export const ADDRESS_SOURCES=Object.freeze({
 '2221-25 N BROAD ST':[{label:'TECH Freire renovation · Architect Magazine',url:'https://www.architectmagazine.com/project-gallery/tech-freire-charter-school/'}],
 '2101-07 N BROAD ST':[{label:'Berean Presbyterian Church · Community Design Collaborative',url:'https://cdesignc.org/featured-work/work/berean-conceptual-design-for-creating-a-community-hub'}],
 '2235-37 N BROAD ST':[{label:'2235–2237 exterior · LoopNet',url:'https://www.loopnet.com/Listing/2235-2237-N-Broad-St-Philadelphia-PA/40708498/'}],
 '2243 N BROAD ST':[{label:'2243 · YIMBY completion photos (Dec 2022)',url:'https://phillyyimby.com/2022/12/construction-complete-at-2243-north-broad-street-near-temple-university-in-north-philadelphia.html'}],
 '2207 N BROAD ST':[{label:'2207 exterior · Apartments.com',url:'https://www.apartments.com/2207-n-broad-st-philadelphia-pa-unit-2r/t77cbr8/'},
  {label:'2207 construction chronology · YIMBY 2021',url:'https://phillyyimby.com/2021/04/permits-issued-for-five-story-22-unit-building-at-2209-11-north-broad-street-near-temple-university-in-north-philadelphia.html'}],
 '2209–11 N BROAD ST':[{label:'2209–2211 completed mass and dimensions · YIMBY Jan 2023',url:'https://phillyyimby.com/2023/01/construction-complete-at-2209-north-broad-street-near-temple-university-in-north-philadelphia.html'},
  {label:'2209 exterior · Lofts at Henry Hall',url:'https://www.apartments.com/lofts-at-henry-hall-philadelphia-pa/pg9139v/'}]
});
export const VERIFIED_OBSERVATIONS=Object.freeze({
 '2207 N BROAD ST':{
  stage:'photo-confirmed-presence; approximate 3D front mass',date:'2019–2023',
  fact:'Four-story modern street-facing building exists at 2207. The saved municipal outline is only the REAR 11.1 m section; the extended front mass is provisional and not an additional GIS footprint.',
  pending:'Obtain a current orthophoto or survey for the building front-to-rear outline, windows and precise story heights.'
 },
 '2209–11 N BROAD ST':{
  stage:'published dimensions; estimated rectangular envelope',date:'January 2023',
  fact:'Five stories / 21 units reported complete. Site 31.5 ft wide × 151 ft long; main roof 53 ft, parapet 57 ft, rear yard 29 ft. A north-side light well is documented but not yet surveyed in this 3D envelope.',
  pending:'Verify position of the five-foot north light well and rear mass; polygon remains an estimated envelope, not municipal parcel geometry.'
 },
 '2243 N BROAD ST':{
  stage:'city polygon with reported courtyard massing',date:'December 2022',
  fact:'Contemporary four-story development with three connected masses and two open courtyards. Published site width is roughly 18 ft; the saved GIS geometry includes two polygon parts.',
  pending:'Compare the 2022 completion photos with the two saved geometry parts and check whether both courtyards are open in the model.'
 }
});
export const REVIEW_ISSUES=Object.freeze([
 {id:'rear-front-2207',targetId:'1007130',address:'2207 N BROAD ST',severity:'high',type:'missing official street-front polygon',text:'Front facade is visible in real photos but not present in saved municipal polygon. An explicitly provisional four-story volume fills the street-facing section; compare actual surveyed outline.',source:'https://www.apartments.com/2207-n-broad-st-philadelphia-pa-unit-2r/t77cbr8/'},
 {id:'2209-estimated-envelope',targetId:'photo-2209',address:'2209–11 N BROAD ST',severity:'high',type:'published dimensions vs inferred model',text:'Source-backed 9.60 m × ~37.19 m rectangular mass and 16.15 m main roof. North light well and setbacks still need site-plan/roof-photo verification.',source:'https://phillyyimby.com/2023/01/construction-complete-at-2209-north-broad-street-near-temple-university-in-north-philadelphia.html'},
 {id:'2213-15-unknown',targetId:'photo-2209',address:'Approx. 2213–2215 N BROAD ST',severity:'high',type:'unmapped interval',text:'Approx. 9.6 m frontage interval between the 2209 estimate and mapped 2217. 2023 coverage describes a then-vacant lot to the north; current 2026 condition is not verified. Do not fill with invented architecture.',source:'https://phillyyimby.com/2023/01/construction-complete-at-2209-north-broad-street-near-temple-university-in-north-philadelphia.html'},
 {id:'2243-courtyards',targetId:'3000277',address:'2243 N BROAD ST',severity:'medium',type:'courtyard configuration',text:'Preserve three connected building masses and two courtyards; compare saved multi-part GIS outlines with completion imagery.',source:'https://phillyyimby.com/2022/12/construction-complete-at-2243-north-broad-street-near-temple-university-in-north-philadelphia.html'},
 {id:'2241-2243-sliver',targetId:'1508518',address:'2241 / 2243 N BROAD ST',severity:'low',type:'saved source polygon intersection',text:'Approximately 0.319 m² intersecting saved footprints. Could be GIS digitization or physical party-wall boundary; preserve source polygons until revalidated.',source:FOOTPRINT_SOURCE}
]);
export function approximateGeo(x,z){
 const angle=REFERENCE_ORIGIN.bearingDegrees*Math.PI/180;
 return {lat:REFERENCE_ORIGIN.lat-(x*Math.cos(angle)-z*Math.sin(angle))/111050,
  lon:REFERENCE_ORIGIN.lon-(x*Math.sin(angle)+z*Math.cos(angle))/85390,
  quality:'Approximate linear projection from saved studio calibration, NOT survey-grade'};
}
export function bearingBetween(from,to){
 const north=(to.lat-from.lat)*111050,east=(to.lon-from.lon)*85390;
 return ((Math.atan2(east,north)*180/Math.PI)%360+360)%360;
}
export function facadeViewpoint(row,watts=false){
 const roadZ=watts?-75:0;
 const camera=approximateGeo(row.x,roadZ);
 const front=Number.isFinite(row.provisionalStreetFront)?row.provisionalStreetFront:row.front;
 const target=approximateGeo(row.x,Number.isFinite(front)?front:(watts?-101:-22));
 return {...camera,heading:Math.round(bearingBetween(camera,target)),target,road:watts?'Watts Street':'North Broad Street'};
}
export function outlineAreaMeters2(row){
 function ringArea(coords){
  if(!Array.isArray(coords)||coords.length<3)return 0;
  let twice=0;
  for(let i=0;i<coords.length;i++){
   const [x,z]=coords[i],[xx,zz]=coords[(i+1)%coords.length];
   twice+=x*zz-xx*z;
  }
  return Math.abs(twice)/2;
 }
 return (row.polys||[]).reduce((total,poly)=>total+Math.max(0,ringArea(poly[0])-(poly.slice(1).reduce((sum,h)=>sum+ringArea(h),0))),0);
}
export function buildingEvidence(row,allRows){
 const matched=(allRows||[]).filter(r=>r.address===row.address);
 const shared=matched.length?matched:[row];
 const inferred=!!row.estimated||!/^[0-9]+$/.test(String(row.id));
 const approx=approximateGeo(row.x,row.front);
 const sourceLinks=[
  {label:'City of Philadelphia footprint layer (record source, not a refreshed comparison)',url:FOOTPRINT_SOURCE},
  {label:'Philadelphia Atlas — check current address',url:CITY_ATLAS},
  {label:'Philadelphia street centerlines',url:STREET_SOURCE},
 ];
 for(const ref of ADDRESS_SOURCES[row.address]||[])sourceLinks.push(ref);
 if(row.refs?.length)for(const url of row.refs)if(/^https:\/\//i.test(url)&&!sourceLinks.some(s=>s.url===url))
  sourceLinks.push({label:'Existing source photo/reference lead; verify date and license',url});
 const notes=[
  row.context?'Context landmark (not a street-address parcel)':row.sourceKind==='park-reference'?'Park Avenue studio outline (not individually reverified)':inferred?'Estimated polygon: NOT a city building-footprint record':'Saved city footprint: may represent only one building section rather than a full parcel',
  'Window counts, facade colors, entrances and interiors need individual photo review.',
  'Geographic positioning uses an approximate local projection; not a survey.'
 ];
 if(row.provisionalFrontage)notes.unshift('A provisional source-informed front volume is rendered beyond this rear municipal polygon; its exact footprint is unverified.');
 if(row.geometryMethod)notes.unshift('Dimensions reconstructed from published measurements; the light well and detailed massing remain unverified.');
 return {
  id:String(row.id),address:row.address,
  kind:row.context?'Context landmark (not an individual mapped footprint)':row.sourceKind==='park-reference'?'Park Avenue studio polygon (not individually reverified)':inferred?'Estimated photo/published-dimension outline':'Saved City of Philadelphia building-footprint record',
  inferred,provisionalFrontage:!!row.provisionalFrontage,
  verificationStatus:VERIFIED_OBSERVATIONS[row.address]?.stage||(inferred?'Estimated geometry':'Saved municipal footprint; facade unverified'),
  datedObservation:VERIFIED_OBSERVATIONS[row.address]||null,
  geometryMethod:row.geometryMethod||'saved-city-source-polygon',
  review14:row.review14||null,
  review14Profile:review14Profile(row),
  areaMeters2:+outlineAreaMeters2(row).toFixed(2),
  widthMeters:typeof row.w==='number'?+row.w.toFixed(2):null,
  depthMeters:typeof row.d==='number'?+row.d.toFixed(2):null,
  heightMeters:typeof row.h==='number'?+row.h.toFixed(2):null,
  distanceBehindBroadCenterlineMeters:typeof row.front==='number'?+Math.abs(row.front).toFixed(2):null,
  visibleFrontageDistanceMeters:Number.isFinite(row.provisionalStreetFront)?+Math.abs(row.provisionalStreetFront).toFixed(2):null,
  approxCenter:{lat:+approx.lat.toFixed(6),lon:+approx.lon.toFixed(6)},
  relatedFootprintParts:shared.length,partNumber:shared.findIndex(r=>r.id===row.id)+1,
  sourceLinks,accuracyNotes:notes
 };
}
export function mappingInventory(rows){
 const addresses=new Set(rows.map(row=>row.address));
 const inferred=rows.filter(row=>!!row.estimated||!/^[0-9]+$/.test(String(row.id)));
 const byAddress=new Map();for(const row of rows)byAddress.set(row.address,(byAddress.get(row.address)||0)+1);
 return {
  version:MAPPING_VERSION,footprintParts:rows.length,distinctAddresses:addresses.size,
  cityRecords:rows.length-inferred.length,inferredCount:inferred.length,
  provisionalFacadeMasses:rows.filter(x=>x.provisionalFrontage).length,
  publicationBackedDimensionReconstructions:rows.filter(x=>!!x.geometryMethod).length,
  multiplePartAddresses:[...byAddress.entries()].filter(([,count])=>count>1).map(([address,count])=>({address,parts:count})),
  inferredAddresses:inferred.map(x=>x.address),
  source:FOOTPRINT_SOURCE,
  reviewIssueCount:REVIEW_ISSUES.length,
  review14IndividualBuildings:rows.filter(r=>REVIEW14_IDS.includes(String(r.id))).length,
  caveat:'Saved city geometry plus published-dimension reconstructions. Current municipal data not re-fetched; photograph-based frontage is provisional. Neither facade details nor local geolocation is survey-grade.'
 };
}
