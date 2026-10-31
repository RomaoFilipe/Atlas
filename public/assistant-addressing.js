import {ipv4,networkFor,setNetworkPlan} from './model.js';
const computers=new Set(['Computador','Portátil','Posto de trabalho']);
const excluded=new Set(['Tomada de rede','Patch panel','PDU','UPS','Mini-switch']);
const ipNumber=ip=>ip.split('.').reduce((n,part)=>n*256+Number(part),0);
const ipText=n=>[24,16,8,0].map(shift=>(n>>>shift)&255).join('.');
const domain=(p,site)=>String(p.sites.find(s=>s.id===site)?.branch?.networkDomain||'').toLowerCase();
export function subnetRange(value){
 const parts=String(value).split('/');if(parts.length!==2||!ipv4(parts[0])||!/^\d{1,2}$/.test(parts[1]))throw Error('Indica uma sub-rede IPv4/prefixo válida.');
 const prefix=Number(parts[1]);if(prefix>30)throw Error('A sub-rede precisa de endereços utilizáveis para gateway e equipamentos (prefixo até /30).');
 const size=2**(32-prefix),base=Math.floor(ipNumber(parts[0])/size)*size;
 if(base!==ipNumber(parts[0]))throw Error('Indica o endereço da rede: '+ipText(base)+'/'+prefix+'.');
 return {base,first:base+1,last:base+size-2,subnet:ipText(base)+'/'+prefix};
}
export function explicitAddress(value,range){
 const raw=String(value||'');let number;if(/^\.\d{1,3}$/.test(raw)){if(Number(raw.slice(1))>255)throw Error('O último octeto deve estar entre 0 e 255.');number=range.base+Number(raw.slice(1));}else if(ipv4(raw))number=ipNumber(raw);else throw Error('Indica um endereço IPv4 válido.');
 if(number<range.first||number>range.last)throw Error('O endereço deve pertencer à sub-rede e não pode ser o endereço de rede ou broadcast.');return ipText(number);
}
// Allocate first, then apply. No partial assignment or model-generated network values.
export function assignRoomAddresses(p,room,request){
 const range=subnetRange(request.subnet),gateway=explicitAddress(request.gateway,range),first=request.first?ipNumber(explicitAddress(request.first,range)):range.first;
 const site=p.floors.find(f=>f.id===room.floor)?.site,addressDomain=domain(p,site);
 const targets=p.devices.filter(d=>d.room===room.id&&d.record?.state!=='Abatido'&&(request.scope==='equipment'?!excluded.has(d.type):computers.has(d.type))).sort((a,b)=>a.name.localeCompare(b.name,'pt',{numeric:true})||a.id.localeCompare(b.id));
 if(!targets.length)throw Error('Não há equipamentos deste tipo na sala.');if(targets.length>100)throw Error('Máximo de 100 equipamentos por lote de endereçamento.');
 const network=request.vlan===undefined?null:networkFor(p,request.vlan,site);if(request.vlan!==undefined&&!network)throw Error('A VLAN indicada não existe.');
 const compatible=n=>{if(n?.subnet&&subnetRange(n.subnet).subnet!==range.subnet)throw Error('A VLAN tem uma sub-rede diferente. Revê o plano de endereçamento antes de aplicar.');if(n?.gateway&&n.gateway!==gateway)throw Error('A VLAN tem outro gateway. Revê o plano de endereçamento antes de aplicar.');};
 compatible(network);
 const sameDomain=p.devices.filter(d=>domain(p,d.site)===addressDomain),gatewayOwners=sameDomain.filter(d=>d.ip===gateway);
 if(gatewayOwners.some(d=>!['Firewall','Internet','Switch'].includes(d.type)))throw Error('O gateway indicado já está atribuído a um equipamento que não é de encaminhamento.');
 const used=new Set(sameDomain.filter(d=>d.ip).map(d=>ipNumber(d.ip)));used.add(ipNumber(gateway));for(const entry of p.nets){const n=networkFor(p,entry.id,site);if(n.gateway&&ipv4(n.gateway))used.add(ipNumber(n.gateway));}
 const assignments=[];let next=first,allocated=0,preserved=0;
 for(const d of targets){compatible(network||networkFor(p,d.vlan,d));if(d.gateway&&d.gateway!==gateway)throw Error('Um equipamento tem outro gateway: '+d.name+'.');
  let ip=d.ip;if(ip){explicitAddress(ip,range);if(ip===gateway)throw Error('O IP de '+d.name+' coincide com o gateway reservado.');preserved++;}
  else {while(next<=range.last&&used.has(next))next++;if(next>range.last)throw Error('A sub-rede não tem endereços livres suficientes. Nada foi atribuído.');ip=ipText(next);used.add(next++);allocated++;}
  assignments.push({device:d,ip});
 }
 for(const {device,ip} of assignments){device.ip=ip;device.gateway=gateway;if(network)device.vlan=network.id;}
 if(network){setNetworkPlan(p,network.id,site,{subnet:range.subnet,gateway});}
 return {allocated,preserved,total:targets.length,subnet:range.subnet,gateway,text:'Endereçamento documentado em '+room.name+': '+allocated+' IP(s) atribuído(s), '+preserved+' preservado(s); gateway '+gateway+' reservado na rede '+range.subnet+'.'};
}
