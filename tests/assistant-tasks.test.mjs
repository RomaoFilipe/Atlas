import test from 'node:test';import assert from 'node:assert/strict';
import {normalizeProject,clone} from '../public/model.js';
import {createTaskRunner} from '../public/assistant-task-runner.js';
import {planBranch} from '../public/assistant-branch.js';
import {parseBranchRequest,branchExample} from '../public/assistant-branch-request.js';
const empty=()=>normalizeProject({version:3,name:'Teste',sites:[],floors:[],rooms:[],racks:[],devices:[],links:[],nets:[],templates:[]});
function harness(){let project=empty(),generation=0,revision=0,dirty=false,calls=0;const history=[],saved=[];const storageData=new Map(),storage={getItem:k=>storageData.get(k)||null,setItem:(k,v)=>storageData.set(k,v),removeItem:k=>storageData.delete(k)};
 const app={get:()=>({project,generation,revision,dirty,ready:true,conflict:false}),change(fn){history.push(clone(project));const next=clone(project);fn(next);project=normalizeProject(next);generation++;dirty=true;return true;},async save(){calls++;if(app.failCall===calls)return false;revision++;dirty=false;saved.push(clone(project));return true;},undo(){project=history.pop();generation++;dirty=true;}};
 return {app,storage,saved,storageData};}
const config=()=>parseBranchRequest(branchExample);
test('a staged branch completes 40 posts across two floors and three departments, with saved checkpoints',async()=>{
 const {app,storage,saved}=harness(),runner=createTaskRunner(app,{storage});const result=await runner.start(config(),branchExample);assert.equal(result.status,'completed');assert.equal(saved.length,5);assert.equal(app.get().project.floors.length,2);assert.equal(app.get().project.rooms.length,3);assert.equal(app.get().project.devices.filter(d=>d.type==='Computador').length,40);assert.equal(result.next,5);assert.equal(app.get().dirty,false);
 const revision=app.get().revision;await runner.start(config(),branchExample);assert.equal(app.get().revision,revision);
 for(let i=0;i<5;i++)await runner.undo();assert.deepEqual(app.get().project,empty());assert.equal(runner.get().next,0);assert.equal(runner.get().canUndo,false);
});
test('pause and restored-session resume use the same branch instead of repeating completed stages',async()=>{
 const {app,storage}=harness();let paused=false,runner;runner=createTaskRunner(app,{storage,onUpdate:job=>{if(!paused&&job.next===1&&job.running){paused=true;runner.pause();}}});await runner.start(config(),branchExample);assert.equal(runner.get().status,'paused');assert.equal(runner.get().next,1);assert.equal(app.get().project.sites.length,1);assert.equal(app.get().project.floors.length,0);
 const restored=createTaskRunner(app,{storage});assert.equal(restored.restore().next,1);assert.equal(restored.get().canUndo,false);await restored.resume();assert.equal(restored.get().status,'completed');assert.equal(app.get().project.sites.length,1);assert.equal(app.get().project.devices.filter(d=>d.type==='Computador').length,40);
});
test('save failure pauses an applied stage and retry saves it without recreating floors',async()=>{
 const {app,storage}=harness();app.failCall=2;const runner=createTaskRunner(app,{storage});await runner.start(config(),branchExample);assert.equal(runner.get().status,'paused');assert.equal(runner.get().next,1);assert.ok(runner.get().pending);assert.equal(app.get().project.floors.length,2);assert.equal(app.get().dirty,true);
 app.failCall=0;await runner.resume();assert.equal(runner.get().status,'completed');assert.equal(app.get().project.floors.length,2);assert.equal(app.get().project.devices.filter(d=>d.type==='Computador').length,40);
});
test('manual changes between stages stop the plan and are never overwritten by resume or undo',async()=>{
 const {app}=harness();let edited=false;const runner=createTaskRunner(app,{onUpdate:job=>{if(!edited&&job.next===1&&job.running){edited=true;app.change(p=>p.name='Edição manual');}}});await runner.start(config(),branchExample);assert.equal(runner.get().status,'paused');assert.match(runner.get().message,/mudou/);assert.equal(app.get().project.floors.length,0);await runner.resume();assert.equal(app.get().project.name,'Edição manual');assert.equal(app.get().project.floors.length,0);await assert.rejects(()=>runner.undo(),/Não há|mudou/);
});
test('preflight refuses impossible dimensions and names before a single project mutation',async()=>{
 const {app}=harness(),runner=createTaskRunner(app);const prompt='Prepara uma filial com um piso, vinte departamentos e 40 postos.';await assert.rejects(()=>runner.start(parseBranchRequest(prompt),prompt),/cabem/);assert.equal(app.get().generation,0);assert.deepEqual(app.get().project,empty());
 assert.equal(parseBranchRequest(branchExample+' Apaga o projeto.'),null);const branch=planBranch(empty(),config(),branchExample);assert.equal(branch.steps.length,5);assert.ok(branch.dimensions.width<=50&&branch.dimensions.depth<=50);
});
test('cancel retains completed stages and corrupted stored plans cannot execute',async()=>{
 const {app,storage,storageData}=harness();let cancelled=false,runner;runner=createTaskRunner(app,{storage,onUpdate:job=>{if(!cancelled&&job.next===1&&job.running){cancelled=true;runner.cancel();}}});await runner.start(config(),branchExample);assert.equal(runner.get().status,'cancelled');assert.equal(app.get().project.sites.length,1);assert.equal(app.get().project.floors.length,0);
 const key=[...storageData.keys()][0],corrupt=JSON.parse(storageData.get(key));corrupt.config.people=50;storage.setItem(key,JSON.stringify(corrupt));const restored=createTaskRunner(app,{storage});assert.equal(restored.restore(),null);assert.equal(app.get().project.sites.length,1);
});

test('a restored pending stage retries its save after interruption without applying it twice',async()=>{
 const {app,storage}=harness();app.failCall=3;const original=createTaskRunner(app,{storage});await original.start(config(),branchExample);assert.equal(original.get().next,2);assert.ok(original.get().pending);const deviceIds=app.get().project.devices.map(d=>d.id),restored=createTaskRunner(app,{storage});assert.ok(restored.restore().pending);app.failCall=0;await restored.resume();assert.equal(restored.get().status,'completed');assert.equal(app.get().project.devices.filter(d=>d.type==='Computador').length,40);for(const id of deviceIds)assert.ok(app.get().project.devices.some(d=>d.id===id));
});
test('server conflicts block resume until explicitly resolved and never recreate the pending stage',async()=>{
 const {app,storage}=harness(),get=app.get;let conflict=false,calls=0;const save=app.save;app.get=()=>({...get(),conflict});app.save=async()=>{if(++calls===2){conflict=true;return false;}return save();};const runner=createTaskRunner(app,{storage});await runner.start(config(),branchExample);assert.equal(runner.get().status,'paused');assert.equal(runner.get().next,1);const floors=app.get().project.floors.map(f=>f.id);await assert.rejects(()=>runner.resume(),/conflito/);assert.deepEqual(app.get().project.floors.map(f=>f.id),floors);conflict=false;await runner.resume();assert.equal(runner.get().status,'completed');assert.deepEqual(app.get().project.floors.map(f=>f.id),floors);
});
test('external changes while a save is in flight pause the plan and preserve both edits',async()=>{
 const {app}=harness(),save=app.save;let once=false;app.save=async()=>{const result=await save();if(!once){once=true;app.change(p=>p.name='Alteração concorrente');}return result;};const runner=createTaskRunner(app);await runner.start(config(),branchExample);assert.equal(runner.get().status,'paused');assert.match(runner.get().message,/durante a gravação/);assert.equal(app.get().project.name,'Alteração concorrente');assert.equal(app.get().project.sites.length,1);assert.equal(app.get().project.floors.length,0);await runner.resume();assert.equal(runner.get().status,'paused');assert.equal(app.get().project.name,'Alteração concorrente');assert.equal(app.get().project.sites.length,1);
});
