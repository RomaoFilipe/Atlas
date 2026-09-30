import test from 'node:test';
import assert from 'node:assert/strict';
import {makeExample} from '../public/examples.js';
import {connectionChoices,networkStatus,outletName,connectionKind,connectionAction} from '../public/simple-network.js';
import {normalizeProject,validateEquipmentRecords} from '../public/model.js';
test('simple choices keep rear cabling separate and reserve mini-switch uplinks',()=>{
 const p=makeExample('connections'),socket=p.devices.find(d=>d.id==='socket2'),pc=p.devices.find(d=>d.id==='pc3');
 assert.equal(outletName('F2'),'Saída B');
 const rear=connectionChoices(p,socket,'R2');assert.ok(rear.length);assert.ok(rear.every(x=>x.device.type==='Patch panel'&&x.port.startsWith('R')));
 assert.ok(connectionChoices(p,pc,'Ethernet1').filter(x=>x.device.type==='Mini-switch').every(x=>x.port!==(x.device.uplinkPort||'P1')));
 assert.ok(connectionChoices(p,socket,'F2').filter(x=>x.device.type==='Mini-switch').every(x=>x.port===(x.device.uplinkPort||'P1')));
});
test('each socket channel reports its own upstream documentation',()=>{
 const p=makeExample('connections'),socket=p.devices.find(d=>d.id==='socket2');
 p.links=p.links.filter(l=>!((l.a===socket.id&&l.portA==='R2')||(l.b===socket.id&&l.portB==='R2')));
 assert.match(networkStatus(p,socket,'F2'),/por identificar/);
 assert.doesNotMatch(networkStatus(p,socket,'F1'),/^Ligação à rede por identificar$/);
});
test('pending ports persist without phantom links and clear when documented',()=>{
 const p=makeExample('connections'),d=p.devices.find(d=>d.id==='mini'),count=p.links.length;d.pendingNetworkPorts=['P4'];normalizeProject(p);validateEquipmentRecords(p);assert.deepEqual(d.pendingNetworkPorts,['P4']);assert.equal(p.links.length,count);
 d.pendingNetworkPorts=['P4','P4'];assert.throws(()=>validateEquipmentRecords(p),/Portas por identificar/);
 d.pendingNetworkPorts=['P4'];p.links.push({id:'pending-done',a:d.id,portA:'P4',b:'socket2',portB:'F2',kind:'copper'});normalizeProject(p);assert.deepEqual(d.pendingNetworkPorts,[]);
});

test('connection action follows power, virtual and data equipment semantics',()=>{
 assert.equal(connectionKind({type:'PDU'}),'power');assert.equal(connectionKind({type:'UPS'}),'power');assert.equal(connectionKind({type:'VM'}),'virtual');assert.equal(connectionKind({type:'Servidor'},'PSU1'),'power');assert.equal(connectionKind({type:'Computador'},'Ethernet1'),'copper');assert.equal(connectionAction({type:'PDU'}),'Ligar alimentação');assert.equal(connectionAction({type:'VM'}),'Ligação virtual');
});
test('outlet labels stay readable beyond 26 channels',()=>{assert.equal(outletName('F1'),'Saída A');assert.equal(outletName('R26'),'Saída Z');assert.equal(outletName('F27'),'Saída AA');assert.equal(outletName('R52'),'Saída AZ');});
