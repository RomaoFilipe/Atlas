import {test,expect} from '@playwright/test';
import {makeExample} from '../../public/examples.js';
async function seed(page,p=makeExample('connections')){const {revision}=await(await page.request.get('/api/project')).json();expect((await page.request.put('/api/project',{headers:{Origin:'http://127.0.0.1:31482'},data:{revision,project:p}})).ok()).toBe(true);}
async function search(page,name){await page.locator('#search').fill(name);await page.locator('#search').press('Enter');}
async function open(page){await page.goto('/editor.html');await expect(page.locator('#saveBadge')).toContainText('Guardado');await search(page,'POSTO-01');}
const links=async page=>(await(await page.request.get('/api/project')).json()).project.links;
test.beforeEach(async({page})=>{const p=makeExample('connections');p.links=p.links.filter(l=>l.id!=='POSTO-1');await seed(page,p);});
test.afterEach(async({page})=>seed(page));
test('selecting RJ45 then clicking the exact PC and wall outlet ports saves and undoes a patch cable',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await open(page);await page.locator('#mapViewPicker > summary').click();await page.locator('#planMode').click();await page.locator('[data-cable-type=cat6a]').click();
 const pc=page.locator('#planCanvas [data-network-device=pc1][data-network-port=Ethernet1]');await expect(pc).toBeVisible();await pc.click();await expect(page.locator('[data-cable-message]')).toContainText('Origem: POSTO-01 / Ethernet1');await expect(page.locator('#manual-cable-preview')).toHaveCount(1);
 await page.locator('#planCanvas [data-network-device=socket1][data-network-port=F1]').click();await expect(page.locator('[data-cable-message]')).toContainText('ligado');await expect.poll(async()=>(await links(page)).find(l=>l.a==='pc1'&&l.b==='socket1')?.category).toBe('Cat 6A');
 await page.keyboard.press('Escape');await page.locator('#undo').click();await expect.poll(async()=>(await links(page)).some(l=>l.a==='pc1'&&l.b==='socket1')).toBe(false);expect(errors).toEqual([]);
});
test('incompatible fibre and occupied ports show warnings and never overwrite a cable',async({page})=>{
 await open(page);const before=(await links(page)).length;await page.locator('[data-cable-type=os2]').click();await page.locator('[data-cable-port=Ethernet1]').dispatchEvent('click');await expect(page.locator('[data-cable-message]')).toContainText('incompatível');expect((await links(page)).length).toBe(before);
 await page.locator('[data-cable-type=cat6]').click();await page.locator('[data-cable-port=Ethernet1]').click();await search(page,'TOMADA-DUPLA-A');await page.locator('[data-cable-port=F2]').dispatchEvent('click');await expect(page.locator('[data-cable-message]')).toContainText('ocupada');expect((await links(page)).length).toBe(before);await page.locator('[data-cable-port=F1]').click();await expect.poll(async()=>(await links(page)).length).toBe(before+1);
});
test('power can be plugged from the PC input to a free PDU outlet across views and remains after reload',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await open(page);await page.locator('[data-cable-type=power]').click();await page.locator('[data-cable-port=PSU1]').click();await search(page,'PDU-A');await page.locator('[data-cable-port=OUT4]').click();await expect.poll(async()=>(await links(page)).some(l=>l.kind==='power'&&l.a==='pc1'&&l.b==='pdu'&&l.portB==='OUT4')).toBe(true);await page.reload();await expect(page.locator('#saveBadge')).toContainText('Guardado');expect((await links(page)).some(l=>l.kind==='power'&&l.a==='pc1'&&l.portB==='OUT4')).toBe(true);expect(errors).toEqual([]);
});
test('the cable palette fits a phone and Escape cancels an unfinished connection without saving',async({page})=>{
 await page.setViewportSize({width:390,height:844});await open(page);const before=(await links(page)).length;await page.locator('[data-cable-type=cat5e]').click();await page.locator('[data-cable-port=Ethernet1]').click();await page.keyboard.press('Escape');await expect(page.locator('[data-cable-work]')).toBeHidden();expect((await links(page)).length).toBe(before);const box=await page.locator('#cablePalette').boundingBox();expect(box.width).toBeLessThanOrEqual(390);
});
