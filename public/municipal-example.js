import {normalizeProject,validate} from './model.js';
import {templateFrom} from './network.js';

// Entirely fictional inventory and organisation. No real municipal data.
export function makeMunicipalExample(){
 const p={version:3,name:'Câmara Municipal · Vila Serena (fictícia)',exampleKey:'municipal',sites:[],floors:[],rooms:[],racks:[],devices:[],links:[],nets:[],templates:[]};
 const colors=['#4685ce','#9370bb','#dc9961','#41a89a','#d47998','#799844'];
 const net=(id,name,color)=>p.nets.push({id,name,color,subnet:`10.${id}.0.0/24`,gateway:`10.${id}.0.1`});
 [[10,'Gestão de infraestrutura'],[20,'Servidores municipais'],[40,'Voz / telefonia IP'],[50,'Impressão'],[60,'Wi-Fi visitantes']].forEach(([id,name],i)=>net(id,name,colors[i]));
 const add=(id,name,type,extra={})=>{const d={id,name,type,site:'pacos',floor:'pacos-1',room:'tecnica-pacos-1',rack:'',host:'',u:1,units:1,portCount:1,ip:'',gateway:'',vlan:0,x:0,y:.6,z:-8,model:'Ilustrativo',role:'',...extra};if(d.vlan&&!d.gateway)d.gateway=`10.${d.vlan}.0.1`;p.devices.push(d);return d;};
 const link=(id,a,portA,b,portB,kind='copper',extra={})=>p.links.push({id,label:id,a,portA,b,portB,kind,speed:kind==='fiber'?'10 Gbps':kind==='power'?'230 V':kind==='virtual'?'Virtual':'1 Gbps',vlans:[],category:kind==='fiber'?'OS2':kind==='power'?'IEC C13':kind==='virtual'?'vSwitch':'Cat 6A',length:kind==='copper'?2:null,waypoints:[],routeNote:'Percurso ilustrativo',...extra});
 p.sites.push({id:'pacos',name:'Paços do Concelho',sub:'Vila Serena · município fictício',x:0,z:0,w:42,d:22},{id:'oficinas',name:'Armazém e Oficinas',sub:'Serviços operacionais',x:55,z:0,w:42,d:22},{id:'protecao',name:'Proteção Civil',sub:'Coordenação municipal',x:0,z:32,w:42,d:22});
 const floors=[
  {id:'pacos-0',site:'pacos',name:'Piso 0 · Atendimento',level:0,departments:[['ATM','Atendimento ao Munícipe'],['TES','Tesouraria'],['SOC','Ação Social']]},
  {id:'pacos-1',site:'pacos',name:'Piso 1 · Serviços técnicos',level:1,departments:[['URB','Urbanismo'],['OBR','Obras Municipais'],['AMB','Ambiente']]},
  {id:'pacos-2',site:'pacos',name:'Piso 2 · Administração',level:2,departments:[['PRE','Presidência'],['RH','Recursos Humanos e SST'],['FIN','Finanças e Aprovisionamento']]},
  {id:'oficinas-0',site:'oficinas',name:'Piso 0 · Operações',level:0,departments:[['LOG','Logística e Património'],['OFI','Oficinas Municipais']]},
  {id:'protecao-0',site:'protecao',name:'Piso 0 · Coordenação',level:0,departments:[['PCV','Proteção Civil']]}
 ];
 p.racks.push({id:'rack-dc',name:'R-DC-MUNICIPAL',site:'pacos',floor:'pacos-1',room:'tecnica-pacos-1',units:42,x:-3,z:-8,locked:true});
 add('core','CORE-MUNICIPAL','Switch',{rack:'rack-dc',u:38,portCount:24,ip:'10.10.0.2',vlan:10,specs:{switching:'L3 · gateways das VLANs em .1 · uplinks 10 Gb',poe:'Sem PoE'}});
 add('firewall','FW-MUNICIPAL','Firewall',{rack:'rack-dc',u:40,portCount:4,ip:'10.10.0.254',vlan:10,specs:{wan:'WAN de documentação · 192.0.2.2/30',policies:'Proposta: visitantes só Internet; voz apenas PBX; gestão restrita a TI. Regras documentadas, não executadas.'}});
 add('hypervisor','HV-MUNICIPAL','Servidor',{rack:'rack-dc',u:12,units:2,portCount:4,ip:'10.20.0.10',vlan:20,specs:{os:'Hipervisor ilustrativo',cpu:'16 núcleos',ram:'128 GB',storage:'4 TB SSD'}});
 add('backup','NAS-BACKUP','Armazenamento',{rack:'rack-dc',u:8,units:2,portCount:2,ip:'10.20.0.30',vlan:20,specs:{storage:'24 TB',raid:'RAID 6',protocols:'NFS / cópias de segurança'}});
 add('ups-dc','UPS-DATACENTER','UPS',{rack:'rack-dc',u:1,units:3,portCount:2,specs:{power:'3000 VA / 2700 W',autonomy:'20 min estimados (ilustrativo)'}});
 add('pdu-dc','PDU-DATACENTER','PDU',{rack:'rack-dc',u:5,portCount:8,outletLabels:{OUT1:'Core municipal',OUT2:'Firewall',OUT3:'Hipervisor',OUT4:'Backup'},specs:{feed:'UPS-DATACENTER · circuito DC-A',power:'16 A',connector:'IEC C13'}});
 add('internet','OPERADOR-DEMO','Internet',{x:-8,z:-8,ip:'192.0.2.1',specs:{provider:'Operador fictício',bandwidth:'1 Gbps'}});
 link('WAN','internet','P1','firewall','P1');link('LAN-FIREWALL','firewall','P2','core','Gi1/0/24');
 link('CORE-HV','core','Gi1/0/20','hypervisor','P1','copper',{vlans:[20]});link('CORE-BACKUP','core','Gi1/0/21','backup','P1','copper',{vlans:[20]});
 link('ENERGIA-DC','ups-dc','OUT1','pdu-dc','IN','power');['core','firewall','hypervisor','backup'].forEach((id,i)=>link('ENERGIA-'+id,'pdu-dc','OUT'+(i+1),id,'PSU1','power'));
 [['directory','VM-DIRETORIO-DNS','Diretório e DNS'],['files','VM-FICHEIROS-IMPRESSAO','Ficheiros e filas de impressão'],['municipal-apps','VM-GESTAO-MUNICIPAL','Aplicações municipais de demonstração'],['pbx','VM-CENTRAL-TELEFONICA','PBX SIP · extensões 2101–2124']].forEach(([id,name,role],i)=>{add(id,name,'VM',{host:'hypervisor',ip:`10.20.0.${40+i}`,vlan:20,role,specs:{os:'Sistema ilustrativo',cpu:'4 vCPU',ram:'8 GB',storage:'200 GB'}});link('VIRTUAL-'+id,'hypervisor','vSwitch0',id,'vNIC0','virtual',{vlans:[20]});});
 let departmentNumber=0,deskNumber=0;
 for(const [fi,f] of floors.entries()){
  const site=p.sites.find(s=>s.id===f.site),elevation=f.level*6,room='tecnica-'+f.id,rack='rack-'+f.id,sw='sw-'+f.id,panel='panel-'+f.id;
  p.floors.push({id:f.id,site:f.site,name:f.name,level:f.level,elevation});
  p.rooms.push({id:room,name:f.level===1&&f.site==='pacos'?'Datacenter municipal':'Sala técnica',floor:f.id,x:0,z:-8,w:36,d:4});
  p.racks.push({id:rack,name:'R-'+f.id.toUpperCase(),site:f.site,floor:f.id,room,units:24,x:3,z:-8,locked:true});
  const location={site:f.site,floor:f.id,room,rack};
  add(sw,'SW-'+f.id.toUpperCase(),'Switch',{...location,u:20,portCount:24,ip:`10.10.0.${10+fi}`,vlan:10,specs:{switching:'24 portas Gigabit · uplink 10 Gb',poe:'PoE+ · 370 W · telefones e AP'}});
  add(panel,'PP-'+f.id.toUpperCase(),'Patch panel',{...location,u:18,portCount:24,specs:{category:'Cat 6A · canais numerados'}});
  add('ups-'+f.id,'UPS-'+f.id.toUpperCase(),'UPS',{...location,u:1,units:3,portCount:2,specs:{power:'1500 VA',autonomy:'15 min estimados (ilustrativo)'}});
  add('pdu-'+f.id,'PDU-'+f.id.toUpperCase(),'PDU',{...location,u:5,portCount:8,outletLabels:{OUT1:'Switch de acesso / PoE'},specs:{feed:'UPS-'+f.id.toUpperCase(),power:'16 A',connector:'IEC C13'}});
  link('ENERGIA-'+f.id,'ups-'+f.id,'OUT1','pdu-'+f.id,'IN','power');link('ENERGIA-SW-'+f.id,'pdu-'+f.id,'OUT1',sw,'PSU1','power');
  const floorVlans=[10,40,50,60];let channel=0;
  function connect(endpoint,socket,socketChannel,vlan,port='Ethernet1'){
   const ch=++channel,target=p.devices.find(d=>d.id===socket);
   link(`PATCH-${f.id}-${ch}`,sw,'Gi1/0/'+ch,panel,'F'+ch,'copper',{vlans:[vlan]});
   link(`HORIZONTAL-${f.id}-${ch}`,panel,'R'+ch,socket,'R'+socketChannel,'copper',{vlans:[vlan],length:25+ch,routeNote:`Calha do piso → ${target.name} · canal ${socketChannel}`,waypoints:[{x:site.x+3,y:elevation+.25,z:site.z-5.5},{x:target.x,y:elevation+.25,z:site.z-5.5},{x:target.x,y:elevation+.25,z:target.z}]});
   link(`TERMINAL-${endpoint}`,socket,'F'+socketChannel,endpoint,port,'copper',{vlans:[vlan]});
  }
  for(const [di,[code,name]] of f.departments.entries()){
   const dn=++departmentNumber,vlan=100+dn,rx=(di-(f.departments.length-1)/2)*13,rid='dept-'+code,base={site:f.site,floor:f.id,room:rid};
   net(vlan,name,colors[(dn-1)%colors.length]);floorVlans.push(vlan);
   p.rooms.push({id:rid,name,floor:f.id,x:rx,z:2,w:12.5,d:14});
   for(let j=0;j<2;j++){
    const n=++deskNumber,nn=String(n).padStart(2,'0'),id='posto-'+nn,socket='tomada-'+nn,phone='telefone-'+nn,ext=String(2100+n),x=site.x+rx-2,z=site.z-1+j*5;
    add(id,'Secretária '+nn+' · '+code,'Posto de trabalho',{...base,x,z,y:0,monitors:2,rotation:0,ip:`10.${vlan}.0.${11+j}`,vlan,role:name,specs:{workstation:'PT-'+code+'-'+(j+1),department:name,computer:'PC-MUN-'+nn,screens:`MON-${nn}-A / MON-${nn}-B · 24 polegadas`,phone:`TEL-${nn} · extensão ${ext}`,powerSource:`TE-${code}-${j+1} · circuito Q-${f.id} · PC e dois monitores`,os:'Sistema de demonstração',cpu:'6 núcleos',ram:'16 GB',storage:'512 GB SSD'}});
    add(socket,'T-'+code+'-'+(j+1),'Tomada de rede',{...base,x:site.x+rx+4,z:z-1,y:.4,portCount:2,specs:{outlet:`T-${code}-${j+1} · canal 1 dados / canal 2 voz`,category:'Cat 6A'}});
    add(phone,'TEL-'+nn+' · '+ext,'Telefone IP',{...base,x:x+.72,z:z+.2,y:.84,ip:`10.40.0.${20+n}`,vlan:40,specs:{extension:ext,workstation:'PT-'+code+'-'+(j+1),department:name,sipServer:'VM-CENTRAL-TELEFONICA · 10.20.0.43',poe:'PoE+ pelo switch do piso'}});
    connect(id,socket,1,vlan);connect(phone,socket,2,40);
   }
   const printer='printer-'+code,ps='tomada-imp-'+code;
   add(printer,'IMP-'+code,'Impressora',{...base,x:site.x+rx-1,z:site.z+7.5,ip:`10.50.0.${20+dn}`,vlan:50,role:'Multifunções partilhada · '+name,specs:{printType:'Laser a cores · impressão / digitalização',paper:'A3 / A4',powerSource:`TE-IMP-${code} · circuito Q-${f.id}`}});
   add(ps,'T-IMP-'+code,'Tomada de rede',{...base,x:site.x+rx+4,z:site.z+7.5,y:.4,specs:{outlet:'T-IMP-'+code,category:'Cat 6A'}});connect(printer,ps,1,50);
  }
  add('ap-'+f.id,'AP-'+f.id.toUpperCase(),'Wi-Fi',{site:f.site,floor:f.id,room,x:site.x+7,z:site.z-8,y:2.8,ip:`10.10.0.${30+fi}`,vlan:10,specs:{ssid:'MUN-VISITANTES · VLAN 60 (proposta)',wifi:'Wi-Fi 6',poe:'PoE+ · porta 22 do switch'}});
  link('AP-'+f.id,sw,'Gi1/0/22','ap-'+f.id,'P1','copper',{vlans:[10,60],length:8});
  link('FIBRA-'+f.id,'core','Gi1/0/'+(fi+1),sw,'Gi1/0/24','fiber',{vlans:floorVlans,length:f.site==='pacos'?20+f.level*10:fi===3?120:150,routeNote:f.site==='pacos'?'Prumada técnica dos Paços do Concelho':'Conduta entre edifícios · percurso ilustrativo'});
 }
 normalizeProject(p);p.templates.push(templateFrom(p,'racks','rack-pacos-0','Bastidor municipal de acesso · PoE / UPS / PDU'));validate(p);return p;
}
