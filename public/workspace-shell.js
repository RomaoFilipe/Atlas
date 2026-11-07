import {organizationGroups} from './organization.js';
import {escapeHTML as e} from './model.js';

export function spaceTree(project,{siteFilter='',floorId='',roomId=''}={},expanded=new Set()){
 const currentFloor=project.floors.find(f=>f.id===floorId),siteId=currentFloor?.site||siteFilter,active=project.sites.find(s=>s.id===siteId),floorsBySite=new Map(),roomsByFloor=new Map(),devicesByRoom=new Map();
 for(const f of project.floors){if(!floorsBySite.has(f.site))floorsBySite.set(f.site,[]);floorsBySite.get(f.site).push(f);}
 for(const r of project.rooms){if(!roomsByFloor.has(r.floor))roomsByFloor.set(r.floor,[]);roomsByFloor.get(r.floor).push(r);}
 for(const d of project.devices)devicesByRoom.set(d.room,(devicesByRoom.get(d.room)||0)+1);
 const renderSite=site=>{
 const floors=floorsBySite.get(site.id)||[];
 return `<details data-tree-key="${e(site.id)}" ${expanded.has(site.id)||siteId===site.id?'open':''}><summary><span>${e(site.name)}</span><small>${floors.length} pisos</small></summary><button class="tree-building" data-tree-site="${e(site.id)}">Ver edifício em 3D</button>${floors.map(f=>`<details data-tree-key="${e(f.id)}" ${expanded.has(f.id)||floorId===f.id?'open':''}><summary><span>${e(f.name)}</span><small>${(roomsByFloor.get(f.id)||[]).length} salas</small></summary><button data-tree-floor="${e(f.id)}" aria-current="${floorId===f.id&&!roomId?'location':'false'}">Planta completa do piso</button>${(roomsByFloor.get(f.id)||[]).map(r=>`<button data-tree-room="${e(r.id)}" aria-current="${roomId===r.id?'location':'false'}"><span>${e(r.name)}</span><small>${devicesByRoom.get(r.id)||0}</small></button>`).join('')||'<p class="tree-empty">Ainda sem salas</p>'}</details>`).join('')||'<p class="tree-empty">Adicione o primeiro piso em Organizar espaços.</p>'}</details>`;
 };
 if(!project.sites.some(s=>s.branch))return '<button class="tree-campus" data-tree-campus>⌘ Todos os locais</button>'+project.sites.map(renderSite).join('');
 return '<button class="tree-campus" data-tree-campus>Empresa e todas as unidades</button>'+organizationGroups(project).map(group=>{
 const key='country-'+group.country;
 return `<details class="tree-country" data-tree-key="${e(key)}" ${expanded.has(key)||active?.branch?.country===group.country?'open':''}><summary><span>${e(group.name)}</span><small>${group.units.length} unidades</small></summary>${group.units.map(unit=>{const unitKey='unit-'+group.country+'-'+unit.unit;return `<details class="tree-unit" data-tree-key="${e(unitKey)}" ${expanded.has(unitKey)||active?.branch?.country===group.country&&active?.branch?.unit===unit.unit?'open':''}><summary><span>${e(unit.unit||'Sem unidade')}</span><small>${unit.sites.length} edifícios</small></summary>${unit.sites.map(renderSite).join('')}</details>`;}).join('')}</details>`;
 }).join('');
}

export function initWorkspaceShell(app){
 const $=s=>document.querySelector(s),body=document.body;body.classList.add('workspace-clean');
 const tree=document.createElement('nav');tree.id='spaceTree';tree.setAttribute('aria-label','Edifícios, pisos e salas');$('#locations').hidden=true;$('#locations').after(tree);
 tree.onclick=ev=>{const b=ev.target.closest('button');if(!b)return;if(b.hasAttribute('data-tree-campus')){if(app.get().project.sites.some(s=>s.branch))app.openTool('organization');else app.campus();}else if(b.dataset.treeRoom)app.openRoom(b.dataset.treeRoom);else if(b.dataset.treeFloor)app.openFloor(b.dataset.treeFloor);else if(b.dataset.treeSite)app.openSite(b.dataset.treeSite);body.classList.remove('open-navigation');};
 // Keep a single compact command row. Secondary tools remain available in one menu.
 const menu=document.createElement('details');menu.id='mapOptions';menu.className='dropdown';menu.innerHTML='<summary>Ferramentas <span>⌄</span></summary><div class="dropdown-body"></div>';
 $('.map-location-menu').hidden=true;
 const command=$('.map-commandbar');command.insertBefore(menu,$('.history-buttons'));
 const menuBody=menu.lastElementChild;menuBody.append($('#mapTools'));menuBody.append($('.plan-layer-menu'));menuBody.append($('.plan-export-menu'));
 const secondary=document.createElement('div');secondary.className='secondary-views';secondary.innerHTML='<span>Vistas técnicas</span>';secondary.append($('#rackMode'),$('#logical'));menuBody.append(secondary);
 $('.map-views').append(menu);$('.map-views').append($('#expandMap'));
 const context=document.createElement('div');context.id='mapContext';context.innerHTML='<div><nav id="mapContextPath" aria-label="Localização aberta"></nav><strong id="mapContextName"></strong></div><div class="context-actions"><button id="contextAddRoom">＋ Sala</button><button id="contextEditRoom">Editar sala</button><button id="contextEquipment" class="primary">＋ Equipamento</button></div>';$('#mapWorkspace').prepend(context);
 $('#contextAddRoom').onclick=()=>app.addRoom();$('#contextEditRoom').onclick=()=>app.editRoom();$('#contextEquipment').onclick=()=>app.edit('devices');
 // Lists belong below the canvas, not between navigation and the map.
 $('#mapWorkspace').after($('#roomWorkspace'));
 const report=document.createElement('details');report.id='projectSummary';report.innerHTML='<summary>Resumo do projeto</summary>';report.append($('.stats'));$('#projectMenu .dropdown-body').append(report);
 const historyButton=document.createElement('button');historyButton.id='openProjectHistory';historyButton.textContent='Histórico de alterações';historyButton.onclick=()=>app.openTool('versions');$('#projectMenu .dropdown-body').prepend(historyButton);
 $('#workspaceSearch').classList.add('compact-search');$('#workspaceSubtitle').hidden=true;
 $('#navigationPanel h1').textContent='Navegação';$('#organiseSpaces').textContent='Gerir pisos e salas';$('#structureTools summary').textContent='Configuração avançada';
 // Search remains available globally without taking a full toolbar from the map.
 $('body>header').insertBefore($('#workspaceSearch'),$('.header-actions'));
 $('#addMenu summary').innerHTML='<span aria-hidden="true">＋</span> Adicionar <span aria-hidden="true">⌄</span>';$('#mapToolHint').hidden=true;
 // A single toolbar: view, direct manipulation, create, and secondary actions.
 const views=$('.map-views');views.hidden=true;
 const toolbar=document.createElement('div');toolbar.className='map-toolbar';toolbar.setAttribute('role','group');toolbar.setAttribute('aria-label','Controlos do mapa');command.before(toolbar);
 const viewPicker=document.createElement('details');viewPicker.id='mapViewPicker';viewPicker.className='dropdown';viewPicker.innerHTML='<summary><span data-current-view>Campus 3D</span><span aria-hidden="true">⌄</span></summary><div class="dropdown-body"></div>';
 viewPicker.lastElementChild.append($('#physical'),$('#planMode'),$('#rackMode'),$('#logical'));toolbar.append(viewPicker);
 const modes=$('.map-mode-buttons');toolbar.append(modes);
 const symbols={navigate:'<path d="m5 3 13 8-6 1-3 6z"/>',move:'<path d="M10 2v16M2 10h16M7 5l3-3 3 3M7 15l3 3 3-3M5 7l-3 3 3 3M15 7l3 3-3 3"/>',connect:'<path d="m8 12 4-4M7 14l-1 1a3 3 0 0 1-4-4l4-4a3 3 0 0 1 4 0M13 6l1-1a3 3 0 0 1 4 4l-4 4a3 3 0 0 1-4 0"/>'};
 for(const button of modes.querySelectorAll('button')){const label={navigate:'Navegar',move:'Mover',connect:'Ligar'}[button.dataset.mapAction];button.title=label;button.setAttribute('aria-label',label);button.innerHTML='<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+symbols[button.dataset.mapAction]+'</svg>';}
 const spacer=document.createElement('span');spacer.className='map-toolbar-spacer';toolbar.append(spacer);
 toolbar.append($('#addMenu'),$('.history-buttons'),$('#mapOptions'));
 $('#mapOptions>summary').innerHTML='<span aria-hidden="true">···</span>';$('#mapOptions>summary').title='Mais opções';$('#mapOptions>summary').setAttribute('aria-label','Mais opções do mapa');
 const extra=document.createElement('div');extra.className='map-extra-actions';extra.append($('#mapEditSelection'),$('#expandMap'),$('#finishMapAction'));menuBody.prepend(extra);secondary.remove();
 menuBody.append($('.context-actions')); // Contextual actions remain available without another row of buttons.
 $('#expandMap').textContent='Ampliar / recolher mapa';$('#mapEditSelection').textContent='Editar seleção';
 $('.history-buttons').setAttribute('role','group');$('.history-buttons').setAttribute('aria-label','Histórico de alterações');
 command.hidden=true;
 const navigation=document.createElement('div');navigation.className='map-navigation-actions';navigation.innerHTML='<button type="button" id="mapShowAll">Mostrar tudo</button><button type="button" id="mapCentreSelection" title="Abrir a localização e centrar o objeto selecionado">Centrar seleção</button><button type="button" id="mapDuplicateRoom">Duplicar sala</button><button type="button" id="mapSaveRoomTemplate">Guardar modelo</button>';context.append(navigation);
 $('#mapShowAll').onclick=()=>app.showAll();$('#mapCentreSelection').onclick=()=>app.centreSelection();$('#mapDuplicateRoom').onclick=()=>app.duplicateRoom();$('#mapSaveRoomTemplate').onclick=()=>app.saveRoomTemplate();
 const useRoomTemplate=document.createElement('button');useRoomTemplate.id='useRoomTemplate';useRoomTemplate.textContent='A partir de um modelo de sala…';useRoomTemplate.onclick=()=>app.openTool('templates');$('#addMenu .dropdown-body').append(useRoomTemplate);
 $('#mapContextPath').onclick=event=>{const button=event.target.closest('button');if(!button)return;if(button.hasAttribute('data-path-campus'))app.showAll();else if(button.dataset.pathSite)app.openSite(button.dataset.pathSite);else if(button.dataset.pathFloor)app.openFloor(button.dataset.pathFloor);};


 const refresh=()=>{const state=app.get(),p=state.project,f=p.floors.find(f=>f.id===state.floorId),r=p.rooms.find(r=>r.id===state.roomId),s=p.sites.find(s=>s.id===(f?.site||state.siteFilter));const expanded=new Set([...tree.querySelectorAll('details[open]')].map(d=>d.dataset.treeKey));tree.innerHTML=spaceTree(p,state,expanded);
 $('[data-current-view]').textContent=({physical:'Campus 3D',plan:'Planta 2D',rack:'Bastidor 3D',logical:'Redes'})[state.mode]||'Vista';
 $('#mapContextPath').innerHTML='<button type="button" data-path-campus>Todo o projeto</button>'+(s?'<span aria-hidden="true">/</span><button type="button" data-path-site="'+e(s.id)+'">'+e(s.name)+'</button>':'')+(f?'<span aria-hidden="true">/</span><button type="button" data-path-floor="'+e(f.id)+'">'+e(f.name)+'</button>':'')+(r?'<span aria-hidden="true">/</span><span aria-current="location">'+e(r.name)+'</span>':'');$('#mapDuplicateRoom').hidden=!r;$('#mapSaveRoomTemplate').hidden=!r;$('#mapSaveRoomTemplate').disabled=!state.ready;$('#mapDuplicateRoom').disabled=!state.ready;$('#mapCentreSelection').disabled=!p[state.selected.type]?.some(item=>item.id===state.selected.id);$('#mapContextName').textContent=r?.name||f?.name||s?.name||'Campus';$('#contextAddRoom').hidden=!f||!!r;$('#contextEditRoom').hidden=!r;$('#contextEquipment').hidden=!r;$('#contextAddRoom').disabled=!state.ready;$('#contextEquipment').disabled=!state.ready;
 $('.plan-layer-menu').hidden=state.mode!=='plan';$('#mapOptions').querySelector('.plan-export-menu').hidden=state.mode!=='plan';
 // Long undo descriptions belong in the accessible label, not a 34px button.
 for(const [id,label,icon] of [['undo','Desfazer','↶'],['redo','Refazer','↷']]){const button=$('#'+id),description=button.textContent;button.title=description;button.setAttribute('aria-label',description);button.textContent=icon;}
 };
 return {refresh};
}
