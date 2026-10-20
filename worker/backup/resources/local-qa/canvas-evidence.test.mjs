import test from 'node:test';
import assert from 'node:assert/strict';
import {canvasDifference,assessCanvas} from './canvas-evidence.mjs';
const sample=value=>({captured:true,pixels:Array.from({length:100},()=>[value,value,value,255]).flat()});
test('static or unrendered canvases cannot pass rendered-change evidence',()=>{
  assert.equal(assessCanvas([sample(100),sample(100),sample(100)],sample(100)).hasRenderedChange,false);
  assert.equal(assessCanvas([{captured:false},{captured:false},{captured:false}],{captured:false}).hasRenderedChange,false);
  assert.equal(canvasDifference({captured:false},sample(1)).comparable,false);
});
test('state changes must exceed idle movement at both later states',()=>{
  assert.equal(assessCanvas([sample(10),sample(60),sample(160)],sample(11)).hasRenderedChange,true);
  assert.equal(assessCanvas([sample(10),sample(12),sample(13)],sample(12)).hasRenderedChange,false);
  assert.equal(assessCanvas([sample(10),sample(60),sample(10)],sample(10)).hasRenderedChange,false);
});
