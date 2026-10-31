import {operationReport} from './operations.js';
import {roomTasks} from './room-actions.js';

export function configurationSteps(project){
 const issues=operationReport(project).issues,proposals=(project.connectionProposals||[]).length;
 const missing=new Set(issues.filter(i=>i.kind==='unconnected').map(i=>i.targetId+':'));
 for(const r of project.rooms)for(const task of roomTasks(project,r.id))missing.add(task.device+':'+task.port);
 for(const d of project.devices)for(const port of d.pendingNetworkPorts||[])missing.add(d.id+':'+port);
 const pending=missing.size+proposals;
 const building=project.sites.length>0;
 const floors=project.floors.some(f=>project.sites.some(s=>s.id===f.site));
 const spaces=project.rooms.some(r=>project.floors.some(f=>f.id===r.floor&&project.sites.some(s=>s.id===f.site)));
 const equipped=spaces&&project.devices.some(d=>project.rooms.some(r=>r.id===d.room));
 return [
  {id:'building',title:'1. Edifício',description:'Crie o edifício que vai receber a infraestrutura.',action:building?'Gerir edifícios':'Criar edifício',done:building,enabled:true,count:`${project.sites.length} edifícios`,next:'Comece por criar o edifício.'},
  {id:'floor',title:'2. Piso',description:'Adicione os pisos do edifício.',action:floors?'Adicionar piso':'Criar piso',done:floors,enabled:building,count:`${project.floors.length} pisos`,next:'Crie o primeiro piso do edifício.',blocked:'Crie primeiro um edifício.'},
  {id:'room',title:'3. Sala',description:'Crie as salas onde vai colocar os equipamentos.',action:spaces?'Adicionar sala':'Criar sala',done:spaces,enabled:floors,count:`${project.rooms.length} salas`,next:'Adicione uma sala ao piso.',blocked:'Crie primeiro um piso.'},
  {id:'equipment',title:'4. Equipamentos',description:'Escolha uma sala e adicione os equipamentos. Os detalhes técnicos podem ficar para depois.',action:'Equipar uma sala',done:equipped,enabled:spaces,count:`${project.devices.length} equipamentos`,next:'Os espaços estão criados. Agora equipe a primeira sala.',blocked:'Crie primeiro uma sala.'},
  {id:'connections',title:'5. Ligações',description:'Registe os cabos e reveja as propostas. Pode deixar ligações por identificar e voltar mais tarde.',action:pending?'Resolver ligações':'Documentar ligação',done:equipped&&pending===0,enabled:equipped,count:`${project.links.length} ligações · ${pending} por documentar ou confirmar`,next:'Já tem equipamentos. Agora documente as ligações e confirme as propostas.',blocked:'Adicione primeiro equipamentos a uma sala.'},
  {id:'check',title:'6. Rever',description:'Reveja erros de configuração, responsáveis e outros dados em falta. Abra cada pendência para a resolver.',action:'Rever pendências',done:equipped&&pending===0&&issues.length===0,enabled:equipped,count:`${issues.length} pendências · ${proposals} propostas`,next:'As ligações estão documentadas. Reveja agora as restantes pendências.',blocked:'Adicione primeiro equipamentos a uma sala.'}
 ];
}
const stepCache=new WeakMap();
function cachedSteps(project){const day=new Date().toISOString().slice(0,10),entry=stepCache.get(project);if(entry?.day===day)return entry.steps;const steps=configurationSteps(project);stepCache.set(project,{day,steps});return steps;}
export function initConfigurationGuide({get,actions}){
 const guide=document.createElement('details');guide.id='configurationGuide';guide.className='configuration-guide';
 guide.innerHTML='<summary>Configurar o projeto <span data-guide-progress></span><span data-guide-summary></span></summary><div class="configuration-next"><div><small>PRÓXIMO PASSO</small><p data-guide-next role="status" aria-live="polite"></p></div><button type="button" class="primary" data-guide-continue></button></div><p data-guide-example hidden>Está a explorar um exemplo. O percurso e as pendências refletem esses dados.</p><div class="configuration-steps"></div><details class="configuration-optional"><summary>Opcional · Redes / VLANs e empresa</summary><p>Pode registar VLANs, sub-redes e gateways quando tiver essa informação. Estas opções não impedem continuar o percurso.</p><button type="button" data-guide-action="networks">Configurar redes / VLANs</button><button type="button" data-guide-action="organization">Empresa e filiais</button></details><div class="configuration-footer"><span>As alterações são guardadas automaticamente. Pode interromper e retomar pelo estado atual do projeto. Este guia verifica os registos, não a instalação física.</span></div>';
 document.querySelector('#mapWorkspace').before(guide);
 let initialized=false;
 guide.addEventListener('click',event=>{const button=event.target.closest('[data-guide-action]');if(button&&!button.disabled)actions[button.dataset.guideAction]();});
 return {render(){const {project,ready}=get(),steps=cachedSteps(project),current=steps.find(step=>!step.done),complete=!current;
 if(!initialized&&ready){guide.open=!project.exampleKey&&!complete;initialized=true;}
 guide.querySelector('[data-guide-progress]').textContent=steps.filter(step=>step.done).length+' de '+steps.length+' etapas';
 guide.querySelector('[data-guide-summary]').textContent=ready?(current?.title.slice(3)||'Sem pendências nas verificações disponíveis'):'A carregar…';
 guide.querySelector('[data-guide-next]').textContent=ready?(current?.next||'Sem pendências nas verificações disponíveis. Pode rever o projeto ou continuar a adicionar espaços e equipamentos.'):'A carregar o projeto…';
 guide.querySelector('[data-guide-example]').hidden=!project.exampleKey;
 const next=guide.querySelector('[data-guide-continue]');next.textContent=current?.action||'Rever configuração';next.dataset.guideAction=current?.id||'check';next.disabled=!ready;
 const root=guide.querySelector('.configuration-steps');
 // Keep controls in place so project refreshes preserve keyboard focus.
 if(!root.children.length)for(const step of steps){const card=document.createElement('section');card.innerHTML='<small data-step-status></small><h3></h3><p></p><small data-step-count></small><button type="button"></button>';root.append(card);}
 steps.forEach((step,index)=>{const card=root.children[index],active=step===current;card.classList.toggle('current',active);card.classList.toggle('complete',step.done);if(active)card.setAttribute('aria-current','step');else card.removeAttribute('aria-current');card.querySelector('[data-step-status]').textContent=step.done?'Concluído':active?'Passo atual':'A seguir';card.querySelector('h3').textContent=step.title;card.querySelector('p').textContent=step.description;card.querySelector('[data-step-count]').textContent=step.count;const button=card.querySelector('button');button.textContent=step.action;button.dataset.guideAction=step.id;button.disabled=!ready||!step.enabled;button.title=!ready?'A carregar o projeto':!step.enabled?step.blocked:step.action;});
 for(const button of guide.querySelectorAll('.configuration-optional button'))button.disabled=!ready;
 }};
}
