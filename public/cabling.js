import {uid,clone,validate} from './model.js';
import {portsFor,portInUse} from './network.js';
export const workstationTypes=['Computador','Posto de trabalho','Portátil'];
export const freePorts=(p,d)=>d?portsFor(p,d).filter(port=>!portInUse(p,d.id,port)):[];
export const freeChannels=(p,d)=>d?portsFor(p,d).filter(port=>/^F\d+$/.test(port)&&!portInUse(p,d.id,port)&&!portInUse(p,d.id,'R'+port.slice(1))).map(port=>port.slice(1)):[];
export function cablingPlan(p,v){
 const device=(id,types)=>{const d=p.devices.find(d=>d.id===id);if(!d||!types.includes(d.type))throw new Error('Selecione os quatro equipamentos do percurso.');return d;};
 const pc=device(v.pc,workstationTypes),sw=device(v.switch,['Switch']),socket=device(v.socket,['Tomada de rede']),panel=device(v.panel,['Patch panel']);
 for(const [d,port] of [[pc,v.pcPort],[sw,v.switchPort]])if(!freePorts(p,d).includes(port))throw new Error(d.name+': a interface selecionada está ocupada ou já não existe.');
 for(const [d,ch] of [[socket,v.socketChannel],[panel,v.panelChannel]])if(!freeChannels(p,d).includes(String(ch)))throw new Error(d.name+': escolha um canal livre na frente e na traseira.');
 if(p.links.length+3>500)throw new Error('Não há capacidade para mais três cabos neste projeto.');
 const category=v.category||'Cat 6';if(!['Cat 5e','Cat 6','Cat 6A'].includes(category))throw new Error('Categoria de cabo inválida.');
 let n=1;while(p.links.some(l=>l.label.startsWith('CAB-'+String(n).padStart(3,'0')+' · ')))n++;
 const prefix='CAB-'+String(n).padStart(3,'0');
 const ends=[[pc.id,v.pcPort,socket.id,'F'+v.socketChannel,'Posto'],[socket.id,'R'+v.socketChannel,panel.id,'R'+v.panelChannel,'Horizontal'],[panel.id,'F'+v.panelChannel,sw.id,v.switchPort,'Patch']];
 return ends.map(([a,portA,b,portB,name])=>({id:uid('link'),label:prefix+' · '+name,a,portA,b,portB,kind:'copper',speed:'1 Gbps',vlans:pc.vlan?[pc.vlan]:[],color:'#6d9fff',category,length:null,waypoints:[],routeNote:'Assistente de cablagem · '+pc.name,ports:portA+' ↔ '+portB}));
}
export function connectCabling(p,v){const links=cablingPlan(p,v),next=clone(p);next.links.push(...links);validate(next);p.links.push(...links);return {devices:[v.pc,v.socket,v.panel,v.switch],links:links.map(l=>l.id)};}
