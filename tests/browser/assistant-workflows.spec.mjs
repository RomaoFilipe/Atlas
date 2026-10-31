import {test,expect} from '@playwright/test';
import {normalizeProject} from '../../public/model.js';
import {assistantContext,executeAssistantActions} from '../../public/assistant-actions.js';
import {localConfiguration} from '../../public/assistant-local-actions.js';
import {officeExample} from '../../public/assistant-office.js';
import {makeExample} from '../../public/examples.js';
const origin='http://127.0.0.1:31482';
const empty=()=>normalizeProject({version:3,name:'Teste',sites:[],floors:[],rooms:[],racks:[],devices:[],links:[],nets:[],templates:[]});
async function seed(page,project){const {revision}=await(await page.request.get('/api/project')).json();expect((await page.request.put('/api/project',{headers:{Origin:origin},data:{revision,project}})).ok()).toBe(true);}
async function chat(page){await page.goto('/editor.html');await expect(page.locator('#saveBadge')).toContainText('Guardado');await page.locator('#openConfigurationChat').click();await page.getByRole('button',{name:'Configurar por mim',exact:true}).click();}
async function ask(page,prompt){await page.locator('#configurationChatPrompt').fill(prompt);await page.getByRole('button',{name:'Enviar mensagem',exact:true}).click();}
test.afterEach(async({page})=>{await seed(page,normalizeProject(makeExample('connections')));});
test('repair and bulk addressing save real changes without a model and can be undone',async({page})=>{
 let p=empty();Object.assign(p,{sites:[{id:'s',name:'Sede',sub:'',x:0,z:0,w:30,d:30}],floors:[{id:'f',site:'s',name:'Piso 0',level:0,elevation:0}],rooms:[{id:'r',name:'Sala',floor:'f',x:0,z:0,w:12,d:10}]});const snap=assistantContext(p,{roomId:'r'},officeExample);p=executeAssistantActions(p,localConfiguration(officeExample,snap).actions,snap).project;const missing=p.links.find(l=>l.portA==='R1');p.links=p.links.filter(l=>l.id!==missing.id);await seed(page,p);
 const modelCalls=[];await page.route('**/api/assistant/chat',route=>{if(route.request().method()==='POST')modelCalls.push(route.request());return route.fulfill({status:404,body:'Not found'});});await page.setViewportSize({width:390,height:844});await page.goto('/editor.html');await expect(page.locator('#saveBadge')).toContainText('Guardado');await page.locator('#search').fill('PC · Sala 01');await page.locator('#search').press('Enter');await page.locator('#openConfigurationChat').click();await page.getByRole('button',{name:'Configurar por mim',exact:true}).click();
 await ask(page,'Revê esta sala e completa as ligações que faltam, usando as portas livres.');await expect(page.locator('[data-status]')).toContainText('Configuração guardada');await expect(page.locator('.chat-message-assistant').last()).toContainText('21/21');
 await ask(page,'Usa a rede 192.168.10.0/24, reserva o gateway .1 e atribui IPs aos computadores sem repetir endereços.');await expect(page.locator('[data-status]')).toContainText('Configuração guardada');const {project}=await(await page.request.get('/api/project')).json(),pcs=project.devices.filter(d=>d.type==='Computador');expect(new Set(pcs.map(d=>d.ip)).size).toBe(20);expect(pcs.every(d=>d.gateway==='192.168.10.1'&&d.ip!=='192.168.10.1')).toBe(true);expect(project.links).toHaveLength(63);expect(modelCalls).toHaveLength(0);
 await page.getByRole('button',{name:'Desfazer esta configuração',exact:false}).last().click();await expect.poll(async()=>{const {project}=await(await page.request.get('/api/project')).json();return project.devices.filter(d=>d.type==='Computador'&&d.ip).length;}).toBe(0);
});
test('a branch plan pauses after a save, survives reload, resumes and undoes its last stage',async({page})=>{
 await seed(page,empty());await page.setViewportSize({width:390,height:844});await page.route('**/api/assistant/chat',route=>route.fulfill({status:404,body:'Not found'}));
 let release,reached,held=false;const gate=new Promise(r=>release=r),first=new Promise(r=>reached=r);
 await page.route('**/api/project',async route=>{if(['PUT','PATCH'].includes(route.request().method())&&!held){held=true;reached();await gate;}await route.continue();});
 try{await chat(page);await ask(page,'Prepara uma filial com dois pisos, três departamentos e 40 postos.');await first;await page.locator('[data-task-pause]').click();release();await expect(page.locator('[data-task-status]')).toContainText('Plano em pausa');let state=await(await page.request.get('/api/project')).json();expect(state.project.sites).toHaveLength(1);expect(state.project.floors).toHaveLength(0);
  await page.reload();await expect(page.locator('#saveBadge')).toContainText('Guardado');await page.locator('#openConfigurationChat').click();await expect(page.locator('[data-task-status]')).toContainText('Plano recuperado');await page.locator('[data-task-resume]').click();await expect(page.locator('[data-task-status]')).toContainText('Plano concluído e guardado',{timeout:20000});state=await(await page.request.get('/api/project')).json();expect(state.project.floors).toHaveLength(2);expect(state.project.rooms).toHaveLength(3);expect(state.project.devices.filter(d=>d.type==='Computador')).toHaveLength(40);expect(state.project.sites).toHaveLength(1);
  await page.locator('[data-task-undo]').click();await expect(page.locator('[data-task-status]')).toContainText('Última etapa desfeita e guardada');state=await(await page.request.get('/api/project')).json();expect(state.project.rooms).toHaveLength(2);expect(state.project.devices.filter(d=>d.type==='Computador')).toHaveLength(27);await page.locator('[data-task-cancel]').click();
 }finally{release();}
});
