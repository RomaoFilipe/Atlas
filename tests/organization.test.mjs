import test from 'node:test';
import assert from 'node:assert/strict';
import {parseBranchTable,planOrganization,organizationGroups} from '../public/organization.js';
import {clone,normalizeProject,validate} from '../public/model.js';
import {createRoomDevices} from '../public/room-actions.js';
import {spaceTree} from '../public/workspace-shell.js';
import {searchDevice} from '../public/ux-feedback.js';
const blank=()=>({version:3,name:'Projeto',sites:[],floors:[],rooms:[],racks:[],devices:[],links:[],nets:[],templates:[]});
const header='pais;cidade;unidade;edificio;perfil;pisos;fuso;responsavel';
const row=(unit='LIS',country='PT')=>({country,city:'Lisboa',unit,name:'Sede',profile:'office',floors:1,timezone:'Europe/Lisbon',contact:'Equipa TI'});
test('CSV accepts quoted values, BOM, accents, CRLF and Excel tab-separated tables',()=>{
 const rows=parseBranchTable('\uFEFFpaís;cidade;unidade;edifício;perfil;pisos;fuso;responsável\r\nPT;Lisboa;lis;"Sede; principal";office;2;Europe/Lisbon;"Equipa ""TI"""\r\n');
 assert.equal(rows[0].unit,'LIS');assert.equal(rows[0].name,'Sede; principal');assert.equal(rows[0].contact,'Equipa "TI"');
 assert.equal(parseBranchTable((header+'\nPT;Lisboa;LIS;Sede;office;1;Europe/Lisbon;TI').replaceAll(';','\t')).length,1);
 assert.throws(()=>parseBranchTable(header+'\nPT;Lisboa'),/8 colunas/);assert.throws(()=>parseBranchTable(header+'\n"unfinished'),/aspas/);
});
test('organization planner creates grouped units without changing the original or inventing equipment',()=>{
 const p=blank(),before=JSON.stringify(p),plan=planOrganization(p,{name:'Grupo Atlântico',rows:[row(),{...row('BER','DE'),city:'Berlim',timezone:'Europe/Berlin'}, {...row(),name:'Anexo'}]});
 assert.equal(JSON.stringify(p),before);assert.equal(plan.project.organization.name,'Grupo Atlântico');assert.equal(plan.project.sites.length,3);assert.equal(plan.project.devices.length,0);assert.equal(plan.project.links.length,0);
 const groups=organizationGroups(plan.project);assert.equal(groups.length,2);assert.equal(groups.find(g=>g.country==='PT').units[0].sites.length,2);
 assert.notEqual(plan.project.sites[0].x,plan.project.sites[2].x);assert.equal(plan.project.sites[0].x,plan.project.sites[1].x);
 validate(normalizeProject(JSON.parse(JSON.stringify(plan.project))));
});
test('late errors, duplicate buildings, bad timezones and limits never mutate the project',()=>{
 const p=blank(),before=JSON.stringify(p);
 for(const bad of [{...row(),timezone:'invalid/zone'},{...row(),country:'Portugal'},{...row(),floors:0},{...row(),profile:'unknown'}])assert.throws(()=>planOrganization(p,{name:'Empresa',rows:[row('FIRST'),bad]}));
 assert.throws(()=>planOrganization(p,{name:'Empresa',rows:[row(),row()]}),/já existe/);
 assert.throws(()=>planOrganization(p,{name:'Empresa',rows:Array.from({length:101},(_,i)=>row('U'+i))}),/100/);
 assert.equal(JSON.stringify(p),before);
});
test('100 geographically independent units do not run out of campus coordinates',()=>{
 const plan=planOrganization(blank(),{name:'Grupo internacional',rows:Array.from({length:100},(_,i)=>row('U'+i))});assert.equal(plan.project.sites.length,100);assert.equal(plan.project.rooms.length,400);validate(plan.project);
});
test('duplicate private IPs are allowed across distinct domains and rejected within the same domain',()=>{
 const p=planOrganization(blank(),{name:'Empresa',rows:[row('LIS'),{...row('BER','DE'),city:'Berlim',timezone:'Europe/Berlin'}]}).project;
 for(const room of [p.rooms[0],p.rooms[4]]){const id=createRoomDevices(p,{roomId:room.id,name:'PC '+room.id,type:'Computador'})[0];p.devices.find(d=>d.id===id).ip='192.168.1.10';}
 validate(p);
 const shared=clone(p);shared.sites.forEach(s=>s.branch.networkDomain='CORPORATE');assert.throws(()=>validate(shared),/IP repetido/);
 const legacy=clone(p);legacy.sites.forEach(s=>delete s.branch);assert.throws(()=>validate(legacy),/IP repetido/);
 const malformed=clone(p);malformed.sites[0].branch.timezone='Bad/Timezone';assert.throws(()=>validate(malformed),/Fuso horário/);
});
test('country/unit navigation and global equipment search expose location metadata safely',()=>{
 const p=planOrganization(blank(),{name:'Empresa',rows:[row()]}).project;const id=createRoomDevices(p,{roomId:p.rooms[0].id,name:'PC teste',type:'Computador'})[0],device=p.devices.find(d=>d.id===id);
 assert.equal(searchDevice(p,device,'Lisboa LIS Equipa'),true);assert.equal(searchDevice(p,device,'Berlim'),false);
 const html=spaceTree(p,{floorId:p.floors[0].id});assert.match(html,/data-tree-key="country-PT" open/);assert.match(html,/data-tree-key="unit-PT-LIS" open/);
 p.sites[0].name='<script>alert(1)</script>';assert.ok(!spaceTree(p).includes('<script>'));
});

test('existing buildings can join a unit and later edits update all its buildings atomically',async()=>{
 const {planBranchAssignment}=await import('../public/organization.js');
 let p=planOrganization(blank(),{name:'Empresa',rows:[row()]}).project;
 const {createBuilding}=await import('../public/building-setup.js');const original=createBuilding(p,{name:'Edifício antigo',floors:[{name:'Piso 0',rooms:'Sala'}]});
 const metadata=p.sites[0].branch,before=JSON.stringify(p),assigned=planBranchAssignment(p,original.site.id,metadata);
 assert.equal(JSON.stringify(p),before);assert.equal(assigned.sites[1].branch.unit,'LIS');
 const changed=planBranchAssignment(assigned,assigned.sites[0].id,{...metadata,contact:'Equipa Central'});assert.ok(changed.sites.every(site=>site.branch.contact==='Equipa Central'));
 const invalid={...metadata,unit:'invalid spaces'};assert.throws(()=>planBranchAssignment(assigned,original.site.id,invalid));assert.equal(assigned.sites[0].branch.contact,'Equipa TI');
});
