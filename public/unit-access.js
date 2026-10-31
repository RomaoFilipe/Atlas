// Unit keys are explicit grants. Missing grants mean organization-wide access;
// an empty array deliberately grants no units.
export const unitKey=site=>site.branch?.unit?site.branch.country+'/'+site.branch.unit:'site:'+site.id;
export const hasUnitScope=access=>Array.isArray(access?.units);
export function scopedProject(project,units){
 if(!project||!Array.isArray(units))return project;
 const allowed=new Set(units),sites=project.sites.filter(s=>allowed.has(unitKey(s))),siteIds=new Set(sites.map(s=>s.id)),floors=(project.floors||[]).filter(f=>siteIds.has(f.site)),floorIds=new Set(floors.map(f=>f.id)),devices=project.devices.filter(d=>siteIds.has(d.site)),ids=new Set(devices.map(d=>d.id));
 const vlanIds=new Set([...devices.map(d=>d.vlan),...project.links.filter(l=>ids.has(l.a)&&ids.has(l.b)).flatMap(l=>l.vlans||[])]),domains=new Set(sites.map(s=>String(s.branch?.networkDomain||'').toLowerCase()));
 return {version:3,name:project.name,...(typeof project.layoutLocked==='boolean'?{layoutLocked:project.layoutLocked}:{}),...(project.organization?{organization:{name:project.organization.name}}:{}),...(project.labelNamespace?{labelNamespace:project.labelNamespace}:{}),sites,floors,rooms:(project.rooms||[]).filter(r=>floorIds.has(r.floor)),racks:project.racks.filter(r=>siteIds.has(r.site)),devices,links:project.links.filter(l=>ids.has(l.a)&&ids.has(l.b)),nets:project.nets.filter(n=>vlanIds.has(n.id)).map(n=>({...n,...(n.domains?{domains:n.domains.filter(plan=>domains.has(plan.domain.toLowerCase()))}:{})})),templates:[],connectionProposals:(project.connectionProposals||[]).filter(l=>ids.has(l.a)&&ids.has(l.b))};
}
export function mergeScopedProject(full,proposed,units){
 const visible=scopedProject(full,units),editable=['floors','rooms','racks','devices','links','connectionProposals'];
 for(const key of new Set([...Object.keys(proposed),...Object.keys(visible)]))if(!editable.includes(key)&&JSON.stringify(proposed[key])!==JSON.stringify(visible[key]))throw Error('Esta conta só pode editar os espaços e equipamentos das unidades autorizadas.');
 const visibleFiles=new Set([...(visible.floors||[]).map(f=>f.plan?.asset),...visible.devices.flatMap(d=>(d.attachments||[]).map(a=>a.id))].filter(Boolean)),privateFiles=new Set([...(full.floors||[]).map(f=>f.plan?.asset),...full.devices.flatMap(d=>(d.attachments||[]).map(a=>a.id))].filter(id=>id&&!visibleFiles.has(id)));
 if([...(proposed.floors||[]).map(f=>f.plan?.asset),...(proposed.devices||[]).flatMap(d=>(d.attachments||[]).map(a=>a.id))].some(id=>privateFiles.has(id)))throw Error('Não pode associar ficheiros de outra unidade.');
 const result=JSON.parse(JSON.stringify(full));for(const kind of editable){const oldIds=new Set((visible[kind]||[]).map(x=>x.id)),hidden=new Set((full[kind]||[]).filter(x=>!oldIds.has(x.id)).map(x=>x.id));if((proposed[kind]||[]).some(x=>hidden.has(x.id)))throw Error('Identificador indisponível.');const replacements=new Map((proposed[kind]||[]).map(x=>[x.id,x]));result[kind]=(full[kind]||[]).flatMap(item=>oldIds.has(item.id)?replacements.has(item.id)?[replacements.get(item.id)]:[]:[item]);for(const item of proposed[kind]||[])if(!oldIds.has(item.id))result[kind].push(item);}
 return result;
}
