import {test,expect} from '@playwright/test';
for(const width of [1280,390])test('project answers stay local, read-only and navigable at '+width+'px',async({page})=>{
 const writes=[],modelCalls=[],errors=[];
 page.on('request',r=>{if(r.url().endsWith('/api/project')&&['PUT','PATCH'].includes(r.method()))writes.push(r);if(r.url().endsWith('/api/assistant/chat')&&r.method()==='POST')modelCalls.push(r);});page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/assistant/chat',route=>route.fulfill({status:404,body:'Not found'}));
 await page.setViewportSize({width,height:844});await page.goto('/');await expect(page.locator('#saveBadge')).toContainText(/Guardado|Exemplo/);await page.locator('#openConfigurationChat').click();
 await page.getByRole('button',{name:'Configurar por mim',exact:true}).click();
 const ask=async prompt=>{await page.locator('#configurationChatPrompt').fill(prompt);await page.getByRole('button',{name:'Enviar mensagem',exact:true}).click();await expect(page.locator('[data-status]')).toContainText('Consulta local');};
 await ask('Quantos switches existem?');await expect(page.locator('.chat-message-assistant').last()).toContainText('switches registado(s)');
 await ask('Onde está POSTO-01?');const button=page.locator('.chat-project-targets').last().getByRole('button',{name:'Abrir POSTO-01',exact:true});await expect(button).toBeVisible();await button.click();
 await ask('Resume o equipamento selecionado');await expect(page.locator('.chat-message-assistant').last()).toContainText('POSTO-01');await expect(page.locator('.chat-message-assistant').last()).toContainText('não confirmam o funcionamento real');
 expect(modelCalls).toHaveLength(0);expect(writes).toHaveLength(0);expect(errors).toEqual([]);
});
test('hosted chat explains when the model endpoint is unavailable',async({page})=>{
 await page.route('**/api/assistant/chat',route=>route.fulfill({status:404,body:'Not found'}));await page.goto('/');await expect(page.locator('#saveBadge')).toContainText(/Guardado|Exemplo/);await page.locator('#openConfigurationChat').click();await page.locator('#configurationChatPrompt').fill('Ajuda-me a planear uma infraestrutura para um novo armazém.');await page.getByRole('button',{name:'Enviar mensagem',exact:true}).click();await expect(page.locator('[data-status]')).toContainText('O modelo de IA não está ligado nesta instalação');await expect(page.locator('[data-status]')).not.toContainText('JSON');
});
