// Task-based navigation; move existing controls to retain their event handlers.
export const toolGroups={spaces:['spaces','mount','templates'],cables:['cables','power'],audit:['audit','simulation'],dossier:['dossier','versions'],examples:['examples']};
export function toolGroup(tab){return Object.values(toolGroups).find(group=>group.includes(tab))||[tab];}
export function inspectorSection(node,current='summary'){
 if(node.matches('.socket-panel,.inspector-group,#stationDetails,#followCable,#manageRackPower'))return 'connections';
 if(node.matches('#assignSpace,#installDevice,#saveAsTemplate,#toggleRackLock,#rackCampus'))return 'location';
 if(node.matches('#equipmentRecordButton,.details,#openRack,#addInRack,#rackInterior'))return 'summary';
 if(node.tagName==='H3'){if(/Localização/.test(node.textContent))return 'location';if(/percurso|Ligações|Portas/.test(node.textContent))return 'connections';return 'summary';}
 return current;
}
export function initWorkspaceNavigation(app){
 const $=s=>document.querySelector(s),body=document.body;let surface='map',selectedKey='',section='summary';
 const nav=document.createElement('nav');nav.id='primaryNavigation';nav.setAttribute('aria-label','Áreas do Atlas');
 nav.innerHTML=[['map','Mapa','Edifícios, pisos e salas'],['inventory','Equipamentos','Inventário e fichas'],['cables','Ligações','Cabos, portas e energia'],['audit','Verificação','Problemas e simulação'],['dossier','Documentação','Relatórios e versões']].map(([id,title,sub])=>`<button data-workspace="${id}" aria-current="${id==='map'?'page':'false'}"><b>${title}</b><small>${sub}</small></button>`).join('');
 $('#navigationPanel h1').textContent='O teu projeto';$('#navigationPanel h1').after(nav);$('#navigationPanel .section-head h2').textContent='Edifícios';
 const tools=$('#taskNavigation');tools.hidden=true;
 // Preserve controls, consolidate their entry points.
 const spaces=document.createElement('button');spaces.id='organiseSpaces';spaces.className='organise-spaces';spaces.textContent='Organizar edifícios e pisos';$('#locations').after(spaces);spaces.onclick=()=>app.openTool('spaces');
 const structure=document.createElement('details');structure.className='nav-group';structure.id='structureTools';structure.innerHTML='<summary>Estrutura e modelos</summary><div class="nav-group-body"></div>';for(const selector of ['[data-manage="sites"]','[data-manage="racks"]','[data-manage="nets"]','[data-feature="mount"]','[data-feature="templates"]'])structure.lastElementChild.append($(selector));spaces.after(structure);
 const example=$('[data-feature="examples"]');example.textContent='Explorar exemplos guiados';$('#projectMenu .dropdown-body').append(example);
 // A single search, shared by the map and inventory.
 const searchbar=document.createElement('div');searchbar.id='workspaceSearch';const label=$('label[for="search"]'),search=$('.search');label.textContent='Pesquisar equipamentos';$('#search').placeholder='Nome, IP, responsável ou número de série…';searchbar.append(label,search);searchbar.insertAdjacentHTML('beforeend','<button id="resetWorkspaceFilters" class="secondary">Limpar filtros</button><span id="workspaceScope" role="status"></span>');$('.main-head').after(searchbar);$('#resetWorkspaceFilters').onclick=()=>app.clearFilters();
 const inventory=$('#inventory');$('#toggleInventory').hidden=true;$('#inventoryTable').hidden=false;
 const actions=document.createElement('div');actions.className='inventory-actions';actions.innerHTML='<button id="inventoryAdd" class="primary">+ Equipamento</button><button id="inventoryMap">Ver seleção no mapa</button>';inventory.querySelector('.section-head').append(actions);$('#inventoryAdd').onclick=()=>app.edit('devices');$('#inventoryMap').onclick=()=>{show('map');$('#planSelection').click();};
 $('#stationFinder').textContent='Pesquisar postos e extensões';actions.append($('#stationFinder'));$('#stationFinder').classList.remove('station-shortcut');
 // Exports and secondary display choices get their own predictable menus.
 const exports=document.createElement('details');exports.className='dropdown plan-export-menu';exports.innerHTML='<summary>Exportar planta</summary><div class="dropdown-body"></div>';const exportRow=$('.plan-exports');exports.lastElementChild.append(...exportRow.children);exportRow.append(exports);
 $('#mapEditSelection').hidden=true;$('#moveObjects').closest('label').hidden=true;$('#physical').textContent='Campus 3D';$('#logical').textContent='Redes';$('#planMode').textContent='Planta 2D';$('#rackMode').textContent='Bastidor 3D';
 const creation=$('#addMenu .creation-buttons');
 const generic=creation.querySelector('[data-create="devices"]');generic.textContent='Outro equipamento…';
 for(const [type,label] of [['Mini-switch','Mini-switch'],['Tomada de rede','Tomada de rede dupla'],['Impressora','Impressora']]){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>app.edit('devices',null,{type});generic.before(b);}
 $('#addWorkstation').textContent='Posto de trabalho';creation.prepend($('#addWorkstation'));
 const toolSelect=$('#mapInteraction');toolSelect.closest('label').hidden=true;
 const modes=document.createElement('div');modes.className='map-mode-buttons';modes.setAttribute('role','group');modes.setAttribute('aria-label','Ação no mapa');modes.innerHTML=[['navigate','Explorar'],['move','Mover'],['connect','Ligar no mapa']].map(([id,label])=>'<button type="button" data-map-action="'+id+'" aria-pressed="false">'+label+'</button>').join('');toolSelect.closest('label').after(modes);
 modes.onclick=ev=>{const b=ev.target.closest('[data-map-action]');if(!b)return;toolSelect.value=b.dataset.mapAction;toolSelect.dispatchEvent(new Event('change',{bubbles:true}));};
 const finish=document.createElement('button');finish.id='finishMapAction';finish.textContent='Terminar';finish.onclick=()=>{toolSelect.value='navigate';toolSelect.dispatchEvent(new Event('change',{bubbles:true}));};modes.after(finish);
 const links=creation.querySelector('[data-create="links"]');links.textContent='Cabo entre equipamentos';links.title='Selecionar equipamentos e portas';
 const title=$('.main-head>div:first-child .eyebrow');if(title)title.textContent='PROJETO / MAPA';
 const help=document.createElement('div');help.id='workspaceGuide';help.innerHTML='<strong>Começa pelo espaço, depois pelos equipamentos.</strong><span>Escolhe um edifício e um piso. Seleciona um objeto para consultar a ficha ou as ligações.</span><button id="guideSpaces">Organizar espaços</button><button id="guideExamples">Abrir exemplo</button>';$('#mapWorkspace').before(help);$('#guideSpaces').onclick=()=>app.openTool('spaces');$('#guideExamples').onclick=()=>app.openTool('examples');
 function activate(id){nav.querySelectorAll('[data-workspace]').forEach(b=>{b.classList.toggle('active',b.dataset.workspace===id);b.setAttribute('aria-current',b.dataset.workspace===id?'page':'false');});}
 function show(next){if(next==='inventory'&&body.classList.contains('map-expanded'))$('#expandMap').click();surface=next;body.dataset.workspace=next;$('#mapWorkspace').hidden=next!=='map';inventory.hidden=next!=='inventory';$('#workspaceGuide').hidden=next!=='map'||app.get().project.devices.length>0;$('#featureToolbar').hidden=next!=='map';activate(next);refreshHeader();body.classList.remove('open-navigation');if(next==='map')window.dispatchEvent(new Event('resize'));}
 function refreshHeader(){const state=app.get();modes.querySelectorAll('[data-map-action]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mapAction===toolSelect.value)));finish.hidden=toolSelect.value==='navigate';const scope=[state.project.sites.find(s=>s.id===state.siteFilter)?.name,state.floorName,state.roomName,state.vlanFilter?'VLAN '+state.vlanFilter:''].filter(Boolean);$('#workspaceScope').textContent=state.query?.trim()?'Pesquisa em todo o projeto':scope.length?scope.join(' / '):'Todo o projeto';$('#resetWorkspaceFilters').disabled=!state.query&&!state.siteFilter&&!state.vlanFilter&&!state.floorName;$('#inventoryMap').disabled=!state.selected.id;$('#viewTitle').textContent=surface==='inventory'?'Equipamentos':state.mode==='rack'?'Bastidor 3D':state.mode==='plan'?'Mapa de edifícios e pisos':state.mode==='logical'?'Redes e ligações':'Campus 3D';if(title)title.textContent=surface==='inventory'?'PROJETO / EQUIPAMENTOS':'PROJETO / MAPA';}
 nav.onclick=ev=>{const button=ev.target.closest('[data-workspace]');if(!button)return;const id=button.dataset.workspace;if(['map','inventory'].includes(id))show(id);else{activate(id);app.openTool(id);body.classList.remove('open-navigation');}};
 $('#studio').addEventListener('close',()=>activate(surface));
 $('#search').addEventListener('input',()=>{if($('#search').value.trim())show('inventory');});
 $('#locations').addEventListener('click',()=>show('map'));
 // Changing to a visual route must always reveal the map, even from inventory.
 for(const id of ['physical','logical','planMode','rackMode'])$('#'+id).addEventListener('click',()=>show('map'));
 function organiseInspector(){const inspector=$('#inspector');if(!$('#editSelected'))return;const key=app.get().selected.type+':'+app.get().selected.id;if(key!==selectedKey){section='summary';selectedKey=key;}
 const header=[...inspector.children].slice(0,3),nodes=[...inspector.children].slice(3),tabs=document.createElement('div');tabs.className='selection-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Detalhes do objeto');
 const panels={};for(const [id,label] of [['summary','Ficha'],['connections','Ligações'],['location','Localização']]){const button=document.createElement('button');button.id='selection-tab-'+id;button.textContent=label;button.dataset.section=id;button.setAttribute('role','tab');button.setAttribute('aria-controls','selection-'+id);tabs.append(button);const panel=document.createElement('section');panel.id='selection-'+id;panel.className='selection-page';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);panels[id]=panel;}
 let current='summary';for(const node of nodes){current=inspectorSection(node,current);panels[current].append(node);}
 // Identity and maintenance are the first action inside the equipment sheet.
 const record=panels.summary.querySelector('#equipmentRecordButton');if(record){record.textContent='Responsável, garantia e intervenções';panels.summary.prepend(record);}
 const station=panels.connections.querySelector('#stationDetails');if(station)station.textContent='Posto e percurso de rede';
 const remove=$('#deleteSelected'),more=document.createElement('details');more.className='selection-danger';more.innerHTML='<summary>Outras ações</summary>';more.append(remove);panels.location.append(more);
 const edit=$('#editSelected');edit.textContent=app.get().selected.type==='devices'?'Configurar equipamento':'Configurar';edit.title='Nome, tipo, modelo e configuração';
 inspector.replaceChildren(...header,tabs,...Object.values(panels));
 for(const [id,panel] of Object.entries(panels)){if(!panel.children.length){const p=document.createElement('p');p.className='notice';p.textContent=id==='connections'?'Este objeto não tem ligações próprias. Selecione um equipamento ou cabo.':'Selecione um equipamento para consultar estes dados.';panel.append(p);}}
 const choose=id=>{section=id;for(const button of tabs.children){const active=button.dataset.section===id;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;panels[button.dataset.section].hidden=!active;}};tabs.onclick=ev=>{const b=ev.target.closest('[data-section]');if(b)choose(b.dataset.section);};tabs.onkeydown=ev=>{const keys=['ArrowLeft','ArrowRight','Home','End'];if(!keys.includes(ev.key))return;ev.preventDefault();const buttons=[...tabs.children],i=buttons.findIndex(b=>b.dataset.section===section),next=ev.key==='Home'?0:ev.key==='End'?2:(i+(ev.key==='ArrowRight'?1:2))%3;choose(buttons[next].dataset.section);buttons[next].focus();};choose(section);
 // Network essentials are immediately visible in their own tab.
 panels.connections.querySelectorAll('.inspector-group').forEach((group,i)=>group.open=i===0);const socket=panels.connections.querySelector('.socket-panel');if(socket)panels.connections.prepend(socket);
 }
 show('map');return {showMap(){show('map');},afterRender(){refreshHeader();organiseInspector();$('#inventoryTable').hidden=false;$('#workspaceGuide').hidden=surface!=='map'||app.get().project.devices.length>0;}};
}

export function organiseEquipmentForm(root){
 const groups=[['Identificação',['name','type','model','role']],['Rede e interfaces',['vlan','ip','gateway','portCount']],['Localização e instalação',['site','rack','u','units','host','x','z','y']]];
 for(const [title,names] of groups){const group=document.createElement('fieldset');group.className='equipment-field-group wide';const legend=document.createElement('legend');legend.textContent=title;group.append(legend);for(const name of names){const control=root.querySelector('[name="'+name+'"]');if(control)group.append(control.closest('label'));}root.append(group);}
 const help={portCount:'Quantidade de portas físicas. As novas tomadas têm duas saídas independentes.',vlan:'Rede à qual o equipamento pertence. Pode deixar sem VLAN.',ip:'Preencha apenas se conhecer o endereço IP do equipamento.',gateway:'Endereço do router desta rede. Campo opcional.',rack:'Escolha um bastidor apenas se o equipamento estiver instalado num.',u:'Primeira unidade ocupada. A numeração começa em baixo.',host:'Servidor físico onde esta máquina virtual está alojada.'};
 for(const [name,text] of Object.entries(help)){const control=root.querySelector('[name="'+name+'"]');if(control){const hint=document.createElement('small');hint.className='field-help';hint.id='help-'+name;hint.textContent=text;control.setAttribute('aria-describedby',hint.id);control.closest('label').append(hint);}}
 const specs=root.querySelector('#deviceSpecs');if(specs){const details=document.createElement('details');details.className='technical-specifications wide';details.innerHTML='<summary>Características e periféricos</summary>';details.append(specs);root.append(details);}
}
