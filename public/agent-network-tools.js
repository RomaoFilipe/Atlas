import {clone,validatePortProfiles} from './model.js';
import {interfaceProfile,assessCircuit,auditPhysicalNetwork,physicalContext} from './physical-network.js';
import {createManualCable,manualPorts,manualPortState} from './manual-cabling.js';
import {portsFor,portInUse,traceNetwork} from './network.js';
import {cableCircuit} from './workstations.js';
const isSwitch=d=>d?.type==='Switch'&&d.record?.state!=='Abatido';
const terminal=d=>['Computador','Posto de trabalho','Portátil'].includes(d.type);
const reserved=p=>({...p,links:[...p.links,...(p.connectionProposals||[])]});
export function configureAgentInterface(p,deviceId,port,values){
 const d=p.devices.find(d=>d.id===deviceId);if(!d||!portsFor(p,d).includes(port))throw Error('A interface não existe neste equipamento.');
 const {documented,...before}=interfaceProfile(d,port),after={...before,...values,port};
 if(after.mode==='access'){after.nativeVlan=0;after.allowedVlans=[];}else if(after.mode==='trunk')after.accessVlan=0;
 const next=clone(p),target=next.devices.find(d=>d.id===deviceId);target.portProfiles=[...(target.portProfiles||[]).filter(c=>c.port.toLowerCase()!==port.toLowerCase()),after];validatePortProfiles(next);
 d.portProfiles=target.portProfiles;
 return {tool:'configure_interface',device:deviceId,port,expected:after,summary:d.name+' / '+port+': configuração documentada.',checks:['Interface existente','Configuração validada no modelo']};
}
export function connectAgentCable(p,cable,a,portA,b,portB){
 // Proposals reserve their ports even though they have not yet become cables.
 for(const [id,port] of [[a,portA],[b,portB]]){const d=p.devices.find(d=>d.id===id);if(!d)throw Error('Equipamento inexistente.');const state=manualPortState(reserved(p),d,port,cable);if(!state.ok)throw Error(state.reason);}
 const link=createManualCable(p,cable,{device:a,port:portA},{device:b,port:portB}),diagnostic=assessCircuit(p,link);
 return {tool:'connect_cable',device:a,links:[link.id],summary:link.label+': '+portA+' ↔ '+portB,checks:['Portas livres e compatíveis','Cabo criado nas portas pedidas'],warnings:diagnostic.issues.map(i=>i.message)};
}
function usable(p,d,port,cable,vlan=0){
 if(!manualPortState(reserved(p),d,port,cable).ok)return false;
 const c=interfaceProfile(d,port);return c.adminUp&&(!vlan||c.mode!=='access'||c.accessVlan===vlan)&&(!vlan||c.mode!=='trunk'||c.allowedVlans.includes(vlan));
}
function switches(p,pc){return p.devices.filter(d=>isSwitch(d)&&d.site===pc.site&&d.floor===pc.floor);}
function extendOutlet(p,pc,socket,channel,cable,created){
 const rear=portInUse(p,socket.id,'R'+channel),circuit=rear&&cableCircuit(p,rear.id);
 if(circuit?.devices.some(id=>isSwitch(p.devices.find(d=>d.id===id))))return;
 let panel,front;
 if(rear){
  const panels=circuit.devices.map(id=>p.devices.find(d=>d.id===id)).filter(d=>d?.type==='Patch panel'&&d.site===pc.site&&d.floor===pc.floor);
  for(const candidate of panels){const links=circuit.links.map(id=>p.links.find(l=>l.id===id));for(const l of links){const port=l.a===candidate.id?l.portA:l.b===candidate.id?l.portB:'';const m=port.match(/^R(\d+)$/);if(m&&usable(p,candidate,'F'+m[1],cable)){panel=candidate;front='F'+m[1];break;}}if(panel)break;}
  if(!panel)throw Error('A continuação existente da tomada não termina num canal de painel livre. Reveja o percurso.');
 }else{
  const candidates=p.devices.filter(d=>d.type==='Patch panel'&&d.site===pc.site&&d.floor===pc.floor&&d.record?.state!=='Abatido');
  for(const candidate of candidates){const port=portsFor(p,candidate).find(port=>/^F\d+$/.test(port)&&usable(p,candidate,port,cable)&&usable(p,candidate,'R'+port.slice(1),cable));if(port){panel=candidate;front=port;break;}}
  if(!panel)throw Error('Falta um canal livre num patch panel deste piso.');
  created.push(...connectAgentCable(p,cable,socket.id,'R'+channel,panel.id,'R'+front.slice(1)).links);
 }
 let target;
 for(const sw of switches(p,pc)){const port=manualPorts(p,sw,cable).find(port=>usable(p,sw,port,cable,pc.vlan));if(port){target={sw,port};break;}}
 if(!target)throw Error('Falta uma porta de switch livre, ativa e compatível com a VLAN neste piso.');
 created.push(...connectAgentCable(p,cable,panel.id,front,target.sw.id,target.port).links);
}
export function connectNearestOutlet(project,deviceId,{cable='cat6',complete=true}={}){
 const original=project.devices.find(d=>d.id===deviceId);if(!original||!terminal(original)||!original.room||!original.floor)throw Error('Selecione um PC ou posto com sala e piso definidos.');
 if(!['cat5e','cat6','cat6a'].includes(cable))throw Error('O percurso PC–tomada exige um cabo RJ45.');
 const current=project.links.filter(l=>!['power','virtual'].includes(l.kind)&&(l.a===deviceId||l.b===deviceId));
 const candidates=[];
 if(current.length){
  if(current.length!==1)throw Error('O posto tem várias ligações de dados. Indique as portas pretendidas.');
  const l=current[0],socket=project.devices.find(d=>d.id===(l.a===deviceId?l.b:l.a)),port=l.a===deviceId?l.portB:l.portA;
  if(socket?.type!=='Tomada de rede'||!/^F\d+$/.test(port))throw Error('A interface já está ligada a outro equipamento. Não removi nem substituí o cabo.');
  candidates.push({socket,port,pcPort:l.a===deviceId?l.portA:l.portB,existing:l.id});
 }else{
  const pcPort=manualPorts(project,original,cable).find(port=>usable(project,original,port,cable));if(!pcPort)throw Error('O posto não tem uma interface livre e ativa para esta ligação.');
  for(const socket of project.devices.filter(d=>d.type==='Tomada de rede'&&d.room===original.room&&d.floor===original.floor&&d.site===original.site&&d.record?.state!=='Abatido').sort((a,b)=>Math.hypot(a.x-original.x,a.z-original.z)-Math.hypot(b.x-original.x,b.z-original.z)||a.id.localeCompare(b.id)))for(const port of manualPorts(project,socket,cable).filter(port=>/^F\d+$/.test(port)&&usable(project,socket,port,cable)))candidates.push({socket,port,pcPort});
 }
 if(!current.length)candidates.sort((a,b)=>Math.hypot(a.socket.x-original.x,a.socket.z-original.z)-Math.hypot(b.socket.x-original.x,b.socket.z-original.z)||Number(!!portInUse(project,b.socket.id,'R'+b.port.slice(1)))-Number(!!portInUse(project,a.socket.id,'R'+a.port.slice(1)))||a.port.localeCompare(b.port,undefined,{numeric:true}));
 if(!candidates.length)throw Error('Não há uma saída livre de tomada nesta sala. Adicione ou identifique uma tomada.');
 let last;
 for(const choice of candidates){
  const p=clone(project),pc=p.devices.find(d=>d.id===deviceId),socket=p.devices.find(d=>d.id===choice.socket.id),created=[];
  try{
   if(!choice.existing)created.push(...connectAgentCable(p,cable,pc.id,choice.pcPort,socket.id,choice.port).links);
   if(complete)extendOutlet(p,pc,socket,choice.port.slice(1),cable,created);
   const first=p.links.find(l=>l.a===pc.id&&l.portA===choice.pcPort||l.b===pc.id&&l.portB===choice.pcPort),diagnostic=assessCircuit(p,first);
   if(diagnostic.issues.some(i=>i.severity==='erro'))throw Error(diagnostic.issues.filter(i=>i.severity==='erro').map(i=>i.message).join(' '));
   const sw=complete&&p.devices.filter(d=>isSwitch(d)&&d.site===pc.site).find(sw=>traceNetwork(p,pc.id,sw.id).devices.length);if(complete&&!sw)throw Error('O percurso não chega a um switch documentado.');
   Object.assign(project,p);
   return {tool:'connect_nearest_outlet',device:pc.id,links:created,circuitLinks:diagnostic.links,route:sw?traceNetwork(p,pc.id,sw.id).devices:[pc.id,socket.id],summary:pc.name+' → '+socket.name+' / '+choice.port+(sw?' → '+sw.name:'')+' · '+created.length+' cabo(s) novo(s).',checks:['Tomada da mesma sala','Cabos existentes preservados',...(complete?['Percurso até ao switch verificado']:[])],warnings:diagnostic.issues.map(i=>i.message)};
  }catch(error){last=error;}
 }
 throw Error(last?.message||'Não encontrei um percurso livre e compatível. Nada foi alterado.');
}
export function verifyAgentNetwork(p,{device='',room=''}={}){
 const ids=new Set(p.devices.filter(d=>device?d.id===device:d.room===room).map(d=>d.id)),links=p.links.filter(l=>ids.has(l.a)||ids.has(l.b)),linkIds=new Set(links.map(l=>l.id)),context=physicalContext(p);
 for(const l of links)if(!['power','virtual'].includes(l.kind)){const circuit=assessCircuit(p,l,context);for(const id of circuit.links)linkIds.add(id);for(const e of circuit.endpoints)ids.add(e.device.id);}
 const issues=auditPhysicalNetwork(p).filter(i=>i.type==='devices'?ids.has(i.id):linkIds.has(i.id));
 return {tool:'verify_network',device,room,summary:'Verificação documental: '+issues.filter(i=>i.severity==='erro').length+' incompatibilidade(s), '+issues.filter(i=>i.severity!=='erro').length+' observação(ões).',checks:['Circuitos, interfaces, VLANs e PoE revistos'],warnings:issues.map(i=>i.message),issues};
}
