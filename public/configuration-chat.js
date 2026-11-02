import {prepareAgentPlan,verifyAgentPlan,agentReport} from './assistant-agent.js';
import {initTaskPanel} from './assistant-task-panel.js';
import {localConfiguration,configurationCommands} from './assistant-local-actions.js';
import {projectAnswer} from './assistant-project.js';
import {assistantRequestMode} from './assistant-intent.js';
import {assistantGuides,relevantGuides,configurationSuggestions,quickGuideAnswer} from './assistant-knowledge.js';
import {assistantContext} from './assistant-actions.js';
import {privateText} from './assistant-privacy.js';
export function initConfigurationChat(app){
const icon=(name)=>({spark:'✦',close:'×',send:'↑',reset:'↺'})[name];
const panel=document.createElement('section');panel.className='configuration-chat';panel.id='configurationChat';panel.hidden=true;
panel.setAttribute('role','dialog');panel.setAttribute('aria-labelledby','configurationChatTitle');
panel.innerHTML=`<div class="chat-header"><div class="chat-identity"><span class="chat-avatar" aria-hidden="true">${icon('spark')}</span><div><strong id="configurationChatTitle">Atlas</strong><small>Configura o projeto contigo</small></div></div><div class="chat-header-actions"><button type="button" data-clear title="Nova conversa" aria-label="Nova conversa">${icon('reset')}</button><button type="button" data-close title="Fechar" aria-label="Fechar chat">${icon('close')}</button></div></div><div class="chat-mode" role="group" aria-label="Modo do assistente"><button type="button" data-chat-mode="configure" aria-pressed="true">Configurar por mim</button><button type="button" data-chat-mode="advice" aria-pressed="false">Só conversar</button></div><div class="chat-messages" role="log" aria-label="Conversa com a IA" aria-live="polite"></div><div class="chat-welcome"><span class="chat-welcome-mark" aria-hidden="true">✦</span><h2>Vamos configurar?</h2><p>Diz-me o que precisas.<br>Eu aplico as alterações no Atlas.</p><div class="chat-suggestions"><button type="button" data-prompt="Cria um edifício com um piso e duas salas de 8 por 6 metros.">Criar edifício e salas <span aria-hidden="true">↗</span></button><button type="button" data-prompt="Adiciona 3 computadores à sala atual.">Equipar a sala atual <span aria-hidden="true">↗</span></button><button type="button" data-prompt="Liga à rede os equipamentos da sala atual usando as portas livres.">Ligar equipamentos <span aria-hidden="true">↗</span></button></div></div><p role="status" data-status></p><form><label class="chat-input-label" for="configurationChatPrompt">Mensagem para a IA</label><div class="chat-composer"><textarea id="configurationChatPrompt" rows="1" maxlength="2400" required placeholder="Pergunta ao Atlas…"></textarea><button type="submit" aria-label="Enviar mensagem" title="Enviar mensagem">${icon('send')}</button></div><small>Ações no Atlas · podes desfazer. Não partilhes dados sensíveis.</small></form>`;
const help=document.createElement('details');help.className='chat-local-help';
const summary=document.createElement('summary');summary.textContent='Guias de configuração · disponíveis sem IA';help.append(summary);
const search=document.createElement('input');search.type='search';search.placeholder='Pesquisar ajuda…';search.setAttribute('aria-label','Pesquisar guias de configuração');help.append(search);
const articles=document.createElement('div');help.append(articles);
function showGuides(){articles.replaceChildren();const guides=search.value.trim()?relevantGuides(search.value,4):assistantGuides;for(const guide of guides){const article=document.createElement('details');article.dataset.guideId=guide.id;const title=document.createElement('summary'),list=document.createElement('ol');title.textContent=guide.title;article.append(title);for(const step of guide.steps){const item=document.createElement('li');item.textContent=step;list.append(item);}article.append(list);if(app.openGuide){const action=document.createElement('button');action.type='button';action.textContent='Abrir no Atlas';action.onclick=()=>{try{app.openGuide(guide.id);}catch(error){status.textContent=error.message;}};article.append(action);}for(const text of [guide.result,guide.recovery]){const paragraph=document.createElement('p');paragraph.textContent=text;article.append(paragraph);}articles.append(article);}if(!guides.length)articles.textContent='Não encontrei um guia. Tenta outras palavras ou pergunta no chat.';}
search.addEventListener('input',showGuides);showGuides();panel.querySelector('.chat-mode').after(help);
const commandHelp=document.createElement('details');commandHelp.className='chat-action-help';const commandTitle=document.createElement('summary');commandTitle.textContent='O que posso inserir e configurar';commandHelp.append(commandTitle);const commandInfo=document.createElement('p');commandInfo.textContent='Escolhe Configurar por mim e adapta o pedido. Para vários passos, separa os comandos por ponto e vírgula; são aplicados em conjunto e podes desfazer.';commandHelp.append(commandInfo);for(const command of configurationCommands){const button=document.createElement('button');button.type='button';button.textContent=command.label;button.title=command.prompt;button.onclick=()=>{input.value=command.prompt;resize();input.focus();};commandHelp.append(button);}help.after(commandHelp);help.addEventListener('toggle',()=>{if(help.open)commandHelp.open=false;});commandHelp.addEventListener('toggle',()=>{if(commandHelp.open)help.open=false;});
document.body.append(panel);
const launcher=document.querySelector('#openConfigurationChat');launcher.setAttribute('aria-expanded','false');launcher.setAttribute('aria-haspopup','dialog');
const form=panel.querySelector('form'),input=panel.querySelector('textarea'),status=panel.querySelector('[data-status]'),log=panel.querySelector('[role=log]'),send=form.querySelector('[type=submit]'),clear=panel.querySelector('[data-clear]'),welcome=panel.querySelector('.chat-welcome');
let messages=[],busy=false,taskBusy=false,model='',connecting=null,mode='advice',requestTimeoutMs=300000;
function updateControls(){const locked=busy||taskBusy;send.disabled=locked;clear.disabled=locked;input.disabled=locked;panel.querySelectorAll('[data-chat-mode]').forEach(b=>b.disabled=locked);}
const taskPanel=initTaskPanel(app,panel,{onBusy:value=>{taskBusy=value;if(value){mode='configure';panel.querySelectorAll('[data-chat-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.chatMode===mode)));}updateControls();}});
panel.querySelectorAll('[data-chat-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.chatMode===mode)));
panel.querySelector('.chat-welcome p').textContent='Posso consultar o inventário, localizar equipamentos e explicar os passos. Escolhe Configurar por mim para alterar o projeto.';
panel.querySelectorAll('[data-chat-mode]').forEach(button=>button.onclick=()=>{if(busy||taskBusy)return;mode=button.dataset.chatMode;refreshSuggestions();panel.querySelectorAll('[data-chat-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));status.textContent=mode==='configure'?'As ações válidas serão aplicadas ao projeto.':'Este modo responde sem alterar o projeto.';});
function refreshSuggestions(){const root=panel.querySelector('.chat-suggestions');root.replaceChildren();for(const suggestion of configurationSuggestions(app.get().project,app.get(),mode)){const button=document.createElement('button');button.type='button';button.textContent=suggestion.label;button.onclick=()=>{input.value=suggestion.prompt;resize();input.focus();};root.append(button);}}
function setOpen(open){panel.hidden=!open;launcher.setAttribute('aria-expanded',String(open));if(open){taskPanel.restore();refreshSuggestions();connect().catch(()=>{});input.focus({preventScroll:true});}else launcher.focus({preventScroll:true});}
launcher.addEventListener('click',()=>setOpen(panel.hidden));
panel.querySelector('[data-close]').onclick=()=>setOpen(false);
panel.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setOpen(false);}});
function append(role,content){const item=document.createElement('p'),label=document.createElement('strong');label.textContent=role==='user'?'Tu':'Atlas';item.append(label,document.createTextNode(content));item.className='chat-message chat-message-'+role;log.append(item);welcome.hidden=true;log.scrollTop=log.scrollHeight;}
async function connect(){
 if(model)return model;if(connecting)return connecting;
 connecting=(async()=>{const response=await fetch('/api/assistant/chat',{cache:'no-store',signal:AbortSignal.timeout(8000)});if(response.status===404)throw Error('O modelo de IA não está ligado nesta instalação. Podes continuar a consultar o projeto, os guias e os comandos diretos.');const data=await response.json();if(!response.ok)throw Error(data.error||'Não foi possível contactar o assistente.');if(Number.isInteger(data.requestTimeoutMs)&&data.requestTimeoutMs>=10000&&data.requestTimeoutMs<=900000)requestTimeoutMs=data.requestTimeoutMs;model=data.models?.[0]||'';if(!model)throw new Error();panel.querySelector('.chat-identity small').textContent=model+' · configuração do projeto';return model;})();
 try{return await connecting;}finally{connecting=null;}
}
function resize(){input.style.height='auto';input.style.height=Math.min(input.scrollHeight,112)+'px';}
input.addEventListener('input',resize);
input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();if(!busy&&!taskBusy)form.requestSubmit();}});
clear.onclick=()=>{if(busy||taskBusy)return;messages=[];log.replaceChildren();welcome.hidden=false;input.value='';resize();status.textContent='';input.focus();};
panel.querySelectorAll('[data-prompt]').forEach(button=>button.onclick=()=>{input.value=button.dataset.prompt;resize();input.focus();});
function paintDiagnosis(diagnosis){
 const root=document.createElement('details');root.className='chat-diagnosis';root.setAttribute('aria-label','Diagnóstico explicado');root.open=true;const summary=document.createElement('summary');summary.textContent='Diagnóstico · '+diagnosis.name;root.append(summary);
 const conclusion=document.createElement('p');conclusion.textContent=diagnosis.conclusion;root.append(conclusion);
 if(diagnosis.reachedSwitch&&diagnosis.path.length>1){const route=document.createElement('p');route.textContent='Percurso documentado: '+diagnosis.path.map(id=>app.get().project.devices.find(d=>d.id===id)?.name||'?').join(' → ');root.append(route);}
 for(const finding of diagnosis.findings.slice(0,12)){
  const item=document.createElement('article'),title=document.createElement('strong'),evidence=document.createElement('p'),next=document.createElement('p');item.dataset.diagnosisKind=finding.kind;title.textContent={fault:'Incompatibilidade documentada',gap:'Falta de registo',confirm:'Por confirmar'}[finding.kind];evidence.textContent=finding.evidence;next.textContent='Próximo passo: '+finding.next;item.append(title,evidence,next);
  const target=finding.target,element=app.get().project[target.type]?.find(x=>x.id===target.id);if(element){const button=document.createElement('button');button.type='button';button.textContent='Abrir '+(element.name||element.label||target.id)+(finding.port?' / '+finding.port:'');button.onclick=()=>{if(app.get().project[target.type]?.some(x=>x.id===target.id))app.reveal(target);else status.textContent='O elemento mudou. Repete o diagnóstico.';};item.append(button);}root.append(item);
 }
 if(diagnosis.findings.length>12){const more=document.createElement('p');more.textContent='Mais '+(diagnosis.findings.length-12)+' observações. Consulte a Verificação do projeto.';root.append(more);}
 const limit=document.createElement('small');limit.textContent=diagnosis.limit;root.append(limit);log.append(root);root.scrollIntoView({block:'start'});
}
function paintAgentReport(result){
 const report=agentReport(result),root=document.createElement('details');root.className='chat-agent-report';root.setAttribute('aria-label','Plano e verificação do agente');const summary=document.createElement('summary');summary.textContent='Agente · '+report.steps.length+' etapa(s) · '+report.warnings.length+' observação(ões)';root.append(summary);
 for(const tool of report.tools){const p=document.createElement('p');p.textContent=tool.summary;root.append(p);}const checks=document.createElement('ul');for(const text of report.checks){const li=document.createElement('li');li.textContent='✓ '+text;checks.append(li);}root.append(checks);
 if(report.warnings.length){const heading=document.createElement('p');heading.textContent='Por confirmar nos registos / no local:';root.append(heading);const list=document.createElement('ul');for(const text of report.warnings.slice(0,20)){const li=document.createElement('li');li.textContent=text;list.append(li);}root.append(list);if(report.warnings.length>20){const p=document.createElement('p');p.textContent='Mais '+(report.warnings.length-20)+' observações na Verificação do projeto.';root.append(p);}}
 log.append(root);for(const diagnosis of report.diagnoses||[])paintDiagnosis(diagnosis);
}
function paintPlanReview(result,projectAtPlan,generationAtPlan,onApplied){
 const root=document.createElement('section');root.className='chat-plan-review';root.setAttribute('aria-label','Revisão antes de aplicar');
 const title=document.createElement('strong');title.textContent='Rever alterações antes de aplicar';root.append(title);
 const list=document.createElement('ul');for(const text of result.descriptions){const item=document.createElement('li');item.textContent=text;list.append(item);}root.append(list);
 const affected=new Map();for(const link of result.expectedLinks||[])for(const id of [link.a,link.b]){const device=result.project.devices.find(d=>d.id===id);if(device)affected.set(id,device.name);}
 for(const entry of result.expectedInterfaces||[]){const device=result.project.devices.find(d=>d.id===entry.device);if(device)affected.set(device.id,device.name+' · '+entry.port);}
 if(affected.size){const note=document.createElement('p');note.textContent='Equipamentos afetados: '+[...affected.values()].join(', ');root.append(note);}
 const actions=document.createElement('div');actions.className='chat-plan-actions';const apply=document.createElement('button');apply.type='button';apply.textContent='Aplicar alterações';apply.className='chat-plan-apply';const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Cancelar';cancel.className='chat-plan-cancel';actions.append(apply,cancel);root.append(actions);log.append(root);root.scrollIntoView({block:'start'});
 const finish=()=>{apply.disabled=true;cancel.disabled=true;};cancel.onclick=()=>{finish();root.dataset.result='cancelled';status.textContent='Plano cancelado · nenhuma alteração aplicada.';};
 apply.onclick=async()=>{if(apply.disabled)return;finish();try{
  if(!app.get().ready||app.get().conflict)throw Error('Resolve o conflito de gravação antes de aplicar.');
  if(app.get().generation!==generationAtPlan||JSON.stringify(app.get().project)!==projectAtPlan)throw Error('O projeto mudou desde a preparação. Envia o pedido novamente para rever um plano atualizado.');
  verifyAgentPlan(result.project,result);
  if(!app.change(project=>{for(const key of Object.keys(project))delete project[key];Object.assign(project,result.project);},'IA · configurar o projeto'))throw Error('Não foi possível aplicar a configuração.');
  onApplied();verifyAgentPlan(app.get().project,result);const receipt=app.get().generation;
  const answer='Configuração aplicada no Atlas:\n'+result.descriptions.map(text=>'• '+text).join('\n');append('assistant',answer);
  const undo=document.createElement('button');undo.type='button';undo.className='chat-undo-action';undo.textContent='↶ Desfazer esta configuração';undo.onclick=()=>{if(app.get().generation!==receipt){status.textContent='O projeto mudou entretanto. Usa o histórico para rever ou recuperar esta configuração.';undo.disabled=true;return;}app.undo();undo.disabled=true;status.textContent='Configuração anulada. A gravação é automática.';};log.append(undo);
  app.reveal(result.focus);const saved=await app.save();status.textContent=saved?'Configuração guardada.':'Aplicado no editor · gravação automática pendente. Verifica o estado de gravação do projeto.';root.dataset.result='applied';
 }catch(error){status.textContent=error.message;root.dataset.result='stale';}};
}
form.onsubmit=async event=>{
 event.preventDefault();if(busy||taskBusy||!input.value.trim())return;
 if(!app.get().ready||app.get().conflict){status.textContent='Aguarda o carregamento ou resolve o conflito de gravação antes de usar a IA.';return;}
 const content=input.value.trim(),requestMode=assistantRequestMode(mode,content),snapshot=assistantContext(app.get().project,app.get(),content);busy=true;send.disabled=true;clear.disabled=true;input.disabled=true;panel.querySelectorAll('[data-chat-mode]').forEach(b=>b.disabled=true);status.textContent=requestMode==='configure'?'A preparar a configuração…':'A pensar…';panel.setAttribute('aria-busy','true');append('user',content);
 let applied=false;const started=performance.now(),waiting=setInterval(()=>{const seconds=Math.floor((performance.now()-started)/1000);status.textContent=(requestMode==='configure'?'A preparar a configuração':'A aguardar a IA')+' · '+seconds+' s'+(seconds>=15?' · o modelo local ainda está a processar':'');},1000);
 try{
 let local=null;
 if(requestMode==='configure')local=localConfiguration(content,snapshot);else if(assistantRequestMode('configure',content)==='configure'){let recognized=false,parsed;try{parsed=localConfiguration(content,snapshot);recognized=!!parsed;}catch{recognized=true;}if(parsed?.actions?.length&&parsed.actions.every(a=>['verify_network','diagnose_network'].includes(a.action))){const result=prepareAgentPlan(app.get().project,parsed.actions,snapshot);paintAgentReport(result);local={reply:result.descriptions.join('\n'),source:'local-verification',mode:'advice',sources:[]};}else if(recognized)local={reply:'Este é um pedido para alterar o projeto. Escolhe Configurar por mim e envia a mensagem novamente. O pedido ficou na caixa de texto; nenhuma alteração foi aplicada.',source:'command-hint',mode:'advice',sources:[]};}
 const quick=projectAnswer(app.get().project,app.get(),content)||quickGuideAnswer(content)||local;
 let data;
 if(quick){data=quick;}else{
 await connect();const history=[...messages,{role:'user',content}].slice(-7).map(m=>({role:m.role,content:snapshot.mask(m.content).slice(0,2400)}));
 const response=await fetch('/api/assistant/chat',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(requestTimeoutMs+5000),body:JSON.stringify({model,mode:requestMode,messages:history,context:snapshot.context})});
 data=await response.json();if(!response.ok){if(response.status===503)model='';throw Error(data.error||'Não foi possível obter resposta.');}
 }
 clearInterval(waiting);
 if(data.source==='local-task'){if(!local?.task||JSON.stringify(local.task)!==JSON.stringify(data.task))throw Error('O plano não corresponde ao pedido local.');const job=await taskPanel.start(data.task,content);append('assistant',job.summary+'\n'+job.message);status.textContent=job.message;input.value='';resize();return;}
 let answer=snapshot.restore(data.reply||'')||'O pedido não produziu alterações.';
 if(requestMode==='configure'&&data.actions?.length){
 if(app.get().conflict||!app.get().ready)throw Error('A gravação tem um conflito. Nada foi aplicado pela IA.');
 status.textContent='A consultar o projeto e validar o plano…';const result=prepareAgentPlan(app.get().project,data.actions,snapshot);paintAgentReport(result);
 if(!result.changed){answer='Projeto revisto:\n'+result.descriptions.map(text=>'• '+text).join('\n');append('assistant',answer);status.textContent='Sem alterações necessárias · verificação concluída.';}else{
  paintPlanReview(result,JSON.stringify(app.get().project),app.get().generation,()=>{applied=true;});status.textContent='Revisa o plano e escolhe Aplicar alterações ou Cancelar.';
 }
 }else{if(!data.diagnosis)append('assistant',answer);status.textContent=data.source==='diagnosis'?'Diagnóstico local · nenhuma alteração.':data.source==='command-hint'?'Escolhe Configurar por mim para aplicar.':data.source==='project'?'Consulta local · registos do projeto':data.source==='documentation'?'Resposta imediata · guia do Atlas':requestMode==='configure'?'Nenhuma alteração foi aplicada.':'';}
 if(data.diagnosis)paintDiagnosis(data.diagnosis);
 if(data.source==='project'&&Array.isArray(data.targets)&&data.targets.length){const targets=document.createElement('div');targets.className='chat-project-targets';targets.setAttribute('aria-label','Resultados no projeto');for(const target of data.targets){const button=document.createElement('button');button.type='button';button.textContent=target.label;button.onclick=()=>{if(!app.get().project[target.type]?.some(item=>item.id===target.id)){status.textContent='Este elemento já não existe. Repete a consulta.';return;}app.reveal(target);};targets.append(button);}log.append(targets);}
 if(Array.isArray(data.sources)&&data.sources.length){const sources=document.createElement('div');sources.className='chat-sources';sources.setAttribute('aria-label','Guias consultados');sources.append(document.createTextNode('Guias consultados: '));for(const source of data.sources){const guide=assistantGuides.find(g=>g.id===source.id);if(!guide)continue;const button=document.createElement('button');button.type='button';button.textContent=guide.title;button.onclick=()=>{search.value=guide.title;showGuides();help.open=true;const article=articles.querySelector('[data-guide-id="'+guide.id+'"]');if(article){article.open=true;article.querySelector('summary').focus();}};sources.append(button);}log.append(sources);}
 if(!['project','diagnosis','local-verification','local-command','command-hint'].includes(data.source))messages=[...messages,{role:'user',content},{role:'assistant',content:answer}].slice(-10);if(data.source!=='command-hint')input.value='';resize();
 }catch(error){clearInterval(waiting);const reason=error?.name==='TimeoutError'?'O modelo demorou demasiado a responder. Tenta dividir o pedido em passos mais pequenos.':error instanceof TypeError&&/fetch|network|load failed/i.test(error.message)?'Não foi possível ligar ao servidor do Atlas. Confirma que o Atlas está iniciado e que tens ligação, e volta a enviar o pedido. A mensagem foi mantida na caixa de texto.':error?.message||'Não consegui responder agora. Tenta novamente.';status.textContent=reason;append('assistant',(applied?'As alterações foram aplicadas no editor; confirma a gravação. ':'Não apliquei alterações. ')+reason);}
 finally{clearInterval(waiting);const duration=document.createElement('small');duration.className='chat-response-time';duration.textContent='Tempo do pedido: '+((performance.now()-started)/1000).toFixed(1)+' s';log.append(duration);busy=false;updateControls();panel.removeAttribute('aria-busy');if(!panel.hidden)input.focus({preventScroll:true});}
};
return{open:()=>setOpen(true)};
}
