/** Host monitor UI intentionally separate from the game renderer. No GPU probes
 * or synchronous snapshots are taken on the animation thread. */
export function setupSystemMonitorUI(){
 const section=document.getElementById('dd-system-monitor');if(!section)return;
 const status=section.querySelector('[data-host-status]'),canvas=section.querySelector('canvas');
 const ctx=canvas?.getContext('2d');const hist=[];const MAX=120;
 const nice=v=>Number.isFinite(Number(v))?Number(v).toFixed(1):'n/a';
 const graph=()=>{
  if(!ctx)return;const w=canvas.width,h=canvas.height;
  ctx.fillStyle='#0a182c';ctx.fillRect(0,0,w,h);
  for(let grid=0;grid<5;grid++){ctx.strokeStyle='#30445c';ctx.beginPath();ctx.moveTo(0,grid*h/4);ctx.lineTo(w,grid*h/4);ctx.stroke();}
  for(const [key,col] of [['cpuPercent','#f9a958'],['ramPercent','#8ac4e7'],['gpuPercent','#ba91f1']]){
   ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();let started=false;
   hist.forEach((row,i)=>{const yVal=Number(row[key]);if(row[key]==null||!Number.isFinite(yVal))return;
    const x=i/(MAX-1)*(w-1),y=h-6-Math.min(100,Math.max(0,yVal))*(h-12)/100;
    if(!started){ctx.moveTo(x,y);started=true;}else ctx.lineTo(x,y);
   });ctx.stroke();
  }
  ctx.font='12px sans-serif';ctx.fillStyle='#f9a958';ctx.fillText('CPU',8,15);
  ctx.fillStyle='#8ac4e7';ctx.fillText('RAM',47,15);ctx.fillStyle='#ba91f1';ctx.fillText('GPU*',89,15);
 };
 let lastSystem={};
 const onLocalServer=location.hostname==='127.0.0.1'||location.hostname==='localhost';
 // Only our Python launcher supports these diagnostic endpoints. A stale browser
 // tab must not hammer a dead localhost port every two seconds indefinitely.
 let endpointsAvailable=false, endpointsChecked=false, stopped=false;
 const requestOptions={cache:'no-store'};
 const disconnect=()=>{
  endpointsAvailable=false;stopped=true;
  if(status)status.textContent='Local game server is no longer reachable. Close this tab and relaunch START_GAME.bat; the game may be an old tab.';
 };
 const checkServer=async()=>{
  if(!onLocalServer||stopped)return false;
  if(endpointsChecked)return endpointsAvailable;
  endpointsChecked=true;
  try{
   const resp=await fetch('./__build',requestOptions);
   if(!resp.ok || !(resp.headers.get('content-type')||'').includes('application/json'))throw Error('Python game endpoint unavailable');
   const build=await resp.json();
   if(!build.version||!build.directory)throw Error('Server is not the Dragon Defense launcher');
   endpointsAvailable=true;
  }catch(e){disconnect();}
  return endpointsAvailable;
 };
 const update=async()=>{
  if(document.hidden||!onLocalServer||stopped||!await checkServer())return;
  const metrics=window.__DD_GAME_METRICS||{};
  const panelOpen=!section.closest('#performance-lab-panel')?.hidden;
  if(panelOpen){
   try{
    const resp=await fetch('./__system_metrics',requestOptions);
    if(!resp.ok)throw Error('System monitor endpoint unavailable');
    const m=await resp.json();lastSystem=m;hist.push(m);if(hist.length>MAX)hist.shift();graph();
    if(m.disabled){status.textContent='Windows system monitor disabled (Safe Mode / No Monitor); gameplay remains available.';}
    else status.textContent=`System CPU ${nice(m.cpuPercent)}% · RAM ${nice(m.ramPercent)}% (${nice(m.ramAvailableGB)} GB free) · `+
    `GPU 3D ${m.gpuPercent==null?'unsupported*':nice(m.gpuPercent)+'%'} · Video decode ${m.videoDecodePercent==null?'n/a':nice(m.videoDecodePercent)+'%'} · Browser RAM ${nice(m.browserRSSMB)} MB · `+
    `game ${nice(metrics.fps)} FPS / ${metrics.drawCalls??'—'} draws · Wave ${metrics.wave??'—'}`;
   }catch(e){if(status)status.textContent='System monitor unavailable; gameplay can continue without it.';}
  }
  try{
   const r=await fetch('./__game_telemetry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    wave:metrics.wave??null,fps:metrics.fps??null,drawCalls:metrics.drawCalls??null,frameMs:metrics.frameMs??null,
    recording:metrics.recording??null,stallCount:metrics.stallCount??null})});
   if(!r.ok)disconnect();
  }catch(e){disconnect();}
 };
 if(!onLocalServer){status.textContent='OS monitor only available in the local Windows launcher.';}
 setInterval(update,2000);update();
 const csv=section.querySelector('[data-system-csv]');csv?.addEventListener('click',()=>{
  const a=document.createElement('a');a.href='./__system_csv';a.download=lastSystem.logFile||'system-performance.csv';document.body.append(a);a.click();a.remove();
 });
}
setupSystemMonitorUI();
