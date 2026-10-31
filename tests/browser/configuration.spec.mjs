import {test,expect} from '@playwright/test';
test('guides work without Ollama and open the real floor-plan panel',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/assistant/chat',route=>route.fulfill({status:503,json:{error:'Ollama indisponível'}}));
 await page.goto('/editor.html');await expect(page.locator('#saveBadge')).toContainText(/Guardado|Exemplo/);
 await page.locator('#openConfigurationChat').click();
 await expect(page.getByRole('button',{name:'Só conversar',exact:true})).toHaveAttribute('aria-pressed','true');
 const help=page.locator('.chat-local-help');await help.locator(':scope > summary').click();
 await page.getByRole('searchbox',{name:'Pesquisar guias de configuração'}).fill('calibrar');
 const guide=page.locator('[data-guide-id="floorplans"]');await guide.locator('summary').click();await expect(guide).toContainText('dois pontos');
 await guide.getByRole('button',{name:'Abrir no Atlas'}).click();await expect(page.locator('#studio')).toBeVisible();await expect(page.locator('#studio')).toContainText('Importar planta');
 expect(errors).toEqual([]);
});
test('a help question in configure mode is sent as advice, cites a guide and never mutates the project',async({page})=>{
 const writes=[];let sent;
 page.on('request',r=>{if(r.url().endsWith('/api/project')&&['PUT','PATCH'].includes(r.method()))writes.push(r);});
 await page.route('**/api/assistant/chat',async route=>{if(route.request().method()==='GET')return route.fulfill({json:{models:['qwen3:14b']}});sent=route.request().postDataJSON();await route.fulfill({json:{reply:'Abre Configurar o projeto.',sources:[{id:'start',title:'Configurar o projeto desde zero'}]}});});
 await page.goto('/editor.html');await expect(page.locator('#saveBadge')).toBeVisible();await page.locator('#openConfigurationChat').click();await page.getByRole('button',{name:'Configurar por mim',exact:true}).click();
 await page.locator('#configurationChatPrompt').fill('Como criar um edifício?');await page.getByRole('button',{name:'Enviar mensagem',exact:true}).click();
 await expect(page.locator('.chat-message-assistant')).toContainText('Criar edifícios');expect(sent).toBeUndefined();expect(writes).toHaveLength(0);await expect(page.locator('[data-status]')).toContainText('Resposta imediata');
 await page.locator('.chat-sources button').click();await expect(page.locator('[data-guide-id="spaces"]')).toHaveAttribute('open','');
 await page.locator('#configurationChat').press('Escape');await expect(page.locator('#openConfigurationChat')).toBeFocused();
});
test('help remains usable on a narrow screen',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/editor.html');await page.locator('#openConfigurationChat').click();
 await page.locator('.chat-local-help > summary').click();await page.getByRole('searchbox',{name:'Pesquisar guias de configuração'}).fill('cópias');
 await page.locator('[data-guide-id="backups"] > summary').click();await expect(page.locator('[data-guide-id="backups"]')).toContainText('chaves');
 const box=await page.locator('#configurationChat').boundingBox();expect(box.width).toBeLessThanOrEqual(390);expect(box.x).toBeGreaterThanOrEqual(0);
});
test('a simple configuration works without the model and persists without creating implicit floors',async({page})=>{
 await page.route('**/api/assistant/chat',route=>route.fulfill({status:503,json:{error:'Ollama indisponível'}}));
 await page.goto('/editor.html');await expect(page.locator('#saveBadge')).toBeVisible();await page.locator('#openConfigurationChat').click();await page.getByRole('button',{name:'Configurar por mim',exact:true}).click();
 await page.locator('#configurationChatPrompt').fill('Cria um edifício chamado Sede Rápida sem pisos nem salas.');await page.getByRole('button',{name:'Enviar mensagem',exact:true}).click();
 await expect(page.locator('.chat-message-assistant')).toContainText('Configuração aplicada');await expect(page.locator('[data-status]')).toContainText('guardada');
 const {project}=await (await page.request.get('/api/project')).json(),site=project.sites.find(s=>s.name==='Sede Rápida');expect(site).toBeTruthy();expect(project.floors.some(f=>f.site===site.id)).toBe(false);
 await page.getByRole('button',{name:'Desfazer esta configuração',exact:false}).click();await expect(page.locator('[data-status]')).toContainText('anulada');
});
