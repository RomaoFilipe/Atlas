// Documented capabilities only: unknown hardware must never be reported as tested.
const passive=d=>d&&['Patch panel','Tomada de rede'].includes(d.type);
export const ethernetRates=[10,100,1000,2500,5000,10000,25000,40000,100000];
export const formatRate=n=>n>=1000?(n/1000)+' Gbps':n+' Mbps';
export function interfaceProfile(d,port){
 const saved=d?.portProfiles?.find(x=>x.port.toLowerCase()===String(port).toLowerCase());
 return {port,adminUp:true,medium:'auto',maxSpeed:0,supportedSpeeds:[],speed:0,duplex:'auto',mode:'auto',accessVlan:0,nativeVlan:0,allowedVlans:[],poe:'unknown',poeWatts:0,description:'',...saved,documented:!!saved};
}
export function physicalContext(p){
 const devices=new Map(p.devices.map(d=>[d.id,d])),ports=new Map(),links=new Map(p.links.map(l=>[l.id,l]));
 for(const l of p.links)if(['copper','fiber'].includes(l.kind))for(const [id,port] of [[l.a,l.portA],[l.b,l.portB]])ports.set(id+'|'+String(port).toLowerCase(),l);
 return {devices,ports,links};
}
export function assessCircuit(p,linkOrId,context=physicalContext(p)){
 const seed=typeof linkOrId==='string'?context.links.get(linkOrId):linkOrId;
 if(!seed||!['copper','fiber'].includes(seed.kind))return {status:'not-applicable',issues:[],links:[],endpoints:[],speed:null,length:null};
 const seen=new Set(),queue=[seed],links=[],ends=new Map(),issues=[];
 const add=(severity,code,message)=>{if(!issues.some(i=>i.code===code&&i.message===message))issues.push({severity,code,message});};
 let incomplete=false;
 while(queue.length){const l=queue.pop();if(seen.has(l.id))continue;seen.add(l.id);links.push(l);
  for(const [id,port] of [[l.a,l.portA],[l.b,l.portB]]){
   const d=context.devices.get(id);if(!d){incomplete=true;continue;}
   if(passive(d)){
    const channel=String(port).match(/^([FR])(\d+)$/i),mate=channel&&context.ports.get(id+'|'+(channel[1].toUpperCase()==='F'?'r':'f')+channel[2]);
    if(mate)queue.push(mate);else incomplete=true;
   }else ends.set(id+'|'+port,{device:d,port,profile:interfaceProfile(d,port)});
  }
 }
 const endpoints=[...ends.values()],complete=!incomplete&&endpoints.length===2;
 if(!complete)add('aviso','incomplete','Percurso incompleto: identifique as duas interfaces ativas e a continuação dos canais F/R.');
 const kinds=new Set(links.map(l=>l.kind));if(kinds.size>1)add('erro','mixed-medium','Cobre e fibra não podem atravessar o mesmo canal passivo sem um conversor ativo.');
 const lengthsKnown=links.every(l=>typeof l.length==='number'&&Number.isFinite(l.length)),length=lengthsKnown?links.reduce((n,l)=>n+l.length,0):null;
 if(!lengthsKnown)add('aviso','unknown-length','Falta medir o comprimento de um ou mais cabos do circuito.');
 const measured=links.reduce((sum,l)=>sum+(typeof l.length==='number'?l.length:0),0);
 if(kinds.has('copper')&&measured>100)add('erro','channel-length','Os troços medidos do canal de cobre somam '+measured.toFixed(1)+' m; excede os 100 m de referência.');
 for(const l of links)if(l.kind==='copper'&&l.installation==='permanent'&&l.length>90)add('erro','permanent-length',(l.label||l.id)+': ligação permanente superior a 90 m.');
 for(const end of endpoints){const c=end.profile,name=end.device.name+' / '+end.port;
  if(!c.documented)add('aviso','unknown-interface',name+': capacidades e configuração da interface por documentar.');
  if(c.medium==='auto')add('aviso','unknown-medium',name+': meio físico da interface por confirmar.');
  if(c.mode==='routed')add('aviso','routing-unverified',name+': o encaminhamento, as ACLs e as rotas de camada 3 ainda precisam de verificação.');
  if(c.mode==='auto'&&['Switch','Mini-switch','Firewall'].includes(end.device.type))add('aviso','unknown-mode',name+': modo access/trunk/encaminhado por documentar.');
  if(!c.adminUp)add('erro','admin-down',name+': interface administrativamente desativada.');
  if(c.medium!=='auto'&&[...kinds].some(k=>k!==c.medium))add('erro','medium',name+': meio físico incompatível com o cabo.');
 }
 if(kinds.has('fiber'))add('aviso','fiber-optics','Confirme os transceivers das duas pontas, comprimento de onda, tipo de fibra e orçamento ótico; estes dados ainda não são verificados pelo modelo.');
 const configuredRates=endpoints.map(e=>e.profile.speed||e.profile.maxSpeed).filter(Boolean);
 const claimed=links.map(l=>parseRate(l.speed)).filter(Boolean);
 const ceiling=Math.min(...configuredRates,...claimed,...(endpoints.some(e=>e.profile.duplex==='half')?[100]:[]));
 const capabilities=endpoints.map(e=>e.profile.speed?[e.profile.speed]:e.profile.supportedSpeeds?.length?e.profile.supportedSpeeds:null);
 const common=ethernetRates.filter(n=>n<=ceiling&&capabilities.every(list=>list?.includes(n)));
 let speed=complete&&capabilities.every(Boolean)?common.at(-1)||null:null;
 if(complete&&capabilities.every(Boolean)&&!common.length)add('erro','no-common-speed','Não existe uma velocidade comum entre as interfaces e a capacidade documentada dos cabos.');
 if(endpoints.some(e=>!e.profile.speed&&!e.profile.supportedSpeeds?.length))add('aviso','unknown-rates','Faltam as velocidades suportadas por uma interface; a capacidade máxima, por si só, não confirma a negociação.');
 if(configuredRates.length&&claimed.some(n=>n>Math.min(...configuredRates)))add('aviso','claimed-speed','A velocidade indicada no cabo excede a capacidade documentada de uma das interfaces.');
 const fixed=endpoints.map(e=>e.profile.speed).filter(Boolean);
 if(new Set(fixed).size>1)add('erro','speed-mismatch','As interfaces têm velocidades fixas diferentes.');
 for(const end of endpoints)if(end.profile.maxSpeed&&fixed.some(n=>n>end.profile.maxSpeed))add('erro','speed-capacity','A velocidade fixa excede a capacidade documentada de '+end.device.name+' / '+end.port+'.');
 if(fixed.length&&speed&&fixed.some(n=>n!==speed))add('erro','speed-cable','A velocidade fixa não é suportada pela capacidade documentada do circuito.');
 const duplex=endpoints.map(e=>e.profile.duplex).filter(v=>v!=='auto');
 if(new Set(duplex).size>1)add('erro','duplex-mismatch','Duplex incompatível: uma interface está em half e a outra em full.');
 if(duplex.includes('half')&&speed>=1000)add('erro','half-gigabit','Half duplex não é válido para Gigabit Ethernet ou superior.');
 if(endpoints.some(e=>e.profile.duplex==='auto')&&duplex.length&&speed&&speed<=100)add('aviso','duplex-auto','Duplex automático numa ponta e manual na outra: confirme a negociação para evitar duplex mismatch.');
 if(speed)for(const l of links)if(l.kind==='copper'){
  const cat=String(l.category||'').replace(/[\s_-]/g,'').toLowerCase();
  if(!['cat5e','cat6','cat6a','cat7','cat7a','cat8'].includes(cat))add('aviso','category','Categoria do cobre por confirmar para '+formatRate(speed)+'.');
  else if(speed>=10000&&!['cat6a','cat7','cat7a','cat8'].includes(cat))add('aviso','10g-category','Para 10 Gbps a 100 m, use Cat 6A ou superior; Cat 6 exige confirmação da distância e certificação.');
  if(speed>10000)add('aviso','high-speed-copper','Acima de 10 Gbps, confirme transceivers, categoria e distância no fabricante; o limite genérico de 100 m não garante suporte.');
 }
 if(complete){const [a,b]=endpoints.map(e=>e.profile);
  if(a.mode==='trunk'&&b.mode==='trunk'){
   if(a.nativeVlan!==b.nativeVlan)add('erro','native-vlan','VLAN nativa diferente nas duas portas trunk.');
   const onlyA=a.allowedVlans.filter(v=>!b.allowedVlans.includes(v)),onlyB=b.allowedVlans.filter(v=>!a.allowedVlans.includes(v));
   if(onlyA.length||onlyB.length)add('aviso','allowed-vlans','Listas de VLANs permitidas diferentes nas duas portas trunk.');
   if(!a.allowedVlans.some(v=>b.allowedVlans.includes(v)))add('erro','no-common-vlan','Os trunks não têm VLANs permitidas em comum.');
  }
  if(a.mode==='access'&&b.mode==='access'&&a.accessVlan!==b.accessVlan)add('aviso','access-vlan','As portas access atribuem VLANs locais diferentes; confirme se esta tradução é intencional.');
  for(const [x,y] of [[a,b],[b,a]])if(x.mode==='access'&&y.mode==='trunk'&&(y.nativeVlan!==x.accessVlan||!y.allowedVlans.includes(x.accessVlan)))add('erro','access-trunk','A porta access não corresponde à VLAN nativa permitida no trunk.');
  for(const e of endpoints){const peer=endpoints.find(x=>x!==e),c=e.profile,terminal=['Computador','Posto de trabalho','Portátil','Telefone IP','Wi-Fi','Câmara','Impressora','Servidor','Armazenamento'].includes(peer.device.type);
   if(c.mode==='access'&&peer.profile.mode==='auto'&&terminal&&peer.device.vlan&&peer.device.vlan!==c.accessVlan)add('erro','endpoint-vlan','A VLAN access não corresponde à VLAN documentada de '+peer.device.name+'.');
   if(c.mode==='trunk'&&peer.profile.mode==='auto'&&terminal&&peer.device.vlan&&!c.allowedVlans.includes(peer.device.vlan))add('erro','endpoint-trunk-vlan','O trunk não permite a VLAN documentada de '+peer.device.name+'.');
   for(const l of links)if(l.vlans?.length){const expected=c.mode==='access'?[c.accessVlan]:c.mode==='trunk'?c.allowedVlans:[];if(expected.some(v=>!l.vlans.includes(v)))add('aviso','cable-vlans','As VLANs documentadas no cabo '+(l.label||l.id)+' não incluem todas as VLANs da interface.');}
   if(c.poe==='pd'){
    if(!kinds.has('copper')||kinds.has('fiber'))add('erro','poe-medium','PoE requer um percurso de cobre.');
    if(peer.profile.poe==='off')add('erro','poe-off','PoE desativado na interface que alimenta '+e.device.name+'.');
    else if(peer.profile.poe!=='pse')add('aviso','poe-unknown','Fonte PoE por documentar para '+e.device.name+'.');
    else {if(c.poeWatts>peer.profile.poeWatts)add('erro','poe-power','Potência PoE pedida por '+e.device.name+' excede a potência disponível na porta de origem.');add('aviso','poe-standard','Confirme a norma e classe PoE negociada e a potência útil no PD, incluindo perdas no cabo.');}
   }
  }
 }
 if(issues.some(i=>i.severity==='erro'))speed=null;
 const status=issues.some(i=>i.severity==='erro')?'blocked':issues.length?'review':'compatible';
 return {status,issues,links:links.map(l=>l.id),endpoints,speed,length,complete};
}
export function parseRate(value){const m=String(value||'').replace(',','.').match(/^(\d+(?:\.\d+)?)\s*([MGT])(?:bps|bit\/s|b\/s)\b/i);return m?Number(m[1])*({M:1,G:1000,T:1000000}[m[2].toUpperCase()]):null;}
export function auditPhysicalNetwork(p){
 const issues=[],context=physicalContext(p),seen=new Set(),poeLoads=new Map();
 for(const l of p.links){if(seen.has(l.id)||!['copper','fiber'].includes(l.kind))continue;const result=assessCircuit(p,l,context);result.links.forEach(id=>seen.add(id));
  for(const i of result.issues)issues.push({...i,type:'links',id:l.id,message:(l.label||l.id)+': '+i.message});
  if(result.complete)for(const e of result.endpoints)if(e.profile.poe==='pse'){const consumer=result.endpoints.find(x=>x!==e&&x.profile.poe==='pd');if(consumer)poeLoads.set(e.device.id,(poeLoads.get(e.device.id)||0)+e.profile.poeWatts);}
 }
 for(const [id,watts] of poeLoads){const d=context.devices.get(id);if(typeof d.poeBudgetWatts==='number'&&watts>d.poeBudgetWatts)issues.push({severity:'aviso',code:'poe-budget',type:'devices',id,message:d.name+': reserva máxima das portas PoE ligadas de '+watts+' W excede o orçamento de '+d.poeBudgetWatts+' W.'});}
 return issues;
}
