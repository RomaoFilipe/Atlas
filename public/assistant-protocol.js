export const assistantDeviceTypes=['Posto de trabalho','Computador','Portátil','Impressora','Telefone IP','Tomada de rede','Mini-switch','Wi-Fi','Câmara','Switch','Patch panel','Servidor','Armazenamento','Firewall','Internet','PDU','UPS'];
const text={type:'string',minLength:1,maxLength:100},ref={type:'string',pattern:'^[a-zA-Z][a-zA-Z0-9_]{0,79}$'},number={type:'number'},integer={type:'integer'};
const newRef={type:'string',pattern:'^new_[a-z0-9_]{1,40}$'};
const cable={type:'string',enum:['cat5e','cat6','cat6a','os2','om3','power']};
const specs={
 diagnose_network:{required:['device'],properties:{device:ref}},
 connect_nearest_outlet:{required:['device'],properties:{device:ref,cable,complete:{type:'boolean'}}},
 connect_cable:{required:['a','portA','b','portB','cable'],properties:{a:ref,portA:ref,b:ref,portB:ref,cable}},
 configure_port:{required:['device','port'],properties:{device:ref,port:ref,adminUp:{type:'boolean'},mode:{type:'string',enum:['access','trunk','routed']},network:ref,nativeNetwork:ref,networks:{type:'array',maxItems:16,uniqueItems:true,items:ref}}},
 verify_network:{required:[],properties:{device:ref,room:ref}},
 repair_room:{required:['room'],properties:{room:ref}},
 prepare_office:{required:['room','people'],properties:{room:ref,people:integer,printer:{type:'boolean'},outlets:{type:'boolean'},rack:{type:'boolean'},connect:{type:'boolean'},review:{type:'boolean'}}},
 review_room:{required:['room'],properties:{room:ref}},
 create_building:{required:['ref','name'],properties:{ref:newRef,name:text,width:number,depth:number}},
 create_floor:{required:['ref','site','name'],properties:{ref:newRef,site:ref,name:text,level:integer}},
 create_room:{required:['ref','floor','name','width','depth'],properties:{ref:newRef,floor:ref,name:text,width:number,depth:number,x:number,z:number}},
 create_rack:{required:['ref','room','name','units'],properties:{ref:newRef,room:ref,name:text,units:integer,x:number,z:number}},
 add_devices:{required:['ref','room','type','name','quantity'],properties:{ref:newRef,room:ref,type:{type:'string',enum:assistantDeviceTypes},name:text,quantity:integer,portCount:integer}},
 equip_room:{required:['room'],properties:{room:ref,workstations:integer,phones:integer,printers:integer,sockets:integer,minis:integer,monitors:{type:'integer',enum:[1,2]}}},
 assign_room_vlan:{required:['room','network'],properties:{room:ref,network:ref,type:{type:'string',enum:[...assistantDeviceTypes,'VM']}}},
 mount_room:{required:['room','rack'],properties:{room:ref,rack:ref}},
 power_rack:{required:['rack','pdu'],properties:{rack:ref,pdu:ref}},
 save_room_template:{required:['ref','room','name'],properties:{ref:newRef,room:ref,name:text}},
 duplicate_room:{required:['ref','room','name'],properties:{ref:newRef,room:ref,name:text}},
 create_vm:{required:['ref','host','name'],properties:{ref:newRef,host:ref,name:text}},
 connect_power:{required:['pdu','device'],properties:{pdu:ref,device:ref,outlet:integer,input:{type:'string',pattern:'^(PSU[1-9][0-9]?|IN)$',maxLength:10}}},
 rename:{required:['target','name'],properties:{target:ref,name:text}},
 set_device_info:{required:['device'],properties:{device:ref,model:{type:'string',maxLength:100},role:{type:'string',maxLength:100}}},
 move_device:{required:['device','x','z'],properties:{device:ref,x:number,z:number,rotation:integer}},
 mount_device:{required:['device','rack'],properties:{device:ref,rack:ref,u:integer}},
 create_vlan:{required:['ref','vlan','name'],properties:{ref:newRef,vlan:integer,name:text}},
 assign_vlan:{required:['device','network'],properties:{device:ref,network:ref}},
 connect:{required:['a','portA','b','portB'],properties:{a:ref,b:ref,portA:ref,portB:ref,kind:{type:'string',enum:['copper','fiber']}}},
 connect_equipment:{required:['a','b'],properties:{a:ref,b:ref,kind:{type:'string',enum:['copper','fiber']}}},
 connect_to_outlet:{required:['device','room'],properties:{device:ref,room:ref}},
 connect_room:{required:['room'],properties:{room:ref}},
 apply_room_template:{required:['ref','template','floor','name'],properties:{ref:newRef,template:ref,floor:ref,name:text}}
};
// Personal inventory and network values are entered locally; never requested from a model.
const localSpecs={
 connect_cable_exact:{required:['a','portA','b','portB','cable'],properties:{a:ref,portA:{type:'string',maxLength:50},b:ref,portB:{type:'string',maxLength:50},cable}},
 configure_interface_exact:{required:['device','port'],properties:{device:ref,port:{type:'string',maxLength:50},adminUp:{type:'boolean'},medium:{type:'string',enum:['auto','copper','fiber']},maxSpeed:integer,speed:integer,supportedSpeeds:{type:'string',maxLength:100},duplex:{type:'string',enum:['auto','full','half']},mode:{type:'string',enum:['access','trunk','routed']},accessVlan:integer,nativeVlan:integer,allowedVlans:{type:'string',maxLength:2000},poe:{type:'string',enum:['unknown','off','pse','pd']},poeWatts:number}},
 assign_room_addresses:{required:['room','subnet','gateway'],properties:{room:ref,subnet:{type:'string',maxLength:18},gateway:{type:'string',maxLength:15},first:{type:'string',maxLength:15},vlan:integer,scope:{type:'string',enum:['computers','equipment'],maxLength:12}}},
 set_device_record:{required:['device'],properties:{device:ref,owner:{type:'string',maxLength:200},state:{type:'string',enum:['Em serviço','Em reserva','Em manutenção','Abatido'],maxLength:20},serial:{type:'string',maxLength:200},warranty:{type:'string',maxLength:10},nextMaintenance:{type:'string',maxLength:10},replacementDate:{type:'string',maxLength:10},notes:{type:'string',maxLength:2000}}},
 add_intervention:{required:['device','date','title'],properties:{device:ref,date:{type:'string',maxLength:10},title:{type:'string',maxLength:200},technician:{type:'string',maxLength:200},notes:{type:'string',maxLength:3000}}},
 set_device_network:{required:['device'],properties:{device:ref,ip:{type:'string',maxLength:15},gateway:{type:'string',maxLength:15}}},
 set_network_info:{required:['network'],properties:{network:ref,subnet:{type:'string',maxLength:18},gateway:{type:'string',maxLength:15}}},
 set_device_ports:{required:['device','portCount'],properties:{device:ref,portCount:integer}}
};
export const isLocalAssistantAction=action=>Object.hasOwn(localSpecs,action);
export const assistantResponseSchema={type:'object',additionalProperties:false,required:['reply','actions'],properties:{reply:{type:'string',maxLength:160},actions:{type:'array',maxItems:12,items:{oneOf:Object.entries(specs).map(([action,spec])=>({type:'object',additionalProperties:false,required:['action',...spec.required],properties:{action:{const:action},...spec.properties}}))}}}};
export function validateAssistantActions(actions,{allowLocal=false}={}){
 if(!Array.isArray(actions)||actions.length>12)throw Error('A IA devolveu demasiadas ações.');
 for(const a of actions){if(!a||typeof a!=='object'||Array.isArray(a)||!Object.hasOwn(specs,a.action)&&!(allowLocal&&Object.hasOwn(localSpecs,a.action)))throw Error('A IA pediu uma ação não permitida.');const spec=specs[a.action]||localSpecs[a.action];if(spec.required.some(k=>!Object.hasOwn(a,k))||Object.keys(a).some(k=>k!=='action'&&!Object.hasOwn(spec.properties,k))||a.action==='set_device_info'&&!['model','role'].some(k=>Object.hasOwn(a,k)))throw Error('A IA devolveu parâmetros não permitidos.');if(a.action==='create_room'&&Object.hasOwn(a,'x')!==Object.hasOwn(a,'z'))throw Error('Indica as duas coordenadas da sala.');if(['set_device_record','set_device_network','set_network_info'].includes(a.action)&&Object.keys(a).length<=2)throw Error('Indica os campos a atualizar.');
 if(a.action==='verify_network'&&Number(!!a.device)+Number(!!a.room)!==1)throw Error('Escolha um equipamento ou uma sala para verificar.');
 if(['configure_port','configure_interface_exact'].includes(a.action)&&Object.keys(a).length<=3)throw Error('Indique os campos da interface a configurar.');
 for(const [key,value] of Object.entries(a)){if(key==='action')continue;const rule=spec.properties[key];if(rule.type==='array'&&(!Array.isArray(value)||value.length>(rule.maxItems||16)||new Set(value).size!==value.length||value.some(item=>typeof item!=='string'||!new RegExp(rule.items.pattern).test(item))))throw Error('A IA devolveu uma lista de referências inválida.');if(rule.type==='boolean'&&typeof value!=='boolean')throw Error('A IA devolveu uma opção inválida.');if(rule.type==='string'&&(typeof value!=='string'||!value.trim()||value.length>(rule.maxLength||80)||(rule.pattern&&!new RegExp(rule.pattern).test(value))||(rule.enum&&!rule.enum.includes(value))))throw Error('A IA devolveu texto ou referências inválidos.');if(['number','integer'].includes(rule.type)&&(!Number.isFinite(value)||(rule.type==='integer'&&!Number.isInteger(value))||(rule.enum&&!rule.enum.includes(value))))throw Error('A IA devolveu um número inválido.');}
 if(a.action==='configure_port'){if(a.network&&a.mode!=='access'||(a.networks||a.nativeNetwork)&&a.mode!=='trunk')throw Error('As VLANs devem corresponder ao modo access/trunk indicado.');if(a.mode==='access'&&!a.network)throw Error('A porta access exige uma VLAN.');if(a.mode==='trunk'&&!a.networks?.length)throw Error('O trunk exige VLANs permitidas.');}
 if(a.ref&&!/^new_[a-z0-9_]{1,40}$/.test(a.ref))throw Error('As novas referências devem começar por new_.');
 }
 return actions;
}
export function sanitizeAssistantContext(input){
 if(!input||typeof input!=='object'||Array.isArray(input))return{};
 const output={},validRef=v=>typeof v==='string'&&/^[a-z][a-z0-9_]{0,79}$/.test(v),fields={sites:['width','depth'],floors:['site','level'],rooms:['floor','width','depth','x','z'],racks:['site','floor','room','units','x','z'],devices:['room','floor','rack','host','units','portCount','type','x','z','rotation','network'],networks:['vlan'],templates:['width','depth']};
 for(const [group,keys] of Object.entries(fields)){const items=input[group];output[group]=(Array.isArray(items)?items:[]).slice(0,group==='devices'?24:16).filter(item=>item&&validRef(item.ref)).map((item,i)=>{const clean={ref:item.ref,label:({sites:'Edifício',floors:'Piso',rooms:'Sala',racks:'Bastidor',devices:'Equipamento',networks:'VLAN',templates:'Modelo'})[group]+' '+(i+1),locked:item.locked===true};for(const key of keys){if(['site','floor','room','rack','host','network'].includes(key)){if(validRef(item[key]))clean[key]=item[key];}else if(key==='type'){if(assistantDeviceTypes.includes(item[key])||item[key]==='VM')clean.type=item[key];}else if(Number.isFinite(item[key])&&Math.abs(item[key])<=5000)clean[key]=item[key];}if(group==='devices')clean.ports=(Array.isArray(item.ports)?item.ports:[]).slice(0,8).filter(p=>p&&validRef(p.ref)).map(p=>({ref:p.ref,free:p.free===true,face:p.face==='rear'?'rear':'front',channel:Number.isInteger(p.channel)&&p.channel>=0&&p.channel<=96?p.channel:0,...(typeof p.documented==='boolean'?{documented:p.documented}:{}),...(typeof p.adminUp==='boolean'?{adminUp:p.adminUp}:{}),...(['auto','copper','fiber'].includes(p.medium)?{medium:p.medium}:{}),...(['auto','access','trunk','routed'].includes(p.mode)?{mode:p.mode}:{}),...(validRef(p.network)?{network:p.network}:{}),...(Array.isArray(p.networks)?{networks:p.networks.slice(0,16).filter(validRef)}:{}),...(Array.isArray(p.supportedSpeeds)?{supportedSpeeds:p.supportedSpeeds.slice(0,9).filter(n=>[10,100,1000,2500,5000,10000,25000,40000,100000].includes(n))}:{}),...(Number.isInteger(p.speed)&&p.speed>=0&&p.speed<=100000?{speed:p.speed}:{})}));return clean;});}
 const known=new Set(Object.values(output).flat().map(item=>item.ref)),devices=new Set(output.devices.map(item=>item.ref));output.connections=(Array.isArray(input.connections)?input.connections:[]).slice(0,200).filter(link=>link&&devices.has(link.a)&&devices.has(link.b)&&['copper','fiber','virtual'].includes(link.kind)).map(link=>({a:link.a,b:link.b,kind:link.kind,aFace:link.aFace==='rear'?'rear':'front',aChannel:Number.isInteger(link.aChannel)&&link.aChannel>=0&&link.aChannel<=96?link.aChannel:0,bFace:link.bFace==='rear'?'rear':'front',bChannel:Number.isInteger(link.bChannel)&&link.bChannel>=0&&link.bChannel<=96?link.bChannel:0}));output.selection=known.has(input.selection)?input.selection:'';output.currentRoom=known.has(input.currentRoom)?input.currentRoom:'';output.currentFloor=known.has(input.currentFloor)?input.currentFloor:'';output.currentRack=known.has(input.currentRack)?input.currentRack:'';
 return output;
}

export function validateAssistantIntent(actions,prompt=''){const text=String(prompt).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),blocked=new Set();
 if(/\bsem pisos?\b|\bnao (?:cries|criar|adiciones|adicionar) (?:nenhum )?pisos?\b/.test(text))blocked.add('create_floor');
 if(/\bsem salas?\b|\bsem pisos? nem salas?\b|\bnao (?:cries|criar|adiciones|adicionar) (?:nenhuma )?salas?\b/.test(text)){blocked.add('create_room');blocked.add('duplicate_room');blocked.add('apply_room_template');}
 if(/\bsem equipamentos?\b|\bnao (?:cries|criar|adiciones|adicionar) equipamentos?\b/.test(text)){blocked.add('add_devices');blocked.add('equip_room');blocked.add('prepare_office');blocked.add('duplicate_room');blocked.add('create_vm');blocked.add('apply_room_template');}
 if(/\bsem (?:cabos|ligacoes)\b|\bnao (?:ligues|ligar|conectes|conectar)\b/.test(text)){blocked.add('connect_nearest_outlet');blocked.add('connect_cable');blocked.add('connect_cable_exact');blocked.add('connect');blocked.add('connect_equipment');blocked.add('connect_to_outlet');blocked.add('connect_room');blocked.add('repair_room');blocked.add('connect_power');blocked.add('power_rack');blocked.add('duplicate_room');}
 for(const [field,type,terms] of [['workstations','Posto de trabalho','postos?(?: de trabalho)?'],['phones','Telefone IP','telefones?(?: ip)?'],['printers','Impressora','impressoras?'],['sockets','Tomada de rede','tomadas?(?: de rede)?'],['minis','Mini-switch','mini-switch(?:es)?']]){if(new RegExp('\\b(?:sem|nem) (?:nov[oa]s? )?'+terms+'\\b').test(text)&&actions.some(a=>a.action==='equip_room'&&(a[field]||0)>0||a.action==='add_devices'&&a.type===type))throw Error('A IA propôs equipamento que o pedido excluiu explicitamente. Nada foi aplicado.');}
 if(actions.some(a=>a.action==='prepare_office'&&((/\bsem (?:computadores|postos)\b/.test(text))||/\bsem (?:cabos|ligacoes)\b|\bnao (?:ligues|ligar)\b/.test(text)&&a.connect||/\bsem impressoras?\b/.test(text)&&a.printer||/\bsem tomadas?\b/.test(text)&&a.outlets||/\bsem bastidor\b/.test(text)&&a.rack)))throw Error('A preparação do escritório contradiz uma exclusão do pedido. Nada foi aplicado.');
 // prepare_office creates generic computers. Explicit desks must use equip_room
 // or add_devices so the model cannot silently replace the requested equipment.
 if(/\bpostos? de trabalho\b/.test(text)&&actions.some(a=>a.action==='prepare_office'||a.action==='add_devices'&&a.type==='Computador'))throw Error('O pedido especifica postos de trabalho. Use equip_room ou adicione Posto de trabalho; não substitua por computadores genéricos. Nada foi aplicado.');
 if(actions.some(a=>a.action==='configure_port'&&Object.hasOwn(a,'adminUp'))&&!/\b(?:ativa|ativar|desativa|desativar|shutdown)\b/.test(text))throw Error('Ativar ou desativar interfaces exige um pedido explícito.');
 if(actions.some(a=>a.action==='configure_port')&&!/\b(?:configura|configurar|define|definir|ativa|ativar|desativa|desativar|shutdown|access|trunk)\b/.test(text))throw Error('A configuração de interfaces precisa de um pedido explícito.');
 const readOnly=/\b(?:sem alterar|sem modificar|apenas verificar|so verificar|so verifica)\b/.test(text)||/^(?:verifica (?:as ligacoes|a rede)|diagnostica\b)/.test(text)&&!/\b(?:configura|define|liga|ativa|desativa|cria|corrige|completa)\b/.test(text);
 if(readOnly&&actions.some(a=>!['verify_network','review_room','diagnose_network'].includes(a.action)))throw Error('O pedido é apenas de verificação. Nenhuma alteração foi autorizada.');
 if(actions.some(a=>blocked.has(a.action)))throw Error('A IA propôs uma ação que o pedido excluiu explicitamente. Nada foi aplicado.');return actions;}
