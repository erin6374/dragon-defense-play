import {reflectionSky,applyGraphics} from './interiors.js';
import {assessments} from './assessment.js';
import {loadAerial,addAerialGround} from './aerial.js';
import {createBroadStreetSurface} from './broad-street-surface-review35.mjs';
import {createJunctionApproaches} from './junction-approaches-review36.mjs';
import {createBlockGround} from './block-ground-review37.mjs';
import {createPublicRealm} from './public-realm-review38.mjs';
import {createPublicLandscape} from './public-landscape-review39.mjs';
import {createFrontageTransitions,applySurfaceFinish} from './public-surface-review40.mjs';
import {buildings} from './district.js';
import {appendInspectionStops} from './mapped-rows.mjs';
import * as T from 'three';
import {mountOriginalSchoolFBX} from './school-original-fbx.mjs';
import {buildingEvidence,mappingInventory,facadeViewpoint,MAPPING_VERSION,REVIEW_ISSUES} from './map-accuracy.mjs';
import {openingProfile,openingSurvey,OPENING_SURVEY_VERSION} from './opening-survey-15.mjs';
import {chooseBuiltEvidence} from './chronology-policy-20.mjs';
const search=new URLSearchParams(location.search);
const previous=search.has('previous'),review13=search.has('review13'),qaClose=search.has('qaClose'),qaReview=search.has('qaReview'),qaOblique=search.has('qaOblique');
const {makeFrontages}=await import(previous?'./frontage-before.js':review13?'./mapped-geometry-review13.js':'./mapped-geometry.js?build=v21.1.33');
const {rows,streets}=await (async()=>{
 const response=await fetch('./mapped-data.json',{cache:'no-store'});
 if(!response.ok)throw new Error('Municipal footprint snapshot could not load: HTTP '+response.status);
 return response.json();
})();
const $=id=>document.getElementById(id), slider=$('position'), canvas=$('street');
const sourcedRows=rows.slice();
appendInspectionStops(rows);
const inventory=mappingInventory(sourcedRows);
const timeline=await fetch('./REVIEW20_60_STRUCTURE_AUDIT.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Chronology inventory unavailable HTTP '+r.status);return r.json()}).catch(err=>{console.warn('Optional photo chronology unavailable; 3D remains operational',err);return {records:[]}});
const timelineById=new Map(timeline.records.map(x=>[String(x.id),x]));
const broadRows=rows.slice(), parkSites=new Map();
for(const [polys,h,address] of buildings){
 const church=address==='Society For Helping Church',annex=address==='2210 N PARK AVE';
 if(!/^2[234]\d{2} N PARK AVE$/.test(address)&&!church)continue;
 if(parkSites.has(address)&&parkSites.get(address).h>=h&&!annex)continue;
 const allPolys=annex&&parkSites.has(address)?[...parkSites.get(address).polys,...polys]:polys;
 const points=allPolys.flatMap(poly=>poly[0]),xs=points.map(pt=>pt[0]),zs=points.map(pt=>pt[1]);
 parkSites.set(address,{id:church?'park-church':'park-'+parseInt(address),address,h:annex?Math.max(h,parkSites.get(address)?.h||0):h,x:(Math.max(...xs)+Math.min(...xs))/2,w:Math.max(...xs)-Math.min(...xs),d:Math.max(...zs)-Math.min(...zs),z:(Math.max(...zs)+Math.min(...zs))/2,polys:allPolys,front:Math.max(...zs),refs:[],sourceKind:'park-reference'});
}
const parkRows=[...parkSites.values()].sort((a,b)=>a.x-b.x);
let watts=false,reverse=false;
let selected=rows.find(b=>b.id===location.hash.slice(1))||rows.find(b=>b.school),position=selected.x,wide=false,timer,overhead=false,schoolBlock=false,zoomFactor=1;
const schoolBlockRows=rows.filter(r=>{const n=parseInt(r.address);return n>=2201&&n<=2255;});
const schoolBlockMin=Math.min(...schoolBlockRows.map(r=>r.x-r.w/2)),schoolBlockMax=Math.max(...schoolBlockRows.map(r=>r.x+r.w/2));
const schoolBlockCenter=(schoolBlockMin+schoolBlockMax)/2,schoolBlockWidth=schoolBlockMax-schoolBlockMin+24;
slider.min=rows[0].x;slider.max=rows.at(-1).x;
for(const b of rows){const e=buildingEvidence(b,sourcedRows);$('pick').add(new Option(b.address+(e.relatedFootprintParts>1?` · part ${e.partNumber}/${e.relatedFootprintParts}`:'')+(b.provisionalFrontage?' · provisional street front':b.front<-40?' · set back':'')+(e.inferred?' · estimated':''),b.id))}
function accuracyPanel(){
 const time=timelineById.get(String(selected.id));
 const history=chooseBuiltEvidence(time?.infillEvidence||[]);
 const timeNote=$('chronology-summary');
 if(timeNote)timeNote.textContent=time?(time.address+' · '+(time.sourceImageryDate?'Latest linked Street View imagery '+time.sourceImageryDate:'Photo acquisition date unknown')+' · '+history.decision.replaceAll('-',' ')+' · '+time.visualCorrectionThisVersion+'. '+history.notes):'No current chronology record for this selected structure. Preserve mapped geometry until verified.';
 const e=buildingEvidence(selected,watts?parkRows:sourcedRows);
 $('quality-summary').className=(e.inferred||e.provisionalFrontage)?'pending':'quality';
 $('quality-summary').textContent=`${e.kind} · ${e.verificationStatus} · ID ${e.id} · ${e.partNumber}/${e.relatedFootprintParts} associated footprint part(s)`;
 const opening=openingProfile(selected);
 if(opening){
  const clean=value=>value===null?'not established':String(value);
  const summary=opening.bays===null?'No verified Broad-facing opening count':`${opening.bays} upper opening(s) per level × ${clean(opening.upperLevels)} upper level(s); ${clean(opening.groundWindows)} ground glazing opening(s); ${clean(opening.doors)} visible/model door(s)`;
  $('opening-summary').textContent=summary;
  const count=opening.windowsByFloor===null?'unknown':opening.windowsByFloor.join(', ')||'no upper sash level';
  $('opening-details').textContent=`Review ${OPENING_SURVEY_VERSION} · ${opening.renderMode} · ground: ${opening.ground}. Upper opening counts (each level): ${count}; ground principal openings ${clean(opening.groundWindows)}; ${clean(opening.doors)} ground door(s). Main window model size ≈ ${opening.windowWidthMeters} m wide × ${opening.windowHeightMeters} m tall; door ≈ ${opening.doorWidthMeters} × ${opening.doorHeightMeters} m. Window evidence: ${opening.windowEvidence}; door evidence: ${opening.doorEvidence}. ${opening.notes}`;
  $('opening-source').textContent=opening.sourceFile?`Reference: ${opening.sourceFile}. Viewer does not redistribute Google Street View captures.`:'No address-confirmed frontal screenshot currently associated. Measurements are schematic.';
  $('opening-source').style.color=opening.windowEvidence==='photo-visible'?'#d0efcb':'#f3dbb6';
  $('opening-details').dataset.status=opening.windowEvidence;
 }else{
  $('opening-summary').textContent='Context row — no independent frontage model';
  $('opening-details').textContent='A source polygon was not attached to this context row.';
  $('opening-source').textContent='';
 }
 const roofNote=String(selected.id)==='1005655'?' UNRELEASED 2020-REFERENCE QA: The dated photo shows a long parking-side facade, central entry tower and a pale flat roof. Current 2026 facade and final WebGL visual match are NOT verified.':'';
 const review=e.review14Profile;
 $('next-reviewed').textContent=review?`Reviewed building ${reviewPosition(selected.id)}/20 → next`:'Review 20 facades →';
 const measuredHeight=e.inferred?'published/estimated height':'saved building-part height';
 const visibleFront=e.visibleFrontageDistanceMeters!==null?` Added provisional street-front setback ≈ ${e.visibleFrontageDistanceMeters} m; NOT a municipal footprint.`:'';
 const dated=e.datedObservation?` Published ${e.datedObservation.date}: ${e.datedObservation.fact} Still to verify: ${e.datedObservation.pending}`:'';
 $('quality-details').textContent=`${review?(review13||previous?'Showing comparison geometry; Review 15 opening layout is not being rendered. ':opening?.renderMode==='opening-layout-15'?'Review 15 address-specific facade and opening layout; source status: '+opening.windowEvidence+'. ':'Retained specialized original model; opening audit listed below. '):''}Outline ${e.widthMeters} × ${e.depthMeters ?? '?'} m; area ${e.areaMeters2} m²; ${measuredHeight} ${e.heightMeters ?? '?'} m; mapped source front ≈ ${e.distanceBehindBroadCenterlineMeters ?? '?'} m from road center.${visibleFront} Approx. coordinate: ${e.approxCenter.lat}, ${e.approxCenter.lon}. ${dated} ${e.accuracyNotes.join(' ')}${roofNote}`;
 const sources=$('building-sources');sources.replaceChildren();
 for(const lead of e.sourceLinks.filter(l=>!l.label.startsWith('City of Philadelphia')&&!l.label.startsWith('Philadelphia'))){
  const anchor=document.createElement('a');anchor.href=lead.url;anchor.target='_blank';anchor.rel='noopener noreferrer';anchor.textContent=lead.label;sources.append(anchor,' · ');
 }
}
const issues=$('issue-list');
if(issues)issues.replaceChildren(...REVIEW_ISSUES.map(issue=>{
 const li=document.createElement('li');
 const jump=document.createElement('button');jump.type='button';jump.textContent='Inspect '+issue.address;
 jump.onclick=()=>{if(watts)$('watts').click();const b=rows.find(r=>r.id===issue.targetId);if(b)update(b.x,false,b.id)};
 const severity=document.createElement('small');severity.textContent=`${issue.severity.toUpperCase()} · ${issue.type}`;
 const description=document.createElement('p');description.textContent=issue.text;
 const link=document.createElement('a');link.href=issue.source;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Supporting reference';
 li.append(jump,severity,description,link);return li;
}));
function downloadAudit(object,filename){
 const url=URL.createObjectURL(new Blob([JSON.stringify(object,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('export-openings').onclick=()=>downloadAudit({version:OPENING_SURVEY_VERSION,createdAt:new Date().toISOString(),
  method:'Major upper wall openings are separate from glazing panels/mullions; door counts are not inferred as confirmed when concealed',
  records:openingSurvey(sourcedRows),
  sources:'November 21 2026 user Library Google Street View screen captures; images are not included'},'north-broad-openings-review18.json');
if($('export-review'))$('export-review').onclick=()=>downloadAudit({version:MAPPING_VERSION,generatedAt:new Date().toISOString(),issues:REVIEW_ISSUES,scope:'Priority review queue — not final geometric certification'},'north-broad-priority-review-'+MAPPING_VERSION+'.json');
$('export-accuracy').onclick=()=>{const report={version:MAPPING_VERSION,generatedAt:new Date().toISOString(),inventory,buildings:sourcedRows.map(b=>buildingEvidence(b,sourcedRows)),streetSegments:streets,sourceNote:'Export of model-source metadata, not a survey or facade-photograph verification'};const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='north-broad-mapping-audit-'+MAPPING_VERSION+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
function comparison(){
 const b=selected, view=facadeViewpoint(b,watts),lat=view.lat,lon=view.lon,heading=view.heading;
 const point=lat.toFixed(6)+','+lon.toFixed(6);
 $('external').href='https://www.google.com/maps/@?api=1&map_action=pano&viewpoint='+point+'&heading='+heading+'&pitch=4&fov=82';
 if(location.hostname.endsWith('.github.io') && $('mode').value==='photo'){
  // The public build intentionally excludes private user street screenshots.
  // Never attempt to fetch old private filenames and show a broken image.
  $('pano').hidden=true;$('photo').hidden=true;
  $('photo-placeholder').hidden=false;
  $('caption').textContent='Private reference captures are not published to GitHub Pages. Open this viewpoint in Google Maps to compare the original panorama.';
  return;
 }
 showSaved();const photo=b.address.startsWith('2101')?'./berean-city-reference.jpg':b.refs.find(u=>/\.jpg($|\?)/i.test(u)),usePhoto=$('mode').value==='photo';
 $('pano').hidden=usePhoto;$('photo').hidden=!usePhoto||!photo;const placeholder=$('photo-placeholder');if(placeholder)placeholder.hidden=!(usePhoto&&!photo);
 if(usePhoto && b.provisionalFrontage && !photo && !watts){$('photo').hidden=true;$('caption').textContent='An address-specific published exterior of 2207 exists. Open the 2207 exterior link in the accuracy panel; no image was copied into this package.';return}
 if(usePhoto && watts){$('photo').hidden=false;$('photo').src=b.x>-358?"school-plan.jpg":"watts-north.jpg";$('caption').textContent="Block reference · Park Avenue addresses viewed from Watts. Individual rear openings are inferred.";return}
 if(usePhoto && b.x>-358 && b.x<-178 && !photo){$('photo').hidden=false;$('photo').src=b.x<-242?'school-row.jpg':'school-plan.jpg';$('caption').textContent=b.x<-242?'Your oblique reference · Dauphin toward Tech Freire. Individual bays and entrances are approximate.':'Your overhead reference · Tech Freire to Susquehanna. Storefront details are approximate.';return}
 if(usePhoto){if(photo)$('photo').src=photo;$('caption').textContent=b.address.startsWith('2101')?'City of Philadelphia · Berean nomination, Fig. 4 · southwest entrance':photo?'Published façade photograph.':'No address-specific photograph is available here.';return}
 const key=$('key').value.trim();
 const url=key?'https://www.google.com/maps/embed/v1/streetview?key='+encodeURIComponent(key)+'&location='+point+'&heading='+heading+'&pitch=4&fov=82':'https://maps.google.com/maps?layer=c&cbll='+point+'&cbp=12,'+heading+',0,0,4&output=svembed';
 if($('pano').getAttribute('src')!==url)$('pano').src=url;
 $('caption').textContent='Approximate viewpoint on '+view.road+'; heading '+heading+'° toward the selected footprint. Google may choose the wrong pano; verify against its original image.';
}
let render=()=>{};
function update(x,overview=false,preferredId=null){
 position=Math.max(+slider.min,Math.min(+slider.max,x));wide=overview;schoolBlock=false;selected=(preferredId?rows.find(b=>b.id===preferredId):null)||rows.reduce((a,b)=>Math.abs(a.x-position)<=Math.abs(b.x-position)?a:b);slider.value=position;$('address').textContent=selected.address+(watts?' · rear on Watts':'')+(selected.address.startsWith('2101')?' · Berean Presbyterian Church':selected.school?' · TECH Freire':selected.address.startsWith('2131')?' · Former Rite Aid':selected.address.startsWith('2109')?' · McDonald’s':selected.address.startsWith('2431')?' · AutoZone (2445 N Broad)':'');const record=assessments[selected.address];if(record)$('address').textContent+=' · '+record.number_stories+' stories (city assessment)';$('pick').value=selected.id;window.BSVFallback?.select(selected.id);accuracyPanel();$('inspect').href='index.html#'+selected.id;render();clearTimeout(timer);timer=setTimeout(comparison,220)
}
const review14Ids=inventory.review14IndividualBuildings?rows.filter(r=>r.review14).sort((a,b)=>a.x-b.x).map(r=>r.id):[];
function reviewPosition(id){return review14Ids.indexOf(id)+1}
$('next-reviewed').onclick=()=>{const current=review14Ids.indexOf(selected.id);const next=rows.find(r=>r.id===review14Ids[(current+1)%review14Ids.length]);if(next)update(next.x,false,next.id)};
$('pick').onchange=e=>update(rows.find(b=>b.id===e.target.value).x,false,e.target.value);slider.oninput=()=>update(+slider.value);
function step(n){const b=rows[Math.min(rows.length-1,Math.max(0,rows.indexOf(selected)+n))];update(b.x,false,b.id)}
$('north').onclick=()=>step(-1);$('south').onclick=()=>step(1);$('overview').onclick=()=>{zoomFactor=1;update(position,true);};$('school-block').onclick=()=>{zoomFactor=1;const school=rows.find(r=>r.school);update(school.x,false,school.id);schoolBlock=true;render();};$('mode').onchange=$('key').onchange=comparison;
try{
 canvas.addEventListener('webglcontextlost',e=>{
  e.preventDefault();
  const message='WebGL graphics context was lost. Showing the 2D elevation; try reloading or using the 2D option.';
  window.__bsvReportError?.(message);
  window.BSVFallback?.show2D(message);
 },{passive:false});
 const renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
 const scene=new T.Scene();scene.background=new T.Color(0xafc5cc);scene.add(new T.HemisphereLight(0xfff6e1,0xa8b2ad,2));
 const light=new T.DirectionalLight(0xfff1db,2.4);light.position.set(-45,72,62);scene.add(light);
 const schoolRow=sourcedRows.find(b=>b.school);
 // Replace the RC86 procedural school with the original Revit FBX, exactly once.
 // The opening survey renderer already skips school; do not build another copy.
 mountOriginalSchoolFBX(scene,schoolRow,{
  onStatus:message=>{const node=$('school-model-status');if(node)node.textContent=message;},
  onReady:({stats,placement})=>{window.__schoolFBXQA={ready:true,source:'original-Revit-FBX',schoolGISId:String(schoolRow.id),proxySchoolRendered:false,stats,placement};render();},
 }).catch(err=>{
  console.error('[BroadStreetViewer] original school FBX failed:',err);
  const node=$('school-model-status');if(node)node.textContent='Original school FBX failed to load: '+err.message+' (no inaccurate replacement rendered)';
  window.__bsvReportError?.(err);
 });
 loadAerial(()=>render());addAerialGround(scene);
 makeFrontages(scene,rows,streets,{hideTrees:qaReview});
 const streetSurface=createBroadStreetSurface(),sideApproaches=createJunctionApproaches(streets);const blockGround=createBlockGround();const publicRealm=createPublicRealm();const publicLandscape=createPublicLandscape();const frontageTransitions=createFrontageTransitions();const surfaceFinish=applySurfaceFinish(streetSurface,sideApproaches,blockGround,frontageTransitions);streetSurface.add(sideApproaches,blockGround,publicRealm,publicLandscape,frontageTransitions);Object.assign(streetSurface.userData,{frontageTransitions:frontageTransitions.userData,surfaceFinish,sideApproaches:sideApproaches.userData,blockGround:blockGround.userData,publicRealm:publicRealm.userData,publicLandscape:publicLandscape.userData});scene.add(streetSurface);streetSurface.visible=!search.has('aerialStreet');
 window.__streetSurfaceQA=streetSurface.userData;
 const streetToggle=$('street-surface');streetToggle.setAttribute('aria-pressed',String(streetSurface.visible));streetToggle.textContent=streetSurface.visible?'Aerial streets':'Modeled streets';
 streetToggle.onclick=()=>{streetSurface.visible=!streetSurface.visible;streetToggle.textContent=streetSurface.visible?'Aerial streets':'Modeled streets';streetToggle.setAttribute('aria-pressed',String(streetSurface.visible));render();};
 const camera=new T.OrthographicCamera(-1,1,1,-1,.1,1500),line=new T.Mesh(new T.BoxGeometry(1,.12,.4),new T.MeshBasicMaterial({color:0xffc748}));scene.add(line);
 $('watts').onclick=()=>{
  watts=!watts;reverse=false;overhead=false;window.BSVFallback?.setContext(watts?'watts':'broad');
  rows.splice(0,rows.length,...(watts?parkRows:broadRows));
  slider.min=rows[0].x;slider.max=rows.at(-1).x;
  $('pick').replaceChildren(...rows.map(b=>{const e=buildingEvidence(b,watts?parkRows:sourcedRows);return new Option(b.address+(e.relatedFootprintParts>1?` · part ${e.partNumber}/${e.relatedFootprintParts}`:''),b.id)}));
  $('watts').textContent=watts?'Return to Broad':'Inspect Watts rowhouses';
  $('top').textContent='Top down';$('rear').hidden=watts;$('revision').hidden=watts;$('rear').textContent='View from Watts';
  update(position);
 };
 $('rear').onclick=()=>{reverse=!reverse;overhead=false;$('top').textContent="Top down";$('rear').textContent=reverse?"View from Broad":"View from Watts";render()};
 reflectionSky(renderer);
 const graphics=()=>{applyGraphics(scene,$('night').checked,$('rooms').checked,$('brick').checked,$('cutaway').checked);render()};
 for(const id of ['night','rooms','brick','cutaway'])$(id).onchange=graphics;
 graphics();
 let visibleWidth=70, first3D=true;
 render=()=>{const w=canvas.clientWidth||500,h=canvas.clientHeight||320;renderer.setSize(w,h,false);const reviewH=selected.id==='1005656'?28:selected.h;const displayFront=Number.isFinite(selected.provisionalStreetFront)?selected.provisionalStreetFront:selected.front;visibleWidth=schoolBlock?schoolBlockWidth:qaReview?Math.max(selected.id==='1005655'?34:22,(selected.w+5)*1.18,(reviewH+4)*w/h):qaClose?22:(wide?slider.max-slider.min+35:Math.max(58,49*w/h));visibleWidth*=zoomFactor;const half=visibleWidth/2;camera.left=-half;camera.right=half;camera.top=half*h/w;camera.bottom=-camera.top;camera.updateProjectionMatrix();const x=schoolBlock?schoolBlockCenter:wide?(Number(slider.min)+Number(slider.max))/2:position;camera.position.set(x+(wide?0:12),schoolBlock?62:wide?150:34,95);if(reverse)camera.position.set(x-12,wide?150:36,-171);if(watts)camera.position.set(x,wide?40:11,-74);const shopsReview=qaReview&&['1005509','shops-north-inspection'].includes(selected.id);const residenceEntryReview=qaReview&&selected.id==='1546778'&&search.has('qaEntry');const mittenEntryReview=qaReview&&selected.id==='1001853'&&search.has('qaEntry');if(mittenEntryReview){visibleWidth=16;camera.left=-8;camera.right=8;camera.top=8*h/w;camera.bottom=-8*h/w;camera.updateProjectionMatrix();}const fixtureReview=qaReview&&search.has('qaFixture'),fixtureX=Number(search.get('qaFixture'));if(fixtureReview&&Number.isFinite(fixtureX)){camera.left=-13;camera.right=13;camera.top=13*h/w;camera.bottom=-camera.top;camera.updateProjectionMatrix();}const groundReview=qaReview&&search.has('qaGround');const groundView=({'1003022':[-141,-61,111],'1005655':[-63,-48,76],'1073318':[-669,-49,85],'1007134':[-228.3,-29,42],'1001853':[234.5,-46.5,72]})[selected.id];if(groundReview&&groundView){camera.left=-groundView[2]/2;camera.right=groundView[2]/2;camera.top=groundView[2]*h/w/2;camera.bottom=-camera.top;camera.updateProjectionMatrix();}const roofReview=qaReview&&search.has('qaRoof');const targetZ=groundReview&&groundView?groundView[1]:roofReview?selected.z:shopsReview?-99:residenceEntryReview?-102.5:mittenEntryReview?-27.2:qaReview?displayFront:qaClose?selected.front:(watts?-102:-36);if(fixtureReview&&Number.isFinite(fixtureX))camera.position.set(fixtureX+8,10,16);else if(groundReview&&groundView)camera.position.set(groundView[0],180,targetZ+8);else if(roofReview)camera.position.set(x+8,reviewH+135,targetZ+22);else if(shopsReview)camera.position.set(x+(qaOblique?-25:0),reviewH*.53+4,-143);else if(residenceEntryReview)camera.position.set(196.3+(qaOblique?-10:0),reviewH*.53+(qaOblique?5:0),-128);else if(mittenEntryReview)camera.position.set(280+(qaOblique?6:0),4.5,-3);else if(qaReview){const setback=['1079073','1050167','1003022'].includes(String(selected.id));if(setback)camera.position.set(x+(qaOblique?-8:0),reviewH*.53+(qaOblique?6:2),displayFront+18);else camera.position.set(x+(qaOblique?38:0),reviewH*.53+(qaOblique?16:2),displayFront+65);}else if(qaClose)camera.position.set(x+2,selected.h*.52+4.2,selected.front+38);else if(overhead)camera.position.set(x,200,targetZ+.01);camera.lookAt(fixtureReview&&Number.isFinite(fixtureX)?fixtureX:groundReview&&groundView?groundView[0]:mittenEntryReview?280:x,fixtureReview?3.8:groundReview?0:roofReview?reviewH:mittenEntryReview?3.7:qaReview?reviewH*.50:qaClose?selected.h*.5:(watts?5:(wide?2:8)),fixtureReview?-17:targetZ);if(watts&&search.has('qaWatts')){const secondary=['park-2210','park-church'].includes(selected.id);const ww=wide?slider.max-slider.min+18:Math.max(secondary?selected.w+10:22,secondary?24*w/h:14*w/h);visibleWidth=ww;camera.left=-ww/2;camera.right=ww/2;camera.top=ww*h/w/2;camera.bottom=-camera.top;camera.updateProjectionMatrix();const z=wide?-98:secondary&&overhead?selected.z:selected.front-1;if(overhead)camera.position.set(x,180,z+.01);else camera.position.set(x+(wide?0:4),wide?38:9,-72);camera.lookAt(x,overhead?0:5,z);}line.scale.x=selected.w;line.material.color.setHex((selected.estimated||selected.provisionalFrontage)?0xff974a:0xffc748);
 line.position.set(selected.x,.15,displayFront+.7);renderer.render(scene,camera);window.BSVFallback?.notify3DReady();if(first3D){first3D=false;requestAnimationFrame(render)}const status=$('scene-status');if(status)status.hidden=true};
 $('top').onclick=()=>{overhead=!overhead;$('top').textContent=overhead?'Street angle':'Top down';render()};let drag;canvas.onpointerdown=e=>{drag={x:e.clientX,p:position,scale:visibleWidth/canvas.clientWidth,mid:schoolBlock?schoolBlockCenter:wide?(+slider.min+Number(slider.max))/2:position};canvas.setPointerCapture(e.pointerId)};
 canvas.onpointermove=e=>{if(drag&&Math.abs(e.clientX-drag.x)>3)update(drag.p-(reverse&&!overhead?-1:1)*(e.clientX-drag.x)*drag.scale)};
 canvas.onpointerup=e=>{if(drag&&Math.abs(e.clientX-drag.x)<=3){const rect=canvas.getBoundingClientRect();const x=drag.mid+(reverse&&!overhead?-1:1)*(e.clientX-rect.left-rect.width/2)*drag.scale;update(rows.reduce((a,b)=>Math.abs(a.x-x)<Math.abs(b.x-x)?a:b).x)}drag=null};canvas.onpointercancel=()=>drag=null;
 canvas.addEventListener('wheel',e=>{e.preventDefault();zoomFactor=Math.max(.25,Math.min(3,zoomFactor*Math.exp(e.deltaY*.001)));render();},{passive:false});
 render();
 new ResizeObserver(render).observe(canvas);
}catch(err){console.error('[BroadStreetViewer] 3D startup:',err);$('hint').textContent='3D view could not start: '+err.message;window.__bsvReportError?.(err);window.BSVFallback?.show2D('3D rendering error: '+err.message)}
const db=new Promise((resolve,reject)=>{const q=indexedDB.open('broad-mapped-photos',1);q.onupgradeneeded=()=>q.result.createObjectStore('refs');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
db.catch(()=>{});
async function photoDB(id,blob){
 const d=await db;return new Promise((resolve,reject)=>{const tx=d.transaction('refs',blob?'readwrite':'readonly'),store=tx.objectStore('refs'),q=blob?store.put(blob,id):store.get(id);tx.oncomplete=()=>resolve(q.result);tx.onerror=()=>reject(tx.error)})
}
let previewURL=null;
async function showSaved(){const id=selected.id;let blob;try{blob=await photoDB(id)}catch{}if(id!==selected.id)return;if(previewURL)URL.revokeObjectURL(previewURL);previewURL=blob?URL.createObjectURL(blob):null;
 if(previewURL&&$('mode').value==='photo'){$('photo').src=previewURL;$('photo').hidden=false;$('caption').textContent='Your saved reference · '+selected.address}
}
async function attach(id,blob){await photoDB(id,blob);if(id===selected.id){$('mode').value='photo';comparison()}$('feedback').textContent='Reference saved for '+rows.find(b=>b.id===id).address}
$('upload').onchange=async e=>{const file=e.target.files[0],id=selected.id;if(!file)return;try{await attach(id,file)}catch{$('feedback').textContent='Could not save the image in this browser.'}e.target.value=''};
$('capture').onclick=async()=>{const id=selected.id;if(!navigator.mediaDevices?.getDisplayMedia){$('feedback').textContent='On Samsung, press Side + Volume Down while Street View is visible. Tap Attach screenshot and choose that image.';return}
 let stream;try{stream=await navigator.mediaDevices.getDisplayMedia({video:true,audio:false});const video=document.createElement('video');video.srcObject=stream;video.muted=true;await video.play();await new Promise(resolve=>setTimeout(resolve,300));const c=document.createElement('canvas');c.width=video.videoWidth;c.height=video.videoHeight;c.getContext('2d').drawImage(video,0,0);const blob=await new Promise(resolve=>c.toBlob(resolve));if(blob)await attach(id,blob)}catch{$('feedback').textContent='Capture unavailable or cancelled. You can attach a screenshot from your device.'}finally{stream?.getTracks().forEach(t=>t.stop())}};
$('exportRef').onclick=async()=>{const b=selected;try{const blob=await photoDB(b.id);if(!blob){$('feedback').textContent='Attach a screenshot first.';return}const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=b.address.replace(/[^a-z0-9-]/gi,'_')+'-'+b.id+'.'+(blob.type.split('/')[1]||'png');a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}catch{$('feedback').textContent='Saved reference unavailable.'}};

$('mode').value='google';update(position,wide,selected.id);

$('compare13').textContent=review13?'Show Review 14':'Compare Review 13';
$('compare13').onclick=()=>location.assign('mapped.html'+(review13?'':'?review13')+'#'+selected.id);
$('revision').textContent=previous?'Show Detail 06':'Compare Detail 05';$('revision').onclick=()=>location.assign('mapped.html'+(previous?'':'?previous')+'#'+selected.id);

// Review24 presentation controls: no building geometry changes.
function setSceneOnly(enabled){document.body.classList.toggle('scene-only',enabled);$('scene-only').setAttribute('aria-pressed',String(enabled));$('scene-only').textContent=enabled?'Show comparison':'Large scene';requestAnimationFrame(()=>render());}
$('scene-only').onclick=()=>setSceneOnly(!document.body.classList.contains('scene-only'));
$('full-screen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(e){console.warn('Fullscreen unavailable',e);}};
$('hint').textContent='Drag along the street, scroll to zoom, or click a building to center it.';
$('south-district').onclick=()=>{if(watts)$('watts').click();reverse=false;overhead=false;$('rear').textContent='View from Watts';$('top').textContent='Top down';zoomFactor=1;update(197.835,false,'1546778');zoomFactor=3.6;render();};
if(search.has('scene')){setSceneOnly(true);if(!location.hash) $('school-block').click();}
