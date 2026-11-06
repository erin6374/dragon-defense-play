// Hysteresis prevents quality oscillation during a brief impact or pause.
export class AdaptiveQuality {
 constructor(){this.level=2;this.average=1/60;this.elapsed=0;this.recovery=0;}
 sample(dt){if(!Number.isFinite(dt)||dt<=0||dt>.25)return;
  this.average=this.average*.96+dt*.04;this.elapsed+=dt;
  if(this.elapsed<1.5)return;this.elapsed=0;
  if(this.average>1/38&&this.level>0){this.level--;this.recovery=0;}
  else if(this.average<1/53&&this.level<2){this.recovery+=1.5;if(this.recovery>=9){this.level++;this.recovery=0;}}
  else this.recovery=0;
 }
 particleBudget(requested,active,cap){const factor=[.38,.66,1][this.level];return Math.max(0,Math.min(Math.floor(requested*factor),cap-active));}
 allowTrail(active){return active<([45,95,155][this.level]);}
 reset(){this.level=2;this.average=1/60;this.elapsed=0;this.recovery=0;}
}
