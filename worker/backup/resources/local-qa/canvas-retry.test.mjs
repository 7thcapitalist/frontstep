import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleCanvas} from './canvas-evidence.mjs';
test('a capped renderer can supply a real frame after cleared buffers',async()=>{
 let calls=0;const page={evaluate:async()=>++calls<3?{captured:false,pixels:[0,0,0,0]}:{captured:true,pixels:[30,60,90,255]}};
 const result=await sampleCanvas(page);assert.equal(result.captured,true);assert.equal(result.captureAttempts,3);assert.deepEqual(result.pixels,[30,60,90,255]);
});
test('permanently cleared buffers still fail after the bounded attempts',async()=>{
 let calls=0;const result=await sampleCanvas({evaluate:async()=>{calls++;return{captured:false,pixels:[0,0,0,0]};}});assert.equal(result.captured,false);assert.equal(calls,12);
});
test('missing or tainted canvas evidence is not retried into a pass',async()=>{
 let calls=0;const result=await sampleCanvas({evaluate:async()=>{calls++;return{captured:false,reason:'No marked spatial canvas'};}});assert.equal(result.captured,false);assert.equal(calls,1);
});
