// Read the canvas itself, so an HTML heading moving over a static canvas cannot pass.
export async function sampleCanvas(page,selector='[data-spatial-canvas]') {
  let sample;
  for(let attempt=1;attempt<=12;attempt++){
    sample=await readCanvasFrame(page,selector);
    if(sample.captured || !sample.pixels)return {...sample,captureAttempts:attempt};
  }
  return {...sample,captureAttempts:12};
}

// Retry cleared buffers only; missing, hidden or tainted canvases fail immediately.
async function readCanvasFrame(page,selector) {
  return page.evaluate(async selector=>{
    const canvas=document.querySelector(selector);
    if(!canvas)return {captured:false,reason:'No marked spatial canvas'};
    const rect=canvas.getBoundingClientRect();
    if(!canvas.width||!canvas.height||rect.bottom<=0||rect.top>=innerHeight)return {captured:false,reason:'Canvas is empty or outside viewport'};
    return new Promise(resolve=>requestAnimationFrame(()=>{
      try{
        const copy=document.createElement('canvas');copy.width=copy.height=40;
        const ctx=copy.getContext('2d',{willReadFrequently:true});
        ctx.drawImage(canvas,0,0,40,40);
        const pixels=Array.from(ctx.getImageData(0,0,40,40).data);
        const opaque=pixels.filter((_,i)=>i%4===3&&pixels[i]>0).length;
        resolve({captured:opaque>0,width:canvas.width,height:canvas.height,opaqueSamples:opaque,pixels});
      }catch(error){resolve({captured:false,reason:error.message});}
    }));
  },selector);
}

export function canvasDifference(a,b) {
  if(!a.captured||!b.captured||a.pixels.length!==b.pixels.length)return {comparable:false};
  let sum=0,changed=0;
  for(let i=0;i<a.pixels.length;i+=4){
    const delta=(Math.abs(a.pixels[i]-b.pixels[i])+Math.abs(a.pixels[i+1]-b.pixels[i+1])+Math.abs(a.pixels[i+2]-b.pixels[i+2]))/3;
    sum+=delta;if(delta>10)changed++;
  }
  const count=a.pixels.length/4;
  return {comparable:true,meanDelta:Number((sum/count).toFixed(3)),changedFraction:Number((changed/count).toFixed(4))};
}

export function assessCanvas(samples,idle) {
  const baseline=canvasDifference(samples[0]||{},idle||{});
  const comparisons=samples.slice(1).map((sample,i)=>({from:0,to:i+1,...canvasDifference(samples[0],sample)}));
  const threshold={meanDelta:Math.max(2,(baseline.meanDelta||0)*1.5+1),changedFraction:Math.max(.025,(baseline.changedFraction||0)*1.5+.01)};
  return {
    measurement:'40×40 RGBA samples read from the actual canvas inside requestAnimationFrame, excluding HTML overlays; changes must exceed idle baseline.',
    capturedFrames:samples.filter(sample=>sample.captured).length,
    hasRenderedChange:samples.length>=3&&samples.every(sample=>sample.captured)&&comparisons.every(diff=>diff.comparable&&diff.meanDelta>=threshold.meanDelta&&diff.changedFraction>=threshold.changedFraction),
    baseline,threshold,comparisons,
    samples:samples.map(({pixels,...metadata})=>metadata),
    limitation:'Pixel changes do not establish aesthetic quality, smoothness or genuine 3D. Inspect source and storyboard. Tainted or unrendered canvases require repair.'
  };
}
