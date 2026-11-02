import {test,expect} from '@playwright/test';
import {makeExample} from '../../public/examples.js';
import {normalizeProject} from '../../public/model.js';

test('Novo vazio replaces a project with locked equipment and can be undone',async({page})=>{
 const project=normalizeProject(makeExample('office'));
 expect(project.racks.some(r=>r.locked)).toBe(true);
 const {revision}=await(await page.request.get('/api/project')).json();
 expect((await page.request.put('/api/project',{headers:{Origin:'http://127.0.0.1:31482'},data:{revision,project}})).ok()).toBe(true);
 await page.goto('/editor.html');await expect(page.locator('#saveStatus')).toContainText('Projeto carregado');
 await page.locator('#projectMenu summary').first().click();page.once('dialog',dialog=>dialog.accept());await page.locator('#blankProject').click();
 await expect.poll(async()=>{const result=await(await page.request.get('/api/project')).json();return result.project?.name==='O meu projeto'&&result.project.sites.length===0;}).toBe(true);
 let result=await(await page.request.get('/api/project')).json();expect(result.project.name).toBe('O meu projeto');expect(result.project.sites).toHaveLength(0);expect(result.project.racks).toHaveLength(0);
 await page.locator('#undo').click();await expect.poll(async()=>(await(await page.request.get('/api/project')).json()).project.racks.length).toBeGreaterThan(0);
});
