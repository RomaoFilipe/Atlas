import test from 'node:test';
import assert from 'node:assert/strict';
import {assistantContext,executeAssistantActions} from '../public/assistant-actions.js';
import {localConfiguration} from '../public/assistant-local-actions.js';
import {normalizeProject,validate} from '../public/model.js';
const empty=()=>normalizeProject({version:3,name:'Autonomia',sites:[],floors:[],rooms:[],racks:[],devices:[],links:[],nets:[],templates:[]});
const run=(p,prompt,state={})=>{const snap=assistantContext(p,state,prompt),plan=localConfiguration(prompt,snap);assert.ok(plan);return executeAssistantActions(p,plan.actions,snap);};
const structure='Cria um edifício chamado "Sede" com um piso chamado "Piso 0" e uma sala chamada "Sala TI" de 12 por 10 metros';
const infrastructure=structure+'; Equipa a sala "Sala TI" com 2 postos de trabalho e 2 tomadas de rede; Cria um bastidor chamado "RACK-01" de 24 U na sala "Sala TI"; Adiciona 1 switch chamado "SW-01" com 24 portas na sala "Sala TI"; Adiciona 1 patch panel chamado "PP-01" com 24 portas na sala "Sala TI"; Adiciona 1 PDU chamada "PDU-01" com 8 portas na sala "Sala TI"; Instala os equipamentos livres da sala "Sala TI" no bastidor "RACK-01"; Liga à rede os equipamentos da sala "Sala TI" usando as portas livres; Alimenta os equipamentos ativos do bastidor "RACK-01" usando a PDU "PDU-01"';
test('one autonomous task creates dependent spaces, equips, mounts and cables using newly created references',()=>{
 const p=empty(),before=JSON.stringify(p),r=run(p,infrastructure);assert.equal(JSON.stringify(p),before);assert.equal(r.project.devices.length,7);assert.equal(r.project.racks.length,1);assert.equal(r.project.devices.filter(d=>d.rack).length,3);assert.equal(r.project.links.filter(l=>l.kind==='copper').length,6);assert.equal(r.project.links.filter(l=>l.kind==='power').length,1);validate(r.project);
});
test('bulk room VLAN can reference a VLAN created in an earlier step and preserves end addresses',()=>{
 let p=run(empty(),structure+'; Equipa a sala "Sala TI" com 2 postos de trabalho').project;p.devices[0].ip='192.0.2.1';const r=run(p,'Cria a VLAN 140 com o nome Equipa; Atribui a VLAN 140 a todos os equipamentos da sala "Sala TI".');assert.ok(r.project.devices.every(d=>d.vlan===140));assert.equal(r.project.devices[0].ip,'192.0.2.1');assert.equal(p.devices[0].vlan,0);
});
test('saving and applying a room template in one batch strips identities and preserves source objects',()=>{
 let p=run(empty(),structure+'; Equipa a sala "Sala TI" com 1 posto de trabalho').project;p.sites[0].w=40;p.sites[0].d=40;p.devices[0].record={owner:'PRIVATE',serial:'PRIVATE'};p.devices[0].ip='192.0.2.1';const source=JSON.stringify(p.rooms[0]);const r=run(p,'Guarda a sala "Sala TI" como modelo chamado "Modelo TI"; Aplica o modelo "Modelo TI" no piso "Piso 0" com o nome "Sala Nova".');assert.equal(r.project.templates.length,1);assert.equal(r.project.rooms.length,2);assert.equal(JSON.stringify(r.project.rooms[0]),source);const copy=r.project.devices.find(d=>d.room!==p.rooms[0].id);assert.equal(copy.ip,'');assert.equal(copy.record,undefined);assert.ok(!JSON.stringify(r.project.templates[0]).includes('PRIVATE'));
});
test('room duplication creates proposals and distinct placements without copying identity or IP',()=>{
 const p=run(empty(),infrastructure).project;p.sites[0].w=40;p.sites[0].d=40;p.devices[0].record={owner:'PRIVATE'};p.devices[0].ip='192.0.2.1';const r=run(p,'Duplica a sala "Sala TI" com o nome "Sala Nova".');assert.equal(r.project.rooms.length,2);assert.equal(r.project.links.length,p.links.length);assert.equal(r.project.connectionProposals.length,p.links.length);const added=r.project.devices.filter(d=>!p.devices.some(x=>x.id===d.id));assert.equal(added.length,p.devices.length);assert.ok(added.every(d=>!d.ip&&!d.record));assert.notEqual(r.project.rooms[1].x+','+r.project.rooms[1].z,p.rooms[0].x+','+p.rooms[0].z);validate(r.project);
});
test('capacity, locks and total budgets reject an entire autonomous task',()=>{
 const p=empty(),before=JSON.stringify(p);assert.throws(()=>run(p,infrastructure.replace('de 24 U','de 4 U').replace('1 switch','3 switches')),/unidades U|ocupad|capacidade/);assert.equal(JSON.stringify(p),before);
 assert.throws(()=>run(p,structure+'; Equipa a sala "Sala TI" com 20 postos de trabalho, 20 telefones IP e 20 tomadas de rede'),/50 equipamentos/);assert.equal(JSON.stringify(p),before);
 const populated=run(empty(),structure).project;populated.rooms[0].layoutLocked=true;assert.throws(()=>run(populated,'Equipa a sala "Sala TI" com 1 impressora.'),/protegida/);
});
test('insufficient PDU outlets roll back the whole batch and existing power cables are preserved',()=>{
 let p=run(empty(),infrastructure).project;const room=p.rooms[0];p=run(p,'Adiciona 1 servidor chamado "HOST" na sala "Sala TI"; Instala os equipamentos livres da sala "Sala TI" no bastidor "RACK-01".').project;const pdu=p.devices.find(d=>d.type==='PDU');pdu.portCount=1;const before=JSON.stringify(p);assert.throws(()=>run(p,'Alimenta os equipamentos ativos do bastidor "RACK-01" usando a PDU "PDU-01".'),/tomadas livres/);assert.equal(JSON.stringify(p),before);pdu.portCount=8;const original=p.links.find(l=>l.kind==='power');const r=run(p,'Alimenta os equipamentos ativos do bastidor "RACK-01" usando a PDU "PDU-01".');assert.ok(r.project.links.some(l=>l.id===original.id));assert.equal(r.project.links.filter(l=>l.kind==='power').length,2);
});
test('quantities in Portuguese are supported and excluded equipment is rejected for model macros',async()=>{
 const p=run(empty(),structure).project,r=run(p,'Equipa a sala "Sala TI" com dois postos e uma impressora.');assert.equal(r.project.devices.length,3);
 const {validateAssistantIntent,validateAssistantActions}=await import('../public/assistant-protocol.js');assert.throws(()=>validateAssistantActions([{action:'equip_room',room:'room_1',workstations:1,monitors:0}]),/número inválido/);assert.throws(()=>validateAssistantIntent([{action:'equip_room',phones:2}],'Equipa a sala sem telefones nem tomadas novas.'),/excluiu/);assert.throws(()=>validateAssistantIntent([{action:'equip_room',sockets:2}],'Equipa a sala sem telefones nem tomadas novas.'),/excluiu/);
});
