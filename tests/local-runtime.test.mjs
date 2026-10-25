import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {demo} from '../public/demo.js';

test('local runtime persists project, versions, attachments and export keys across restarts',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'atlas-runtime-'));
 const port=31379,origin=`http://localhost:${port}`;
 let child;
 async function start(){
  child=spawn(process.execPath,['scripts/start.mjs'],{env:{...process.env,PORT:String(port),ATLAS_HOST:'127.0.0.1',ATLAS_DATA_DIR:directory},stdio:['ignore','pipe','pipe']});
  await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Server startup timeout')),15000);let output='';child.stdout.on('data',chunk=>{output+=chunk;if(output.includes('Atlas pronto:')){clearTimeout(timeout);resolve();}});child.once('exit',code=>{clearTimeout(timeout);reject(new Error('Server exited: '+code));});});
 }
 async function stop(){if(!child||child.exitCode!==null)return;await new Promise(resolve=>{child.once('exit',resolve);child.kill('SIGTERM');});}
 async function api(route,method='GET',body,headers={}){return fetch(origin+route,{method,headers:{Origin:origin,...(body&&typeof body!=='string'?{'Content-Type':'application/json'}:{}),...headers},...(body?{body:typeof body==='string'?body:JSON.stringify(body)}:{})});}
 try{
  await start();assert.equal((await api('/')).status,200);
  assert.equal((await api('/api/project','PUT',{project:demo,revision:0})).status,200);
  assert.equal((await api('/api/project','PUT',{project:demo,revision:0})).status,409);
  const version=await api('/api/versions','POST',{label:'Teste',project:demo});assert.equal(version.status,201);
  const file=await api('/api/equipment-files','POST','%PDF-1.7\nlocal');assert.equal(file.status,201);const {id}=await file.json();
  const encrypted=await api('/api/secure-export','POST',{project:demo});assert.equal(encrypted.status,200);const envelope=await encrypted.json();
  assert.equal((await api('/api/project','PUT',{project:demo,revision:1},{Origin:'http://outside.example'})).status,403);
  await stop();await start();
  assert.equal((await (await api('/api/project')).json()).revision,1);
  assert.equal((await (await api('/api/versions')).json()).versions.length,1);
  assert.equal(await (await api('/api/equipment-files/'+id)).text(),'%PDF-1.7\nlocal');
  const restored=await api('/api/secure-import','POST',envelope);assert.equal(restored.status,200);
  assert.equal((await restored.json()).project.name,demo.name);
 }finally{await stop();await rm(directory,{recursive:true,force:true});}
});
