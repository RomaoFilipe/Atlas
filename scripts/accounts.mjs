import fs from 'node:fs';
import path from 'node:path';
import {randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
export const roles=['admin','editor','reader'];
export function passwordRecord(password){if(typeof password!=='string'||password.length<12||password.length>256)throw Error('A palavra-passe deve ter entre 12 e 256 caracteres.');const salt=randomBytes(16).toString('hex');return {salt,hash:scryptSync(password,salt,32).toString('hex')};}
export function passwordMatches(password,record){if(typeof password!=='string'||password.length>256)return false;const actual=scryptSync(password,record.salt,32),expected=Buffer.from(record.hash,'hex');return actual.length===expected.length&&timingSafeEqual(actual,expected);}
export function accountStore(directory){const file=path.join(directory,'accounts.json');return {exists:()=>fs.existsSync(file),read:()=>fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):[],write(accounts){fs.mkdirSync(directory,{recursive:true,mode:0o700});const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(accounts,null,2),{mode:0o600});fs.renameSync(tmp,file);},file};}
export function validateAccount(input){if(!input||!/^[-a-zA-Z0-9_.@]{1,100}$/.test(input.username)||!/^[-a-zA-Z0-9_]{1,80}$/.test(input.organization)||!roles.includes(input.role))throw Error('Conta inválida: indique utilizador, organização e papel admin/editor/reader.');return {username:input.username,organization:input.organization,role:input.role};}
