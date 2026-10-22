import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
document.documentElement.classList.add('js');

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const heroSection = $('#inicio');
heroSection.classList.add('is-enhanced');
let heroScene;
const heroState = {progress:0};
const scenes = {
  food: { brand:'mesa da praça', emblem:'✳', category:'Cozinha que acolhe.', eyebrow:'Sente. Compartilhe. Fique mais.', title:'O melhor<br>da vida é<br><em>à mesa.</em>', description:'Comida de verdade, conversa sem pressa e espaço para mais um.', action:'Conhecer o cardápio', label:'Para dividir bons momentos.', note:'Feito para dar água na boca.', slug:'mesa-da-praca', alt:'Mesa com pratos da culinária brasileira, fotografia de referência', index:1 },
  hospitality: { brand:'recanto', emblem:'↟', category:'Um outro ritmo.', eyebrow:'Onde o caminho encontra a calma.', title:'Deixe a<br>pressa<br><em>lá fora.</em>', description:'Há lugares que convidam a fazer menos. E sentir um pouco mais.', action:'Planejar uma pausa', label:'A paisagem faz o resto.', note:'Um convite para desacelerar.', slug:'recanto-das-pedras', alt:'Paisagem de campo e montanhas, fotografia ilustrativa de Álvaro Julião', index:2 },
  beauty: { brand:'ateliê aurora', emblem:'✧', category:'Beleza no seu tempo.', eyebrow:'Um cuidado que começa por você.', title:'Seu tempo.<br><em>Seu jeito.</em>', description:'Um novo corte. Um pequeno ritual. Um encontro com a sua melhor versão.', action:'Encontrar meu cuidado', label:'O detalhe muda tudo.', note:'Cuidado também é presença.', slug:'atelie-aurora', alt:'Tesouras profissionais de cabeleireiro, fotografia ilustrativa de James Collington', index:3 },
  fitness: { brand:'movimento', emblem:'↗', category:'O corpo pede movimento.', eyebrow:'Encontre o seu ritmo.', title:'Comece.<br>O resto é<br><em>movimento.</em>', description:'Um espaço na sua semana para se sentir mais presente no seu corpo.', action:'Encontrar minha atividade', label:'O seu próximo movimento.', note:'Energia que começa no primeiro clique.', slug:'movimento-bairro', alt:'Tapetes de exercício enrolados em uma prateleira, fotografia ilustrativa', index:4 },
  shop: { brand:'casa do papel', emblem:'✽', category:'Ideias pedem espaço.', eyebrow:'Abra espaço para criar.', title:'Pequenas<br>coisas.<br><em>Boas ideias.</em>', description:'Para anotar, desenhar, presentear. E tirar aquela ideia do papel.', action:'Explorar a seleção', label:'O começo de alguma coisa boa.', note:'Uma vitrine com personalidade.', slug:'casa-do-papel', alt:'Mãos, cadernos e materiais de papelaria coloridos, fotografia ilustrativa', index:5 },
  industry: { brand:'metal linha', emblem:'⌑', category:'Precisão em cada etapa.', eyebrow:'Da especificação à execução.', title:'Seu projeto.<br>Nossa<br><em>precisão.</em>', description:'O primeiro passo de um bom projeto é entender exatamente o que você precisa.', action:'Preparar uma solicitação', label:'Cada detalhe tem uma função.', note:'Clareza para começar o próximo projeto.', slug:'metal-linha', alt:'Detalhe de ferramenta em máquina industrial, fotografia ilustrativa de Harold Granados', index:6 }
};
const panel = $('#scene-panel');
const sceneShell = document.createElement('div');
sceneShell.className = 'scene-shell';
panel.before(sceneShell); sceneShell.append(panel);
let activeScene = 'food';
let sceneTimeline;
let sceneRequest = 0;
let paper;
let paperOpen = false;
let paperColor = '#3155ff';
let paperNote = '';
let inspiration = '';
const sceneNiches = {food:'Restaurante',hospitality:'Hospedagem',beauty:'Beleza',fitness:'Fitness',shop:'Loja',industry:'Indústria'};
async function startPaper() {
  try {
    const {mountPaperScene} = await import('./paper-scene.js');
    if(activeScene !== 'shop' || paper) return;
    paper = mountPaperScene({canvas:$('.paper-canvas',panel),container:$('.scene-image',panel),onReady:()=>{
      $('.scene-image',panel).dataset.paperReady = 'true';
      $('.paper-controls',panel).hidden = false;
      $('#scene-photo').setAttribute('aria-hidden','true');
      $('.paper-canvas',panel).setAttribute('aria-hidden','false');
      $('.paper-canvas',panel).setAttribute('role','img');
      $('.paper-canvas',panel).setAttribute('aria-label','Caderno ilustrativo em 3D. Use os controles para abrir a capa e mudar sua cor.');
    }});
    paper.setColor(paperColor); paper.setOpen(paperOpen); paper.setNote(paperNote);
  } catch { /* Keep the real photograph and full concept link if WebGL is unavailable. */ }
}
$$('[data-paper-color]',panel).forEach(button=>button.addEventListener('click',()=>{
  paperColor = button.dataset.paperColor;
  $$('[data-paper-color]',panel).forEach(swatch=>swatch.setAttribute('aria-pressed',swatch===button));
  paper?.setColor(paperColor);
}));
$('#paper-open').addEventListener('click',event=>{
  paperOpen = !paperOpen; paper?.setOpen(paperOpen);
  event.currentTarget.setAttribute('aria-pressed',paperOpen);
  event.currentTarget.innerHTML = `${paperOpen?'Fechar':'Abrir'} caderno <span aria-hidden="true">${paperOpen?'−':'+'}</span>`;
});

$('#paper-note').addEventListener('input', event => {
  paperNote = event.target.value; paper?.setNote(paperNote);
  paperOpen = true; paper?.setOpen(true);
  $('#paper-open').setAttribute('aria-pressed','true');
  $('#paper-open').innerHTML = 'Fechar caderno <span aria-hidden="true">−</span>';
});

function tabKeys(buttons, activate, orientation = 'horizontal') {
  buttons.forEach((button, index) => button.addEventListener('keydown', event => {
    if(event.ctrlKey || event.metaKey || event.altKey) return;
    const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
    const prevKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
    let next;
    if(event.key === nextKey) next = (index + 1) % buttons.length;
    else if(event.key === prevKey) next = (index - 1 + buttons.length) % buttons.length;
    else if(event.key === 'Home') next = 0;
    else if(event.key === 'End') next = buttons.length - 1;
    else return;
    event.preventDefault(); buttons[next].focus(); activate(buttons[next], true);
  }));
}

async function selectScene(button, keyboard = false) {
  const key = button.dataset.scene;
  if(key === activeScene) return;
  const request = ++sceneRequest;
  const scene = scenes[key];
  const photo = new Image(); photo.src = `./media/${key}.jpg`;
  try { await photo.decode(); } catch { /* Image fallback remains accessible via alt text. */ }
  if(request !== sceneRequest) return;
  activeScene = key;
  $$('.studio-tabs button').forEach(tab => { const selected = tab === button; tab.setAttribute('aria-selected', selected); tab.tabIndex = selected ? 0 : -1; });
  panel.setAttribute('aria-labelledby', button.id);
  sceneTimeline?.kill();
  $('.scene-transition-ghost')?.remove();
  gsap.set(['.scene-copy','.scene-image'], {clearProps:'opacity,transform,clipPath'});
  let ghost;
  if(!reduced.matches && !keyboard) {
    ghost = panel.cloneNode(true);
    ghost.removeAttribute('id'); ghost.removeAttribute('role'); ghost.removeAttribute('aria-labelledby'); ghost.removeAttribute('tabindex');
    ghost.setAttribute('aria-hidden','true'); ghost.inert = true;
    $$('[id]',ghost).forEach(node => node.removeAttribute('id'));
    ghost.classList.add('scene-transition-ghost');
    if(paper?.snapshot && $('.scene-image',panel).dataset.paperReady) {
      const snapshot = paper.snapshot();
      if(snapshot) {
        const frozen = new Image(); frozen.src = snapshot; frozen.alt = ''; frozen.style.opacity = '1'; frozen.style.objectFit = 'contain'; frozen.style.zIndex = '1';
        $('.paper-canvas',ghost).replaceWith(frozen);
      } else { delete $('.scene-image',ghost).dataset.paperReady; }
    }
    sceneShell.append(ghost);
  }
  const update = () => {
    if(paper) {
      paper.destroy();
      const usedCanvas = $('.paper-canvas',panel);
      usedCanvas.replaceWith(usedCanvas.cloneNode(false));
      paper = undefined;
    }
    delete $('.scene-image',panel).dataset.paperReady;
    $('.paper-controls',panel).hidden = true;
    $('#scene-photo').removeAttribute('aria-hidden');
    $('.paper-canvas',panel).setAttribute('aria-hidden','true');
    panel.className = `scene-panel scene-${key}`;
    $('#scene-brand').textContent = scene.brand;
    const emblem = document.createElement('span'); emblem.className = 'scene-emblem'; emblem.setAttribute('aria-hidden','true'); emblem.textContent = scene.emblem; $('#scene-brand').append(emblem);
    $('#scene-category').textContent = scene.category;
    $('#scene-eyebrow').textContent = scene.eyebrow;
    $('#scene-title').innerHTML = scene.title.replaceAll('<br>', ' <br>');
    $('#scene-description').textContent = scene.description;
    $('#scene-cta').innerHTML = `${scene.action} <span aria-hidden="true">↗</span>`;
    $('#scene-photo').src = photo.src; $('#scene-photo').alt = scene.alt;
    $('#scene-photo-label').textContent = scene.label;
    $('#scene-bottom-note').textContent = scene.note;
    $('#scene-index').textContent = `0${scene.index} / 06`;
    $('#scene-cta').href = $('#scene-open').href = `./demos/${scene.slug}/`;
    $('#scene-open').setAttribute('aria-label',`Abrir conceito completo ${scene.brand} em nova aba`);
    if(key === 'shop') startPaper();
  };
  update();
  if(!ghost) return;
  // Keep the entire previous composition visible while the new world opens.
  // No empty background or hidden content between two complete scenes.
  sceneTimeline = gsap.timeline({onComplete:()=>ghost.remove()})
    .to(ghost,{clipPath:'inset(0 100% 0 0)',duration:.65,ease:'power3.inOut'},0)
    .fromTo($('.scene-copy',panel),{x:20},{x:0,duration:.65,ease:'power3.out',clearProps:'transform'},.1);
}
const sceneTabs = $$('.studio-tabs button');
sceneTabs.forEach(button => button.addEventListener('click', () => selectScene(button)));
tabKeys(sceneTabs,selectScene);

$('.credit-trigger').addEventListener('click', event => { const button = event.currentTarget; const open = button.getAttribute('aria-expanded') !== 'true'; button.setAttribute('aria-expanded',open); $('#photo-credits').hidden = !open; $('span',button).textContent = open ? '−' : '+'; });

const features = {
  mobile:{caption:'Um site inteiro pensado para caber aqui.', scroll:0},
  contact:{caption:'Do interesse à conversa, com menos passos.', scroll:180},
  info:{caption:'As respostas que seu cliente procura.', scroll:330}
};
function selectFeature(button) {
  const key = button.dataset.feature;
  $$('.feature-tabs button').forEach(tab => { const selected = tab === button; tab.setAttribute('aria-selected',selected); tab.tabIndex = selected ? 0 : -1; });
  $('#phone-panel').setAttribute('aria-labelledby',button.id); $('#phone-panel').dataset.active = key;
  $('#phone-caption').textContent = features[key].caption;
  $('.phone-screen').scrollTo({top:features[key].scroll,behavior:reduced.matches?'instant':'smooth'});
}
const featureTabs = $$('.feature-tabs button');
featureTabs.forEach(button => button.addEventListener('click',() => selectFeature(button)));
tabKeys(featureTabs,selectFeature,'vertical');

const form = $('#brief-form');
$('.form-submit').disabled = false;
function briefText() {
  const data = new FormData(form); const business = String(data.get('business')||'').trim(); const city = String(data.get('city')||'').trim(); const wish = String(data.get('wish')||'').trim();
  return `Olá, Frontstep! Quero uma prévia para meu negócio.\n\nTipo: ${data.get('niche')}${business ? `\nNome: ${business}`:''}${city ? `\nCidade: ${city}`:''}${inspiration ? `\nReferência visual: ${inspiration}`:''}${wish ? `\n\nQuero mostrar: ${wish}`:''}`;
}
function updateBrief() { $('#brief-summary').textContent = briefText(); $('#copy-brief').textContent = 'Copiar'; }
form.addEventListener('input',updateBrief); updateBrief();
function chooseInspiration(key) {
  const option = $$('input[name="niche"]',form).find(input=>input.value===sceneNiches[key]);
  if(option) option.checked = true;
  inspiration = scenes[key].brand;
  $('#brief-inspiration').hidden = false;
  $('#brief-inspiration span').textContent = `Seu ponto de partida: ${inspiration}`;
  updateBrief();
}
$('#concept-brief').addEventListener('click',()=>chooseInspiration(activeScene));
$$('[data-brief-scene]').forEach(link=>link.addEventListener('click',()=>chooseInspiration(link.dataset.briefScene)));
$('#clear-inspiration').addEventListener('click',()=>{
  inspiration = ''; $('#brief-inspiration').hidden = true; updateBrief();
  $('input[name="niche"]:checked',form).focus();
});
$('#copy-brief').addEventListener('click',async () => {
  try { await navigator.clipboard.writeText(briefText()); $('#copy-brief').textContent = 'Copiado'; $('#form-status').textContent = 'Mensagem copiada. Você pode colar na conversa quando quiser.'; }
  catch { const selection = getSelection(); const range = document.createRange(); range.selectNodeContents($('#brief-summary')); selection.removeAllRanges(); selection.addRange(range); $('#form-status').textContent = 'Selecione e copie a mensagem acima para levar à conversa.'; }
});
form.addEventListener('submit',event => {
  event.preventDefault();
  if(!form.reportValidity()) return;
  const url = `https://wa.me/5511927415278?text=${encodeURIComponent(briefText())}`;
  window.open(url,'_blank','noopener,noreferrer');
  $('#form-status').textContent = 'Continue na aba do WhatsApp para revisar e enviar sua mensagem.';
});

const mm = gsap.matchMedia();
mm.add('(prefers-reduced-motion: no-preference)',()=>{
  const controls=$$('[data-sculpture-state]');
  const intro=$('.kinetic-intro'),title=$('#hero-title'),second=$('.kinetic-second');
  const clamp=gsap.utils.clamp(0,1);
  const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
  const update=()=>{
    const p=heroState.progress;
    heroScene?.setProgress(p);
    const outgoing=smooth(.17,.4,p),incoming=smooth(.62,.84,p);
    gsap.set([intro,title],{opacity:1-outgoing,y:-outgoing*45});
    gsap.set(second,{autoAlpha:incoming,y:(1-incoming)*35});
    second.setAttribute('aria-hidden',incoming<.2);
    $('.kinetic-progress span').style.transform=`scaleX(${p})`;
    const selected=p<.3?0:p<.7?1:2;
    controls.forEach((button,i)=>button.setAttribute('aria-pressed',i===selected));
    heroSection.dataset.progress=p.toFixed(3);
  };
  const tween=gsap.to(heroState,{progress:1,ease:'none',onUpdate:update,scrollTrigger:{trigger:heroSection,start:'top top',end:'bottom bottom',scrub:.4,invalidateOnRefresh:true}});
  const navigate=event=>{
    const target=[0,.49,.96][Number(event.currentTarget.dataset.sculptureState)];
    const trigger=tween.scrollTrigger;
    window.scrollTo({top:trigger.start+(trigger.end-trigger.start)*target,behavior:'smooth'});
  };
  controls.forEach(button=>button.addEventListener('click',navigate));
  return()=>{controls.forEach(button=>button.removeEventListener('click',navigate));tween.scrollTrigger?.kill();tween.kill();heroState.progress=0;heroScene?.setProgress(0);gsap.set([intro,title],{clearProps:'opacity,transform'});gsap.set(second,{clearProps:'opacity,visibility,transform'});second.setAttribute('aria-hidden','true');};
});
mm.add('(prefers-reduced-motion: no-preference)', () => {
  // One bounded composition follows the actual three-step process; no scroll hijacking.
  const process = gsap.timeline({scrollTrigger:{trigger:'.process-steps',start:'top 88%',end:'top 32%',scrub:1}});
  process.fromTo('.process-step',{y:45},{y:0,stagger:.16,ease:'none'});
  const path = $('.process-line path'); const length = path.getTotalLength();
  const traveler = $('.process-traveler'); const journey = {distance:0};
  process.fromTo(path,{strokeDasharray:length,strokeDashoffset:length},{strokeDashoffset:0,ease:'none',duration:1.32},0);
  process.to(journey,{distance:length,duration:1.32,ease:'none',onUpdate:()=>{const point = path.getPointAtLength(journey.distance); traveler.setAttribute('cx',point.x); traveler.setAttribute('cy',point.y);}},0);
  return () => { gsap.set('.process-step',{clearProps:'transform'}); gsap.set(path,{clearProps:'strokeDasharray,strokeDashoffset'}); traveler.setAttribute('cx',1100); traveler.setAttribute('cy',18); };
});

mm.add('(min-width: 801px) and (prefers-reduced-motion: no-preference)',()=>{
  const journey = $('#experiencias'), stage = $('.journey-stage'), chapters = $$('.journey-chapter');
  const links = $$('[data-journey-index]');
  let alive = true, world, currentIndex = -1;
  const state = {progress:0};
  journey.classList.add('is-cinematic');
  // A disposed WebGL context cannot be revived when the media query re-enters.
  let worldCanvas = $('#journey-canvas');
  if(worldCanvas.dataset.mounted){const fresh=worldCanvas.cloneNode(false);worldCanvas.replaceWith(fresh);worldCanvas=fresh;}
  worldCanvas.dataset.mounted='true';
  function update() {
    world?.setProgress(state.progress);
    const index = Math.round(state.progress);
    journey.dataset.progress = state.progress.toFixed(3);
    if(index === currentIndex) return;
    currentIndex = index;
    chapters.forEach((chapter,i)=>{chapter.classList.toggle('is-active',i===index);chapter.inert=i!==index;chapter.setAttribute('aria-hidden',i!==index);});
    links.forEach((link,i)=>{if(i===index)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');});
  }
  update();
  import('./photo-worlds.js').then(({mountPhotoWorlds})=>alive?mountPhotoWorlds(worldCanvas,stage):null).then(instance=>{if(!instance)return;if(!alive)instance.destroy();else{world=instance;update();}}).catch(()=>{});
  const tween = gsap.to(state,{progress:2,ease:'none',onUpdate:update,scrollTrigger:{trigger:journey,start:'top top',end:'bottom bottom',scrub:.8,invalidateOnRefresh:true}});
  const navigate = event => {
    event.preventDefault();
    const progress=Number(event.currentTarget.dataset.journeyIndex)/2;
    const trigger=tween.scrollTrigger;
    window.scrollTo({top:trigger.start+(trigger.end-trigger.start)*progress,behavior:'smooth'});
  };
  links.forEach(link=>link.addEventListener('click',navigate));
  return ()=>{alive=false;world?.destroy();tween.scrollTrigger?.kill();tween.kill();journey.classList.remove('is-cinematic');delete journey.dataset.progress;chapters.forEach(chapter=>{chapter.inert=false;chapter.removeAttribute('aria-hidden');chapter.classList.remove('is-active');});links.forEach(link=>link.removeEventListener('click',navigate));};
});
mm.add('(max-width: 800px) and (prefers-reduced-motion: no-preference)',()=>{
  const tweens=$$('.journey-chapter').map(chapter=>gsap.fromTo($('.journey-photo',chapter),{yPercent:-5,scale:1.13},{yPercent:5,ease:'none',scrollTrigger:{trigger:chapter,start:'top bottom',end:'bottom top',scrub:true}}));
  return ()=>tweens.forEach(tween=>{tween.scrollTrigger?.kill();tween.kill();});
});

function startHero() {
  import('./hero-scene.js').then(({mountHeroScene}) => {
    heroScene = mountHeroScene({canvas:$('#hero-canvas'),container:$('.hero-art'),onReady:() => $('.hero-art').classList.add('is-ready')});
    heroScene.setProgress(heroState.progress);
    if(heroScene.getState().fallback){heroSection.classList.add('scene-unavailable');ScrollTrigger.refresh();}
  }).catch(() => { $('#hero-canvas').hidden = true;heroSection.classList.add('scene-unavailable');ScrollTrigger.refresh(); });
}
startHero();
window.addEventListener('pagehide',() => {heroScene?.destroy(); paper?.destroy(); mm.revert(); sceneTimeline?.kill();},{once:true});
window.addEventListener('pageshow',event => {if(event.persisted) location.reload();});
reduced.addEventListener('change',() => {sceneTimeline?.kill(); $('.scene-transition-ghost')?.remove(); gsap.set(['.scene-copy','.scene-image'],{clearProps:'opacity,transform,clipPath'});});
