import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {evaluatePark13Release} from './park13-release-gate.mjs';
const [sha,folder='park13-integration-output']=process.argv.slice(2);
if(!/^[a-f0-9]{40}$/.test(sha??'')){
 console.error('Usage: node qa/park13-release-check.mjs <exact-candidate-sha> [evidence-directory]');
 process.exit(2);
}
const evidence={},unavailable=[];
for(const [name,file] of Object.entries({source:'source-audit.json',browser:'report.json',native:'native.json',visual:'visual.json',package:'package.json'})){
 try{evidence[name]=JSON.parse(await readFile(resolve(folder,file),'utf8'));}
 catch(e){unavailable.push({name,file,reason:e.code??'invalid JSON'});}
}
const result={...evaluatePark13Release(sha,evidence),unavailable};
console.log(JSON.stringify(result,null,2));
if(!result.ready)process.exitCode=1;
