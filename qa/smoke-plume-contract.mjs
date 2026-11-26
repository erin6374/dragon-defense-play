// RC45 bounded smoke-variation source contract, not cinematic approval.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const bridge=readFileSync(new URL('../src/rendering/flipbook-bridge.js',import.meta.url),'utf8');
const combustion=readFileSync(new URL('../src/rendering/building-combustion.js',import.meta.url),'utf8');
for(const token of [
 'float gust=.90+.18*sin(clock*.31+layer*.55+vSeed*.41);',
 'float crosswind=-gust*(.76+.40*fract(vSeed*.193))*pow(vAge,1.42)*3.8;',
 'float ashBlend=smoothstep(.12,.88,vAge);',
 'float sootVariation=.85+.24*fract(vSeed*.413);',
 'alpha=frame.a*min(1.,vPower)*(.78+.16*fract(vSeed*.271))*feather*',
 'if(plumeMode>.5){','if(useFlipbook>.5){','setSmokeMode(next)'
])assert.ok(bridge.includes(token),'RC45 smoke bridge missing: '+token);
assert.ok(combustion.includes('const counts=[3,6,5,1];'),'GPU pool geometry budgets changed');
assert.ok(combustion.includes('sourceBufferWrites,unchangedSetSkips,unchangedActiveSkips'),'unchanged-state diagnostics missing');
assert.ok(bridge.includes("const proceduralStart=' #if KIND == 0"),'RC48 flame guard missing');
assert.ok(bridge.includes("const proceduralStart=' #elif KIND == 1"),'RC48 smoke guard missing');
assert.equal(bridge.split('if(useFlipbook<=.5){').length-1,2,'RC48 must gate both procedural FBM branches');
assert.equal(bridge.split('patched.replace(proceduralStart').length-1,2,'RC48 shader source substitutions missing');
console.log('RC48 licensed shader gate / RC45 smoke variance / six-sheet GPU budget source contract PASS');
