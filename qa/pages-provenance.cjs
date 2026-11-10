#!/usr/bin/env node
// Read-only diagnostic for the Pages development preview. Never deploys or edits files.
const {createHash}=require('node:crypto');
const {readFile}=require('node:fs/promises');
const assert=require('node:assert/strict');
const sha=b=>createHash('sha256').update(b).digest('hex');
function classify(live,current,previous){
 if(live.status!==200)return 'http-error';
 if(compare(current,live.bytes).match)return 'current-tested-head';
 if(previous&&compare(previous,live.bytes).match)return 'previous-verified-release';
 return 'other-or-mixed-snapshot';
}
function compare(a,b){
 let i=0;for(;i<Math.min(a.length,b.length);i++)if(a[i]!==b[i])break;
 return {match:i===a.length&&i===b.length,firstMismatch:i===a.length&&i===b.length?-1:i};
}
async function get(url){
 const response=await fetch(url,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(12000)});
 const bytes=Buffer.from(await response.arrayBuffer());
 return {status:response.status,bytes,cache:response.headers.get('cache-control'),etag:response.headers.get('etag'),age:response.headers.get('age'),lastModified:response.headers.get('last-modified'),date:response.headers.get('date'),xCache:response.headers.get('x-cache'),via:response.headers.get('via')};
}
async function main(){
 if(process.argv.includes('--self-test')){
  assert.deepEqual(compare(Buffer.from('abc'),Buffer.from('abc')),{match:true,firstMismatch:-1});
  assert.deepEqual(compare(Buffer.from('abc'),Buffer.from('axc')),{match:false,firstMismatch:1});
  assert.deepEqual(compare(Buffer.from('abc'),Buffer.from('ab')),{match:false,firstMismatch:2});
  assert.equal(classify({status:200,bytes:Buffer.from('abc')},Buffer.from('abc'),Buffer.from('old')),'current-tested-head');
  assert.equal(classify({status:200,bytes:Buffer.from('old')},Buffer.from('abc'),Buffer.from('old')),'previous-verified-release');
  assert.equal(classify({status:200,bytes:Buffer.from('new')},Buffer.from('abc'),Buffer.from('old')),'other-or-mixed-snapshot');
  assert.equal(classify({status:404,bytes:Buffer.from('abc')},Buffer.from('abc'),null),'http-error');
  console.log('Pages provenance comparator and release classifier self-test passed');return;
 }
 const repo=process.env.GITHUB_REPOSITORY||'erin6374/dragon-defense-play';
 const pageRoot=(process.env.PAGE_URL||'https://erin6374.github.io/dragon-defense-play/').replace(/\/?$/,'/');
 const mainRoot='https://raw.githubusercontent.com/'+repo+'/main/';
 const lastVerified=process.env.LAST_VERIFIED_PREVIEW_SHA||'5b4fecfb9eb56901e9134ffcaefc655f36a9ae33';
 const changedPreviewPaths=new Set(['src/game.js','src/rendering/philadelphia-geometry-skyline.js']);
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
   Object.assign(record,{status:live.status,liveBytes:live.bytes.length,liveSha256:sha(live.bytes),cache:live.cache,etag:live.etag,age:live.age,lastModified:live.lastModified,date:live.date,xCache:live.xCache,via:live.via});
   if(source==='report'){
    try{const report=JSON.parse(live.bytes.toString('utf8'));
     record.reportValid=live.status===200&&!report.failure&&Array.isArray(report.errors)&&report.errors.length===0;
     record.reportBuild=report.expected?.build;
    }catch(e){record.reportError=e.message;}
   }else{
    const expected=source==='local'?await readFile(path):(await get(mainRoot+path+'?provenance='+run)).bytes;
    const diff=compare(expected,live.bytes);
    Object.assign(record,{expectedBytes:expected.length,expectedSha256:sha(expected),matched:live.status===200&&diff.match,firstMismatchByte:diff.firstMismatch});
    if(source==='local'&&changedPreviewPaths.has(path)){
     try{
      const prior=await get('https://raw.githubusercontent.com/'+repo+'/'+lastVerified+'/'+path+'?provenance='+run);
      if(prior.status===200){
       record.lastVerifiedCommit=lastVerified;
       record.lastVerifiedSha256=sha(prior.bytes);
       record.liveMatchesLastVerified=compare(prior.bytes,live.bytes).match;
       record.provenance=classify(live,expected,prior.bytes);
      }else{record.lastVerifiedHttpStatus=prior.status;record.provenance=classify(live,expected,null);}
     }catch(e){record.lastVerifiedError=e.name+': '+e.message;record.provenance=classify(live,expected,null);}
    }
   }
  }catch(e){record.error=e.name+': '+e.message;}
  console.log('PAGES_PROVENANCE '+JSON.stringify(record));
 }
 console.log('Diagnostic only: failures above do not alter browser QA or production.');
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
