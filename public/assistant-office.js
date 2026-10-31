import {portsFor,portInUse,traceNetwork,auditProject} from './network.js';

const computers=new Set(['Computador','Portátil','Posto de trabalho']);
const endpoints=new Set([...computers,'Impressora','Telefone IP','Câmara','Wi-Fi']);
const active=d=>d.record?.state!=='Abatido';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export const officeExample='Prepara este escritório para 20 pessoas, com computadores, impressora, tomadas e um bastidor. Liga os equipamentos e verifica o que falta.';

// A complete goal, not a prefix match: extra instructions are never silently dropped.
export function parseOfficeRequest(prompt){
 const text=String(prompt||'').trim().replace(/[.!?]+$/,'');
 const m=text.match(/^(?:prepara|configura|monta) ((?:este|esse|o) escrit[oó]rio|a sala (?:atual|"[^"]+")) para (\d{1,3}|vinte|trinta|dez) pessoas?\s*,?\s+com (.+?)(?:\.\s*(liga os equipamentos)(?: e (verifica o que falta))?)?$/iu);
 if(!m)return null;
 const requested=new Set();for(const part of norm(m[3]).split(/,| e /)){const item=part.trim().replace(/^(?:um|uma) /,'');const field=({'computadores':'computers','impressora':'printer','tomadas':'outlets','tomadas de rede':'outlets','bastidor':'rack'})[item];if(!field||requested.has(field))return null;requested.add(field);}
 if(!requested.has('computers'))return null;
 const room=m[1].match(/^a sala "([^"]+)"$/iu)?.[1]||'sala atual';
 return {room,people:Number(m[2])||({vinte:20,trinta:30,dez:10})[norm(m[2])],printer:requested.has('printer'),outlets:requested.has('outlets'),rack:requested.has('rack'),connect:!!m[4],review:!!m[5]};
}

// Expand a goal into existing validated actions. No project mutation or guessing addresses.
export function officePlan(p,room,request,existingRefs){
 if(!Number.isInteger(request.people)||request.people<1||request.people>30)throw Error('Indica entre 1 e 30 pessoas para preparar o escritório.');
 const refs=new Map(existingRefs),actions=[],used=new Set(refs.keys());let serial=0;
 const fresh=prefix=>{let name;do{name=prefix+'_'+(++serial);}while(used.has(name));used.add(name);return name;};
 const ref=(type,id)=>{const known=[...refs].find(([,v])=>v.type===type&&v.id===id)?.[0];if(known)return known;const name=fresh('office_ref');refs.set(name,{type,id});return name;};
 const roomRef=ref('rooms',room.id),floor=p.floors.find(f=>f.id===room.floor),site=floor?.site;
 const inRoom=p.devices.filter(d=>d.room===room.id&&active(d)),reserved={...p,links:[...p.links,...(p.connectionProposals||[])]};
 const count=inRoom.filter(d=>computers.has(d.type)).length,newComputers=Math.max(0,request.people-count),newPrinter=request.printer&&!inRoom.some(d=>d.type==='Impressora')?1:0;
 const label=kind=>(kind+' · '+room.name).slice(0,95);
 const add=(type,name,quantity,portCount)=>{for(let left=quantity;left>0;left-=20)actions.push({action:'add_devices',ref:fresh('new_office_device'),room:roomRef,type,name,quantity:Math.min(20,left),...(portCount?{portCount}:{})});};
 if(newComputers)add('Computador',label('PC'),newComputers);
 if(newPrinter)add('Impressora',label('Impressora'),1);
 const demand=inRoom.filter(d=>endpoints.has(d.type)&&!p.links.some(l=>l.kind!=='power'&&(l.a===d.id||l.b===d.id))).length+newComputers+newPrinter;
 const free=(d,port)=>!portInUse(reserved,d.id,port);
 const socketFree=inRoom.filter(d=>d.type==='Tomada de rede').reduce((n,d)=>n+portsFor(p,d).filter(port=>free(d,port)).length,0);
 const miniFree=inRoom.filter(d=>d.type==='Mini-switch'&&p.links.some(l=>l.kind!=='power'&&((l.a===d.id&&l.portA===(d.uplinkPort||'P1'))||(l.b===d.id&&l.portB===(d.uplinkPort||'P1'))))).reduce((n,d)=>n+portsFor(p,d).filter(port=>port!==(d.uplinkPort||'P1')&&free(d,port)).length,0);
 const sockets=request.outlets?Math.ceil(Math.max(0,demand-socketFree-miniFree)/2):0;
 if(sockets)add('Tomada de rede',label('Tomada'),sockets);
 const racks=p.racks.filter(r=>r.room===room.id);let rackRef='';
 if(request.rack){if(racks.length>1)throw Error('Há vários bastidores nesta sala. Indica o bastidor pretendido num pedido separado.');if(racks.length)rackRef=ref('racks',racks[0].id);else{rackRef=fresh('new_office_rack');actions.push({action:'create_rack',ref:rackRef,room:roomRef,name:label('RACK'),units:24});}}
 else if(racks.length===1)rackRef=ref('racks',racks[0].id);
 if(request.connect&&request.outlets&&demand){
  const panels=p.devices.filter(d=>d.site===site&&d.type==='Patch panel'&&active(d)),switches=p.devices.filter(d=>d.site===site&&d.type==='Switch'&&active(d));
  const panelFree=panels.reduce((n,d)=>n+portsFor(p,d).filter(port=>free(d,port)&&free(d,'R'+port.slice(1))).length,0);
  const switchFree=switches.reduce((n,d)=>n+portsFor(p,d).filter(port=>free(d,port)).length,0);
  for(const [type,missing] of [['Switch',Math.max(0,demand-switchFree)],['Patch panel',Math.max(0,demand-panelFree)]])if(missing){
   if(!rackRef)throw Error('Falta um bastidor para instalar a infraestrutura de rede. Inclui «um bastidor» no pedido ou escolhe uma sala com bastidor.');
   const ports=missing<=24?24:missing<=48?48:96;if(missing>96)throw Error('A rede precisa de mais portas do que este pedido consegue preparar.');
   const device=fresh('new_office_network');actions.push({action:'add_devices',ref:device,room:roomRef,type,name:label(type==='Switch'?'SW':'PATCH'),quantity:1,portCount:ports});actions.push({action:'mount_device',device,rack:rackRef});
  }
 }
 if(request.connect)actions.push({action:'connect_room',room:roomRef});
 if(actions.length>12)throw Error('A preparação precisa de mais de 12 ações. Divide o escritório por salas ou prepara primeiro a infraestrutura.');
 return {actions,refs,addedComputers:newComputers,addedPrinter:newPrinter,addedSockets:sockets};
}

export function officeReview(p,roomId){
 const room=p.rooms.find(r=>r.id===roomId);if(!room)return null;
 const devices=p.devices.filter(d=>d.room===roomId&&active(d)),ids=new Set(devices.map(d=>d.id)),terminal=devices.filter(d=>endpoints.has(d.type)),floor=p.floors.find(f=>f.id===room.floor);
 const switches=p.devices.filter(d=>d.site===floor?.site&&d.type==='Switch'&&active(d));
 const connected=terminal.filter(d=>switches.some(sw=>traceNetwork(p,d.id,sw.id).devices.length>0)).length;
 const missingIP=terminal.filter(d=>!d.ip).length,missingVLAN=terminal.filter(d=>!d.vlan).length;
 const internet=p.devices.filter(d=>d.type==='Internet'&&active(d));
 const upstream=terminal.length>0&&terminal.every(d=>internet.some(target=>traceNetwork(p,d.id,target.id).devices.length>0));
 const issues=auditProject(p).filter(i=>i.type==='devices'?ids.has(i.id):i.type==='racks'?p.racks.some(r=>r.id===i.id&&r.room===roomId):i.type==='links'?p.links.some(l=>l.id===i.id&&(ids.has(l.a)||ids.has(l.b))):false);
 const pendingProposals=(p.connectionProposals||[]).filter(l=>ids.has(l.a)||ids.has(l.b)).length;
 const pendingPorts=devices.reduce((n,d)=>n+(d.pendingNetworkPorts?.length||0),0);
 const notes=[];
 if(connected<terminal.length)notes.push((terminal.length-connected)+' equipamento(s) sem percurso documentado até um switch.');
 if(missingIP)notes.push(missingIP+' equipamento(s) sem IP documentado.');
 if(missingVLAN)notes.push(missingVLAN+' equipamento(s) sem VLAN atribuída.');
 if(!upstream)notes.push('Ligação do switch a um destino Internet ainda por documentar.');
 if(pendingProposals)notes.push(pendingProposals+' proposta(s) de ligação por rever.');
 if(pendingPorts)notes.push(pendingPorts+' porta(s) por identificar.');
 const errors=issues.filter(i=>i.severity==='erro');for(const error of errors.slice(0,5))notes.push(error.message);
 return {roomId,name:room.name,endpoints:terminal.length,connected,missingIP,missingVLAN,upstream,issues,pendingProposals,pendingPorts,notes,
  text:'Verificação de '+room.name+': '+connected+'/'+terminal.length+' equipamentos com percurso documentado até um switch.\n'+(notes.length?'Por concluir:\n'+notes.map(note=>'– '+note).join('\n'):'Sem pendências nas verificações efetuadas.')+'\nVerificação dos registos do projeto; não confirma a instalação física.'};
}
