import test from 'node:test';import assert from 'node:assert/strict';
import {makeExample} from '../public/examples.js';
import {makePlan,planGeometry} from '../public/plan.js';
import {resolvePlanScope} from '../public/plan-scope.js';

test('all-floor positions view is a building navigator rather than overlapping devices',()=>{
 const p=makeExample('municipal'),before=JSON.stringify(p),svg=makePlan({project:p});
 for(const f of p.floors)assert(svg.includes('data-plan-id="'+f.id+'"'));
 assert(!svg.includes('data-plan-type="devices"'));assert(!svg.includes('data-plan-type="links"'));
 assert.equal(JSON.stringify(p),before);
});
test('spatial equipment keeps world anchors, saved rotation and model data on every floor',()=>{
 const p=makeExample('municipal');p.devices.find(d=>!d.rack).rotation=45;const before=JSON.stringify(p);
 for(const f of p.floors){const svg=makePlan({project:p,floorId:f.id}),g=planGeometry(p,{floorId:f.id});
 for(const d of p.devices.filter(d=>d.floor===f.id&&!d.rack&&d.type!=='VM')){
 const entry=svg.slice(svg.indexOf('data-plan-id="'+d.id+'"'));assert(entry.startsWith('data-plan-id="'+d.id+'"'));
 assert(entry.slice(0,entry.indexOf('</title>')+300).includes('translate('+g.x(d.x)+' '+g.y(d.z)+') rotate('+(-(d.rotation||0))+')'));
 }
 }assert.equal(JSON.stringify(p),before);
});
test('default floor has no cable mesh, selection reveals only attached cables and All is explicit',()=>{
 const p=makeExample('municipal');let svg=makePlan({project:p,floorId:'pacos-0'});assert(!svg.includes('data-plan-type="links"'));
 svg=makePlan({project:p,floorId:'pacos-0',selected:'posto-01'});assert(svg.includes('data-plan-id="TERMINAL-posto-01"'));assert(!svg.includes('data-plan-id="TERMINAL-posto-02"'));assert((svg.match(/stroke-dasharray="3 3"/g)||[]).length<=1);
 svg=makePlan({project:p,floorId:'pacos-0',cableMode:'all'});assert(svg.includes('data-plan-id="TERMINAL-posto-02"'));
 svg=makePlan({project:p,floorId:'pacos-0',selected:'posto-01',cableMode:'none'});assert(!svg.includes('data-plan-type="links"'));
});
test('cross-floor cable uses a bounded circuit with only its endpoints and respects hidden cables',()=>{
 const p=makeExample('municipal'),id='FIBRA-oficinas-0';assert.equal(resolvePlanScope(p,{selectedLink:id}).kind,'circuit');
 const svg=makePlan({project:p,selectedLink:id});assert(svg.includes('data-circuit="true"'));assert(svg.includes('data-plan-id="core"'));assert(svg.includes('data-plan-id="sw-oficinas-0"'));assert(svg.includes('data-plan-id="'+id+'"'));assert(!svg.includes('data-plan-id="posto-01"'));assert(svg.includes('Paços do Concelho'));assert(svg.includes('Armazém e Oficinas'));
 assert(!makePlan({project:p,selectedLink:id,cableMode:'none'}).includes('data-plan-type="links"'));
 assert.equal(resolvePlanScope(p,{selectedLink:'TERMINAL-posto-01'}).floorId,'pacos-0');
});
