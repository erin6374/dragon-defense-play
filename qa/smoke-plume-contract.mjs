// RC45 bounded smoke-variation source contract, not cinematic approval.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const bridge=readFileSync(new URL('../src/rendering/flipbook-bridge.js',import.meta.url),'utf8');
const combustion=readFileSync(new URL('../src/rendering/building-combustion.js',import.meta.url),'utf8');
for(const token of [
 'float gust=.90+.18*sin(clock*.31+layer*.55+vSeed*.41);',
 'float crosswind=-gust*(.76+.40*fract(vSeed*.193))*pow(vAge,1.42)*3.8;',
 'float ashBlend=smoothstep(.12,.88,vAge);',
 'alpha=frame.a*min(1.,vPower)*(.78+.16*fract(vSeed*.271))*feather*',
 'if(plumeMode>.5){','if(useFlipbook>.5){','setSmokeMode(next)'
])assert.ok(bridge.includes(token),'RC45 smoke bridge missing: '+token);
assert.ok(combustion.includes('const counts=[3,6,5,1];'),'GPU pool geometry budgets changed');
assert.ok(combustion.includes('sourceBufferWrites,unchangedSetSkips,unchangedActiveSkips'),'unchanged-state diagnostics missing');
assert.ok(bridge.includes("const proceduralStart=' #if KIND == 0"),'RC48 flame guard missing');
assert.ok(bridge.includes("const proceduralStart=' #elif KIND == 1"),'RC48 smoke guard missing');
assert.equal(bridge.split('if(useFlipbook<=.5){').length-1,2,'RC48 must gate both procedural FBM branches');
assert.equal(bridge.split('patched.replace(proceduralStart').length-1,2,'RC48 shader source substitutions missing');
for(const token of [
 'float time=clamp(vAge*63.+(fract(vSeed*.317)-.5)*5.,0.,63.);',
 'float lean=(fract(vSeed*.283)-.5)*.12*(q.y-.2);',
 'vec2 uv=clamp(q+vec2(.026*sin(q.y*4.-clock*.18+vSeed)+lean,0.),.014,.986);'
])assert.ok(bridge.includes(token),'RC49 atlas decorrelation missing: '+token);
assert.equal(bridge.split('flipbook(smokeAtlas,uv,time)').length-1,1,'RC49 must preserve one smoke atlas sample');
for(const token of [
 'float sootVariation=.76+.36*fract(vSeed*.413);',
 'float densityShade=mix(1.10,.73,smoothstep(.24,.84,frame.a));',
 'vec3(.033,.032,.031),vec3(.088,.099,.109)'
])assert.ok(bridge.includes(token),'RC50 soot density missing: '+token);
assert.equal(bridge.split('float densityShade=').length-1,1,'RC50 soot shade should run once');
// RC54: the licensed plume alone gains independent texture clocks and asymmetric edges.
for(const token of [
 'time=clock*(5.8+2.4*fract(vSeed*.229))+fract(vSeed*.317)*64.;',
 'float eddy=plumeMode>.5 ? .045*sin(',
 'float edgeWarp=.11*sin(q.y*(7.1+3.4*fract(vSeed*.29))+',
 'float sideBias=(fract(vSeed*.611)-.5)*.20*(q.y-.2);',
 'float feather=1.-smoothstep(.56,.99,abs((q.x-.5)*2.+edgeWarp+sideBias));'
])assert.ok(bridge.includes(token),'RC54 licensed plume missing: '+token);
const fract=x=>x-Math.floor(x);
const rates=Array.from({length:6},(_,i)=>5.8+2.4*fract((13+i*7.13)*.229));
assert.equal(new Set(rates.map(x=>x.toFixed(4))).size,6,'smoke atlas clocks synchronized');
assert.ok(rates.every(x=>x>=5.8&&x<8.2),'smoke atlas rate out of range');
assert.equal(bridge.split('flipbook(smokeAtlas,uv,time)').length-1,1,'extra smoke atlas fetch');
console.log('RC55 turbulent plume edge and RC54 clock source contract PASS');
console.log('RC50 soot density / RC49 smoke decorrelation / RC48 licensed shader gate / RC45 smoke variance / six-sheet GPU budget source contract PASS');
