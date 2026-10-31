import test from 'node:test';
import assert from 'node:assert/strict';
import {planEquipmentImport,planEquipmentSync} from '../public/equipment-import.js';
import {planOrganization} from '../public/organization.js';
const setup=()=>{const p=planOrganization({version:3,name:'Projeto',sites:[],floors:[],rooms:[],racks:[],devices:[],links:[],nets:[],templates:[]},{name:'Grupo',rows:[{country:'PT',city:'Lisboa',unit:'LIS',name:'Sede',profile:'office',floors:1,timezone:'Europe/Lisbon',contact:'TI'}]}).project;return planEquipmentImport(p,[{nome:'PC-01',tipo:'PC',serie:'SN1',responsavel:'Original',ip:'10.0.0.1'},{nome:'PC-02',tipo:'PC',serie:'SN2'}],{defaultRoomId:p.rooms[0].id}).project;};
test('CSV synchronization updates by serial, preserves absent columns, clears explicit blanks and reports no-ops',()=>{
 const p=setup(),before=JSON.stringify(p),plan=planEquipmentSync(p,[{nome:'Renamed',tipo:'PC',serie:'SN1',modelo:'Novo',ip:''},{nome:'PC-02',tipo:'PC',serie:'SN2'}]);
 assert.deepEqual(plan.errors,[]);assert.equal(plan.updated.length,1);assert.equal(plan.ignored.length,1);assert.equal(plan.created.length,0);assert.equal(plan.project.devices[0].record.owner,'Original');assert.equal(plan.project.devices[0].ip,'');assert.equal(plan.project.devices[0].id,p.devices[0].id);assert.equal(JSON.stringify(p),before);
});
test('conflicting identifiers, repeated rows, invalid IPs and missing IDs reject the entire batch',()=>{
 const p=setup();for(const rows of [[{id:p.devices[0].id,nome:'PC',tipo:'PC',serie:'SN2'}],[{id:'missing',nome:'PC',tipo:'PC'}],[{nome:'PC',tipo:'PC',serie:'SN1',ip:'invalid'}],[{nome:'PC',tipo:'PC',serie:'SN1'},{nome:'PC',tipo:'PC',serie:'SN1'}]]){const before=JSON.stringify(p),plan=planEquipmentSync(p,rows);assert.equal(plan.project,null);assert.ok(plan.errors.length);assert.equal(JSON.stringify(p),before);}
});
test('location changes require a decision for each cable and preserve records',()=>{
 const p=setup(),a=p.devices[0],b=p.devices[1];p.links.push({id:'cable',a:a.id,b:b.id,portA:'ETH0',portB:'ETH0',kind:'copper',label:'LAN',vlans:[],waypoints:[]});
 const rows=[{id:a.id,nome:a.name,tipo:a.type,sala:p.rooms[1].name}];
 const review=planEquipmentSync(p,rows,{reviewOnly:true});assert.deepEqual(review.errors,[]);assert.equal(review.moves[0].links[0].id,'cable');
 assert.equal(planEquipmentSync(p,rows).project,null);
 const plan=planEquipmentSync(p,rows,{decisions:{cable:'disconnect'}});assert.deepEqual(plan.errors,[]);assert.equal(plan.project.links.length,0);assert.equal(plan.project.devices[0].room,p.rooms[1].id);assert.equal(plan.project.devices[0].record.owner,'Original');assert.equal(p.links.length,1);
 const keep=planEquipmentSync(p,rows,{decisions:{cable:'keep'}});assert.deepEqual(keep.errors,[]);assert.equal(keep.project.links.length,1);
});
