import {test,expect} from '@playwright/test';
import {makeExample} from '../../public/examples.js';
const base='http://127.0.0.1:31482';
async function seed(page,project){const {revision}=await(await page.request.get('/api/project')).json();expect((await page.request.put('/api/project',{headers:{Origin:base},data:{revision,project}})).ok()).toBe(true);}
test.beforeEach(async({page})=>seed(page,makeExample('connections')));
test.afterEach(async({page})=>seed(page,makeExample('connections')));

test('editor keeps the canvas visible, shows actual ports and highlights a documented route without saving',async({page})=>{
 const errors=[],writes=[];page.on('pageerror',error=>errors.push(error.message));
 page.on('request',request=>{if(request.url().endsWith('/api/project')&&['PUT','PATCH'].includes(request.method()))writes.push(request.method());});
 await page.goto('/editor.html');await expect(page.locator('#saveStatus')).toContainText('Projeto carregado');await expect(page.locator('#saveBadge')).toHaveAttribute('data-state','saved');
 await expect(page.locator('#configurationGuide')).not.toHaveAttribute('open','');
 const box=await page.locator('#planCanvas').boundingBox();expect(box.y).toBeLessThan(400);
 const computer=page.locator('#planCanvas [data-plan-type=devices][data-plan-id=pc1]');await computer.focus();await page.keyboard.press('Enter');
 await expect(page.locator('#inspector h2')).toHaveText('POSTO-01');await expect(page.locator('.editor-device-portrait')).toContainText('Posto de trabalho');
 await expect(page.locator('.editor-device-overview')).toContainText('10.30.0.11');await expect(page.locator('.editor-port').first()).toContainText('Ethernet1');
 await expect(page.locator('.editor-circuit')).toContainText('TOMADA-DUPLA-A');
 await page.locator('.editor-follow-route').click();await expect(page.locator('#planCanvas path[data-plan-type=links][stroke-width="5"]').first()).toBeVisible();
 await page.locator('#primaryNavigation [data-workspace=inventory]').click();await expect(page.locator('#inventory')).toBeVisible();
 await page.locator('#primaryNavigation [data-workspace=map]').click();await expect(page.locator('#inventory')).toBeVisible();
 expect(errors).toEqual([]);expect(writes).toEqual([]);
});

test('the editor shows an honest empty state and opens the real building wizard',async({page})=>{
 await seed(page,{version:3,name:'Projeto vazio',sites:[],floors:[],rooms:[],racks:[],devices:[],links:[],nets:[],templates:[]});
 await page.goto('/editor.html');await expect(page.locator('#editorEmptyState')).toBeVisible();await expect(page.locator('#configurationGuide')).not.toHaveAttribute('open','');
 await page.locator('[data-empty-building]').click();await expect(page.locator('#featureDialog')).toBeVisible();
 expect((await(await page.request.get('/api/project')).json()).project.sites).toHaveLength(0);
});

test('editor navigation, inspector and configuration remain accessible on mobile',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:390,height:844});await page.goto('/editor.html');await expect(page.locator('#saveStatus')).toContainText('Projeto carregado');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('#toggleNavigation').click();await expect(page.locator('#navigationPanel')).toBeVisible();
 await page.locator('#configurationGuide>summary').click();await expect(page.locator('[data-guide-continue]')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('#configurationGuide')).not.toHaveAttribute('open','');
 await page.locator('#toggleSelection').click();await expect(page.locator('#selectionPanel')).toBeVisible();await page.locator('#closeSelection').click();await expect(page.locator('#selectionPanel')).toBeHidden();
 for(const width of [360,768,1024,1536]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});
