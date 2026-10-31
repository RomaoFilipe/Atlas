import {parseBranchRequest} from './assistant-branch-request.js';
import {branchProgram,executeBranchStep,planBranch} from './assistant-branch.js';
const storageKey='atlas-assistant-branch-v1';
export async function projectFingerprint(project){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(project)));return [...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');}
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
export function createTaskRunner(app,{storage=null,onUpdate=()=>{},fingerprint=projectFingerprint,yieldStep=tick}={}){
 let job=null,running=false,undoBusy=false,stopRequested=false,undoStack=[],expectedGeneration=null;
 const view=()=>job?{...job,running:running||undoBusy,operation:undoBusy?'undo':'run',canUndo:!running&&!undoBusy&&undoStack.length>0&&app.get().generation===expectedGeneration}:null;
 function publish(){if(job&&storage)try{storage.setItem(storageKey,JSON.stringify(job));}catch{job.message='O plano continua neste separador, mas não foi possível guardar a retoma.';}onUpdate(view());}
 async function hash(){const project=app.get().project,value=await fingerprint(project);if(app.get().project!==project)throw Error('O projeto mudou durante a verificação.');return value;}
 function ready(){const s=app.get();if(!s.ready||s.conflict)throw Error('Aguarda o carregamento ou resolve o conflito antes de continuar o plano.');return s;}
 function restore(){
  if(job||!storage)return view();try{const value=JSON.parse(storage.getItem(storageKey)||'null');if(!value)return null;
   branchProgram(value.config);if(JSON.stringify(parseBranchRequest(value.prompt))!==JSON.stringify(value.config))throw Error();if(value.version!==1||typeof value.prompt!=='string'||value.prompt.length>2400||typeof value.summary!=='string'||value.summary.length>1000||!Number.isInteger(value.next)||value.next<0||value.next>branchProgram(value.config).steps.length||!Array.isArray(value.refs)||typeof value.expected!=='string'||!/^[a-f0-9]{64}$/.test(value.expected)||!['paused','running','completed','cancelled'].includes(value.status))throw Error();
   const allowed=new Set(branchProgram(value.config).steps.slice(0,value.next).flatMap(s=>s.actions.filter(a=>a.ref).map(a=>a.ref)));
   if(value.refs.length!==allowed.size||new Set(value.refs.map(v=>v[0])).size!==allowed.size||value.refs.some(([ref,target])=>!allowed.has(ref)||!target||!['sites','floors','rooms'].includes(target.type)||typeof target.id!=='string'))throw Error();
   if(value.pending){const after=new Set(branchProgram(value.config).steps.slice(0,value.next+1).flatMap(s=>s.actions.filter(a=>a.ref).map(a=>a.ref)));if(value.pending.index!==value.next||!Array.isArray(value.pending.refs)||value.pending.refs.length!==after.size||new Set(value.pending.refs.map(v=>v[0])).size!==after.size||value.pending.refs.some(([ref,target])=>!after.has(ref)||!target||!['sites','floors','rooms'].includes(target.type)||typeof target.id!=='string')||!/^[a-f0-9]{64}$/.test(value.pending.hash))throw Error();}
   job=value;if(job.status==='running')job.status='paused';job.message=job.status==='paused'?'Plano recuperado. Retoma após confirmar o projeto atual.':job.message;expectedGeneration=app.get().generation;publish();return view();
  }catch{try{storage.removeItem(storageKey);}catch{}return null;}
 }
 function assertBindings(refs){
  const entries=new Map(refs),p=app.get().project,site=entries.get('new_branch_site');
  if(site){const item=p.sites.find(s=>s.id===site.id);if(site.type!=='sites'||item?.name!==job.config.name)throw Error('O edifício do plano deixou de corresponder ao projeto.');}
  for(const [ref,target] of entries){let m;if((m=ref.match(/^new_branch_floor_(\d+)$/))){const f=p.floors.find(f=>f.id===target.id);if(target.type!=='floors'||f?.site!==site?.id||f?.level!==Number(m[1]))throw Error('Os pisos do plano foram alterados.');}if((m=ref.match(/^new_branch_room_(\d+)$/))){const r=p.rooms.find(r=>r.id===target.id),floor=entries.get('new_branch_floor_'+(Number(m[1])%job.config.floors));if(target.type!=='rooms'||r?.floor!==floor?.id||r?.name!=='Departamento '+(Number(m[1])+1))throw Error('Os departamentos do plano foram alterados.');}}
 }
 async function commitPending(){
  if(!job.pending)return;const pending=job.pending;
  if(await hash()!==pending.hash){if(await hash()===job.expected){job.pending=null;return;}throw Error('O projeto mudou desde a etapa aplicada. Revê o projeto antes de retomar.');}
  if(!(await app.save()))throw Error('Etapa aplicada no editor; gravação pendente. Retoma para tentar guardar novamente.');
  if(await hash()!==pending.hash)throw Error('O projeto mudou durante a gravação. O plano foi pausado.');
  assertBindings(pending.refs);job.refs=pending.refs;job.next=pending.index+1;job.expected=pending.hash;job.pending=null;expectedGeneration=app.get().generation;publish();
 }
 async function run(){
  if(running||undoBusy)throw Error('O plano já está em execução.');ready();running=true;stopRequested=false;job.status='running';job.message='A executar etapas validadas…';publish();
  try{
   await commitPending();if(await hash()!==job.expected)throw Error('O projeto mudou desde a última etapa. Revê ou termina este plano; nada novo foi aplicado.');
   assertBindings(job.refs);const steps=branchProgram(job.config).steps;
   while(job.next<steps.length&&!stopRequested){
    ready();if(await hash()!==job.expected)throw Error('O projeto mudou entre etapas. O plano foi pausado.');
    const index=job.next,state=app.get(),result=executeBranchStep(state.project,steps[index],job.refs,job.prompt);
    if(app.get().project!==state.project)throw Error('O projeto mudou enquanto a etapa era preparada.');
    const checkpoint={index,refs:job.refs,hash:job.expected};
    if(!app.change(p=>{for(const key of Object.keys(p))delete p[key];Object.assign(p,result.project);},'IA · '+steps[index].label))throw Error('Não foi possível aplicar a etapa.');
    expectedGeneration=app.get().generation;undoStack.push(checkpoint);
    job.pending={index,refs:result.bindings,hash:await hash()};job.message='A guardar '+steps[index].label+'…';publish();
    await commitPending();if(result.focus)app.reveal?.(result.focus);await yieldStep();
   }
   job.status=job.next===steps.length?'completed':job.status==='cancelled'?'cancelled':'paused';job.message=job.status==='completed'?'Plano concluído e guardado. IPs, VLANs e Internet continuam por configurar.':job.status==='cancelled'?'Plano terminado; as etapas já aplicadas foram conservadas.':'Plano em pausa. As etapas concluídas estão guardadas; podes retomar neste separador, incluindo após recarregar.';
  }catch(error){job.status='paused';job.message=error.message;}
  finally{running=false;publish();}
  return view();
 }
 async function start(config,prompt){
  ready();restore();
  if(job&&['running','paused'].includes(job.status)){if(JSON.stringify(job.config)===JSON.stringify(config))return resume();throw Error('Existe um plano em pausa. Retoma-o ou termina-o antes de iniciar outro.');}
  if(job?.status==='completed'&&JSON.stringify(job.config)===JSON.stringify(config)&&await hash()===job.expected)return view();
  if(app.get().dirty&&!(await app.save()))throw Error('Guarda o projeto antes de iniciar o plano.');
  const snapshot=app.get().project,plan=planBranch(snapshot,config,prompt),expected=await fingerprint(snapshot);if(app.get().project!==snapshot)throw Error('O projeto mudou durante a validação do plano.');
  job={version:1,config,prompt,next:0,refs:[],expected,pending:null,status:'paused',summary:plan.summary,message:'Todas as etapas foram validadas.'};undoStack=[];expectedGeneration=app.get().generation;publish();return run();
 }
 async function resume(){ready();if(!job)throw Error('Não existe plano para retomar.');if(job.status==='completed')return view();if(app.get().generation!==expectedGeneration)undoStack=[];if(app.get().dirty&&!job.pending&&!(await app.save()))throw Error('Guarda as alterações pendentes antes de retomar.');return run();}
 function pause(){if(!job)return;stopRequested=true;job.status='paused';job.message=running?'A pausar após a gravação da etapa atual…':'Plano em pausa.';publish();}
 function cancel(){if(!job)return;stopRequested=true;job.status='cancelled';job.message='Plano terminado; as etapas aplicadas ficam guardadas.';publish();}
 async function undo(){
  if(running||undoBusy||!undoStack.length)throw Error('Não há uma etapa desta sessão disponível para desfazer.');ready();undoBusy=true;publish();try{if(app.get().generation!==expectedGeneration)throw Error('O projeto mudou. Usa o histórico para recuperar uma etapa anterior.');
  const expected=job.pending?.hash||job.expected;if(await hash()!==expected||app.get().generation!==expectedGeneration)throw Error('O projeto mudou desde a etapa.');const point=undoStack.at(-1);app.undo();
  if(await hash()!==point.hash)throw Error('O histórico não corresponde à etapa. Revê o projeto.');
  undoStack.pop();job.next=point.index;job.refs=point.refs;job.expected=point.hash;job.pending=null;job.status='paused';expectedGeneration=app.get().generation;
  const saved=await app.save();job.message=saved?'Última etapa desfeita e guardada. Podes retomar ou desfazer outra.':'Etapa desfeita no editor; gravação pendente.';publish();}finally{undoBusy=false;publish();}return view();
 }
 return {start,resume,pause,cancel,undo,restore,get:view};
}
