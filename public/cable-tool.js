import {planConnectionPoint} from './connection-anchors.js';
import {escapeHTML as e} from './model.js';
import {cableTypes,manualPorts,manualPortState,createManualCable} from './manual-cabling.js';
export function initCableTool(app){
 let typeId='',source=null,deviceId='',message='',error=false,lastSelection='';
 const root=document.createElement('section');root.id='cablePalette';root.setAttribute('aria-label','Ligar cabos no mapa');
 root.innerHTML='<div class="cable-palette-head"><strong>Cabos</strong><span>Escolha o cabo e duas portas</span><button type="button" data-cable-cancel hidden>Terminar · Esc</button></div><div class="cable-palette-types">'+cableTypes.map(t=>'<button type="button" data-cable-type="'+t.id+'" aria-pressed="false"><i style="background:'+t.color+'"></i>'+e(t.name)+'</button>').join('')+'</div><div data-cable-work hidden><p role="status" data-cable-message></p><div data-cable-device></div><div class="cable-tool-ports" data-cable-ports></div><button type="button" data-cable-restart>Recomeçar ligação</button></div>';
 document.querySelector('#rackControls').before(root);
 function reset(){source=null;deviceId='';message='';error=false;}
 function start(id){if(!app.get().ready)return;reset();typeId=id;app.prepare();const selected=app.get().selected;if(selected.type==='devices')deviceId=selected.id;app.render();}
 function stop(){typeId='';reset();app.render();}
 function fail(text){message=text;error=true;app.render();}
 function pickPort(id,port){if(!typeId)return false;const p=app.get().project,d=p.devices.find(d=>d.id===id);if(!d)return true;deviceId=id;
  const state=manualPortState(p,d,port,typeId);if(!state.ok){fail(d.name+' / '+port+': '+state.reason);return true;}
  if(!source){source={device:id,port};message='';error=false;app.render();return true;}
  if(source.device===id){fail('Escolha uma porta noutro equipamento.');return true;}
  try{let created;const saved=app.change(p=>created=createManualCable(p,typeId,source,{device:id,port}),'ligar '+source.port+' a '+port);if(!saved)throw Error('Aguarde o carregamento do projeto.');reset();message='Cabo '+created.label+' ligado. Escolha duas portas para o próximo cabo, ou termine com Esc.';app.connected(created);app.render();}catch(err){fail(err.message);}return true;
 }
 function pickDevice(type,id){if(!typeId||type!=='devices')return false;deviceId=id;error=false;message='';app.render();return true;}
 function render(){const s=app.get(),p=s.project;if(s.selected.type==='devices'&&s.selected.id!==lastSelection){deviceId=s.selected.id;lastSelection=s.selected.id;}root.hidden=s.mode==='logical';root.querySelectorAll('[data-cable-type]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.cableType===typeId));b.disabled=!s.ready;});root.querySelector('[data-cable-cancel]').hidden=!typeId;root.querySelector('[data-cable-work]').hidden=!typeId;if(!typeId)return;
  if(source&&!p.devices.some(d=>d.id===source.device)){reset();message='A origem deixou de existir. Escolha outra porta.';}
  const origin=source&&p.devices.find(d=>d.id===source.device),d=p.devices.find(d=>d.id===deviceId);
  const note=root.querySelector('[data-cable-message]');note.textContent=message||(source?'Origem: '+origin.name+' / '+source.port+'. Clique no equipamento de destino e escolha a porta.':'Clique num equipamento no mapa e escolha a primeira porta.');note.classList.toggle('error',error);
  root.querySelector('[data-cable-device]').innerHTML=d?'<strong>'+e(d.name)+'</strong> · '+e(d.type)+(d.type==='Tomada de rede'||d.type==='Patch panel'?'<small>F = frente · R = traseira. Cada F/R com o mesmo número pertence ao mesmo canal.</small>':''):'<p>Selecione um equipamento na planta ou no mapa 3D.</p>';
  root.querySelector('[data-cable-ports]').innerHTML=d?manualPorts(p,d,typeId).map(port=>{const state=manualPortState(p,d,port,typeId),chosen=source?.device===d.id&&source.port===port;return '<button type="button" data-cable-port="'+e(port)+'" data-cable-device="'+e(d.id)+'" aria-pressed="'+chosen+'" aria-disabled="'+!state.ok+'" title="'+e(state.reason)+'"><b>'+e(port)+'</b><small>'+e(chosen?'Origem escolhida':state.reason)+'</small></button>';}).join('')||'<p>Sem portas deste tipo. Selecione outro equipamento.</p>':'';
 }
 root.onclick=ev=>{const b=ev.target.closest('button');if(!b||b.disabled)return;if(b.dataset.cableType)start(b.dataset.cableType);else if(b.hasAttribute('data-cable-cancel'))stop();else if(b.hasAttribute('data-cable-restart')){reset();app.render();}else if(b.dataset.cablePort)pickPort(b.dataset.cableDevice,b.dataset.cablePort);};
 document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&typeId){ev.preventDefault();stop();}});
 // Catch labelled ports in the inspector and technical plan before their old actions.
 document.addEventListener('click',ev=>{if(!typeId||root.contains(ev.target))return;const b=ev.target.closest('[data-network-port],#inspector [data-port]');if(!b)return;ev.preventDefault();ev.stopImmediatePropagation();if(b.closest('#planCanvas'))return;const id=b.dataset.networkDevice||app.get().selected.id;pickPort(id,b.dataset.networkPort||b.dataset.port);},true);
 document.addEventListener('keydown',ev=>{if(!typeId||!['Enter',' '].includes(ev.key))return;const target=ev.target.closest('[data-network-port]');if(target){ev.preventDefault();ev.stopImmediatePropagation();pickPort(target.dataset.networkDevice,target.dataset.networkPort);}},true);
 const plan=document.querySelector('#planCanvas');
 for(const event of ['pointerdown','pointerup'])plan.addEventListener(event,ev=>{if(!typeId)return;const b=ev.target.closest('[data-network-port]');if(!b)return;ev.preventDefault();ev.stopImmediatePropagation();if(event==='pointerup')pickPort(b.dataset.networkDevice,b.dataset.networkPort);},true);
 function decorate(){const svg=plan.querySelector('svg');svg?.querySelector('#manual-cable-preview')?.remove();if(!svg||!typeId||!source||app.get().mode!=='plan')return;const p=app.get().project,d=p.devices.find(d=>d.id===source.device);if(!d||!svg.querySelector('[data-plan-id="'+(d.rack||d.id)+'"]'))return;const point=planConnectionPoint(p,d,source.port),g=app.geometry(),overlay=document.createElementNS(svg.namespaceURI,'g');overlay.id='manual-cable-preview';overlay.setAttribute('pointer-events','none');overlay.dataset.x=g.x(point.x);overlay.dataset.y=g.y(point.z);overlay.innerHTML='<path fill="none" stroke="'+cableTypes.find(t=>t.id===typeId).color+'" stroke-width="3" stroke-dasharray="7 5"/><circle cx="'+g.x(point.x)+'" cy="'+g.y(point.z)+'" r="9" fill="none" stroke="#008773" stroke-width="3"/>';svg.append(overlay);}
 plan.addEventListener('pointermove',ev=>{const svg=plan.querySelector('svg'),overlay=svg?.querySelector('#manual-cable-preview'),matrix=svg?.getScreenCTM();if(!overlay||!matrix)return;const p=new DOMPoint(ev.clientX,ev.clientY).matrixTransform(matrix.inverse()),x=Number(overlay.dataset.x),y=Number(overlay.dataset.y);overlay.querySelector('path').setAttribute('d','M'+x+' '+y+'V'+p.y+'H'+p.x);});
 plan.addEventListener('pointerleave',()=>plan.querySelector('#manual-cable-preview path')?.removeAttribute('d'));
 return {decorate,render,start,stop,pickPort,pickDevice,active:()=>!!typeId,kind:()=>cableTypes.find(t=>t.id===typeId)?.kind||'',source:()=>source};
}
