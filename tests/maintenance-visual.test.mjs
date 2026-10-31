import test from 'node:test';
import assert from 'node:assert/strict';
import {validateEquipmentRecords} from '../public/model.js';
import {visualChanges,versionVisualHTML} from '../public/version-visual.js';
import {operationReport} from '../public/operations.js';
test('maintenance dates survive validation and impossible dates are rejected',()=>{
 const p={devices:[{record:{nextMaintenance:'2026-11-01',replacementDate:'2027-01-20'}}]};
 validateEquipmentRecords(p);p.devices[0].record.nextMaintenance='2026-02-30';assert.throws(()=>validateEquipmentRecords(p),/Ficha/);
 p.devices[0].record.nextMaintenance=12;assert.throws(()=>validateEquipmentRecords(p),/Ficha/);
});
test('visual comparison retains deleted endpoints and distinguishes changes with escaped names',()=>{
 const a={devices:[{id:'a',name:'<script>'},{id:'b',name:'B'}],links:[{id:'l',a:'a',b:'b',label:'Cable'}]};
 const b={devices:[{id:'a',name:'Renamed'},{id:'c',name:'C'}],links:[]};
 const diff=visualChanges(a,b);assert.deepEqual(diff.devices.map(x=>x.status),['changed','removed','added']);assert.equal(diff.links[0].before.a,'a');
 const html=versionVisualHTML(a,b);assert.match(html,/stroke-dasharray/);assert.match(html,/Removido/);assert.doesNotMatch(html,/<script>/);assert.equal(visualChanges(a,a).devices.length,0);
});
test('maintenance report includes overdue and upcoming work, excludes retired and distant work',()=>{
 const p={sites:[{id:'s',name:'S'}],devices:[{id:'a',site:'s',name:'A',record:{owner:'T',nextMaintenance:'2026-10-01',replacementDate:'2026-12-01'}},{id:'b',site:'s',name:'B',record:{state:'Abatido',nextMaintenance:'2026-10-01'}},{id:'c',site:'s',name:'C',record:{owner:'T',nextMaintenance:'2027-10-01'}}],racks:[],links:[],nets:[],floors:[],rooms:[]};
 const issues=operationReport(p,{today:'2026-10-29'}).issues;
 assert.equal(issues.filter(x=>x.kind==='maintenance').length,1);assert.equal(issues.filter(x=>x.kind==='replacement').length,1);assert.equal(issues.find(x=>x.kind==='maintenance').targetId,'a');
});
