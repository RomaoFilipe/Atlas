import {passive,portInUse} from './network.js';
export const isWorkstation=d=>['Computador','Portátil','Posto de trabalho'].includes(d.type);
// Follow only matching passive channels. Active devices are circuit boundaries.
export function cableCircuit(p,linkId){
 const seed=p.links.find(l=>l.id===linkId);if(!seed)return {devices:[],links:[]};
 const links=new Set(),devices=new Set(),queue=[seed];
 while(queue.length){const l=queue.shift();if(links.has(l.id))continue;links.add(l.id);
 for(const [id,port] of [[l.a,l.portA],[l.b,l.portB]]){devices.add(id);const d=p.devices.find(d=>d.id===id);if(!d||!passive(d)||l.kind==='power')continue;const m=port.match(/^([FR])(\d+)$/i);if(!m)continue;const other=portInUse(p,id,(m[1].toUpperCase()==='F'?'R':'F')+m[2]);if(other&&other.kind!=='power')queue.push(other);}}
 return {devices:[...devices],links:[...links]};
}
export function workstationInfo(p,id){const device=p.devices.find(d=>d.id===id);if(!device)return null;const circuits=p.links.filter(l=>l.kind!=='power'&&l.kind!=='virtual'&&(l.a===id||l.b===id)).map(l=>upstreamCircuit(p,l.id));const ids=new Set(circuits.flatMap(c=>c.devices));return {device,circuits,sockets:p.devices.filter(d=>ids.has(d.id)&&d.type==='Tomada de rede'),switches:p.devices.filter(d=>ids.has(d.id)&&['Switch','Mini-switch'].includes(d.type)),panels:p.devices.filter(d=>ids.has(d.id)&&d.type==='Patch panel'),power:p.links.filter(l=>l.kind==='power'&&(l.a===id||l.b===id))};}

// Extend a cable circuit through designated mini-switch uplinks, never sibling ports.
export function upstreamCircuit(p,linkId){
 const result={devices:new Set(),links:new Set()},queue=[linkId];
 while(queue.length){const id=queue.shift();if(result.links.has(id))continue;const c=cableCircuit(p,id);c.devices.forEach(x=>result.devices.add(x));c.links.forEach(x=>result.links.add(x));
 for(const deviceId of c.devices){const d=p.devices.find(x=>x.id===deviceId);if(d?.type!=='Mini-switch')continue;const uplink=d.uplinkPort||'P1';const arrivedDownstream=c.links.some(x=>{const l=p.links.find(l=>l.id===x);return l.kind!=='power'&&l.kind!=='virtual'&&((l.a===d.id&&l.portA!==uplink)||(l.b===d.id&&l.portB!==uplink));});if(arrivedDownstream){const l=portInUse(p,d.id,uplink);if(l&&l.kind!=='power'&&!result.links.has(l.id))queue.push(l.id);}}
 }
 return {devices:[...result.devices],links:[...result.links]};
}
