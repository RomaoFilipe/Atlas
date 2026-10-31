const entityKinds=['sites','floors','rooms','racks','devices','links','nets','templates','connectionProposals'];
const requiredKinds=new Set(['sites','racks','devices','links','nets']);
async function loadWorkspace(env,owner){
 // A single SQLite statement observes metadata and entities at the same revision.
 const row=await env.DB.prepare(`SELECT metadata,revision,updated_at,(SELECT json_group_array(json_object('kind',kind,'document',json(document))) FROM (SELECT kind,document FROM atlas_entities WHERE owner=? ORDER BY kind,position)) AS entities FROM atlas_workspaces WHERE owner=?`).bind(owner,owner).first();
 if(!row)return {project:null,revision:0};const project=JSON.parse(row.metadata);const lists=project._atlasLists||[];delete project._atlasLists;for(const kind of entityKinds)if(requiredKinds.has(kind)||lists.includes(kind))project[kind]=[];
 for(const item of JSON.parse(row.entities)){(project[item.kind]??=[]).push(item.document);}return {project,revision:row.revision,updatedAt:row.updated_at};
}
async function saveWorkspace(env,owner,actor,input){
 const current=await loadWorkspace(env,owner);if(current.revision!==input.revision)return json({error:'O projeto foi alterado noutra sessão. Recarregue antes de guardar.'},409);
 const project=input.project,metadata={...project};delete metadata._atlasLists;for(const kind of entityKinds){if(Object.hasOwn(project,kind))metadata[kind]=[];delete metadata[kind];}
 // Preserve optional empty lists as metadata flags so round trips keep their shape.
 metadata._atlasLists=entityKinds.filter(k=>Object.hasOwn(project,k));
 const now=new Date().toISOString(),token=crypto.randomUUID(),revision=input.revision+1,statements=[];
 const statement=(sql,...args)=>env.DB.prepare(sql).bind(...args);
 if(!input.revision)statements.push(statement('INSERT INTO atlas_workspaces(owner,metadata,revision,updated_at,actor,commit_token) VALUES(?,?,1,?,?,?) ON CONFLICT(owner) DO NOTHING',owner,JSON.stringify(metadata),now,actor,token));
 else statements.push(statement('UPDATE atlas_workspaces SET metadata=?,revision=revision+1,updated_at=?,actor=?,commit_token=? WHERE owner=? AND revision=?',JSON.stringify(metadata),now,actor,token,owner,input.revision));
 const guard='EXISTS(SELECT 1 FROM atlas_workspaces WHERE owner=? AND commit_token=?)';
 if(current.project&&JSON.stringify(current.project)!==JSON.stringify(project)){
  statements.push(statement(`INSERT INTO atlas_project_history(id,owner,revision,document,created_at) SELECT lower(hex(randomblob(16))),?,?,?,? WHERE ${guard}`,owner,input.revision,JSON.stringify(current.project),current.updatedAt,owner,token));
  statements.push(statement(`DELETE FROM atlas_project_history WHERE owner=? AND ${guard} AND id NOT IN (SELECT id FROM atlas_project_history WHERE owner=? ORDER BY revision DESC LIMIT 100)`,owner,owner,token,owner));
 }
 for(const kind of entityKinds){
  const before=new Map((current.project?.[kind]||[]).map((x,i)=>[String(x.id),{item:x,position:i}]));
  const changed=(project[kind]||[]).flatMap((item,position)=>{const old=before.get(String(item.id));before.delete(String(item.id));return !old||old.position!==position||JSON.stringify(old.item)!==JSON.stringify(item)?[{position,item}]:[];});
  if(changed.length)statements.push(statement(`INSERT INTO atlas_entities(owner,kind,id,position,document,site,floor,room,name,search) SELECT ?,?,CAST(json_extract(value,'$.item.id') AS TEXT),json_extract(value,'$.position'),json_extract(value,'$.item'),json_extract(value,'$.item.site'),json_extract(value,'$.item.floor'),json_extract(value,'$.item.room'),COALESCE(json_extract(value,'$.item.name'),''),lower(json_extract(value,'$.item')) FROM json_each(?) WHERE ${guard} ON CONFLICT(owner,kind,id) DO UPDATE SET position=excluded.position,document=excluded.document,site=excluded.site,floor=excluded.floor,room=excluded.room,name=excluded.name,search=excluded.search WHERE atlas_entities.document<>excluded.document OR atlas_entities.position<>excluded.position`,owner,kind,JSON.stringify(changed),owner,token));
  if(before.size)statements.push(statement(`DELETE FROM atlas_entities WHERE owner=? AND kind=? AND id IN (SELECT value FROM json_each(?)) AND ${guard}`,owner,kind,JSON.stringify([...before.keys()]),owner,token));
 }
 const results=await env.DB.batch(statements);if(!results[0].meta?.changes)return json({error:'O projeto foi alterado noutra sessão. Recarregue antes de guardar.'},409);return json({revision});
}
async function inventoryAPI(request,env,url,owner){
 if(!['/api/inventory','/api/project/manifest','/api/plant'].includes(url.pathname))return null;
 if(!owner)return json({error:'Inicie sessão.'},401);if(request.method!=='GET')return json({error:'Método não permitido.'},405);
 try{
 if(url.pathname==='/api/project/manifest'){
  const row=await env.DB.prepare('SELECT metadata,revision FROM atlas_workspaces WHERE owner=?').bind(owner).first();if(!row)return json({project:null,revision:0});const p=JSON.parse(row.metadata);delete p._atlasLists;
  const rows=await env.DB.prepare("SELECT kind,document FROM atlas_entities WHERE owner=? AND kind IN ('sites','floors','rooms','nets') ORDER BY kind,position").bind(owner).all();for(const kind of ['sites','floors','rooms','nets'])p[kind]=[];for(const row of rows.results)p[row.kind].push(JSON.parse(row.document));return json({project:p,revision:row.revision});
 }
 const params=url.searchParams,limit=Number(params.get('limit')||100),after=Number(params.get('after')||0),query=params.get('q')||'';
 if(!Number.isInteger(limit)||limit<1||limit>200||!Number.isInteger(after)||after<0||query.length>160)return json({error:'Paginação inválida.'},400);
 const clauses=['owner=?',"kind='devices'",'position>=?'],args=[owner,after];for(const key of ['site','floor','room'])if(params.has(key)){const value=params.get(key);if(!/^[-a-zA-Z0-9_]{1,80}$/.test(value))return json({error:'Localização inválida.'},400);clauses.push(key+'=?');args.push(value);}
 if(url.pathname==='/api/plant'&&!params.has('floor'))return json({error:'Indique o piso da planta.'},400);
 if(query){clauses.push('instr(search,lower(?))>0');args.push(query);}
 const snapshot=await env.DB.prepare("SELECT revision,(SELECT json_group_array(json_object('position',position,'document',json(document))) FROM (SELECT position,document FROM atlas_entities WHERE "+clauses.join(' AND ')+" ORDER BY position LIMIT ?)) AS items FROM atlas_workspaces WHERE owner=?").bind(...args,limit+1,owner).first();
 const revision=snapshot?.revision||0;if(params.has('revision')&&params.get('revision')!==String(revision))return json({error:'O inventário mudou. Repita a pesquisa para carregar a revisão atual.'},409);
 const result={results:JSON.parse(snapshot?.items||'[]')},rows=result.results.slice(0,limit),devices=rows.map(r=>r.document);
 const data={revision,devices,next:result.results.length>limit?rows.at(-1).position+1:null};
 if(url.pathname==='/api/plant'){
  const floor=params.get('floor'),rows=await env.DB.prepare("SELECT kind,document FROM atlas_entities WHERE owner=? AND ((kind IN ('rooms','racks') AND floor=?) OR (kind='floors' AND id=?)) ORDER BY kind,position").bind(owner,floor,floor).all();data.rooms=[];data.racks=[];data.floor=null;for(const row of rows.results){const item=JSON.parse(row.document);if(row.kind==='floors')data.floor=item;else data[row.kind].push(item);}if(!data.floor)return json({error:'Piso não encontrado.'},404);
  const links=await env.DB.prepare("SELECT document FROM atlas_entities WHERE owner=? AND kind='links' AND (json_extract(document,'$.a') IN (SELECT value FROM json_each(?)) OR json_extract(document,'$.b') IN (SELECT value FROM json_each(?))) ORDER BY position").bind(owner,JSON.stringify(devices.map(d=>d.id)),JSON.stringify(devices.map(d=>d.id))).all();data.links=links.results.map(r=>JSON.parse(r.document));
 }
 const latest=await env.DB.prepare('SELECT revision FROM atlas_workspaces WHERE owner=?').bind(owner).first();if((latest?.revision||0)!==revision)return json({error:'O inventário mudou durante a consulta. Tente novamente.'},409);return json(data);
 }catch(error){console.error('Inventory failure',error.message);return json({error:'Não foi possível carregar o inventário.'},503);}
}

function applyProjectDelta(previous,delta){
 if(!previous||!delta||typeof delta!=='object'||!Array.isArray(delta.changes)||delta.changes.length>40000)throw Error('Alterações inválidas.');
 const next=JSON.parse(JSON.stringify(previous));if(delta.metadata){if(typeof delta.metadata!=='object'||Array.isArray(delta.metadata)||Object.keys(delta.metadata).some(k=>entityKinds.includes(k)||k==='_atlasLists'))throw Error('Metadados inválidos.');for(const key of Object.keys(next))if(!entityKinds.includes(key))delete next[key];Object.assign(next,delta.metadata);}
 const grouped=new Map();for(const change of delta.changes){if(!change||!entityKinds.includes(change.kind)||!['put','delete','order'].includes(change.operation))throw Error('Alteração de entidade inválida.');if(!grouped.has(change.kind))grouped.set(change.kind,[]);grouped.get(change.kind).push(change);}
 for(const [kind,changes] of grouped){const items=new Map((next[kind]||[]).map(x=>[String(x.id),x]));let order=null;for(const change of changes){if(change.operation==='order'){if(order||!Array.isArray(change.ids))throw Error('Ordem inválida.');order=change.ids.map(String);}else if(change.operation==='put'){if(!change.item||change.item.id===undefined)throw Error('Entidade inválida.');items.set(String(change.item.id),change.item);}else items.delete(String(change.id));}if(order){if(order.length!==items.size||new Set(order).size!==order.length||order.some(id=>!items.has(id)))throw Error('Ordem de entidades inválida.');next[kind]=order.map(id=>items.get(id));}else next[kind]=[...items.values()];}
 return next;
}
