import {freeRoomPosition} from './room-position.js';
import {clone,validate} from './model.js';
import {roomContext,duplicateRoom} from './room-actions.js';
import {positionLock} from './map-locks.js';

export function roomCopyPosition(p,id){return freeRoomPosition(p,roomContext(p,id).room);}

export function duplicateRoomLayout(p,id,name){
 const {room}=roomContext(p,id),lock=positionLock(p,'rooms',id);if(lock)throw Error('Sala protegida por '+lock.name+'. Desbloqueie antes de duplicar.');
 const target=roomCopyPosition(p,id),next=clone(p),copyId=duplicateRoom(next,id,name),copy=next.rooms.find(r=>r.id===copyId),dx=target.x-room.x,dz=target.z-room.z;
 Object.assign(copy,target,{layoutLocked:false});
 for(const rack of next.racks.filter(r=>r.room===copyId)){rack.x+=dx;rack.z+=dz;rack.layoutLocked=false;rack.locked=false;}
 for(const device of next.devices.filter(d=>d.room===copyId)){device.x+=dx;device.z+=dz;device.layoutLocked=false;}
 validate(next);Object.assign(p,next);return copyId;
}
