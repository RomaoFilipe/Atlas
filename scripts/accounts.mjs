import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import path from 'node:path';
import {randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
export const roles=['admin','editor','reader'];
export function passwordRecord(password){if(typeof password!=='string'||password.length<12||password.length>256)throw Error('A palavra-passe deve ter entre 12 e 256 caracteres.');const salt=randomBytes(16).toString('hex');return {salt,hash:scryptSync(password,salt,32).toString('hex')};}
export function passwordMatches(password,record){if(typeof password!=='string'||password.length>256)return false;const actual=scryptSync(password,record.salt,32),expected=Buffer.from(record.hash,'hex');return actual.length===expected.length&&timingSafeEqual(actual,expected);}
const accountSchema = `
 CREATE TABLE IF NOT EXISTS atlas_local_auth (key TEXT PRIMARY KEY, value TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS atlas_local_users (
  username TEXT PRIMARY KEY,
  organization_name TEXT,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  position INTEGER NOT NULL
 );
 CREATE TABLE IF NOT EXISTS atlas_local_memberships (
  username TEXT NOT NULL REFERENCES atlas_local_users(username) ON DELETE CASCADE,
  organization TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','editor','reader')),
  units_json TEXT,
  position INTEGER NOT NULL CHECK(position >= 0),
  PRIMARY KEY(username, organization),
  UNIQUE(username, position)
 );`;

function replaceAccounts(db,accounts){
 if(!Array.isArray(accounts))throw Error('O armazenamento de contas deve conter uma lista.');
 // Validate the complete replacement before changing any existing records.
 const records=accounts.map(account=>{
  validateAccount(account);
  if(!account.password||!/^[a-f0-9]{32}$/i.test(account.password.salt)||!/^[a-f0-9]{64}$/i.test(account.password.hash))throw Error('Credenciais de conta inválidas.');
  if(account.organizationName!==undefined&&typeof account.organizationName!=='string')throw Error('Nome da organização inválido.');
  if(account.memberships!==undefined&&!Array.isArray(account.memberships))throw Error('Permissões de conta inválidas.');
  const grants=[account,...(account.memberships||[])].map(grant=>{
   const valid=validateAccount({username:account.username,...grant});
   return {...valid,unitsJSON:grant.units===undefined?null:JSON.stringify(valid.units??null)};
  });
  return {account,grants};
 });
 db.exec('DELETE FROM atlas_local_memberships; DELETE FROM atlas_local_users;');
 const user=db.prepare('INSERT INTO atlas_local_users(username,organization_name,password_salt,password_hash,position) VALUES(?,?,?,?,?)');
 const membership=db.prepare('INSERT INTO atlas_local_memberships(username,organization,role,units_json,position) VALUES(?,?,?,?,?)');
 records.forEach(({account,grants},position)=>{
  user.run(account.username,account.organizationName??null,account.password.salt,account.password.hash,position);
  grants.forEach((grant,index)=>membership.run(account.username,grant.organization,grant.role,grant.unitsJSON,index));
 });
 db.prepare("INSERT INTO atlas_local_auth(key,value) VALUES('enabled','1') ON CONFLICT(key) DO UPDATE SET value=excluded.value").run();
}

export function accountStore(directory){
 const file=path.join(directory,'atlas.sqlite'),legacyFile=path.join(directory,'accounts.json');
 const enabled=db=>!!db.prepare("SELECT 1 FROM atlas_local_auth WHERE key='enabled' AND value='1'").get();
 function withDatabase(operation){
  fs.mkdirSync(directory,{recursive:true,mode:0o700});
  if(!fs.existsSync(file))fs.closeSync(fs.openSync(file,'a',0o600));
  const db=new DatabaseSync(file);
  try{
   db.exec('PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;');
   db.exec(accountSchema);
   if(!enabled(db)&&fs.existsSync(legacyFile)){
    db.exec('BEGIN IMMEDIATE');
    try{
     // The marker is checked again under the write lock: import once only.
     if(!enabled(db)){
      replaceAccounts(db,JSON.parse(fs.readFileSync(legacyFile,'utf8')));
      db.prepare("INSERT INTO atlas_local_auth(key,value) VALUES('legacy_imported','1')").run();
     }
     db.exec('COMMIT');
    }catch(error){db.exec('ROLLBACK');throw error;}
   }
   return operation(db);
  }finally{db.close();}
 }
 return {
  file,legacyFile,
  exists:()=>withDatabase(enabled),
  read:()=>withDatabase(db=>{
   db.exec('BEGIN');
   try{
    const memberships=db.prepare('SELECT username,organization,role,units_json FROM atlas_local_memberships ORDER BY username,position').all();
    const accounts=db.prepare('SELECT * FROM atlas_local_users ORDER BY position').all().map(user=>{
     const grants=memberships.filter(grant=>grant.username===user.username).map(({organization,role,units_json})=>({organization,role,...(units_json===null?{}:{units:JSON.parse(units_json)})}));
     if(!grants.length)throw Error('Conta sem organização na base de dados.');
     return {username:user.username,...grants[0],...(user.organization_name===null?{}:{organizationName:user.organization_name}),password:{salt:user.password_salt,hash:user.password_hash},...(grants.length>1?{memberships:grants.slice(1)}:{})};
    });
    db.exec('COMMIT');return accounts;
   }catch(error){db.exec('ROLLBACK');throw error;}
  }),
  write:accounts=>withDatabase(db=>{
   db.exec('BEGIN IMMEDIATE');
   try{replaceAccounts(db,accounts);db.exec('COMMIT');}
   catch(error){db.exec('ROLLBACK');throw error;}
  })
 };
}
export function validateAccount(input){if(!input||!/^[-a-zA-Z0-9_.+@]{1,100}$/.test(input.username)||!/^[-a-zA-Z0-9_]{1,80}$/.test(input.organization)||!roles.includes(input.role))throw Error('Conta inválida: indique utilizador, organização e papel admin/editor/reader.');if(input.units!==undefined&&input.units!==null&&(!Array.isArray(input.units)||input.units.length>500||input.units.some(u=>typeof u!=='string'||!(/^[A-Z]{2}\/[A-Z0-9][A-Z0-9_-]{0,39}$/.test(u)||/^site:[-a-zA-Z0-9_]{1,80}$/.test(u)))))throw Error('Unidades inválidas.');if(input.role==='admin'&&Array.isArray(input.units))throw Error('Administradores precisam de acesso a toda a organização.');return {username:input.username,organization:input.organization,role:input.role,...(Array.isArray(input.units)?{units:[...new Set(input.units)]}:{})};}
export function accountGrants(account){return [{organization:account.organization,role:account.role,units:account.units??null},...(account.memberships||[])].map(grant=>{const valid=validateAccount({username:account.username,...grant});return {organization:valid.organization,role:valid.role,units:valid.units??null};}).filter((grant,index,list)=>list.findIndex(g=>g.organization===grant.organization)===index);}
export function withGrant(account,grant){const valid=validateAccount({username:account.username,...grant}),members=accountGrants(account).filter(g=>g.organization!==valid.organization);members.push({organization:valid.organization,role:valid.role,units:valid.units??null});return fromGrants(account,members);}
export function withoutGrant(account,organization){return fromGrants(account,accountGrants(account).filter(g=>g.organization!==organization));}
function fromGrants(account,grants){if(!grants.length)return null;const primary=grants.find(g=>g.organization===account.organization)||grants[0],result={...account,...primary};if(!Array.isArray(primary.units))delete result.units;result.memberships=grants.filter(g=>g.organization!==primary.organization);if(!result.memberships.length)delete result.memberships;return result;}
export function assertOrganizationAdmins(accounts){for(const organization of new Set(accounts.flatMap(a=>accountGrants(a).map(g=>g.organization))))if(!accounts.some(a=>accountGrants(a).some(g=>g.organization===organization&&g.role==='admin')))throw Error('Cada cliente precisa de um administrador.');}
