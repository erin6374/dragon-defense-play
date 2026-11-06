// Diagnostic overlay; GPU time is not inferred from FPS. F3 toggles.
export function createProfiler({renderer,scene,metrics}){
 const panel=document.createElement('pre');panel.id='dev-profiler';Object.assign(panel.style,{position:'fixed',top:'148px',right:'12px',zIndex:'30',margin:'0',padding:'12px',background:'rgba(5,12,27,.90)',color:'#9fffd0',font:'12px/1.5 monospace',pointerEvents:'none',border:'1px solid #5b9',borderRadius:'8px',display:'none'});document.body.append(panel);
 let visible=false,frames=0,seconds=0,simulation=0,render=0,frameMs=0,steps=0,dropped=0;
 return {toggle(){visible=!visible;panel.style.display=visible?'block':'none';return visible;},record({dt,simMs,renderMs,stepCount,droppedSteps}){if(!visible)return;frames++;seconds+=dt;simulation+=simMs;render+=renderMs;steps+=stepCount;dropped=droppedSteps;frameMs=Math.max(frameMs,dt*1000);if(seconds<.5)return;const info=renderer.info.render,counts=metrics();let sceneObjects=0;scene.traverse(()=>sceneObjects++);panel.textContent=`DRAGON DEFENSE — F3
FPS ${(frames/seconds).toFixed(1)} | max frame ${frameMs.toFixed(1)} ms
Simulation ${(simulation/frames).toFixed(2)} ms/frame | steps ${(steps/frames).toFixed(1)}
Render ${(render/frames).toFixed(2)} ms/frame
Draw calls ${info.calls} | triangles ${info.triangles.toLocaleString()}
Scene nodes ${sceneObjects.toLocaleString()}
Meteors ${counts.meteors} | shots ${counts.shots} | debris ${counts.debris}
Cars ${counts.cars} | effects ${counts.effects} | gas ${counts.gas}
Dropped simulation steps ${dropped}
Renderer memory: geometries ${renderer.info.memory.geometries}, textures ${renderer.info.memory.textures}
NOTE: GPU timing is not measured`;frames=0;seconds=0;simulation=0;render=0;frameMs=0;steps=0;} };
}
