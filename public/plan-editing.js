import {positionLock} from './map-locks.js';
import {alignEquipment,equipmentOverlaps,floorFootprint} from './move-alignment.js';
import {createRoomDevices,duplicateDevice} from './room-actions.js';
export function roomAt(p,floorId,x,z,roomId='') {const f=p.floors.find(f=>f.id===floorId),s=p.sites.find(s=>s.id===f?.site);return s?p.rooms.filter(r=>r.floor===floorId&&(!roomId||r.id===roomId)&&Math.abs(x-s.x-r.x)<=r.w/2&&Math.abs(z-s.z-r.z)<=r.d/2).sort((a,b)=>a.w*a.d-b.w*b.d)[0]:null;}
export function placement(p,d,x,z,{snap=true}={}){
 let next={...d,x,z},guides=[];
 if(snap){const a=alignEquipment(p,d.id,x,z);next.x=a.x;next.z=a.z;guides=a.guides;}
 const r=p.rooms.find(r=>r.id===d.room),s=p.sites.find(s=>s.id===d.site);
 if(snap&&d.type==='Tomada de rede'&&r&&s){const walls=[{gap:Math.abs(x-(s.x+r.x-r.w/2)),x:s.x+r.x-r.w/2,z,rotation:90},{gap:Math.abs(x-(s.x+r.x+r.w/2)),x:s.x+r.x+r.w/2,z,rotation:270},{gap:Math.abs(z-(s.z+r.z-r.d/2)),x,z:s.z+r.z-r.d/2,rotation:0},{gap:Math.abs(z-(s.z+r.z+r.d/2)),x,z:s.z+r.z+r.d/2,rotation:180}].sort((a,b)=>a.gap-b.gap);if(walls[0].gap<.65)Object.assign(next,walls[0]);}
 const b=floorFootprint(next),wall=next.type==='Tomada de rede',outside=!!(r&&s&&(wall?Math.abs(next.x-s.x-r.x)>r.w/2+.02||Math.abs(next.z-s.z-r.z)>r.d/2+.02:b.minX<s.x+r.x-r.w/2||b.maxX>s.x+r.x+r.w/2||b.minZ<s.z+r.z-r.d/2||b.maxZ>s.z+r.z+r.d/2));
 const shadow={...p,devices:p.devices.map(o=>o.id===d.id?next:o)},overlaps=equipmentOverlaps(shadow,d.id);return {x:next.x,z:next.z,rotation:next.rotation||0,guides,outside,overlaps};
}
export function applyPlacement(p,id,target){const d=p.devices.find(d=>d.id===id);if(!d||d.rack||d.host||d.type==='VM')throw Error('Este equipamento não pode ser movido na planta.');const lock=positionLock(p,'devices',id);if(lock)throw Error('Posição protegida por '+lock.name+'.');const s=p.sites.find(s=>s.id===d.site);if(!Number.isFinite(target.x)||!Number.isFinite(target.z)||Math.abs(target.x-s.x)>s.w/2||Math.abs(target.z-s.z)>s.d/2)throw Error('Coloque o equipamento dentro do edifício.');Object.assign(d,{x:target.x,z:target.z,rotation:target.rotation||0});}
export function placeNew(p,{type,floorId,roomId,x,z}){const r=roomAt(p,floorId,x,z,roomId);if(!r)throw Error('Escolha um ponto dentro de uma sala.');const lock=positionLock(p,'rooms',r.id);if(lock)throw Error('Sala protegida por '+lock.name+'.');const id=createRoomDevices(p,{roomId:r.id,name:type,type})[0],d=p.devices.find(d=>d.id===id);applyPlacement(p,id,placement(p,d,x,z));return id;}
export const pointerAngle=(cx,cy,x,y)=>((Math.round((Math.atan2(x-cx,cy-y)*-180/Math.PI)/15)*15)%360+360)%360;

// Find a free place before creating the copy, so a full room never leaves a partial edit.
export function duplicateInRoom(p,id){
 const d=p.devices.find(d=>d.id===id);if(!d||d.rack||d.host||d.type==='VM')throw Error('Selecione um equipamento físico fora do bastidor.');
 const lock=positionLock(p,'devices',id);if(lock)throw Error('Posição protegida por '+lock.name+'.');
 const r=p.rooms.find(r=>r.id===d.room),s=p.sites.find(s=>s.id===d.site);if(!r||!s)throw Error('Atribua uma sala antes de duplicar na planta.');
 const candidates=[];for(let x=s.x+r.x-r.w/2+.3;x<s.x+r.x+r.w/2;x+=.3)for(let z=s.z+r.z-r.d/2+.3;z<s.z+r.z+r.d/2;z+=.3)candidates.push({x,z});
 candidates.sort((a,b)=>Math.hypot(a.x-d.x,a.z-d.z)-Math.hypot(b.x-d.x,b.z-d.z));
 const probe={...d,id:'__placement_preview__'},shadow={...p,devices:[...p.devices,probe]};
 let target;for(const c of candidates){const t=placement(shadow,probe,c.x,c.z,{snap:false});if(!t.outside&&!t.overlaps.length){target=t;break;}}
 if(!target)throw Error('Não existe espaço livre suficiente nesta sala. Ajuste a disposição antes de duplicar.');
 const copyId=duplicateDevice(p,id),copy=p.devices.find(d=>d.id===copyId);Object.assign(copy,{x:target.x,z:target.z,rotation:target.rotation,layoutLocked:false});return copyId;
}
