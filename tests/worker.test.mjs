import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {DatabaseSync} from 'node:sqlite';import worker from '../dist/server/index.js';import {demo} from '../public/demo.js';
const db=new DatabaseSync(':memory:');for(const file of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync('drizzle/'+file,'utf8'));const DB = {async batch(statements){db.exec('BEGIN IMMEDIATE');try{const results=[];for(const stmt of statements)results.push({meta:{changes:Number(db.prepare(stmt.sql).run(...stmt.args).changes)}});db.exec('COMMIT');return results;}catch(e){db.exec('ROLLBACK');throw e;}},
 prepare(sql) {
  return {bind(...args) {
   return {sql,args,
    async all() {return {results:db.prepare(sql).all(...args)};},
    async first() { return db.prepare(sql).get(...args) || null; },
    async run() {const r=db.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}};}
   };
  }};
 }
};
function req(method,body,owner='test-user'){return new Request('https://atlas.example/api/project',{method,headers:{...(owner?{'oai-authenticated-user-id':owner}:{}),'Content-Type':'application/json','Origin':'https://atlas.example'},...(body?{body:JSON.stringify(body)}:{})});}
test('project API requires identity',async()=>assert.equal((await worker.fetch(req('GET',null,''),{DB})).status,401));
test('save/load, stale revision rejection and owner isolation',async()=>{const save=await worker.fetch(req('PUT',{project:demo,revision:0}),{DB});assert.equal(save.status,200);assert.equal((await save.json()).revision,1);const get=await worker.fetch(req('GET'),{DB});assert.equal((await get.json()).project.devices.length,23);const clash=await worker.fetch(req('PUT',{project:demo,revision:0}),{DB});assert.equal(clash.status,409);const other=await worker.fetch(req('GET',null,'other-user'),{DB});assert.equal((await other.json()).project,null);const update=await worker.fetch(req('PUT',{project:{...demo,name:'Updated'},revision:1}),{DB});assert.equal((await update.json()).revision,2);});
test('rejects corrupt project and cross-origin writes',async()=>{assert.equal((await worker.fetch(req('PUT',{project:{version:1},revision:0}),{DB})).status,400);const r=req('PUT',{project:demo,revision:0});r.headers.set('Origin','https://outside.example');assert.equal((await worker.fetch(r,{DB})).status,403);});
test('serves all required application modules',async()=>{for(const path of ['/','/app.js','/model.js','/demo.js','/plan.js','/scene.js','/features.js','/network.js','/vendor/three.module.js','/vendor/OrbitControls.js']){const r=await worker.fetch(new Request('https://atlas.example'+path),{DB});assert.equal(r.status,200,path);}});
function featureReq(path,method='GET',body,owner='feature-user'){return new Request('https://atlas.example'+path,{method,headers:{'oai-authenticated-user-id':owner,Origin:'https://atlas.example'},...(body?{body:typeof body==='string'||body instanceof Uint8Array?body:JSON.stringify(body)}:{})});}
test('named versions are immutable owner-scoped snapshots',async()=>{const saved=await worker.fetch(featureReq('/api/versions','POST',{label:'Before changes',project:demo}),{DB});assert.equal(saved.status,201);const {id}=await saved.json();const list=await worker.fetch(featureReq('/api/versions'),{DB});assert.equal((await list.json()).versions.length,1);const get=await worker.fetch(featureReq('/api/versions/'+id),{DB});assert.equal((await get.json()).project.devices.length,23);assert.equal((await worker.fetch(featureReq('/api/versions/'+id,'GET',null,'other'),{DB})).status,404);await worker.fetch(featureReq('/api/versions/'+id,'DELETE',null,'other'),{DB});assert.equal((await worker.fetch(featureReq('/api/versions/'+id),{DB})).status,200);await worker.fetch(featureReq('/api/versions/'+id,'DELETE'),{DB});assert.equal((await worker.fetch(featureReq('/api/versions/'+id),{DB})).status,404);});
test('floorplan uploads validate media and isolate asset reads by owner',async()=>{const data=new Map(),ATLAS_ASSETS={async put(key,body,meta){data.set(key,{body,httpMetadata:meta.httpMetadata});},async get(key){return data.get(key)||null;}};const env={DB,ATLAS_ASSETS};const image=new Uint8Array([137,80,78,71,13,10,26,10,0]);const uploaded=await worker.fetch(featureReq('/api/assets','POST',image),env);assert.equal(uploaded.status,201);const {id}=await uploaded.json();const read=await worker.fetch(featureReq('/api/assets/'+id),env);assert.equal(read.status,200);assert.equal(read.headers.get('content-type'),'image/png');assert.deepEqual(new Uint8Array(await read.arrayBuffer()),image);assert.equal((await worker.fetch(featureReq('/api/assets/'+id,'GET',null,'other'),env)).status,404);assert.equal((await worker.fetch(featureReq('/api/assets','POST','<svg/>'),env)).status,400);});
test('equipment attachments accept PDF, isolate owners and force document download',async()=>{const files=new Map(),ATLAS_ASSETS={async put(k,body,meta){files.set(k,{body,...meta});},async get(k){return files.get(k)||null;}};const env={DB,ATLAS_ASSETS},upload=featureReq('/api/equipment-files','POST','%PDF-1.7\nexample');upload.headers.set('X-File-Name',encodeURIComponent('garantia.pdf'));const response=await worker.fetch(upload,env);assert.equal(response.status,201);const meta=await response.json();assert.equal(meta.type,'application/pdf');const read=await worker.fetch(featureReq('/api/equipment-files/'+meta.id),env);assert.equal(read.status,200);assert.match(read.headers.get('content-disposition'),/^attachment/);assert.equal((await worker.fetch(featureReq('/api/equipment-files/'+meta.id,'GET',null,'another-owner'),env)).status,404);assert.equal((await worker.fetch(featureReq('/api/equipment-files','POST','<script>bad</script>'),env)).status,400);const noOrigin=featureReq('/api/equipment-files','POST','%PDF-1.7');noOrigin.headers.delete('Origin');assert.equal((await worker.fetch(noOrigin,env)).status,403);});

test('complete journey: build rooms, add equipment, connect, move, rotate, save through API and reopen',async()=>{
 const {createBuilding}=await import('../public/building-setup.js'),{createRoomDevices}=await import('../public/room-actions.js'),{normalizeProject,validate,uid}=await import('../public/model.js'),{validateCableChoice}=await import('../public/connection-guide.js'),{rotateEquipment}=await import('../public/equipment-rotation.js'),{moveToRoom}=await import('../public/plan-groups.js');
 const p=normalizeProject({version:3,name:'Percurso completo',sites:[],floors:[],rooms:[],racks:[],devices:[],links:[],nets:[],templates:[]});const building=createBuilding(p,{name:'Edifício de teste',floors:[{name:'Rés do chão',rooms:'Receção\nInformática'}]}),a=createRoomDevices(p,{roomId:building.rooms[0].id,name:'PC Receção',type:'Computador'})[0],b=createRoomDevices(p,{roomId:building.rooms[0].id,name:'Tomada Receção',type:'Tomada de rede'})[0];
 const link={id:uid('link'),a,b,portA:'Ethernet1',portB:'F1',kind:'copper',speed:'1 Gbps',vlans:[],label:'Cabo de teste',category:'Cat 6',color:'#3563c7',length:null,routeNote:'',waypoints:[]};validateCableChoice(p,link);p.links.push(link);const dest=building.rooms[1];moveToRoom(p,a,{x:building.site.x+dest.x,z:building.site.z+dest.z,rotation:0},dest.id);rotateEquipment(p,a,75);normalizeProject(p);validate(p);
 const saved=await worker.fetch(req('PUT',{project:p,revision:0},'journey-owner'),{DB});assert.equal(saved.status,200);const reopened=await worker.fetch(req('GET',null,'journey-owner'),{DB});assert.equal(reopened.status,200);const restored=(await reopened.json()).project;assert.deepEqual(restored,p);assert.equal(restored.devices.find(d=>d.id===a).rotation,75);assert.equal(restored.devices.find(d=>d.id===a).room,dest.id);assert.equal(restored.links.length,1);
});

test('organization hierarchy and separated address domains persist through project API',async()=>{
 const {planOrganization}=await import('../public/organization.js');const {createRoomDevices}=await import('../public/room-actions.js');
 const project=planOrganization({version:3,name:'Base',sites:[],floors:[],rooms:[],racks:[],devices:[],links:[],nets:[],templates:[]},{name:'Empresa internacional',rows:[{country:'PT',city:'Lisboa',unit:'LIS',name:'Sede',profile:'office',floors:1,timezone:'Europe/Lisbon',contact:'TI Portugal'},{country:'DE',city:'Berlim',unit:'BER',name:'Filial',profile:'office',floors:1,timezone:'Europe/Berlin',contact:'TI Alemanha'}]}).project;
 for(const room of [project.rooms[0],project.rooms[4]]){const id=createRoomDevices(project,{roomId:room.id,name:'PC '+room.id,type:'Computador'})[0];project.devices.find(d=>d.id===id).ip='192.168.1.10';}
 assert.equal((await worker.fetch(req('PUT',{project,revision:0},'corporate-user'),{DB})).status,200);
 const loaded=await (await worker.fetch(req('GET',null,'corporate-user'),{DB})).json();assert.equal(loaded.project.organization.name,'Empresa internacional');assert.equal(loaded.project.sites[1].branch.timezone,'Europe/Berlin');assert.equal(loaded.project.devices[0].ip,loaded.project.devices[1].ip);
 const invalid=structuredClone(project);invalid.sites.forEach(site=>site.branch.networkDomain='SAME');assert.equal((await worker.fetch(req('PUT',{project:invalid,revision:1},'corporate-user'),{DB})).status,400);
 assert.equal((await (await worker.fetch(req('GET',null,'corporate-user'),{DB})).json()).revision,1);
});

test('automatic history records committed previous states, ignores rejected/no-op writes and isolates owners',async()=>{
 const owner='history-test';
 assert.equal((await worker.fetch(req('PUT',{project:demo,revision:0},owner),{DB})).status,200);
 const changed={...demo,name:'Estado alterado'};
 assert.equal((await worker.fetch(req('PUT',{project:changed,revision:1},owner),{DB})).status,200);
 const list=await (await worker.fetch(featureReq('/api/history','GET',null,owner),{DB})).json();assert.equal(list.history.length,1);assert.equal(list.history[0].revision,1);
 const id=list.history[0].id,old=await (await worker.fetch(featureReq('/api/history/'+id,'GET',null,owner),{DB})).json();assert.deepEqual(old.project,demo);
 assert.equal((await worker.fetch(featureReq('/api/history/'+id,'GET',null,'different-user'),{DB})).status,404);
 assert.equal((await worker.fetch(featureReq('/api/history/'+id,'DELETE',null,owner),{DB})).status,405);
 assert.equal((await worker.fetch(req('PUT',{project:demo,revision:1},owner),{DB})).status,409);
 assert.equal((await worker.fetch(req('PUT',{project:changed,revision:2},owner),{DB})).status,200);
 assert.equal((await (await worker.fetch(featureReq('/api/history','GET',null,owner),{DB})).json()).history.length,1);
 assert.equal((await worker.fetch(new Request('https://atlas.example/api/history'),{DB})).status,401);
});
test('automatic history retains the latest 100 snapshots and recovery preserves the displaced state',async()=>{
 const owner='history-retention';let revision=0;
 for(let i=0;i<104;i++){const response=await worker.fetch(req('PUT',{project:{...demo,name:'Estado '+i},revision},owner),{DB});assert.equal(response.status,200);revision=(await response.json()).revision;}
 let list=(await (await worker.fetch(featureReq('/api/history','GET',null,owner),{DB})).json()).history;assert.equal(list.length,100);assert.equal(list[0].revision,103);assert.equal(list.at(-1).revision,4);
 const snapshot=await (await worker.fetch(featureReq('/api/history/'+list[10].id,'GET',null,owner),{DB})).json();assert.equal((await worker.fetch(req('PUT',{project:snapshot.project,revision},owner),{DB})).status,200);
 list=(await (await worker.fetch(featureReq('/api/history','GET',null,owner),{DB})).json()).history;assert.equal(list.length,100);assert.equal(list[0].revision,104);const previous=await(await worker.fetch(featureReq('/api/history/'+list[0].id,'GET',null,owner),{DB})).json();assert.equal(previous.project.name,'Estado 103');
});

test('server audit records entity diffs atomically, isolates owners and rejects mutations',async()=>{
 const owner='audit-user',project=structuredClone(demo);
 assert.equal((await worker.fetch(req('PUT',{project,revision:0},owner),{DB})).status,200);
 project.devices[0].name='Audit renamed';assert.equal((await worker.fetch(req('PUT',{project,revision:1},owner),{DB})).status,200);
 const response=await worker.fetch(featureReq('/api/audit?entity='+project.devices[0].id,'GET',null,owner),{DB}),data=await response.json();assert.equal(response.status,200);assert.equal(data.events[0].operation,'update');assert.equal(data.events[0].after.name,'Audit renamed');assert.notEqual(data.events[0].before.name,'Audit renamed');assert.equal(data.events[0].actor,owner);
 assert.equal((await worker.fetch(req('PUT',{project:{...project,name:'Rejected'},revision:1},owner),{DB})).status,409);
 assert.equal((await (await worker.fetch(featureReq('/api/audit?entity='+project.devices[0].id,'GET',null,owner),{DB})).json()).events.length,data.events.length);
 assert.deepEqual((await (await worker.fetch(featureReq('/api/audit','GET',null,'audit-other'),{DB})).json()).events,[]);
 assert.equal((await worker.fetch(featureReq('/api/audit','DELETE',null,owner),{DB})).status,405);
 assert.throws(()=>db.prepare('DELETE FROM atlas_audit_events WHERE owner=?').run(owner),/immutable/);
 assert.throws(()=>db.prepare('UPDATE atlas_audit_events SET actor=? WHERE owner=?').run('forged',owner),/immutable/);
});

test('organization roles protect all APIs and audit the authenticated author',async()=>{
 const owner='organization:roles',access=(actor,role,organization='roles')=>({DB,ATLAS_ACCESS:{owner:organization==='roles'?owner:'organization:'+organization,actor,role,organization}});
 assert.equal((await worker.fetch(req('PUT',{project:demo,revision:0},'alice'),access('alice','admin'))).status,200);
 const changed=structuredClone(demo);changed.devices[0].name='Editor change';assert.equal((await worker.fetch(req('PUT',{project:changed,revision:1},'bob'),access('bob','editor'))).status,200);
 const events=await(await worker.fetch(featureReq('/api/audit','GET',null,'carol'),access('carol','reader'))).json();assert.equal(events.events.find(e=>e.entity_type==='devices'&&e.operation==='update').actor,'bob');
 for(const [path,method] of [['/api/project','PUT'],['/api/project','PATCH'],['/api/versions','POST'],['/api/assets','POST'],['/api/equipment-files','POST'],['/api/secure-import','POST']])assert.equal((await worker.fetch(featureReq(path,method,{},'carol'),access('carol','reader'))).status,403,path);
 assert.equal((await worker.fetch(req('GET',null,'forged'),access('carol','reader'))).status,401);
 assert.equal((await(await worker.fetch(req('GET',null,'dave'),access('dave','reader','other-org'))).json()).project,null);
 assert.equal((await(await worker.fetch(req('GET',null,'carol'),access('carol','reader'))).json()).project.devices[0].name,'Editor change');
});
test('entity storage patches only changed rows, preserves order, rejects stale edits and rolls back failed batches',async()=>{
 const {projectDelta}=await import('../public/project-delta.js'),owner='entity-deltas',original=structuredClone(demo);
 assert.equal((await worker.fetch(req('PUT',{project:original,revision:0},owner),{DB})).status,200);
 const before=db.prepare('SELECT rowid,id,document FROM atlas_entities WHERE owner=? AND kind=? ORDER BY position').all(owner,'devices');const changed=structuredClone(original);changed.devices[0].name='Only one changed';changed.devices.reverse();
 const delta=projectDelta(original,changed);assert.ok(JSON.stringify(delta).length<JSON.stringify(changed).length);assert.equal((await worker.fetch(req('PATCH',{delta,revision:1},owner),{DB})).status,200);assert.deepEqual((await(await worker.fetch(req('GET',null,owner),{DB})).json()).project,changed);
 const after=db.prepare('SELECT rowid,id,document FROM atlas_entities WHERE owner=? AND kind=? ORDER BY position').all(owner,'devices');for(const row of before){const current=after.find(x=>x.id===row.id);assert.equal(current.rowid,row.rowid);if(row.id!==original.devices[0].id)assert.equal(current.document,row.document);}
 assert.equal((await worker.fetch(req('PATCH',{delta,revision:1},owner),{DB})).status,409);
 db.exec("CREATE TRIGGER test_fail_entity BEFORE UPDATE ON atlas_entities WHEN NEW.name='FAIL-BATCH' BEGIN SELECT RAISE(ABORT,'forced test failure');END;");const broken=structuredClone(changed);broken.devices[0].name='FAIL-BATCH';assert.equal((await worker.fetch(req('PATCH',{delta:projectDelta(changed,broken),revision:2},owner),{DB})).status,503);db.exec('DROP TRIGGER test_fail_entity');const restored=await(await worker.fetch(req('GET',null,owner),{DB})).json();assert.equal(restored.revision,2);assert.deepEqual(restored.project,changed);
 assert.equal(db.prepare('SELECT count(*) AS n FROM atlas_projects WHERE owner=?').get(owner).n,0);
});
test('large inventory is stored by entity, paginated and filtered by floor without fetching other floors',async()=>{
 const {normalizeProject}=await import('../public/model.js');const owner='large-inventory',p=normalizeProject(structuredClone(demo)),source=p.devices.find(d=>d.type==='Computador')||p.devices.find(d=>!d.rack&&d.type!=='VM');
 assert.ok(source);p.links=[];p.devices=Array.from({length:2000},(_,i)=>({...source,id:'load-'+i,name:'Equipment '+String(i).padStart(4,'0'),ip:'',gateway:'',rack:'',host:'',type:'Computador',portCount:1}));assert.equal((await worker.fetch(req('PUT',{project:p,revision:0},owner),{DB})).status,200);
 let after=0,count=0,ids=new Set();do{const response=await worker.fetch(featureReq('/api/inventory?limit=200&after='+after,'GET',null,owner),{DB});assert.equal(response.status,200);const data=await response.json();for(const d of data.devices){assert.ok(!ids.has(d.id));ids.add(d.id);}count+=data.devices.length;after=data.next;}while(after!==null);assert.equal(count,2000);
 const filtered=await(await worker.fetch(featureReq('/api/inventory?q=Equipment%200123','GET',null,owner),{DB})).json();assert.equal(filtered.devices.length,1);assert.equal(filtered.devices[0].id,'load-123');const floor=p.devices[0].floor,plant=await(await worker.fetch(featureReq('/api/plant?floor='+floor+'&limit=25','GET',null,owner),{DB})).json();assert.equal(plant.devices.length,25);assert.ok(plant.devices.every(d=>d.floor===floor));assert.equal(plant.revision,1);
 const manifest=await(await worker.fetch(featureReq('/api/project/manifest','GET',null,owner),{DB})).json();assert.ok(!manifest.project.devices);assert.equal(manifest.project.floors.length,p.floors.length);
 assert.equal((await worker.fetch(featureReq('/api/inventory?revision=0','GET',null,owner),{DB})).status,409);assert.equal((await worker.fetch(featureReq('/api/inventory?limit=201','GET',null,owner),{DB})).status,400);assert.equal((await(await worker.fetch(featureReq('/api/inventory','GET',null,'foreign-org'),{DB})).json()).devices.length,0);
});

test('two writers racing on a revision cannot mix entity updates or audit authors',async()=>{
 const owner='race-owner';await worker.fetch(req('PUT',{project:demo,revision:0},owner),{DB});const a=structuredClone(demo),b=structuredClone(demo);a.devices[0].name='Writer A';b.devices[1].name='Writer B';const result=await Promise.all([worker.fetch(req('PUT',{project:a,revision:1},owner),{DB}),worker.fetch(req('PUT',{project:b,revision:1},owner),{DB})]);assert.deepEqual(result.map(r=>r.status).sort(),[200,409]);const state=await(await worker.fetch(req('GET',null,owner),{DB})).json();assert.equal(state.revision,2);assert.deepEqual(state.project,result[0].status===200?a:b);
});

test('migration preserves existing documents, empty optional lists, history and audit without replay',async()=>{
 const legacy=new DatabaseSync(':memory:');try{for(const file of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')&&Number(f.slice(0,4))<6).sort())legacy.exec(fs.readFileSync('drizzle/'+file,'utf8'));const p={...structuredClone(demo),floors:[],rooms:[],templates:[],connectionProposals:[]};legacy.prepare('INSERT INTO atlas_projects(owner,document,revision,updated_at,actor) VALUES(?,?,7,?,?)').run('migration-owner',JSON.stringify(p),'2026-10-31T00:00:00Z','migration-actor');const count=legacy.prepare('SELECT count(*) AS n FROM atlas_audit_events').get().n;legacy.exec(fs.readFileSync('drizzle/0006_entity_storage.sql','utf8'));const adapter={prepare(sql){return {bind(...args){return {async first(){return legacy.prepare(sql).get(...args)||null;}};}};}};const result=await(await worker.fetch(req('GET',null,'migration-owner'),{DB:adapter})).json();assert.equal(result.revision,7);assert.deepEqual(result.project,p);assert.equal(legacy.prepare('SELECT count(*) AS n FROM atlas_audit_events').get().n,count);assert.equal(legacy.prepare('SELECT document FROM atlas_projects WHERE owner=?').get('migration-owner').document,JSON.stringify(p));}finally{legacy.close();}
});
