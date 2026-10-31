import {test,expect} from '@playwright/test';
test('global search opens equipment and its mobile maintenance and ports sheet',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:390,height:844});await page.goto('/');await expect(page.locator('#saveBadge')).toContainText(/Guardado|Exemplo/);
 const device={name:'POSTO-01'};
 await page.locator('#search').fill(device.name);await page.locator('#search').press('Enter');
 await page.locator('#equipmentRecordButton').click();await expect(page.locator('#equipmentRecord')).toContainText('Próxima revisão');await expect(page.locator('#equipmentRecord')).toContainText('Portas e ligações');
 await page.locator('#recordEdit').click();await page.locator('[name=nextMaintenance]').fill('2026-11-15');await page.locator('[name=replacementDate]').fill('2027-01-15');await page.locator('#featureForm [type=submit]').click();
 await expect(page.locator('#equipmentRecord')).toContainText('2026-11-15');
 const box=await page.locator('#equipmentRecord').boundingBox();expect(box.width).toBeLessThanOrEqual(390);expect(errors).toEqual([]);
});
