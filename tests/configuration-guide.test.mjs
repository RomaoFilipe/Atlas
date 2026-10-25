import test from 'node:test';
import assert from 'node:assert/strict';
import {configurationSteps} from '../public/configuration-guide.js';
const empty={sites:[],floors:[],rooms:[],devices:[],nets:[],links:[],racks:[]};
const spaces={...empty,sites:[{id:'s',branch:{country:'PT',unit:'Sede'}}],floors:[{id:'f',site:'s'}],rooms:[{id:'r',floor:'f'}]};
const device=(id)=>({id,name:id,site:'s',room:'r',type:'Computador',record:{owner:'Ana'}});
const next=p=>configurationSteps(p).find(s=>!s.done)?.id;
test('journey starts with spaces and gates equipment on a valid room',()=>{
 assert.deepEqual(configurationSteps(empty).map(s=>s.id),['spaces','equipment','connections','check']);
 assert.equal(next(empty),'spaces');
 assert.equal(configurationSteps({...empty,sites:[{id:'s'}]} )[1].enabled,false);
 assert.equal(configurationSteps(spaces)[1].enabled,true);
 assert.equal(next(spaces),'equipment');
 assert.equal(configurationSteps({...spaces,floors:[]})[0].done,false);
});
test('journey advances through equipment, connections and remaining records',()=>{
 const equipped={...spaces,devices:[device('a'),{...device('b'),record:{}}]};
 assert.equal(next(equipped),'connections');
 const linked={...equipped,links:[{id:'l',a:'a',b:'b',kind:'copper',portA:'P1',portB:'P1',vlans:[]}]};
 assert.equal(next(linked),'check');
 assert.equal(next({...linked,devices:[device('a'),device('b')]}),undefined);
});
test('proposals and unidentified ports prevent premature connection completion',()=>{
 const linked={...spaces,devices:[device('a'),device('b')],links:[{id:'l',a:'a',b:'b',kind:'copper',portA:'P1',portB:'P1',vlans:[]}]};
 assert.equal(next({...linked,connectionProposals:[{id:'proposal'}]}),'connections');
 assert.equal(next({...linked,devices:[{...device('a'),pendingNetworkPorts:['P2']},device('b')]}),'connections');
 assert.equal(next({...linked,nets:[{id:1}]}),next(linked));
 assert.equal(next({...linked,links:[] }),'connections');
});
