// GPU framebuffer workload governor. Affects visual pixel count only, never gameplay.
// Updates happen at least five seconds apart to avoid oscillation and resize stalls.
export class AdaptiveFramebuffer {
 constructor(){this.reset();}
 reset(){this.scale=1;this.adjustments=0;this.frameTimes=[];this.cooldown=0;this.slowFrames=0;}
 sample(dt,playing){
  if(!playing||!Number.isFinite(dt)||dt<=0||dt>10){this.slowFrames=0;return false;}
  this.cooldown=Math.max(0,this.cooldown-Math.min(dt,1));
  // A slideshow can never fill the normal 70-frame window promptly. Three
  // consecutive >250ms foreground frames provide a separate conservative
  // escape hatch; isolated focus/driver stalls do not lower resolution.
  if(dt>.25){
   this.frameTimes.length=0;
   this.slowFrames++;
   if(this.slowFrames<3||this.cooldown>0||this.scale<=.65)return false;
   this.scale=Math.max(.65,this.scale-.12);
   this.adjustments++;this.cooldown=5;this.slowFrames=0;
   return true;
  }
  this.slowFrames=0;
  this.frameTimes.push(Math.min(.15,dt));
  if(this.frameTimes.length>100)this.frameTimes.shift();
  if(this.frameTimes.length<70||this.cooldown>0)return false;
  const avg=this.frameTimes.reduce((a,b)=>a+b,0)/this.frameTimes.length;
  let target=this.scale;
  if(avg>.028)target=Math.max(.65,this.scale-.12);
  else if(avg<.019)target=Math.min(1,this.scale+.07);
  if(Math.abs(target-this.scale)<=.02)return false;
  this.scale=target;this.adjustments++;this.cooldown=5;this.frameTimes.length=0;
  return true;
 }
}
