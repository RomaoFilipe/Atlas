import {test,expect} from '@playwright/test';
import {makeExample} from '../../public/examples.js';

test('equipment housings keep their dimensions and leave interactive sockets untouched',async({page})=>{
 await page.goto('/editor.html');
 const result=await page.evaluate(async()=>{
  const T=await import('/vendor/three.module.js'),{softenEquipment}=await import('/equipment-geometry.js');
  const group=new T.Group(),shell=new T.Mesh(new T.BoxGeometry(.72,.44,.055),new T.MeshStandardMaterial()),port=new T.Mesh(new T.BoxGeometry(.052,.034,.018),new T.MeshStandardMaterial());port.userData={type:'ports',id:'pc',port:'Ethernet1'};port.position.set(.65,.38,-.283);group.add(shell,port);
  const geometry=port.geometry,position=port.position.toArray();softenEquipment(group);shell.geometry.computeBoundingBox();return {size:shell.geometry.boundingBox.getSize(new T.Vector3()).toArray(),shape:shell.geometry.type,portUnchanged:geometry===port.geometry,position,after:port.position.toArray(),metadata:port.userData};
 });
 expect(result.shape).toBe('ExtrudeGeometry');for(const [i,value] of [.72,.44,.055].entries())expect(result.size[i]).toBeCloseTo(value,5);expect(result.portUnchanged).toBe(true);expect(result.after).toEqual(result.position);expect(result.metadata.port).toBe('Ethernet1');
});

test('the inspector reuses a rotatable 3D preview across equipment without saving changes',async({page})=>{
 const initial=await(await page.request.get('/api/project')).json();expect((await page.request.put('/api/project',{headers:{Origin:'http://127.0.0.1:31482'},data:{revision:initial.revision,project:makeExample('connections')}})).ok()).toBe(true);
 const saved=await(await page.request.get('/api/project')).json(),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto('/editor.html');
 for(const id of ['pc1','sw0','printer','ap']){
  await page.locator('#search').fill(saved.project.devices.find(d=>d.id===id).name);
  await page.locator(`#deviceRows tr[data-id="${id}"]`).dispatchEvent('click');
  await expect(page.locator('.equipment-preview canvas')).toHaveCount(1);await expect(page.locator('.equipment-preview-canvas')).toHaveAttribute('aria-label',new RegExp(saved.project.devices.find(d=>d.id===id).name));
 }
 const preview=page.locator('.equipment-preview canvas'),box=await preview.boundingBox();await page.mouse.move(box.x+box.width*.45,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.7,box.y+box.height*.6,{steps:8});await page.mouse.up();await page.getByRole('button',{name:'Enquadrar equipamento',exact:true}).click();
 expect((await(await page.request.get('/api/project')).json()).revision).toBe(saved.revision);expect(errors).toEqual([]);
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
});
