export const TYPES=['Mini-switch','Switch','Firewall','Servidor','Armazenamento','Patch panel','UPS','Computador','Portátil','Telefone IP','Wi-Fi','Câmara','Impressora','Internet','VM','Tomada de rede','PDU','Posto de trabalho'];
export const clone=x=>JSON.parse(JSON.stringify(x));
export const uid=p=>p+'-'+(crypto.randomUUID?.()||Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('')).slice(0,12);
export const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function ipv4(s){return /^(\d{1,3}\.){3}\d{1,3}$/.test(s)&&s.split('.').every(n=>+n<=255&&String(+n)===n);}
// VLAN IDs remain numeric; each address domain can override its addressing plan.
export const networkDomain=(p,site)=>String(p.sites.find(s=>s.id===(typeof site==='object'?site.site:site))?.branch?.networkDomain||'').toLowerCase();
export function networkFor(p,vlan,site){const n=p.nets.find(n=>n.id===vlan);if(!n)return null;const plan=n.domains?.find(x=>x.domain.toLowerCase()===networkDomain(p,site));return plan?{...n,...plan}:n;}
export function setNetworkPlan(p,vlan,site,values){const n=p.nets.find(n=>n.id===vlan);if(!n)throw Error('VLAN inexistente.');const domain=networkDomain(p,site);if(!domain){Object.assign(n,values);return;}n.domains??=[];let plan=n.domains.find(x=>x.domain.toLowerCase()===domain);if(!plan){plan={domain,subnet:'',gateway:''};n.domains.push(plan);}Object.assign(plan,values);}
export function validate(p){if(p?.layoutLocked!==undefined&&typeof p.layoutLocked!=='boolean')throw new Error('Bloqueio do mapa inválido.');for(const type of ['sites','floors','rooms','racks','devices'])for(const item of (Array.isArray(p?.[type])?p[type]:[]))if(item.layoutLocked!==undefined&&typeof item.layoutLocked!=='boolean')throw new Error('Bloqueio de posição inválido.');
 const fail=m=>{throw new Error(m);};const text=(v,name,max=160)=>{if(typeof v!=='string'||v.length>max)fail(name+': texto inválido ou demasiado longo.');};const number=(v,min,max,name)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)fail(name+': valor fora dos limites.');};
 if(!p||p.version!==3)fail('Formato de projeto não suportado.');text(p.name,'Nome',100);if(!p.name.trim())fail('Indique o nome do projeto.');
 for(const name of ['sites','racks','devices','links','nets']){if(!Array.isArray(p[name])||p[name].length>({devices:10000,links:30000,racks:2000,nets:4094,sites:500}[name]))fail('Lista inválida: '+name);const ids=new Set();for(const x of p[name]){if(!x||typeof x!=='object')fail('Registo inválido.');if(name==='nets'){if(!Number.isInteger(x.id)||x.id<1||x.id>4094)fail('VLAN: use um número entre 1 e 4094.');}else if(typeof x.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(x.id))fail('Identificador inválido.');if(ids.has(x.id))fail('Identificador repetido: '+x.id);ids.add(x.id);}}
 const sites=new Map(p.sites.map(x=>[x.id,x])),racks=new Map(p.racks.map(x=>[x.id,x])),devs=new Map(p.devices.map(x=>[x.id,x]));const nets=new Set(p.nets.map(x=>x.id));
 for(const s of p.sites){text(s.name,'Edifício');if(!s.name.trim())fail('O edifício precisa de um nome.');text(s.sub||'','Descrição');for(const k of ['x','z'])number(s[k],-150,150,'Posição do edifício');for(const k of ['w','d'])number(s[k],4,50,'Dimensão do edifício');}
 for(const network of p.nets){if(network.domains!==undefined){if(!Array.isArray(network.domains)||network.domains.length>500)fail('Planos de domínio inválidos.');const domains=new Set();for(const plan of network.domains){if(!plan||Object.keys(plan).some(k=>!['domain','subnet','gateway'].includes(k))||typeof plan.domain!=='string'||!/^[-A-Za-z0-9_]{1,80}$/.test(plan.domain)||domains.has(plan.domain.toLowerCase()))fail('Domínio de rede inválido ou repetido.');domains.add(plan.domain.toLowerCase());text(plan.subnet,'Sub-rede');text(plan.gateway,'Gateway');}}for(const n of [network,...(network.domains||[])]){if(n===network)text(n.name,'Nome da rede');if(n===network&&!/^#[0-9a-f]{6}$/i.test(n.color))fail('Cor de rede inválida.');if(n.gateway&&!ipv4(n.gateway))fail('Gateway inválido.');if(n.subnet&&(n.subnet.split('/').length!==2||!ipv4(n.subnet.split('/')[0])||!/^\d+$/.test(n.subnet.split('/')[1]||'')||+n.subnet.split('/')[1]>32))fail('Sub-rede inválida: use IPv4/prefixo.');}}
 for(const r of p.racks){if(r.locked!==undefined&&typeof r.locked!=='boolean')fail('Estado de bloqueio do bastidor inválido.');text(r.name,'Bastidor');if(!sites.has(r.site))fail('Edifício do bastidor inexistente.');if(!Number.isInteger(r.units))fail('As unidades do bastidor devem ser inteiras.');number(r.units,4,60,'Capacidade do bastidor');for(const k of ['x','z'])number(r[k],-25,25,'Posição no edifício');const s=sites.get(r.site);if(Math.abs(r.x)>s.w/2-.7||Math.abs(r.z)>s.d/2-.7)fail('O bastidor '+r.name+' fica fora do edifício. Aumente a dimensão ou ajuste a posição.');}
 validateOrganization(p);
 const ips=new Set();for(const d of p.devices){text(d.name,'Equipamento');if(!d.name.trim())fail('Indique o nome do equipamento.');if(!TYPES.includes(d.type))fail('Tipo de equipamento inválido.');if(!sites.has(d.site))fail('Edifício do equipamento inexistente.');if(d.vlan!==0&&!nets.has(d.vlan))fail('VLAN inexistente.');for(const field of ['ip','gateway']){if(d[field]&&!ipv4(d[field]))fail('Endereço IPv4 inválido em '+d.name);}if(d.ip){const domain=(sites.get(d.site)?.branch?.networkDomain||'').toLowerCase(),ipKey=domain+'|'+d.ip;if(ips.has(ipKey))fail('IP repetido: '+d.ip+(domain?' no domínio '+domain:''));ips.add(ipKey);}for(const k of ['x','z'])number(d[k],-200,200,'Posição do equipamento');number(d.y,0,20,'Altura');for(const k of ['model','role'])if(d[k])text(d[k],k,1000);number(d.portCount,0,96,'Número de portas');if(!Number.isInteger(d.portCount))fail('Indique um número inteiro de portas.');
 if(d.type==='VM'){if(!devs.has(d.host)||devs.get(d.host).type!=='Servidor'||devs.get(d.host).site!==d.site)fail('A VM deve ter um servidor anfitrião no mesmo edifício.');if(d.rack)fail('As VMs pertencem a um servidor, não ocupam U.');}
 if(d.rack){const r=racks.get(d.rack);if(!r||r.site!==d.site)fail('O bastidor deve pertencer ao edifício do equipamento.');if(!Number.isInteger(d.u)||!Number.isInteger(d.units)||d.u<1||d.units<1||d.u+d.units-1>r.units)fail('O equipamento excede a capacidade do bastidor.');for(const other of p.devices){if(other.id!==d.id&&other.rack===d.rack&&d.u<other.u+other.units&&other.u<d.u+d.units)fail('Unidades U ocupadas por '+other.name+'.');}}
 }
 const usedPorts=new Set();for(const l of p.links){if(!devs.has(l.a)||!devs.has(l.b)||l.a===l.b)fail('Selecione dois equipamentos diferentes e existentes.');if(!['fiber','copper','virtual','power'].includes(l.kind))fail('Tipo de ligação inválido.');if(!Array.isArray(l.vlans)||l.vlans.some(n=>n!==0&&!nets.has(n)))fail('VLAN inválida na ligação.');for(const k of ['portA','portB','speed'])text(l[k]||'',k);if(l.kind!=='virtual')for(const [device,port] of [[l.a,l.portA],[l.b,l.portB]]){if(port){const key=device+'|'+port.trim().toLowerCase();if(usedPorts.has(key))fail('Porta já ligada: '+devs.get(device).name+' / '+port);usedPorts.add(key);}}}
 validatePortProfiles(p);validateEquipmentRecords(p);validateWAN(p);validateExtras(p);return p;
}
export function worldPosition(p,d){if(d.type==='VM'&&d.host){const h=p.devices.find(x=>x.id===d.host);if(h){const b=worldPosition(p,h),i=p.devices.filter(x=>x.host===h.id).findIndex(x=>x.id===d.id);return {x:b.x+(i-1)*1.3,y:b.y+2,z:b.z+1.3};}}if(d.rack){const r=p.racks.find(x=>x.id===d.rack),s=p.sites.find(x=>x.id===r?.site);if(r&&s)return{x:s.x+r.x,y:(p.floors?.find(f=>f.id===r.floor)?.elevation||0)+.3+(d.u-1+d.units/2)*.12,z:s.z+r.z};}return{x:d.x,y:d.y+(p.floors?.find(f=>f.id===d.floor)?.elevation||0),z:d.z};}
export function removeEntity(p,type,id){if(type==='sites'){const floorIds=(p.floors||[]).filter(f=>f.site===id).map(f=>f.id);p.floors=(p.floors||[]).filter(f=>!floorIds.includes(f.id));p.rooms=(p.rooms||[]).filter(r=>!floorIds.includes(r.floor));const rs=p.racks.filter(r=>r.site===id).map(r=>r.id);p.racks=p.racks.filter(r=>!rs.includes(r.id));for(const d of [...p.devices.filter(d=>d.site===id)])removeEntity(p,'devices',d.id);p.sites=p.sites.filter(x=>x.id!==id);}if(type==='racks'){for(const d of p.devices.filter(d=>d.rack===id)){const pos=worldPosition(p,d);pos.y-=p.floors?.find(f=>f.id===d.floor)?.elevation||0;Object.assign(d,pos);d.rack='';}p.racks=p.racks.filter(x=>x.id!==id);}if(type==='devices'){for(const vm of [...p.devices.filter(d=>d.host===id)])removeEntity(p,'devices',vm.id);p.devices=p.devices.filter(x=>x.id!==id);p.links=p.links.filter(x=>x.a!==id&&x.b!==id);}if(type==='links')p.links=p.links.filter(x=>x.id!==id);if(type==='nets'){if(p.devices.some(d=>d.vlan===id||(d.portProfiles||[]).some(c=>c.accessVlan===id||c.nativeVlan===id||c.allowedVlans?.includes(id)))||p.links.some(l=>l.vlans.includes(id)))throw new Error('Esta VLAN está em utilização. Altere os equipamentos e ligações antes de a eliminar.');p.nets=p.nets.filter(n=>n.id!==id);}return p;}
export function findPath(p,a,b){const q=[[a]],seen=new Set([a]);while(q.length){const path=q.shift(),last=path.at(-1);if(last===b)return path;for(const l of p.links){const n=l.a===last?l.b:l.b===last?l.a:null;if(n&&!seen.has(n)){seen.add(n);q.push([...path,n]);}}}return [];}

export function moveRack(p,id,x,z){
 const r=p.racks.find(r=>r.id===id);if(!r)throw new Error('Bastidor inexistente.');
 if(r.locked)throw new Error('Posição bloqueada. Desbloqueie o bastidor para o mover.');
 if(!Number.isFinite(x)||!Number.isFinite(z))throw new Error('Posição inválida.');
 const s=p.sites.find(s=>s.id===r.site),limitX=s.w/2-.7,limitZ=s.d/2-.7;
 r.x=Math.min(limitX,Math.max(-limitX,Math.round(x*10)/10));
 r.z=Math.min(limitZ,Math.max(-limitZ,Math.round(z*10)/10));return r;
}

// Optional fields preserve compatibility with projects saved in earlier versions.
export function normalizeProject(p){
 const legacyFloors=p.floors===undefined;
 p.floors??=[];p.rooms??=[];p.templates??=[];if(Array.isArray(p.connectionProposals))p.connectionProposals=p.connectionProposals.filter(l=>p.devices.some(d=>d.id===l.a)&&p.devices.some(d=>d.id===l.b));
 for(const s of p.sites){if(legacyFloors&&!p.floors.some(f=>f.site===s.id))p.floors.push({id:'floor-'+s.id,name:'Piso 0',site:s.id,level:0,elevation:0});}
 for(const r of p.racks){r.floor??=p.floors.find(f=>f.site===r.site)?.id||'';r.room??='';}
 for(const d of [...p.devices.filter(d=>d.type!=='VM'),...p.devices.filter(d=>d.type==='VM')]){if(d.rack){const r=p.racks.find(r=>r.id===d.rack);if(r){d.floor=r.floor;d.room=r.room||'';}}else if(d.type==='VM'&&d.host){const host=p.devices.find(h=>h.id===d.host);d.floor=host?.floor||p.floors.find(f=>f.site===d.site)?.id||'';d.room=host?.room||'';}else{d.floor??=p.floors.find(f=>f.site===d.site)?.id||'';d.room??='';}}
 for(const d of p.devices)if(Array.isArray(d.pendingNetworkPorts))d.pendingNetworkPorts=d.pendingNetworkPorts.filter(port=>!p.links.some(l=>l.kind!=='virtual'&&((l.a===d.id&&l.portA===port)||(l.b===d.id&&l.portB===port))));
 for(const l of p.links)if(l.wan?.backupOf&&!p.links.some(other=>other.id===l.wan.backupOf))l.wan.backupOf='';
 for(const l of p.links){l.label??=l.id;l.color??={fiber:'#6de2bd',copper:'#6d9fff',virtual:'#b79bed',power:'#f2b66b'}[l.kind];l.category??=l.kind==='fiber'?'OS2':l.kind==='copper'?'Cat 6':'';l.length??=null;l.waypoints??=[];l.routeNote??='';}
 return p;
}
export function validateExtras(p){
 const fail=s=>{throw new Error(s);},str=(v,n,max=200)=>{if(typeof v!=='string'||v.length>max)fail(n+' inválido.');},num=(v,a,b,n)=>{if(!Number.isFinite(v)||v<a||v>b)fail(n+' fora dos limites.');};
 if(p.connectionProposals!==undefined){if(!Array.isArray(p.connectionProposals)||p.connectionProposals.length>500)fail('Lista de propostas inválida.');const ids=new Set();for(const l of p.connectionProposals){if(!l||!/^[-a-zA-Z0-9_]{1,80}$/.test(l.id)||ids.has(l.id)||l.a===l.b||!p.devices.some(d=>d.id===l.a)||!p.devices.some(d=>d.id===l.b)||!['copper','fiber','power','virtual'].includes(l.kind))fail('Proposta de ligação inválida.');ids.add(l.id);str(l.portA,'Porta proposta',100);str(l.portB,'Porta proposta',100);}}
 for(const name of ['floors','rooms','templates']){if(p[name]!==undefined&&(!Array.isArray(p[name])||p[name].length>(name==='templates'?50:500)))fail('Lista inválida: '+name);const ids=new Set();for(const x of p[name]||[]){if(!/^[a-zA-Z0-9_-]{1,80}$/.test(x.id||'')||ids.has(x.id))fail('Identificador duplicado ou inválido.');ids.add(x.id);str(x.name,name);}}
 for(const f of p.floors||[]){if(!p.sites.some(s=>s.id===f.site))fail('Edifício do piso inexistente.');num(f.level,-10,150,'Nível do piso');num(f.elevation,-50,500,'Cota do piso');if(f.plan){str(f.plan.asset,'Imagem');if(!/^[a-zA-Z0-9_-]{1,80}$/.test(f.plan.asset))fail('Imagem inválida.');num(f.plan.widthMeters,.1,1000,'Largura da planta');num(f.plan.heightMeters,.1,1000,'Altura da planta');num(f.plan.x,-500,500,'Origem X');num(f.plan.z,-500,500,'Origem Z');num(f.plan.opacity,0,1,'Opacidade');}}
 for(const r of p.rooms||[]){const f=p.floors?.find(f=>f.id===r.floor);if(!f)fail('Piso da sala inexistente.');for(const k of ['x','z'])num(r[k],-500,500,'Posição da sala');for(const k of ['w','d'])num(r[k],.1,1000,'Dimensão da sala');}
 for(const d of [...p.racks,...p.devices]){if(d.floor&&!p.floors?.some(f=>f.id===d.floor&&f.site===d.site))fail('O piso deve pertencer ao edifício de '+d.name+'.');if(d.room&&!p.rooms?.some(r=>r.id===d.room&&r.floor===d.floor))fail('A sala deve pertencer ao piso de '+d.name+'.');if(d.outletLabels!==undefined){if(!d.outletLabels||typeof d.outletLabels!=='object'||Array.isArray(d.outletLabels)||Object.keys(d.outletLabels).length>96)fail('Identificação das tomadas inválida.');for(const [k,v] of Object.entries(d.outletLabels)){if(!/^OUT([1-9]|[1-8][0-9]|9[0-6])$/.test(k))fail('Número de tomada inválido.');str(v,'Etiqueta da tomada',80);}}if(d.type==='PDU')for(const l of p.links){const port=l.a===d.id?l.portA:l.b===d.id?l.portB:'';const n=port?.match(/^OUT(\d+)$/i);if(n&&Number(n[1])>(d.portCount||8))fail('A tomada '+port+' está ligada. Retire a ligação antes de reduzir a régua.');}if(d.specs!==undefined){if(!d.specs||typeof d.specs!=='object'||Array.isArray(d.specs)||Object.keys(d.specs).length>20)fail('Características inválidas.');for(const [k,v] of Object.entries(d.specs)){str(k,'Característica',40);str(v,'Valor',200);}}for(const key of ['deskWidth','deskDepth'])if(d[key]!==undefined&&(!Number.isFinite(d[key])||d[key]<.5||d[key]>4))fail('Dimensões da secretária: entre 0,5 e 4 metros.');if(d.monitors!==undefined&&![1,2].includes(d.monitors))fail('Escolha um ou dois monitores.');if(d.rotation!==undefined&&(!Number.isInteger(d.rotation)||d.rotation<0||d.rotation>=360))fail('Orientação inválida.');if(d.portLabels){if(!Array.isArray(d.portLabels)||d.portLabels.length>100)fail('Lista de portas inválida.');for(const port of d.portLabels)str(port,'Nome de porta',50);if(new Set(d.portLabels.map(x=>x.toLowerCase())).size!==d.portLabels.length)fail('Existem nomes de portas repetidos.');}}
 for(const l of p.links){if(l.label!==undefined)str(l.label,'Identificação do cabo',100);if(l.color!==undefined&&!/^#[0-9a-f]{6}$/i.test(l.color))fail('Cor de cabo inválida.');if(l.category!==undefined)str(l.category,'Categoria',100);if(l.length!==undefined&&l.length!==null)num(l.length,0,100000,'Comprimento');if(l.routeNote!==undefined)str(l.routeNote,'Percurso',1000);if(l.waypoints!==undefined){if(!Array.isArray(l.waypoints)||l.waypoints.length>50)fail('Percurso demasiado longo.');for(const w of l.waypoints){for(const k of ['x','z'])num(w[k],-1000,1000,'Ponto do percurso');num(w.y??.2,0,500,'Altura do percurso');}}}
 for(const t of p.templates||[]){if(!['sites','racks','rooms'].includes(t.type)||!t.blueprint||t.blueprint.templates?.length)fail('Modelo reutilizável inválido.');if(t.type==='rooms'&&(t.blueprint.sites?.length!==1||t.blueprint.floors?.length!==1||t.blueprint.rooms?.length!==1))fail('Modelo de sala inválido.');validate(t.blueprint);}
}

// Optional fields keep existing version-3 projects compatible.
export function validateEquipmentRecords(p){
 const fail=s=>{throw new Error(s);},obj=x=>x&&typeof x==='object'&&!Array.isArray(x),text=(x,n=200)=>typeof x==='string'&&x.length<=n,date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
 for(const d of p.devices){
 if(d.pendingNetworkPorts!==undefined&&(!Array.isArray(d.pendingNetworkPorts)||d.pendingNetworkPorts.length>100||d.pendingNetworkPorts.some(x=>typeof x!=='string'||!x||x.length>50)||new Set(d.pendingNetworkPorts).size!==d.pendingNetworkPorts.length))fail('Portas por identificar inválidas.');
 if(d.record!==undefined){const r=d.record;if(!obj(r)||Object.keys(r).some(k=>!['owner','state','serial','warranty','notes','nextMaintenance','replacementDate'].includes(k))||!['owner','state','serial'].every(k=>r[k]===undefined||text(r[k]))||(r.notes!==undefined&&!text(r.notes,2000))||['warranty','nextMaintenance','replacementDate'].some(k=>r[k]!==undefined&&(typeof r[k]!=='string'||(r[k]&&!date(r[k]))))||(r.state&&!['Em serviço','Em reserva','Em manutenção','Abatido'].includes(r.state)))fail('Ficha de equipamento inválida.');}
 for(const [key,max] of [['attachments',20],['interventions',100]])if(d[key]!==undefined){if(!Array.isArray(d[key])||d[key].length>max)fail('Limite de '+max+' registos em '+key+'.');const ids=new Set();for(const v of d[key]){if(!obj(v)||!/^[-a-zA-Z0-9_]{1,80}$/.test(v.id||'')||ids.has(v.id))fail('Registo inválido ou repetido.');ids.add(v.id);if(key==='attachments'){if(!text(v.name)||!v.name.trim()||!['image/png','image/jpeg','image/webp','application/pdf'].includes(v.type)||!Number.isInteger(v.size)||v.size<1||v.size>5000000)fail('Anexo inválido.');}else if(!date(v.date)||!text(v.title)||!v.title.trim()||!text(v.technician)||!text(v.notes,3000))fail('Intervenção inválida.');}}
 if(d.type==='Mini-switch'){if(d.portCount<2||d.portCount>16)fail('O mini-switch deve ter entre 2 e 16 portas.');if(d.uplinkPort!==undefined&&(!/^P[1-9][0-9]?$/.test(d.uplinkPort)||Number(d.uplinkPort.slice(1))>d.portCount))fail('A porta de uplink deve existir no mini-switch.');}
 if(['Mini-switch','Tomada de rede'].includes(d.type))for(const l of p.links){const port=l.a===d.id?l.portA:l.b===d.id?l.portB:null;if(!port||l.kind==='virtual'||l.kind==='power')continue;const m=port.match(d.type==='Mini-switch'?/^P(\d+)$/i:/^[FR](\d+)$/i);if(!m||Number(m[1])<1||Number(m[1])>d.portCount)fail('A porta '+port+' está ligada ou não existe. Verifique os cabos antes de reduzir as portas.');}
 }
}

// Optional organization metadata; validated in the browser and Worker alike.
export function validateOrganization(p){
 const fail=message=>{throw new Error(message);},object=value=>value&&typeof value==='object'&&!Array.isArray(value),text=(value,max)=>typeof value==='string'&&value.length<=max;
 if(p.organization!==undefined&&(!object(p.organization)||!text(p.organization.name,100)||!p.organization.name.trim()))fail('Nome da empresa inválido.');
 const units=new Map(),buildings=new Set();
 for(const site of p.sites){const b=site.branch;if(b===undefined)continue;
 if(!object(b)||!/^[A-Z]{2}$/.test(b.country)||!/^[A-Z0-9][A-Z0-9_-]{0,39}$/.test(b.unit)||!text(b.city,100)||!text(b.contact,200)||!text(b.timezone,80)||!text(b.networkDomain,80)||b.networkDomain&&!/^[A-Za-z0-9_-]+$/.test(b.networkDomain))fail('Dados da unidade inválidos em '+site.name+'.');
 try{new Intl.DateTimeFormat('pt',{timeZone:b.timezone});}catch{fail('Fuso horário inválido em '+site.name+'.');}
 const key=b.country+'/'+b.unit,old=units.get(key);if(old&&['city','timezone','networkDomain'].some(k=>old[k]!==b[k]))fail('Os edifícios da unidade '+b.unit+' devem ter a mesma cidade, fuso e domínio de rede.');units.set(key,b);
 const building=key+'|'+site.name.trim().toLocaleLowerCase('pt');if(buildings.has(building))fail('Edifício repetido na unidade '+b.unit+'.');buildings.add(building);
 }
}

export function replaceProjectContents(target,source){const copy=clone(source);for(const key of Object.keys(target))delete target[key];Object.assign(target,copy);return target;}
export function validateWAN(p){
 const fail=message=>{throw new Error(message);},devices=new Map(p.devices.map(d=>[d.id,d])),links=new Map(p.links.map(l=>[l.id,l])),pair=l=>[devices.get(l.a)?.site,devices.get(l.b)?.site].sort().join('|');
 if(p.labelNamespace!==undefined&&(typeof p.labelNamespace!=='string'||!/^[-a-zA-Z0-9_]{1,80}$/.test(p.labelNamespace)))fail('Identificação do projeto para etiquetas inválida.');
 for(const link of p.links){const wan=link.wan;if(wan===undefined)continue;
 if(!wan||typeof wan!=='object'||Array.isArray(wan)||Object.keys(wan).some(key=>!['provider','reference','service','role','backupOf','bandwidthMbps','status'].includes(key)))fail('Ficha WAN inválida.');
 if(link.kind==='power'||devices.get(link.a)?.site===devices.get(link.b)?.site)fail('O circuito WAN deve ligar equipamentos de locais diferentes.');
 for(const key of ['provider','reference'])if(typeof wan[key]!=='string'||wan[key].length>160)fail('Operador ou referência WAN inválidos.');
 if(!['Internet','MPLS','VPN','SD-WAN','Fibra dedicada','Outro'].includes(wan.service)||!['primary','backup'].includes(wan.role)||!['Planeado','Em serviço','Em manutenção','Desativado'].includes(wan.status))fail('Serviço, função ou estado WAN inválido.');
 if(wan.bandwidthMbps!==null&&(!Number.isFinite(wan.bandwidthMbps)||wan.bandwidthMbps<=0||wan.bandwidthMbps>10000000))fail('Capacidade WAN: indique Mbps positivos, até 10000000.');
 if(typeof wan.backupOf!=='string'||wan.backupOf.length>80)fail('Circuito principal inválido.');
 if(wan.backupOf){const main=links.get(wan.backupOf);if(wan.role!=='backup'||!main||main.id===link.id||main.kind==='power'||pair(main)!==pair(link)||main.wan?.role==='backup')fail('O alternativo deve apontar para um circuito principal entre os mesmos locais.');}
 }
}

// Validated in the browser and in the bundled server; old projects need no migration.
export function validatePortProfiles(p){
 const rates=[0,10,100,1000,2500,5000,10000,25000,40000,100000],vlans=new Set(p.nets.map(n=>n.id));
 const fail=message=>{throw new Error(message);};
 for(const d of p.devices){
  if(d.poeBudgetWatts!==undefined&&(!Number.isFinite(d.poeBudgetWatts)||d.poeBudgetWatts<0||d.poeBudgetWatts>100000))fail('Orçamento PoE inválido.');
  if(d.portProfiles===undefined)continue;
  if(!Array.isArray(d.portProfiles)||d.portProfiles.length>100)fail('Configurações de interfaces inválidas.');
  if(['Patch panel','Tomada de rede','PDU','UPS','VM'].includes(d.type)&&d.portProfiles.length)fail('Configure interfaces apenas em equipamentos ativos de rede.');
  const used=p.links.filter(l=>!['power','virtual'].includes(l.kind)&&(l.a===d.id||l.b===d.id)).map(l=>l.a===d.id?l.portA:l.portB);
  const basic=d.portLabels?.length?d.portLabels:Array.from({length:['Computador','Posto de trabalho','Portátil','Telefone IP','Impressora','Câmara','Internet'].includes(d.type)?1:d.portCount||1},(_,i)=>d.type==='Switch'?'Gi1/0/'+(i+1):['Computador','Posto de trabalho','Portátil','Telefone IP','Impressora','Câmara'].includes(d.type)?'Ethernet'+(i+1):'P'+(i+1));
  const known=new Set([...used,...basic].map(x=>String(x).toLowerCase())),seen=new Set();
  for(const c of d.portProfiles){
   if(!c||typeof c!=='object'||Array.isArray(c)||Object.keys(c).some(k=>!['port','adminUp','medium','maxSpeed','supportedSpeeds','speed','duplex','mode','accessVlan','nativeVlan','allowedVlans','poe','poeWatts','description'].includes(k)))fail('Configuração de interface inválida.');
   if(typeof c.port!=='string'||!c.port||c.port.length>50||!known.has(c.port.toLowerCase())||seen.has(c.port.toLowerCase())||/^(PSU[0-9]+|IN|OUT[0-9]+)$/i.test(c.port))fail('Porta de interface inexistente ou repetida.');seen.add(c.port.toLowerCase());
   if(typeof c.adminUp!=='boolean'||!['auto','copper','fiber'].includes(c.medium)||!rates.includes(c.maxSpeed)||!rates.includes(c.speed)||!['auto','full','half'].includes(c.duplex)||!['auto','access','trunk','routed'].includes(c.mode))fail('Estado, meio físico ou velocidade de interface inválidos.');
   if(c.supportedSpeeds!==undefined&&(!Array.isArray(c.supportedSpeeds)||c.supportedSpeeds.length>rates.length-1||new Set(c.supportedSpeeds).size!==c.supportedSpeeds.length||c.supportedSpeeds.some(n=>!rates.includes(n)||n===0||(c.maxSpeed&&n>c.maxSpeed))||(c.speed&&c.supportedSpeeds.length&&!c.supportedSpeeds.includes(c.speed))))fail('Velocidades suportadas inválidas ou incompatíveis com a interface.');
   if(c.speed&&c.maxSpeed&&c.speed>c.maxSpeed)fail('A velocidade fixa excede a capacidade da interface.');
   if(c.duplex==='half'&&c.speed>=1000)fail('Half duplex só é suportado a 10 ou 100 Mbps.');
   for(const key of ['accessVlan','nativeVlan'])if(!Number.isInteger(c[key])||(c[key]!==0&&!vlans.has(c[key])))fail('VLAN de interface inexistente.');
   if(!Array.isArray(c.allowedVlans)||c.allowedVlans.length>4094||new Set(c.allowedVlans).size!==c.allowedVlans.length||c.allowedVlans.some(v=>!vlans.has(v)))fail('Lista de VLANs permitidas inválida.');
   if(c.mode==='access'&&!c.accessVlan)fail('Escolha a VLAN da porta access.');
   if(c.mode==='trunk'&&(!c.allowedVlans.length||(c.nativeVlan&&!c.allowedVlans.includes(c.nativeVlan))))fail('O trunk precisa de VLANs permitidas e deve incluir a VLAN nativa.');
   if(!['unknown','off','pse','pd'].includes(c.poe)||!Number.isFinite(c.poeWatts)||c.poeWatts<0||c.poeWatts>200||(c.poe==='pse'||c.poe==='pd')&&c.poeWatts<=0)fail('Configuração de potência PoE inválida.');
   if(typeof c.description!=='string'||c.description.length>200)fail('Descrição de interface inválida.');
  }
 }
 for(const l of p.links)if(l.installation!==undefined&&!['unknown','patch','permanent'].includes(l.installation))fail('Tipo de instalação do cabo inválido.');
}
