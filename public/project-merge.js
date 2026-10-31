import {validate} from './model.js';
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),copy=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value)),object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
export function mergeProjects(base,local,remote,choices={}){
 const conflicts=[];
 function merge(a,b,c,path){
  if(same(b,c))return copy(b);if(same(a,b))return copy(c);if(same(a,c))return copy(b);
  if(object(b)&&object(c)&&(object(a)||a===undefined)){const result={};for(const key of new Set([...Object.keys(a||{}),...Object.keys(b),...Object.keys(c)])){const value=merge(a?.[key],b[key],c[key],[...path,key]);if(value!==undefined)result[key]=value;}return result;}
  const entityArray=value=>Array.isArray(value)&&value.every(x=>object(x)&&['string','number'].includes(typeof x.id))&&new Set(value.map(x=>String(x.id))).size===value.length;
  if(entityArray(b)&&entityArray(c)&&(entityArray(a)||a===undefined)){const maps=[a||[],b,c].map(items=>new Map(items.map(x=>[String(x.id),x]))),result=[];for(const id of new Set([...c.map(x=>String(x.id)),...b.map(x=>String(x.id)),...(a||[]).map(x=>String(x.id))])){const item=merge(maps[0].get(id),maps[1].get(id),maps[2].get(id),[...path,id]);if(item!==undefined)result.push(item);}return result;}
  const key=JSON.stringify(path),choice=choices[key];conflicts.push({key,path,base:copy(a),local:copy(b),remote:copy(c),choice:choice==='local'||choice==='remote'?choice:null});return copy(choice==='local'?b:c);
 }
 let project=merge(base,local,remote,[]);if(project?.version===3){try{validate(project);}catch(error){const key=JSON.stringify(['$relations']),choice=choices[key];conflicts.push({key,path:['Relações entre espaços e equipamentos'],local:copy(local),remote:copy(remote),wholeProject:true,detail:error.message,choice:choice==='local'||choice==='remote'?choice:null});project=copy(choice==='local'?local:remote);}}return {project,conflicts,resolved:conflicts.every(c=>c.choice)};
}
