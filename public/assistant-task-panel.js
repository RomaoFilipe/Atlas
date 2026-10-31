import {createTaskRunner} from './assistant-task-runner.js';
import {branchProgram} from './assistant-branch.js';
export function initTaskPanel(app,panel,{onBusy=()=>{}}={}){
 const root=document.createElement('section');root.className='chat-task-panel';root.hidden=true;root.setAttribute('aria-label','Plano de execução da IA');
 root.innerHTML='<strong data-task-title></strong><p data-task-summary></p><progress data-task-progress></progress><p data-task-status role="status"></p><ol data-task-steps></ol><div class="chat-task-controls"><button type="button" data-task-pause>Pausar após esta etapa</button><button type="button" data-task-resume>Retomar</button><button type="button" data-task-undo>Desfazer última etapa</button><button type="button" data-task-cancel>Terminar plano</button><button type="button" data-task-hide>Ocultar plano</button></div>';
 panel.querySelector('.chat-messages').before(root);const q=s=>root.querySelector(s);let storage=null;try{const scoped=key=>key+':'+(app.get().sessionScope||'atlas-local');storage={getItem:key=>sessionStorage.getItem(scoped(key))||((app.get().sessionScope||'atlas-local')==='atlas-local'?sessionStorage.getItem(key):null),setItem:(key,value)=>sessionStorage.setItem(scoped(key),value),removeItem:key=>sessionStorage.removeItem(scoped(key))};}catch{}
 function paint(job){root.hidden=!job;if(job){panel.querySelector('.chat-local-help').open=false;panel.querySelector('.chat-action-help').open=false;}onBusy(!!job?.running);if(!job)return;
  const steps=branchProgram(job.config).steps;q('[data-task-title]').textContent='Plano · '+job.config.name;q('[data-task-summary]').textContent=job.summary;q('[data-task-progress]').max=steps.length;q('[data-task-progress]').value=job.next;q('[data-task-status]').textContent=job.message;
  q('[data-task-steps]').replaceChildren(...steps.map((step,i)=>{const li=document.createElement('li');li.textContent=(i<job.next?'✓ ':i===job.next&&job.running?'→ ':'')+step.label;li.setAttribute('aria-current',i===job.next?'step':'false');return li;}));
  q('[data-task-hide]').disabled=job.running;q('[data-task-pause]').disabled=!job.running||job.operation==='undo';q('[data-task-resume]').disabled=job.running||['completed','cancelled'].includes(job.status);q('[data-task-undo]').disabled=!job.canUndo;q('[data-task-cancel]').disabled=['completed','cancelled'].includes(job.status)||job.operation==='undo';
 }
 const runner=createTaskRunner(app,{storage,onUpdate:paint});const invoke=fn=>async()=>{try{await fn();}catch(error){q('[data-task-status]').textContent=error.message;}};
 q('[data-task-pause]').onclick=()=>runner.pause();q('[data-task-resume]').onclick=invoke(()=>runner.resume());q('[data-task-undo]').onclick=invoke(()=>runner.undo());q('[data-task-cancel]').onclick=()=>runner.cancel();
 q('[data-task-hide]').onclick=()=>{root.hidden=true;};
 return {start:(config,prompt)=>runner.start(config,prompt),restore:()=>{const job=runner.restore();paint(job);return job;},get:()=>runner.get()};
}
