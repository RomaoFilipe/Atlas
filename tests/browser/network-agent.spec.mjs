import {test,expect} from '@playwright/test';
import {makeExample} from '../../public/examples.js';
import {normalizeProject} from '../../public/model.js';
async function seed(page,missing=true){const p=normalizeProject(makeExample('connections'));if(missing)p.links=p.links.filter(l=>!['POSTO-1','HORIZONTAL-1','PATCH-1'].includes(l.id));const {revision}=await(await page.request.get('/api/project')).json();expect((await page.request.put('/api/project',{headers:{Origin:'http://127.0.0.1:31482'},data:{revision,project:p}})).ok()).toBe(true);return p;}
async function open(page,name='POSTO-01'){await page.goto('/editor.html');await expect(page.locator('#saveBadge')).toContainText('Guardado');await page.locator('#search').fill(name);await page.locator('#search').press('Enter');await page.locator('#openConfigurationChat').click();await page.getByRole('button',{name:'Configurar por mim',exact:true}).click();}
async function ask(page,text){await page.locator('#configurationChatPrompt').fill(text);await page.getByRole('button',{name:'Enviar mensagem',exact:true}).click();}
async function approve(page){await page.getByRole('button',{name:'Aplicar alterações',exact:true}).click();await expect(page.locator('[data-status]')).toContainText('Configuração guardada');}
const data=async page=>(await(await page.request.get('/api/project')).json());
test.beforeEach(async({page})=>{await seed(page);});
test.afterEach(async({page})=>{await seed(page,false);});
test('network agent locally plans three cables, verifies the circuit, persists and undoes without duplicate work',async({page})=>{
 const errors=[],posts=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/api/assistant/chat',r=>{if(r.request().method()==='POST')posts.push(r.request().method());return r.fulfill({status:503,json:{error:'Offline'}});});await open(page);const before=await data(page);const prompt='Liga o equipamento selecionado à rede usando a tomada mais próxima.';await ask(page,prompt);await expect(page.locator('.chat-plan-review')).toContainText('Equipamentos afetados');await approve(page);
 await expect.poll(async()=>(await data(page)).project.links.length).toBe(before.project.links.length+3);const report=page.locator('.chat-agent-report').last();await expect(report).toContainText('Resultado do plano verificado');await expect(report).toContainText('3 cabo(s) novo(s)');await report.locator('summary').click();await expect(report).toContainText('Falta medir');const after=await data(page);for(const l of before.project.links)expect(after.project.links.find(x=>x.id===l.id)).toEqual(l);
 await ask(page,prompt);await expect(page.locator('[data-status]')).toContainText('Sem alterações necessárias');expect((await data(page)).project.links.length).toBe(after.project.links.length);
 await page.getByRole('button',{name:'Desfazer esta configuração',exact:false}).last().click();await expect.poll(async()=>(await data(page)).project.links.length).toBe(before.project.links.length);expect(posts).toHaveLength(0);expect(errors).toEqual([]);
});
test('interface configuration executes a validated batch and is preserved after reload',async({page})=>{
 await page.route('**/api/assistant/chat',r=>r.fulfill({status:503,json:{error:'Offline'}}));await open(page,'SW-PRINCIPAL');await ask(page,'Configura a porta "Gi1/0/1" do equipamento selecionado como access na VLAN 30; Configura a porta "Gi1/0/1" do equipamento selecionado para 100 Mbps em full duplex; Verifica as ligações do equipamento selecionado.');await approve(page);let state=await data(page);const c=state.project.devices.find(d=>d.id==='sw0').portProfiles.find(c=>c.port==='Gi1/0/1');expect(c).toMatchObject({mode:'access',accessVlan:30,speed:100,duplex:'full'});expect(c.maxSpeed).toBe(0);await page.reload();await expect(page.locator('#saveBadge')).toContainText('Guardado');state=await data(page);expect(state.project.devices.find(d=>d.id==='sw0').portProfiles[0]).toEqual(c);
});
test('an invalid final interface step rejects the entire batch and verification in conversation mode is read-only',async({page})=>{
 await open(page,'SW-PRINCIPAL');const before=await data(page);await ask(page,'Configura a porta "Gi1/0/1" do equipamento selecionado como access na VLAN 30; Configura a porta "Gi1/0/2" do equipamento selecionado como access na VLAN 999.');await expect(page.locator('[data-status]')).toContainText('VLAN');expect((await data(page)).project).toEqual(before.project);await page.getByRole('button',{name:'Só conversar',exact:true}).click();await ask(page,'Verifica as ligações do equipamento selecionado.');await expect(page.locator('.chat-messages')).toContainText('Verificação documental');expect((await data(page)).revision).toBe(before.revision);
});
test('a model can choose the nearest-outlet tool and receives only anonymous capability context',async({page})=>{
 const calls=[];await page.route('**/api/assistant/chat',r=>{if(r.request().method()==='GET')return r.fulfill({json:{models:['test-model']}});const body=r.request().postDataJSON();calls.push(body);return r.fulfill({json:{mode:'configure',reply:'',actions:[{action:'connect_nearest_outlet',device:body.context.selection,cable:'cat6',complete:true}]}});});await open(page);await ask(page,'Consegue preparar o caminho de rede deste posto pelo ponto de parede compatível mais próximo?');await approve(page);expect(calls).toHaveLength(1);const payload=JSON.stringify(calls[0]);expect(payload).not.toContain('POSTO-01');expect(payload).not.toContain('10.10.');expect(calls[0].context.devices.some(d=>d.ports.some(p=>typeof p.free==='boolean'))).toBe(true);
});
test('agent report keeps the composer usable on a phone',async({page})=>{
 await page.setViewportSize({width:390,height:844});await open(page);await ask(page,'Liga o equipamento selecionado à rede usando a tomada mais próxima.');await approve(page);const panel=await page.locator('#configurationChat').boundingBox(),composer=await page.locator('.chat-composer').boundingBox();expect(composer.y+composer.height).toBeLessThanOrEqual(panel.y+panel.height);expect(panel.width).toBeLessThanOrEqual(390);
});
test('cancelling a reviewed creation leaves the project unchanged',async({page})=>{
 await page.route('**/api/assistant/chat',r=>r.fulfill({status:503,json:{error:'Offline'}}));await open(page);const before=await data(page);await ask(page,'Liga o equipamento selecionado à rede usando a tomada mais próxima.');await expect(page.locator('.chat-plan-review')).toBeVisible();await page.getByRole('button',{name:'Cancelar',exact:true}).click();await expect(page.locator('[data-status]')).toContainText('Plano cancelado');expect((await data(page)).project).toEqual(before.project);
});

test('natural room cabling request works while the assistant connection is unavailable',async({page})=>{
 await page.route('**/api/assistant/chat',r=>r.abort('failed'));await open(page);
 const before=await data(page);
 await ask(page,'NESTA SALA FAZ A configuracao da rede e das fichas, e ligar os computadores !');
 await expect(page.locator('.chat-plan-review')).toBeVisible();
 expect((await data(page)).project).toEqual(before.project);
 await approve(page);expect((await data(page)).project.links.length).toBeGreaterThan(before.project.links.length);
});

test('a failed assistant fetch explains recovery and preserves the request',async({page})=>{
 await page.route('**/api/assistant/chat',r=>r.abort('failed'));await open(page);
 const before=await data(page),prompt='Consegue sugerir uma organização diferente para este espaço?';await ask(page,prompt);
 await expect(page.locator('[data-status]')).toContainText('Não foi possível ligar ao servidor do Atlas');
 await expect(page.locator('#configurationChatPrompt')).toHaveValue(prompt);
 expect((await data(page)).project).toEqual(before.project);
});
