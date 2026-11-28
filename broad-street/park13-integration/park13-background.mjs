// Reduced-detail, replaceable background facades. These styles are derived
// from the existing Watts-facing rowhouse assets, not photos of new addresses.
// The target's actual GIS polygon and height are never rescaled or replaced.
import {extractWallSegments} from './watts-antigravity.mjs';
export const WATTS_STYLES=Object.freeze([
  {
    "source": "2228 N PARK AVE",
    "brick": 10777692,
    "trim": 12957860,
    "frame": 5722700,
    "glass": 3886422,
    "door": 5981752,
    "rearStyle": "chamfered-bay"
  },
  {
    "source": "2230 N PARK AVE",
    "brick": 10255209,
    "trim": 13155496,
    "frame": 6182994,
    "glass": 4018008,
    "door": 5128762,
    "rearStyle": "chamfered-bay"
  },
  {
    "source": "2232 N PARK AVE",
    "brick": 11639686,
    "trim": 13353651,
    "frame": 6446422,
    "glass": 4149851,
    "door": 6114368,
    "rearStyle": "chamfered-bay"
  },
  {
    "source": "2234 N PARK AVE",
    "brick": 10316630,
    "trim": 12892067,
    "frame": 5591114,
    "glass": 3886422,
    "door": 4931382,
    "rearStyle": "chamfered-bay"
  },
  {
    "source": "2236 N PARK AVE",
    "brick": 11041893,
    "trim": 13089703,
    "frame": 5788493,
    "glass": 3952215,
    "door": 5522489,
    "rearStyle": "chamfered-bay"
  },
  {
    "source": "2238 N PARK AVE",
    "brick": 9925472,
    "trim": 13023910,
    "frame": 5722700,
    "glass": 4018008,
    "door": 5062453,
    "rearStyle": "flat-wing"
  },
  {
    "source": "2240 N PARK AVE",
    "brick": 10581599,
    "trim": 13155496,
    "frame": 5854029,
    "glass": 3952215,
    "door": 5390904,
    "rearStyle": "flat-wing"
  },
  {
    "source": "2242 N PARK AVE",
    "brick": 11441792,
    "trim": 13287600,
    "frame": 6314836,
    "glass": 4084058,
    "door": 5916989,
    "rearStyle": "flat-wing"
  },
  {
    "source": "2244 N PARK AVE",
    "brick": 10186072,
    "trim": 12957860,
    "frame": 5656907,
    "glass": 3886422,
    "door": 4996918,
    "rearStyle": "chamfered-bay"
  },
  {
    "source": "2246 N PARK AVE",
    "brick": 10910564,
    "trim": 13089703,
    "frame": 5788493,
    "glass": 3952215,
    "door": 5588282,
    "rearStyle": "flat-wing"
  },
  {
    "source": "2248 N PARK AVE",
    "brick": 10122594,
    "trim": 13023910,
    "frame": 5722700,
    "glass": 4018008,
    "door": 5128246,
    "rearStyle": "chamfered-bay"
  },
  {
    "source": "2250 N PARK AVE",
    "brick": 11507843,
    "trim": 13353651,
    "frame": 6249043,
    "glass": 4084058,
    "door": 5851196,
    "rearStyle": "flat-wing"
  },
  {
    "source": "2252 N PARK AVE",
    "brick": 10646621,
    "trim": 13089703,
    "frame": 5788493,
    "glass": 3952215,
    "door": 5456696,
    "rearStyle": "flat-wing"
  },
  {
    "source": "2254 N PARK AVE",
    "brick": 10186844,
    "trim": 12957860,
    "frame": 5656907,
    "glass": 3886422,
    "door": 4996918,
    "rearStyle": "flat-wing"
  },
  {
    "source": "2256 N PARK AVE",
    "brick": 11376257,
    "trim": 13287600,
    "frame": 6183250,
    "glass": 4084058,
    "door": 5785403,
    "rearStyle": "flat-wing"
  },
  {
    "source": "2258 N PARK AVE",
    "brick": 10516579,
    "trim": 13023910,
    "frame": 5722700,
    "glass": 4018008,
    "door": 5259575,
    "rearStyle": "flat-wing"
  },
  {
    "source": "2260 N PARK AVE",
    "brick": 10251864,
    "trim": 12957860,
    "frame": 5656907,
    "glass": 3886422,
    "door": 5062453,
    "rearStyle": "flat-wing"
  },
  {
    "source": "2262 N PARK AVE",
    "brick": 11178621,
    "trim": 13221808,
    "frame": 6117457,
    "glass": 4084058,
    "door": 5654074,
    "rearStyle": "flat-wing"
  },
  {
    "source": "2264 N PARK AVE",
    "brick": 10450014,
    "trim": 13089703,
    "frame": 5788493,
    "glass": 3952215,
    "door": 5390904,
    "rearStyle": "flat-wing"
  }
]);
function hash(s){let h=2166136261;for(const ch of s){h=Math.imul(h^ch.charCodeAt(0),16777619);}return h>>>0;}
function extents(r){return {w:Math.max(...r.map(p=>p[0]))-Math.min(...r.map(p=>p[0])),d:Math.max(...r.map(p=>p[1]))-Math.min(...r.map(p=>p[1])),rear:Math.max(...r.map(p=>p[1]))};}
// The city coordinate X axis follows Broad Street. These 13 narrow,
 // cross-street footprints are rotated approximately 90 degrees relative
 // to the existing Park rowhouse template. Explicit BIN allowlist comes
 // from the frozen city polygon/centerline audit, not destination photos.
 // The selected wall faces the named street; no guessed party-wall windows.
const CROSS_STREET_ROWS=Object.freeze({
 'park13-1003701':1,'park13-1497655':1,'park13-1001889':1,
 'park13-1001312':1,'park13-1002125':1,'park13-1002126':1,'park13-1000719':1,
 'park13-1048637':-1,'park13-1048760':-1,'park13-1048758':-1,
 'park13-1048759':-1,'park13-1049216':-1,'park13-1049214':-1
});
function crossStreetWall(record,ring,w,d,h){
 const direction=record.provisionalOnly?0:CROSS_STREET_ROWS[record.id];
 if(!direction||w<12||w>24||d<4.5||d>7||h<9||h>14.5)return null;
 const edge=Math.max(...ring.map(p=>direction*p[0]));
 return extractWallSegments(ring).filter(q=>direction*q.nx>.9&&q.len>=3&&q.len<=7&&Math.max(direction*q.x1,direction*q.x2)>edge-1.5).sort((a,b)=>b.len-a.len)[0]??null;
}
// Explicit frozen-BIN exceptions. Park bays use their actual narrow rear
// wall, and 2400 N 13th is a documented townhome facing 13th Street.
// Dauphin Arms and Cumberland apartment use is independently documented;
// these illustrative repeated upper openings are not a measured elevation.
const NARROW_PARK_BAYS=new Set(['park13-1057358','park13-1059063']);
const APARTMENT_WALLS=Object.freeze({
 'park13-1000728':{axis:'nz',direction:1,min:10,max:24},
 'park13-1006625':{axis:'nz',direction:1,min:10,max:24},
 'park13-1053426':{axis:'nx',direction:-1,min:15,max:26}
});
function reviewedWall(record,ring,rear){
 if(record.provisionalOnly)return null;
 const segs=extractWallSegments(ring);
 if(NARROW_PARK_BAYS.has(record.id))return segs.filter(q=>q.nz>.9&&q.len>=1.5&&q.len<2.2&&Math.max(q.z1,q.z2)>rear-.35).sort((a,b)=>b.len-a.len)[0]??null;
 if(record.id==='park13-1025432')return segs.filter(q=>q.nz<-.9&&q.len>=4&&q.len<7).sort((a,b)=>b.len-a.len)[0]??null;
 return null;
}
function apartmentWall(record,ring){
 const spec=!record.provisionalOnly&&APARTMENT_WALLS[record.id];
 return spec?extractWallSegments(ring).filter(q=>spec.direction*q[spec.axis]>.95&&q.len>=spec.min&&q.len<=spec.max).sort((a,b)=>b.len-a.len)[0]??null:null;
}
// Landmark-specific provisional treatments, not measured elevations.
// 1902 Students' Chapter Hall: 2017 Hidden City report documents mint-green
// exterior. Elverson school: district assessment documents face brick,
// decorative stone trim and double-hung glazing. Exact patterns unverified.
const LANDMARKS=Object.freeze({
 'park13-1000916':{kind:'historic-meeting-hall',body:0x92b6a4,trim:0xb8c8b8,glass:0x445957},
 'park13-1002344':{kind:'historic-school',body:0x945b48,trim:0xc7bda4,glass:0x43565e}
});
function renderLandmarkWall(record,ring,h,spec,box){
 const segments=extractWallSegments(ring).filter(q=>q.nz>.95&&q.len>=6);
 const walls=spec.kind==='historic-school'?segments.filter(q=>q.len>=7):segments.filter(q=>q.len>=6);
 let count=0;
 for(const {x1,z1,tx,tz,nx,nz,len} of walls){
  const angle=Math.atan2(nx,nz);
  const put=(t,y,w,hh,d,o,c)=>{box(x1+tx*t+nx*o,y,z1+tz*t+nz*o,w,hh,d,c,angle);count++;};
  // Restrained attached masonry bands and evenly spaced upper openings.
  // Do not add invented signage, entrances, minarets, or special roof forms.
  put(len/2,h-.45,len-.45,.32,.15,.015,spec.trim);
  if(spec.kind==='historic-school'){
   const bays=Math.max(2,Math.floor(len/3.2));
   for(const y of [h*.40,h*.64,h*.83])for(let i=0;i<bays;i++){
    const t=len*(i+.5)/bays;
    put(t,y,1.36,2.12,.14,.015,spec.trim);
    put(t,y,1.18,1.94,.10,.065,spec.glass);
    put(t,y,1.18,.065,.055,.10,spec.trim);
   }
  }
 }
 return count;
}
// Final two frozen source records have unresolved individual building use.
// Keep them visibly distinct from completed residential facade candidates.
// Only shallow neutral roof-edge trim; no assumed openings or entrances.
const NEUTRAL_SHELLS=Object.freeze({
 'park13-1079502':'2300–2360 N 13th parcel; individual structure use unconfirmed',
 'park13-1502953':'Dauphin Arms parcel; individual structure use unconfirmed'
});
function renderNeutralShell(ring,h,box){
 let count=0;
 for(const q of extractWallSegments(ring).filter(q=>Math.abs(q.nz)>.95&&q.len>=3)){
  const {x1,z1,tx,tz,nx,nz,len}=q,t=len/2,angle=Math.atan2(nx,nz);
  box(x1+tx*t+nx*.012,h-.23,z1+tz*t+nz*.012,len-.40,.18,.11,0x737471,angle);
  count++;
 }
 return count;
}
// Southern institutional supplement: preserve municipal massing. Charles
// Library uses documented dark split-face granite; arch entrances/roof
// terraces are not reconstructed from footprint alone.
const SOUTHERN_CAMPUS=Object.freeze({
 'park13-1003184':{name:'Annenberg Hall parcel complex',body:0x96958e,trim:0x777771},
 'park13-1007541':{name:'Charles Library parcel',body:0x45484a,trim:0x535658}
});
// Reference-based low-LOD Charles Library exterior relief. The nominal
// 6-inch granite cladding is grouped four strips per coarse visual rib.
// Arch is an approximate attached surface, NOT a carved accessible entry.
function renderCharlesRelief(ring,h,box){
 const walls=extractWallSegments(ring),stone=0x62666a,glass=0x46616e,cedar=0xad743f,frame=0x30383c;
 let count=0;
 const put=(q,t,y,w,hh,d,o,c)=>{box(q.x1+q.tx*t+q.nx*o,y,q.z1+q.tz*t+q.nz*o,w,hh,d,c,Math.atan2(q.nx,q.nz));count++;};
 for(const q of walls.filter(q=>q.len>35&&Math.abs(q.nz)>.95&&Math.min(q.x1,q.x2)>228&&Math.max(q.x1,q.x2)<285)){
  const n=Math.floor((q.len-.7)/.6096),pitch=(q.len-.7)/n;
  for(let i=0;i<n;i++)put(q,.35+pitch*(i+.5),h*.415,.10,h*.73,.12,.012,stone);
  const gh=2.85,gy=h-gh/2-.48;
  put(q,q.len/2,gy,q.len-.72,gh,.16,.018,glass);
  const bays=Math.ceil((q.len-.9)/1.65);
  for(let i=1;i<bays;i++)put(q,.45+(q.len-.9)*i/bays,gy,.055,gh,.20,.035,frame);
 }
 // Use original individual edges, NOT merged chords: a shallow relief
 // on a curved source boundary must follow the real polygon exactly.
 const sign=ring.slice(1).reduce((a,p,i)=>a+ring[i][0]*p[1]-p[0]*ring[i][1],0)>=0?1:-1,arch=[];
 for(let i=1;i<ring.length;i++){
  const [x1,z1]=ring[i-1],[x2,z2]=ring[i],len=Math.hypot(x2-x1,z2-z1);
  if(len<.10||Math.min(z1,z2)>-179.9||Math.min(x1,x2)<263||Math.max(x1,x2)>294)continue;
  const tx=(x2-x1)/len,tz=(z2-z1)/len,nx=sign*tz,nz=-sign*tx;
  if(nz<-.95)arch.push({x1,z1,x2,z2,len,tx,tz,nx,nz});
 }
 const lo=Math.min(...arch.flatMap(q=>[q.x1,q.x2])),hi=Math.max(...arch.flatMap(q=>[q.x1,q.x2]));
 if(arch.length<3||hi-lo<25||hi-lo>33)throw Error('Charles entrance source edges changed');
 for(const q of arch){
  const n=Math.ceil(q.len/.55),pitch=q.len/n;
  for(let i=0;i<n;i++){
   const t=pitch*(i+.5),x=q.x1+q.tx*t,u=(x-lo)/(hi-lo),a=Math.max(0,1-(2*u-1)**2);
   const top=.45+7.8*a,opening=Math.max(.18,top-1.3*Math.sqrt(a));
   put(q,t,opening/2,pitch*.94,opening,.20,.015,glass);
   const hh=top-opening;if(hh>.06)put(q,t,opening+hh/2,pitch*.94,hh,.22,.012,cedar);
   if(i%3===0&&opening>.45&&pitch>.13)put(q,t,opening/2,.055,opening,.24,.035,frame);
  }
 }
 return count;
}
// Annenberg/Tomlinson complex: Temple 2018 entrance photograph, 2014
// ticker installation article, and November 2023 campus map. The
// northern wing is a plausible 13th Street elevation, not measured
// entrance placement. Retain the rest of the combined source shell.
function renderAnnenbergRelief(ring,h,box){
 const walls=extractWallSegments(ring);
 const q=walls.find(q=>q.nz<-.95&&q.len>35&&q.len<38&&Math.min(q.x1,q.x2)>35&&Math.max(q.x1,q.x2)<74);
 if(!q)throw Error('Annenberg source wall changed');
 const brick=0x895b48,concrete=0xc3c1b8,glass=0x435961,frame=0x92979b,red=0x952c36,black=0x20262a;
 const {x1,z1,tx,tz,nx,nz,len}=q,angle=Math.atan2(nx,nz);
 let count=0;
 const put=(t,y,w,hh,d,o,c)=>{box(x1+tx*t+nx*o,y,z1+tz*t+nz*o,w,hh,d,c,angle);count++;};
 // Reference-derived brick below pale upper cladding. No assumed floor count.
 put(len/2,h*.40,len-.65,h*.78,.14,.012,brick);
 put(len/2,h*.89,len-.65,h*.20,.18,.015,concrete);
 const center=len*.52,entryWidth=10.8,low=1.0,head=5.5;
 // Shallow glazed entrance relief, divided into estimated broad bays.
 put(center,(head+low)/2,entryWidth,head-low,.24,.045,glass);
 for(let i=0;i<=8;i++)put(center-entryWidth/2+i*entryWidth/8,(head+low)/2,.10,head-low,.28,.045,frame);
 put(center,3.15,entryWidth,.10,.28,.045,frame);
 // Documented red structural fascia, dark ticker panel and pale top edge.
 // Shallow cantilever attaches to the shell; no guessed signage text.
 put(center,5.8,entryWidth+1.1,.42,.80,.25,red);
 put(center,5.84,entryWidth+.60,.23,.84,.28,black);
 put(center,6.10,entryWidth+1.1,.18,.74,.22,concrete);
 // Red vertical end piers and light base relief; do not claim cylindrical
 // reconstruction, actual steps or access geometry from one photograph.
 for(const t of [center-entryWidth/2-.30,center+entryWidth/2+.30]){
  put(t,3.0,.45,5.5,.52,.16,red);
  put(t,.42,.60,.84,.59,.18,concrete);
 }
 // Simple light-colored framing around two upper glazed sections,
 // not an exact count of windows or measured curtainwall.
 for(const t of [center-3.1,center+3.1]){
  put(t,8.4,4.9,2.8,.20,.025,concrete);
  put(t,8.4,4.60,2.50,.24,.035,glass);
  for(const v of [-1.15,0,1.15])put(t+v,8.4,.07,2.50,.30,.04,frame);
 }
 return count;
}
// Architect documents substantial green roof and planted reading gardens.
// Inset patches represent roof type, NOT measured roof layout or slope.
function renderCharlesRoof(h,box){
 const zones=[[199.5,214.8,-167,-124.5],[231,288,-152,-136.5],[292,320.5,-151.5,-136.5],[269,287,-178,-162]];
 let count=0;
 for(const [x0,x1,z0,z1] of zones){
  box((x0+x1)/2,h+.09,(z0+z1)/2,x1-x0,.16,z1-z0,0x65754c,0);count++;
  const width=x1-x0,depth=z1-z0;
  for(let i=0;i<3;i++){
   box(x0+width*(i+.5)/3,h+.17,z0+depth*(.35+.15*(i%2)),width*.24,.10,depth*.42,[0x778054,0x596d48,0x8a8758][i],0);count++;
  }
 }
 return count;
}
function renderCampusShell(ring,h,spec,box){
 let count=0;
 for(const q of extractWallSegments(ring).filter(q=>q.len>=6&&Math.abs(q.nz)>.95)){
  const {x1,z1,tx,tz,nx,nz,len}=q,angle=Math.atan2(nx,nz),t=len/2;
  box(x1+tx*t+nx*.012,h-.28,z1+tz*t+nz*.012,len-.50,.24,.12,spec.trim,angle);count++;
 }
 if(spec.name==='Charles Library parcel')count+=renderCharlesRelief(ring,h,box)+renderCharlesRoof(h,box);
 if(spec.name==='Annenberg Hall parcel complex')count+=renderAnnenbergRelief(ring,h,box);
 return count;
}
// Second street-facing elevation for frozen residential-size footprints.
// Illustrative upper windows; no measured elevations or inferred entrances.
const THIRTEENTH_SECONDARY=new Set(["park13-1012856","park13-1024178","park13-1025427","park13-1025428","park13-1025431","park13-1025434","park13-1025843","park13-1026029","park13-1026158","park13-1026159","park13-1026163","park13-1026165","park13-1026166","park13-1026167","park13-1026168","park13-1026169","park13-1026174","park13-1026175","park13-1079070"]);
// 2422 N 13th: address-matched Apartments.com exterior photograph.
// Approximate dimensions scaled to the source wall, not measured.
// Preserve the opposite elevation; replace only .62's generic front.
function render2422Front(q,h,box){
 const len=q.len,angle=Math.atan2(q.nx,q.nz),red=0xa53a35,base=0xbe443d,metal=0x9b9a8b,glass=0x383d3a,frame=0x82766b,awning=0xc85749;
 let count=0;
 const put=(t,y,w,hh,d,o,c)=>{box(q.x1+q.tx*t+q.nx*o,y,q.z1+q.tz*t+q.nz*o,w,hh,d,c,angle);count++;};
 put(len/2,h/2,len-.10,h-.08,.12,.025,red);
 put(len/2,.48,len-.14,.96,.19,.035,base);
 put(len/2,h-.42,len-.15,.64,.18,.06,metal);
 for(const t of [len*.25,len*.72]){
  put(t,h*.725,1.11,1.53,.20,.065,frame);
  put(t,h*.725,.90,1.30,.18,.13,glass);
  put(t,h*.725-.77,1.18,.12,.28,.10,frame);
  // Low-LOD terraced approximation of downward projecting metal awnings.
  for(let i=0;i<4;i++)put(t,h*.85-i*.105,1.24,.15,.22,.14+i*.13,metal);
 }
 for(const t of [len*.19,len*.47]){
  put(t,2.12,.98,1.62,.21,.065,frame);
  put(t,2.12,.81,1.43,.18,.14,glass);
  for(let i=0;i<3;i++)put(t+(i-1)*.21,2.12,.045,1.44,.10,.21,frame);
 }
 const entry=len*.79;
 put(entry,1.78,.94,2.25,.20,.07,frame);
 put(entry,1.78,.77,2.10,.18,.14,glass);
 for(let i=0;i<4;i++)put(entry+(i-1.5)*.16,1.78,.045,2.08,.11,.21,frame);
 put(entry,1.78,.80,.055,.12,.22,frame);
 for(let i=0;i<5;i++)put(len/2,3.30-i*.065,len-.18,.11,.22,.12+i*.13,awning);
 // The actual entry has a stoop; omit treads until sidewalk clearance
 // and entry elevation are surveyed. Model the basement opening only.
 put(len*.40,.43,.75,.44,.23,.085,frame);
 put(len*.40,.43,.61,.31,.18,.16,glass);
 return count;
}
function renderThirteenthSecondary(record,ring,h,style,box){
 if(record.provisionalOnly||!THIRTEENTH_SECONDARY.has(record.id))return 0;
 const edge=Math.min(...ring.map(p=>p[1]));
 const q=extractWallSegments(ring).filter(q=>q.nz<-.95&&q.len>=2.5&&Math.min(q.z1,q.z2)<edge+.5).sort((a,b)=>b.len-a.len)[0];
 if(!q)throw Error('13th Street secondary wall changed '+record.id);
 if(record.id==='park13-1079070')return render2422Front(q,h,box);
 let count=0;const put=(t,y,w,hh,d,o,c)=>{box(q.x1+q.tx*t+q.nx*o,y,q.z1+q.tz*t+q.nz*o,w,hh,d,c,Math.atan2(q.nx,q.nz));count++;};
 for(const t of [q.len*.28,q.len*.72]){
  put(t,h*.71,1.06,1.47,.12,.012,style.trim);
  put(t,h*.71,.90,1.31,.16,.035,style.glass);
  put(t,h*.71-.80,1.12,.13,.15,.025,style.trim);
 }
 put(q.len/2,h-.22,q.len-.45,.19,.15,.012,style.trim);
 return count;
}
export function renderPark13Record(record,{block,box}){
 if(!record?.replaceable||!String(record.id).startsWith('park13-')||!Number.isFinite(record.height)||record.height<=0||!Array.isArray(record.polys)||!record.polys.length)throw Error('Invalid provisional expansion record');
 const h=record.height,key=hash(record.id),style=WATTS_STYLES[key%WATTS_STYLES.length];
 let details=0,volumes=0,facades=0;
 const neutral=!record.provisionalOnly&&NEUTRAL_SHELLS[record.id],campus=!record.provisionalOnly&&SOUTHERN_CAMPUS[record.id];
 for(const poly of record.polys){
  const ring=poly[0],{w,d,rear}=extents(ring);
  const cross=crossStreetWall(record,ring,w,d,h),reviewed=reviewedWall(record,ring,rear),apartment=apartmentWall(record,ring);
  const rowhouse=!!cross||(w>=2.4&&w<=9.5&&d>=5&&h>=4.5&&h<=14.5);
  const landmark=!record.provisionalOnly&&LANDMARKS[record.id];
  block(poly,h,campus?campus.body:neutral?0x9a9285:landmark?landmark.body:rowhouse?style.brick:0x9a9285,0,{aerialRoof:false});volumes++;
  block(poly,.15,0x737471,h-.06,{aerialRoof:false});volumes++;
  if(campus){const n=renderCampusShell(ring,h,campus,box);details+=n;if(n)facades++;continue;}
  if(neutral){const n=renderNeutralShell(ring,h,box);details+=n;if(n)facades++;continue;}
  if(landmark){const n=renderLandmarkWall(record,ring,h,landmark,box);details+=n;if(n)facades++;continue;}
  if(apartment&&!rowhouse){
   const {x1,z1,tx,tz,nx,nz,len}=apartment,angle=Math.atan2(nx,nz);
   const bays=Math.max(3,Math.floor(len/2.8));
   // Two widely spaced illustrative upper window bands; no inferred doors,
   // ground-floor usage, signage, or exact floor count. Shallow attached trim.
   for(const y of [h*.45,h*.73])for(let i=0;i<bays;i++){
    const t=len*(i+.5)/bays;
    for(const [ww,hh,dd,offset,color] of [[1.08,1.50,.14,.015,style.trim],[.92,1.34,.10,.065,style.glass]]){
     box(x1+tx*t+nx*offset,y,z1+tz*t+nz*offset,ww,hh,dd,color,angle);details++;
    }
   }
   facades++;continue;
  }
  if(!rowhouse)continue; // Do not mislabel garages, warehouses or large institutions.
  const segments=extractWallSegments(ring).filter(q=>q.nz>.80&&q.len>=2.2&&Math.max(q.z1,q.z2)>rear-1.5);
  // Only the longest Broad-facing segment: no extraneous side-return or rear
  // features on unknown buildings. Actual edge normal supplies orientation.
  // A mirrored proxy may have a chamfered source bay or recessed end.
  // Allow a shorter or slightly recessed wall for the explicitly temporary
  // layer only, without changing the actual GIS-candidate selection policy.
  const fallback=record.provisionalOnly?extractWallSegments(ring).filter(q=>q.nz>.80&&q.len>=1.35&&Math.max(q.z1,q.z2)>rear-2.25):[];
  const seg=cross??reviewed??(segments.length?segments:fallback).sort((a,b)=>b.len-a.len)[0];if(!seg)continue;facades++;
  const {x1,z1,tx,tz,nx,nz,len}=seg,angle=Math.atan2(nx,nz),floors=Math.max(2,Math.min(4,Math.round(h/3.35))),pitch=h/floors;
  const bays=len>=4.15?2:1;
  const put=(t,y,width,height,depth,offset,color)=>{
    box(x1+tx*t+nx*offset,y,z1+tz*t+nz*offset,width,height,depth,color,angle);details++;
  };
  for(let floor=0;floor<floors;floor++)for(let i=0;i<bays;i++){
   const t=len*(i+.5)/bays,door=floor===0&&i===(key%2===0?0:bays-1);
   const ww=Math.min(door?.88:.92,len/bays*.53),wh=door?Math.min(2.05,pitch*.70):Math.min(1.34,pitch*.45);
   const y=door?wh/2:(floor+.52)*pitch;
   // Both trim and glazing physically overlap their backing. Geometry is
   // intentionally less complex than the six-piece foreground sash.
   put(t,y,ww+.15,wh+.12,.16,.015,style.trim);
   put(t,y,ww,wh,.10,.075,door?style.door:style.glass);
   if(!door&&floor>0&&key%3===0)put(t,y-wh/2-.065,ww+.18,.10,.19,.04,style.trim);
  }
  put(len/2,h-.16,Math.max(.10,len-.24),.16,.20,.015,style.trim);
  details+=renderThirteenthSecondary(record,ring,h,style,box);
 }
 return {id:record.id,styleSource:style.source,volumes,facades,details,replaceable:true,status:'provisional Watts-derived background',...(campus?{styleSource:campus.name,status:campus.name==='Charles Library parcel'?'reference-based facade and provisional planted roof; approximate arch and upper glazing, not recessed or transparent' :'reference-based Annenberg entrance relief; approximate placement and dimensions; Tomlinson massing provisional'}:{}),...(!record.provisionalOnly&&THIRTEENTH_SECONDARY.has(record.id)?{status:'provisional dual elevation; 13th-facing upper openings and trim are illustrative, not photo-verified'}:{}),...(!record.provisionalOnly&&record.id==='park13-1079070'?{status:'photo-referenced 13th Street facade: red painted brick, paired upper awnings and lower canopy; estimated dimensions, stoop not modeled',evidenceNote:'Apartments.com 2422 N 13th listing exterior; capture date unknown'}:{}),...(neutral?{styleSource:'neutral shell',status:'unresolved individual structure use; provisional trim only',evidenceNote:neutral}: {})};
}
export function renderPark13Expansion(manifest,callbacks){
 if(manifest?.schema!==1||!Array.isArray(manifest.records))throw Error('Invalid expansion manifest');
 if(new Set(manifest.records.map(r=>r.id)).size!==manifest.records.length)throw Error('Duplicate expansion ID');
 return manifest.records.map(record=>renderPark13Record(record,callbacks));
}
