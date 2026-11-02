import {test,expect} from '@playwright/test';
import {makeExample} from '../../public/examples.js';
import {interfaceProfile} from '../../public/physical-network.js';
const origin='http://127.0.0.1:31482';
async function seed(page,p=makeExample('connections')){const {revision}=await(await page.request.get('/api/project')).json();expect((await page.request.put('/api/project',{headers:{Origin:origin},data:{revision,project:p}})).ok()).toBe(true);}
async function openInterfaces(page,name='SW-PRINCIPAL'){
 await page.goto('/editor.html');await expect(page.locator('#saveBadge')).toContainText('Guardado');await page.locator('#search').fill(name);await page.locator('#search').press('Enter');await page.getByRole('tab',{name:'Ligações',exact:true}).click();await page.locator('#configureInterfaces').click();await expect(page.locator('#featureTitle')).toContainText('Interfaces');
}
test.beforeEach(async({page})=>seed(page));
test.afterEach(async({page})=>seed(page));
test('multiple interface drafts persist VLAN, negotiated capabilities and administrative state',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await openInterfaces(page);
 const form=page.locator('#featureForm');await form.locator('[name=interfacePort]').selectOption('Gi1/0/1');await form.locator('[name=medium]').selectOption('copper');await form.locator('[name=maxSpeed]').selectOption('1000');await form.locator('[name=supportedSpeeds]').fill('100, 1000');await form.locator('[name=mode]').selectOption('access');await form.locator('[name=accessVlan]').selectOption('30');
 await form.locator('[name=interfacePort]').selectOption('Gi1/0/2');await form.locator('[name=adminUp]').selectOption('false');await form.locator('[name=mode]').selectOption('trunk');await form.locator('[name=nativeVlan]').selectOption('10');await form.locator('[name=allowedVlans]').fill('10, 20');
 await form.locator('[name=interfacePort]').selectOption('Gi1/0/1');await expect(form.locator('[name=supportedSpeeds]')).toHaveValue('100, 1000');await expect(form.locator('[name=accessVlan]')).toHaveValue('30');await form.locator('[type=submit]').click();await expect(page.locator('#featureDialog')).not.toBeVisible();
 await expect.poll(async()=>{const {project}=await(await page.request.get('/api/project')).json();return project.devices.find(d=>d.id==='sw0').portProfiles?.length;}).toBe(2);
 await openInterfaces(page);await form.locator('[name=interfacePort]').selectOption('Gi1/0/2');await expect(form.locator('[name=adminUp]')).toHaveValue('false');await expect(form.locator('[name=allowedVlans]')).toHaveValue('10, 20');expect(errors).toEqual([]);
});
test('cable review diagnoses a disabled port through socket and patch panel and updates total length live',async({page})=>{
 const p=makeExample('connections');for(const [id,port] of [['sw0','Gi1/0/1'],['pc1','Ethernet1']]){const d=p.devices.find(d=>d.id===id),{documented,...c}=interfaceProfile(d,port);d.portProfiles=[{...c,medium:'copper',maxSpeed:1000,supportedSpeeds:[100,1000],adminUp:id!=='sw0',...(id==='sw0'?{mode:'access',accessVlan:30}:{})}];}
 for(const [id,length] of [['PATCH-1',5],['HORIZONTAL-1',90],['POSTO-1',5]])p.links.find(l=>l.id===id).length=length;await seed(page,p);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/editor.html');await page.locator('#search').fill('POSTO-01');await page.locator('#search').press('Enter');await page.getByRole('tab',{name:'Ligações',exact:true}).click();await page.locator('[data-edit-link="POSTO-1"]').click();await page.locator('#connectionNext').click();await page.locator('#connectionNext').click();
 const diagnostic=page.locator('#connectionDiagnostic');await expect(diagnostic).toContainText('administrativamente desativada');await expect(diagnostic).toContainText('100.0 m');await page.locator('.cable-advanced > summary').click();await page.locator('#featureForm [name=length]').fill('11');await expect(diagnostic).toContainText('106.0 m');await expect(diagnostic).toContainText('excede os 100 m');await page.locator('#featureForm [name=installation]').selectOption('patch');await page.locator('#featureForm [type=submit]').click();await expect(page.locator('#featureDialog')).not.toBeVisible();
 await expect.poll(async()=>{const {project}=await(await page.request.get('/api/project')).json();return project.links.find(l=>l.id==='POSTO-1').installation;}).toBe('patch');expect(errors).toEqual([]);
});
test('server rejects malformed interface data without modifying the saved revision',async({page})=>{
 const {project,revision}=await(await page.request.get('/api/project')).json(),d=project.devices.find(d=>d.id==='sw0'),{documented,...c}=interfaceProfile(d,'Gi1/0/1');d.portProfiles=[{...c,mode:'trunk',allowedVlans:[999]}];const response=await page.request.put('/api/project',{headers:{Origin:origin},data:{revision,project}});expect(response.status()).toBe(400);expect((await response.json()).error).toContain('VLANs permitidas');expect((await(await page.request.get('/api/project')).json()).revision).toBe(revision);
});
test('interface configuration fits narrow screens and reports invalid fixed speeds before saving',async({page})=>{
 await page.setViewportSize({width:390,height:844});await openInterfaces(page);const form=page.locator('#featureForm');await form.locator('[name=maxSpeed]').selectOption('100');await form.locator('[name=speed]').selectOption('1000');await form.locator('[type=submit]').click();await expect(page.locator('#featureError')).toContainText('excede a capacidade');await expect(page.locator('#featureDialog')).toBeVisible();const box=await page.locator('#featureDialog').boundingBox();expect(box.width).toBeLessThanOrEqual(390);
});
