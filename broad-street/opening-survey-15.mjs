// Review 15: architectural openings audit.  Counts refer to *principal wall
// openings* (a projecting bay = one architectural bay; mullions are NOT
// additional windows). Explicit source-image names point to user Library
// street screenshots, which are not redistributed in this viewer.
// The map keeps all municipal GIS building polygons completely unchanged.
import {facadeEdges,review14Profile} from './frontage-review-14.mjs';
import {detail2239} from './2239-facade.mjs';
import {detail2241} from './2241-facade.mjs';
import {detail2243,layout2243,mass2243} from './2243-facade.mjs';
import {detail2235} from './2235-37-facade.mjs';
import {detail2233} from './2233-facade.mjs';
import {detail2231} from './2231-facade.mjs';
import {detail2253} from './2253-facade.mjs';
import {detail2255} from './2255-facade.mjs';
import {renderPass13} from './six-building-pass13.mjs';
import {renderPass14} from './six-building-pass14.mjs';
import {renderPass15} from './six-building-pass15.mjs';
import {supportFacadeToGIS} from './facade-supports-11.mjs';

const PHOTO = 'User Library · TECH FREIRE Building Projects / ';
const PHOTO_BY_ID = Object.freeze({
 '1005655':['McDonalds Nov 2020 private user reference','parking-side-visible'],
 '1001197':['Screenshot 2026-11-21 030445.png','front-visible'],
 '1007134':['Screenshot 2026-11-21 030432.png','front-visible'],
 '1007133':['Screenshot 2026-11-21 030432.png','front-visible'],
 '1007132':['Screenshot 2026-11-21 031008.png','partial'],
 '1003388':['Screenshot 2026-11-21 030932.png','front-visible'],
 '1525758':['Screenshot 2026-11-21 030932.png','front-visible'],
 '1547386':['Screenshot 2026-11-21 030946.png','front-visible'],
 '1536711':['Screenshot 2026-11-21 030946.png','front-visible'],
 '1508518':['Screenshot 2026-11-21 030946.png','front-visible'],
 '1519830':['Screenshot 2026-11-21 031008.png','partial'],
 '1536712':['Screenshot 2026-11-21 031008.png','partial'],
 '1531017':['Screenshot 2026-11-21 031029.png','partial'],
 '1536713':['Screenshot 2026-11-21 031029.png','partial'],
 '1542243':['Screenshot 2026-11-21 031037.png','front-visible'],
 '3000691':['Screenshot 2026-11-21 031037.png','partial'],
 '1050173':['Screenshot 2026-11-21 031101.png','front-visible'],
 '1050168':['Screenshot 2026-11-21 031101.png','front-visible'],
 '1050169':['Screenshot 2026-11-21 031121.png','front-visible'],
 '1051326':['Screenshot 2026-11-21 031111.png','front-visible'],
 '1005656':['Screenshot 2026-11-21 030605.png','partial'],
 '1001196':['Screenshot 2026-11-21 030445.png','front-visible'],
 '1007130':['Screenshot 2026-11-21 030432.png','front-visible'],
 '3000277':['Screenshot 2026-11-21 030946.png','partial'],
 'photo-2209':['Screenshot 2026-11-21 030432.png','front-visible'],
 '1051327':['Screenshot 2026-11-21 031141.png','partial']
});
const OVERRIDE = Object.freeze({
 // Photo-constrained count of major window openings (not individual panes).
 // A door count is only asserted when the visible photographed facade permits.
 '1525758':{groundWindows:0,bays:2,upperLevels:2,ground:'shutter',doors:null,doorEvidence:'not-visible',windowEvidence:'photo-visible',notes:'2233: two tall sash openings on each of the two upper floors; ground metal security shutter (entry may be behind shutter)'},
 '1536711':{groundWindows:2,bays:2,upperLevels:2,ground:'rowhouse',doors:1,doorSide:'right',doorEvidence:'photo-visible',windowEvidence:'photo-visible',notes:'2239: two sash openings per upper story, one entrance below right-side arched canopy'},
 '1508518':{groundWindows:2,bays:2,upperLevels:2,ground:'rowhouse',doors:1,doorSide:'left',doorEvidence:'photo-visible',windowEvidence:'photo-visible',notes:'2241: two sash openings per upper story, one stair-access ground entrance under black canopy'},
 '1542243':{groundWindows:0,bays:2,upperLevels:2,ground:'shutter-door-left',doors:1,doorSide:'left',doorEvidence:'photo-visible',windowEvidence:'photo-visible',notes:'2253 Philadelphia Doll Museum: two tall sash windows on each upper floor, one full-width rolling shutter and one narrow pedestrian door on left'},
 '3000691':{groundWindows:1,bays:1,upperLevels:3,ground:'rowhouse',doors:1,doorSide:'left',doorEvidence:'estimated',windowEvidence:'photo-partial',notes:'2255 narrow white modern corner infill: one single wide rectangular window per upper level; ground details partly obscured'},
 '1050168':{groundWindows:2,bays:2,upperLevels:2,ground:'historic-mixed',doors:2,doorSide:'left',doorEvidence:'photo-partial',windowEvidence:'photo-visible',historic:true,notes:'2305–2307: paired deep projecting bay-window ensembles; two roof dormer groups. Count principal bays, not individual projecting sash faces'},
 '1050173':{groundWindows:2,bays:2,upperLevels:2,ground:'historic-mixed',doors:1,doorSide:'right',doorEvidence:'photo-partial',windowEvidence:'photo-visible',historic:true,turret:true,notes:'2301–2303: two projecting residential bay ensembles plus distinct round corner turret; precise turret panes and entrances require close views'},
 '1050169':{groundWindows:3,bays:4,upperLevels:2,ground:'historic-mixed',doors:2,doorSide:'ends',doorPositions:[.11,.89],doorEvidence:'photo-visible',windowEvidence:'photo-visible',notes:'2315–2317: four upper sash openings per level on dark stone frontage; two white ground side entrance doors; other ground arches are not labeled as doors'},
 '1051326':{groundWindows:0,bays:3,upperLevels:3,ground:'curtain-wall',doors:1,windowEvidence:'photo-visible',doorEvidence:'photo-visible',notes:'2309–2313 Philadelphia Electric: three tall glazing banks, one main central entrance; do not count each mullion or pane as a building window'},
 '1536713':{groundWindows:1,bays:2,upperLevels:2,ground:'shop',doors:2,doorSide:'ends',doorPositions:[.25,.86],windowEvidence:'photo-partial',doorEvidence:'photo-visible',notes:'2251: 2022 listing shows distinct left apartment entry and right shop entry, one central glazing bank. Upper opening count remains estimated.'},
 '1003388':{groundWindows:1,bays:2,upperLevels:2,ground:'shop',doors:2,doorSide:'ends',doorPositions:[.29,.87],windowEvidence:'photo-visible',doorEvidence:'photo-visible',notes:'2231 Black United Fund: two upper sash apertures per floor; two distinct ground pedestrian entrances (central double-glass doorway counted as one architectural opening, plus separate right-side door). Compare Screenshot 2026-11-21 030932.png; infill glazing and measured widths remain schematic'},
 '1547386':{groundWindows:2,bays:3,upperLevels:4,ground:'shop',doors:1,windowEvidence:'photo-visible',doorEvidence:'photo-partial',notes:'April 2025 and September 2026 actual street imagery: red brick lower three upper levels, central projecting gray panel bay, silver top floor and wide canopy. Ground entry count partly obscured.'},
 '1519830':{groundWindows:1,bays:2,upperLevels:2,ground:'shop',doors:1,windowEvidence:'estimated',doorEvidence:'estimated',notes:'2245 partially obscured by trees and overlapping adjacent facades'},
 '1536712':{groundWindows:1,bays:2,upperLevels:2,ground:'shop',doors:1,windowEvidence:'estimated',doorEvidence:'estimated',notes:'2247 partial oblique, count not independently confirmable'},
 '1531017':{groundWindows:2,bays:2,upperLevels:2,ground:'rowhouse',doors:1,doorSide:'left',windowEvidence:'photo-partial',doorEvidence:'photo-visible',notes:'April 2025 photograph immediately adjacent to 2251: raised boarded brownstone entrance and railings, blocked ground sash; tree partly hides upper windows.'},
 '1007132':{groundWindows:1,bays:2,upperLevels:2,ground:'rowhouse',doors:1,windowEvidence:'estimated',doorEvidence:'estimated',notes:'2227 photo at oblique distance; two-aperture rowhouse layout provisional'},
 '1007134':{groundWindows:2,bays:2,upperLevels:2,ground:'rowhouse',doors:1,doorSide:'right',windowEvidence:'photo-visible',doorEvidence:'photo-visible',notes:'April 2025 photos: eastern member of paired brownstone frontage (vacant-lot end); right entrance, raised stone steps, two principal sash per floor.'},
 '1007133':{groundWindows:2,bays:2,upperLevels:2,ground:'rowhouse',doors:1,doorSide:'left',windowEvidence:'photo-visible',doorEvidence:'photo-visible',notes:'April 2025 photos: school-adjacent paired brownstone, entrance at left with raised stone steps, paired sash and aligned historic cornice.'},
 '1001197':{groundWindows:0,bays:2,upperLevels:2,ground:'shutter',doors:1,doorSide:'right',windowEvidence:'photo-visible',doorEvidence:'photo-visible',notes:'April 2025 corner view: brick two upper stories, shuttered shop opening, right dark pedestrian entrance, pale panel left. No invented storefront glazing.'},
 'photo-2209':{groundWindows:2,bays:2,upperLevels:4,ground:'shop',doors:1,windowEvidence:'photo-visible',doorEvidence:'photo-partial',notes:'December 2022 as-built photographs show two red projecting glazed stacks over three floors, two separate flush windows at top. Ground entrances partly occluded.'},
 '3000277':{groundWindows:1,bays:2,upperLevels:3,ground:'balcony',doors:2,doorSide:'ends',windowEvidence:'photo-visible',doorEvidence:'photo-visible',notes:'2243: December 2022 as-built photos show three black picket balconies, one full-height glazed door and one offset horizontal window per level, two ground doors and central display window. Published proposed floor heights used; exact measurements remain provisional.'},
 '1007130':{groundWindows:1,bays:2,upperLevels:3,ground:'shop',doors:1,windowEvidence:'photo-partial',doorEvidence:'photo-partial',notes:'2207 frontage inferred from street image; original saved city footprint is rear-only; preserved provisional street-facing mass'},
 '1001196':{groundWindows:3,bays:3,upperLevels:0,ground:'restaurant',doors:1,windowEvidence:'photo-visible',doorEvidence:'photo-partial',notes:'2201–03 Crown Chicken & Grill: broad single-story storefront, restaurant windows not rowhouse floors'},
 '1005656':{groundWindows:0,bays:3,upperLevels:1,ground:'church',doors:1,windowEvidence:'photo-partial',doorEvidence:'photo-partial',notes:'Berean church front has Gothic lancet and rose windows, not regular rectangular repeated residential sash'},
 '1051327':{groundWindows:0,bays:3,upperLevels:0,ground:'arched-institution',doors:null,windowEvidence:'photo-partial',doorEvidence:'unknown',notes:'2331 institutional building with three tall arched bays; entrance configuration not confirmed'},
 '1003073':{groundWindows:null,bays:null,upperLevels:null,ground:'school-original',doors:null,windowEvidence:'model-source',doorEvidence:'model-source',notes:'2221 Tech Freire original school model retained. The architectural IFC/FBX controls physical openings; no fictitious new window grid may cover it'},
 '1544523':{groundWindows:0,bays:15,upperLevels:4,ground:'large-institution',doors:null,windowEvidence:'estimated',doorEvidence:'unknown',notes:'2413–2429 custom stepped institutional facade, 15 model bays; no full photo count established'},
 '1009021':{groundWindows:null,bays:null,upperLevels:0,ground:'gas-station',doors:null,windowEvidence:'unconfirmed',doorEvidence:'unconfirmed',notes:'2401–2411 front lot canopy / retail building; low visible frontage, not a residential sash grid'},
 '1073318':{groundWindows:6,bays:6,upperLevels:0,ground:'shop',doors:null,windowEvidence:'estimated',doorEvidence:'unknown',notes:'2431–2445 broad storefront, photo not adequate for exact entry count'},
 '1000951':{groundWindows:2,bays:5,upperLevels:1,ground:'mixed-use',doors:1,windowEvidence:'estimated',doorEvidence:'estimated',notes:'2125–2129 frontage model provisional, avoid inventing documented opening counts'},
 '1005655':{groundWindows:2,bays:2,upperLevels:0,ground:'restaurant',doors:3,windowEvidence:'photo-visible',doorEvidence:'photo-partial',notes:'November 2020 photograph shows two PRIMARY glazing zones (not mullion panes) plus one central glass entrance and two pale service doors along the ~31.5 m SOUTH PARKING-SIDE wall. The ~14 m short Broad-facing wall is not this photographed elevation; current 2026 condition unknown.'},
 '1050174':{groundWindows:null,bays:null,upperLevels:null,ground:'rear',doors:null,windowEvidence:'unconfirmed',doorEvidence:'unconfirmed',notes:'Rear detached portion of 2315–2317, cannot assign N Broad front windows'},
 '1079074':{groundWindows:null,bays:null,upperLevels:null,ground:'rear',doors:null,windowEvidence:'unconfirmed',doorEvidence:'unconfirmed',notes:'Rear detached portion of 2315–2317, cannot assign N Broad front windows'},
 '1079073':{groundWindows:null,bays:null,upperLevels:null,ground:'setback',doors:null,windowEvidence:'unconfirmed',doorEvidence:'unconfirmed',notes:'2319 set back from Broad, not in available front image'},
 '1050167':{groundWindows:null,bays:null,upperLevels:null,ground:'setback',doors:null,windowEvidence:'unconfirmed',doorEvidence:'unconfirmed',notes:'2321 set back, not in available front image'},
 '1011866':{groundWindows:null,bays:null,upperLevels:null,ground:'rear',doors:null,windowEvidence:'unconfirmed',doorEvidence:'unconfirmed',notes:'2401–2411 distant rear section'},
 '1007135':{groundWindows:null,bays:null,upperLevels:null,ground:'rear',doors:null,windowEvidence:'unconfirmed',doorEvidence:'unconfirmed',notes:'2231 rear portion is not a separate Broad-facing entrance'},
 '1007129':{groundWindows:null,bays:null,upperLevels:null,ground:'rear',doors:null,windowEvidence:'unconfirmed',doorEvidence:'unconfirmed',notes:'2205 rear portion is not a separate Broad-facing entrance'},
 '1007131':{groundWindows:null,bays:null,upperLevels:null,ground:'rear',doors:null,windowEvidence:'unconfirmed',doorEvidence:'unconfirmed',notes:'2201–03 small rear mass'},
 '1003022':{groundWindows:null,bays:null,upperLevels:null,ground:'setback',doors:null,windowEvidence:'unconfirmed',doorEvidence:'unconfirmed',notes:'2131 former Rite Aid has a set-back facade; exact customer entrance arrangement not in photos'}
});
export const OPENING_SURVEY_VERSION='18';
const MODELED_EXCEPTIONS=new Set(['1003073','1005656','1001196','1007130','1051327','1051326','1544523','1073318','1009021','1007131','1005655']);
export function openingProfile(row){
 if(!row?.polys)return null;
 const id=String(row.id),photo=PHOTO_BY_ID[id]||null;
 const saved=OVERRIDE[id]||{};
 const rear=row.front < -35 && !Number.isFinite(row.provisionalStreetFront);
 const existing=review14Profile(row);
 const bays=saved.bays!==undefined?saved.bays:rear?null:Math.max(1,Math.min(6,Math.round(row.w/2.8)));
 const upperLevels=saved.upperLevels!==undefined?saved.upperLevels:rear?null:Math.max(0,Math.min(4,Math.round(row.h/3.5)-1));
 return Object.freeze({id,address:row.address,sourceFile:({'photo-2209':'Philly YIMBY, Jamie Meller, December 2022 as-built photos','1536713':'LoopNet 2022 listing, photo capture date unconfirmed','1050173':'Philadelphia Historic Register nomination August 2018','1050168':'Philadelphia Historic Register nomination August 2018','1050169':'WCRE June 2024 brochure, photo date unconfirmed'})[id]|| (id==='3000277'?'Philly YIMBY, Jamie Meller, December 2022 as-built photos; proposed SgRA elevation':photo?(id==='1005655'?'User-supplied Google Street View, November 2020 (private QA reference)':PHOTO+photo[0]):null),photoStatus:id==='3000277'?'front-visible':photo?.[1]||'not-shown',
  bays,upperLevels,groundWindows:saved.groundWindows!==undefined?saved.groundWindows:rear?null:1,upperOpeningCount:bays!==null&&upperLevels!==null?bays*upperLevels:null,
  windowsByFloor:upperLevels===null?null:Array.from({length:upperLevels},()=>bays),
  ground:saved.ground|| (rear?'rear':existing?.ground||'rowhouse'),
  doors:saved.doors!==undefined?saved.doors:rear?null:1,
  doorSide:saved.doorSide||'left',doorPositions:saved.doorPositions||null,windowEvidence:saved.windowEvidence||'estimated',doorEvidence:saved.doorEvidence||'estimated',
  notes:saved.notes||'Schematic until street-level photograph establishes exact position and sizes',
  hasStreetFront:!rear,renderMode:rear?'rear-preserved':id==='1051326'?'pass14-specialized':MODELED_EXCEPTIONS.has(id)?'custom-preserved':'opening-layout-15',
  windowWidthMeters:saved.windowWidthMeters||((saved.ground==='balcony'||saved.ground==='shop'||saved.ground==='curtain-wall')?1.35:.95),
  windowHeightMeters:saved.windowHeightMeters||((saved.ground==='balcony'||saved.ground==='shop')?1.58:1.48),
  doorWidthMeters:(saved.ground==='shop'||saved.ground==='shutter'||saved.ground==='historic-mixed')?1.1:.94,
  doorHeightMeters:2.2,historic:!!saved.historic,turret:!!saved.turret
 });
}
export function openingSurvey(rows){return rows.map(openingProfile)}
export function openingLayout(row){
 const p=openingProfile(row);
 if(!p||p.renderMode!=='opening-layout-15')return {profile:p,openings:[],groundOpenings:[],doors:[],edges:[]};
 if(p.id==='3000277')return layout2243(row,p);
 const edges=facadeEdges(row);
 const fronts=edges.filter(e=>e.width>=2.0);
 if(!fronts.length)return {profile:p,openings:[],groundOpenings:[],doors:[],edges:[]};
 const totalW=fronts.reduce((s,e)=>s+e.width,0);
 // Separate facade parts share the *building-wide* aperture count. Largest
 // part gets remaining slots so 2253's side recess is not over-windowed.
 let assigned=0;const counts=fronts.map((e,i)=>{
  if(i===fronts.length-1)return Math.max(0,p.bays-assigned);
  const remain=fronts.length-i-1;
  const want=Math.round(p.bays*e.width/totalW);
  const count=Math.min(Math.max(0,want),Math.max(0,p.bays-assigned));
  assigned+=count;return count;
 });
 if(p.id==='1542243'&&counts.length>1){counts.fill(0);counts[fronts.findIndex(e=>e.width===Math.max(...fronts.map(x=>x.width)))]=p.bays;}
 const openings=[],groundOpenings=[],doors=[];
 fronts.forEach((e,i)=>{
  const count=counts[i];if(count<1)return;
  const bayWidth=e.width/count;
  for(let floor=0;floor<p.upperLevels;floor++){
   // Keep the openings between ground lintel and parapet, including historic
   // two upper stories within the taller mansard envelope.
   const available=Math.max(.9,row.h-(p.historic?3.6:1.05)-3.15);
   const y=3.15+(floor+.5)*available/p.upperLevels;
   const w=Math.max(.33,Math.min(p.windowWidthMeters,bayWidth*.68,bayWidth-.35));
   const h=Math.min(p.windowHeightMeters,Math.max(.72,available/p.upperLevels*.66));
   for(let bay=0;bay<count;bay++)openings.push({kind:p.historic?'oriel':'sash',floor:floor+1,edge:i,
    x:e.left+(bay+.5)*bayWidth,y,z:e.z+.14,w,h,bay:bay+1});
  }
 });
 // Ground door(s) on the largest actual front polygon edge. Null means
 // not visible in sources: don't generate a fictitious certified opening.
 if(p.doors>0){
  const main=fronts.reduce((a,b)=>a.width>=b.width?a:b);
  const n=p.doors,doorW=Math.min(p.doorWidthMeters,main.width/(n+2)*.74);
  for(let i=0;i<n;i++){
   const fraction=p.doorPositions?.[i]??(n===1?(p.doorSide==='right'?.82:p.doorSide==='left'?.18:.5):(p.doorSide==='ends'?(i===0?.11:.89):(i+.5)/n));
   doors.push({kind:'door',x:main.left+main.width*fraction,y:1.17,z:main.z+.32,
    w:Math.min(doorW,main.width*.30),h:p.doorHeightMeters});
  }
 }
 // Explicit ground apertures are distributed around the visible doors.
 // They do NOT include individual storefront mullions, nor an opaque shutter.
 if(p.groundWindows>0){
  const main=fronts.reduce((a,b)=>a.width>=b.width?a:b);
  const rangeLeft=main.left+.28,rangeRight=main.right-.28;
  const free=doors.length>1?
    [Math.max(rangeLeft,doors[0].x+doors[0].w*.66+.12),Math.min(rangeRight,doors.at(-1).x-doors.at(-1).w*.66-.12)]:
    doors.length?
    (p.doorSide==='right'?[rangeLeft,Math.min(rangeRight,doors[0].x-doors[0].w*.65-.22)]:
    [Math.max(rangeLeft,doors[0].x+doors[0].w*.65+.22),rangeRight]):[rangeLeft,rangeRight];
  const span=Math.max(.3,free[1]-free[0]);
  for(let i=0;i<p.groundWindows;i++){
   const w=Math.min(p.ground==='shop'||p.ground==='balcony'?1.38:.86,
    span/p.groundWindows*.72);
   groundOpenings.push({kind:p.ground==='shop'||p.ground==='balcony'?'retail-bank':'ground-sash',
    floor:0,edge:fronts.indexOf(main),x:free[0]+span*(i+.5)/p.groundWindows,
    y:p.ground==='shop'||p.ground==='balcony'?1.45:1.65,z:main.z+.14,
    w:Math.max(.20,w),h:p.ground==='shop'||p.ground==='balcony'?2.25:1.62});
  }
 }
 // The adjacent 2241 has a separately photographed elevated entrance and
 // a light rusticated base.  Keep its GIS vertices and opening inventory.
 if(String(row.id)==='1508518'){
   // Listing facade shows tall single-width sash, not squat divided panes.
   for(const o of openings)o.h=1.85;
   for(const o of groundOpenings)o.y=2.77;
   for(const d of doors)d.y=2.32;
 }
 // 2239 has a documented *raised* principal entry and lower basement: its
 // first-floor sash/door locations must not inherit the ground-level template.
 // These are photo-constrained provisional elevations (April 2025), not
 // changes to the municipal building footprint or to neighboring facades.
 if(String(row.id)==='1536711'){
  for(const o of openings){o.y+=.68;o.x-=.47;}
  for(const o of groundOpenings){o.y=2.64;o.x-=.30;}
  for(const d of doors)d.y=2.28;
 }
 return {profile:p,openings,groundOpenings,doors,edges:fronts};
}
export function renderOpeningSurveyFrontage(row,{block,box:rawBox,mesh:rawMesh,T}){
 // Collect all view-facing solids so physical support is verified against the
 // original GIS mass, not merely against another disconnected ornament.
 const supportDetails=[];
 const box=(x,y,z,w,h,d,c,angle=0)=>{
  rawBox(x,y,z,w,h,d,c,angle);
  if(!angle)supportDetails.push({kind:'box',x,y,z,w,h,d});
 };
 const mesh=(...args)=>{const m=rawMesh(...args);if(m?.isMesh)supportDetails.push({kind:'mesh',object:m});return m;};
 const {profile:p,openings,groundOpenings,doors,edges}=openingLayout(row);
 if(renderPass15(row,{block,box,mesh,T}))return true;
 if(renderPass14(row,{block,box,mesh,T}))return true;
 if(!p||p.renderMode!=='opening-layout-15'||!edges.length)return false;
 if(String(row.id)==='3000277'){
  mass2243(row,{block,box});detail2243(row,{profile:p,openings,groundOpenings,doors,edges},{box,block,mesh,T});
  return true;
 }
 if(renderPass13(row,{profile:p,openings,groundOpenings,doors,edges},{block,box,mesh,T}))return true;
 const colors={masonry:0xa9a093,warmstone:0xb8ac9a,brownstone:0x96776a,
  'contemporary-brick':0xa1766b,redbrick:0x90574c,'historic-stone':0xb4aa9c,
  'historic-brownstone':0x8a6357};
 const style=review14Profile(row)?.style;
 const wall=String(row.id)==='1003388'?0xc9bfaf:String(row.id)==='1542243'?0xab8374:colors[style]||(p.ground==='balcony'?0xd8d8d2:0xb7a293);
 const roof=0x565456, trim=0xd1c4ae, dark=0x424b50, glazing=0x53747f;
 // Pass23 exact STL union exposed a face-only roof cap on 2239. Embed
 // that cap by 4 cm while preserving the existing visible top elevation.
 for(const poly of row.polys){block(poly,row.h,wall,0,String(row.id)==='1542243'?{wallFinish:"broad-2253-brick"}:{});const embed=String(row.id)==='1536711'?.04:0;block(poly,.17+embed,roof,row.h-embed)}
 // Facade-only overlays; the original City of Philadelphia polygon is the
 // entire building mass. These instanced boxes never move polygon vertices.
 const mainEdge=edges.reduce((a,b)=>a.width>=b.width?a:b);
 for(const edge of edges){
  const z=edge.z+.16;
  box(edge.x,row.h-.19,z+.1,edge.width,.33,.35,p.historic?trim:roof);
  const g=Math.min(3.4,row.h*.30);
  if((p.ground==='shutter'||p.ground==='shutter-door-left')&&edge===mainEdge){
   // Put the museum's opaque shutter to the RIGHT of its photographed blue
   // pedestrian door. Source facade width may be narrower than footprint
   // bounding width; a fixed 72% shutter used to overlap the door by 14 cm.
   const sideDoor=p.ground==='shutter-door-left'?doors[0]:null;
   const shutterLeft=sideDoor?sideDoor.x+sideDoor.w/2+.12:edge.left+edge.width*.055;
   const shutterRight=edge.right-edge.width*.055;
   const shutterW=Math.max(.35,shutterRight-shutterLeft);
   const cx=(shutterLeft+shutterRight)/2;
   box(cx,g*.50,z+.2,shutterW,g*.75,.13,0x818b8b);
   for(let stripe=0;stripe<11;stripe++)box(cx,.5+stripe*g*.068,z+.286,shutterW,.027,.06,0xb5b8b5);
  }else if((p.ground==='shop'||p.ground==='balcony')&&edge===mainEdge){
   const shopW=edge.width*.88;
   box(edge.x,g*.47,z+.16,shopW,g*.82,.2,dark);
   // Opaque backing only: actual visible storefront glass bank count comes
   // from groundOpenings below, not arbitrary repetitions from wall width.
   box(edge.x,g-.18,z+.28,edge.width*.92,.35,.34,0x525d5e);
  }else if(p.ground==='historic-mixed'){
   box(edge.x,g-.26,z+.17,edge.width*.93,.34,.3,trim);
  }
 }
 for(const o of openings){
  if(p.historic && o.floor===p.upperLevels){
   // Nov 21 Street View: 2301–2307 have projecting bays at the lower
   // occupied level, but BALCONIES over those bays on the upper level.
   // Do not add additional counted windows for balustrade slats.
   box(o.x,o.y,o.z+.11,o.w*1.23,o.h*1.12,.25,trim);
   box(o.x,o.y,o.z+.27,o.w,o.h,.09,glazing);
   box(o.x,o.y,o.z+.34,.06,o.h,.10,dark);
   const deckY=o.y-o.h*.55,balconyWidth=Math.min(3.35,o.w*3.05);
   box(o.x,deckY,o.z+.67,balconyWidth,.16,1.16,trim);
   const railY=deckY+.60,railZ=o.z+1.21;
   for(const f of [-.5,-.25,0,.25,.5])box(o.x+f*balconyWidth,railY,railZ,.075,1.12,.08,0xc5bfae);
   box(o.x,deckY+1.12,railZ,balconyWidth,.10,.11,0xc5bfae);
  }else if(p.historic){
   // Projecting historic bay: a single major aperture with three sash faces.
   // Three small glazed facets are one oriel bay, NOT three windows.
   // Upper-storey bays are handled as balconies above, per user photograph.
   box(o.x,o.y,o.z+.33,o.w*1.28,o.h*1.19,.63,trim);
   box(o.x,o.y,o.z+.68,o.w*.74,o.h,.09,glazing);
   for(const side of [-1,1])box(o.x+side*o.w*.48,o.y,o.z+.47,o.w*.25,o.h,.14,glazing,side*.46);
   box(o.x,o.y+o.h*.60,o.z+.42,o.w*1.48,.16,.8,0x77736b);
  }else{
   box(o.x,o.y,o.z+.08,o.w+.19,o.h+.19,.18,trim);
   box(o.x,o.y,o.z+.22,o.w,o.h,.08,glazing);
   box(o.x,o.y,o.z+.285,.055,o.h,.07,dark);
   box(o.x,o.y-.09,o.z+.29,o.w,.05,.07,dark);
   box(o.x,o.y-o.h*.58,o.z+.14,o.w+.25,.12,.34,0x8d877d);
  }
 }
 for(const o of groundOpenings){
  box(o.x,o.y,o.z+.08,o.w+.18,o.h+.16,.18,trim);
  box(o.x,o.y,o.z+.22,o.w,o.h,.08,glazing);
  if(o.kind==='ground-sash'){
   box(o.x,o.y,o.z+.29,.055,o.h,.07,dark);
   box(o.x,o.y-.12,o.z+.29,o.w,.05,.07,dark);
  }
  box(o.x,o.y-o.h*.54,o.z+.10,o.w+.22,.12,.34,0x8d877d);
 }
 for(const o of doors){
  box(o.x,o.y,o.z,o.w+.17,o.h+.18,.25,trim);
  box(o.x,o.y,o.z+.17,o.w,o.h,.13,(p.ground==='shop'||p.ground==='balcony')?glazing:dark);
  box(o.x+o.w*.38,o.y-.12,o.z+.26,.05,.07,.06,0xdac691);
  box(o.x,o.y+o.h*.54,o.z+.1,o.w+.28,.16,.40,trim);
 }
 // Address-specific 2239 layer follows the shared aperture renderer so the
 // four upper, two ground, one door count remains controlled by Review 15.
 if(String(row.id)==='1536711')detail2239(row,{profile:p,openings,groundOpenings,doors,edges},{box,mesh,T});
 if(String(row.id)==='1508518')detail2241(row,{profile:p,openings,groundOpenings,doors,edges},{box,mesh,T});
 if(String(row.id)==='3000691')detail2255(row,{profile:p,openings,groundOpenings,doors,edges},{box,mesh,T});
 if(String(row.id)==='1542243')detail2253(row,{profile:p,openings,groundOpenings,doors,edges},{box,mesh,T});
 if(String(row.id)==='1003388')detail2231(row,{profile:p,openings,groundOpenings,doors,edges},{box,mesh,T});
 if(String(row.id)==='1525758')detail2233(row,{profile:p,openings,groundOpenings,doors,edges},{box,mesh,T});
 if(String(row.id)==='1547386')detail2235(row,{profile:p,openings,groundOpenings,doors,edges},{box,mesh,T});
 // Hidden longitudinal ties close real GIS-mass-to-facade gaps. This is an
 // actual printed-solid bridge, not a renderer-only AABB pass.
 const supportStatus=supportFacadeToGIS(row,supportDetails,rawBox);
 // Missing anchors are recorded by independent QA; no guessed parcel geometry is added.
 if(p.historic){
  // The documented roof shape is approximated as a raised mansard band with
  // two dormers; no inferred sash counts are added to 'windowsByFloor'.
  box(row.x,row.h-.58,row.z,row.w*.91,1.13,row.d*.88,0x4b4b50);
  for(const e of edges)for(const frac of [.31,.69]){
   const x=e.left+e.width*frac;
   box(x,row.h-.10,e.z-1.15,Math.min(1.65,e.width*.20),1.6,.86,0x6c6460);
   box(x,row.h-.1,e.z-.69,Math.min(1.1,e.width*.15),1.18,.12,glazing);
  }
  if(p.turret&&mesh&&T?.CylinderGeometry){
   const edge=edges[0],x=edge.right-1.05;
   mesh(new T.CylinderGeometry(1.1,1.24,Math.max(5,row.h*.42),10),wall,x,row.h*.74,edge.z+.13);
   if(T.ConeGeometry)mesh(new T.ConeGeometry(1.4,2.2,10),0x4b4b50,x,row.h+.10,edge.z+.13);
  }
 }
 return true;
}
