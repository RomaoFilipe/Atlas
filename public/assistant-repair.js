import {clone,uid} from './model.js';
import {portsFor,portInUse} from './network.js';
import {suggestRoomConnections} from './room-planner.js';
import {validateCableChoice} from './connection-guide.js';
const terminal=d=>['Computador','Posto de trabalho','Portátil','Telefone IP','Impressora','Câmara','Wi-Fi'].includes(d.type);
export function repairRoomLinks(project,roomId){
 const p=clone(project),choices=[],skipped=[];const reserved=()=>({...p,links:[...p.links,...(p.connectionProposals||[])]}),free=(d,port)=>!portInUse(reserved(),d.id,port);
 const add=choice=>{try{validateCableChoice(reserved(),choice);}catch(error){skipped.push(error.message);return false;}if(choices.length>=100)throw Error('A reparação excede 100 cabos. Divide a sala por etapas.');choices.push(choice);p.links.push({...choice,id:uid('repair'),vlans:[]});return true;};
 const devices=p.devices.filter(d=>d.room===roomId&&d.record?.state!=='Abatido'),switches=devices.filter(d=>d.type==='Switch');
 const connectToSwitch=(d,source)=>{if(!source)return;for(const sw of switches){const target=portsFor(p,sw).find(port=>free(sw,port));if(target&&add({a:d.id,b:sw.id,portA:source,portB:target,kind:'copper'}))return;}};
 for(let round=0;round<3;round++){
  const before=choices.length;for(const l of suggestRoomConnections(p,roomId))add({a:l.a,b:l.b,portA:l.portA,portB:l.portB,kind:l.kind});
  for(const mini of devices.filter(d=>d.type==='Mini-switch')){const up=mini.uplinkPort||'P1';if(free(mini,up))connectToSwitch(mini,up);}
  for(const l of suggestRoomConnections(p,roomId))add({a:l.a,b:l.b,portA:l.portA,portB:l.portB,kind:l.kind});
  for(const d of devices.filter(terminal))if(!p.links.some(l=>l.kind!=='power'&&(l.a===d.id||l.b===d.id)))connectToSwitch(d,portsFor(p,d).find(port=>free(d,port)));
  if(choices.length===before)break;
 }
 return {choices,skipped:[...new Set(skipped)]};
}
