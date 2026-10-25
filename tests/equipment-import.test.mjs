import test from 'node:test';
import assert from 'node:assert/strict';
import {parseEquipmentTable,planEquipmentImport} from '../public/equipment-import.js';
import {planOrganization} from '../public/organization.js';
import {clone,validate} from '../public/model.js';
import {equipmentOverlaps,floorFootprint} from '../public/move-alignment.js';
const blank=()=>({version:3,name:'Projeto',sites:[],floors:[],rooms:[],racks:[],devices:[],links:[],nets:[],templates:[]});
const setup=()=>planOrganization(blank(),{name:'Grupo',rows:[{country:'PT',city:'Lisboa',unit:'LIS',name:'Sede',profile:'office',floors:1,timezone:'Europe/Lisbon',contact:'TI'}]}).project;

test('equipment CSV accepts aliases, quoted values, TSV and reports ignored columns',()=>{
 const parsed=parseEquipmentTable('Name;Type;Serial Number;Owner;Extra\n"PC; Lisboa";PC;SN-1;"Equipa ""TI""";ignorar');
 assert.equal(parsed.rows[0].nome,'PC; Lisboa');assert.equal(parsed.rows[0].serie,'SN-1');assert.equal(parsed.rows[0].responsavel,'Equipa "TI"');assert.deepEqual(parsed.ignored,['Extra']);assert.equal(parsed.rows[0]._line,2);
 assert.equal(parseEquipmentTable('Nome\tTipo\tNúmero de série\nPC\tComputador\tSN-2').rows[0].serie,'SN-2');
 assert.throws(()=>parseEquipmentTable('Nome;IP\nPC;1.1.1.1'),/Nome e Tipo/);assert.throws(()=>parseEquipmentTable('Nome;Name;Tipo\nPC;PC;PC'),/repetidas/);
 assert.throws(()=>parseEquipmentTable('Nome;Tipo\nPC'),/Linha 2/);
});
test('import preview is pure, keeps identity data, avoids overlap and never invents cables',()=>{
 const p=setup(),room=p.rooms[0],before=JSON.stringify(p),rows=parseEquipmentTable('Nome;Tipo;IP;Serie;Responsavel;Estado\nPC-01;Computador;192.168.1.10;SN-1;TI;em servico\nIMP-01;Impressora;192.168.1.11;SN-2;TI;Em reserva').rows;
 const plan=planEquipmentImport(p,rows,{defaultRoomId:room.id});assert.deepEqual(plan.errors,[]);assert.equal(JSON.stringify(p),before);assert.equal(plan.created.length,2);assert.equal(plan.project.links.length,0);assert.equal(plan.created[0].record.state,'Em serviço');assert.equal(plan.created[0].record.serial,'SN-1');
 for(const d of plan.created){assert.equal(d.room,room.id);assert.equal(equipmentOverlaps(plan.project,d.id).length,0);const bounds=floorFootprint(d),site=p.sites[0];assert.ok(bounds.minX>=site.x-site.w/2&&bounds.maxX<=site.x+site.w/2);}validate(plan.project);
});
test('invalid rows and occupied IPs or serial numbers reject the entire batch without mutation',()=>{
 let p=setup(),room=p.rooms[0];p=planEquipmentImport(p,[{nome:'Original',tipo:'PC',ip:'10.0.0.1',serie:'SN-1'}],{defaultRoomId:room.id}).project;const before=JSON.stringify(p);
 const plan=planEquipmentImport(p,[{_line:2,nome:'Duplicate-IP',tipo:'PC',ip:'10.0.0.1'},{_line:3,nome:'Duplicate-serial',tipo:'PC',serie:'SN-1'},{_line:4,nome:'Unknown VLAN',tipo:'PC',vlan:'999'},{_line:5,nome:'Virtual',tipo:'VM'}],{defaultRoomId:room.id});
 assert.equal(plan.project,null);assert.equal(plan.created.length,0);assert.equal(plan.errors.length,4);assert.deepEqual(plan.errors.map(e=>e.line),[2,3,4,5]);assert.equal(JSON.stringify(p),before);
});
test('location matching separates multinational sites and allows identical IPs in different domains',()=>{
 const first=setup(),p=planOrganization(first,{name:'Grupo',rows:[{country:'DE',city:'Berlim',unit:'BER',name:'Sede',profile:'office',floors:1,timezone:'Europe/Berlin',contact:'TI'}]}).project;
 const rows=[{nome:'PC-01',tipo:'PC',ip:'192.168.1.10',pais:'PT',unidade:'LIS',edificio:'Sede',piso:'Piso 0',sala:'Receção'},{nome:'PC-01',tipo:'PC',ip:'192.168.1.10',pais:'DE',unidade:'BER',edificio:'Sede',piso:'Piso 0',sala:'Receção'}];
 const plan=planEquipmentImport(p,rows);assert.deepEqual(plan.errors,[]);assert.notEqual(plan.created[0].site,plan.created[1].site);
 const ambiguous=planEquipmentImport(p,[{nome:'PC-ambiguous',tipo:'PC',edificio:'Sede',piso:'Piso 0',sala:'Receção'}]);assert.match(ambiguous.errors[0].message,/ambígua/);
});
test('rack import finds free U, respects requested height, and rejects overlap and full racks',()=>{
 const p=setup(),site=p.sites[0],room=p.rooms[3];p.racks.push({id:'rack',name:'R1',site:site.id,floor:room.floor,room:room.id,x:room.x,z:room.z,units:4,locked:true});
 const rows=[{nome:'SW-01',tipo:'Switch',bastidor:'R1',alturau:'2',portas:'48'},{nome:'SRV-01',tipo:'Servidor',bastidor:'R1',alturau:'2'}],plan=planEquipmentImport(p,rows,{defaultRoomId:room.id});assert.deepEqual(plan.errors,[]);assert.equal(plan.created[0].u,1);assert.equal(plan.created[1].u,3);assert.equal(plan.created[0].portCount,48);
 assert.equal(planEquipmentImport(plan.project,[{nome:'SW-02',tipo:'Switch',bastidor:'R1'}],{defaultRoomId:room.id}).project,null);
 assert.equal(planEquipmentImport(plan.project,[{nome:'SW-03',tipo:'Switch',bastidor:'R1',u:'1'}],{defaultRoomId:room.id}).project,null);
});
test('protected and full rooms and project limits are reported without changing existing equipment',()=>{
 const p=setup(),room=p.rooms[0];room.layoutLocked=true;assert.match(planEquipmentImport(p,[{nome:'PC',tipo:'PC'}],{defaultRoomId:room.id}).errors[0].message,/protegida/);
 delete room.layoutLocked;room.w=.1;room.d=.1;assert.match(planEquipmentImport(p,[{nome:'PC',tipo:'PC'}],{defaultRoomId:room.id}).errors[0].message,/espaço/);
 assert.throws(()=>planEquipmentImport(p,Array.from({length:201},()=>({nome:'PC',tipo:'PC'}))),/200/);
 const capacity=clone(p);capacity.devices=Array.from({length:500},()=>({}));assert.throws(()=>planEquipmentImport(capacity,[{nome:'PC',tipo:'PC'}]),/500/);
});
