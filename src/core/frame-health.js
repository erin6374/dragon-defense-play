// Classify long frame intervals without mistaking requestAnimationFrame delays
// for JavaScript simulation cost. GPU timings are not available through these
// counters. LongTask evidence, page focus and recording states are included.
export function createFrameHealth({now=()=>performance.now(),isHidden=()=>document.hidden,isFocused=()=>document.hasFocus(),isRecording=()=>false}={}){
 const events=[],longTasks=[];let state={hidden:false,focused:true,recording:false};
 let lastVisibilityEvent=-Infinity,lastFocusEvent=-Infinity;
 const vis=()=>{lastVisibilityEvent=now();state.hidden=!!isHidden();};
 const focus=()=>{lastFocusEvent=now();state.focused=!!isFocused();};
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
 function observe({frameMs,simMs,renderMs,drawCalls=0,triangles=0,wave=0}){
  if(!Number.isFinite(frameMs)||frameMs<80)return;
  const at=now(),recording=!!isRecording(),hidden=!!isHidden(),focused=!!isFocused();
  const recentLongTasks=longTasks.filter(t=>t.at>at-frameMs-150&&t.at<at+50);
  let classification='unattributed-raf-gap';
  if(hidden||at-lastVisibilityEvent<1000||!focused||at-lastFocusEvent<500)classification='visibility-or-focus-interruption';
  else if(renderMs>80)classification='renderer-or-driver-block';
  else if(simMs>80)classification='simulation-main-thread-block';
  else if(recentLongTasks.length)classification='other-main-thread-long-task';
  else if(recording)classification='capture-or-external-frame-gap';
  const event={at:Math.round(at),wave,frameMs:+frameMs.toFixed(1),simMs:+simMs.toFixed(1),renderMs:+renderMs.toFixed(1),
   outsideMeasuredCodeMs:+Math.max(0,frameMs-simMs-renderMs).toFixed(1),drawCalls,triangles,recording,hidden,focused,
   longTaskMs:+recentLongTasks.reduce((a,b)=>a+b.ms,0).toFixed(1),classification};
  events.push(event);if(events.length>80)events.shift();return event;
 }
 function summary(){
  const classificationCounts={};for(const e of events)classificationCounts[e.classification]=(classificationCounts[e.classification]||0)+1;
  return {totalLongFrames:events.length,classificationCounts,recent:events.slice(-24),
   longTasksObserved:longTasks.length,recording:!!isRecording(),hidden:!!isHidden(),focused:!!isFocused(),
   warning:'RAF intervals can include browser scheduling, driver stalls, GC and capture work outside instrumented functions. Classifications are diagnostic, not definitive root causes.'};
 }
 return {observe,summary,reset(){events.length=0;longTasks.length=0;},dispose(){observer?.disconnect()}};
}
