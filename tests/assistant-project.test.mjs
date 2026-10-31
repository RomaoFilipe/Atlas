import test from 'node:test';
import assert from 'node:assert/strict';
import {makeExample} from '../public/examples.js';
import {projectAnswer} from '../public/assistant-project.js';
import {assistantRequestMode} from '../public/assistant-intent.js';
const fixture=()=>{const p=makeExample('connections'),d=p.devices.find(d=>d.name==='POSTO-01');d.record={...d.record,serial:'SER-DEMO-001',nextMaintenance:'2026-10-20',replacementDate:'2026-12-01'};return {p,d};};
test('project questions answer exact inventory counts by room and preserve all project data',()=>{
 const {p,d}=fixture(),before=JSON.stringify(p),roomId=d.room;
 for(const prompt of ['Quantos equipamentos há no projeto?','Quantos switches existem?','Quantas salas há?']){const result=projectAnswer(p,{},prompt);assert.equal(result.source,'project');assert.equal(result.mode,'advice');assert.equal(result.actions,undefined);assert.equal(assistantRequestMode('configure',prompt),'advice');}
 const answer=projectAnswer(p,{roomId},'Quantos equipamentos há nesta sala?');assert.ok(answer.reply.includes(p.devices.filter(x=>x.room===roomId).length+' equipamentos'));assert.equal(JSON.stringify(p),before);
 assert.match(projectAnswer(p,{},'Quantos equipamentos há nesta sala?').reply,/Abre ou seleciona uma sala/);
 assert.equal(projectAnswer(p,{},'Quantos equipamentos há e apaga tudo?'),null);
});
test('local lookup supports IP, serial, accents, ambiguity, no results and mapped targets',()=>{
 const {p,d}=fixture();
 for(const query of [d.name,d.ip,'SER-DEMO-001']){const answer=projectAnswer(p,{},'Onde está '+query+'?');assert.equal(answer.targets[0].id,d.id);assert.ok(answer.reply.includes(d.name));assert.equal(answer.actions,undefined);}
 const revised=structuredClone(p);revised.devices.push({...structuredClone(d),id:'ambiguous',record:{...d.record}});const answer=projectAnswer(revised,{},'Onde está SER-DEMO-001?');assert.equal(answer.targets.length,2);assert.match(answer.reply,/2 resultado/);
 assert.match(projectAnswer(p,{},'Localiza inexistente').reply,/Não encontrei/);
});
test('maintenance uses a fixed date, scope and retirement, with separate replacement and overdue queries',()=>{
 const {p,d}=fixture(),today='2026-10-29',options={today};
 let result=projectAnswer(p,{},'Que manutenções estão pendentes?',options);assert.ok(result.reply.includes(d.name));assert.ok(result.targets.some(t=>t.id===d.id));
 result=projectAnswer(p,{},'Quais substituições estão vencidas?',options);assert.ok(!result.targets.some(t=>t.id===d.id));
 result=projectAnswer(p,{roomId:d.room},'Quais revisões estão vencidas nesta sala?',options);assert.ok(result.targets.some(t=>t.id===d.id));
 d.record.state='Abatido';assert.ok(!projectAnswer(p,{},'Que manutenções estão pendentes?',options).targets.some(t=>t.id===d.id));
});
test('selected equipment summary is based on documented state and never asserts live connectivity',()=>{
 const {p,d}=fixture();assert.match(projectAnswer(p,{},'Resume o equipamento selecionado').reply,/Seleciona/);
 const answer=projectAnswer(p,{selected:{type:'devices',id:d.id}},'Resume o equipamento selecionado');assert.match(answer.reply,/não confirmam o funcionamento real/);assert.ok(answer.reply.includes('2026-10-20'));assert.equal(answer.targets[0].id,d.id);
 assert.equal(projectAnswer(p,{},'Cria três servidores'),null);assert.equal(projectAnswer(p,{},'Como documentar uma sala?'),null);
});
test('result lists are bounded and hostile names remain plain text data',()=>{
 const {p,d}=fixture();for(let i=0;i<20;i++)p.devices.push({...structuredClone(d),id:'extra_'+i,name:'PC <img onerror=alert(1)> '+i});
 const result=projectAnswer(p,{},'Procura PC <img');assert.equal(result.targets.length,8);assert.match(result.reply,/primeiros 8/);
});
