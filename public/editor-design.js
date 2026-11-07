import {createEquipmentPreview} from './equipment-preview.js';
import {escapeHTML as e} from './model.js';
import {planSymbol} from './plan-symbols.js';
import {devicePorts} from './technical-network.js';
import {portInUse,passive,portsFor} from './network.js';

const icons={map:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zM9 3v16M15 5v16"/>',device:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M12 17v4M8 21h8"/>',link:'<path d="m9 15 6-6M9 7l2-2a5 5 0 0 1 7 7l-2 2M15 17l-2 2a5 5 0 0 1-7-7l2-2"/>',check:'<circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7"/>',document:'<path d="M6 2h8l4 4v16H6zM14 2v5h4M9 11h6M9 15h6M9 19h4"/>',layers:'<path d="m2 7 10-5 10 5-10 5Zm0 5 10 5 10-5M2 17l10 5 10-5"/>',edit:'<path d="m14 4 6 6M4 16 17 3l4 4L8 20l-5 1z"/>',export:'<path d="M12 16V2m-5 5 5-5 5 5M4 14v7h16v-7"/>',gear:'<path d="m9 3 1-2h4l1 2 3 2 3 1v4l-2 2v3l1 3-3 3-3-1h-3l-3 1-3-3 1-3v-3L2 10V6l3-1z"/><circle cx="12" cy="11" r="3"/>',port:'<path d="M3 5h18v12h-5v4H8v-4H3zM7 5v5m3-5v5m4-5v5m3-5v5"/>',power:'<path d="M8 2v5m8-5v5M5 7h14v3a7 7 0 0 1-14 0zM12 17v5"/>',plus:'<path d="M12 4v16M4 12h16"/>'};
export const editorIcon=name=>`<svg class="editor-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${icons[name]||icons.device}</svg>`;
const deviceIcon=type=>`<svg class="equipment-icon" viewBox="-24 -24 48 48" aria-hidden="true">${planSymbol(type,0,0,'currentColor')}</svg>`;

function equipmentPortrait(type){
 if(['Posto de trabalho','Computador'].includes(type))return `<svg class="portrait-equipment" viewBox="0 0 200 120" aria-hidden="true"><defs><linearGradient id="editor-screen" x2="1" y2="1"><stop stop-color="#173c4a"/><stop offset="1" stop-color="#06141d"/></linearGradient><linearGradient id="editor-frame" x2="1" y2="1"><stop stop-color="#9db1bb"/><stop offset=".45" stop-color="#263e4e"/><stop offset="1" stop-color="#7394a6"/></linearGradient></defs><ellipse cx="100" cy="110" rx="60" ry="5" fill="#020b1180"/><path d="M91 84h18l5 20H86z" fill="url(#editor-frame)"/><path d="M76 104h48l7 5H69z" fill="#6b8a9b"/><rect x="26" y="6" width="148" height="87" rx="4" fill="url(#editor-frame)" stroke="#aec6d2"/><rect x="31" y="11" width="138" height="74" rx="1" fill="url(#editor-screen)"/><path d="M32 76c28 2 48-22 75-33 22-10 36-10 61-31v72H32z" fill="#7b9f2d"/><path d="M32 79c32 0 45-13 68-12 28 0 43 13 68 7v10H32z" fill="#d4fb37"/><path d="M32 80c36-3 45-6 68-5 29 1 45 8 68 6" fill="none" stroke="#eeffbc" stroke-width="1"/><circle cx="100" cy="89" r="1" fill="#b9e9df"/></svg>`;
 if(['Switch','Mini-switch','Patch panel'].includes(type))return `<svg class="portrait-equipment" viewBox="0 0 200 120" aria-hidden="true"><path d="m18 44 18-13h132l15 13v39H18z" fill="#344f5f" stroke="#7997a8"/><rect x="18" y="44" width="165" height="39" rx="3" fill="#102732" stroke="#7997a8"/>${Array.from({length:8},(_,i)=>`<rect x="${30+i*17}" y="54" width="12" height="14" rx="1" fill="#030b10" stroke="#7da1b3"/><path d="M${33+i*17} 55v4m3-4v4m3-4v4" stroke="#adc0a1" stroke-width=".7"/>`).join('')}<path d="M28 76h142" stroke="#35586a"/></svg>`;
 return deviceIcon(type);
}

// Follow only the selected physical channel through passive F/R pairs.
export function documentedRoute(project,id){
 const first=project.links.find(link=>['copper','fiber'].includes(link.kind)&&(link.a===id||link.b===id));
 const result={devices:[id],links:[],steps:[],complete:false};if(!first)return result;
 let current=id,link=first;const visited=new Set();
 while(link&&!visited.has(link.id)){
  visited.add(link.id);result.links.push(link.id);
  const forward=link.a===current,fromPort=forward?link.portA:link.portB,next=forward?link.b:link.a,toPort=forward?link.portB:link.portA;
  if(!result.steps.length)result.steps.push({id:current,port:fromPort});
  result.devices.push(next);result.steps.push({id:next,port:toPort});
  const device=project.devices.find(item=>item.id===next);if(!device)break;
  if(!passive(device)){result.complete=true;break;}
  const pair=String(toPort).match(/^([FR])(\d+)$/i);if(!pair)break;
  current=next;link=portInUse(project,current,(pair[1].toUpperCase()==='F'?'R':'F')+pair[2]);
 }
 return result;
}

export function initEditorDesign(app){
 const equipmentPreview=createEquipmentPreview();
 const $=selector=>document.querySelector(selector),body=document.body;body.classList.add('editor-redesign');body.classList.remove('hide-selection');
 const brand=$('body>header .brand');brand.innerHTML='<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 1 39 20 20 39 1 20Z M20 9 9 20 20 31 31 20Z" fill="currentColor" fill-rule="evenodd"/></svg><span>ATLAS</span>';
 $('#search').placeholder='Procurar equipamento, IP ou sala…';
 const context=$('body>header .context');context.firstChild.textContent='';
 const projectLabel=document.createElement('div');projectLabel.className='editor-project-label';projectLabel.innerHTML=editorIcon('layers')+'<strong></strong><span class="editor-example" hidden>PROJETO DE EXEMPLO</span>';$('#primaryNavigation').before(projectLabel);
 for(const button of $('#primaryNavigation').querySelectorAll('button'))button.insertAdjacentHTML('afterbegin',editorIcon(({map:'map',inventory:'device',cables:'link',audit:'check',dossier:'document'})[button.dataset.workspace]));
 $('#navigationPanel .section-head h2').textContent='ESPAÇOS';$('#sidebarCreateBuilding').innerHTML=editorIcon('plus')+'<span>Criar edifício</span>';
 const views=document.createElement('div');views.className='editor-views';views.setAttribute('role','group');views.setAttribute('aria-label','Vista da infraestrutura');
 for(const [id,label,icon] of [['planMode','Planta 2D','map'],['physical','Campus 3D','layers'],['rackMode','Bastidor','device']]){const button=$('#'+id);button.innerHTML=editorIcon(icon)+`<span>${label}</span>`;views.append(button);}$('.main-head').append(views);
 const picker=$('#mapViewPicker summary');picker.setAttribute('aria-label','Mais vistas');picker.innerHTML='<span data-current-view class="editor-sr-only"></span><svg class="editor-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></svg>';
 const toolbar=$('.map-toolbar');toolbar.prepend($('#addMenu'));const labels={navigate:'Selecionar',move:'Mover',connect:'Ligar'};
 for(const button of $('.map-mode-buttons').querySelectorAll('button')){button.insertAdjacentHTML('beforeend',`<span>${labels[button.dataset.mapAction]}</span>`);button.setAttribute('aria-label',labels[button.dataset.mapAction]);}
 const layers=$('.plan-layer-menu');layers.classList.add('editor-layers');layers.querySelector('summary').innerHTML=editorIcon('layers')+'<span>Camadas</span><span aria-hidden="true">⌄</span>';toolbar.insertBefore(layers,$('.map-toolbar-spacer'));
 $('#mapOptions').after($('#mapViewPicker'));
 const badge=$('#saveBadge');if(badge)$('body>header').insertBefore(badge,$('.header-actions'));
 const exportButton=document.createElement('button');exportButton.id='editorExport';exportButton.innerHTML=editorIcon('export')+'<span>Exportar</span>';exportButton.onclick=()=>$('#exportProject').click();$('.header-actions').insertBefore(exportButton,$('#projectMenu'));
 const menu=$('#projectMenu summary');menu.setAttribute('aria-label','Projeto e conta');menu.innerHTML='<span class="editor-avatar" aria-hidden="true">A</span><span class="editor-project-menu-label">Projeto</span><span aria-hidden="true">⌄</span>';
 $('#toggleNavigation').innerHTML='☰';$('#toggleNavigation').setAttribute('aria-label','Abrir navegação');$('#toggleSelection').innerHTML=editorIcon('device');$('#toggleSelection').setAttribute('aria-label','Mostrar detalhes da seleção');
 const ribbon=document.createElement('div');ribbon.id='editorMapStatus';ribbon.setAttribute('role','status');ribbon.innerHTML=editorIcon('link')+'<span></span><small></small>';toolbar.after(ribbon);
 const summary=document.createElement('div');summary.className='editor-floor-meta';$('#viewTitle').after(summary);
 const dock=$('#inventory');dock.classList.add('equipment-dock');
 const dockTabs=document.createElement('div');dockTabs.className='editor-dock-tabs';dockTabs.innerHTML='<button type="button" class="active" id="editorEquipmentTab">'+editorIcon('device')+'<span>Equipamentos do piso</span><small></small></button><button type="button" id="editorLinksTab">'+editorIcon('link')+'Ligações <small></small></button>';
 dock.querySelector('.section-head').prepend(dockTabs);
 const dockToggle=document.createElement('button');dockToggle.id='editorDockToggle';dockToggle.setAttribute('aria-label','Recolher inventário');dockToggle.setAttribute('aria-expanded','true');dockToggle.setAttribute('aria-controls','inventoryTable');dockToggle.textContent='−';dock.querySelector('.section-head').append(dockToggle);
 dockToggle.onclick=()=>{const collapsed=body.classList.toggle('editor-dock-collapsed');dockToggle.textContent=collapsed?'+':'−';dockToggle.setAttribute('aria-expanded',String(!collapsed));dockToggle.setAttribute('aria-label',collapsed?'Expandir inventário':'Recolher inventário');};
 $('#editorEquipmentTab').onclick=()=>{if(body.dataset.workspace==='inventory')return;body.classList.remove('editor-dock-collapsed');dockToggle.setAttribute('aria-expanded','true');dockToggle.setAttribute('aria-label','Recolher inventário');dockToggle.textContent='−';};
 $('#editorLinksTab').onclick=()=>app.openTool('cables');
 const logical=document.createElement('button');logical.type='button';logical.textContent='Vista lógica de redes';logical.onclick=()=>$('#logical').click();$('#mapOptions>.dropdown-body').append(logical);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'){if($('#configurationGuide')?.open)$('#configurationGuide').open=false;$('.editor-layers').open=false;}});

 const quick=document.createElement('a');quick.className='editor-account-link';quick.href='/account';quick.innerHTML=editorIcon('gear')+'<span>Conta e permissões</span>';$('.sidebar-bottom').before(quick);
 const footer=document.createElement('div');footer.className='editor-sidebar-footer';$('#navigationPanel').append(footer);footer.append(quick,$('.sidebar-bottom'));
 $('#openConfigurationChat').classList.add('editor-assistant');
 for(const id of ['wanButton','operationsButton','organizationButton']){const button=$('#'+id);if(button)$('#structureTools .nav-group-body').append(button);}
 $('#mapOptions .dropdown-body').append($('#mapContext'));
 let guidePlaced=false;
 function compactTools(){
  const menu=$('#mapOptions>.dropdown-body'),add=$('#addMenu>.dropdown-body');
  for(const [selector,target] of [['.plan-library',add],['.plan-group-panel',menu],['#mapProblems',menu],['#exampleGuide',$('#structureTools .nav-group-body')]]){const node=$(selector);if(node&&node.parentElement!==target)target.append(node);}
  const cableControl=$('.plan-cable-control');if(cableControl&&cableControl.parentElement!==$('.plan-layers'))$('.plan-layers').prepend(cableControl);
  const exports=$('.plan-export-menu');if(exports&&exports.parentElement!==menu)menu.append(exports);
  const actions=$('.plan-actions'),wrap=$('.plan-edit-wrap');
  if(wrap&&!$('#editorEmptyState')){const empty=document.createElement('div');empty.id='editorEmptyState';empty.innerHTML=editorIcon('map')+'<p class="empty-eyebrow">O SEU ESPAÇO DE TRABALHO</p><h3>O seu mapa começa aqui.</h3><p>Crie o primeiro edifício. Depois adicione os pisos,<br>as salas e os equipamentos da sua infraestrutura.</p><div><button type="button" class="primary" data-empty-building>＋ Criar edifício</button><button type="button" data-empty-example>Explorar um exemplo ↗</button></div>';wrap.append(empty);empty.querySelector('[data-empty-building]').onclick=()=>app.edit('sites');empty.querySelector('[data-empty-example]').onclick=()=>app.openTool('examples');}
if(actions&&wrap&&actions.parentElement!==wrap){const choice=$('.plan-layout-choice');if(choice)menu.append(choice);wrap.append(actions);$('#planFit').textContent='⛶';$('#planFit').setAttribute('aria-label','Enquadrar mapa');$('#planFit').title='Enquadrar mapa';}
  const rotation=$('#equipmentRotation');if(rotation&&rotation.parentElement!==menu)menu.append(rotation);
  const network=$('#technicalNetwork');if(network&&!$('#editorNetworkDetails')){const group=document.createElement('details');group.id='editorNetworkDetails';group.innerHTML='<summary>Portas e cablagem do piso <span aria-hidden="true">⌄</span></summary>';network.before(group);group.append(network);}
  const room=$('#roomWorkspace');if(room&&!$('#editorRoomDetails')){const group=document.createElement('details');group.id='editorRoomDetails';group.innerHTML='<summary>Operações e equipamentos da sala <span aria-hidden="true">⌄</span></summary>';$('#inventory').after(group);group.append(room);}
  const roomDetails=$('#editorRoomDetails');if(roomDetails&&room){roomDetails.hidden=room.hidden;if(room.classList.contains('guided-connections'))roomDetails.open=true;}
 }

 const refresh=()=>{
  compactTools();
  const save=$('#saveBadge');if(save&&save.nextElementSibling!==$('.header-actions'))$('body>header').insertBefore(save,$('.header-actions'));
  const state=app.get(),p=state.project,d=p[state.selected.type]?.find(item=>item.id===state.selected.id),floor=p.floors.find(item=>item.id===state.floorId),room=p.rooms.find(item=>item.id===state.roomId);
  if(!p.sites.length)body.classList.add('hide-selection');body.classList.toggle('editor-empty',!p.sites.length);if($('#editorEmptyState')){$('#editorEmptyState').hidden=!!p.sites.length;$('#editorEmptyState [data-empty-building]').disabled=!state.ready;} body.classList.toggle('editor-plan',state.mode==='plan');body.dataset.mapTool=$('#mapInteraction').value;
  projectLabel.querySelector('strong').textContent=state.organizationName||p.name;
  projectLabel.querySelector('.editor-example').hidden=!p.exampleKey;
  quick.href='/account'+(state.organizationName?'?client='+encodeURIComponent(state.organization||''):'');
  const account=$('#projectMenu a[href^="/account"]');if(account)quick.href=account.href;
  $('#viewTitle').textContent=body.dataset.workspace==='inventory'?'Equipamentos':state.mode==='plan'?(room?.name||floor&&'Planta do '+floor.name||'Mapa da infraestrutura'):state.mode==='physical'?'Campus 3D':state.mode==='rack'?'Bastidor 3D':'Redes e ligações';
  $('.main-head .eyebrow').textContent='MAPA DA INFRAESTRUTURA';
  const scoped=p.devices.filter(item=>(!floor||item.floor===floor.id)&&(!room||item.room===room.id));
  summary.textContent=(floor?p.rooms.filter(item=>item.floor===floor.id).length+' salas':p.sites.length+' edifícios')+' · '+scoped.length+' equipamentos';
  $('#editorExport').disabled=!state.ready;$('#editorEquipmentTab span').textContent=room?'Equipamentos da sala':floor?'Equipamentos do piso':'Equipamentos do projeto';
  $('#editorEquipmentTab small').textContent=scoped.length;$('#editorLinksTab small').textContent=p.links.filter(link=>scoped.some(item=>item.id===link.a||item.id===link.b)).length;
  const mapStatus=ribbon.querySelector('span');mapStatus.textContent=state.selected.type==='devices'&&d?d.name+' · '+d.type:room?'Sala: '+room.name:floor?'Piso: '+floor.name:'Explore os espaços da sua infraestrutura';
  ribbon.querySelector('small').textContent=state.selected.type==='devices'&&d?p.links.filter(link=>link.a===d.id||link.b===d.id).length+' ligações documentadas':p.exampleKey?'DADOS DE EXEMPLO':'PROJETO DOCUMENTAL';
  const guide=$('#configurationGuide');if(guide&&!guidePlaced){$('.editor-account-link').before(guide);guide.open=false;guidePlaced=true;guide.querySelector('summary').firstChild.textContent='Configuração ';}
  if(guide){const progress=guide.querySelector('[data-guide-progress]')?.textContent||'';const done=Number(progress.split(' ')[0])||0;guide.style.setProperty('--guide-progress',done/6*100+'%');guide.style.setProperty('--guide-fraction',String(done/6));}
  // Scope the dock with the real project data; a global search still shows all matches.
  for(const row of $('#deviceRows').querySelectorAll('tr[data-id]')){
   const device=p.devices.find(item=>item.id===row.dataset.id);row.hidden=body.dataset.workspace==='map'&&!state.query&&!!device&&((!!floor&&device.floor!==floor.id)||(!!room&&device.room!==room.id));
   row.setAttribute('aria-selected',String(state.selected.type==='devices'&&state.selected.id===row.dataset.id));
   if(device){const cell=row.firstElementChild;cell.insertAdjacentHTML('afterbegin',deviceIcon(device.type));if(device.vlan)row.children[2].insertAdjacentHTML('beforeend','<small class="editor-table-vlan">VLAN '+e(device.vlan)+'</small>');}
  }
  const inspector=$('#inspector');const panelHeading=$('#selectionPanel .panel-heading>span');panelHeading.textContent=state.selected.type==='devices'?'EQUIPAMENTO SELECIONADO':'DETALHES DA SELEÇÃO';
  if(d&&state.selected.type==='devices'&&$('#selection-summary')){
   const portrait=document.createElement('div');portrait.className='editor-device-portrait';portrait.innerHTML=equipmentPortrait(d.type)+'<span>'+e(d.type)+'</span>';inspector.querySelector('h2').after(portrait);equipmentPreview.mount(portrait,p,d);
   const edit=$('#editSelected');edit.innerHTML=editorIcon('edit')+'<span>Editar</span>';edit.setAttribute('aria-label','Configurar equipamento');
   const original=$('#selection-summary>.details');if(original){const details=document.createElement('details');details.className='editor-technical-details';details.innerHTML='<summary>Todos os detalhes técnicos</summary>';original.before(details);details.append(original);}
   const overview=document.createElement('div');overview.className='editor-device-overview';
   const site=p.sites.find(item=>item.id===d.site),f=p.floors.find(item=>item.id===d.floor),r=p.rooms.find(item=>item.id===d.room);
   overview.innerHTML='<h3>LOCALIZAÇÃO</h3><p>'+e([site?.name,f?.name,r?.name].filter(Boolean).join(' / ')||'Localização por definir')+'</p><h3>REDE DOCUMENTADA</h3><dl><div><dt>IP</dt><dd>'+e(d.ip||'Por documentar')+'</dd></div><div><dt>VLAN</dt><dd>'+e(d.vlan||'Por atribuir')+'</dd></div></dl>';
   const ports=devicePorts(p,d),network=ports.filter(port=>! /^(PSU|IN$|OUT)/i.test(port.port)).sort((a,b)=>Number(!!b.link)-Number(!!a.link)).slice(0,4);
   overview.insertAdjacentHTML('beforeend','<h3>PORTAS E LIGAÇÕES</h3>');
   for(const port of network){const button=document.createElement('button');button.className='editor-port';button.dataset.networkDevice=d.id;button.dataset.networkPort=port.port;button.innerHTML=editorIcon('port')+'<b>'+e(port.port)+'</b><span class="'+(port.link?'connected':'')+'">'+e(port.other?port.other.name+' · '+port.otherPort:'Sem ligação registada')+'</span><span aria-hidden="true">›</span>';button.disabled=!state.ready;button.onclick=()=>app.cable(port.link?.id||null,port.link?{}:{a:d.id,portA:port.port});overview.append(button);}
   if(!network.length)overview.insertAdjacentHTML('beforeend','<p class="editor-muted">Sem portas físicas de rede.</p>');
   const powerPorts=portsFor(p,d,'rear').filter(port=>/^(PSU|IN$|OUT)/i.test(port)).map(port=>{const link=portInUse(p,d.id,port);return {port,link,other:link&&p.devices.find(item=>item.id===(link.a===d.id?link.b:link.a))};});const power=powerPorts.find(port=>port.link)||powerPorts[0];if(power){const button=document.createElement('button');button.className='editor-port power-port';button.dataset.networkDevice=d.id;button.dataset.networkPort=power.port;button.innerHTML=editorIcon('power')+'<b>'+e(power.port)+'</b><span>'+e(power.other?.name||'Alimentação por documentar')+'</span>';button.onclick=()=>app.cable(power.link?.id||null,power.link?{}:{a:d.id,portA:power.port,kind:'power'});button.disabled=!state.ready;overview.insertAdjacentHTML('beforeend','<h3>ALIMENTAÇÃO</h3>');overview.append(button);}
   const route=documentedRoute(p,d.id);if(route.links.length){overview.insertAdjacentHTML('beforeend','<h3>PERCURSO DO CABO</h3><ol class="editor-circuit">'+route.steps.map(step=>{const item=p.devices.find(device=>device.id===step.id);return '<li>'+deviceIcon(item?.type||'Computador')+'<span><b>'+e(item?.name||step.id)+'</b><small>'+e(step.port)+'</small></span></li>';}).join('')+'</ol>');if(!route.complete)overview.insertAdjacentHTML('beforeend','<p class="editor-muted">Continuação do percurso por documentar.</p>');const follow=document.createElement('button');follow.className='editor-follow-route';follow.textContent=route.complete?'Ver percurso completo ↗':'Ver percurso documentado ↗';follow.onclick=()=>app.showRoute(route);overview.append(follow);}
   $('#selection-summary').prepend(overview);
  }
 };
 return {refresh,decoratePlan(){
  for(const node of document.querySelectorAll('#planCanvas>svg>g>text')){const y=Number(node.getAttribute('y'));node.classList.toggle('editor-paper-meta',y===55||y===78||y>=1030);}
 },finish(){
  const quick=$('#inspector .device-quick-actions');if(quick&&$('#selection-summary')){const more=document.createElement('details');more.className='editor-device-actions';more.innerHTML='<summary>Mover, duplicar e outras ações</summary>';$('#selection-summary').append(more);more.append(quick);}
 }};
}
