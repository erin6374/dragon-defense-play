import {PAULO_POSES,choosePauloPose,choosePauloBankDirection} from './paulo-animation-intent.js';

// Bridges the existing game's simulation signals to the visual-only Paulo rig.
// This driver does not read input, spawn projectiles, move gameplay hitboxes,
// modify cooldowns, or own a renderer. One call to update() represents one
// game simulation step; the authoritative game clock remains external.
export function createPauloPoseDriver(rig,{initialState='hover'}={}){
 if(!rig||typeof rig.applyPose!=='function')throw new TypeError('Paulo rig must implement applyPose(time,pose,direction)');
 if(!PAULO_POSES.includes(initialState))throw new RangeError('Invalid Paulo initial animation state');
 let pose=initialState,poseTime=0,animationTime=0,bankDirection=1;
 rig.applyPose(animationTime,pose,bankDirection);

 function update(dt,signals={}){
  if(signals.paused)return pose;
  if(!Number.isFinite(dt)||dt<0)throw new RangeError('Paulo animation delta must be finite and nonnegative');
  // Match the lab's bounded frame advance. Keep wing cycle phase continuous
  // even as attacks briefly change the visible animation state.
  const step=Math.min(dt,.05);
  const next=choosePauloPose(signals);
  bankDirection=choosePauloBankDirection({
   horizontal:signals.horizontal??0,facing:signals.facing??1
  });
  if(next!==pose){pose=next;poseTime=0;}
  else poseTime+=step;
  animationTime+=step;
  rig.applyPose(animationTime,pose,bankDirection);
  return pose;
 }
 function snapshot(){return {pose,poseTime,animationTime,bankDirection};}
 function reset(state='hover'){
  if(!PAULO_POSES.includes(state))throw new RangeError('Invalid Paulo reset state');
  pose=state;poseTime=0;animationTime=0;bankDirection=1;
  rig.applyPose(0,pose,bankDirection);
  return pose;
 }
 return {update,snapshot,reset};
}
