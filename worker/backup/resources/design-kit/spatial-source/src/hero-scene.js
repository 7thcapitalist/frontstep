import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// One original modular sculpture: a continuous knot becomes an ascending terrain.
// Instances share geometry and three physical materials, including in the shadow pass.
export function mountHeroScene({canvas,container=canvas.parentElement,onReady,colors={},stateBuilder}) {
  const palette={ground:'#e8edf5',accent:'#2348ff',ceramic:'#fcfdff',metal:'#a9b7d0',...colors};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const resources=[],events=[],meshes=[],parts=[];
  let renderer,pmrem,environment,room,observer,resizeObserver,raf=0;
  let disposed=false,visible=true,time=0,last=0,progress=0,targetProgress=0,drag=0,dragBase=0,downX=0,dragging=false;
  const pointer=new THREE.Vector2(),smoothPointer=new THREE.Vector2();
  const scene=new THREE.Scene();scene.background=new THREE.Color(palette.ground);scene.fog=new THREE.Fog(palette.ground,24,55);
  const camera=new THREE.PerspectiveCamera(34,1,.1,70);
  const rig=new THREE.Group();scene.add(rig);
  const dummy=new THREE.Object3D(),tempPosition=new THREE.Vector3(),tempQuaternion=new THREE.Quaternion();
  const axisX=new THREE.Vector3(1,0,0),up=new THREE.Vector3(0,1,0);
  const own=r=>(resources.push(r),r);
  const listen=(el,type,fn,options)=>{el.addEventListener(type,fn,options);events.push(()=>el.removeEventListener(type,fn,options));};
  const clamp=THREE.MathUtils.clamp,lerp=THREE.MathUtils.lerp;
  const ease=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
  const knot=t=>new THREE.Vector3((2.05+.78*Math.cos(3*t))*Math.cos(2*t),(2.05+.78*Math.cos(3*t))*Math.sin(2*t),1.25*Math.sin(3*t));
  const identity=new THREE.Quaternion();
  function update(dt=1){
    if(disposed)return;
    const k=reduced.matches?1:1-Math.exp(-dt*6);
    progress=lerp(progress,targetProgress,k);smoothPointer.lerp(pointer,k);
    const assemble=ease(.08,.55,progress),open=ease(.58,1,progress);
    const w=container.clientWidth,mobile=w<700;
    const drift=reduced.matches?0:Math.sin(time*.35)*.06;
    rig.position.set(lerp(lerp(mobile?0:3,0,assemble),mobile?0:3.6,open),lerp(lerp(mobile?-1.5:-.4,-.35,assemble),mobile?-2:-.35,open),0);
    rig.scale.setScalar(mobile?lerp(1,.68,open):1);
    rig.rotation.set(lerp(.12,-.1,assemble)+smoothPointer.y*.05,lerp(-.5,-.65,assemble)+smoothPointer.x*.16+drag,lerp(-.16,.1,assemble)+drift);
    parts.forEach(p=>{
      const wave=reduced.matches?0:Math.sin(time*.7+p.t*2)*.045*(1-assemble);
      tempPosition.copy(p.flow);tempPosition.y+=wave;
      tempPosition.lerp(p.step,assemble).lerp(p.burst,open);
      tempQuaternion.copy(p.flowQ).slerp(identity,assemble).slerp(p.burstQ,open);
      dummy.position.copy(tempPosition);dummy.quaternion.copy(tempQuaternion);
      const pulse=1+Math.sin(time*.6+p.t)*.025*(1-assemble)*(reduced.matches?0:1);
      dummy.scale.set(pulse,lerp(1,1.1,assemble),lerp(1,.8,assemble));dummy.updateMatrix();
      p.mesh.setMatrixAt(p.slot,dummy.matrix);
    });
    meshes.forEach(mesh=>{mesh.instanceMatrix.needsUpdate=true;});
    const distance=mobile?Math.max(15,11.2/camera.aspect):lerp(15.1,14.2,assemble);
    camera.position.set(lerp(0,1.5,assemble)+smoothPointer.x*.3,lerp(2.1,5.3,assemble)+smoothPointer.y*.15,lerp(distance,distance+1.2,open));
    camera.lookAt(0,mobile?-.35:0,0);camera.updateMatrixWorld();
    if(renderer){renderer.render(scene,camera);canvas.dataset.progress=progress.toFixed(3);}
  }
  function tick(now){raf=0;if(disposed||!visible||document.hidden)return;
    const dt=Math.min((now-(last||now))/1000,.05);last=now;time+=dt;update(dt);
    if(!reduced.matches)raf=requestAnimationFrame(tick);
  }
  function stop(){cancelAnimationFrame(raf);raf=0;last=0;}
  function start(){if(!disposed&&visible&&!document.hidden&&!raf&&!reduced.matches)raf=requestAnimationFrame(tick);}
  function resize(){if(!renderer||disposed)return;const w=Math.max(1,container.clientWidth),h=Math.max(1,container.clientHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,w<700?1.3:1.5));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();update();}
  function destroy(){if(disposed)return;disposed=true;stop();observer?.disconnect();resizeObserver?.disconnect();events.forEach(fn=>fn());resources.forEach(r=>r.dispose?.());environment?.dispose();pmrem?.dispose();room?.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});renderer?.dispose();renderer?.forceContextLoss();}
  try {
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    room=new RoomEnvironment();pmrem=new THREE.PMREMGenerator(renderer);environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;
    scene.add(new THREE.HemisphereLight('#ffffff','#9aa8c6',2.1));
    const key=new THREE.DirectionalLight('#ffffff',4);key.position.set(-5,9,6);key.castShadow=true;
    key.shadow.mapSize.set(1536,1536);Object.assign(key.shadow.camera,{left:-10,right:10,top:10,bottom:-10,near:1,far:35});key.shadow.bias=-.0006;key.shadow.normalBias=.04;key.shadow.radius=4;scene.add(key);
    const fill=new THREE.DirectionalLight('#9cb4ff',3);fill.position.set(5,3,-5);scene.add(fill);
    const blue=own(new THREE.MeshPhysicalMaterial({color:palette.accent,metalness:.7,roughness:.16,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:1.45}));
    const white=own(new THREE.MeshPhysicalMaterial({color:palette.ceramic,metalness:.06,roughness:.24,clearcoat:.8,envMapIntensity:1.1}));
    const chrome=own(new THREE.MeshPhysicalMaterial({color:palette.metal,metalness:1,roughness:.12,envMapIntensity:1.65}));
    const geometry=own(new RoundedBoxGeometry(.54,.52,1.05,3,.2));
    const buckets=[[],[],[]];
    for(let i=0;i<48;i++)for(let lane=0;lane<3;lane++){
      const t=i/48*Math.PI*2;
      const pos=knot(t),tangent=knot(t+.001).sub(pos).normalize();
      const radial=pos.clone().normalize();
      const normal=new THREE.Vector3().crossVectors(tangent,radial).normalize();
      pos.addScaledVector(normal,(lane-1)*.63);
      const flowQ=new THREE.Quaternion().setFromUnitVectors(axisX,tangent);
      const n=i*3+lane,col=n%12,row=Math.floor(n/12);
      const step=new THREE.Vector3((col-5.5)*.6,(Math.floor(col/2)-2.5)*.62,(row-5.5)*.61);
      // Radial release stays composed around a clear opening in the center.
      const angle=n/144*Math.PI*2,radius=4.1+(n%7)*.22;
      const burst=new THREE.Vector3(Math.cos(angle)*radius,Math.sin(angle)*radius*.72,(n%9-4)*.46);
      const burstQ=new THREE.Quaternion().setFromEuler(new THREE.Euler((n%5)*.2,angle*.3,angle));
      const materialIndex=(i+lane*3)%11<5?0:(i+lane)%4===0?2:1;
      if(stateBuilder){
        const custom=stateBuilder({index:n,count:144,lane,t});
        for(const [key,vector] of [['flow',pos],['assembled',step],['expanded',burst]])if(custom?.[key])vector.fromArray(custom[key]);
        if(custom?.flowRotation)flowQ.setFromEuler(new THREE.Euler(...custom.flowRotation));
        if(custom?.expandedRotation)burstQ.setFromEuler(new THREE.Euler(...custom.expandedRotation));
      }
      buckets[materialIndex].push({t,flow:pos,flowQ,step,burst,burstQ});
    }
    [blue,white,chrome].forEach((material,i)=>{
      const mesh=new THREE.InstancedMesh(geometry,material,buckets[i].length);mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);rig.add(mesh);meshes.push(mesh);own(mesh);
      buckets[i].forEach((p,slot)=>parts.push({...p,mesh,slot}));
    });
    // A continuous ground and real shadow anchor the sculpture in its environment.
    const ground=new THREE.Mesh(own(new THREE.PlaneGeometry(200,200)),own(new THREE.MeshStandardMaterial({color:palette.ground,roughness:.8,metalness:.03})));
    ground.rotation.x=-Math.PI/2;ground.position.y=-4.2;ground.receiveShadow=true;scene.add(ground);
    resizeObserver=new ResizeObserver(resize);resizeObserver.observe(container);
    observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible){update();start();}else stop();});observer.observe(container);
    listen(container,'pointermove',e=>{if(reduced.matches)return;const b=container.getBoundingClientRect();pointer.set((e.clientX-b.left)/b.width*2-1,-((e.clientY-b.top)/b.height*2-1));if(dragging)drag=clamp(dragBase+(e.clientX-downX)*.004,-.6,.6);},{passive:true});
    listen(canvas,'pointerdown',e=>{if(reduced.matches||e.pointerType==='touch')return;dragging=true;downX=e.clientX;dragBase=drag;canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';});
    listen(canvas,'pointerup',()=>{dragging=false;canvas.style.cursor='grab';});listen(canvas,'pointercancel',()=>{dragging=false;});
    listen(container,'pointerleave',()=>pointer.set(0,0));
    listen(document,'visibilitychange',()=>document.hidden?stop():start());
    listen(reduced,'change',()=>{if(reduced.matches){stop();pointer.set(0,0);drag=0;update();}else start();});
    resize();container.classList.add('is-ready');onReady?.();start();
    return {setProgress(value){if(disposed)return;targetProgress=clamp(value,0,1);if(reduced.matches||!visible){progress=targetProgress;update();}},destroy,getState(){return {progress,instances:parts.length,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};}};
  }catch(error){container.dataset.sceneFallback='true';destroy();return {setProgress(){},destroy(){},getState(){return {fallback:true};}};}
}

// The optional builder runtime exposes the same tested implementation and custom states.
export { mountHeroScene as mountKineticSculpture };
