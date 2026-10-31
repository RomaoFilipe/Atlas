import test from 'node:test';
import assert from 'node:assert/strict';
import {createSaveQueue} from '../public/project-save.js';
test('concurrent callers wait for the latest edit and never reuse a stale revision',async()=>{
 const state={ready:true,dirty:true,conflict:false,revision:4,generation:1,project:{name:'first'}};
 const requests=[];let release;
 const save=createSaveQueue({get:()=>state,persist:async snapshot=>{requests.push(snapshot);if(requests.length===1)await new Promise(resolve=>release=resolve);return{revision:snapshot.revision+1};},onSaved:(result,snapshot)=>{state.revision=result.revision;state.dirty=state.generation!==snapshot.generation;},onError:error=>{throw error;}});
 const first=save();state.project={name:'second'};state.generation++;const second=save();assert.equal(first,second);release();assert.equal(await second,true);assert.deepEqual(requests.map(r=>r.revision),[4,5]);assert.deepEqual(requests.map(r=>r.project.name),['first','second']);assert.equal(state.dirty,false);
});
test('failed writes preserve edits, stop on conflicts and can be retried',async()=>{
 const state={ready:true,dirty:true,conflict:false,revision:1,generation:1,project:{name:'local'}};let fail=true,attempts=0;
 const save=createSaveQueue({get:()=>state,persist:async()=>{attempts++;if(fail)throw Error('offline');return{revision:2};},onSaved:()=>{state.dirty=false;},onError:()=>{}});
 assert.equal(await save(),false);assert.equal(state.dirty,true);state.conflict=true;assert.equal(await save(),false);assert.equal(attempts,1);state.conflict=false;fail=false;assert.equal(await save(),true);
});
