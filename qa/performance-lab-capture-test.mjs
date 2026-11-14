// Deterministic diagnostic regression, not a hardware FPS measurement.
import assert from 'node:assert/strict';
import {createPerformanceLab} from '../src/core/performance-lab.js';
const lab=createPerformanceLab({now:()=>Date.UTC(2026,10,13)});
lab.begin('Windows 60s heavy-destruction diagnostic',60,{wave:7});
assert.equal(lab.progress().target,60);
for(let i=0;i<43;i++)lab.record({dt:1,drawCalls:300,simMs:2,renderMs:9});
lab.record({dt:16,drawCalls:450,simMs:4,renderMs:20});
assert.ok(lab.progress(),'59 seconds must not prematurely finish capture');
lab.record({dt:1,drawCalls:450,simMs:4,renderMs:20});
assert.equal(lab.progress(),null);
const s=lab.captures()[0].summary;
assert.equal(s.seconds,60);assert.equal(s.maxFrameMs,16000);
assert.equal(s.frames,45);assert.equal(s.stalls100ms,45);assert.equal(s.fps,.8);
assert.match(lab.export().caveat,/GPU time is not measured/);
lab.begin('bounded capture',120);assert.equal(lab.progress().target,60);
console.log('60-second capture and unclipped 16-second stall PASS');
