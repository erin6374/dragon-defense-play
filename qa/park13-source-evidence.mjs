import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
const [sha,logPath,output='park13-integration-output/source-audit.json']=process.argv.slice(2);
if(!/^[a-f0-9]{40}$/.test(sha??'')||!logPath)throw Error('Exact SHA and successful source-audit log required');
const log=await readFile(logPath,'utf8');
function record(label){
 const matches=log.split(/\r?\n/).filter(l=>l.startsWith(label+' '));
 if(matches.length!==1)throw Error('Missing or ambiguous '+label);
 return JSON.parse(matches[0].slice(label.length+1));
}
const surface=record('PARK13_SURFACE_AUDIT'),source=record('PARK13_SOURCE_AUDIT'),life=record('PARK13_ALL_TARGETS');
const result={source:sha,passed:true,records:source.stats.buildings,originalParcels:source.baseline,footprintChecks:source.checks,surfaceChecks:surface.surfaceChecks,conflicts:surface.conflicts.length,lifecycleTargets:life.testedTargets};
if(result.records!==165||result.originalParcels!==122||result.footprintChecks!==33825||result.surfaceChecks!==322560||result.conflicts!==0||result.lifecycleTargets!==165||!life.restored)throw Error('Source audit evidence failed');
await mkdir(dirname(output),{recursive:true});
await writeFile(output,JSON.stringify(result,null,2)+'\n');
console.log('PARK13_SOURCE_EVIDENCE '+JSON.stringify(result));
