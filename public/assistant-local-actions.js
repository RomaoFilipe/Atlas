import {parseBranchRequest,branchExample} from './assistant-branch-request.js';
import {parseOfficeRequest,officeExample} from './assistant-office.js';
import {validateAssistantActions,validateAssistantIntent} from './assistant-protocol.js';
import {assistantRequestMode} from './assistant-intent.js';
import {quickConfiguration} from './assistant-fast-actions.js';
const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const unquote=value=>value.trim().replace(/^["“]|["”]$/g,'');
const deviceTypes={'computador':'Computador','computadores':'Computador','portatil':'Portátil','portateis':'Portátil','impressora':'Impressora','impressoras':'Impressora','telefone ip':'Telefone IP','telefones ip':'Telefone IP','tomada de rede':'Tomada de rede','tomadas de rede':'Tomada de rede','switch':'Switch','switches':'Switch','mini-switch':'Mini-switch','mini-switches':'Mini-switch','servidor':'Servidor','servidores':'Servidor','patch panel':'Patch panel','patch panels':'Patch panel','pdu':'PDU','pdus':'PDU','ups':'UPS','firewall':'Firewall','firewalls':'Firewall','wi-fi':'Wi-Fi','camara':'Câmara','camaras':'Câmara','armazenamento':'Armazenamento','posto de trabalho':'Posto de trabalho','postos de trabalho':'Posto de trabalho'};
export const configurationCommands=[
 {label:'Corrigir ligações em falta',prompt:'Revê esta sala e completa as ligações que faltam, usando as portas livres.'},
 {label:'Atribuir IPs sem conflitos',prompt:'Usa a rede 192.168.10.0/24, reserva o gateway .1 e atribui IPs aos computadores sem repetir endereços.'},
 {label:'Preparar filial por etapas',prompt:branchExample},
 {label:'Preparar escritório para 20 pessoas',prompt:officeExample},
 {label:'Equipar uma sala completa',prompt:'Equipa a sala atual com 4 postos de trabalho, 4 telefones IP, 1 impressora e 4 tomadas de rede.'},
 {label:'Atribuir VLAN à sala',prompt:'Atribui a VLAN 30 a todos os equipamentos da sala atual.'},
 {label:'Montar equipamentos da sala',prompt:'Instala os equipamentos livres da sala atual no bastidor "RACK-01".'},
 {label:'Alimentar bastidor',prompt:'Alimenta os equipamentos ativos do bastidor "RACK-01" usando a PDU "PDU-01".'},
 {label:'Guardar modelo de sala',prompt:'Guarda a sala atual como modelo chamado "Escritório padrão".'},
 {label:'Duplicar sala',prompt:'Duplica a sala atual com o nome "Novo escritório".'},
 {label:'Aplicar modelo de sala',prompt:'Aplica o modelo "Escritório padrão" no piso atual com o nome "Novo escritório".'},
 {label:'Criar estrutura completa',prompt:'Cria um edifício chamado "Sede" com um piso chamado "Piso 0" e uma sala chamada "Escritório" de 10 por 8 metros.'},
 {label:'Inserir um switch de 24 portas',prompt:'Adiciona 1 switch chamado "SW-01" com 24 portas na sala atual.'},
 {label:'Criar bastidor',prompt:'Cria um bastidor chamado "RACK-01" de 24 U na sala atual.'},
 {label:'Preencher responsável',prompt:'Define o responsável do equipamento selecionado como "Equipa TI".'},
 {label:'Agendar revisão',prompt:'Agenda a próxima revisão do equipamento selecionado para 2026-12-01.'},
 {label:'Configurar IP documental',prompt:'Define o IP do equipamento selecionado como 192.0.2.10.'},
 {label:'Registar intervenção',prompt:'Regista uma intervenção no equipamento selecionado com o título "Revisão preventiva" na data 2026-10-29.'},
 {label:'Criar máquina virtual',prompt:'Cria uma VM chamada "VM-01" no servidor selecionado.'},
 {label:'Montar no bastidor',prompt:'Instala o equipamento selecionado no bastidor "RACK-01" na U 4.'},
 {label:'Ligar alimentação',prompt:'Liga a alimentação do equipamento selecionado à PDU "PDU-01" na tomada 1.'}
];
function splitCommands(text){const parts=[];let quoted=false,start=0;for(let i=0;i<text.length;i++){if(text[i]==='"'||text[i]==='“'||text[i]==='”')quoted=!quoted;if(text[i]===';'&&!quoted){parts.push(text.slice(start,i).trim());start=i+1;}}if(quoted)throw Error('Fecha as aspas do pedido antes de o enviar.');parts.push(text.slice(start).trim());return parts;}
// Exact supported requests. An unknown step never executes the other steps in a batch.
export function localConfiguration(prompt,snapshot){
 if(assistantRequestMode('configure',prompt)!=='configure')return null;
 const branch=parseBranchRequest(prompt);if(branch)return {reply:'',actions:[],task:branch,mode:'configure',source:'local-task',sources:[]};
 const {project,context,refs}=snapshot,createdTargets=[];
 function resolve(group,value){
  const raw=unquote(value.trim().replace(/^(?:equipamento|servidor|switch|bastidor|edif[ií]cio|piso|sala|PDU)\s+("[^"]+")$/iu,'$1')),text=norm(raw),selected=refs.get(context.selection),item=selected&&project[selected.type]?.find(x=>x.id===selected.id);let id;
  if(/^(?:o )?(?:equipamento|servidor|bastidor|edificio|piso|sala) selecionad[oa]$/.test(text)){
   if(selected?.type===group)id=selected.id;
  }else if(/^(?:a )?sala atual$/.test(text)&&group==='rooms')id=refs.get(context.currentRoom)?.id;
  else if(/^(?:o )?piso atual$/.test(text)&&group==='floors')id=refs.get(context.currentFloor)?.id;
  else if(/^(?:o )?edificio atual$/.test(text)&&group==='sites'){const floor=project.floors.find(f=>f.id===(refs.get(context.currentFloor)?.id||item?.floor));id=item?.site||floor?.site;}
  else {const matches=project[group].filter(x=>norm(x.name)===text||(group==='nets'&&String(x.id)===text)),created=createdTargets.filter(x=>x.group===group&&(norm(x.name)===text||(group==='nets'&&String(x.vlan)===text)));if(matches.length+created.length>1)throw Error('Há vários elementos com esse nome. Seleciona o elemento pretendido e usa «selecionado».');if(created.length)return created[0].ref;id=matches[0]?.id;}
  if(!id)throw Error('Não identifiquei '+({devices:'o equipamento',rooms:'a sala',floors:'o piso',sites:'o edifício',racks:'o bastidor',nets:'a VLAN',templates:'o modelo'})[group]+'. Seleciona-o ou indica um nome exato entre aspas.');
  const alias=[...refs].find(([,entry])=>entry.type===group&&entry.id===id)?.[0];if(!alias)throw Error('Seleciona primeiro esse elemento para o incluir no contexto do pedido.');return alias;
 }
 function parseOne(raw,index){
  const text=raw.trim().replace(/[“”]/g,'"').replace(/[.!]$/,'').trim(),newRef=kind=>'new_local_'+index+'_'+kind;let m;
  m=text.match(/^(?:rev[eê] esta sala e completa as liga[cç][oõ]es que faltam, usando as portas livres|corrige as liga[cç][oõ]es em falta na sala atual)$/iu);if(m)return [{action:'repair_room',room:resolve('rooms','sala atual')}];
  m=text.match(/^usa a rede ([\d.]+\/\d{1,2}), reserva (?:o )?gateway ([\d.]+) e atribui IPs aos (computadores|equipamentos)(?: da sala (atual|"[^"]+"))?(?: a partir de ([\d.]+))? sem repetir endere[cç]os$/iu);if(m)return [{action:'assign_room_addresses',room:resolve('rooms',m[4]&&m[4]!=='atual'?m[4]:'sala atual'),subnet:m[1],gateway:m[2],scope:norm(m[3])==='computadores'?'computers':'equipment',...(m[5]?{first:m[5]}:{})}];
  const office=parseOfficeRequest(text);if(office){const {room,...options}=office;return [{action:'prepare_office',room:resolve('rooms',room),...options}];}
  m=text.match(/^equipa (?:a )?sala (.+?) com (.+)$/iu);
  if(m){const fields={room:resolve('rooms',m[1]==='atual'?'sala atual':m[1])},keys={'posto de trabalho':'workstations','postos de trabalho':'workstations','posto':'workstations','postos':'workstations','telefone ip':'phones','telefones ip':'phones','impressora':'printers','impressoras':'printers','tomada de rede':'sockets','tomadas de rede':'sockets','mini-switch':'minis','mini-switches':'minis','monitor por posto':'monitors','monitores por posto':'monitors'};const counts={um:1,uma:1,dois:2,duas:2,tres:3,quatro:4,cinco:5,seis:6,sete:7,oito:8,nove:9,dez:10};for(const part of norm(m[2]).split(/,| e /)){const quantified=part.trim().replace(/^(um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez) /,word=>counts[word.trim()]+' ');const entry=quantified.match(/^(\d+) (.+)$/);if(!entry||!keys[entry[2]])throw Error('Indica quantidades de postos, telefones IP, impressoras, tomadas de rede ou mini-switches.');const key=keys[entry[2]];if(Object.hasOwn(fields,key))throw Error('Indica cada quantidade apenas uma vez.');fields[key]=Number(entry[1]);}return [{action:'equip_room',...fields}];}
  m=text.match(/^liga [aà] rede os equipamentos da sala (.+?) usando as portas livres$/iu);
  if(m)return [{action:'connect_room',room:resolve('rooms',m[1]==='atual'?'sala atual':m[1])}];
  m=text.match(/^(?:define|atribui) (?:a )?VLAN (\d+) a todos os equipamentos da sala (.+)$/iu);
  if(m)return [{action:'assign_room_vlan',network:resolve('nets',m[1]),room:resolve('rooms',m[2]==='atual'?'sala atual':m[2])}];
  m=text.match(/^(?:instala|monta) os equipamentos livres da sala (.+?) no bastidor (.+)$/iu);
  if(m)return [{action:'mount_room',room:resolve('rooms',m[1]==='atual'?'sala atual':m[1]),rack:resolve('racks',m[2])}];
  m=text.match(/^alimenta os equipamentos ativos do bastidor (.+?) usando a PDU (.+)$/iu);
  if(m)return [{action:'power_rack',rack:resolve('racks',m[1]),pdu:resolve('devices',m[2])}];
  m=text.match(/^guarda (?:a )?sala (.+?) como modelo chamado "([^"]+)"$/iu);
  if(m)return [{action:'save_room_template',ref:newRef('template'),room:resolve('rooms',m[1]==='atual'?'sala atual':m[1]),name:m[2]}];
  m=text.match(/^duplica (?:a )?sala (.+?) com o nome "([^"]+)"$/iu);
  if(m)return [{action:'duplicate_room',ref:newRef('room'),room:resolve('rooms',m[1]==='atual'?'sala atual':m[1]),name:m[2]}];
  m=text.match(/^aplica (?:o )?modelo "([^"]+)" no piso (.+?) com o nome "([^"]+)"$/iu);
  if(m)return [{action:'apply_room_template',ref:newRef('room'),template:resolve('templates',m[1]),floor:resolve('floors',m[2]==='atual'?'piso atual':m[2]),name:m[3]}];
  m=text.match(/^cria (?:um )?edif[ií]cio chamado "([^"]+)" com um piso chamado "([^"]+)" e uma sala chamada "([^"]+)" de (\d+(?:[.,]\d+)?) (?:por|x) (\d+(?:[.,]\d+)?) metros$/iu);
  if(m)return [{action:'create_building',ref:newRef('site'),name:m[1]},{action:'create_floor',ref:newRef('floor'),site:newRef('site'),name:m[2],level:0},{action:'create_room',ref:newRef('room'),floor:newRef('floor'),name:m[3],width:Number(m[4].replace(',','.')),depth:Number(m[5].replace(',','.'))}];
  m=text.match(/^(?:cria|adiciona) (?:um )?piso chamado "([^"]+)" no edif[ií]cio (.+?)(?: no n[ií]vel (-?\d+))?$/iu);
  if(m)return [{action:'create_floor',ref:newRef('floor'),site:resolve('sites',m[2]==='atual'?'edifício atual':m[2]),name:m[1],...(m[3]!==undefined?{level:Number(m[3])}:{})}];
  m=text.match(/^(?:cria|adiciona) (?:uma )?sala chamada "([^"]+)" de (\d+(?:[.,]\d+)?) (?:por|x) (\d+(?:[.,]\d+)?) metros no piso (.+)$/iu);
  if(m)return [{action:'create_room',ref:newRef('room'),floor:resolve('floors',m[4]==='atual'?'piso atual':m[4]),name:m[1],width:Number(m[2].replace(',','.')),depth:Number(m[3].replace(',','.'))}];
  m=text.match(/^(?:cria|adiciona) (?:um )?bastidor chamado "([^"]+)" de (\d+) U na sala (.+)$/iu);
  if(m)return [{action:'create_rack',ref:newRef('rack'),room:resolve('rooms',m[3]==='atual'?'sala atual':m[3]),name:m[1],units:Number(m[2])}];
  m=text.match(/^(?:adiciona|cria|insere) (\d+) (.+?)(?: chamad[oa]s? "([^"]+)")?(?: com (\d+) portas)? na sala (.+)$/iu);
  if(m&&deviceTypes[norm(m[2])]){const type=deviceTypes[norm(m[2])];return [{action:'add_devices',ref:newRef('devices'),room:resolve('rooms',m[5]==='atual'?'sala atual':m[5]),type,name:m[3]||type,quantity:Number(m[1]),...(m[4]?{portCount:Number(m[4])}:{})}];}
  m=text.match(/^cria (?:uma )?(?:VM|m[aá]quina virtual) chamada "([^"]+)" no servidor (.+)$/iu);
  if(m)return [{action:'create_vm',ref:newRef('vm'),host:resolve('devices',m[2]==='selecionado'?'servidor selecionado':m[2]),name:m[1]}];
  m=text.match(/^(?:define|atualiza) (?:o |a )?(respons[aá]vel|estado|n[uú]mero de s[eé]rie|notas|modelo|fun[cç][aã]o|IP|gateway) d[aoe] (.+?) (?:como|para) (.+)$/iu);
  if(m){const device=resolve('devices',m[2]),field=({'responsavel':'owner','estado':'state','numero de serie':'serial','notas':'notes','modelo':'model','funcao':'role','ip':'ip','gateway':'gateway'})[norm(m[1])],value=unquote(m[3]);if(['ip','gateway'].includes(field))return [{action:'set_device_network',device,[field]:value}];if(['model','role'].includes(field))return [{action:'set_device_info',device,[field]:value}];const state=['Em serviço','Em reserva','Em manutenção','Abatido'].find(v=>norm(v)===norm(value));return [{action:'set_device_record',device,[field]:field==='state'?(state||value):value}];}
  m=text.match(/^(?:agenda|define) (?:a |o )?(pr[oó]xima revis[aã]o|substitui[cç][aã]o prevista|fim da garantia) d[aoe] (.+?) para (\d{4}-\d{2}-\d{2})$/iu);
  if(m)return [{action:'set_device_record',device:resolve('devices',m[2]),[({'proxima revisao':'nextMaintenance','substituicao prevista':'replacementDate','fim da garantia':'warranty'})[norm(m[1])]]:m[3]}];
  m=text.match(/^regista (?:uma )?interven[cç][aã]o n[oa] (.+?) com o t[ií]tulo "([^"]+)" na data (\d{4}-\d{2}-\d{2})(?: pelo t[eé]cnico "([^"]+)")?(?: com notas "([^"]+)")?$/iu);
  if(m)return [{action:'add_intervention',device:resolve('devices',m[1]),title:m[2],date:m[3],...(m[4]?{technician:m[4]}:{}),...(m[5]?{notes:m[5]}:{})}];
  m=text.match(/^(?:define|atribui) (?:a )?VLAN (\d+) (?:ao|no) (.+)$/iu);
  if(m)return [{action:'assign_vlan',device:resolve('devices',m[2]),network:resolve('nets',m[1])}];
  m=text.match(/^(?:define|configura) (?:a |o )?(sub-rede|gateway) da VLAN (\d+) (?:como|para) ([\d./]+)$/iu);
  if(m)return [{action:'set_network_info',network:resolve('nets',m[2]),[norm(m[1])==='sub-rede'?'subnet':'gateway']:m[3]}];
  m=text.match(/^(?:define|configura) (?:o )?(.+?) com (\d+) portas$/iu);
  if(m)return [{action:'set_device_ports',device:resolve('devices',m[1]),portCount:Number(m[2])}];
  m=text.match(/^(?:instala|monta) (?:o )?(.+?) no bastidor (.+?)(?: na U (\d+))?$/iu);
  if(m)return [{action:'mount_device',device:resolve('devices',m[1]),rack:resolve('racks',m[2]),...(m[3]?{u:Number(m[3])}:{})}];
  m=text.match(/^liga a alimenta[cç][aã]o d[aoe] (.+?) [aà] PDU (.+?)(?: na tomada (\d+))?(?: usando (PSU\d+|IN))?$/iu);
  if(m)return [{action:'connect_power',device:resolve('devices',m[1]),pdu:resolve('devices',m[2]),...(m[3]?{outlet:Number(m[3])}:{}),...(m[4]?{input:m[4].toUpperCase()}:{} )}];
  m=text.match(/^liga (?:o )?(.+?) (?:ao|[aà]) (.+?) (?:por|com) (cobre|fibra)$/iu);
  if(m)return [{action:'connect_equipment',a:resolve('devices',m[1]),b:resolve('devices',m[2]),kind:norm(m[3])==='fibra'?'fiber':'copper'}];
  return quickConfiguration(text,context)?.actions.map(a=>({...a,...(a.ref?{ref:newRef(a.action)}:{})}))||null;
 }
 const parts=splitCommands(String(prompt).trim());if(parts.length>12)throw Error('Máximo de 12 passos por pedido.');let actions=[];
 for(const [index,part] of parts.entries()){const step=parseOne(part,index);if(!step){if(parts.length>1)throw Error('Um dos passos não corresponde a um comando suportado. Nada foi aplicado. Consulta os exemplos do chat.');return null;}actions.push(...step);for(const a of step){const group=({create_building:'sites',create_floor:'floors',create_room:'rooms',create_rack:'racks',add_devices:'devices',create_vm:'devices',create_vlan:'nets',save_room_template:'templates',duplicate_room:'rooms',apply_room_template:'rooms'})[a.action];if(group&&a.ref&&(a.action!=='add_devices'||a.quantity===1))createdTargets.push({group,ref:a.ref,name:a.name,vlan:a.vlan});}}
 validateAssistantActions(actions,{allowLocal:true});validateAssistantIntent(actions,prompt);
 return {reply:'',actions,mode:'configure',source:'local-command',sources:[]};
}
