import {clone,validate,uid,TYPES,escapeHTML as e} from './model.js';
import {readCSVTable,normalizeColumn} from './csv-table.js';
import {roomContext} from './room-actions.js';
import {defaultPortCount,rackTypes} from './equipment.js';
import {placement} from './plan-editing.js';
import {floorFootprint,canAlign} from './move-alignment.js';
import {positionLock,assertLayoutChange} from './map-locks.js';
import {moveRoomDevices} from './room-planner.js';
import {beginForm,mayDiscard} from './ux-feedback.js';

const aliases={name:'nome',hostname:'nome',device:'nome',equipamento:'nome',type:'tipo',ipaddress:'ip',enderecoip:'ip',vlanid:'vlan',model:'modelo',fabricante:'modelo',serial:'serie',serialnumber:'serie',numerodeserie:'serie',numeroserie:'serie',owner:'responsavel',country:'pais',unit:'unidade',building:'edificio',floor:'piso',room:'sala',rack:'bastidor',units:'alturau',height:'alturau',portcount:'portas',state:'estado',status:'estado'};
const columns=new Set(['id','nome','tipo','ip','vlan','modelo','serie','responsavel','pais','unidade','edificio','piso','sala','bastidor','u','alturau','portas','estado']);
const canonical=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
export function parseEquipmentTable(source){
 const table=readCSVTable(source),headers=table.headers.map(h=>aliases[normalizeColumn(h)]||normalizeColumn(h));
 if(!headers.includes('nome')||!headers.includes('tipo'))throw new Error('A tabela precisa das colunas Nome e Tipo.');
 const recognized=headers.filter(h=>columns.has(h));if(new Set(recognized).size!==recognized.length)throw new Error('A tabela contém colunas de equipamento repetidas.');
 return {rows:table.rows.map((cells,i)=>{if(cells.length!==headers.length)throw new Error('Linha '+table.lines[i]+': o número de colunas não corresponde ao cabeçalho.');return Object.fromEntries([['_line',table.lines[i]],...headers.filter(h=>columns.has(h)).map(h=>[h,cells[headers.indexOf(h)]])]);}),ignored:table.headers.filter((h,i)=>!columns.has(headers[i]))};
}
export function importRoom(project,row,defaultRoomId=''){
 const base=project.rooms.find(r=>r.id===defaultRoomId),explicit=['pais','unidade','edificio','piso','sala'].some(k=>row[k]);
 if(!explicit){if(!base)throw new Error('Escolha uma sala de destino ou inclua Edificio, Piso e Sala na tabela.');return roomContext(project,base.id);}
 if(!row.sala)throw new Error('Indique a Sala para esta localização.');
 const ancestor=['pais','unidade','edificio'].some(k=>row[k]),baseFloor=base&&project.floors.find(f=>f.id===base.floor);
 const candidates=project.rooms.filter(room=>{const floor=project.floors.find(f=>f.id===room.floor),site=project.sites.find(s=>s.id===floor?.site);if(!floor||!site)return false;
 return canonical(room.name)===canonical(row.sala)&&(!row.piso||canonical(floor.name)===canonical(row.piso))&&(!row.edificio||canonical(site.name)===canonical(row.edificio))&&(!row.pais||canonical(site.branch?.country)===canonical(row.pais))&&(!row.unidade||canonical(site.branch?.unit)===canonical(row.unidade))&&(ancestor||!baseFloor||floor.site===baseFloor.site)&& (row.piso||ancestor||!baseFloor||floor.id===baseFloor.id);});
 if(candidates.length!==1)throw new Error(candidates.length?'Localização ambígua. Indique País, Unidade, Edificio, Piso e Sala.':'Sala não encontrada. Confirme os nomes de localização.');
 return roomContext(project,candidates[0].id);
}
function freeRackUnit(project,rack,height){for(let u=1;u+height-1<=rack.units;u++)if(!project.devices.some(d=>d.rack===rack.id&&u<d.u+d.units&&u+height>d.u))return u;throw new Error('O bastidor não tem unidades U livres suficientes.');}
function placeImported(project,device,room,site){
 const lock=positionLock(project,'rooms',room.id);if(lock)throw new Error('Sala protegida por '+lock.name+'.');
 const working={...project,devices:[...project.devices,device]};let attempts=0;
 for(let z=site.z+room.z-room.d/2+.3;z<site.z+room.z+room.d/2;z+=.4)for(let x=site.x+room.x-room.w/2+.3;x<site.x+room.x+room.w/2;x+=.4){if(++attempts>1800)throw new Error('Não foi encontrada uma posição livre. Aumente a sala ou divida o lote.');const target=placement(working,device,x,z,{snap:false}),bounds=floorFootprint(device,x,z),rackHit=canAlign(device)&&project.racks.some(r=>r.floor===device.floor&&bounds.minX<site.x+r.x+.6&&bounds.maxX>site.x+r.x-.6&&bounds.minZ<site.z+r.z+.6&&bounds.maxZ>site.z+r.z-.6);const outsideBuilding=bounds.minX<site.x-site.w/2||bounds.maxX>site.x+site.w/2||bounds.minZ<site.z-site.d/2||bounds.maxZ>site.z+site.d/2;if(!target.outside&&!outsideBuilding&&!target.overlaps.length&&!rackHit){Object.assign(device,{x:target.x,z:target.z,rotation:target.rotation});return;}}
 throw new Error('A sala não tem espaço livre suficiente para este equipamento.');
}
export function planEquipmentImport(project,rows,{defaultRoomId=''}={}){
 if(!Array.isArray(rows)||!rows.length||rows.length>200)throw new Error('Importe entre 1 e 200 equipamentos de cada vez.');
 if(project.devices.length+rows.length>10000)throw new Error('Este lote excede o limite atual de 10 000 equipamentos por projeto.');
 const next=clone(project),created=[],errors=[];
 for(const [index,row] of rows.entries()){
 let device;
 try{
  const normalized=canonical(row.tipo),type=TYPES.find(t=>canonical(t)===normalized)||({pc:'Computador',laptop:'Portátil',ap:'Wi-Fi',socket:'Tomada de rede',printer:'Impressora'})[normalized];
  if(!type||type==='VM')throw new Error('Escolha um tipo físico válido. As VMs são configuradas no servidor anfitrião.');
  const name=String(row.nome||'').trim();if(!name||name.length>100)throw new Error('Indique um nome até 100 caracteres.');
  const {room,floor,site}=importRoom(next,row,defaultRoomId),lock=positionLock(next,'rooms',room.id);if(lock)throw new Error('Sala protegida por '+lock.name+'.');
  if(next.devices.some(d=>d.site===site.id&&canonical(d.name)===canonical(name)))throw new Error('Já existe um equipamento com este nome neste edifício.');
  if(row.serie&&next.devices.some(d=>d.record?.serial&&canonical(d.record.serial)===canonical(row.serie)))throw new Error('O número de série já existe no inventário.');
  const vlan=Number(row.vlan||0);if(!Number.isInteger(vlan)||vlan!==0&&!next.nets.some(n=>n.id===vlan))throw new Error('VLAN inexistente. Crie primeiro a rede ou deixe a VLAN vazia.');
  device={id:uid('dev'),name,type,site:site.id,floor:floor.id,room:room.id,rack:'',host:'',ip:row.ip||'',gateway:'',vlan,model:row.modelo||'',role:'',portCount:row.portas?Number(row.portas):defaultPortCount(type),u:1,units:1,x:site.x+room.x,z:site.z+room.z,y:type==='Posto de trabalho'?0:.6,rotation:0};
  if(type==='Mini-switch')device.uplinkPort='P1';
  if(row.estado&&!['Em serviço','Em reserva','Em manutenção','Abatido'].some(state=>canonical(state)===canonical(row.estado)))throw new Error('Estado: Em serviço, Em reserva, Em manutenção ou Abatido.');
  if(row.serie||row.responsavel||row.estado)device.record={serial:row.serie||'',owner:row.responsavel||'',...(row.estado?{state:['Em serviço','Em reserva','Em manutenção','Abatido'].find(state=>canonical(state)===canonical(row.estado))}:{})};
  if(row.bastidor){if(!rackTypes.includes(type))throw new Error('Este tipo não pode ser instalado num bastidor.');const racks=next.racks.filter(r=>r.floor===floor.id&&r.room===room.id&&canonical(r.name)===canonical(row.bastidor));if(racks.length!==1)throw new Error('Bastidor inexistente ou ambíguo nesta sala.');const rack=racks[0];device.rack=rack.id;device.units=Number(row.alturau||1);if(!Number.isInteger(device.units)||device.units<1||device.units>20)throw new Error('Altura U: escolha um inteiro entre 1 e 20.');device.u=row.u?Number(row.u):freeRackUnit(next,rack,device.units);}
  else{if(row.u||row.alturau)throw new Error('Indique o Bastidor para usar U ou Altura U.');placeImported(next,device,room,site);}
  next.devices.push(device);validate(next);created.push(device);
 }catch(error){if(device)next.devices=next.devices.filter(d=>d.id!==device.id);errors.push({line:row._line||index+2,message:error.message,name:row.nome||''});}
 }
 if(errors.length)return {project:null,created:[],errors};
 return {project:next,created,errors:[]};
}
const sample='Nome;Tipo;IP;VLAN;Modelo;Serie;Responsavel\nPC-001;Computador;;;;;Equipa TI\nIMP-001;Impressora;;;;;Equipa TI';
export function planEquipmentSync(project,rows,{defaultRoomId='',decisions={},reviewOnly=false}={}){
 if(!Array.isArray(rows)||!rows.length||rows.length>200)throw Error('Importe entre 1 e 200 equipamentos de cada vez.');
 const next=clone(project),created=[],updated=[],ignored=[],errors=[],moves=[],seen=new Set();
 for(const [index,row] of rows.entries()){
  try{
   const byId=row.id?next.devices.find(d=>d.id===row.id):null;
   if(row.id&&!byId)throw Error('ID inexistente. Retire o ID apenas se pretende criar um equipamento novo.');
   const matches=row.serie?next.devices.filter(d=>canonical(d.record?.serial)===canonical(row.serie)):[];
   if(matches.length>1||byId&&matches.some(d=>d.id!==byId.id))throw Error('ID e número de série identificam equipamentos diferentes ou ambíguos.');
   const device=byId||matches[0];
   if(!device){const plan=planEquipmentImport(next,[row],{defaultRoomId});if(plan.errors.length)throw Error(plan.errors[0].message);Object.assign(next,plan.project);created.push(...plan.created);seen.add(plan.created[0].id);continue;}
   if(seen.has(device.id))throw Error('O mesmo equipamento aparece mais de uma vez no lote.');seen.add(device.id);
   const before=clone(device),normalized=canonical(row.tipo),type=TYPES.find(t=>canonical(t)===normalized)||({pc:'Computador',laptop:'Portátil',ap:'Wi-Fi',socket:'Tomada de rede',printer:'Impressora'})[normalized];
   if(type!==device.type)throw Error('A atualização não altera o tipo. Reveja a ficha do equipamento.');
   if(device.type==='VM')throw Error('As VMs são configuradas através do servidor anfitrião.');
   const name=String(row.nome||'').trim();if(!name||name.length>100)throw Error('Indique um nome até 100 caracteres.');
   const location=['pais','unidade','edificio','piso','sala'].some(k=>row[k]),destination=location?importRoom(next,row,defaultRoomId):null;
   if(destination&&destination.room.id!==device.room){
    const lock=positionLock(next,'devices',device.id);if(lock)throw Error('Posição protegida por '+lock.name+'.');
    const affected=next.links.filter(l=>l.a===device.id||l.b===device.id);
    moves.push({id:device.id,name:device.name,from:device.room,to:destination.room.id,links:affected.map(l=>({id:l.id,label:l.label||l.id}))});
    const choices={};for(const link of affected){const choice=decisions[link.id];if(!reviewOnly&&!['keep','disconnect'].includes(choice))throw Error('Reveja cada cabo da mudança de localização.');choices[link.id]=choice||'keep';}
    moveRoomDevices(next,[device.id],destination.room.id,choices);
    const shadow={...next,devices:next.devices.filter(d=>d.id!==device.id)};placeImported(shadow,device,destination.room,destination.site);
    for(const vm of next.devices.filter(d=>d.host===device.id)){vm.x=device.x;vm.z=device.z;}
   }
   device.name=name;
   if(next.devices.some(d=>d.id!==device.id&&d.site===device.site&&canonical(d.name)===canonical(name)))throw Error('Já existe um equipamento com este nome neste edifício.');
   for(const [column,key] of [['ip','ip'],['modelo','model']])if(Object.hasOwn(row,column))device[key]=row[column];
   if(Object.hasOwn(row,'vlan')){const vlan=Number(row.vlan||0);if(!Number.isInteger(vlan)||vlan!==0&&!next.nets.some(n=>n.id===vlan))throw Error('VLAN inexistente.');device.vlan=vlan;}
   for(const [column,key] of [['serie','serial'],['responsavel','owner']])if(Object.hasOwn(row,column))device.record={...device.record,[key]:row[column]};
   if(row.estado){const state=['Em serviço','Em reserva','Em manutenção','Abatido'].find(s=>canonical(s)===canonical(row.estado));if(!state)throw Error('Estado inválido.');device.record={...device.record,state};}
   if(Object.hasOwn(row,'portas')&&row.portas&&Number(row.portas)!==device.portCount)throw Error('Altere a quantidade de portas na ficha, após rever os cabos.');
   if(row.bastidor||row.u||row.alturau){const rack=next.racks.find(r=>r.id===device.rack);if(row.bastidor&&canonical(row.bastidor)!==canonical(rack?.name)||row.u&&Number(row.u)!==device.u||row.alturau&&Number(row.alturau)!==device.units)throw Error('Reveja mudanças de bastidor e unidades U na ficha do equipamento.');}
   validate(next);assertLayoutChange(project,next);
   const fields=Object.keys(device).filter(key=>JSON.stringify(device[key])!==JSON.stringify(before[key]));
   if(fields.length)updated.push({before,device:clone(device),fields});else ignored.push(clone(device));
  }catch(error){errors.push({line:row._line||index+2,name:row.nome||'',message:error.message});}
 }
 if(errors.length)return{project:null,created:[],updated:[],ignored:[],moves,errors};
 return{project:next,created,updated,ignored,moves,errors};
}
export function initEquipmentImport(app){
 const dialog=document.createElement('dialog');dialog.id='equipmentImportDialog';dialog.className='equipment-import-dialog';dialog.setAttribute('aria-labelledby','equipmentImportTitle');document.body.append(dialog);
 let reviewed=null,snapshot='';
 function close(){if(mayDiscard(dialog))dialog.close();}
 dialog.addEventListener('cancel',ev=>{ev.preventDefault();close();});
 function open(){if(!app.get().ready)return;reviewed=null;const p=app.get().project,scope=app.scope(),selectedRoom=scope.roomId||p.rooms.find(r=>r.floor===scope.floorId)?.id||'';
 dialog.innerHTML=`<form><div class="dialog-head"><div><div class="eyebrow">INVENTÁRIO EM LOTE</div><h2 id="equipmentImportTitle">Importar equipamentos</h2></div><button type="button" data-import-close aria-label="Fechar">×</button></div><div class="organization-body"><p>Importe uma tabela de Excel ou CSV. Reveja os equipamentos e as localizações antes de aplicar. Escolha adicionar novos equipamentos ou atualizar por ID / número de série. Campos presentes mas vazios limpam o valor; colunas ausentes são preservadas. As ligações são revistas nas mudanças de sala.</p><section data-import-input><label class="form-field">Operação<select name="importMode"><option value="add">Adicionar novos equipamentos</option><option value="sync">Adicionar e atualizar por ID / série</option></select></label><label class="form-field">Sala de destino para linhas sem localização<select name="defaultRoom"><option value="">Usar a localização indicada em cada linha</option>${p.rooms.map(r=>{const f=p.floors.find(f=>f.id===r.floor),s=p.sites.find(s=>s.id===f?.site);return `<option value="${e(r.id)}" ${r.id===selectedRoom?'selected':''}>${e([s?.branch?.country,s?.branch?.unit,s?.name,f?.name,r.name].filter(Boolean).join(' / '))}</option>`;}).join('')}</select></label><div class="organization-actions"><label>Carregar CSV / TSV<input type="file" data-import-file accept=".csv,.tsv,text/csv,text/tab-separated-values"></label><button type="button" data-import-example>Preencher exemplo editável</button><button type="button" data-import-template>Descarregar modelo CSV</button></div><label class="form-field">Tabela de equipamentos<textarea name="table" rows="9" maxlength="100000" spellcheck="false" placeholder="${e(sample)}"></textarea></label><details><summary>Colunas e tipos aceites</summary><p>Obrigatórias: Nome e Tipo. Para atualizar: ID ou Serie. Opcionais: IP, VLAN, Modelo, Serie, Responsavel, Estado, Pais, Unidade, Edificio, Piso, Sala, Bastidor, U, Altura U e Portas. Aceita também cabeçalhos em inglês, como Name, Type e Serial.</p><p>Tipos físicos: ${e(TYPES.filter(type=>type!=='VM').join(', '))}. Use apenas VLANs já criadas. Para importar para várias salas, indique a localização em cada linha.</p><p>As posições são sugeridas em espaços livres. Confirme-as na planta. Se uma sala estiver cheia, divida o lote por outras salas ou ajuste as medidas.</p></details></section><section data-import-review hidden></section><div data-import-error role="alert"></div></div><div class="dialog-actions"><button type="button" data-import-back>Cancelar</button><button type="submit" class="primary" data-import-next>Validar e rever</button></div></form>`;
 const f=dialog.querySelector('form'),error=dialog.querySelector('[data-import-error]'),input=dialog.querySelector('[data-import-input]'),review=dialog.querySelector('[data-import-review]'),next=dialog.querySelector('[data-import-next]'),back=dialog.querySelector('[data-import-back]');
 function reset(){reviewed=null;input.hidden=false;review.hidden=true;next.textContent='Validar e rever';back.textContent='Cancelar';error.textContent='';}
 dialog.querySelector('[data-import-close]').onclick=close;back.onclick=()=>reviewed?reset():close();
 dialog.querySelector('[data-import-example]').onclick=()=>{f.elements.table.value=sample;f.elements.table.dispatchEvent(new Event('input',{bubbles:true}));};
 dialog.querySelector('[data-import-template]').onclick=()=>{const url=URL.createObjectURL(new Blob(['\uFEFF'+sample],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='atlas-equipamentos.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);};
 dialog.querySelector('[data-import-file]').onchange=async ev=>{try{const file=ev.target.files[0];if(!file)return;if(file.size>100000)throw new Error('Use um ficheiro até 100 KB.');f.elements.table.value=await file.text();f.elements.table.dispatchEvent(new Event('input',{bubbles:true}));error.textContent='Tabela carregada. Valide antes de importar.';}catch(err){error.textContent=err.message;}};
 f.onsubmit=ev=>{ev.preventDefault();error.textContent='';try{
 if(!reviewed){const parsed=parseEquipmentTable(f.elements.table.value),sync=f.elements.importMode.value==='sync',planner=sync?planEquipmentSync:planEquipmentImport,plan=planner(app.get().project,parsed.rows,{defaultRoomId:f.elements.defaultRoom.value,reviewOnly:true});if(plan.errors.length){error.innerHTML='<p>Nenhum equipamento foi importado. Corrija as linhas indicadas:</p><ul>'+plan.errors.map(item=>`<li>Linha ${item.line} · ${e(item.name)}: ${e(item.message)}</li>`).join('')+'</ul>';return;}
 reviewed={plan,rows:parsed.rows,defaultRoomId:f.elements.defaultRoom.value,sync};snapshot=JSON.stringify(app.get().project);input.hidden=true;review.hidden=false;next.textContent=sync?'Aplicar lote revisto':'Importar '+plan.created.length+' equipamentos';back.textContent='Voltar';review.innerHTML=`<h3>${plan.created.length} equipamentos prontos para importar</h3><p>As portas serão criadas com as quantidades indicadas ou com os valores padrão do tipo. As ligações ficam por configurar. Pode desfazer este lote.</p>${parsed.ignored.length?`<p>Colunas ignoradas: ${e(parsed.ignored.join(', '))}</p>`:''}<div class="import-preview-list">${plan.created.map(d=>{const {site,floor,room}=roomContext(plan.project,d.room);return `<article><strong>${e(d.name)} · ${e(d.type)}</strong><span>${e([site.branch?.unit,site.name,floor.name,room.name].filter(Boolean).join(' / '))}</span><small>${e(d.ip||'Sem IP')} · ${d.portCount} portas${d.rack?' · '+e(plan.project.racks.find(r=>r.id===d.rack)?.name)+' / U'+d.u:''}</small></article>`;}).join('')}</div>`;
 if(sync){const section=document.createElement('section');section.innerHTML='<h3>Atualização de inventário</h3><p>'+plan.updated.length+' alterados · '+plan.ignored.length+' sem alterações</p>'+plan.updated.map(item=>'<article><strong>'+e(item.device.name)+'</strong><p>Campos: '+e(item.fields.join(', '))+'</p></article>').join('');for(const move of plan.moves){const heading=document.createElement('p');heading.textContent=move.name+': '+(p.rooms.find(r=>r.id===move.from)?.name||'Sem sala')+' → '+(p.rooms.find(r=>r.id===move.to)?.name||'Sala');section.append(heading);for(const link of move.links){if(section.querySelector('[data-sync-link="'+CSS.escape(link.id)+'"]'))continue;const label=document.createElement('label');label.className='form-field';label.textContent='Cabo '+link.label;const select=document.createElement('select');select.dataset.syncLink=link.id;select.innerHTML='<option value="">Escolher…</option><option value="keep">Manter ligação documental</option><option value="disconnect">Desligar cabo</option>';label.append(select);section.append(label);}}review.append(section);}return;}
 if(snapshot!==JSON.stringify(app.get().project)){reset();throw new Error('O projeto mudou. Valide novamente antes de aplicar.');}
 const values=reviewed,decisions=Object.fromEntries([...review.querySelectorAll('[data-sync-link]')].map(el=>[el.dataset.syncLink,el.value]));
 if(app.mutate(p=>{const plan=(values.sync?planEquipmentSync:planEquipmentImport)(p,values.rows,{defaultRoomId:values.defaultRoomId,decisions});if(plan.errors.length)throw new Error(plan.errors.map(item=>'Linha '+item.line+': '+item.message).join('\n'));Object.assign(p,plan.project);},values.sync?'atualizar inventário por CSV':'importar '+values.plan.created.length+' equipamentos')){beginForm(dialog);dialog.close();app.status(values.plan.created.length+' criados'+(values.sync?' · '+values.plan.updated.length+' atualizados':'')+'. Reveja as posições e ligações na planta.');}
 }catch(err){error.textContent=err.message;}};
 beginForm(dialog);if(!dialog.open)dialog.showModal();
 }
 let button;
 return {open,refresh(){if(!button&&document.querySelector('#inventoryAdd')){button=document.createElement('button');button.type='button';button.id='inventoryImport';button.textContent='Importar Excel / CSV';button.onclick=open;document.querySelector('#inventoryAdd').after(button);}if(button)button.disabled=!app.get().ready;}};
}
