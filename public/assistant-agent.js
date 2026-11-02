import {executeAssistantActions} from './assistant-actions.js';
import {validate,clone} from './model.js';
import {assessCircuit} from './physical-network.js';
// Planning runs against a copy. The existing editor remains the only writer,
// enforcing permissions, undo history, revisions and conflict detection.
export function prepareAgentPlan(project,actions,snapshot){
 const result=executeAssistantActions(project,actions,snapshot),before=new Set(project.links.map(l=>l.id));
 const expectedLinks=result.project.links.filter(l=>!before.has(l.id)).map(l=>({id:l.id,a:l.a,b:l.b,portA:l.portA,portB:l.portB,kind:l.kind,category:l.category}));
 const expectedInterfaces=[...new Map((result.toolResults||[]).filter(r=>r.tool==='configure_interface').map(r=>[r.device+'|'+r.port.toLowerCase(),{device:r.device,port:r.port,values:clone(r.expected)}])).values()];
 const plan={...result,expectedLinks,expectedInterfaces,steps:actions.map((a,i)=>({number:i+1,tool:a.action})),checks:['Pedido e referências validados','Plano simulado sem alterar o projeto'],warnings:[...new Set((result.toolResults||[]).flatMap(r=>r.warnings||[]))]};
 verifyAgentPlan(result.project,plan);plan.checks.push('Resultado do plano verificado');return plan;
}
export function verifyAgentPlan(project,plan){
 validate(project);
 for(const expected of plan.expectedLinks||[]){const link=project.links.find(l=>l.id===expected.id);if(!link||Object.entries(expected).some(([key,value])=>link[key]!==value))throw Error('A verificação encontrou um cabo diferente do plano.');}
 for(const expected of plan.expectedInterfaces||[]){const profile=project.devices.find(d=>d.id===expected.device)?.portProfiles?.find(p=>p.port.toLowerCase()===expected.port.toLowerCase());if(!profile||Object.entries(expected.values).some(([key,value])=>JSON.stringify(profile[key])!==JSON.stringify(value)))throw Error('A configuração da interface difere do plano validado.');}
 for(const tool of plan.toolResults||[])if(tool.tool==='connect_nearest_outlet'&&tool.checks.includes('Percurso até ao switch verificado')){
  const start=tool.circuitLinks[0],circuit=assessCircuit(project,start);if(!circuit.complete||circuit.issues.some(i=>i.severity==='erro'))throw Error('O percurso deixou de ser compatível entre a preparação e a verificação.');
 }
 return {verified:true,links:(plan.expectedLinks||[]).length,interfaces:(plan.expectedInterfaces||[]).length};
}
export function agentReport(plan){return {steps:plan.steps||[],checks:plan.checks||[],warnings:plan.warnings||[],diagnoses:(plan.toolResults||[]).filter(r=>r.diagnosis).map(r=>r.diagnosis),tools:(plan.toolResults||[]).map(r=>({tool:r.tool,summary:r.summary,checks:r.checks||[]}))};}
