import {test,expect} from '@playwright/test';
import {makeExample} from '../../public/examples.js';
async function seed(page,p){const {revision}=await(await page.request.get('/api/project')).json();expect((await page.request.put('/api/project',{headers:{Origin:'http://127.0.0.1:31482'},data:{revision,project:p}})).ok()).toBe(true);}
test('RJ45 and fibre jackets meet their plug boots and carry real port interaction targets',async({page})=>{
 await page.goto('/editor.html');
 const result=await page.evaluate(async()=>{
  const T=await import('/vendor/three.module.js'),{createRackCable,socketAnchor,decorateSocket}=await import('/cable-visuals.js');
  const root=new T.Group(),port=new T.Mesh(new T.BoxGeometry(.054,.032,.045),new T.MeshStandardMaterial());port.position.set(.2,1,.56);port.userData={type:'ports',id:'sw',port:'Gi1/0/1',face:'front'};root.add(port);decorateSocket(port,{kind:'copper'});root.updateMatrixWorld(true);
  const start=socketAnchor(port,{id:'sw',type:'Switch'}),end={...start,point:[-.2,.5,.588],deviceId:'server',port:'P1'};
  return ['copper','fiber','power'].map(kind=>{
   const cable=createRackCable({link:{id:'c-'+kind,kind},start,end,color:0x6d9fff}),plugs=cable.group.children.filter(c=>c.isGroup),body=cable.group.children.find(c=>c.isMesh);
   const targets=[];cable.group.traverse(mesh=>{if(mesh.isMesh)targets.push(mesh.userData);});
   return {kind,socket:start.point,plugOrigin:plugs[0].position.toArray(),jacketStart:cable.curve.getPoint(0).toArray(),jacketEnd:cable.curve.getPoint(1).toArray(),bodyKind:body.geometry.type,portTargets:targets.filter(x=>x.type==='ports'),linkId:body.userData.id};
  });
 });
 for(const item of result){expect(item.plugOrigin).toEqual(item.socket);expect(item.jacketStart[0]).toBeCloseTo(item.socket[0]);expect(item.jacketStart[2]-item.socket[2]).toBeCloseTo(.11);expect(item.jacketEnd[2]-.588).toBeCloseTo(.11);expect(item.bodyKind).toBe('TubeGeometry');expect(item.linkId).toBe('c-'+item.kind);expect(item.portTargets.some(x=>x.id==='sw'&&x.port==='Gi1/0/1'&&x.cableEnd===item.kind)).toBe(true);}
});
test('rotated rear sockets keep connector orientation and external continuations have only one plug',async({page})=>{
 await page.goto('/editor.html');const result=await page.evaluate(async()=>{
  const T=await import('/vendor/three.module.js'),{socketAnchor,createRackCable}=await import('/cable-visuals.js');const group=new T.Group();group.rotation.y=Math.PI/2;const mesh=new T.Mesh(new T.BoxGeometry(.05,.03,.045),new T.MeshStandardMaterial());mesh.userData={type:'ports',id:'panel',port:'R1',face:'rear'};group.add(mesh);group.updateMatrixWorld(true);const start=socketAnchor(mesh,{id:'panel',type:'Patch panel'}),end={point:[1.3,1,.9],direction:[-1,0,0],exact:false};const cable=createRackCable({link:{id:'outside',kind:'copper'},start,end,color:0x6d9fff});return {direction:start.direction,groups:cable.group.children.filter(c=>c.isGroup).length,point:start.point};
 });expect(result.direction[0]).toBeCloseTo(-1);expect(result.direction[2]).toBeCloseTo(0);expect(result.groups).toBe(1);expect(result.point[0]).toBeLessThan(0);
});
test('the real rack renders copper, fibre, rear terminations and external cables without changing project data',async({page})=>{
 const p=makeExample('connections');p.links.find(l=>l.id==='CORE-01').kind='fiber';p.links.find(l=>l.id==='CORE-01').category='OS2';await seed(page,p);const before=await(await page.request.get('/api/project')).json(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/editor.html');await expect(page.locator('#saveBadge')).toContainText('Guardado');await page.locator('#mapViewPicker > summary').click();await page.locator('#rackMode').click();await expect(page.locator('#canvas canvas')).toBeVisible();await page.locator('#rackRear').click();await expect(page.locator('#rackRear')).toHaveAttribute('aria-pressed','true');await page.locator('#rackFront').click();await page.locator('#zoomIn').click();await page.waitForTimeout(350);expect(errors).toEqual([]);expect((await(await page.request.get('/api/project')).json()).revision).toBe(before.revision);await seed(page,makeExample('connections'));
});

test('room cables stay above the modelled floor and follow moved, rotated socket anchors',async({page})=>{
 await page.goto('/editor.html');const result=await page.evaluate(async()=>{
  const T=await import('/vendor/three.module.js'),{socketAnchor,createRackCable}=await import('/cable-visuals.js'),group=new T.Group(),socket=new T.Mesh(new T.BoxGeometry(.05,.03,.02),new T.MeshStandardMaterial());socket.position.set(.2,.8,.3);socket.userData={type:'ports',id:'pc',port:'Ethernet1',face:'rear'};group.add(socket);group.position.set(2,0,3);group.rotation.y=Math.PI/2;group.updateMatrixWorld(true);const start={...socketAnchor(socket,{id:'pc',type:'Computador'}),floorY:0},end={...start,point:[4,1,5],direction:[0,0,-1],deviceId:'outlet',port:'F1'},cable=createRackCable({link:{id:'room',kind:'copper'},start,end,color:0x6d9fff,rack:false});const minimum=Math.min(...cable.curve.getPoints(100).map(p=>p.y));group.position.x+=1;group.updateMatrixWorld(true);const moved=socketAnchor(socket,{id:'pc',type:'Computador'});return {minimum,delta:moved.point[0]-start.point[0],direction:moved.direction,curveType:cable.curve.type};
 });expect(result.minimum).toBeGreaterThanOrEqual(.199);expect(result.delta).toBeCloseTo(1);expect(result.direction[0]).toBeCloseTo(-1);expect(result.curveType).toBe('CurvePath');
});
