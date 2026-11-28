// Transform raw real-time benchmark reports into strict native evidence.
// Reject incomplete, unfocused or context-lost phases; no filtering of stalls.
export function summarizeNativeCase(name,expansion,raw,completed){
 const frames=Array.isArray(raw?.samples)?raw.samples:[];
 const valid=frames.length>0&&frames.every(f=>Number.isFinite(f.frameMs)&&f.frameMs>=0);
 const focused=valid&&frames.every(f=>f.focused===true&&f.previouslyFocused===true&&f.visibility==='visible');
 const contextLost=frames.filter(f=>f.contextLost!==false&&f.contextLost!==0).length;
 const duration=raw?.durationSec;
 const sorted=valid?frames.map(f=>f.frameMs).sort((a,b)=>a-b):[];
 const settings=raw?.testSettings;
 return {name,expansion,averageFPS:Number.isFinite(duration)&&duration>0?+(frames.length/duration).toFixed(2):null,
  p95FrameMs:sorted.length?sorted[Math.floor((sorted.length-1)*.95)]:null,samples:frames.length,contextLost,focused,
  completed:completed===true&&valid&&raw?.droppedSamples===0&&settings?.preset==='balanced'&&settings?.fpsCap===45,
  maxDrawCalls:raw?.maxDrawCalls??null,stalls100:raw?.stalls100??null,durationSec:duration??null};
}
