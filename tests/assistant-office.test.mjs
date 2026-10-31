import test from 'node:test';
import assert from 'node:assert/strict';
import {officeExample,officeReview,parseOfficeRequest} from '../public/assistant-office.js';
import {assistantContext,executeAssistantActions} from '../public/assistant-actions.js';
import {localConfiguration} from '../public/assistant-local-actions.js';
import {normalizeProject,validate} from '../public/model.js';
import {validateAssistantActions} from '../public/assistant-protocol.js';
import {floorFootprint} from '../public/move-alignment.js';
const fixture=(w=12,d=10)=>normalizeProject({version:3,name:'Teste',sites:[{id:'s',name:'Sede',sub:'',x:0,z:0,w:30,d:30}],floors:[{id:'f',site:'s',name:'Piso 0',level:0,elevation:0}],rooms:[{id:'r',name:'Escritório',floor:'f',x:0,z:0,w,d}],devices:[],racks:[],links:[],nets:[],templates:[]});
const run=(p,prompt=officeExample,state={roomId:'r'})=>{const snap=assistantContext(p,state,prompt),plan=localConfiguration(prompt,snap);assert.ok(plan);return executeAssistantActions(p,plan.actions,snap);};
test('the exact 20-person request builds the complete documented office and verifies every endpoint',()=>{
 const p=fixture(),before=JSON.stringify(p),r=run(p);assert.equal(JSON.stringify(p),before);
 const count=type=>r.project.devices.filter(d=>d.type===type).length;assert.equal(count('Computador'),20);assert.equal(count('Impressora'),1);assert.equal(count('Tomada de rede'),11);assert.equal(count('Switch'),1);assert.equal(count('Patch panel'),1);assert.equal(r.project.racks.length,1);assert.equal(r.project.links.length,63);assert.equal(r.reviews[0].connected,21);assert.equal(r.reviews[0].endpoints,21);assert.equal(r.reviews[0].missingIP,21);assert.equal(r.reviews[0].missingVLAN,21);assert.equal(r.reviews[0].upstream,false);assert.match(r.reviews[0].text,/por documentar/);assert.ok(r.project.devices.every(d=>!d.ip&&!d.gateway&&!d.vlan));assert.equal(r.project.nets.length,0);validate(r.project);
 const rack=r.project.racks[0];for(const d of r.project.devices.filter(d=>!d.rack&&d.type==='Computador')){const b=floorFootprint(d);assert.ok(!(Math.min(b.maxX,rack.x+.69)-Math.max(b.minX,rack.x-.69)>.03&&Math.min(b.maxZ,rack.z+.625)-Math.max(b.minZ,rack.z-.625)>.03));}
});
test('repeating the same goal reuses the inventory and produces no new project change',()=>{
 const first=run(fixture()),before=JSON.stringify(first.project),again=run(first.project);assert.equal(again.changed,false);assert.equal(JSON.stringify(again.project),before);assert.equal(again.reviews[0].connected,21);
});
test('existing computers, printer, sockets and rack are preserved while increasing capacity',()=>{
 const first=run(fixture(),officeExample.replace('20 pessoas','5 pessoas')),ids=first.project.devices.map(d=>d.id),r=run(first.project);assert.equal(r.project.devices.filter(d=>d.type==='Computador').length,20);assert.equal(r.project.devices.filter(d=>d.type==='Impressora').length,1);assert.equal(r.project.racks.length,1);for(const id of ids)assert.ok(r.project.devices.some(d=>d.id===id));assert.equal(r.reviews[0].connected,21);
});
test('insufficient room, a lock or invalid goal never partially changes the project',()=>{
 const p=fixture(2,2),before=JSON.stringify(p);assert.throws(()=>run(p),/espaço/);assert.equal(JSON.stringify(p),before);
 const locked=fixture();locked.rooms[0].layoutLocked=true;assert.throws(()=>run(locked),/protegida/);assert.equal(locked.devices.length,0);
 assert.throws(()=>run(fixture(),officeExample.replace('20 pessoas','99 pessoas')),/1 e 30/);
 assert.throws(()=>validateAssistantActions([{action:'prepare_office',room:'room_1',people:20,printer:'yes'}]),/opção inválida/);
});
test('the high-level parser handles the full request and never silently discards extra instructions',()=>{
 assert.equal(parseOfficeRequest(officeExample).people,20);assert.equal(parseOfficeRequest(officeExample.replace('20','vinte')).people,20);
 assert.equal(parseOfficeRequest(officeExample+' Apaga o projeto.'),null);assert.equal(parseOfficeRequest('Como preparar este escritório para 20 pessoas?'),null);assert.equal(parseOfficeRequest(officeExample.replace('computadores, impressora','computadores, 3 impressoras')),null);
 assert.throws(()=>run(fixture(),officeExample,{}),/Não identifiquei a sala/);
});
test('review checks actual paths and proposals, not just the existence of a cable',()=>{
 const first=run(fixture()),p=structuredClone(first.project),pc=p.devices.find(d=>d.type==='Computador'),link=p.links.find(l=>l.a===pc.id||l.b===pc.id);p.links=p.links.filter(l=>l.id!==link.id);p.connectionProposals=[{id:'pending',a:link.a,b:link.b,portA:link.portA,portB:link.portB,kind:link.kind}];
 const review=officeReview(p,'r');assert.equal(review.connected,20);assert.equal(review.pendingProposals,1);assert.match(review.text,/sem percurso/);
});
