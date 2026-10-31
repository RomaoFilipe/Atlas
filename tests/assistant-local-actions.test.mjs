import test from 'node:test';
import assert from 'node:assert/strict';
import {localConfiguration,configurationCommands} from '../public/assistant-local-actions.js';
import {assistantContext,executeAssistantActions} from '../public/assistant-actions.js';
import {validateAssistantActions,assistantResponseSchema} from '../public/assistant-protocol.js';
import {makeExample} from '../public/examples.js';
import {normalizeProject,validate} from '../public/model.js';
const fixture=()=>{const p=makeExample('connections');const d=p.devices.find(x=>x.name==='POSTO-01');return {p,d,state:{roomId:d.room,floorId:d.floor,selected:{type:'devices',id:d.id}}};};
const run=(p,state,prompt)=>{const snap=assistantContext(p,state,prompt),plan=localConfiguration(prompt,snap);assert.ok(plan,'Comando não reconhecido: '+prompt);return executeAssistantActions(p,plan.actions,snap);};
test('local commands fill equipment records, calendar and interventions, preserving existing fields',()=>{
 const {p,d,state}=fixture(),before=JSON.stringify(p),prompt='Define o responsável do equipamento selecionado como "Equipa TI"; Define o estado do equipamento selecionado como "em manutenção"; Agenda a próxima revisão do equipamento selecionado para 2026-12-01; Regista uma intervenção no equipamento selecionado com o título "Verificação; limpeza" na data 2026-10-29 pelo técnico "Ana" com notas "Concluída".';
 const result=run(p,state,prompt),next=result.project.devices.find(x=>x.id===d.id);assert.equal(next.record.owner,'Equipa TI');assert.equal(next.record.state,'Em manutenção');assert.equal(next.record.nextMaintenance,'2026-12-01');assert.equal(next.record.serial,d.record.serial);assert.equal(next.interventions.at(-1).notes,'Concluída');assert.equal(next.interventions.at(-1).technician,'Ana');assert.equal(next.interventions.length,(d.interventions?.length||0)+1);assert.equal(JSON.stringify(p),before);validate(result.project);
});
test('network values are literal and local; model proposals cannot inject or substitute them',()=>{
 const {p,d,state}=fixture(),prompt='Define o IP do equipamento selecionado como 192.0.2.10; Define o gateway do equipamento selecionado como 192.0.2.1; Define a sub-rede da VLAN 30 como 192.0.2.0/24.';
 const snap=assistantContext(p,state,prompt),plan=localConfiguration(prompt,snap),result=executeAssistantActions(p,plan.actions,snap);assert.equal(result.project.devices.find(x=>x.id===d.id).ip,'192.0.2.10');assert.equal(result.project.nets.find(x=>x.id===30).subnet,'192.0.2.0/24');
 assert.throws(()=>validateAssistantActions(plan.actions),/não permitida/);const forged=structuredClone(plan.actions);forged[0].ip='192.0.2.99';assert.throws(()=>executeAssistantActions(p,forged,snap),/exatamente/);
 assert.ok(!JSON.stringify(assistantResponseSchema).includes('set_device_network'));
});
test('invalid dates and duplicate IPs reject the entire batch, including preceding valid fields',()=>{
 const {p,d,state}=fixture(),before=JSON.stringify(p),duplicate=p.devices.find(x=>x.id!==d.id&&x.ip)?.ip;assert.ok(duplicate);
 for(const tail of ['Agenda a próxima revisão do equipamento selecionado para 2026-02-30.','Define o IP do equipamento selecionado como '+duplicate+'.']){
 assert.throws(()=>run(p,state,'Define o responsável do equipamento selecionado como "Novo"; '+tail),/Ficha|IP repetido/);assert.equal(JSON.stringify(p),before);
 }
});
test('creation commands insert dependent spaces, named switches, racks and virtual machines',()=>{
 let p=normalizeProject({version:3,name:'Projeto',sites:[],floors:[],rooms:[],racks:[],devices:[],links:[],nets:[],templates:[]});
 p=run(p,{},configurationCommands.find(c=>c.label==='Criar estrutura completa').prompt).project;assert.equal(p.rooms[0].w,10);assert.equal(p.rooms[0].d,8);const state={roomId:p.rooms[0].id,floorId:p.floors[0].id};
 p=run(p,state,'Adiciona 1 switch chamado "SW-01" com 24 portas na sala atual.').project;assert.equal(p.devices[0].portCount,24);
 p=run(p,state,'Cria um bastidor chamado "RACK-01" de 24 U na sala atual.').project;assert.equal(p.racks[0].units,24);
 p=run(p,state,'Adiciona 1 servidor chamado "HOST-01" na sala atual.').project;const host=p.devices.find(d=>d.name==='HOST-01');
 p=run(p,{...state,selected:{type:'devices',id:host.id}},'Cria uma VM chamada "VM-01" no servidor selecionado.').project;const vm=p.devices.find(d=>d.name==='VM-01');assert.equal(vm.host,host.id);assert.equal(vm.rack,'');assert.equal(vm.site,host.site);validate(p);
});
test('selected building and floor resolve without silently creating missing parents',()=>{
 const {p,state}=fixture();const result=run(p,state,'Cria um piso chamado "Piso Extra" no edifício atual no nível 2.');const floor=result.project.floors.find(f=>f.name==='Piso Extra');assert.equal(floor.level,2);assert.equal(floor.site,p.floors.find(f=>f.id===state.floorId).site);
 const roomResult=run(result.project,{floorId:floor.id},'Cria uma sala chamada "Apoio" de 6 por 5 metros no piso atual.');assert.equal(roomResult.project.rooms.find(r=>r.name==='Apoio').floor,floor.id);
 assert.throws(()=>run(p,{},'Cria um bastidor chamado "R" de 24 U na sala atual.'),/Não identifiquei/);
});
test('ambiguity, help questions and unknown batch steps never apply partial actions',()=>{
 const {p,d,state}=fixture();assert.equal(localConfiguration('Como definir o responsável?',assistantContext(p,state)),null);
 assert.throws(()=>run(p,state,'Define o responsável do equipamento selecionado como "Novo"; Apaga tudo.'),/Nada foi aplicado/);
 const duplicate=structuredClone(d);duplicate.id='duplicate';p.devices.push(duplicate);const prompt='Define o responsável do equipamento "POSTO-01" como "Novo".';assert.throws(()=>run(p,state,prompt),/vários/);
});
test('port reductions protect active and proposed cables and enforce type limits',()=>{
 const {p,state}=fixture(),sw=p.devices.find(d=>d.type==='Mini-switch');assert.ok(sw);
 assert.throws(()=>run(p,state,'Adiciona 1 computador chamado "PC-24" com 24 portas na sala atual.'),/uma porta/);
 const before=JSON.stringify(p),prompt='Configura "'+sw.name+'" com 1 portas.';assert.throws(()=>run(p,state,prompt),/porta|mini-switch/);assert.equal(JSON.stringify(p),before);
 p.connectionProposals=[{id:'reserved',a:sw.id,b:p.devices.find(d=>d.id!==sw.id).id,portA:'P5',portB:'TEST',kind:'copper'}];
 assert.throws(()=>run(p,state,'Configura "'+sw.name+'" com 4 portas.'),/reservada/);
 assert.throws(()=>run(p,state,'Configura "'+sw.name+'" com 20 portas.'),/mini-switch/);
});
test('power actions select free documented ports and reject reused or proposed outlets',()=>{
 let p=makeExample('office');const pdu=p.devices.find(d=>d.type==='PDU'),server=p.devices.find(d=>d.type==='Servidor');assert.ok(pdu&&server);p.links=p.links.filter(l=>l.kind!=='power');const state={selected:{type:'devices',id:server.id}};
 const prompt='Liga a alimentação do equipamento selecionado à PDU "'+pdu.name+'" na tomada 1.';const result=run(p,state,prompt);assert.ok(result.project.links.some(l=>l.kind==='power'&&l.a===pdu.id&&l.portA==='OUT1'&&l.b===server.id));assert.throws(()=>run(result.project,state,prompt),/livres/);
 p.connectionProposals=[{id:'reserved',a:pdu.id,b:server.id,portA:'OUT1',portB:'PSU1',kind:'power'}];assert.throws(()=>run(p,state,prompt),/livres/);
 const nonServer=p.devices.find(d=>d.type==='Switch');assert.throws(()=>run(p,{selected:{type:'devices',id:nonServer.id}},'Cria uma VM chamada "VM" no servidor selecionado.'),/anfitrião/);
});
test('multiple creation commands have distinct references and remain within the action budget',()=>{
 const {p,state}=fixture();const r=run(p,state,'Cria a VLAN 110 com o nome Visitantes; Cria a VLAN 120 com o nome Operações.');assert.ok(r.project.nets.some(n=>n.id===110));assert.ok(r.project.nets.some(n=>n.id===120));
 assert.throws(()=>run(p,state,Array(13).fill('Cria a VLAN 110 com o nome Visitantes').join('; ')),/12 passos/);
});
