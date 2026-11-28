// Fail-closed Preview 11 acceptance policy. Evidence must identify the exact
// candidate SHA, never a preceding build. A software-renderer pass is not
// native GPU acceptance. The policy does not publish or merge anything.
export function evaluatePark13Release(sha,evidence={}){
 const gates=[];
 const add=(name,ok,reason)=>gates.push({name,passed:!!ok,reason:ok?'verified':reason});
 const exact=r=>r?.source===sha&&/^[a-f0-9]{40}$/.test(sha);
 const {source,browser,native,visual,package:pkg}=evidence;
 add('source',exact(source)&&source.passed===true&&source.records===165&&source.originalParcels===122&&source.footprintChecks===33825&&source.surfaceChecks===322560&&source.conflicts===0&&source.lifecycleTargets===165,'exact source audit evidence missing or incomplete');
 const on=browser?.runs?.find(r=>r.enabled===true),off=browser?.runs?.find(r=>r.enabled===false);
 add('browser',exact(browser)&&browser.passed===true&&browser.errors?.length===0&&browser.runs?.length===2&&on?.school&&off?.school&&on.parcels===122&&off.parcels===122&&on.expansion?.buildings===165&&off.expansion===null&&on.liveMeteor?.after?.damage>0&&on.liveMeteor?.repaired?.damage===0&&on.afterRepairDelay?.meteors===0&&on.afterRepairDelay?.fragments===0,'exact baseline/expansion browser evidence and live meteor/repair required');
 const hardware=String(native?.renderer??'');
 const metrics=native?.cases??[];
 const validCase=c=>Number.isFinite(c.averageFPS)&&Number.isFinite(c.p95FrameMs)&&Number.isFinite(c.samples)&&c.samples>=300&&c.contextLost===0&&c.focused===true&&c.completed===true;
 // Initial candidate thresholds, anchored to Preview 10's 45 FPS Balanced
 // target and 33.5 ms p95 on RTX 3060. A paired baseline is mandatory.
 const required=['traverse','bombardment'];
 const nativeOK=required.every(name=>{
  const base=metrics.find(c=>c.name===name&&c.expansion===false),test=metrics.find(c=>c.name===name&&c.expansion===true);
  return base&&test&&validCase(base)&&validCase(test)&&base.averageFPS>=40&&test.averageFPS>=40&&test.p95FrameMs<=40&&test.averageFPS>=base.averageFPS*.9&&test.p95FrameMs<=base.p95FrameMs*1.2;
 });
 add('native',exact(native)&&native.passed===true&&/RTX\s*3060/i.test(hardware)&&!/swiftshader|llvmpipe|software|warp/i.test(hardware)&&native.preset==='Balanced'&&native.fpsCap===45&&native.viewport?.width===1280&&native.viewport?.height===720&&nativeOK,'matched RTX 3060 native baseline and expansion runs required');
 const visualNames=['north','central','south','campus','street-seams','damage-repair'];
 add('visual',exact(visual)&&visual.approved===true&&typeof visual.reviewer==='string'&&visual.reviewer.trim().length>0&&visualNames.every(name=>visual.views?.some(v=>v.name===name&&v.approved===true&&typeof v.evidence==='string'&&v.evidence.length>0)),'explicit review of all six views required');
 add('package',exact(pkg)&&pkg.passed===true&&typeof pkg.archive==='string'&&/^[a-f0-9]{64}$/.test(pkg.sha256??'')&&pkg.launcherSmoke===true&&pkg.version==='5.5.0-integration.11'&&pkg.rollbackVerified===true,'candidate archive hash, launcher smoke and rollback required');
 return {source:sha,ready:gates.every(g=>g.passed),gates};
}
