import {test,expect} from '@playwright/test';
import {makeExample} from '../../public/examples.js';
test('3D appearance can be compared and persists without modifying the project',async({page})=>{
 const before=await(await page.request.get('/api/project')).json();
 await page.request.put('/api/project',{headers:{Origin:'http://127.0.0.1:31482'},data:{revision:before.revision,project:makeExample('connections')}});
 const saved=await(await page.request.get('/api/project')).json(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/editor.html');await page.locator('#physical').click();
 const appearance=page.getByRole('combobox',{name:'Estilo do campo 3D'});await expect(appearance).toHaveValue('enhanced');
 await appearance.selectOption('classic');await expect(appearance).toHaveValue('classic');
 await page.reload();await page.locator('#physical').click();await expect(appearance).toHaveValue('classic');
 await appearance.selectOption('enhanced');await expect(page.locator('#canvas canvas')).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('atlas-scene-appearance'))).toBe('enhanced');
 expect((await(await page.request.get('/api/project')).json()).revision).toBe(saved.revision);expect(errors).toEqual([]);
});
