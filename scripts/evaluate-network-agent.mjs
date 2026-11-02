import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {makeExample} from '../public/examples.js';
import {normalizeProject} from '../public/model.js';
import {assistantContext} from '../public/assistant-actions.js';
import {localConfiguration} from '../public/assistant-local-actions.js';
import {prepareAgentPlan,verifyAgentPlan} from '../public/assistant-agent.js';
const examples=JSON.parse(fs.readFileSync(new URL('../docs/agent-examples.json',import.meta.url),'utf8'));
const report={date:new Date().toISOString(),scope:'Exemplos sintéticos revistos, executados em memória. Sem chamadas ao modelo e sem alterações à instalação.',cases:[]};
for(const example of examples){
 const p=normalizeProject(makeExample('connections')),remove=example.fixture==='disconnected'?['POSTO-1','HORIZONTAL-1','PATCH-1']:example.fixture==='partial'?['POSTO-1','PATCH-1']:example.fixture==='missing-horizontal'?['HORIZONTAL-1']:[];p.links=p.links.filter(l=>!remove.includes(l.id));
 const before=JSON.stringify(p),start=performance.now(),checks={};let error='';
 try{
  const snapshot=assistantContext(p,{selected:{type:'devices',id:example.selected}},example.prompt),data=localConfiguration(example.prompt,snapshot);if(!data)throw Error('Pedido não reconhecido.');
  const plan=prepareAgentPlan(p,data.actions,snapshot);checks.expectedAcceptance=!example.reject;checks.verified=verifyAgentPlan(plan.project,plan).verified;
  if(example.tools)checks.tools=JSON.stringify(data.actions.map(a=>a.action))===JSON.stringify(example.tools);
  if(example.newLinks!==undefined)checks.links=plan.expectedLinks.length===example.newLinks;
  if(example.changed!==undefined)checks.changed=plan.changed===example.changed;
  if(example.route)checks.route=JSON.stringify(plan.toolResults[0].route)===JSON.stringify(example.route);
  if(example.diagnosisCode)checks.diagnosis=plan.toolResults.some(r=>r.diagnosis?.findings.some(f=>f.code===example.diagnosisCode));
  if(example.category)checks.category=plan.expectedLinks.every(l=>l.category===example.category);
  if(example.profile){const profile=plan.project.devices.find(d=>d.id===example.selected).portProfiles?.find(c=>c.port===example.profile.port);checks.profile=!!profile&&Object.entries(example.profile).every(([key,value])=>JSON.stringify(profile[key])===JSON.stringify(value));}
 }catch(e){error=e.message;checks.expectedRejection=!!example.reject;}
 checks.inputUnchanged=JSON.stringify(p)===before;const result={id:example.id,latencyMs:Math.round(performance.now()-start),passed:Object.values(checks).every(Boolean),checks,...(error?{error}:{})};report.cases.push(result);console.log(example.id+': '+(result.passed?'PASS':'FAIL'));
}
report.passed=report.cases.every(c=>c.passed);const output=process.env.ATLAS_AGENT_EVAL_OUTPUT||'docs/agent-evaluation.json';fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(report.cases.length+' cenários · '+(report.passed?'PASS':'FAIL'));if(!report.passed)process.exitCode=1;
if(process.argv.includes('--with-model')){
 const {createChatHandler}=await import('./assistant.mjs'),{Readable}=await import('node:stream');
 const model=process.env.ATLAS_OLLAMA_MODEL||'qwen3:14b',base=process.env.ATLAS_OLLAMA_URL||'http://127.0.0.1:11434';
 const p=normalizeProject(makeExample('connections'));p.links=p.links.filter(l=>!['POSTO-1','HORIZONTAL-1','PATCH-1'].includes(l.id));
 const prompt='Liga este posto à rede através do ponto de parede compatível mais próximo e completa o percurso até ao switch, sem criar equipamentos.',snapshot=assistantContext(p,{selected:{type:'devices',id:'pc1'}},prompt),handler=createChatHandler(base,{preferredModel:model,requirePreferredModel:true,requestTimeoutMs:120000}),start=performance.now();let response,status,live;
 try{
  const request=Readable.from([Buffer.from(JSON.stringify({model,mode:'configure',context:snapshot.context,messages:[{role:'user',content:snapshot.mask(prompt)}]}))]);request.method='POST';request.headers={'content-type':'application/json'};
  await handler(request,{writeHead(code){status=code;},end(body){response=JSON.parse(body);}});
  if(status!==200)throw Error(response?.error||'Inferência indisponível.');const plan=prepareAgentPlan(p,response.actions,snapshot),tool=plan.toolResults.find(r=>r.tool==='connect_nearest_outlet');
  live={model,status,latencyMs:Math.round(performance.now()-start),tools:response.actions.map(a=>a.action),passed:!!tool&&plan.expectedLinks.length===3&&tool.route.at(-1)==='sw0'};
 }catch(error){live={model,status,latencyMs:Math.round(performance.now()-start),passed:false,error:error.message};}
 report.realInference=live;report.passed=report.passed&&live.passed;fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log('real-inference: '+(live.passed?'PASS':'FAIL')+' · '+live.latencyMs+' ms');if(!report.passed)process.exitCode=1;
}
