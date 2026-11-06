// Dragon Defense 4.9: opt-in, on-device screen capture for reproducible visual QA.
// PNGs are composited *after* a completed WebGL frame; WebM recording uses the
// existing renderer canvas stream to avoid a second draw / re-render loop.
// Browser MediaRecorder/captureStream support varies. No uploads or network calls.
function downloadBlob(blob,name){
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),12000);
}
function safeInfo(fn){try{return fn()}catch(e){return {error:String(e)}}}
export function createCaptureLab({canvas,getMetadata=()=>({}),onStatus=()=>{},maxVideoSeconds=25}={}){
 if(!canvas)throw new TypeError('CaptureLab requires the renderer canvas');
 let screenshotRequested=false,screenshotLabel='inspection',recorder=null,stream=null,chunks=[],timer=null;
 let recordedAt=0,recordingName='',framesDuringVideo=0;
 const history=[];
 const status=(text)=>onStatus(text);
 function snapshot(){return safeInfo(getMetadata)}
 function requestScreenshot(label='inspection'){
  screenshotRequested=true;screenshotLabel=label;
  status('Screenshot queued for the next rendered frame.');
 }
 function afterRender(){
  if(recorder?.state==='recording')framesDuringVideo++;
  if(!screenshotRequested)return;
  screenshotRequested=false;
  // Drawing onto 2D canvas immediately after the WebGL render avoids the
  // preserveDrawingBuffer=false blank-frame problem on some GPU drivers.
  const cap=document.createElement('canvas'),scale=Math.min(1,1920/Math.max(1,canvas.width));
  cap.width=Math.round(canvas.width*scale);cap.height=Math.round(canvas.height*scale);
  const c=cap.getContext('2d');c.drawImage(canvas,0,0,cap.width,cap.height);
  const meta=snapshot(),lines=[`DRAGON DEFENSE ${meta.version||''} · VISUAL QA`,
   `WAVE ${meta.wave??'?'}  SCORE ${meta.score??'?'}  SCHOOL ${meta.schoolHealth??'?'}%`,
   `GRAPHICS ${meta.graphics||'?'}  DRAWS ${meta.drawCalls??'?'}  TRIANGLES ${meta.triangles??'?'}`,
   `CAPTURE ${new Date().toISOString()}`];
  const font=Math.max(13,Math.round(cap.width/105));c.font=`600 ${font}px system-ui,Arial`;
  const widest=Math.max(...lines.map(l=>c.measureText(l).width));const lineH=Math.ceil(font*1.45);
  c.fillStyle='rgba(7,18,30,.83)';c.fillRect(8,8,Math.min(cap.width-16,widest+28),lineH*lines.length+17);
  c.fillStyle='#eaf3f8';lines.forEach((l,i)=>c.fillText(l,19,18+lineH*(i+1)-font*.35));
  const filename=`dragon-defense-v${meta.version||'unknown'}-${screenshotLabel}-${Date.now()}.png`;
  cap.toBlob(blob=>{if(blob){downloadBlob(blob,filename);history.push({kind:'screenshot',file:filename,sizeBytes:blob.size,timestamp:Date.now(),metadata:meta});status(`PNG saved (${Math.round(blob.size/1024)} KB).`);}else status('PNG capture failed.');},'image/png');
 }
 function finishRecording(){
  clearTimeout(timer);timer=null;
  if(recorder?.state==='recording')recorder.stop();
 }
 function startRecording(){
  if(recorder?.state==='recording')return false;
  if(typeof canvas.captureStream!=='function'||typeof window.MediaRecorder==='undefined'){
   status('This browser does not support WebM canvas recording. PNG still works.');return false;
  }
  try{
   stream=canvas.captureStream(12);
   const types=['video/webm;codecs=vp8','video/webm;codecs=vp9','video/webm'];
   const mime=types.find(t=>MediaRecorder.isTypeSupported(t));
   if(!mime){stream.getTracks().forEach(t=>t.stop());status('No supported WebM codec. Try Chrome/Edge on Windows.');return false;}
   chunks=[];framesDuringVideo=0;recordedAt=performance.now();
   const before=snapshot();recordingName=`dragon-defense-v${before.version||'unknown'}-qa-${Date.now()}`;
   const media=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:1500000});recorder=media;
   media.addEventListener('dataavailable',e=>{if(e.data?.size)chunks.push(e.data)});
   media.addEventListener('error',e=>status('Video capture error: '+(e.error?.message||'recorder error')));
   media.addEventListener('stop',()=>{
    const blob=new Blob(chunks,{type:media.mimeType||'video/webm'}),after=snapshot();
    const seconds=Math.round((performance.now()-recordedAt)/100)/10;
    const metadata={kind:'video',file:recordingName+'.webm',format:media.mimeType,seconds,
     renderedFrames:framesDuringVideo,sizeBytes:blob.size,before,after,recordedAt:new Date(Date.now()-seconds*1000).toISOString(),
     note:'Video contains the game canvas only; recording uses VP8 at 12 FPS when supported to reduce encoder load. DOM HUD is supplied in metadata. Recording may change measured performance.'};
    if(blob.size){downloadBlob(blob,metadata.file);downloadBlob(new Blob([JSON.stringify(metadata,null,2)],{type:'application/json'}),recordingName+'.json');
     history.push(metadata);status(`Video saved: ${seconds}s, ${(blob.size/1048576).toFixed(1)} MB + JSON metadata.`);
    }else status('No video frames captured. Recording failed.');
    stream?.getTracks().forEach(t=>t.stop());stream=null;recorder=null;chunks=[];
   });
   media.start(1000);timer=setTimeout(finishRecording,maxVideoSeconds*1000);
   status(`Recording gameplay canvas at 12 FPS (up to ${maxVideoSeconds}s). Recording may reduce FPS.`);
   return true;
  }catch(e){stream?.getTracks().forEach(t=>t.stop());stream=null;recorder=null;status('Video unavailable: '+(e.message||String(e)));return false;}
 }
 return {requestScreenshot,afterRender,startRecording,stopRecording:finishRecording,
  isRecording:()=>recorder?.state==='recording',supported:()=>typeof canvas.captureStream==='function'&&typeof window.MediaRecorder!=='undefined',
  history:()=>history.map(v=>({...v})),maxVideoSeconds};
}
