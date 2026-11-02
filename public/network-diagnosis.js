import {networkFor} from './model.js';
import {portInUse,passive,traceNetwork,inSubnet} from './network.js';
import {physicalContext,assessCircuit} from './physical-network.js';
import {upstreamCircuit} from './workstations.js';
const nextSteps={
 'admin-down':'Confirme se a porta deve estar ativa. Se sim, ative apenas esta interface e volte a verificar.',
 'medium':'Confirme o conector e o meio das duas interfaces. Use um cabo compatível ou documente o adaptador ativo existente.',
 'mixed-medium':'Identifique o conversor ativo entre cobre e fibra; um painel passivo não faz essa conversão.',
 'speed-mismatch':'Compare as velocidades configuradas nas duas pontas e documente uma combinação suportada por ambas.',
 'no-common-speed':'Confirme as velocidades suportadas nas duas interfaces e a capacidade dos cabos; não presuma velocidades intermédias.',
 'duplex-mismatch':'Compare o duplex nas duas interfaces e corrija a configuração documentada conforme os equipamentos.',
 'native-vlan':'Compare a VLAN nativa das duas portas trunk e confirme o valor pretendido.',
 'no-common-vlan':'Reveja as VLANs permitidas nas duas pontas do trunk.',
 'endpoint-vlan':'Compare a VLAN access da porta do switch com a VLAN atribuída ao terminal.',
 'endpoint-trunk-vlan':'Confirme se a VLAN do terminal está permitida no trunk.',
 'access-trunk':'Confirme se o terminal usa tráfego sem etiqueta e se corresponde à VLAN nativa permitida.',
 'channel-length':'Meça o canal completo e reveja o percurso ou a solução física antes de o considerar compatível.',
 'permanent-length':'Confirme a medição desta ligação permanente e reveja a instalação.',
 'poe-off':'Confirme a alimentação do dispositivo e o estado PoE da porta de origem.',
 'poe-power':'Compare a potência pedida pelo dispositivo com a potência útil disponível na origem.',
 'unknown-length':'Meça e registe o comprimento de cada cabo do circuito.',
 'unknown-interface':'Registe as capacidades confirmadas na ficha da interface.',
 'unknown-medium':'Confirme se a interface utiliza cobre ou fibra e registe o meio físico.',
 'unknown-rates':'Consulte as capacidades das interfaces e registe as velocidades suportadas.',
 'unknown-mode':'Registe se esta porta é access, trunk ou uma interface encaminhada.',
 'fiber-optics':'Confirme transceivers, fibra, comprimento de onda e orçamento ótico no equipamento real.'
};
export function diagnoseNetwork(p,deviceId){
 const device=p.devices.find(d=>d.id===deviceId);if(!device)throw Error('Selecione um equipamento existente para diagnosticar.');
 const context=physicalContext(p),seeds=p.links.filter(l=>['copper','fiber'].includes(l.kind)&&(l.a===deviceId||l.b===deviceId)),findings=[],seen=new Set(),linkIds=new Set(),deviceIds=new Set([deviceId]);
 const add=(code,kind,evidence,next,target,port='')=>{const key=code+'|'+target.type+'|'+target.id+'|'+port+'|'+evidence;if(seen.has(key))return;seen.add(key);findings.push({code,kind,evidence,next,target,port});};
 if(!seeds.length){
  const virtual=p.links.some(l=>l.kind==='virtual'&&(l.a===deviceId||l.b===deviceId));
  if(virtual||device.type==='VM')add('virtual-path','confirm','A ligação deste equipamento é virtual ou Wi-Fi; não há um circuito Ethernet físico para seguir.','Confirme a associação Wi-Fi ou a interface virtual, o anfitrião e a VLAN correspondente.',{type:'devices',id:deviceId});
  else add('no-data-cable','gap',device.name+': não existe um cabo de dados registado.','Identifique a porta e o destino reais. Depois documente o cabo ou peça ao agente uma ligação pela tomada mais próxima.',{type:'devices',id:deviceId});
 }
 for(const seed of seeds){const upstream=upstreamCircuit(p,seed.id);upstream.links.forEach(id=>linkIds.add(id));upstream.devices.forEach(id=>deviceIds.add(id));}
 const segmentSeen=new Set();
 for(const id of linkIds){if(segmentSeen.has(id))continue;const result=assessCircuit(p,id,context);result.links.forEach(id=>segmentSeen.add(id));
  for(const linkId of result.links){const l=context.links.get(linkId);for(const [id,port] of [[l.a,l.portA],[l.b,l.portB]]){const d=context.devices.get(id);if(!passive(d))continue;const m=port.match(/^([FR])(\d+)$/i);if(!m)continue;const mate=(m[1].toUpperCase()==='F'?'R':'F')+m[2];if(!portInUse(p,id,mate))add('missing-channel','gap',d.name+' / '+port+': falta registar a continuação '+mate+'.',d.type==='Tomada de rede'?(mate.startsWith('R')?'Identifique o cabo da traseira desta saída até ao canal correspondente do patch panel.':'Identifique o patch da frente desta saída até ao terminal.'):mate.startsWith('F')?'Identifique o patch da frente deste canal até à porta correta do switch.':'Identifique o cabo permanente deste canal até à tomada correspondente.',{type:'devices',id},mate);}}
  for(const issue of result.issues){if(issue.code==='incomplete')continue;
   let endpoint=result.endpoints.find(e=>issue.message.startsWith(e.device.name+' / '+e.port+':'));
   if(!endpoint&&['endpoint-vlan','endpoint-trunk-vlan','access-trunk'].includes(issue.code))endpoint=result.endpoints.find(e=>['access','trunk'].includes(e.profile.mode));
   const target=endpoint?{type:'devices',id:endpoint.device.id}:{type:'links',id};
   add(issue.code,issue.severity==='erro'?'fault':'confirm',issue.message,nextSteps[issue.code]||(issue.severity==='erro'?'Compare as configurações e o material das duas pontas e corrija a incompatibilidade documentada.':'Confirme esta informação na instalação e atualize o registo.'),target,endpoint?.port||'');
  }
 }
 for(const id of deviceIds){const d=context.devices.get(id);if(!d)continue;
  if(d.type==='Mini-switch'){const uplink=d.uplinkPort||'P1';if(!portInUse(p,id,uplink))add('missing-uplink','gap',d.name+' / '+uplink+': a ligação principal do mini-switch não está registada.','Identifique a ligação desta porta à tomada ou ao switch da instalação.',{type:'devices',id},uplink);}
 }
 const network=networkFor(p,device.vlan,device);
 if(device.ip&&network?.subnet&&!inSubnet(device.ip,network.subnet))add('ip-subnet','fault',device.name+': o IP documentado está fora da sub-rede da VLAN desta unidade.','Confirme o plano de endereçamento e o endereço real antes de corrigir a ficha.',{type:'devices',id:deviceId});
 if(device.gateway&&network?.subnet&&!inSubnet(device.gateway,network.subnet))add('gateway-subnet','fault',device.name+': o gateway documentado está fora da sub-rede da VLAN desta unidade.','Confirme o gateway correto para esta rede e unidade.',{type:'devices',id:deviceId});
 const shadow={...p,links:p.links.filter(l=>linkIds.has(l.id))},switches=p.devices.filter(d=>deviceIds.has(d.id)&&d.type==='Switch'&&d.id!==deviceId);let path=[deviceId],reachedSwitch=device.type==='Switch';
 for(const sw of switches){const trace=traceNetwork(shadow,deviceId,sw.id);if(trace.devices.length){path=trace.devices;reachedSwitch=true;break;}}
 if(!reachedSwitch&&seeds.length&&!findings.some(f=>f.kind==='gap'))add('no-switch-route','confirm','O percurso termina noutro equipamento ativo; não encontrei um switch neste circuito.','Confirme se esta ligação direta é o desenho pretendido e verifique a configuração das duas pontas.',{type:'devices',id:deviceId});
 if(reachedSwitch&&!findings.some(f=>f.kind==='fault'||f.kind==='gap'))add('on-site-check','confirm','O percurso até ao switch está registado, mas não foi testada a comunicação real.','No equipamento, confirme o estado da ligação, o endereço, gateway e DNS atribuídos e a comunicação com o gateway. Para Internet, confirme também as rotas e políticas do firewall.',{type:'devices',id:deviceId});
 findings.sort((a,b)=>({fault:0,gap:1,confirm:2}[a.kind])-({fault:0,gap:1,confirm:2}[b.kind]));
 const faults=findings.filter(f=>f.kind==='fault').length,gaps=findings.filter(f=>f.kind==='gap').length,status=faults?'fault':gaps?'gap':'unconfirmed';
 const conclusion=faults?'Há '+faults+' incompatibilidade(s) documentada(s) que precisam de revisão.':gaps?'Falta documentação para seguir o percurso completo.':'Não encontrei bloqueios nas verificações disponíveis; isso não confirma que o equipamento tenha rede.';
 return {device:deviceId,name:device.name,status,conclusion,reachedSwitch,path,links:[...linkIds],findings,limit:'Diagnóstico dos registos. DHCP, DNS, routing, firewall, negociação e acesso à Internet precisam de confirmação no equipamento real.'};
}
export function diagnosisReply(diagnosis){
 const first=diagnosis.findings.slice(0,3);return 'Diagnóstico de '+diagnosis.name+': '+diagnosis.conclusion+'\n'+first.map(f=>'• '+f.evidence+'\n  Próximo passo: '+f.next).join('\n')+'\n'+diagnosis.limit;
}

const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function diagnosisAnswer(project,state,prompt){
 const text=norm(prompt).replace(/[?!.]+$/,'');
 const match=text.match(/^(?:porque(?: e que)?|por que(?: e que)?) (.+?) (?:nao tem (?:rede|internet)|esta sem rede|nao se liga a rede)$/)||text.match(/^(?:diagnostica|diagnosticar) (.+?)(?: na rede)?$/);
 if(!match)return null;const subject=match[1].replace(/^["“]|["”]$/g,'').replace(/^(?:o |a )/,'');let device;
 if(/^(?:este )?(?:pc|posto|equipamento)(?: selecionado)?$/.test(subject))device=state.selected?.type==='devices'?project.devices.find(d=>d.id===state.selected.id):null;
 else{const matches=project.devices.filter(d=>norm(d.name)===subject);if(matches.length===1)device=matches[0];}
 if(!device)return {source:'diagnosis',mode:'advice',reply:'Seleciona um equipamento no mapa ou indica um nome exato e único entre aspas para o diagnosticar.',actions:[],sources:[]};
 const diagnosis=diagnoseNetwork(project,device.id);
 return {source:'diagnosis',mode:'advice',reply:diagnosisReply(diagnosis),diagnosis,actions:[],sources:[]};
}
