import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {accountStore,passwordRecord,passwordMatches} from '../scripts/accounts.mjs';

function fixture(t){const directory=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-account-db-'));t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));return directory;}
const account=()=>({username:'sqlite-admin@example.pt',organization:'example',organizationName:'Equipa Exemplo',role:'admin',password:passwordRecord('example-sqlite-password'),memberships:[{organization:'branch',role:'reader',units:['PT/LIS']}]});

test('SQLite stores users, password hashes and per-organization grants across store instances',t=>{
 const directory=fixture(t),store=accountStore(directory),user=account();
 assert.equal(store.exists(),false);store.write([user]);
 assert.equal(fs.existsSync(path.join(directory,'accounts.json')),false);
 assert.equal(accountStore(directory).exists(),true);assert.deepEqual(accountStore(directory).read(),[user]);
 const db=new DatabaseSync(store.file,{readOnly:true});
 try{
  assert.equal(db.prepare('SELECT count(*) AS n FROM atlas_local_users').get().n,1);
  assert.equal(db.prepare('SELECT count(*) AS n FROM atlas_local_memberships').get().n,2);
  const row=db.prepare('SELECT password_salt,password_hash FROM atlas_local_users').get();
  assert.notEqual(row.password_hash,'example-sqlite-password');assert.equal(row.password_hash,user.password.hash);
  assert.equal(passwordMatches('example-sqlite-password',accountStore(directory).read()[0].password),true);
 }finally{db.close();}
});

test('legacy JSON accounts migrate once without changing credentials or reimporting removed users',t=>{
 const directory=fixture(t),user=account(),legacy=path.join(directory,'accounts.json');
 const original=JSON.stringify([user],null,2);fs.writeFileSync(legacy,original,{mode:0o600});
 const store=accountStore(directory);assert.equal(store.exists(),true);assert.deepEqual(store.read(),[user]);
 assert.equal(fs.readFileSync(legacy,'utf8'),original);
 const changed={...user,organizationName:'Novo nome'};store.write([changed]);
 assert.deepEqual(accountStore(directory).read(),[changed]);
 store.write([]);assert.equal(accountStore(directory).exists(),true);assert.deepEqual(accountStore(directory).read(),[]);
 const db=new DatabaseSync(store.file,{readOnly:true});try{assert.equal(db.prepare("SELECT value FROM atlas_local_auth WHERE key='legacy_imported'").get().value,'1');}finally{db.close();}
});

test('a failed SQLite account replacement rolls back users and permissions',t=>{
 const directory=fixture(t),store=accountStore(directory),user=account();store.write([user]);
 assert.throws(()=>store.write([user,{...user,role:'reader'}]),/UNIQUE/);
 assert.deepEqual(store.read(),[user]);
 assert.throws(()=>store.write([{...user,memberships:[{organization:'branch',role:'invalid'}]}]),/Conta inválida/);
 assert.deepEqual(store.read(),[user]);
 assert.throws(()=>store.write([{...user,password:{salt:'bad',hash:'bad'}}]),/Credenciais/);
 assert.deepEqual(store.read(),[user]);
});

test('invalid legacy files fail closed and are left intact',t=>{
 const directory=fixture(t),legacy=path.join(directory,'accounts.json');fs.writeFileSync(legacy,'{broken');
 assert.throws(()=>accountStore(directory).exists(),SyntaxError);assert.equal(fs.readFileSync(legacy,'utf8'),'{broken');
 const db=new DatabaseSync(path.join(directory,'atlas.sqlite'),{readOnly:true});try{assert.equal(db.prepare('SELECT count(*) AS n FROM atlas_local_auth').get().n,0);}finally{db.close();}
});

test('creating the SQLite schema alone does not enable account authentication',t=>{
 const directory=fixture(t),store=accountStore(directory);assert.deepEqual(store.read(),[]);assert.equal(store.exists(),false);
 const user=account();assert.throws(()=>store.write([user,user]),/UNIQUE/);assert.equal(store.exists(),false);assert.deepEqual(store.read(),[]);
});

test('the local account CLI creates and lists SQLite accounts in separate processes',t=>{
 const directory=fixture(t),env={...process.env,ATLAS_DATA_DIR:directory,ATLAS_ACCOUNT_PASSWORD:'example-cli-sqlite-password'};
 const create=spawnSync(process.execPath,['scripts/account.mjs','set','local-admin','admin','default'],{env,encoding:'utf8'});assert.equal(create.status,0,create.stderr);
 const listing=spawnSync(process.execPath,['scripts/account.mjs','list'],{env,encoding:'utf8'});assert.equal(listing.status,0,listing.stderr);
 assert.deepEqual(JSON.parse(listing.stdout),[{username:'local-admin',clients:[{organization:'default',role:'admin',units:null}]}]);
 assert.equal(fs.existsSync(path.join(directory,'accounts.json')),false);assert.equal(accountStore(directory).read()[0].username,'local-admin');
 assert.equal(listing.stdout.includes('example-cli-sqlite-password'),false);
});
