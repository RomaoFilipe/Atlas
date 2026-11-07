import {test,expect} from '@playwright/test';

test('registration artwork, password controls and server errors work before login',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/register');
 await expect(page.getByRole('heading',{name:'Vamos começar.'})).toBeVisible();
 await expect.poll(()=>page.locator('.office-visual img').evaluate(image=>image.naturalWidth)).toBeGreaterThan(0);
 await page.getByLabel('Nome da empresa ou equipa').fill('Equipa de teste');
 await page.getByLabel('Email de trabalho').fill('registration-test@example.pt');
 const password=page.getByLabel('Palavra-passe',{exact:true});
 await password.fill('uma-palavra-passe-segura');
 const visibility=page.getByRole('button',{name:'Mostrar palavra-passe',exact:true});
 await visibility.focus();await page.keyboard.press('Enter');
 await expect(password).toHaveAttribute('type','text');
 await expect(page.getByRole('button',{name:'Ocultar palavra-passe',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Ocultar palavra-passe',exact:true}).click();
 await expect(password).toHaveAttribute('type','password');
 await page.getByLabel('Confirmar palavra-passe').fill('outra-palavra-passe-segura');
 await page.getByRole('button',{name:'Criar conta e o meu mapa'}).click();
 await expect(page.getByRole('alert')).toContainText('As palavras-passe não coincidem.');
 await expect(page.getByRole('alert')).toBeFocused();
 await expect(password).toHaveValue('');
 await expect(page.getByLabel('Confirmar palavra-passe')).toHaveValue('');
 expect(errors).toEqual([]);
});

test('registration fits mobile and respects reduced motion',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:390,height:844});
 await page.goto('/register');
 await expect(page.getByRole('button',{name:'Retomar animação'})).toHaveAttribute('aria-pressed','true');
 expect(await page.locator('.route-pulse').evaluate(element=>getComputedStyle(element).animationName)).toBe('none');
 await expect(page.getByRole('button',{name:'Criar conta e o meu mapa'})).toBeVisible();
 for(const width of [360,390,768,1024,1536]){
  await page.setViewportSize({width,height:1024});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.getByRole('button',{name:'Retomar animação'}).click();
 await expect(page.getByRole('button',{name:'Pausar animação'})).toHaveAttribute('aria-pressed','false');
 await expect(page.locator('.register-header a[href="/login"]')).toBeVisible();
});
