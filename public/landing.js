const layerCopy={
 physical:'Equipamentos, portas e percursos físicos',
 logical:'Redes e percursos lógicos documentados',
 ops:'Inventário, tarefas e operação da equipa'
};
const cableInfo={
 rj45:{name:'RJ45 Cat6',color:'#c8ff5e'},
 fiber:{name:'Fibra LC',color:'#aa92ff'}
};
const guideSteps=[
 {port:'pc',name:'PC · posto de trabalho'},
 {port:'outlet',name:'Tomada RJ45'},
 {port:'panel',name:'Patch panel · traseira / frente'},
 {port:'switch',name:'Switch · porta de destino'}
];
const map=document.querySelector('[data-map-preview]');
const caption=document.querySelector('[data-layer-caption]');
const connectStatus=document.querySelector('[data-connect-status]');
const cablePath=document.querySelector('[data-demo-cable]');
const guideButton=document.querySelector('[data-guide-play]');
const ports=[...document.querySelectorAll('[data-port]')];
let selectedCable='rj45';
let currentStep=0;
let playRun=0;
let playing=false;
function syncExpectedPort(){
 for(const port of ports)port.classList.toggle('port-next',port.dataset.port===guideSteps[currentStep]?.port);
 for(const button of document.querySelectorAll('[data-port-shortcut]')){
  const index=guideSteps.findIndex(step=>step.port===button.dataset.portShortcut);
  button.classList.toggle('is-current',index===currentStep);
  button.classList.toggle('is-complete',index<currentStep);
  if(index===currentStep)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
 }
}
for(const button of document.querySelectorAll('[data-layer-choice]')){
 button.addEventListener('click',()=>{
  const layer=button.dataset.layerChoice;
  map.dataset.layer=layer;
  caption.textContent=layerCopy[layer];
  for(const sibling of document.querySelectorAll('[data-layer-choice]')){
   const active=sibling===button;
   sibling.classList.toggle('active',active);
   sibling.setAttribute('aria-pressed',String(active));
  }
 });
}
for(const button of document.querySelectorAll('[data-show-layer]')){
 button.addEventListener('click',()=>{
  const target=document.querySelector(`[data-layer-choice="${button.dataset.showLayer}"]`);
  target?.click();
  map.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
  guideButton.focus({preventScroll:true});
 });
}
for(const button of document.querySelectorAll('[data-cable-choice]')){
 button.addEventListener('click',()=>{
  if(playing)return;
  selectedCable=button.dataset.cableChoice;
  for(const sibling of document.querySelectorAll('[data-cable-choice]')){
   const active=sibling===button;
   sibling.classList.toggle('active',active);
   sibling.setAttribute('aria-pressed',String(active));
  }
  connectStatus.textContent=`Cabo ${cableInfo[selectedCable].name} selecionado. Siga os quatro pontos do percurso.`;
 });
}
function portPoint(port){
 const circle=port.querySelector('circle');
 return {x:Number(circle.getAttribute('cx')),y:Number(circle.getAttribute('cy'))};
}
function drawSegment(a,b){
 const from=portPoint(a),to=portPoint(b),dx=to.x-from.x,lift=Math.max(30,Math.min(72,Math.abs(dx)*.24));
 const curve=`M ${from.x} ${from.y} C ${from.x+dx*.28} ${from.y-lift}, ${to.x-dx*.28} ${to.y-lift}, ${to.x} ${to.y}`;
 cablePath.setAttribute('d',[cablePath.getAttribute('d'),curve].filter(Boolean).join(' '));
 cablePath.style.setProperty('--cable-color',cableInfo[selectedCable].color);
 map.classList.add('has-demo-cable');
}
function clearSelection(){
 playRun++;playing=false;
 for(const port of ports)port.classList.remove('port-selected','port-complete','port-next');
 currentStep=0;cablePath.setAttribute('d','');map.classList.remove('has-demo-cable');
 guideButton.innerHTML='<span>▶</span> Ver percurso completo';
 syncExpectedPort();
}
function choosePort(port){
 if(playing)return;
 if(currentStep===guideSteps.length){
  if(port.dataset.port!=='pc'){
   connectStatus.textContent='Percurso completo. Prima Recomeçar para experimentar outra vez.';
   return;
  }
  cablePath.setAttribute('d','');map.classList.remove('has-demo-cable');
  for(const item of ports)item.classList.remove('port-complete','port-selected');
  currentStep=0;
 }
 const expected=guideSteps[currentStep];
 if(port.dataset.port!==expected.port){
  connectStatus.textContent=`Passo ${currentStep+1} de 4: selecione ${expected.name}.`;
  expectedPortPulse();
  return;
 }
 port.classList.add('port-selected','port-complete');
 if(currentStep>0){
  const previous=document.querySelector(`[data-port="${guideSteps[currentStep-1].port}"]`);
  drawSegment(previous,port);
 }
 currentStep++;
 syncExpectedPort();
 for(const item of ports)item.classList.remove('port-selected');
 if(currentStep===guideSteps.length){
  connectStatus.textContent=`Percurso ligado: PC → tomada → patch panel → switch · ${cableInfo[selectedCable].name}. Demonstração ilustrativa.`;
  guideButton.innerHTML='<span>↻</span> Repetir demonstração';
 }else{
  const next=guideSteps[currentStep];
  connectStatus.textContent=`${currentStep} de 4 · Agora selecione ${next.name}.`;
  syncExpectedPort();
 }
}
function expectedPortPulse(){
 const target=document.querySelector(`[data-port="${guideSteps[currentStep].port}"]`);
 target?.classList.add('port-prompt');
 setTimeout(()=>target?.classList.remove('port-prompt'),650);
}
for(const port of ports){
 port.addEventListener('click',()=>choosePort(port));
 port.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();choosePort(port);}});
}
for(const button of document.querySelectorAll('[data-port-shortcut]')){
 button.addEventListener('click',()=>document.querySelector(`[data-port="${button.dataset.portShortcut}"]`)?.dispatchEvent(new MouseEvent('click',{bubbles:true})));
}
document.querySelector('[data-connect-reset]').addEventListener('click',()=>{
 clearSelection();connectStatus.textContent=`Pronto. ${cableInfo[selectedCable].name} selecionado · Comece pelo PC.`;
});
async function playGuidedDemo(){
 if(playing){playRun++;playing=false;clearSelection();}
 else clearSelection();
 const thisRun=++playRun;playing=true;
 guideButton.innerHTML='<span>◌</span> A demonstrar…';
 const delay=matchMedia('(prefers-reduced-motion: reduce)').matches?180:850;
 for(let i=0;i<guideSteps.length;i++){
  if(thisRun!==playRun)return;
  currentStep=i;syncExpectedPort();
  const step=guideSteps[i],port=document.querySelector(`[data-port="${step.port}"]`);
  port?.classList.add('port-selected','port-complete');
  connectStatus.textContent=`Demonstração · ${i+1} de 4 · ${step.name}`;
  if(i>0)drawSegment(document.querySelector(`[data-port="${guideSteps[i-1].port}"]`),port);
  await new Promise(resolve=>setTimeout(resolve,delay));
  port?.classList.remove('port-selected');
 }
 if(thisRun!==playRun)return;
 currentStep=guideSteps.length;syncExpectedPort();playing=false;
 connectStatus.textContent=`Percurso ligado: PC → tomada → patch panel → switch · ${cableInfo[selectedCable].name}. Demonstração ilustrativa.`;
 guideButton.innerHTML='<span>↻</span> Repetir demonstração';
}
guideButton.addEventListener('click',playGuidedDemo);
syncExpectedPort();
