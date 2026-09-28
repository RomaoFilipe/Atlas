import test from 'node:test';
import assert from 'node:assert/strict';
import {makeExample,exampleCatalog} from '../public/examples.js';
import {validate,worldPosition} from '../public/model.js';
import {auditProject,traceNetwork,portsFor,simulateFailure} from '../public/network.js';
import {workstationInfo,cableCircuit} from '../public/workstations.js';
import {specs,endpointTypes} from '../public/equipment.js';
import {makePlan} from '../public/plan.js';

test('municipal example has a complete, editable and valid departmental inventory',()=>{
 const p=makeExample('municipal');validate(p);
 assert.equal(p.sites.length,3);assert.equal(p.floors.length,5);assert.equal(p.racks.length,6);
 const desks=p.devices.filter(d=>d.type==='Posto de trabalho'),phones=p.devices.filter(d=>d.type==='Telefone IP');
 assert.equal(desks.length,24);assert.equal(phones.length,24);assert.equal(new Set(desks.map(d=>d.specs.department)).size,12);
 assert.equal(p.devices.filter(d=>d.type==='Impressora').length,12);
 assert.equal(new Set(phones.map(d=>d.specs.extension)).size,24);
 assert.deepEqual(auditProject(p),[]);
 for(const d of desks){
  const phone=phones.find(t=>t.specs.workstation===d.specs.workstation),info=workstationInfo(p,d.id);
  assert(phone);assert.equal(phone.room,d.room);assert(d.specs.phone.includes(phone.specs.extension));
  assert.equal(d.monitors,2);assert(d.specs.computer);assert(d.specs.screens);assert(d.specs.powerSource);
  assert.equal(info.sockets.length,1);assert.equal(info.panels.length,1);assert.equal(info.switches.length,1);
  const pcRoute=cableCircuit(p,'TERMINAL-'+d.id),phoneRoute=cableCircuit(p,'TERMINAL-'+phone.id);
  assert.equal(pcRoute.links.length,3);assert.equal(phoneRoute.links.length,3);assert(!pcRoute.devices.includes(phone.id));
  assert(traceNetwork(p,d.id,'municipal-apps').devices.includes('core'));
  assert(traceNetwork(p,phone.id,'pbx').devices.includes('core'));
 }
 for(const d of p.devices.filter(d=>d.type==='Impressora')){assert.equal(workstationInfo(p,d.id).sockets.length,1);assert(traceNetwork(p,d.id,'files').devices.length);}
 for(const d of p.devices.filter(d=>d.rack&&!['UPS','PDU','Patch panel'].includes(d.type)))assert(p.links.some(l=>l.kind==='power'&&l.b===d.id));
 for(const d of p.devices.filter(d=>!d.rack&&d.type!=='VM')){const s=p.sites.find(s=>s.id===d.site),pos=worldPosition(p,d);assert(Math.abs(pos.x-s.x)<s.w/2);assert(Math.abs(pos.z-s.z)<s.d/2);}
});
test('municipal fibre break isolates only that access building and leaves the PBX reachable elsewhere',()=>{
 const p=makeExample('municipal'),result=simulateFailure(p,'pbx',[],['FIBRA-oficinas-0']);
 assert(result.lost.includes('posto-19'));assert(result.lost.includes('telefone-19'));
 assert(!result.lost.includes('posto-01'));assert(!result.lost.includes('posto-23'));
});
test('telephone supports typed editing, data port and per-floor plan symbol',()=>{
 const p=makeExample('municipal'),phone=p.devices.find(d=>d.type==='Telefone IP');
 assert(endpointTypes.includes(phone.type));assert(specs[phone.type].some(([key])=>key==='extension'));
 assert.deepEqual(portsFor(p,phone),['Ethernet1']);
 const svg=makePlan({project:p,floorId:'pacos-0'});assert(svg.includes('TEL-01'));assert(!svg.includes('TEL-07'));
 const entry=exampleCatalog.find(e=>e.id==='municipal');assert.equal(entry.initialView,'plan');assert(p.floors.some(f=>f.id===entry.initialFloor));
});
