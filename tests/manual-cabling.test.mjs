import test from 'node:test';
import assert from 'node:assert/strict';
import {makeExample} from '../public/examples.js';
import {clone,validate} from '../public/model.js';
import {createManualCable,manualPorts,manualPortState} from '../public/manual-cabling.js';
import {interfaceProfile} from '../public/physical-network.js';
import {traceNetwork} from '../public/network.js';
import {planConnectionPoint} from '../public/connection-anchors.js';
import {makePlan} from '../public/plan.js';
const endpoint=(device,port)=>({device,port});
function fixture(){const p=makeExample('connections');p.links=p.links.filter(l=>!['POSTO-1','HORIZONTAL-1','PATCH-1'].includes(l.id));return p;}
test('manual patching creates the exact PC, outlet, panel and switch circuit',()=>{
 const p=fixture();const one=createManualCable(p,'cat6',endpoint('pc1','Ethernet1'),endpoint('socket1','F1')),two=createManualCable(p,'cat6a',endpoint('socket1','R1'),endpoint('panel0','R1')),three=createManualCable(p,'cat5e',endpoint('panel0','F1'),endpoint('sw0','Gi1/0/1'));validate(p);
 assert.equal(one.category,'Cat 6');assert.equal(two.installation,'permanent');assert.equal(three.category,'Cat 5e');assert.deepEqual(traceNetwork(p,'pc1','sw0').links,[one.id,two.id,three.id]);assert.equal(new Set([one.label,two.label,three.label]).size,3);
});
test('occupied ports, incompatible media and wrong power directions reject atomically',()=>{
 const p=fixture(),before=JSON.stringify(p),pc=p.devices.find(d=>d.id==='pc1');assert.throws(()=>createManualCable(p,'os2',endpoint('pc1','Ethernet1'),endpoint('socket1','F1')),/incompatível/);assert.equal(JSON.stringify(p),before);
 createManualCable(p,'cat6',endpoint('pc1','Ethernet1'),endpoint('socket1','F1'));const snapshot=JSON.stringify(p);assert.throws(()=>createManualCable(p,'cat6',endpoint('pc1','Ethernet1'),endpoint('socket1','F2')),/ocupada/);assert.equal(JSON.stringify(p),snapshot);
 assert.throws(()=>createManualCable(p,'power',endpoint('pc1','PSU1'),endpoint('mini','PSU1')),/saída OUT/);assert(!manualPorts(p,pc,'cat6').some(p=>p.startsWith('PSU')));assert.deepEqual(manualPorts(p,pc,'power'),['PSU1']);
});
test('power preserves the selected PDU outlet and device input, regardless of click order',()=>{const p=fixture(),l=createManualCable(p,'power',endpoint('pc1','PSU1'),endpoint('pdu','OUT4'));assert.equal(l.kind,'power');assert.equal(l.portA,'PSU1');assert.equal(l.portB,'OUT4');assert.deepEqual(l.vlans,[]);});
test('explicit fibre interfaces accept OS2 while RJ45 ports reject it',()=>{
 const p=fixture(),d=p.devices.find(d=>d.id==='sw0'),{documented,...profile}=interfaceProfile(d,'Gi1/0/1');d.portProfiles=[{...profile,medium:'fiber'}];assert.equal(manualPortState(p,d,'Gi1/0/1','cat6').ok,false);const l=createManualCable(p,'os2',endpoint('sw0','Gi1/0/1'),endpoint('fw0','P2'));assert.equal(l.category,'OS2');assert.equal(l.speed,'');
});
test('a physical patch can be documented on a shutdown interface with an explicit warning',()=>{
 const p=fixture(),d=p.devices.find(d=>d.id==='pc1'),{documented,...profile}=interfaceProfile(d,'Ethernet1');d.portProfiles=[{...profile,adminUp:false,medium:'copper'}];const state=manualPortState(p,d,'Ethernet1','cat6');assert(state.ok);assert(state.reason.includes('shutdown'));assert.equal(manualPortState(p,d,'Ethernet1','os2').ok,false);createManualCable(p,'cat6',endpoint('pc1','Ethernet1'),endpoint('socket1','F1'));
});
test('socket anchors and existing SVG plugs follow movement, rotation and desk scaling',()=>{
 const p=fixture(),d=p.devices.find(d=>d.id==='pc1');const l=createManualCable(p,'cat6',endpoint('pc1','Ethernet1'),endpoint('socket1','F1')),initial=planConnectionPoint(p,d,'Ethernet1');d.x+=2;const moved=planConnectionPoint(p,d,'Ethernet1');assert.equal(moved.x-initial.x,2);d.rotation=90;const rotated=planConnectionPoint(p,d,'Ethernet1');assert.notEqual(rotated.z,moved.z);const svg=makePlan({project:p,floorId:d.floor,selectedLink:l.id,ports:true,cabling:'copper'});assert(svg.includes('manual-port-markers'));assert(svg.includes('data-network-port="Ethernet1"'));assert(svg.includes('data-network-port="R1"'));assert(svg.includes('width="6" height="8"'));assert.equal(p.links.find(x=>x.id===l.id).a,d.id);
});
