import {test,expect} from '@playwright/test';

test('login shows errors, supports password visibility and preserves the requested destination',async({page})=>{
 const signup=await page.request.post('/register',{form:{organizationName:'Login Test',email:'login-design@example.pt',password:'example-password-login',passwordConfirm:'example-password-login'}});
 expect(signup.ok()).toBe(true);await page.context().clearCookies();
 await page.goto('/login?next=%2Fhome.html');
 await expect(page.getByRole('heading',{name:'Bem-vindo de volta.'})).toBeVisible();
 await expect.poll(()=>page.locator('.office-visual img').evaluate(image=>image.naturalWidth)).toBeGreaterThan(0);
 await page.getByLabel('Email ou utilizador',{exact:true}).fill('login-design@example.pt');
 const password=page.getByLabel('Palavra-passe',{exact:true});await password.fill('wrong-password');
 const show=page.getByRole('button',{name:'Mostrar palavra-passe',exact:true});await show.focus();await page.keyboard.press('Enter');
 await expect(password).toHaveAttribute('type','text');
 await page.getByRole('button',{name:'Ocultar palavra-passe',exact:true}).click();await expect(password).toHaveAttribute('type','password');
 await page.getByRole('button',{name:'Entrar no Atlas',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('Email ou palavra-passe incorretos.');
 await expect(page.getByRole('alert')).toBeFocused();await expect(password).toHaveValue('');
 await expect(page.locator('form')).toHaveAttribute('action','/login?next=%2Fhome.html');
 await page.getByLabel('Email ou utilizador',{exact:true}).fill('login-design@example.pt');await password.fill('example-password-login');
 await page.getByRole('button',{name:'Entrar no Atlas',exact:true}).click();
 await expect(page).toHaveURL(/\/home\.html$/);
 expect((await(await page.request.get('/api/session')).json()).actor).toBe('login-design@example.pt');
});

test('login is responsive and respects reduced motion',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:390,height:844});await page.goto('/login');
 await expect(page.getByRole('button',{name:'Entrar no Atlas',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Retomar animação'})).toBeVisible();
 expect(await page.locator('.route-pulse').evaluate(element=>getComputedStyle(element).animationName)).toBe('none');
 for(const width of [360,390,768,1024,1536]){await page.setViewportSize({width,height:1024});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await expect(page.locator('.header-login a')).toHaveAttribute('href','/register');
 await expect(page.locator('input[name=password]')).toHaveAttribute('autocomplete','current-password');
});

test('login works without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
 try{
  const response=await page.request.post('http://127.0.0.1:31482/register',{form:{organizationName:'No JS Login',email:'login-nojs@example.pt',password:'example-password-nojs',passwordConfirm:'example-password-nojs'}});
  expect(response.ok()).toBe(true);await context.clearCookies();
  await page.goto('http://127.0.0.1:31482/login');
  await page.getByLabel('Email ou utilizador',{exact:true}).fill('login-nojs@example.pt');await page.getByLabel('Palavra-passe',{exact:true}).fill('example-password-nojs');
  await page.getByRole('button',{name:'Entrar no Atlas',exact:true}).click();await expect(page).toHaveURL(/\/editor\.html$/);
 }finally{await context.close();}
});
