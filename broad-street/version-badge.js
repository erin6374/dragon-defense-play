/* Broad Street Viewer: exact build ID agrees with the *served* release manifest.
   Does not claim a published site is current merely because a URL contains ?v=18.
   Tests both the page and its runtime manifest every load; no service-worker cache. */
(()=>{
 const bar=document.getElementById('bsv-edition-bar');if(!bar)return;
 const expected=bar.dataset.buildId;
 const result=document.getElementById('bsv-version-status');
 const version=expected.match(/^BSV-(\d+\.\d+\.\d+)-/);
 const gitHubPages=location.hostname.endsWith('.github.io');
 if(!version){result.textContent='⚠ Missing/invalid build identifier';result.className='bsv-status bsv-verify-bad';return;}
 result.textContent='Checking '+(gitHubPages?'GitHub Pages':'local/other host')+' build…';
 const url=new URL('./build-info.json',location.href);
 url.searchParams.set('check',String(Date.now()));
 fetch(url.href,{cache:'no-store',headers:{'Accept':'application/json'}})
  .then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()})
  .then(meta=>{
   if(meta.buildId!==expected||meta.version!==version[1]||meta.revision!==Number(version[1].split('.')[0])){
    result.textContent='⚠ MIXED / OLD FILES — page '+expected+'; manifest '+String(meta.buildId||'?')+'; refresh/redeploy';
    result.className='bsv-status bsv-verify-bad';
   }else{
    result.textContent=meta.qaWorkingCopy?.status?.startsWith('UNRELEASED') ? '⚠ UNRELEASED source candidate · v'+meta.version+' baseline verified' : '✓ '+(gitHubPages?'PUBLISHED':'HOSTED')+' v'+meta.version+' · manifest verified';
    result.className='bsv-status';
   }
  }).catch(err=>{result.textContent='⚠ Version unverified ('+err.message+'). Check deployment.';result.className='bsv-status bsv-verify-bad'});
})();
