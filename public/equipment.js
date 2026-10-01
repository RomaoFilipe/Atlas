import {positionLock} from './map-locks.js';
import {escapeHTML as e} from './model.js';
export const rackTypes=['Switch','Firewall','Servidor','Armazenamento','Patch panel','UPS','PDU'];
export const endpointTypes=['Computador','Portátil','Telefone IP','Posto de trabalho','Impressora','Câmara','Wi-Fi','Internet'];
export const specs={
 'Telefone IP':[['extension','Extensão telefónica'],['workstation','Código do posto'],['department','Serviço / departamento'],['sipServer','Central telefónica / servidor SIP'],['poe','Alimentação / PoE']],
 'Computador':[['workstation','Código do posto'],['screens','Monitores / referências'],['phone','Telefone / extensão'],['powerSource','Tomada elétrica / circuito'],['os','Sistema operativo'],['cpu','Processador'],['ram','Memória RAM'],['storage','Disco']],
 'Posto de trabalho':[['workstation','Código do posto'],['department','Serviço / departamento'],['computer','Computador / referência'],['screens','Monitores / referências'],['phone','Telefone / extensão'],['powerSource','Tomada elétrica / circuito'],['os','Sistema operativo'],['cpu','Processador'],['ram','Memória RAM'],['storage','Disco']],
 'Portátil':[['workstation','Código do posto'],['screens','Monitores / referências'],['phone','Telefone / extensão'],['powerSource','Tomada elétrica / circuito'],['os','Sistema operativo'],['cpu','Processador'],['ram','Memória RAM'],['storage','Disco']],
 'Servidor':[['os','Sistema / hipervisor'],['cpu','Processadores'],['ram','Memória RAM'],['storage','Armazenamento']],
 'VM':[['os','Sistema operativo'],['cpu','vCPU'],['ram','Memória RAM'],['storage','Disco virtual']],
 'Mini-switch':[['switching','Velocidade / capacidade'],['poe','Alimentação / PoE']],
 'Switch':[['switching','Camada / capacidade'],['poe','PoE / orçamento de potência']],
 'Firewall':[['wan','IP / ligação WAN'],['policies','Políticas / VPN documentadas']],
 'Armazenamento':[['storage','Capacidade / discos'],['raid','RAID / redundância'],['protocols','Protocolos (SMB, NFS, iSCSI…)']],
 'Wi-Fi':[['ssid','SSID'],['wifi','Norma Wi-Fi / bandas'],['poe','Alimentação / PoE']],
 'Câmara':[['resolution','Resolução'],['recorder','Gravador / NVR'],['poe','Alimentação / PoE']],
 'Impressora':[['printType','Tecnologia / cor'],['paper','Formato de papel'],['powerSource','Tomada elétrica / circuito']],
 'UPS':[['power','Potência (VA / W)'],['autonomy','Autonomia estimada']],
 'PDU':[['feed','Origem / circuito de alimentação'],['power','Potência / corrente'],['connector','Tipo de tomadas (Schuko, IEC C13…)']],
 'Patch panel':[['category','Categoria / blindagem']],
 'Tomada de rede':[['outlet','Identificação na parede'],['category','Categoria']],
 'Internet':[['provider','Operador'],['bandwidth','Velocidade contratada']]
};
export function specFields(d){return (specs[d.type]||[]).map(([key,label])=>`<label class="form-field">${e(label)}<input name="spec_${key}" value="${e(d.specs?.[key]||'')}" maxlength="200"></label>`).join('')+(d.type==='Posto de trabalho'?`<label class="form-field">Monitores<select name="monitors">${[1,2].map(n=>`<option value="${n}" ${n===(d.monitors||1)?'selected':''}>${n}</option>`).join('')}</select></label><label class="form-field">Orientação da secretária<select name="rotation">${[0,90,180,270].map(n=>`<option value="${n}" ${n===(d.rotation||0)?'selected':''}>${n}°</option>`).join('')}</select></label>`:'');}
export function defaultPortCount(type){return type==='Mini-switch'?5:type==='Tomada de rede'?2:type==='Switch'||type==='Patch panel'?24:type==='Firewall'?8:type==='Servidor'||type==='Armazenamento'?4:type==='PDU'?8:type==='UPS'?2:1;}
export function moveObject(p,type,id,x,z){const item=p[type]?.find(d=>d.id===id);if(!item)throw new Error('Objeto inexistente.');if(!Number.isFinite(x)||!Number.isFinite(z))throw new Error('Posição inválida.');if(type==='rooms'){return moveRoom(p,id,x,z);}if(type==='devices'){if(item.rack||item.type==='VM')throw new Error('A posição acompanha o bastidor ou o servidor.');const s=p.sites.find(s=>s.id===item.site),margin=item.type==='Posto de trabalho'?1:.4;item.x=Math.max(s.x-s.w/2+margin,Math.min(s.x+s.w/2-margin,Math.round(x*10)/10));item.z=Math.max(s.z-s.d/2+margin,Math.min(s.z+s.d/2-margin,Math.round(z*10)/10));}else if(type==='sites'){const nx=Math.max(-150,Math.min(150,Math.round(x*10)/10)),nz=Math.max(-150,Math.min(150,Math.round(z*10)/10)),dx=nx-item.x,dz=nz-item.z;item.x=nx;item.z=nz;for(const d of p.devices.filter(d=>d.site===id)){d.x+=dx;d.z+=dz;}}return item;}

export function moveRoom(p,id,x,z){
 const room=p.rooms.find(r=>r.id===id),floor=p.floors.find(f=>f.id===room?.floor),site=p.sites.find(s=>s.id===floor?.site);if(!room||!site)throw new Error('Sala inexistente.');if(!Number.isFinite(x)||!Number.isFinite(z))throw new Error('Posição inválida.');
 const members=[['rooms',room],...p.racks.filter(r=>r.room===id).map(r=>['racks',r]),...p.devices.filter(d=>d.room===id).map(d=>['devices',d])];for(const [type,d] of members){const lock=positionLock(p,type,d.id);if(lock)throw new Error('Posição protegida por «'+lock.name+'». Abra Gerir bloqueios antes de mover a sala.');}
 let minX=-site.w/2+room.w/2-room.x,maxX=site.w/2-room.w/2-room.x,minZ=-site.d/2+room.d/2-room.z,maxZ=site.d/2-room.d/2-room.z;
 for(const [type,d] of members){if(type!=='racks')continue;minX=Math.max(minX,-site.w/2+.7-d.x);maxX=Math.min(maxX,site.w/2-.7-d.x);minZ=Math.max(minZ,-site.d/2+.7-d.z);maxZ=Math.min(maxZ,site.d/2-.7-d.z);}
 if(minX>maxX||minZ>maxZ)throw new Error('A sala é maior do que o edifício. Ajuste as dimensões antes de a mover.');const dx=Math.max(minX,Math.min(maxX,Math.round(x*10)/10-room.x)),dz=Math.max(minZ,Math.min(maxZ,Math.round(z*10)/10-room.z));
 for(const [,d] of members){d.x+=dx;d.z+=dz;}return room;
}

// Bottom-right resizing keeps the top-left corner and equipment positions fixed.
export function roomResizeBounds(p,id,right,bottom){
 const room=p.rooms.find(r=>r.id===id),floor=p.floors.find(f=>f.id===room?.floor),site=p.sites.find(s=>s.id===floor?.site);
 if(!room||!site)throw new Error('Sala inexistente.');
 if(!Number.isFinite(right)||!Number.isFinite(bottom))throw new Error('Dimensões inválidas.');
 const lock=positionLock(p,'rooms',id);if(lock)throw new Error('Posição protegida por «'+lock.name+'». Abra Gerir bloqueios.');
 const left=room.x-room.w/2,top=room.z-room.d/2;
 let minRight=left+1,minBottom=top+1;
 for(const [type,items] of [['racks',p.racks],['devices',p.devices]])for(const item of items||[]){
  if(item.room!==id||item.rack||item.type==='VM')continue;
  const x=item.x-(type==='devices'?site.x:0),z=item.z-(type==='devices'?site.z:0);
  if(x>=left&&x<=left+room.w&&z>=top&&z<=top+room.d){minRight=Math.max(minRight,x+.4);minBottom=Math.max(minBottom,z+.4);}
 }
 const maxRight=site.w/2,maxBottom=site.d/2;
 if(minRight>maxRight||minBottom>maxBottom)throw new Error('Não há espaço para redimensionar neste local. Mova a sala ou os equipamentos.');
 const endX=Math.max(minRight,Math.min(maxRight,Math.round(right*10)/10)),endZ=Math.max(minBottom,Math.min(maxBottom,Math.round(bottom*10)/10));
 return {x:(left+endX)/2,z:(top+endZ)/2,w:endX-left,d:endZ-top};
}
export function resizeRoom(p,id,right,bottom){const bounds=roomResizeBounds(p,id,right,bottom);return Object.assign(p.rooms.find(r=>r.id===id),bounds);}
