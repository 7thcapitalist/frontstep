// No Playwright/browser dependency is loaded. All browser interfaces are fakes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,mkdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {attachLocalRoutes,runScenario,digest,probe} from '../browser_qa.mjs';

test('static routing fulfills only verified local files and blocks remote HTTP and WebSocket',async()=>{
  const folder=await mkdtemp(path.join(os.tmpdir(),'frontstep-browser-mock-'));
  try {
    await writeFile(path.join(folder,'index.html'),'Mock fixture');
    let handler,websocket;
    const blocked=[];
    const context={route:async(pattern,callback)=>{handler=callback;},routeWebSocket:async(pattern,callback)=>{websocket=callback;}};
    await attachLocalRoutes(context,folder,blocked);
    let fulfilled,aborted=0;
    const route=url=>({request:()=>({url:()=>url}),fulfill:async value=>{fulfilled=value;},abort:async()=>{aborted++;}});
    await handler(route('http://frontstep.invalid/index.html'));
    assert.equal(fulfilled.status,200);
    assert.equal(fulfilled.body.toString(),'Mock fixture');
    await handler(route('https://example.invalid/model'));
    await handler(route('http://frontstep.invalid/missing.png'));
    let closed=false;
    websocket({close:()=>{closed=true;}});
    assert.equal(aborted,2);
    assert.equal(closed,true);
    assert.equal(blocked.length,3);
    assert.match(await digest(folder),/^[a-f0-9]{64}$/);
  } finally {await rm(folder,{recursive:true,force:true});}
});

test('feature scenario uses whitelisted browser actions and checks the observable result',async()=>{
  const actions=[];
  const control={first(){return this;},fill:async value=>actions.push(['fill',value]),click:async()=>actions.push(['click']),
    innerText:async()=>'Mock appointment selected',isVisible:async()=>true};
  const page={locator:selector=>{actions.push(['selector',selector]);return control;}};
  const scenario={steps:[{action:'fill',selector:'#name',value:'Mock'},{action:'click',selector:'#book'}],
    assertions:[{kind:'text',selector:'#result',includes:'selected'}]};
  assert.equal(await runScenario(page,scenario),true);
  assert.equal(actions.filter(a=>a[0]==='click').length,1);
  assert.equal(await runScenario(page,{steps:[{action:'evaluate',selector:'body'}],assertions:[]}),false);
  assert.equal(await runScenario(page,null),false);
  assert.equal(await runScenario(page,{steps:[],assertions:[{kind:'text',selector:'#result',equals:'wrong'}]}),false);
});

test('complete probe orchestrates desktop, mobile, reduced motion and no-JS using a fake browser',async()=>{
  const folder=await mkdtemp(path.join(os.tmpdir(),'frontstep-probe-mock-'));
  const options=[];
  let closed=false;
  try {
    const root=path.join(folder,'public');
    await mkdir(root);
    await writeFile(path.join(root,'index.html'),'Mock fixture');
    const control={first(){return this;},isVisible:async()=>true};
    const page={on(){},goto:async()=>{},reload:async()=>{},waitForTimeout:async()=>{},emulateMedia:async()=>{},
      locator:()=>control,
      evaluate:async(fn,arg)=> typeof arg==='object' && arg!==null ?
        Object.fromEntries(['document','layout','photos','accessibility','feature','typography','links','slots'].map(k=>[k,true])) : undefined,
      screenshot:async({path:file})=>writeFile(file,Buffer.from('SIMULATED_SCREENSHOT'))};
    const browser={newContext:async settings=>{options.push(settings);return {
      route:async()=>{},routeWebSocket:async()=>{},newPage:async()=>page,on(){},close:async()=>{}
    };},close:async()=>{closed=true;}};
    const chromium={launch:async()=>browser};
    const report=await probe({root,out:path.join(folder,'qa'),brief:{premium_feature:'agendamento',
      qa_scenario:{steps:[],assertions:[{kind:'visible',selector:'#result'}]}}},chromium);
    assert.equal(report.completed,true);
    assert.equal(report.checks.every(c=>c.passed),true);
    assert.equal(options.length,4);
    assert.equal(options.filter(o=>o.javaScriptEnabled===false).length,2);
    assert.equal(Object.keys(report.screenshots).length,4);
    assert.equal(closed,true);
  } finally {await rm(folder,{recursive:true,force:true});}
});
