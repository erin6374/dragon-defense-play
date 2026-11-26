import {loadLookup,saveLookup,approximatePosition,streetLinks,geocodeSchool,osmFootprints,nearbyCandidates,confidenceLabel,commonsNearbyPhotos,googleStreetViewCandidate,mapillaryNearbyPhotos,scoreCandidate} from './reference-lookup.js';
import {BuildingViewer} from './model-viewer.js';
const $=id=>document.getElementById(id);const {buildings,build}=await (await fetch('./buildings.json')).json();
const manifest=await (await fetch('./reference-manifest.json')).json();
const viewer=new BuildingViewer($('render'));const ns='http://www.w3.org/2000/svg';let current=buildings.find(b=>b.id===location.hash.slice(1))||buildings.find(b=>b.school)||buildings[0];let night=false;let photoURL=null;
const geo=loadLookup();geo.buildings ||= {};let footprintCache=[];let candidateImages=[];let photoRequest=0;let photoSearchCache=new Map();const school=buildings.find(b=>b.school);
const reviewsKey='broad-street-rc86-reviews-v3';let reviews={};try{reviews=JSON.parse(localStorage.getItem(reviewsKey)||'{}')}catch{};
function persist(){localStorage.setItem(reviewsKey,JSON.stringify(reviews))}
const dbPromise=new Promise((resolve,reject)=>{let q=indexedDB.open('broad-street-studio-v3',1);q.onupgradeneeded=()=>q.result.createObjectStore('photos');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
async function photoStore(id,blob){const db=await dbPromise;return new Promise((resolve,reject)=>{let tx=db.transaction('photos','readwrite');tx.objectStore('photos').put(blob,id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
async function photoGet(id){const db=await dbPromise;return new Promise((resolve,reject)=>{let q=db.transaction('photos').objectStore('photos').get(id);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)})}
function svg(tag,attrs={},label){let n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(label)n.textContent=label;return n}
const map=$('map');map.append(svg('rect',{x:100,y:0,width:80,height:1120,fill:'#323f4e'}));map.append(svg('text',{x:130,y:510,fill:'#d9e6f4',transform:'rotate(90 130 510)','font-size':16},'N BROAD STREET'));
for(const [label,x] of [['DAUPHIN',-53],['SUSQUEHANNA',53]]){const y=555+x*2.15;map.append(svg('rect',{x:0,y:y-13,width:390,height:26,fill:'#526071'}));map.append(svg('text',{x:8,y:y-17,fill:'#fff','font-size':12},label))}
const color={brick:'#975e4a',brickRed:'#a45243',brickBrown:'#735049',brickTan:'#b18b70',stone:'#a9a49c',stoneGray:'#a9afb1',creamWarm:'#d7c6a7'};
for(const b of buildings){const y=555+b.x*2.15,x=324-b.z*2.0;let n=svg('rect',{x:x-b.d,y:y-b.w*1.075,width:b.d*2,height:b.w*2.15,fill:b.school?'#f1c15b':color[b.kind]||'#8392a3',class:'building',id:'map-'+b.id});n.append(svg('title',{},`${b.id} ${b.name}`));n.addEventListener('click',()=>select(b));map.append(n);map.append(svg('text',{x:x-b.d-4,y:y+3,fill:'#f4f6fc','font-size':9,'text-anchor':'end'},b.id))}
for(const b of buildings){let o=document.createElement('option');o.value=b.id;o.textContent=`${b.id} · ${b.name}`;$('buildingList').append(o)}$('buildingList').onchange=()=>select(buildings.find(b=>b.id===$('buildingList').value));
function setStatus(s){$('status').textContent=s}
function getReview(){return reviews[current.id]||{status:'unreviewed',confidence:'unverified',notes:current.notes||'',source:'',date:'',license:''}}
function collect(){const r={status:$('reviewStatus').value,confidence:$('confidence').value,notes:$('notes').value,source:$('source').value,date:$('date').value,license:$('license').value,updatedAt:new Date().toISOString(),modelSource:'RC86 shared geometry',buildingId:current.id};reviews[current.id]=r;persist();return r}
function download(name,content,mime='application/json'){let url=URL.createObjectURL(new Blob([content],{type:mime}));let a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)}
async function displayPhoto(b){if(photoURL){URL.revokeObjectURL(photoURL);photoURL=null}let el=$('photo');el.replaceChildren();let imgData=await photoGet(b.id).catch(()=>null);if(current.id!==b.id)return;let entry=manifest.entries[b.id];if(imgData){photoURL=URL.createObjectURL(imgData);let img=document.createElement('img');img.src=photoURL;img.className='visual';img.alt='Locally supplied real-world reference';el.className='';el.append(img)}else if(entry?.file){let img=document.createElement('img');img.src='../reference-images/'+entry.file;img.className='visual';img.alt='Licensed real-world reference';el.className='';el.append(img)}else{el.className='placeholder';el.textContent='Finding nearby reference images…';await autoPhotoCandidates(b)}}
async function select(b){photoRequest++;current=b;$('walk').href='street.html#'+b.id;$('buildingList').value=b.id;document.querySelectorAll('.building').forEach(x=>x.classList.toggle('active',x.id==='map-'+b.id));$('heading').textContent=`${b.id} · ${b.name}`;$('meta').innerHTML=[['Width',b.w],['Height',b.h],['Floors',b.stories],['Depth',b.d]].map(([k,v])=>`<div><small>${k}</small><br><strong>${v}</strong></div>`).join('');refreshGeoForm(b);$('sourceLabel').textContent=`${build} source · ${b.school?'TF-001: intentional school overscale':'approximate frontage'} · x=${b.x}, z=${b.z}`;const r=getReview();for(const [field,key] of [['reviewStatus','status'],['confidence','confidence'],['notes','notes'],['source','source'],['date','date'],['license','license']])$(field).value=r[key]||'';const m=manifest.entries[b.id];if(m){for(const [field,key] of [['source','source'],['date','date'],['license','license']])if(!$(field).value)$(field).value=m[key]||''}
 try{let stats=viewer.load(b);$('modelStats').textContent=`${stats.landmark?"Landmark study":"RC86 structural model"}: ${stats.components} physical parts · ${stats.drawBatches} draw batches (isolated preview).`;viewer.setNight(night);$('currentSmall').src=viewer.png();setStatus('Rendered '+b.id+' using shared RC86 geometry and facade code.')}catch(e){setStatus('3D rendering error: '+e.message);console.error(e)}
 let saved=localStorage.getItem('baseline:'+b.id);let box=$('baselineView');box.replaceChildren();if(saved){let img=document.createElement('img');img.src=saved;img.id='previous';img.alt='Saved previous building baseline';box.className='';box.append(img)}else{box.className='placeholder';box.textContent='No baseline captured'};await displayPhoto(b)}
$('upload').onchange=async e=>{const f=e.target.files[0];if(!f)return;if(!f.type.startsWith('image/'))return setStatus('Please choose an image');await photoStore(current.id,f);await displayPhoto(current);setStatus('Reference photo stored locally in this browser. Add provenance and save review.')};
$('save').onclick=()=>{collect();setStatus('Review saved locally for '+current.id)};
$('baseline').onclick=()=>{let png=viewer.png();try{localStorage.setItem('baseline:'+current.id,png);let box=$('baselineView');box.className='';box.innerHTML='';let img=new Image();img.id='previous';img.src=png;box.append(img);setStatus('Baseline saved for '+current.id)}catch(e){setStatus('Browser storage full; download PNG instead: '+e.message)}};
$('snapshot').onclick=()=>{const a=document.createElement('a');a.href=viewer.png();a.download=current.id+'-rc86-model.png';a.click()};
$('export').onclick=()=>download(current.id+'-review.json',JSON.stringify({schema:3,build,building:current,review:collect(),photoIncluded:false,geography:geo.buildings[current.id]||null,calibration:geo.anchor?{anchor:geo.anchor,bearing:geo.bearing}:null},null,2));
$('exportAll').onclick=()=>download('broad-street-reviews.json',JSON.stringify({schema:3,build,reviews:{...reviews,[current.id]:collect()},geography:geo,note:'Local image blobs are not included; export images separately with verified licensing.'},null,2));
$('import').onclick=()=>$('importFile').click();$('importFile').onchange=async e=>{try{let j=JSON.parse(await e.target.files[0].text());if(j.schema!==3)throw Error('Unsupported review schema');let incoming=j.reviews||(j.building&&j.review?{[j.building.id]:j.review}:null);if(!incoming&&!j.geography)throw Error('No reviews or geography found');if(j.geography){if(j.geography.buildings){Object.assign(geo.buildings,j.geography.buildings);if(j.geography.anchor)geo.anchor=j.geography.anchor;if(Number.isFinite(+j.geography.bearing))geo.bearing=j.geography.bearing;}else if(j.building?.id){geo.buildings[j.building.id]=j.geography;}saveLookup(geo)}for(const [id,r] of Object.entries(incoming||{}))if(buildings.some(b=>b.id===id))reviews[id]=r;persist();await select(current);setStatus('Imported reviews and geographic metadata; photos remain local and are not in JSON')}catch(err){setStatus('Import failed: '+err.message)}};
$('front').onclick=()=>viewer.setAngle(0);$('angle').onclick=()=>viewer.setAngle(.6);$('back').onclick=()=>viewer.setAngle(Math.PI);$('night').onclick=()=>{night=!night;viewer.setNight(night);$('night').textContent=night?'Day':'Night'};
$('previousBuilding').onclick=()=>select(buildings[(buildings.indexOf(current)+buildings.length-1)%buildings.length]);$('nextBuilding').onclick=()=>select(buildings[(buildings.indexOf(current)+1)%buildings.length]);

function geoPoint(b=current){
 const saved=geo.buildings[b.id]||{};
 if(Number.isFinite(+saved.lat)&&Number.isFinite(+saved.lon)&&saved.lat!==''&&saved.lon!=='')return {lat:+saved.lat,lon:+saved.lon,accuracy:'Manual override'};
 if(!geo.anchor)return null;
 return approximatePosition({...b,x:b.x-school.x,z:b.z-school.z},geo.anchor,geo.bearing||0);
}
function refreshGeoForm(b){
 $('anchorLat').value=geo.anchor?.lat??'';$('anchorLon').value=geo.anchor?.lon??'';$('bearing').value=geo.bearing??0;
 const g=geo.buildings[b.id]||{};$('matchAddress').value=g.address||'';$('matchLat').value=g.lat??'';$('matchLon').value=g.lon??'';
 $('candidateList').replaceChildren();$('referenceLinks').replaceChildren();
 const point=geoPoint(b);$('geoStatus').textContent=(point?`Location: ${point.lat.toFixed(6)}, ${point.lon.toFixed(6)}. `:'Location unknown. Calibrate school anchor. ')+confidenceLabel(g,point)+(g.footprintId?` · OSM way ${g.footprintId}`:'');
 if(g.sourceUrl){const a=document.createElement('a');a.href=g.sourceUrl;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Saved original reference ↗';$('referenceLinks').append(a)}
}
function saveAnchor(){const lat=Number($('anchorLat').value),lon=Number($('anchorLon').value),bearing=Number($('bearing').value);if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180||!$('anchorLat').value||!$('anchorLon').value)throw Error('Enter valid school latitude and longitude');geo.anchor={lat,lon};geo.bearing=bearing;saveLookup(geo)}
$('calibrate').onclick=async()=>{try{setStatus('Looking up 2221 N Broad St via OpenStreetMap Nominatim...');const options=await geocodeSchool();if(!options.length)throw Error('No school address result. Enter school coordinates manually.');const first=options[0];$('anchorLat').value=first.lat;$('anchorLon').value=first.lon;saveAnchor();refreshGeoForm(current);setStatus('Geocoder candidate: '+first.label+'. Check school location on map; set RC86 +X bearing before trusting other positions.')}catch(e){setStatus('School lookup failed: '+e.message)}};
$('bearing').onchange=()=>{try{saveAnchor();refreshGeoForm(current)}catch(e){setStatus(e.message)}};
$('anchorLat').onchange=()=>{try{saveAnchor();refreshGeoForm(current)}catch(e){setStatus(e.message)}};
$('anchorLon').onchange=()=>{try{saveAnchor();refreshGeoForm(current)}catch(e){setStatus(e.message)}};
$('saveMatch').onclick=()=>{try{const lat=$('matchLat').value.trim(),lon=$('matchLon').value.trim();if(Boolean(lat)!==Boolean(lon))throw Error('Both coordinates required for override');if(lat&&(!Number.isFinite(+lat)||!Number.isFinite(+lon)||Math.abs(+lat)>90||Math.abs(+lon)>180))throw Error('Invalid coordinates');const old=geo.buildings[current.id]||{};geo.buildings[current.id]={...old,address:$('matchAddress').value.trim(),lat:lat?+lat:'',lon:lon?+lon:'',manual:!!lat,manualVerified:false};saveLookup(geo);refreshGeoForm(current);setStatus('Saved location correction. Reference is not photo-verified.')}catch(e){setStatus(e.message)}};
$('verifyMatch').onclick=()=>{const g=geo.buildings[current.id]||{};if(!g.sourceUrl&&!$('source').value.trim()){setStatus('Enter a real-world original source URL in Photo source before verifying the facade.');return}const source=$('source').value.trim()||g.sourceUrl;try{const u=new URL(source);if(!['https:','http:'].includes(u.protocol))throw Error();}catch{setStatus('Enter a valid HTTP(S) original image source URL.');return}geo.buildings[current.id]={...g,sourceUrl:source,manualVerified:true,verifiedAt:new Date().toISOString()};saveLookup(geo);refreshGeoForm(current);setStatus('Reviewer confirmed facade source for '+current.id)};
$('clearMatch').onclick=()=>{delete geo.buildings[current.id];saveLookup(geo);refreshGeoForm(current);setStatus('Cleared geographic override for '+current.id)};
$('discover').onclick=()=>{const point=geoPoint();if(!point){setStatus('First calibrate the school geographic anchor.');return}const address=$('matchAddress').value.trim()||'North Broad Street, Philadelphia, PA';$('referenceLinks').replaceChildren();for(const link of streetLinks(point,address)){const a=document.createElement('a');a.href=link.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=link.name+' ↗';a.title=link.note;$('referenceLinks').append(a)}setStatus('Opened reference options for '+current.id+'. Approximate game positions are NOT confirmed building matches.');};
$('findFootprints').onclick=async()=>{try{const point=geoPoint();if(!point)throw Error('Calibrate school location first');setStatus('Querying OpenStreetMap building footprint candidates...');footprintCache=await osmFootprints(point.lat,point.lon,100);const candidates=nearbyCandidates(point,footprintCache,40);$('candidateList').replaceChildren();if(!candidates.length){$('candidateList').textContent='No mapped footprints near estimated position; correct coordinates manually.';return}for(const c of candidates){const div=document.createElement('div');div.className='candidate';const name=document.createElement('span');name.textContent=`${c.distance}m · ${c.address||c.name||'Unnamed building'} · OSM ${c.id}`;const button=document.createElement('button');button.textContent='Use candidate';button.onclick=()=>{const old=geo.buildings[current.id]||{};geo.buildings[current.id]={...old,lat:c.lat,lon:c.lon,address:c.address||old.address||'',footprintId:c.id,manual:true,manualVerified:false,footprintSource:c.source};saveLookup(geo);refreshGeoForm(current);setStatus('Candidate selected for '+current.id+'; verify against facade photos before approval.')};div.append(name,button);$('candidateList').append(div)}setStatus(`Found ${footprintCache.length} OSM footprints; ${candidates.length} nearby candidates. None auto-approved.`)}catch(e){setStatus('Footprint lookup failed: '+e.message)}};


// Automatic link-only photo candidate discovery on every building selection.
// Display candidates in-place; user must confirm the correct facade.
async function autoPhotoCandidates(b){
 const request=++photoRequest,point=geoPoint(b),el=$('photo');
 if(!point){el.className='placeholder';el.textContent='Location not yet available. School geocoding is running; if it fails use Find Tech Freire geographic anchor.';return}
 const g=geo.buildings[b.id]||{};
 const key=localStorage.getItem('broad-street-google-api-key')||'';
 const google=googleStreetViewCandidate(point.lat,point.lon,key);
 let candidates=google?[google]:[],error='';
 const token=sessionStorage.getItem('broad-street-mapillary-token')||'';
 const cacheKey=[point.lat.toFixed(5),point.lon.toFixed(5),!!token].join(':');
 let free=photoSearchCache.get(cacheKey);
 if(!free){
  const results=await Promise.allSettled([mapillaryNearbyPhotos(point.lat,point.lon,token,90),commonsNearbyPhotos(point.lat,point.lon,100,16)]);
  free=[];
  for(const result of results){if(result.status==='fulfilled')free.push(...result.value);else error+=(error?' · ':'')+result.reason.message}
  free=free.map(c=>c.matchScore==null?scoreCandidate(c,point):c).sort((a,b)=>b.matchScore-a.matchScore);
  photoSearchCache.set(cacheKey,free);
 }
 candidates.push(...free);
 if(request!==photoRequest||current.id!==b.id)return;
 const saved=g.selectedReference;
 if(saved?.original&&!candidates.some(c=>c.original===saved.original))candidates.unshift(saved);
 candidateImages=candidates;
 el.className='';el.replaceChildren();
 if(!candidates.length){el.className='placeholder';el.textContent='No automatically retrievable photographs found near this estimated location. '+error+' Use original-source links below or correct coordinates.';const links=streetLinks(point,g.address||'North Broad Street Philadelphia');for(const l of links){const a=document.createElement('a');a.href=l.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=l.name+' ↗';a.style.display='block';el.append(a)}return}
 const selected=candidates.find(c=>c.original===saved?.original)||candidates[0];
 function render(c){
  el.replaceChildren();
  const img=document.createElement('img');img.className='visual';img.alt='Unverified candidate from '+c.provider;img.referrerPolicy='no-referrer';img.src=c.thumbnail;
  img.onerror=()=>{img.alt='Provider blocked image preview. Open original source instead.'};
  const detail=document.createElement('div');detail.className='candidate-photo-detail';
  const label=document.createElement('strong');label.textContent=`${saved?.original===c.original&&g.manualVerified?"REVIEWER VERIFIED":"UNVERIFIED candidate"} · ${c.provider}${c.distanceMeters!=null?' · '+c.distanceMeters+'m from estimated location':''}`;
  const credit=document.createElement('p');credit.textContent=`Match ranking ${c.matchScore??'unknown'}/100 (unverified) · ${c.title||''} · ${c.author||''} · ${c.license||''}. ${c.note||''}`;
  const original=document.createElement('a');original.href=c.original;original.target='_blank';original.rel='noopener noreferrer';original.textContent='Inspect original source ↗';
  const actions=document.createElement('div');actions.className='actions';
  const confirm=document.createElement('button');confirm.textContent=saved?.original===c.original?'Confirmed photo ✓':'Yes, this is the building';
  confirm.onclick=()=>{const old=geo.buildings[b.id]||{};geo.buildings[b.id]={...old,selectedReference:c,sourceUrl:c.original,manualVerified:true,verifiedAt:new Date().toISOString()};saveLookup(geo);$('source').value=c.original;$('license').value=c.license;$('confidence').value='photo-matched';render(c);setStatus('Confirmed '+b.id+' reference. Add corrections in Modeling notes, then Save review or Export.')};
  const next=document.createElement('button');next.textContent='Wrong photo · next';next.onclick=()=>render(candidates[(candidates.indexOf(c)+1)%candidates.length]);
  actions.append(confirm,next);detail.append(label,credit,original,actions);el.append(img,detail);
 }
 render(selected);
}
$('googleKey').value=localStorage.getItem('broad-street-google-api-key')||'';
$('googleKey').onchange=()=>{const k=$('googleKey').value.trim();if(k)localStorage.setItem('broad-street-google-api-key',k);else localStorage.removeItem('broad-street-google-api-key');autoPhotoCandidates(current)};
$('refreshPhotos').onclick=()=>{photoSearchCache.clear();autoPhotoCandidates(current)};
$('mapillaryToken').value=sessionStorage.getItem('broad-street-mapillary-token')||'';
$('mapillaryToken').onchange=()=>{const t=$('mapillaryToken').value.trim();if(t)sessionStorage.setItem('broad-street-mapillary-token',t);else sessionStorage.removeItem('broad-street-mapillary-token');photoSearchCache.clear();autoPhotoCandidates(current)};
$('confirmAndNext').onclick=()=>{const r=geo.buildings[current.id];if(!r?.manualVerified){setStatus('Confirm the photograph before moving to the next building.');return}collect();select(buildings[(buildings.indexOf(current)+1)%buildings.length])};

await select(current);if(!geo.anchor)geocodeSchool().then(results=>{if(!results.length)return;geo.anchor={lat:results[0].lat,lon:results[0].lon};geo.bearing ??=0;saveLookup(geo);refreshGeoForm(current);autoPhotoCandidates(current);setStatus('School geocoded automatically. Other positions are estimates until street bearing and footprints are confirmed.')}).catch(e=>setStatus('Automatic location lookup unavailable: '+e.message));window.__studioReady=true;window.__studioSelect=id=>select(buildings.find(b=>b.id===id));window.__studioCapture=()=>viewer.png();
