import test from 'node:test';import assert from 'node:assert/strict';
import {normalizeProject,validate,clone} from '../public/model.js';
import {assistantContext,executeAssistantActions} from '../public/assistant-actions.js';
import {localConfiguration} from '../public/assistant-local-actions.js';
import {officeExample} from '../public/assistant-office.js';
import {validateAssistantActions} from '../public/assistant-protocol.js';
const fixture=()=>normalizeProject({version:3,name:'Teste',sites:[{id:'s',name:'Sede',sub:'',x:0,z:0,w:30,d:30}],floors:[{id:'f',site:'s',name:'Piso 0',level:0,elevation:0}],rooms:[{id:'r',name:'Sala',floor:'f',x:0,z:0,w:12,d:10}],devices:[],racks:[],links:[],nets:[],templates:[]});
const execute=(p,prompt)=>{const snap=assistantContext(p,{roomId:'r'},prompt),plan=localConfiguration(prompt,snap);assert.ok(plan);return executeAssistantActions(p,plan.actions,snap);};
const equipped=()=>execute(fixture(),officeExample).project;
const addressing='Usa a rede 192.168.10.0/24, reserva o gateway .1 e atribui IPs aos computadores sem repetir endereços.';
const repair='Revê esta sala e completa as ligações que faltam, usando as portas livres.';
test('bulk allocation reserves gateway/network/broadcast, assigns only computers and is idempotent',()=>{
 const p=equipped(),before=JSON.stringify(p),r=execute(p,addressing),computers=r.project.devices.filter(d=>d.type==='Computador');assert.equal(JSON.stringify(p),before);assert.equal(new Set(computers.map(d=>d.ip)).size,20);assert.ok(computers.every(d=>d.gateway==='192.168.10.1'&&d.ip!=='192.168.10.1'));assert.equal(r.project.devices.find(d=>d.type==='Impressora').ip,'');validate(r.project);assert.equal(execute(r.project,addressing).changed,false);
});
test('allocation preserves existing valid addresses, skips other devices and rejects exhausted ranges atomically',()=>{
 const p=equipped(),pcs=p.devices.filter(d=>d.type==='Computador'),printer=p.devices.find(d=>d.type==='Impressora');pcs[0].ip='192.168.10.20';printer.ip='192.168.10.2';const r=execute(p,addressing);assert.equal(r.project.devices.find(d=>d.id===pcs[0].id).ip,'192.168.10.20');assert.equal(r.project.devices.find(d=>d.id===printer.id).ip,'192.168.10.2');assert.ok(!r.project.devices.filter(d=>d.type==='Computador').some(d=>d.ip==='192.168.10.2'));const before=JSON.stringify(p);assert.throws(()=>execute(p,addressing.replace('/24','/30')),/suficientes|sub-rede/);assert.equal(JSON.stringify(p),before);
});
test('existing addresses or gateway conflicts cannot be silently replaced and model injection is rejected',()=>{
 const p=equipped(),pc=p.devices.find(d=>d.type==='Computador');pc.ip='10.0.0.2';assert.throws(()=>execute(p,addressing),/sub-rede/);pc.ip='192.168.10.1';assert.throws(()=>execute(p,addressing),/gateway/);pc.ip='';pc.gateway='192.168.10.254';assert.throws(()=>execute(p,addressing),/outro gateway/);
 const snap=assistantContext(p,{roomId:'r'},addressing),plan=localConfiguration(addressing,snap);assert.throws(()=>validateAssistantActions(plan.actions),/não permitida/);plan.actions[0].subnet='10.0.0.0/24';assert.throws(()=>executeAssistantActions(p,plan.actions,snap),/exatamente/);
});
test('address domains are respected and first-address requests stay in the supplied range',()=>{
 const p=equipped();p.sites[0].branch={country:'PT',unit:'LIS',city:'Lisboa',timezone:'Europe/Lisbon',contact:'',networkDomain:'A'};p.sites.push({id:'other',name:'Outro',sub:'',x:80,z:0,w:20,d:20,branch:{country:'PT',unit:'POR',city:'Porto',timezone:'Europe/Lisbon',contact:'',networkDomain:'B'}});const other=clone(p.devices.find(d=>d.type==='Computador'));Object.assign(other,{id:'other-pc',site:'other',floor:'',room:'',x:80,z:0,ip:'192.168.10.10'});p.devices.push(other);
 const r=execute(p,addressing.replace(' sem repetir',' a partir de .10 sem repetir'));assert.ok(r.project.devices.some(d=>d.site==='s'&&d.ip==='192.168.10.10'));validate(r.project);assert.throws(()=>execute(p,addressing.replace('gateway .1','gateway .999')),/octeto/);
});
test('repair reuses a pre-wired patch channel and preserves all existing confirmed cabling',()=>{
 const p=equipped(),socket=p.devices.find(d=>d.type==='Tomada de rede'),rear=p.links.find(l=>l.a===socket.id&&l.portA==='R1');assert.ok(rear);p.links=p.links.filter(l=>l.id!==rear.id);const before=JSON.stringify(p),ids=p.links.map(l=>l.id);const r=execute(p,repair);assert.equal(JSON.stringify(p),before);assert.equal(r.project.links.length,p.links.length+1);for(const id of ids)assert.ok(r.project.links.some(l=>l.id===id));assert.equal(r.reviews[0].connected,21);assert.equal(execute(r.project,repair).changed,false);
});
test('repair cannot steal a proposed port or create equipment and can use a local switch directly',()=>{
 const p=equipped(),pc=p.devices.find(d=>d.type==='Computador'),link=p.links.find(l=>l.a===pc.id);p.links=p.links.filter(l=>l.id!==link.id);p.connectionProposals=[{id:'reserved',a:link.a,b:link.b,portA:link.portA,portB:link.portB,kind:link.kind}];const r=execute(p,repair);assert.equal(r.project.devices.length,p.devices.length);assert.equal(r.project.links.length,p.links.length);assert.deepEqual(r.project.connectionProposals,p.connectionProposals);assert.equal(r.reviews[0].connected,20);
 const direct=equipped();direct.links=[];direct.devices=direct.devices.filter(d=>['Switch','Computador'].includes(d.type));const connected=execute(direct,repair);assert.equal(connected.reviews[0].connected,20);assert.equal(connected.project.links.length,20);direct.devices.find(d=>d.type==='Switch').record={state:'Abatido'};const retired=execute(direct,repair);assert.equal(retired.project.links.length,0);assert.equal(retired.reviews[0].connected,0);
});
