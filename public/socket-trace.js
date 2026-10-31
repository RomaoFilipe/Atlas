import {portsFor,portInUse,passive} from './network.js';
import {escapeHTML as e} from './model.js';
import {outletName} from './simple-network.js';

// A physical channel is directional: never cross to a sibling socket/panel port.
export function traceSocket(p,id,channel='F1'){
 const socket=p.devices.find(d=>d.id===id),result={devices:socket?[id]:[],links:[],hops:[],complete:false,reason:'Escolha uma tomada.'};
 if(socket?.type!=='Tomada de rede')return result;
 if(!portsFor(p,socket).includes(channel)){result.reason='Saída inexistente.';return result;}
 let current=socket,port='R'+channel.slice(1);const visited=new Set();
 while(true){
  const key=current.id+'|'+port.toLowerCase();if(visited.has(key)){result.reason='Foi detetado um ciclo no percurso.';return result;}visited.add(key);
  const link=portInUse(p,current.id,port);if(!link||!['copper','fiber'].includes(link.kind)){result.reason='Falta documentar a continuação em '+current.name+' / '+port+'.';return result;}
  if(result.links.includes(link.id)){result.reason='Foi detetado um ciclo no percurso.';return result;}
  const toId=link.a===current.id?link.b:link.a,toPort=link.a===current.id?link.portB:link.portA,next=p.devices.find(d=>d.id===toId);
  if(!next){result.reason='O cabo termina num equipamento inexistente.';return result;}
  result.links.push(link.id);result.hops.push({id:link.id,from:current.id,fromPort:port,to:next.id,toPort,label:link.label||'Cabo sem nome'});if(!result.devices.includes(next.id))result.devices.push(next.id);
  if(next.type==='Switch'){result.complete=true;result.reason='Percurso até ao switch documentado.';return result;}
  if(passive(next)){const match=toPort.match(/^([FR])(\d+)$/i);if(!match){result.reason='Canal de passagem por identificar em '+next.name+'.';return result;}port=(match[1].toUpperCase()==='F'?'R':'F')+match[2];}
  else if(next.type==='Mini-switch'&&toPort.toLowerCase()!==(next.uplinkPort||'P1').toLowerCase())port=next.uplinkPort||'P1';
  else {result.reason='O percurso termina em '+next.name+' sem chegar a um switch.';return result;}
  current=next;
 }
}
export function initSocketTrace({get,choose,clear,open}){
 const root=document.createElement('section');root.id='socketTrace';root.setAttribute('aria-label','Percurso da tomada');root.hidden=true;document.querySelector('#planPanel').before(root);
 root.onclick=event=>{const button=event.target.closest('button');if(!button)return;if(button.dataset.channel)choose(button.dataset.channel);if(button.hasAttribute('data-trace-clear'))clear();if(button.dataset.traceDevice)open(button.dataset.traceDevice);};
 return{render(trace){const {project,selected,channel}=get(),socket=selected.type==='devices'?project.devices.find(d=>d.id===selected.id):null;root.hidden=!trace||socket?.type!=='Tomada de rede';if(root.hidden)return;
 root.innerHTML='<div class="socket-trace-head"><strong>'+e(socket.name)+'</strong><div role="group" aria-label="Saída da tomada">'+portsFor(project,socket).map(port=>'<button type="button" data-channel="'+e(port)+'" aria-pressed="'+(port===channel)+'">'+e(outletName(port))+'</button>').join('')+'</div><button type="button" data-trace-clear>Limpar destaque</button></div><p class="socket-trace-state '+(trace.complete?'complete':'incomplete')+'" role="status">'+e(trace.reason)+'</p><ol class="socket-trace-hops">'+trace.hops.map(h=>'<li><button type="button" data-trace-device="'+e(h.from)+'">'+e(project.devices.find(d=>d.id===h.from)?.name)+' <small>'+e(h.fromPort)+'</small></button><span title="'+e(h.label)+'" aria-label="'+e(h.label)+'">→</span><button type="button" data-trace-device="'+e(h.to)+'">'+e(project.devices.find(d=>d.id===h.to)?.name)+' <small>'+e(h.toPort)+'</small></button></li>').join('')+'</ol><small>Segue apenas os cabos registados deste canal. Confirma a instalação no local.</small>';
 }};
}
