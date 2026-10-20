import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// Optional recipe: three articulated page panels, not a general-purpose scene engine.
// Use only when a physical page belongs to the brief. Content and photo are caller-owned.
export async function mountPageScene({canvas,container=canvas?.parentElement,onReady,photoUrl,paintPage,fontRequests=[],colors={}}={}) {
  if(!canvas || !container)throw new TypeError('canvas and container are required');
  if(typeof photoUrl!=='string' || !photoUrl.trim())throw new TypeError('A local photoUrl is required');
  if(typeof paintPage!=='function')throw new TypeError('paintPage callback is required');
  if(!Array.isArray(fontRequests) || fontRequests.some(font=>typeof font!=='string'))throw new TypeError('fontRequests must be CSS font request strings');
  const url=new URL(photoUrl,document.baseURI),base=new URL(document.baseURI);
  const local=base.protocol==='file:' ? url.protocol==='file:' : /^(http:|https:)$/.test(url.protocol)&&url.origin===base.origin;
  if(!local || url.username || url.password)throw new TypeError('photoUrl must be a same-origin local asset');
  const palette={sky:'#f4f4f4',ground:'#333333',key:'#ffffff',fill:'#dddddd',edge:'#dddddd',shadow:'rgba(24,24,24,.42)',...colors};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const resources=[],removers=[],panels=[];
  let renderer,environment,pmrem,room,intersection,resizeObserver,raf=0,last=0;
  let disposed=false,visible=true,progress=0,target=0,frames=0,software=false;
  const pointer=new THREE.Vector2(),smoothedPointer=new THREE.Vector2();
  const own=value=>(resources.push(value),value);
  const listen=(el,type,handler,options)=>{el.addEventListener(type,handler,options);removers.push(()=>el.removeEventListener(type,handler,options));};
  const mix=THREE.MathUtils.lerp,clamp=THREE.MathUtils.clamp;
  const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
  const scene=new THREE.Scene(),rig=new THREE.Group();scene.add(rig);
  const camera=new THREE.PerspectiveCamera(34,1,.1,60);
  const portrait=new Image();
  portrait.src=url.href;
  const destroy=()=>{
    if(disposed)return;disposed=true;cancelAnimationFrame(raf);raf=0;
    intersection?.disconnect();resizeObserver?.disconnect();removers.forEach(remove=>remove());
    resources.forEach(resource=>resource.dispose?.());environment?.dispose();pmrem?.dispose();
    room?.traverse(object=>{object.geometry?.dispose();if(Array.isArray(object.material))object.material.forEach(material=>material.dispose());else object.material?.dispose();});
    renderer?.dispose();renderer?.forceContextLoss();
  };
  try{
    await Promise.all([portrait.decode(),...fontRequests.map(request=>document.fonts.load(request))]);
    if(disposed)return {setProgress(){},destroy,getState:()=>({fallback:true})};
    const glContext=canvas.getContext('webgl2',{alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
    if(!glContext)throw new Error('WebGL is unavailable');
    renderer=new THREE.WebGLRenderer({canvas,context:glContext,alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
    const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');
    software=!!debug&&/swiftshader|llvmpipe|softpipe|software|basic render/i.test(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL));
    canvas.dataset.renderQuality=software?'economical':'full';
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
    renderer.setClearColor(0x000000,0);
    room=new RoomEnvironment();pmrem=new THREE.PMREMGenerator(renderer);environment=pmrem.fromScene(room,.04,.1,100,{size:software?64:128});scene.environment=environment.texture;
    scene.add(new THREE.HemisphereLight(palette.sky,palette.ground,2.2));
    const key=new THREE.DirectionalLight(palette.key,3.1);key.position.set(-5,7,9);scene.add(key);
    const fill=new THREE.DirectionalLight(palette.fill,1.8);fill.position.set(6,-2,4);scene.add(fill);

    const sheet=document.createElement('canvas');sheet.width=1792;sheet.height=1408;
    const context=sheet.getContext('2d'),W=sheet.width,H=sheet.height;
    if(!context)throw new Error('2D texture context is unavailable');
    // Painted text belongs to the opening only: progress .36–.59 dissolves this
    // texture into the clean local image. The caller must continue text/actions in DOM.
    await paintPage({canvas:sheet,context,photo:portrait,width:W,height:H});
    if(disposed)return {setProgress(){},destroy,getState:()=>({fallback:true,disposed:true})};
    const texture=own(new THREE.CanvasTexture(sheet));texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    const cleanSheet=document.createElement('canvas');cleanSheet.width=W;cleanSheet.height=H;
    const cleanContext=cleanSheet.getContext('2d'),photoScale=Math.max(W/portrait.naturalWidth,H/portrait.naturalHeight);
    cleanContext.drawImage(portrait,(W-portrait.naturalWidth*photoScale)/2,(H-portrait.naturalHeight*photoScale)/2,portrait.naturalWidth*photoScale,portrait.naturalHeight*photoScale);
    const cleanTexture=own(new THREE.CanvasTexture(cleanSheet));cleanTexture.colorSpace=THREE.SRGBColorSpace;cleanTexture.anisotropy=texture.anisotropy;
    const reveal={value:0};
    const width=8.4,height=6.6,partHeight=height/3,thickness=.045;
    const edge=own(new THREE.MeshStandardMaterial({color:palette.edge,roughness:.27,metalness:.35,envMapIntensity:.8}));
    for(let i=0;i<3;i++){
      const map=own(texture.clone());map.repeat.set(1,1/3);map.offset.set(0,1-(i+1)/3);map.needsUpdate=true;
      // Preserve photographic color; the ceramic edge/back carry the physical light.
      const front=own(new THREE.MeshBasicMaterial({map,toneMapped:false}));
      front.onBeforeCompile=shader=>{
        shader.uniforms.uClean={value:cleanTexture};shader.uniforms.uReveal=reveal;
        shader.fragmentShader='uniform sampler2D uClean; uniform float uReveal;\n'+shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
          vec4 pageColor=texture2D(map,vMapUv);
          vec4 photoColor=texture2D(uClean,vMapUv);
          diffuseColor*=mix(pageColor,photoColor,uReveal);
        #endif`);
      };
      const group=new THREE.Group(),geometry=own(new THREE.BoxGeometry(width,partHeight,thickness));
      const panel=new THREE.Mesh(geometry,edge);
      const artwork=new THREE.Mesh(own(new THREE.PlaneGeometry(width,partHeight)),front);artwork.position.z=thickness/2+.001;
      if(i===0){group.position.y=partHeight/2;panel.position.y=partHeight/2;}
      if(i===2){group.position.y=-partHeight/2;panel.position.y=-partHeight/2;}
      artwork.position.y=panel.position.y;group.add(panel,artwork);rig.add(group);panels.push(group);
    }
    const shadowSheet=document.createElement('canvas');shadowSheet.width=shadowSheet.height=128;
    const s=shadowSheet.getContext('2d'),gradient=s.createRadialGradient(64,64,8,64,64,64);gradient.addColorStop(0,palette.shadow);gradient.addColorStop(1,'rgba(0,0,0,0)');s.fillStyle=gradient;s.fillRect(0,0,128,128);
    const shadow=new THREE.Mesh(own(new THREE.PlaneGeometry(13,6)),own(new THREE.MeshBasicMaterial({map:own(new THREE.CanvasTexture(shadowSheet)),transparent:true,depthWrite:false})));shadow.position.set(2,-4.3,-1);shadow.rotation.x=-1.22;scene.add(shadow);

    // This page recipe fits its six panel/front meshes, not the decorative shadow.
    // 0.88 means the dominant projected span occupies 88% of the canvas.
    const frameFill=.88,fitPoint=new THREE.Vector3();let frameBounds;
    function projectedBounds(){
      rig.updateWorldMatrix(true,true);camera.updateMatrixWorld(true);
      let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
      rig.traverse(mesh=>{if(!mesh.geometry)return;
        if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();
        const {min,max}=mesh.geometry.boundingBox;
        for(const x of [min.x,max.x])for(const y of [min.y,max.y])for(const z of [min.z,max.z]){
          fitPoint.set(x,y,z).applyMatrix4(mesh.matrixWorld).project(camera);
          minX=Math.min(minX,fitPoint.x);maxX=Math.max(maxX,fitPoint.x);minY=Math.min(minY,fitPoint.y);maxY=Math.max(maxY,fitPoint.y);
        }
      });return {minX,maxX,minY,maxY};
    }
    function draw(dt=1){
      if(disposed)return;
      const k=reduced.matches?1:1-Math.exp(-dt*11);progress=mix(progress,target,k);smoothedPointer.lerp(pointer,k);
      const p=reduced.matches?0:progress,fold=Math.sin(p*Math.PI),open=smooth(.6,1,p);
      reveal.value=smooth(.36,.59,p);
      const mobile=container.clientWidth<=540,tablet=container.clientWidth<=900&&!mobile;
      panels[0].rotation.x=mix(.5,0,open)+fold*.6;panels[2].rotation.x=mix(-.4,0,open)-fold*.65;
      panels.forEach((group,i)=>{const face=group.children[1].material,light=i===1?1:1-Math.abs(group.rotation.x)*.15;face.color.setRGB(light,light,light);});
      rig.rotation.set(mix(-.1,0,open)+smoothedPointer.y*.025,mix(-.42,.025,open)+smoothedPointer.x*.035,mix(-.17,0,open));
      camera.position.set(0,0,mobile?14.1:14.5);camera.lookAt(0,0,0);
      rig.position.set(0,0,0);rig.scale.setScalar(1);
      const halfHeight=camera.position.z*Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
      for(let pass=0;pass<5;pass++){
        const b=projectedBounds(),halfSpan=Math.max((b.maxX-b.minX)/2,(b.maxY-b.minY)/2);
        rig.position.x-=(b.minX+b.maxX)/2*halfHeight*camera.aspect;
        rig.position.y-=(b.minY+b.maxY)/2*halfHeight;
        rig.scale.multiplyScalar(frameFill/halfSpan);
      }
      const fittedScale=rig.scale.x,fittedX=rig.position.x,fittedY=rig.position.y;
      // Expansion intentionally becomes a cropped image after painted text dissolves.
      rig.scale.setScalar(mix(fittedScale,mobile?1.45:tablet?1.8:2.1,open));
      rig.position.set(mix(fittedX,0,open),mix(fittedY,0,open),mix(0,1.4,open));
      frameBounds=projectedBounds();
      shadow.material.opacity=1-open*.65;shadow.scale.setScalar(mobile?.5:1);
      canvas.dataset.progress=progress.toFixed(3);canvas.dataset.renderFrames=String(++frames);canvas.dataset.pageFold=fold.toFixed(3);
      renderer.render(scene,camera);canvas.dataset.drawCalls=String(renderer.info.render.calls);canvas.dataset.triangles=String(renderer.info.render.triangles);
    }
    function tick(now){
      raf=0;if(disposed||!visible||document.hidden)return;
      const delta=Math.min((now-(last||now))/1000,.1);last=now;draw(delta||1);
      if(!reduced.matches&&(Math.abs(progress-target)>.0005||smoothedPointer.distanceTo(pointer)>.002))raf=requestAnimationFrame(tick);else last=0;
    }
    const schedule=()=>{if(!disposed&&visible&&!document.hidden&&!raf)raf=requestAnimationFrame(tick);};
    const resize=()=>{if(disposed)return;const w=Math.max(1,container.clientWidth),h=Math.max(1,container.clientHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,software?.8:w<=800?1.25:1.5));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();draw();};
    resizeObserver=new ResizeObserver(resize);resizeObserver.observe(container);
    intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible){last=0;schedule();}else{cancelAnimationFrame(raf);raf=0;}});intersection.observe(container);
    listen(container,'pointermove',event=>{if(reduced.matches||event.pointerType==='touch')return;const box=container.getBoundingClientRect();pointer.set((event.clientX-box.left)/box.width*2-1,-((event.clientY-box.top)/box.height*2-1));schedule();},{passive:true});
    listen(container,'pointerleave',()=>{pointer.set(0,0);schedule();});
    listen(document,'visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else schedule();});
    listen(reduced,'change',()=>{pointer.set(0,0);smoothedPointer.set(0,0);progress=target;draw();schedule();});
    resize();onReady?.();
    return {setProgress(value){if(disposed)return;if(!Number.isFinite(value))return;target=clamp(value,0,1);if(reduced.matches){progress=target;if(visible)draw();}else schedule();},destroy,getState:()=>({fallback:false,disposed,progress,frames,frameBounds,quality:software?'economical':'full',drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles})};
  }catch(error){container.dataset.sceneFallback='true';destroy();return {setProgress(){},destroy(){},getState:()=>({fallback:true})};}
}
