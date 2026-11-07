import {test,expect} from '@playwright/test';
test('public home explains Atlas and signup opens a new isolated workspace map',async({page})=>{
 await page.goto('/');await expect(page.getByRole('heading',{name:/Veja a rede.*Siga o cabo.*Entenda tudo/})).toBeVisible();await expect(page.getByRole('link',{name:'Criar o meu mapa'}).first()).toHaveAttribute('href','/register');await expect(page.getByRole('link',{name:'Entrar',exact:true})).toHaveAttribute('href','/login');
 await expect(page.locator('.campus-image')).toHaveJSProperty('naturalWidth',1536);
 await page.getByRole('button',{name:'Lógica',exact:true}).click();await expect(page.locator('[data-map-preview]')).toHaveAttribute('data-layer','logical');await expect(page.locator('.layer-detail')).toContainText('VLAN 30');
 await page.getByRole('button',{name:'Plantas 2D',exact:true}).click();await expect(page.locator('.plan-view')).toBeVisible();await expect(page.locator('[data-map-preview]')).toHaveAttribute('data-view','plan');
 await page.getByRole('button',{name:'Bastidores',exact:true}).click();await expect(page.locator('.rack-view')).toBeVisible();
 await page.getByRole('button',{name:'Ver o percurso'}).click();await expect(page.locator('[data-map-preview]')).toHaveAttribute('data-view','campus');await expect(page.locator('[data-map-preview]')).toHaveAttribute('data-layer','physical');
 await page.getByRole('button',{name:'Pausar animação'}).click();await expect(page.locator('body')).toHaveClass(/is-paused/);
 await page.locator('.journey-steps [data-step="3"]').click();await expect(page.locator('#route-status')).toContainText('Switch SW-01');
 await page.goto('/register');await page.getByLabel('Nome da empresa ou equipa').fill('Rede Lisboa');await page.getByLabel('Email de trabalho').fill('filipe@example.pt');await page.getByLabel('Palavra-passe',{exact:true}).fill('uma-palavra-passe-segura');await page.getByLabel('Confirmar palavra-passe').fill('uma-palavra-passe-segura');await page.getByRole('button',{name:'Criar conta e o meu mapa'}).click();
 await expect(page).toHaveURL(/\/editor\.html\?welcome=1/);await expect(page.locator('#saveStatus')).toContainText('primeiro edifício');await expect(page.locator('#saveBadge')).toHaveAttribute('data-state','pending');
 const session=await(await page.request.get('/api/session')).json();expect(session).toMatchObject({actor:'filipe@example.pt',role:'admin',organization:'rede-lisboa'});const project=await(await page.request.get('/api/project')).json();expect(project.project).toBeNull();expect(project.revision).toBe(0);
 await page.reload();await expect(page.locator('#saveStatus')).toContainText('primeiro edifício');await expect(page.locator('#saveBadge')).toHaveAttribute('data-state','pending');
});

test('public home stays usable on mobile with reduced motion and keyboard controls',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await expect(page.locator('.campus-image')).toHaveJSProperty('naturalWidth',1536);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await expect(page.getByRole('button',{name:'Retomar animação'})).toBeVisible();
 const flow=page.locator('.cable-flow');
 expect(await flow.evaluate(element=>getComputedStyle(element).animationName)).toBe('none');
 const switchStep=page.locator('.journey-steps [data-step="3"]');
 await switchStep.focus();await page.keyboard.press('Enter');
 await expect(page.locator('#route-status')).toContainText('Switch SW-01');
 await page.getByRole('button',{name:'Operação',exact:true}).click();
 await expect(page.locator('.layer-detail')).toContainText('Tarefa de exemplo');
 await page.getByRole('button',{name:'Plantas 2D',exact:true}).click();
 await expect(page.locator('.plan-view')).toBeVisible();
 await page.getByRole('button',{name:'Bastidores',exact:true}).click();
 await expect(page.locator('.rack-view')).toBeVisible();
 for(const width of [360,768,1024,1536]){
  await page.setViewportSize({width,height:900});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
