/** Diagnostic-only WebGL allocation tracker. No per-draw-call interception.
 * Tracks API requests, not GPU bytes, VRAM occupancy or actual driver allocation.
 * Instruments only the QA-owned WebGL context and can be uninstalled.
 */
export function installWebGLResourceAudit(gl, {clock=()=>Date.now(), limit=256}={}) {
  if(!gl) return {supported:false, snapshot:()=>({supported:false}), dispose:()=>{}};
  const methods={
    createBuffer:'buffersCreated',deleteBuffer:'buffersDeleted',
    createTexture:'texturesCreated',deleteTexture:'texturesDeleted',
    createFramebuffer:'framebuffersCreated',deleteFramebuffer:'framebuffersDeleted',
    createRenderbuffer:'renderbuffersCreated',deleteRenderbuffer:'renderbuffersDeleted',
    createProgram:'programsCreated',deleteProgram:'programsDeleted',
    createShader:'shadersCreated',deleteShader:'shadersDeleted',
    compileShader:'shaderCompilations',linkProgram:'programLinks',
    texImage2D:'textureUploads',texSubImage2D:'textureSubUploads',
    texImage3D:'textureUploads',texSubImage3D:'textureSubUploads',
    compressedTexImage2D:'compressedTextureUploads',
    bufferData:'bufferUploads',bufferSubData:'bufferSubUploads',
    renderbufferStorage:'renderbufferAllocations',
    framebufferTexture2D:'framebufferAttachments'
  };
  const counters={};const journal=[];const originals=[];
  let supported=0;
  for(const [method,key] of Object.entries(methods)) {
    const original=gl[method];if(typeof original!=='function')continue;
    const own=Object.prototype.hasOwnProperty.call(gl,method);
    const descriptor=own?Object.getOwnPropertyDescriptor(gl,method):null;
    try {
      gl[method]=function(...args){
        const t=clock();const result=original.apply(this,args);
        counters[key]=(counters[key]||0)+1;
        if(journal.length>=limit)journal.shift();
        journal.push({utc:t,operation:method});
        return result;
      };
      if(gl[method]===original)continue;
      originals.push({method,original,own,descriptor});supported++;
    } catch (_) { /* Browser may expose non-writable methods; report coverage. */ }
  }
  const snapshot=(sinceUTC=0)=>({supported:supported>0,trackedMethods:supported,counters:{...counters},
    recent:journal.filter(e=>e.utc>=sinceUTC).slice(-48),lastEventUTC:journal.at(-1)?.utc||null,
    note:'Counts WebGL API calls intercepted AFTER game renderer initialization. Not GPU time or allocated VRAM.'});
  return {supported:supported>0,snapshot,dispose(){for(const x of originals){
    try {if(x.own)Object.defineProperty(gl,x.method,x.descriptor);else delete gl[x.method];}catch(_){}
  }}};
}
