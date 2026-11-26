/* Broad Street Viewer v19: independent 2D architectural elevation. No WebGL,
   Three.js, or 3D modules required. Draws saved parcels at proportional widths and
   heights and never converts estimated window counts into verified facts. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const state={ready:false,webglReady:false,force2D:false,selectedId:null,rows:[],profiles:new Map(),mode:'loading',context:'broad'};
 let canvas,webgl,summary,button;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 // The city's 40 footprints include rear wings and separate outbuildings.
 // A rear GIS polygon must never be portrayed as an independent Broad St facade.
 const hasStreetFront=r=>r&&!r.context&&(Number.isFinite(r.provisionalStreetFront)||Number.isFinite(r.front)&&r.front>=-34);
 const colorStatus=r=>r?.windowEvidence==='photo-visible'?'#70ccbb':r?.windowEvidence==='photo-partial'?'#f0ca70':'#dfae89';
 function setMode(mode){
  const lastMode=state.mode;
  state.mode=mode;
  if(!canvas||!webgl)return;
  const is2D=mode!=='3d';
  canvas.hidden=!is2D;webgl.hidden=is2D;
  // The backup is explicitly labelled; never let it silently impersonate the detailed 3D model.
  if(summary)summary.hidden=!is2D;
  if(button)button.textContent=is2D?(state.webglReady?'Return to accurate 3D view':'Schematic 2D backup · 3D unavailable'):'Schematic 2D backup';
  if(is2D)draw();
  // When switching back from a hidden backup, recalculate the real 3D canvas
  // size instead of leaving a stale 0px-width or 2D-era camera projection.
  else if(lastMode==='2d'&&state.webglReady&&typeof window.requestAnimationFrame==='function'){
   window.requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
  }
 }
 function rounded(ctx,x,y,w,h,r=3){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
 function draw(){
  if(!canvas||!state.ready||!state.rows.length)return;
  const cssW=Math.max(320,canvas.getBoundingClientRect().width||canvas.parentElement?.clientWidth||680);
  const cssH=Math.max(300,Math.min(570,Math.round(cssW*.57)));
  const ratio=clamp(window.devicePixelRatio||1,1,2);
  canvas.width=Math.round(cssW*ratio);canvas.height=Math.round(cssH*ratio);
  canvas.style.height=cssH+'px';
  const ctx=canvas.getContext('2d');if(!ctx)return;
  ctx.setTransform(ratio,0,0,ratio,0,0);
  const sky=ctx.createLinearGradient(0,0,0,cssH);sky.addColorStop(0,'#afcee0');sky.addColorStop(.75,'#e6e3d7');sky.addColorStop(1,'#dfd9c9');ctx.fillStyle=sky;ctx.fillRect(0,0,cssW,cssH);
  const picked=state.rows.find(r=>String(r.id)===String(state.selectedId))||state.rows.find(r=>r.school)||state.rows[0];
  const fronts=state.rows.filter(hasStreetFront);
  const pickedIsRear=!hasStreetFront(picked);
  // If a rear wing is selected, show the nearest actual street facade and explain
  // that the selected rear polygon is NOT itself a verified street frontage.
  const chosen=hasStreetFront(picked)?picked:
    (fronts.find(r=>r.address===picked.address)||fronts.reduce((a,b)=>Math.abs(a.x-picked.x)<Math.abs(b.x-picked.x)?a:b));
  const streetSpan=clamp(cssW/7.6,64,115),pixels=cssW/streetSpan;
  const yGround=cssH-74;const scaleY=Math.min(12,(yGround-52)/30);
  ctx.fillStyle='#5e6668';ctx.fillRect(0,yGround+5,cssW,cssH-yGround-5);
  ctx.fillStyle='#d8d0bc';ctx.fillRect(0,yGround,cssW,10);
  for(let i=0;i<cssW;i+=65){ctx.fillStyle='#dfd1a1';ctx.fillRect(i+10,cssH-35,34,3);}
  const ordered=fronts.filter(r=>Math.abs(r.x-chosen.x)<streetSpan/2+r.w/2+5)
    .sort((a,b)=>a.x-b.x); // one street-facing rectangle per mapped frontage; no rear wings
  for(const row of ordered){
   const x=cssW/2+(row.x-chosen.x-row.w/2)*pixels,w=row.w*pixels;
   const h=clamp(row.h*scaleY,17,scaleY*31),top=yGround-h;
   if(w<2)continue;
   const profile=state.profiles.get(String(row.id));
   const rear=false; // no rear-only GIS sections are drawn as street facades
   const active=!pickedIsRear&&String(row.id)===String(chosen.id);
   ctx.fillStyle=rear?'#8b9290':row.school?'#ac9a7d':row.address.startsWith('2109')?'#d1b49b':
        profile?.windowEvidence==='photo-visible'?'#bd9c8d':'#b8ad9d';
   ctx.fillRect(x,top,w,h);
   // This is a street ELEVATION: only the visible red eave edge appears here.
   // The full, polygon-shaped roof remains in the 3D model.
   if(row.address.startsWith('2109-')){ctx.fillStyle='#c7c8be';ctx.fillRect(x,top-5,w,7)}
   // Never show an invented row of upper sashes for unknown elevations.
   if(profile&&Number.isFinite(profile.bays)&&Number.isFinite(profile.upperLevels)){
    const count=Math.max(0,profile.upperLevels),floorPitch=(h-12)/(count+1),windowColor=rear?'#738489':'#48636e';
    for(let floor=0;floor<count;floor++){
     const bays=profile.windowsByFloor?.[floor]??profile.bays;
     if(!Number.isFinite(bays)||bays<=0)continue;
     const y=top+12+floor*floorPitch;
     const openingH=clamp(Math.min(floorPitch*.69,(profile.windowHeightMeters||1.48)*scaleY),5,Math.max(6,floorPitch*.79));
     const cw=Math.min((profile.windowWidthMeters||.95)*pixels,w/Math.max(1,bays)*.6);
     for(let col=0;col<bays;col++){
      const center=x+w*(col+1)/(bays+1),lx=center-cw/2;
      ctx.fillStyle=windowColor;ctx.fillRect(lx,y,cw,openingH);
      ctx.strokeStyle=colorStatus(profile);ctx.lineWidth=profile.windowEvidence==='photo-visible'?2:1;
      ctx.setLineDash(profile.windowEvidence==='photo-visible'?[]:[3,3]);ctx.strokeRect(lx,y,cw,openingH);ctx.setLineDash([]);
      ctx.fillStyle='#a9b6b7';ctx.fillRect(center-.5,y,1,openingH);
     }
    }
   } else if(!rear){ctx.fillStyle='#4c5f65';ctx.font='bold 16px system-ui';ctx.textAlign='center';ctx.fillText('?',x+w/2,top+h*.5);}
   if(profile){
    const groundY=yGround-24,doorW=clamp((profile.doorWidthMeters||.94)*pixels,4,Math.max(5,w*.3));
    const doorCount=clamp(profile.doors||0,0,5);
    if(/shutter/i.test(profile.ground||'')){
      ctx.fillStyle='#586367';ctx.fillRect(x+w*.20,groundY,w*.64,22);
      for(let line=0;line<6;line++){ctx.fillStyle='#b9c0bd';ctx.fillRect(x+w*.20,groundY+line*3.7,w*.64,.7);}
    }else if(profile.groundWindows){
      const gw=clamp(profile.groundWindows,0,7);
      for(let k=0;k<gw;k++){const gx=x+w*(k+1)/(gw+1)-Math.min(doorW,w/gw*.4)/2;
       const ww=Math.min(doorW,w/(gw+1)*.65);ctx.fillStyle='#59767d';ctx.fillRect(gx,groundY,ww,21);}
    }
    for(let k=0;k<doorCount;k++){
     const pos=Array.isArray(profile.doorPositions)?profile.doorPositions[k]:profile.doorSide==='ends'?(k===0?.11:.89):profile.doorSide==='right'?.82:.18;
     const center=x+w*clamp(pos??.18,.08,.92);
     ctx.fillStyle='#384b50';ctx.fillRect(center-doorW/2,groundY-4,doorW,28);
     ctx.fillStyle='#e9dba3';ctx.fillRect(center+doorW*.3,groundY+12,2,2);
    }
   }
   ctx.strokeStyle=active?'#f5d26a':'#626868';ctx.lineWidth=active?4:1;ctx.strokeRect(x,top,w,h);
   if(active){ctx.fillStyle='#213f49';rounded(ctx,Math.max(4,Math.min(cssW-225,x+w/2-112)),8,224,28,5);ctx.fill();ctx.fillStyle='#fff3cd';ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillText(row.address.slice(0,26),Math.max(116,Math.min(cssW-113,x+w/2)),27);}
   // Address bands are labels, not claims about exact building geometry.
   if(w>24){ctx.fillStyle='#263941';ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillText((row.address.match(/^\S+/)||[''])[0],x+w/2,yGround+22);}
  }
  ctx.fillStyle='#17363f';rounded(ctx,8,cssH-67,Math.min(570,cssW-16),27,4);ctx.fill();
  ctx.fillStyle='#e7f6f3';ctx.textAlign='left';ctx.font='12px system-ui';
  ctx.fillText('SIMPLIFIED 2D ONLY • NOT PHOTO-ACCURATE • rear buildings excluded • dashed = estimates',16,cssH-49);
  const p=state.profiles.get(String(chosen.id));
  const windows=p?.bays==null?'unknown':`${p.bays} bay(s)/upper level`;const doors=p?.doors==null?'unknown':p.doors;
  if(summary)summary.textContent=`SCHEMATIC BACKUP — NOT PHOTO-ACCURATE. ${pickedIsRear?picked.address+' is a rear/setback footprint (not a documented Broad Street facade); showing nearest actual frontage '+chosen.address+'. ':''}${chosen.address} · ${chosen.w.toFixed(1)} m GIS frontage width × ${chosen.h.toFixed(1)} m model height · survey windows: ${windows} · doors: ${doors} · ${p?.windowEvidence||'not verified'}. Real rooflines, setbacks, exterior details and genuine facade geometry are in the 3D viewer, not here.`;
 }
 async function init(){
  canvas=$('fallback-street');webgl=$('street');summary=$('fallback-summary');button=$('toggle-elevation');
  if(!canvas||!webgl)return;
  button?.addEventListener('click',()=>{
   if(state.context!=='broad'){if(summary){summary.hidden=false;summary.textContent='The 2D survey covers Broad Street only; the Watts rowhouses require the 3D model.';}return;}
   state.force2D=!state.force2D;setMode(state.force2D||!state.webglReady?'2d':'3d');
  });
  window.addEventListener('resize',()=>{if(state.mode!=='3d')draw();});
  $('pick')?.addEventListener('change',event=>{state.selectedId=event.target.value;if(state.mode!=='3d')draw();});
  try{
   const [r,s]=await Promise.all([fetch('./mapped-data.json',{cache:'no-store'}),fetch('./OPENING_SURVEY_REVIEW_18.json',{cache:'no-store'})]);
   if(!r.ok||!s.ok)throw Error('Missing GIS data (HTTP '+r.status+'/'+s.status+')');
   const raw=await r.json(),survey=await s.json();
   if(raw.rows?.length!==40||survey.records?.length!==40)throw Error('Missing building records in local assets');
   state.rows=raw.rows;state.profiles=new Map(survey.records.map(r=>[String(r.id),r]));
   state.selectedId=state.selectedId||state.rows.find(row=>row.school)?.id||state.rows[0].id;
   state.ready=true;
   // If ES module imports or WebGL never finish, don't leave a blank model pane.
   // This independent watchdog runs even when mapped.js fails *before* its try/catch.
   if(typeof window.setTimeout==='function')window.setTimeout(()=>{
    if(!state.webglReady&&!state.force2D){
     // Do not lock the user into 2D if the detailed 3D subsequently loads.
     setMode('2d');
     if(summary)summary.textContent='SCHEMATIC BACKUP — detailed 3D failed to start after 7 seconds. This is NOT a photo-accurate street model. Check the browser console and local server.';
    }
   },7000);
   // Remain on the detailed 3D canvas while it initializes. The fallback is
   // emergency-only (or explicit opt-in), not a lower-fidelity replacement.
   if(state.mode==='2d')draw();
  }catch(e){if(summary)summary.textContent='Could not load the 2D building data: '+e.message+'. Run START-STUDIO.cmd to serve this folder; do not open HTML directly from a ZIP.';const ctx=canvas.getContext('2d');if(ctx){canvas.width=600;canvas.height=300;ctx.fillStyle='#27444d';ctx.fillRect(0,0,600,300);ctx.fillStyle='white';ctx.font='18px sans-serif';ctx.fillText('Building data unavailable',30,80);ctx.font='14px sans-serif';ctx.fillText('Start local server with START-STUDIO.cmd',30,110);}}
 }
 window.BSVFallback={
  select(id){state.selectedId=String(id);if(state.mode!=='3d')draw();},
  notify3DReady(){if(!state.webglReady){state.webglReady=true;setMode(state.force2D?'2d':'3d');
   if(!state.force2D)window.requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
  }},
  show2D(reason){state.force2D=true;setMode('2d');if(summary&&reason)summary.textContent='SCHEMATIC BACKUP — 3D view unavailable: '+reason+'. This diagram is NOT the true building model.';},
  setContext(context){state.context=context==='watts'?'watts':'broad';if(state.context==='watts'&&state.mode==='2d'&&state.webglReady){state.force2D=false;setMode('3d');}},
  getStatus(){return {ready:state.ready,webglReady:state.webglReady,mode:state.mode,records:state.rows.length,frontageCount:state.rows.filter(hasStreetFront).length};}
 };
 if($('street'))init();else document.addEventListener('DOMContentLoaded',init);
})();
