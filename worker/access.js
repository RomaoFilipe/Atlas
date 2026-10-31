async function unitScopedAPI(request,env,url,owner,actor,access){
 if(!hasUnitScope(access)||!url.pathname.startsWith('/api/'))return null;
 const state=await loadWorkspace(env,owner),project=scopedProject(state.project,access.units),path=url.pathname;
 if(path==='/api/project'){
  if(request.method==='GET')return json({project,revision:state.revision});
  if(request.method!=='PATCH')return json({error:'Use alterações por entidade nas unidades autorizadas.'},403);
  try{const raw=await readBounded(request,20000000),input=JSON.parse(new TextDecoder().decode(raw));if(input.revision!==state.revision)return json({error:'O projeto foi alterado noutra sessão.'},409);const proposed=applyProjectDelta(project,input.delta);validate(proposed);input.project=mergeScopedProject(state.project,proposed,access.units);validate(input.project);return await saveWorkspace(env,owner,actor,input);}catch(error){return error.code||error instanceof TypeError?json({error:'Não foi possível guardar as alterações. Tente novamente.'},503):json({error:error.message},400);}
 }
 if(['/api/inventory','/api/plant','/api/project/manifest'].includes(path)){
  if(request.method!=='GET')return json({error:'Método não permitido.'},405);
  if(!project)return path==='/api/project/manifest'?json({project:null,revision:state.revision}):json({devices:[],next:null,revision:state.revision});
  if(path==='/api/project/manifest'){const {devices,racks,links,templates,connectionProposals,...manifest}=project;return json({project:manifest,revision:state.revision});}
  const params=url.searchParams,limit=Number(params.get('limit')||100),after=Number(params.get('after')||0),q=(params.get('q')||'').toLowerCase();if(!Number.isInteger(limit)||limit<1||limit>200||!Number.isInteger(after)||after<0||q.length>160)return json({error:'Paginação inválida.'},400);if(params.has('revision')&&params.get('revision')!==String(state.revision))return json({error:'O inventário mudou. Repita a pesquisa.'},409);
  const devices=project.devices.filter(d=>(!params.has('unit')||project.sites.some(s=>s.id===d.site&&unitKey(s)===params.get('unit')))&&['site','floor','room'].every(k=>!params.has(k)||d[k]===params.get(k))&&(!q||JSON.stringify(d).toLowerCase().includes(q))),page=devices.slice(after,after+limit),data={devices:page,next:devices.length>after+limit?after+limit:null,revision:state.revision};
  if(path==='/api/plant'){const floor=project.floors.find(f=>f.id===params.get('floor'));if(!floor)return json({error:'Piso não encontrado.'},404);const ids=new Set(page.map(d=>d.id));Object.assign(data,{floor,rooms:project.rooms.filter(r=>r.floor===floor.id),racks:project.racks.filter(r=>r.floor===floor.id),links:project.links.filter(l=>ids.has(l.a)||ids.has(l.b))});}return json(data);
 }
 if(path.startsWith('/api/assets/')||path.startsWith('/api/equipment-files/')){
  const id=path.split('/').at(-1),allowed=path.startsWith('/api/assets/')?project?.floors.some(f=>f.plan?.asset===id):project?.devices.some(d=>d.attachments?.some(a=>a.id===id));return allowed?null:json({error:'Ficheiro não encontrado.'},404);
 }
 if(['/api/equipment-files','/api/assets'].includes(path)&&request.method==='POST')return null;
 if(path==='/api/audit'&&request.method==='GET'){
  const response=await featureAPI(request,env,url,owner),data=await response.json();if(!response.ok)return response;
  const ids=new Set(['sites','floors','rooms','racks','devices','links'].flatMap(kind=>(project?.[kind]||[]).map(x=>kind+':'+x.id)));data.events=data.events.filter(event=>ids.has(event.entity_type+':'+event.entity_id)&&[event.before,event.after].every(item=>!item||[['site','sites'],['floor','floors'],['room','rooms'],['rack','racks'],['host','devices'],['a','devices'],['b','devices']].every(([key,kind])=>!item[key]||ids.has(kind+':'+item[key]))));return json(data);
 }
 if(path.startsWith('/api/tasks')||path==='/api/team'||path==='/api/session')return null;
 return json({error:'Este recurso não está disponível para contas com acesso por unidade.'},403);
}
