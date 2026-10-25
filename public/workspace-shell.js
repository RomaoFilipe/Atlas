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
 const context=document.createElement('div');context.id='mapContext';context.innerHTML='<div><span id="mapContextPath"></span><strong id="mapContextName"></strong></div><div class="context-actions"><button id="contextAddRoom">＋ Sala</button><button id="contextEditRoom">Editar sala</button><button id="contextEquipment" class="primary">＋ Equipamento</button></div>';$('#mapWorkspace').prepend(context);
 $('#contextAddRoom').onclick=()=>app.addRoom();$('#contextEditRoom').onclick=()=>app.editRoom();$('#contextEquipment').onclick=()=>app.edit('devices');
 // Lists belong below the canvas, not between navigation and the map.
 $('#mapWorkspace').after($('#roomWorkspace'));
 const report=document.createElement('details');report.id='projectSummary';report.innerHTML='<summary>Resumo do projeto</summary>';report.append($('.stats'));$('#projectMenu .dropdown-body').append(report);
 $('#workspaceSearch').classList.add('compact-search');$('#workspaceSubtitle').hidden=true;
 $('#navigationPanel h1').textContent='Navegação';$('#organiseSpaces').textContent='Gerir pisos e salas';$('#structureTools summary').textContent='Configuração avançada';
 // Search remains available globally without taking a full toolbar from the map.
 $('body>header').insertBefore($('#workspaceSearch'),$('.header-actions'));
 $('#addMenu summary').textContent='＋ Adicionar';$('#mapToolHint').hidden=true;
 const refresh=()=>{const state=app.get(),p=state.project,f=p.floors.find(f=>f.id===state.floorId),r=p.rooms.find(r=>r.id===state.roomId),s=p.sites.find(s=>s.id===(f?.site||state.siteFilter));const expanded=new Set([...tree.querySelectorAll('details[open]')].map(d=>d.dataset.treeKey));tree.innerHTML=spaceTree(p,state,expanded);
 $('#mapContextPath').textContent=[s?.branch?.country,s?.branch?.unit,s?.name,f?.name].filter(Boolean).join(' / ')||'Todos os edifícios';$('#mapContextName').textContent=r?.name||f?.name||s?.name||'Campus';$('#contextAddRoom').hidden=!f||!!r;$('#contextEditRoom').hidden=!r;$('#contextEquipment').hidden=!r;$('#contextAddRoom').disabled=!state.ready;$('#contextEquipment').disabled=!state.ready;
 $('#mapOptions').querySelector('.plan-layer-menu').hidden=state.mode!=='plan';$('#mapOptions').querySelector('.plan-export-menu').hidden=state.mode!=='plan';
 // Long undo descriptions belong in the accessible label, not a 34px button.
 for(const [id,label,icon] of [['undo','Desfazer','↶'],['redo','Refazer','↷']]){const button=$('#'+id),description=button.textContent;button.title=description;button.setAttribute('aria-label',description);button.textContent=icon+' '+label;}
 };
 return {refresh};
}
