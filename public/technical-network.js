import {escapeHTML as e,worldPosition} from './model.js';
import {portsFor,portInUse,passive} from './network.js';

export function devicePorts(project,device){
 const faces=passive(device)?['front','rear']:['front'];
 return faces.flatMap(face=>portsFor(project,device,face).map(port=>{
  const link=portInUse(project,device.id,port),other=link&&project.devices.find(d=>d.id===(link.a===device.id?link.b:link.a));
  return {port,face,link,other,otherPort:link?(link.a===device.id?link.portB:link.portA):''};
 }));
}
export function floorNetwork(project,floorId,roomId=''){
 const devices=project.devices.filter(d=>d.floor===floorId&&(!roomId||d.room===roomId)&&d.type!=='VM'),ids=new Set(devices.map(d=>d.id));
 const links=project.links.filter(l=>l.kind!=='power'&&l.kind!=='virtual'&&(ids.has(l.a)||ids.has(l.b)));
 const sockets=devices.filter(d=>d.type==='Tomada de rede');
 const outlets=sockets.flatMap(d=>devicePorts(project,d).filter(port=>port.face==='front'));
 return {devices,links,sockets,outlets,used:outlets.filter(port=>port.link).length,racks:project.racks.filter(r=>r.floor===floorId&&(!roomId||r.room===roomId))};
}
export function socketPortMarkers(project,devices,geometry){
 return devices.filter(d=>d.type==='Tomada de rede').map(d=>{
  const position=worldPosition(project,d),x=geometry.x(position.x),y=geometry.y(position.z)+Math.max(14,geometry.scale*.22),ports=devicePorts(project,d).filter(p=>p.face==='front'),shown=ports.slice(0,8),width=shown.length*29;
  return `<g class="socket-port-markers" aria-label="${e(d.name+' · portas RJ45')}">${shown.map((p,i)=>`<g data-network-device="${e(d.id)}" data-network-port="${e(p.port)}" role="button" tabindex="0" aria-label="${e(d.name+' / '+p.port+' · '+(p.link?'Ocupada, abrir ligação':'Livre, criar ligação'))}"><title>${e(d.name+' / '+p.port+' · '+(p.other?p.other.name+' / '+p.otherPort:'Livre'))}</title><rect x="${x-width/2+i*29}" y="${y}" width="27" height="20" rx="3" fill="${p.link?'#dfebff':'#e4f5ee'}" stroke="${p.link?'#3563c7':'#168568'}"/><text x="${x-width/2+i*29+13.5}" y="${y+14}" font-size="10" font-weight="700" text-anchor="middle" fill="#203746">${e(p.port)}</text></g>`).join('')}${ports.length>8?`<title>Mais ${ports.length-8} portas na ficha</title>`:''}</g>`;
 }).join('');
}
const portButton=(id,p)=>`<button type="button" class="network-port ${p.link?'occupied':'available'}" data-network-device="${e(id)}" data-network-port="${e(p.port)}"><strong>${e(p.port)}</strong><span>${p.link?'Ocupada':'Livre'}</span><small>${p.other?e(p.other.name+' / '+p.otherPort):'Criar ligação'}</small></button>`;
export function technicalPanelHTML(project,{floorId,roomId='',selected}){
 const floor=project.floors.find(f=>f.id===floorId);if(!floor)return '<p>Escolha um piso para documentar a rede na planta.</p>';
 const network=floorNetwork(project,floorId,roomId),device=selected.type==='devices'&&project.devices.find(d=>d.id===selected.id&&d.floor===floorId&&(!roomId||d.room===roomId)),rack=selected.type==='racks'&&project.racks.find(r=>r.id===selected.id&&r.floor===floorId&&(!roomId||r.room===roomId));
 let html=`<div class="technical-network-head"><div><h3>Rede informática · ${e(floor.name)}</h3><p>${network.devices.length} equipamentos · ${network.sockets.length} tomadas · ${network.outlets.length} saídas RJ45 · ${network.used} ocupadas · ${network.links.length} ligações de dados</p></div><button type="button" data-network-cable>Criar ligação</button></div>`;
 if(device){const ports=devicePorts(project,device);html+=`<section><h4>${e(device.name)} · ${e(device.type)}</h4><p>Escolha uma porta livre para ligar ou uma porta ocupada para consultar o cabo.</p>${passive(device)?'<p>F = frente / utilizador · R = traseira / cablagem permanente. F1 ↔ R1 pertencem ao mesmo canal.</p>':''}<div class="network-port-grid">${ports.map(p=>portButton(device.id,p)).join('')||'<p>Sem portas de dados neste equipamento.</p>'}</div></section>`;}
 if(rack){html+=`<section><h4>${e(rack.name)} · equipamento instalado</h4><div class="network-rack-list">${project.devices.filter(d=>d.rack===rack.id).sort((a,b)=>b.u-a.u).map(d=>`<button type="button" data-network-select="${e(d.id)}"><b>U${d.u} · ${e(d.name)}</b><span>${e(d.type)} · ${devicePorts(project,d).filter(p=>p.link).length} portas ocupadas</span></button>`).join('')||'<p>Bastidor vazio. Adicione equipamento pela configuração do bastidor.</p>'}</div></section>`;}
 html+=`<details ${!device&&!rack?'open':''}><summary>Equipamentos de rede e tomadas deste piso</summary><div class="network-device-list">${network.devices.filter(d=>['Switch','Mini-switch','Patch panel','Tomada de rede','Firewall','Wi-Fi'].includes(d.type)).map(d=>`<button type="button" data-network-select="${e(d.id)}"><strong>${e(d.name)}</strong><span>${e(d.type)}${d.rack?' · '+e(project.racks.find(r=>r.id===d.rack)?.name||''):''}</span></button>`).join('')||'<p>Coloque tomadas, pontos Wi-Fi e equipamentos pela biblioteca da planta.</p>'}</div></details>`;
 html+=`<details><summary>Cablagem documentada · ${network.links.length} ligações</summary><div class="network-cable-list">${network.links.map(l=>{const a=project.devices.find(d=>d.id===l.a),b=project.devices.find(d=>d.id===l.b);return `<button type="button" data-network-link="${e(l.id)}"><strong>${e(a?.name||'?')} / ${e(l.portA)} → ${e(b?.name||'?')} / ${e(l.portB)}</strong><span>${e(l.category||l.kind)}${a?.floor!==b?.floor?' · ligação entre pisos':''}</span></button>`;}).join('')||'<p>Ainda não existem cabos documentados neste piso.</p>'}</div></details>`;
 return html;
}
export function initTechnicalNetwork(app){
 const panel=document.createElement('section');panel.id='technicalNetwork';panel.className='technical-network';document.querySelector('#planHelp').before(panel);
 function activate(target){const id=target.dataset.networkDevice,port=target.dataset.networkPort;if(id&&port){const d=app.get().project.devices.find(d=>d.id===id);if(!d)return;const used=portInUse(app.get().project,id,port);app.cable(used?.id||null,used?{}:{a:id,portA:port});}else if(target.dataset.networkSelect)app.select('devices',target.dataset.networkSelect);else if(target.dataset.networkLink)app.cable(target.dataset.networkLink);else if(target.hasAttribute('data-network-cable'))app.cable();}
 panel.onclick=ev=>{const target=ev.target.closest('button');if(target)activate(target);};
 const canvas=document.querySelector('#planCanvas');
 canvas.addEventListener('pointerdown',ev=>{if(ev.target.closest('[data-network-port]')){ev.preventDefault();ev.stopImmediatePropagation();}},true);
 canvas.addEventListener('pointerup',ev=>{const target=ev.target.closest('[data-network-port]');if(target){ev.preventDefault();ev.stopImmediatePropagation();activate(target);}},true);
 canvas.addEventListener('keydown',ev=>{const target=ev.target.closest('[data-network-port]');if(target&&['Enter',' '].includes(ev.key)){ev.preventDefault();ev.stopImmediatePropagation();activate(target);}},true);
 return {render(){const state=app.get();panel.hidden=state.mode!=='plan';if(!panel.hidden)panel.innerHTML=technicalPanelHTML(state.project,state);panel.querySelectorAll('button').forEach(button=>button.disabled=!state.ready);}};
}
