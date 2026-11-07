import test from 'node:test';
import assert from 'node:assert/strict';
import {documentedRoute} from '../public/editor-design.js';
const project=()=>({devices:[{id:'pc',type:'Computador'},{id:'outlet',type:'Tomada de rede'},{id:'panel',type:'Patch panel'},{id:'switch',type:'Switch'},{id:'other',type:'Computador'}],links:[{id:'desk',a:'pc',portA:'Ethernet1',b:'outlet',portB:'F1',kind:'copper'},{id:'permanent',a:'outlet',portA:'R1',b:'panel',portB:'R1',kind:'copper'},{id:'patch',a:'panel',portA:'F1',b:'switch',portB:'Gi1/0/8',kind:'copper'},{id:'sibling',a:'outlet',portA:'F2',b:'other',portB:'Ethernet1',kind:'copper'}]});
test('editor circuit follows the same passive channel and stops at an active endpoint',()=>{
 const p=project(),before=JSON.stringify(p),route=documentedRoute(p,'pc');
 assert.equal(route.complete,true);assert.deepEqual(route.devices,['pc','outlet','panel','switch']);assert.deepEqual(route.links,['desk','permanent','patch']);assert.equal(route.steps.at(-1).port,'Gi1/0/8');assert.equal(JSON.stringify(p),before);
});
test('editor circuit never claims an incomplete or missing route is complete',()=>{
 const p=project();p.links=p.links.filter(link=>link.id!=='permanent');
 const route=documentedRoute(p,'pc');assert.equal(route.complete,false);assert.deepEqual(route.devices,['pc','outlet']);assert.deepEqual(documentedRoute(p,'unknown').links,[]);
});
