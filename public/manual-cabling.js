import {uid,clone,validate} from './model.js';
import {portsFor,portInUse} from './network.js';
import {interfaceProfile} from './physical-network.js';
import {availableCablePorts,validateCableChoice} from './connection-guide.js';
export const cableTypes=[
 {id:'cat5e',name:'RJ45 · Cat 5e',kind:'copper',category:'Cat 5e',color:'#6d9fff',speed:''},
 {id:'cat6',name:'RJ45 · Cat 6',kind:'copper',category:'Cat 6',color:'#6d9fff',speed:''},
 {id:'cat6a',name:'RJ45 · Cat 6A',kind:'copper',category:'Cat 6A',color:'#75c3db',speed:''},
 {id:'os2',name:'Fibra · OS2',kind:'fiber',category:'OS2',color:'#e6c967',speed:''},
 {id:'om3',name:'Fibra · OM3',kind:'fiber',category:'OM3',color:'#69d3c6',speed:''},
 {id:'power',name:'Alimentação',kind:'power',category:'IEC · confirmar ficha',color:'#d7a96d',speed:'230 V'}
];
const energy=p=>/^(?:PSU\d+|IN|OUT\d+)$/i.test(p);
export function manualPorts(project,device,typeId){const type=cableTypes.find(t=>t.id===typeId);return !type||!device?[]:availableCablePorts(project,device,type.kind).filter(p=>type.kind==='power'||!energy(p)).filter(p=>type.kind!=='power'||!['Computador','Posto de trabalho','Portátil','Telefone IP','Impressora','Wi-Fi','Câmara','Mini-switch'].includes(device.type)||p==='PSU1');}
export function manualPortState(project,device,port,typeId){
 const type=cableTypes.find(t=>t.id===typeId);if(!type||!manualPorts(project,device,typeId).includes(port))return {ok:false,reason:'Esta porta não aceita este tipo de cabo.'};
 const used=portInUse(project,device.id,port);if(used)return {ok:false,reason:'Porta ocupada pelo cabo '+(used.label||used.id)+'.',link:used.id};
 const profile=interfaceProfile(device,port);
 if(type.kind!=='power'){
  const builtInRJ45=['Computador','Posto de trabalho','Portátil','Telefone IP','Wi-Fi','Câmara','Impressora','Tomada de rede','Mini-switch'].includes(device.type);
  if(profile.medium!=='auto'&&profile.medium!==type.kind||profile.medium==='auto'&&builtInRJ45&&type.kind==='fiber')return {ok:false,reason:'Meio físico incompatível. Esta interface é '+(profile.medium==='fiber'?'de fibra':'RJ45 / cobre')+'.'};
  if(!profile.adminUp)return {ok:true,reason:'Livre · interface desativada (shutdown); não prevê comunicação.'};
 }
 return {ok:true,reason:type.kind==='fiber'&&profile.medium==='auto'?'Livre · confirmar interface ótica e transceivers':'Livre'};
}
export function createManualCable(project,typeId,start,end){
 const type=cableTypes.find(t=>t.id===typeId);if(!type)throw Error('Escolha um tipo de cabo.');
 for(const point of [start,end]){const d=project.devices.find(d=>d.id===point.device);if(!d)throw Error('O equipamento já não existe.');const state=manualPortState(project,d,point.port,typeId);if(!state.ok)throw Error(state.reason);}
 const a=project.devices.find(d=>d.id===start.device),b=project.devices.find(d=>d.id===end.device);
 let n=1;while(project.links.some(l=>l.label==='C-'+String(n).padStart(3,'0')))n++;
 const link={...type,id:uid('link'),label:'C-'+String(n).padStart(3,'0'),a:a.id,b:b.id,portA:start.port,portB:end.port,ports:start.port+' ↔ '+end.port,vlans:type.kind==='power'?[]:a.vlan&&a.vlan===b.vlan?[a.vlan]:[],length:null,waypoints:[],routeNote:'Ligação manual no mapa',installation:type.kind==='copper'&&/^[Rr]\d+$/.test(start.port)&&/^[Rr]\d+$/.test(end.port)?'permanent':'patch'};
 delete link.name; // UI palette labels are not project fields.
 validateCableChoice(project,link);const next=clone(project);next.links.push(link);validate(next);project.links.push(link);return link;
}
