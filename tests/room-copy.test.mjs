import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProject,validate,clone} from '../public/model.js';
import {makeExample} from '../public/examples.js';
import {duplicateRoomLayout,roomCopyPosition} from '../public/room-copy.js';
const setup=()=>{const p=normalizeProject(makeExample('connections')),room=p.rooms[0],site=p.sites.find(s=>s.id===p.floors.find(f=>f.id===room.floor).site);site.w=40;site.d=40;return{p,room,site};};
test('room copy finds a free location and preserves relative equipment geometry without live cables or identities',()=>{
 const {p,room}=setup(),originals=clone(p.devices.filter(d=>d.room===room.id)),links=clone(p.links),beforeRooms=p.rooms.length;
 originals.forEach(d=>{const item=p.devices.find(x=>x.id===d.id);item.ip='';item.record={owner:'Ana',serial:'private'};});
 const position=roomCopyPosition(p,room.id),id=duplicateRoomLayout(p,room.id,'Sala copiada'),copy=p.rooms.find(r=>r.id===id),copies=p.devices.filter(d=>d.room===id);
 assert.equal(p.rooms.length,beforeRooms+1);assert.equal(copy.x,position.x);assert.equal(copy.z,position.z);assert.equal(copies.length,originals.length);assert.deepEqual(p.links,links);
 for(let i=0;i<copies.length;i++){assert.ok(Math.abs(copies[i].x-originals[i].x-copy.x+room.x)<1e-8);assert.ok(Math.abs(copies[i].z-originals[i].z-copy.z+room.z)<1e-8);assert.equal(copies[i].ip,'');assert.equal(copies[i].record,undefined);assert.notEqual(copies[i].id,originals[i].id);}
 assert.ok(!p.rooms.filter(r=>r.floor===room.floor&&r.id!==id).some(r=>Math.abs(copy.x-r.x)<(copy.w+r.w)/2&&Math.abs(copy.z-r.z)<(copy.d+r.d)/2));validate(p);
});
test('room duplication rejects full floors, inherited locks and invalid names without partial changes',()=>{
 const {p,room,site}=setup();p.layoutLocked=true;let before=JSON.stringify(p);assert.throws(()=>duplicateRoomLayout(p,room.id,'Copy'),/protegida/);assert.equal(JSON.stringify(p),before);p.layoutLocked=false;
 before=JSON.stringify(p);assert.throws(()=>duplicateRoomLayout(p,room.id,''),/nome/);assert.equal(JSON.stringify(p),before);
 site.w=room.w;site.d=room.d;p.rooms=[room];room.x=0;room.z=0;before=JSON.stringify(p);assert.throws(()=>duplicateRoomLayout(p,room.id,'Copy'),/espaço livre/);assert.equal(JSON.stringify(p),before);
});

test('copy remaps rack and host references and moves the entire room together',()=>{
 const {p,site}=setup(),sourceRack=p.racks.find(r=>r.room),room=p.rooms.find(r=>r.id===sourceRack.room);site.w=50;site.d=50;
 const oldRacks=clone(p.racks.filter(r=>r.room===room.id)),oldDevices=clone(p.devices.filter(d=>d.room===room.id));
 const id=duplicateRoomLayout(p,room.id,'Sala técnica copiada'),copy=p.rooms.find(r=>r.id===id),racks=p.racks.filter(r=>r.room===id),devices=p.devices.filter(d=>d.room===id);
 assert.equal(racks.length,oldRacks.length);assert.equal(devices.length,oldDevices.length);
 for(let i=0;i<racks.length;i++){assert.ok(Math.abs(racks[i].x-oldRacks[i].x-copy.x+room.x)<1e-8);assert.equal(racks[i].locked,false);assert.equal(racks[i].layoutLocked,false);}
 for(const device of devices){if(device.rack)assert.ok(racks.some(r=>r.id===device.rack));if(device.host)assert.ok(devices.some(d=>d.id===device.host));}
 validate(p);
});
