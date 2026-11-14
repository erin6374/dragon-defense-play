// Dragon Defense performance isolation laboratory.
// All switches are local, reversible, and intentionally change either visual
// workload or, where noted, the named simulation system. They are not balance settings.
export const SYSTEMS=Object.freeze([
 {key:'skyline',label:'Philadelphia skyline',kind:'render',hint:'3D towers, city facade maps, skyline fires'},
 {key:'backgroundBuildings',label:'Distant neighborhood houses',kind:'render',hint:'Instanced rear-row facades and rubble'},
 {key:'schoolModel',label:'Tech Freire BIM geometry',kind:'render',hint:'School visual meshes only; damage logic retained'},
 {key:'traffic',label:'Cars, buses & emergency vehicles',kind:'simulation',hint:'Pauses traffic simulation and hides vehicles'},
 {key:'pedestrians',label:'Pedestrians',kind:'simulation',hint:'Pauses pedestrian AI and hides people'},
 {key:'helicopters',label:'Helicopters',kind:'simulation',hint:'Pauses helicopter AI and hides helicopters'},
 {key:'backgroundMeteors',label:'Distant meteors & explosions',kind:'simulation',hint:'Pauses decorative streak and sky impact creation'},
 {key:'particles',label:'Explosion particles and trails',kind:'render',hint:'Stops particle generation and hides particle batches'},
 {key:'fires',label:'Fire, smoke & skyline plumes',kind:'render',hint:'Stops school fire animation; hides fire and smoke'},
 {key:'weather',label:'Rain / animated weather',kind:'render',hint:'Stops rain updates and hides rain sprites'},
 {key:'shadows',label:'Shadow maps',kind:'render',hint:'Disables cast shadows without removing sunlight'},
 {key:'rubble',label:'Persistent rubble',kind:'render',hint:'Hides decorative settled rubble; keeps damage rules'}
]);
const percentile=(values,fraction)=>{if(!values.length)return null;const v=[...values].sort((a,b)=>a-b);return Math.round(v[Math.min(v.length-1,Math.floor((v.length-1)*fraction))]*10)/10;};
export function summarizePerformance(samples){
 if(!samples.length)return null;
 const times=samples.map(s=>s.dt),span=times.reduce((a,b)=>a+b,0)/1000;
 const avg=(k)=>+(samples.reduce((a,b)=>a+(b[k]||0),0)/samples.length).toFixed(2);
 return {seconds:+span.toFixed(2),frames:samples.length,fps:+(samples.length/Math.max(span,.001)).toFixed(1),
  p50FrameMs:percentile(times,.5),p95FrameMs:percentile(times,.95),p99FrameMs:percentile(times,.99),
  maxFrameMs:Math.round(Math.max(...times)*10)/10,stalls50ms:times.filter(t=>t>=50).length,stalls100ms:times.filter(t=>t>=100).length,
  meanDrawCalls:avg('drawCalls'),maxDrawCalls:Math.max(...samples.map(s=>s.drawCalls)),
  meanSimulationMs:avg('simMs'),meanRenderSubmissionMs:avg('renderMs')};
}
export function createPerformanceLab({onChange=()=>{},now=()=>Date.now()}={}){
 const switches=Object.fromEntries(SYSTEMS.map(s=>[s.key,true]));
 const captures=[];let active=null;
 const listeners=new Set();
 const signal=()=>{for(const fn of listeners)fn();};
 return {
  systems:SYSTEMS,
  isEnabled(key){if(!(key in switches))throw Error('Unknown performance system '+key);return switches[key];},
  set(key,value){if(!(key in switches))throw Error('Unknown performance system '+key);const v=!!value;if(switches[key]===v)return;
   switches[key]=v;onChange(key,v);signal();},
  restore(){for(const key of Object.keys(switches))if(!switches[key]){switches[key]=true;onChange(key,true);}signal();},
  states(){return {...switches};},
  subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
  begin(label='sample',seconds=8,meta={}){if(active)throw Error('A performance sample is already running');
   active={label,seconds:Math.max(2,Math.min(60,seconds)),startedAt:now(),meta,states:{...switches},samples:[],elapsed:0};signal();},
  record(frame){if(!active)return;const ms=frame.dt*1000;
   if(!Number.isFinite(ms)||ms<=0)return;
   // Preserve genuine long frame gaps, including stalls beyond 15 seconds;
   // clipping them would overstate FPS during the reported slideshow.
   const sample={dt:ms,drawCalls:frame.drawCalls||0,simMs:frame.simMs||0,renderMs:frame.renderMs||0};
   active.samples.push(sample);active.elapsed+=sample.dt/1000;
   if(active.elapsed>=active.seconds){
    const completed={label:active.label,date:new Date(active.startedAt).toISOString(),states:active.states,meta:active.meta,summary:summarizePerformance(active.samples)};
    captures.push(completed);if(captures.length>20)captures.shift();active=null;signal();
   }
  },
  progress(){return active?{label:active.label,elapsed:active.elapsed,target:active.seconds}:null;},
  captures(){return captures.map(c=>({...c,states:{...c.states}}));},
  export(){return {version:1,timestamp:new Date(now()).toISOString(),states:{...switches},captures:this.captures(),
   caveat:'GPU time is not measured. Compare the same wave/scene with the same graphics setting; simulation toggles alter gameplay.'};}
 };
}
