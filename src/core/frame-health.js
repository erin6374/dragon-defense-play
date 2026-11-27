// Attribute a render-start interval to the PRECEDING frame's work, not the
// work performed after that interval. Timings are CPU wall-clock, not GPU time.
export function createFrameHealth({now=()=>performance.now(),isHidden=()=>document.hidden,isFocused=()=>document.hasFocus(),isRecording=()=>false}={}){
 const events=[],longTasks=[];let previous=null;
 let lastVisibilityEvent=-Infinity,lastFocusEvent=-Infinity;
 const vis=()=>{lastVisibilityEvent=now();};
 const focus=()=>{lastFocusEvent=now();};
 if(typeof document!=='undefined'){
  document.addEventListener('visibilitychange',vis);
  window.addEventListener('blur',focus);window.addEventListener('focus',focus);
 }
 let observer=null;
 try{
  if(typeof PerformanceObserver!=='undefined'&&PerformanceObserver.supportedEntryTypes?.includes('longtask')){
   observer=new PerformanceObserver(list=>{
    for(const e of list.getEntries())longTasks.push({at:e.startTime,ms:e.duration});
    if(longTasks.length>100)longTasks.splice(0,longTasks.length-100);
   });observer.observe({entryTypes:['longtask']});
  }
 }catch(e){}
 const safe=n=>Number.isFinite(n)?Math.max(0,n):0;
 const round=n=>+safe(n).toFixed(1);
 function observe({frameMs,frameStart,simMs,renderMs,setupMs=0,cameraAudioMs=0,prepareMs=0,captureMs=0,bookkeepingMs=0,drawCalls=0,triangles=0,wave=0,collect=true}){
  const at=Number.isFinite(frameStart)?frameStart:now();
  const recording=!!isRecording(),hidden=!!isHidden(),focused=!!isFocused();
  const prior=previous;
  previous={at,recording,hidden,focused,wave,drawCalls,triangles,collect,
   simMs:safe(simMs),renderMs:safe(renderMs),setupMs:safe(setupMs),cameraAudioMs:safe(cameraAudioMs),
   prepareMs:safe(prepareMs),captureMs:safe(captureMs),bookkeepingMs:safe(bookkeepingMs)};
  if(!prior||!prior.collect||!collect)return;
  const gap=Number.isFinite(frameStart)?at-prior.at:frameMs;
  if(!Number.isFinite(gap)||gap<80)return;
  const overlap=t=>Math.max(0,Math.min(at,t.at+t.ms)-Math.max(prior.at,t.at));
  const longTaskMs=longTasks.reduce((sum,t)=>sum+overlap(t),0);
  const phases=[['renderer-or-driver-block',prior.renderMs],['simulation-main-thread-block',prior.simMs],
   ['frame-setup-block',prior.setupMs],['camera-or-audio-block',prior.cameraAudioMs],
   ['render-preparation-block',prior.prepareMs],['capture-main-thread-block',prior.captureMs],
   ['frame-bookkeeping-block',prior.bookkeepingMs]];
  const measured=phases.reduce((sum,p)=>sum+p[1],0);
  const dominant=phases.reduce((best,p)=>p[1]>best[1]?p:best,phases[0]);
  let classification='unattributed-raf-gap';
  if(hidden||prior.hidden||!focused||!prior.focused||
     (lastVisibilityEvent>=prior.at&&lastVisibilityEvent<=at)||(lastFocusEvent>=prior.at&&lastFocusEvent<=at))classification='visibility-or-focus-interruption';
  else if(dominant[1]>=80)classification=dominant[0];
  else if(measured>=80)classification='combined-frame-work';
  else if(longTaskMs>=50)classification='other-main-thread-long-task';
  else if(prior.recording||recording)classification='capture-or-external-frame-gap';
  const event={at:Math.round(at),wave:prior.wave,frameMs:round(gap),simMs:round(prior.simMs),renderMs:round(prior.renderMs),
   setupMs:round(prior.setupMs),cameraAudioMs:round(prior.cameraAudioMs),prepareMs:round(prior.prepareMs),
   captureMs:round(prior.captureMs),bookkeepingMs:round(prior.bookkeepingMs),measuredFrameWorkMs:round(measured),
   outsideMeasuredCodeMs:round(gap-measured),drawCalls:prior.drawCalls,triangles:prior.triangles,
   recording:prior.recording||recording,hidden:hidden||prior.hidden,focused:focused&&prior.focused,
   longTaskMs:round(longTaskMs),classification,timingBasis:'preceding-rendered-frame'};
  events.push(event);if(events.length>80)events.shift();return event;
 }
 function summary(){
  const classificationCounts={};for(const e of events)classificationCounts[e.classification]=(classificationCounts[e.classification]||0)+1;
  return {totalLongFrames:events.length,classificationCounts,recent:events.slice(-24),
   longTasksObserved:longTasks.length,recording:!!isRecording(),hidden:!!isHidden(),focused:!!isFocused(),
   timingBasis:'render-start to render-start; preceding frame CPU phases',
   warning:'Unmeasured gaps can include scheduling, GPU/driver waits, GC and asynchronous capture. LongTask entries may arrive late. Classifications are diagnostic, not definitive root causes.'};
 }
 return {observe,summary,reset(){events.length=0;longTasks.length=0;previous=null;},dispose(){
  observer?.disconnect();
  if(typeof document!=='undefined'){document.removeEventListener('visibilitychange',vis);window.removeEventListener('blur',focus);window.removeEventListener('focus',focus);}
 }};
}
