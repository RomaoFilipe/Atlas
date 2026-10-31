import {createTaskRunner} from '../public/assistant-task-runner.js';
import {parseBranchRequest,branchExample} from '../public/assistant-branch-request.js';
import {officeExample} from '../public/assistant-office.js';
import {localConfiguration} from '../public/assistant-local-actions.js';
import {dirname} from 'node:path';
import {projectAnswer} from '../public/assistant-project.js';
import {assistantRequestMode} from '../public/assistant-intent.js';
import {makeExample} from '../public/examples.js';
import {Readable} from 'node:stream';
import {mkdir,writeFile} from 'node:fs/promises';
import {cpus,platform,release} from 'node:os';
import {createChatHandler} from './assistant.mjs';
import {assistantContext,executeAssistantActions} from '../public/assistant-actions.js';
import {normalizeProject} from '../public/model.js';
import {knowledgeVersion} from '../public/assistant-knowledge.js';
const base=process.env.ATLAS_OLLAMA_URL||'http://127.0.0.1:11434',model=process.env.ATLAS_OLLAMA_MODEL||'qwen3:14b';
const cases=[
 {id:'help-no-mutation',mode:'configure',prompt:'Como criar um edifício no Atlas?',expected:'advice',terms:['edifício','criar']},
 {id:'backup-keys',mode:'advice',prompt:'Como guardar um backup e restaurar noutra instalação?',expected:'advice',terms:['chave','instala']},
 {id:'create-building',mode:'configure',prompt:'Cria um edifício chamado Sede sem pisos nem salas.',expected:'configure',actions:['create_building']},
 {id:'model-equip-room',mode:'configure',prompt:'Prepara esta sala para um pequeno escritório: insere dois postos de trabalho e uma impressora, sem telefones nem tomadas novas.',expected:'configure',modelOnly:true,project:()=>{const p=normalizeProject({version:3,name:'Avaliação',sites:[{id:'s',name:'Edifício',sub:'',x:0,z:0,w:30,d:30}],floors:[{id:'f',name:'Piso',site:'s',level:0,elevation:0}],rooms:[{id:'r',name:'Sala',floor:'f',x:0,z:0,w:12,d:10}],racks:[],devices:[],links:[],nets:[],templates:[]});return p;},state:{roomId:'r'},check:p=>p.devices.length===3&&p.devices.filter(d=>d.type==='Posto de trabalho').length===2&&p.devices.filter(d=>d.type==='Impressora').length===1&&p.devices.filter(d=>d.type==='Posto de trabalho').every(d=>[1,2].includes(d.monitors))&&p.links.length===0},
 {id:'model-build-spaces',mode:'configure',prompt:'Cria um edifício chamado Polo Norte com um piso chamado Operações e uma sala chamada Apoio de 8 por 6 metros.',expected:'configure',actions:['create_building','create_floor','create_room'],floors:1,rooms:1,modelOnly:true},
 {id:'unsupported-real-network',mode:'advice',prompt:'O Atlas configura automaticamente o meu firewall e garante acesso à Internet?',expected:'advice',terms:['document']}
];
const report={date:new Date().toISOString(),model,knowledgeVersion,environment:{node:process.version,platform:platform(),release:release(),cpu:cpus()[0]?.model},scope:'Projetos sintéticos em memória; sem gravação na instalação. Critérios automáticos não medem toda a qualidade das respostas.',cases:[]};
const destination=process.env.ATLAS_EVAL_OUTPUT||'docs/test-results/assistant-evaluation.json';
const flush=async()=>{await mkdir(dirname(destination),{recursive:true});await writeFile(destination,JSON.stringify(report,null,2)+'\n');};
// Deterministic cases always run, even when Ollama is unavailable.
const sample=makeExample('connections'),device=sample.devices.find(d=>d.name==='POSTO-01');
device.record={...device.record,serial:'EVAL-SERIAL',nextMaintenance:'2026-10-01',replacementDate:'2026-12-01'};
const projectCases=[
 {id:'project-count',prompt:'Quantos equipamentos há no projeto?',terms:[sample.devices.length+' equipamentos']},
 {id:'room-count',prompt:'Quantos equipamentos há nesta sala?',state:{roomId:device.room},terms:[sample.devices.filter(d=>d.room===device.room).length+' equipamentos']},
 {id:'room-missing',prompt:'Quantos equipamentos há nesta sala?',terms:['Abre ou seleciona uma sala']},
 {id:'find-serial',prompt:'Onde está EVAL-SERIAL?',terms:[device.name],target:device.id},
 {id:'find-ip',prompt:'Onde está '+device.ip+'?',terms:[device.name],target:device.id},
 {id:'find-missing',prompt:'Localiza equipamento-inexistente',terms:['Não encontrei']},
 {id:'maintenance-overdue',prompt:'Quais revisões estão vencidas?',terms:[device.name,'2026-10-01'],target:device.id},
 {id:'selected-summary',prompt:'Resume o equipamento selecionado',state:{selected:{type:'devices',id:device.id}},terms:[device.name,'não confirmam o funcionamento real'],target:device.id},
 {id:'pending-documentation',prompt:'O que falta documentar?',terms:['pendência(s) documental(is)']}
];
for(const entry of projectCases){const before=JSON.stringify(sample),start=performance.now(),data=projectAnswer(sample,entry.state,entry.prompt,{today:'2026-10-29'}),checks={answered:!!data,readOnly:data?.mode==='advice'&&!data?.actions?.length,unchanged:before===JSON.stringify(sample),terms:entry.terms.every(term=>data?.reply.includes(term)),intent:assistantRequestMode('configure',entry.prompt)==='advice'};if(entry.target)checks.target=data?.targets.some(t=>t.id===entry.target);const result={id:entry.id,engine:'project',latencyMs:Math.round(performance.now()-start),checks};result.passed=Object.values(checks).every(Boolean);report.cases.push(result);console.log(entry.id+': '+(result.passed?'PASS':'FAIL')+' · '+result.latencyMs+' ms');}
const runHandler=async(handler,entry)=>{
 const project=entry.project?entry.project():normalizeProject({version:3,name:'Avaliação',sites:[],floors:[],rooms:[],racks:[],devices:[],links:[],nets:[],templates:[]}),snapshot=assistantContext(project,entry.state||{},entry.prompt);
 const req=Readable.from([Buffer.from(JSON.stringify({model,mode:entry.mode,context:snapshot.context,messages:[{role:'user',content:entry.prompt}]}))]);req.method='POST';req.headers={'content-type':'application/json'};
 let status,data;const start=performance.now();await handler(req,{writeHead(value){status=value;},end(value){data=JSON.parse(value);}});
 const result={id:entry.id,engine:data?.source||'model',prompt:entry.prompt,status,latencyMs:Math.round(performance.now()-start),response:data,checks:{http:status===200,mode:data.mode===entry.expected}};
 if(entry.expected==='advice'){result.checks.noActions=!data.actions?.length;result.checks.documentation=entry.terms.every(term=>String(data.reply).toLowerCase().includes(term));if(entry.id==='unsupported-real-network'){result.checks.deniesRealConfiguration=/\b(?:não|nunca)\b/iu.test(String(data.reply));result.checks.noHardwareTemplates=!/(?:podes|pode|permite|requer|usa|utiliza).{0,80}(?:templates|modelos)/iu.test(String(data.reply));}}
 else{try{const outcome=executeAssistantActions(project,data.actions,snapshot);result.checks.actions=!entry.actions||JSON.stringify(data.actions.map(a=>a.action))===JSON.stringify(entry.actions);result.checks.result=entry.check?entry.check(outcome.project):outcome.project.sites.length===1&&outcome.project.floors.length===(entry.floors||0)&&outcome.project.rooms.length===(entry.rooms||0);}catch(error){result.checks.result=false;result.validationError=error.message;}}
 result.passed=Object.values(result.checks).every(Boolean);report.cases.push(result);await flush();console.log(entry.id+': '+(result.passed?'PASS':'FAIL')+' · '+result.latencyMs+' ms');
};
// Exercise insertion/configuration through the same parser and atomic executor as the UI.
const localCases=[
 {id:'equip-room-bulk',prompt:'Equipa a sala atual com dois postos e uma impressora.',check:(p,d,before)=>p.devices.length===before.devices.length+3&&p.devices.filter(x=>x.type==='Posto de trabalho').length===before.devices.filter(x=>x.type==='Posto de trabalho').length+2},
 {id:'room-vlan-bulk',prompt:'Atribui a VLAN 30 a todos os equipamentos da sala atual.',check:(p,d)=>p.devices.filter(x=>x.room===d.room).every(x=>x.vlan===30)},
 {id:'save-room-model',prompt:'Guarda a sala atual como modelo chamado "Modelo EVAL".',check:(p,d,before)=>p.templates.length===before.templates.length+1},
 {id:'new-vlan-reference',prompt:'Cria a VLAN 110 com o nome Equipa; Atribui a VLAN 110 a todos os equipamentos da sala atual.',check:(p,d)=>p.nets.some(n=>n.id===110)&&p.devices.filter(x=>x.room===d.room).every(x=>x.vlan===110)},
 {id:'configure-owner',prompt:'Define o responsável do equipamento selecionado como "Equipa sintética".',check:(p,d)=>p.devices.find(x=>x.id===d.id).record.owner==='Equipa sintética'},
 {id:'configure-ip',prompt:'Define o IP do equipamento selecionado como 192.0.2.10.',check:(p,d)=>p.devices.find(x=>x.id===d.id).ip==='192.0.2.10'},
 {id:'configure-review',prompt:'Agenda a próxima revisão do equipamento selecionado para 2026-12-01.',check:(p,d)=>p.devices.find(x=>x.id===d.id).record.nextMaintenance==='2026-12-01'},
 {id:'configure-intervention',prompt:'Regista uma intervenção no equipamento selecionado com o título "Teste sintético" na data 2026-10-29.',check:(p,d)=>p.devices.find(x=>x.id===d.id).interventions.at(-1).title==='Teste sintético'},
 {id:'insert-switch',prompt:'Adiciona 1 switch chamado "SW-EVAL" com 24 portas na sala atual.',check:p=>p.devices.some(x=>x.name==='SW-EVAL'&&x.type==='Switch'&&x.portCount===24)},
 {id:'insert-rack',prompt:'Cria um bastidor chamado "R-EVAL" de 24 U na sala atual.',check:p=>p.racks.some(x=>x.name==='R-EVAL'&&x.units===24)},
 {id:'insert-vm',office:true,prompt:'Cria uma VM chamada "VM-EVAL" no servidor selecionado.',check:(p,d)=>p.devices.some(x=>x.name==='VM-EVAL'&&x.type==='VM'&&x.host===d.id&&!x.rack)},
 {id:'configure-invalid-batch',prompt:'Define o responsável do equipamento selecionado como "Não aplicar"; Agenda a próxima revisão do equipamento selecionado para 2026-02-30.',reject:true}
];
for(const entry of localCases){
 const project=makeExample(entry.office?'office':'connections'),d=project.devices.find(x=>entry.office?x.type==='Servidor':x.name==='POSTO-01'),state={roomId:d.room,selected:{type:'devices',id:d.id}},before=JSON.stringify(project),start=performance.now(),checks={};
 try{const snapshot=assistantContext(project,state,entry.prompt),plan=localConfiguration(entry.prompt,snapshot);checks.recognized=!!plan;checks.mode=plan?.mode==='configure';const result=executeAssistantActions(project,plan.actions,snapshot);checks.result=!entry.reject&&entry.check(result.project,d,project);}
 catch(error){checks.result=entry.reject===true;}
 checks.unchanged=before===JSON.stringify(project);const result={id:entry.id,engine:'local-command',latencyMs:Math.round(performance.now()-start),checks};result.passed=Object.values(checks).every(Boolean);report.cases.push(result);console.log(entry.id+': '+(result.passed?'PASS':'FAIL')+' · '+result.latencyMs+' ms');
}
// The actual product goal: build and review an office for 20 people in one request.
{
 const project=normalizeProject({version:3,name:'Avaliação escritório',sites:[{id:'s',name:'Sede',sub:'',x:0,z:0,w:30,d:30}],floors:[{id:'f',site:'s',name:'Piso 0',level:0,elevation:0}],rooms:[{id:'r',name:'Escritório',floor:'f',x:0,z:0,w:12,d:10}],devices:[],racks:[],links:[],nets:[],templates:[]}),before=JSON.stringify(project),start=performance.now(),snapshot=assistantContext(project,{roomId:'r'},officeExample);
 const plan=localConfiguration(officeExample,snapshot),outcome=executeAssistantActions(project,plan.actions,snapshot),review=outcome.reviews[0];
 const checks={computers:outcome.project.devices.filter(d=>d.type==='Computador').length===20,printer:outcome.project.devices.filter(d=>d.type==='Impressora').length===1,outlets:outcome.project.devices.filter(d=>d.type==='Tomada de rede').length===11,rack:outcome.project.racks.length===1,cabling:outcome.project.links.length===63,verified:review.connected===21&&review.endpoints===21,honest:review.missingIP===21&&review.missingVLAN===21&&!review.upstream,unchanged:before===JSON.stringify(project)};
 const result={id:'complete-office-20',engine:'local-command',latencyMs:Math.round(performance.now()-start),checks};result.passed=Object.values(checks).every(Boolean);report.cases.push(result);console.log(result.id+': '+(result.passed?'PASS':'FAIL')+' · '+result.latencyMs+' ms');
 const repeated=executeAssistantActions(outcome.project,plan.actions,assistantContext(outcome.project,{roomId:'r'},officeExample));const again={id:'complete-office-repeat',engine:'local-command',checks:{noChanges:!repeated.changed,sameProject:JSON.stringify(repeated.project)===JSON.stringify(outcome.project)}};again.passed=Object.values(again.checks).every(Boolean);report.cases.push(again);console.log(again.id+': '+(again.passed?'PASS':'FAIL'));
}
// Regression coverage for explicit addressing and repair after the complete office goal.
{
 const base=normalizeProject({version:3,name:'Avaliação lote',sites:[{id:'s',name:'Sede',sub:'',x:0,z:0,w:30,d:30}],floors:[{id:'f',site:'s',name:'Piso 0',level:0,elevation:0}],rooms:[{id:'r',name:'Sala',floor:'f',x:0,z:0,w:12,d:10}],devices:[],racks:[],links:[],nets:[],templates:[]});
 const officeSnapshot=assistantContext(base,{roomId:'r'},officeExample),full=executeAssistantActions(base,localConfiguration(officeExample,officeSnapshot).actions,officeSnapshot).project;
 for(const entry of [{id:'bulk-addressing',prompt:'Usa a rede 192.168.10.0/24, reserva o gateway .1 e atribui IPs aos computadores sem repetir endereços.',check:r=>{const pcs=r.project.devices.filter(d=>d.type==='Computador');return new Set(pcs.map(d=>d.ip)).size===20&&pcs.every(d=>d.gateway==='192.168.10.1'&&d.ip!=='192.168.10.1');}},{id:'repair-patch-channel',prompt:'Revê esta sala e completa as ligações que faltam, usando as portas livres.',repair:true,check:r=>r.reviews[0].connected===21&&r.project.links.length===63}]){
 const project=structuredClone(full);if(entry.repair){const missing=project.links.find(l=>l.portA==='R1');project.links=project.links.filter(l=>l.id!==missing.id);}const before=JSON.stringify(project),snapshot=assistantContext(project,{roomId:'r'},entry.prompt),start=performance.now(),outcome=executeAssistantActions(project,localConfiguration(entry.prompt,snapshot).actions,snapshot),checks={result:entry.check(outcome),unchanged:before===JSON.stringify(project)};const result={id:entry.id,engine:'local-command',latencyMs:Math.round(performance.now()-start),checks,passed:Object.values(checks).every(Boolean)};report.cases.push(result);console.log(result.id+': '+(result.passed?'PASS':'FAIL'));
 }
}
{
 let project=normalizeProject({version:3,name:'Avaliação plano',sites:[],floors:[],rooms:[],racks:[],devices:[],links:[],nets:[],templates:[]}),generation=0,saves=0;
 const runner=createTaskRunner({get:()=>({project,generation,ready:true,dirty:false,conflict:false}),change(fn){const next=structuredClone(project);fn(next);project=next;generation++;return true;},save:async()=>{saves++;return true;}});const start=performance.now();await runner.start(parseBranchRequest(branchExample),branchExample);const checks={completed:runner.get().status==='completed',floors:project.floors.length===2,departments:project.rooms.length===3,computers:project.devices.filter(d=>d.type==='Computador').length===40,saved:saves===5};const result={id:'staged-branch-40',engine:'local-task',latencyMs:Math.round(performance.now()-start),checks,passed:Object.values(checks).every(Boolean)};report.cases.push(result);console.log(result.id+': '+(result.passed?'PASS':'FAIL'));
}
const offline=createChatHandler(base,{fetcher:async()=>{throw Error('A avaliação determinística não pode usar o modelo.');}});
for(const entry of cases.filter(c=>c.id!=='unsupported-real-network'&&!c.modelOnly))await runHandler(offline,entry);
report.modelEvaluation={status:'skipped',reason:'Usa --with-model para avaliar também a inferência real do Ollama.'};
if(process.argv.includes('--with-model')){
 try{
 const tags=await fetch(base+'/api/tags',{signal:AbortSignal.timeout(4000)});if(!tags.ok||!(await tags.json()).models?.some(m=>m.name===model))throw Error('Modelo configurado não instalado.');
 const handler=createChatHandler(base,{preferredModel:model,requirePreferredModel:true});
 const selected=process.argv.find(a=>a.startsWith('--model-case='))?.slice('--model-case='.length),modelCases=cases.filter(c=>(c.id==='unsupported-real-network'||c.modelOnly)&&(!selected||c.id===selected));if(!modelCases.length)throw Error('Caso de avaliação do modelo inexistente.');for(const entry of modelCases)await runHandler(handler,entry);
 report.modelEvaluation={status:'completed'};
 }catch(error){report.modelEvaluation={status:'not-run',reason:error.message};process.exitCode=1;}
}
report.status='completed';report.passed=report.cases.every(c=>c.passed);await flush();if(!report.passed)process.exitCode=1;
