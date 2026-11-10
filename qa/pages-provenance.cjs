#!/usr/bin/env node
// Read-only diagnostic for the Pages development preview. Never deploys or edits files.
const {createHash}=require('node:crypto');
const {readFile}=require('node:fs/promises');
const assert=require('node:assert/strict');
const sha=b=>createHash('sha256').update(b).digest('hex');
function compare(a,b){
 let i=0;for(;i<Math.min(a.length,b.length);i++)if(a[i]!==b[i])break;
 return {match:i===a.length&&i===b.length,firstMismatch:i===a.length&&i===b.length?-1:i};
}
async function get(url){
 const response=await fetch(url,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(12000)});
 const bytes=Buffer.from(await response.arrayBuffer());
 return {status:response.status,bytes,cache:response.headers.get('cache-control'),etag:response.headers.get('etag')};
}
async function main(){
 if(process.argv.includes('--self-test')){
  assert.deepEqual(compare(Buffer.from('abc'),Buffer.from('abc')),{match:true,firstMismatch:-1});
  assert.deepEqual(compare(Buffer.from('abc'),Buffer.from('axc')),{match:false,firstMismatch:1});
  assert.deepEqual(compare(Buffer.from('abc'),Buffer.from('ab')),{match:false,firstMismatch:2});
  console.log('Pages provenance comparator self-test passed');return;
 }
 const repo=process.env.GITHUB_REPOSITORY||'erin6374/dragon-defense-play';
 const pageRoot=(process.env.PAGE_URL||'https://erin6374.github.io/dragon-defense-play/').replace(/\/?$/,'/');
 const mainRoot='https://raw.githubusercontent.com/'+repo+'/main/';
 const paths=[
  ['preview/build-info.json','local','build-info.json'],
  ['preview/index.html','local','index.html'],
  ['preview/src/game.js','local','src/game.js'],
  ['preview/src/rendering/philadelphia-geometry-skyline.js','local','src/rendering/philadelphia-geometry-skyline.js'],
  ['build-info.json','main','build-info.json'],
  ['index.html','main','index.html'],
  ['src/game.js','main','src/game.js'],
  ['qa/dashboard/report.json','report',null]
 ];
 const run=process.env.GITHUB_RUN_ID||'manual';
 for(const [published,source,path] of paths){
  const record={published,source};
  try{
   const live=await get(new URL(published+'?provenance='+run, pageRoot));
   Object.assign(record,{status:live.status,liveBytes:live.bytes.length,liveSha256:sha(live.bytes),cache:live.cache,etag:live.etag});
   if(source==='report'){
    try{const report=JSON.parse(live.bytes.toString('utf8'));
     record.reportValid=live.status===200&&!report.failure&&Array.isArray(report.errors)&&report.errors.length===0;
     record.reportBuild=report.expected?.build;
    }catch(e){record.reportError=e.message;}
   }else{
    const expected=source==='local'?await readFile(path):(await get(mainRoot+path+'?provenance='+run)).bytes;
    const diff=compare(expected,live.bytes);
    Object.assign(record,{expectedBytes:expected.length,expectedSha256:sha(expected),matched:live.status===200&&diff.match,firstMismatchByte:diff.firstMismatch});
   }
  }catch(e){record.error=e.name+': '+e.message;}
  console.log('PAGES_PROVENANCE '+JSON.stringify(record));
 }
 console.log('Diagnostic only: failures above do not alter browser QA or production.');
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
