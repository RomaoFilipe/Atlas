import {initWorkspaceShell} from './workspace-shell.js';
import {initWorkspaceNavigation} from './workspace-navigation.js';
// Move existing controls so their handlers and data remain intact.
export function initLayout(app){
 const $=s=>document.querySelector(s),body=document.body;body.classList.add('hide-selection');
 const panel=(id,title)=>{const el=document.createElement('details');el.id=id;el.className='nav-group';el.innerHTML='<summary>'+title+'</summary><div class="nav-group-body"></div>';return el;};
 $('.sidebar').id='navigationPanel';$('.sidebar').setAttribute('aria-label','Navegação e ferramentas');
 $('.sidebar h1').textContent='Explorar projeto';$('.sidebar .intro').remove();$('.sidebar>.eyebrow').remove();$('.sidebar-bottom').innerHTML='Atlas · Infraestrutura IT';
 const nav=$('.sidebar'),tools=document.createElement('div');tools.id='taskNavigation';tools.innerHTML='<div class="nav-caption">FERRAMENTAS</div>';nav.insertBefore(tools,$('.manage-buttons'));
 const groups=[['structure','Estrutura',['spaces','mount','templates']],['connections','Ligações e energia',['cables','power']],['operations','Análise e documentação',['audit','simulation','dossier','versions']],['examples','Começar com exemplos',['examples']]];
 groups.forEach(([id,title,ids])=>{const group=panel('nav-'+id,title);if(id==='connections')group.open=true;ids.forEach(id=>group.lastElementChild.append($('[data-feature="'+id+'"]')));tools.append(group);});
 const finder=$('#stationFinder');finder.classList.add('station-shortcut');$('.search').after(finder);
 const manage=panel('manageNavigation','Gerir inventário');manage.lastElementChild.append($('.manage-buttons'));tools.append(manage);
 // Collapse less frequent VLAN filtering while keeping buildings immediately visible.
 const networks=panel('networkNavigation','Redes / VLANs');networks.lastElementChild.append($('#networks'));networks.lastElementChild.prepend($('#clearFilter'));const oldHeading=nav.querySelectorAll('.section-head')[1];oldHeading.replaceWith(networks);
 $('#featureToolbar').classList.add('guides-only');
 const inspector=$('#inspector'),selection=document.createElement('aside');selection.id='selectionPanel';selection.setAttribute('aria-label','Detalhes da seleção');selection.innerHTML='<div class="panel-heading"><span>SELEÇÃO</span><button id="closeSelection" aria-label="Recolher detalhes">×</button></div>';inspector.before(selection);selection.append(inspector);
 const header=$('body>header');header.querySelector('.demo').remove();header.insertAdjacentHTML('beforeend','<div class="header-actions"><button id="toggleNavigation" aria-controls="navigationPanel">☰ Explorar</button><button id="toggleSelection" aria-controls="selectionPanel">Detalhes</button><details id="projectMenu" class="dropdown"><summary>Projeto <span>⌄</span></summary><div class="dropdown-body"></div></details></div>');
 $('#projectMenu .dropdown-body').append($('.project-toolbar>div'));$('.project-toolbar').classList.add('save-indicator');$('.main-head').append($('.project-toolbar'));
 // One view switcher and one contextual command row above the map.
 const command=$('.map-commandbar'),views=$('.segmented');views.classList.add('map-views');command.before(views);$('#mapView').parentElement.classList.add('duplicate-view');
 const add=document.createElement('details');add.className='dropdown add-menu';add.id='addMenu';add.innerHTML='<summary>＋ Adicionar <span>⌄</span></summary><div class="dropdown-body"></div>';add.lastElementChild.append($('.creation-buttons'));add.lastElementChild.append($('#addWorkstation'));command.prepend(add);command.append($('.history-buttons'));$('#undo').textContent='↶';$('#undo').setAttribute('aria-label','Anular última alteração');$('#redo').textContent='↷';$('#redo').setAttribute('aria-label','Refazer alteração');$('.editor-toolbar').remove();
 $('.main-head').insertBefore($('.stats'),$('.save-indicator'));$('#mapToolHint').classList.add('tool-hint');command.after($('#mapToolHint'));if($('#mapTools'))$('#mapToolHint').after($('#mapTools'));
 // Scope is secondary, and should not look like another row of primary actions.
 const scope=$('.scope-controls');scope.classList.add('map-scope');$('#mapWorkspace').insertBefore(scope,$('#rackControls'));
 const inventory=$('#inventory');inventory.querySelector('.table-wrap').id='inventoryTable';inventory.querySelector('.section-head').insertAdjacentHTML('beforeend','<button id="toggleInventory" aria-expanded="false" aria-controls="inventoryTable">Mostrar lista</button>');$('#inventoryTable').hidden=true;
 $('#toggleInventory').onclick=()=>{const table=$('#inventoryTable');table.hidden=!table.hidden;$('#toggleInventory').textContent=table.hidden?'Mostrar lista':'Recolher lista';$('#toggleInventory').setAttribute('aria-expanded',String(!table.hidden));};
 // Show search results immediately when filtering equipment.
 $('#search').addEventListener('input',()=>{if($('#search').value){$('#inventoryTable').hidden=false;$('#toggleInventory').textContent='Recolher lista';$('#toggleInventory').setAttribute('aria-expanded','true');}});
 const narrow=()=>window.matchMedia('(max-width: 1100px)').matches;
 function togglePanel(which,force){const mobile=narrow(),name=(mobile?'open-':'hide-')+which;if(mobile)body.classList.remove('open-'+(which==='navigation'?'selection':'navigation'));if(force===undefined)body.classList.toggle(name);else body.classList.toggle(name,mobile?force:!force);sync();}
 function sync(){const mobile=narrow();for(const [which,id] of [['navigation','toggleNavigation'],['selection','toggleSelection']])$('#'+id).setAttribute('aria-expanded',String(mobile?body.classList.contains('open-'+which):!body.classList.contains('hide-'+which)));}
 $('#toggleNavigation').onclick=()=>togglePanel('navigation');$('#toggleSelection').onclick=()=>togglePanel('selection');$('#closeSelection').onclick=()=>togglePanel('selection',false);
 nav.insertAdjacentHTML('afterbegin','<button id="closeNavigation" aria-label="Fechar navegação">×</button>');$('#closeNavigation').onclick=()=>togglePanel('navigation',false);
 document.addEventListener('keydown',ev=>{if(ev.key==='Escape'){document.querySelectorAll('.dropdown[open]').forEach(d=>d.open=false);if(narrow()){body.classList.remove('open-navigation','open-selection');sync();}}});
 document.addEventListener('click',ev=>{document.querySelectorAll('.dropdown[open]').forEach(d=>{if(!d.contains(ev.target)||ev.target.closest('button'))d.open=false;});if(narrow()&&ev.target.closest('[data-feature],#stationFinder,[data-manage]')){body.classList.remove('open-navigation');sync();}});
 window.addEventListener('resize',sync);sync();
 const navigation=initWorkspaceNavigation(app);
 const locationMenu=document.createElement('details');locationMenu.className='dropdown map-location-menu';locationMenu.innerHTML='<summary>Filtrar localização</summary><div class="dropdown-body"></div>';scope.before(locationMenu);locationMenu.lastElementChild.append(scope);command.insertBefore(locationMenu,$('.history-buttons'));
 const newBuilding=document.createElement('button');newBuilding.id='sidebarCreateBuilding';newBuilding.className='primary';newBuilding.textContent='＋ Criar edifício';$('#primaryNavigation').after(newBuilding);newBuilding.onclick=()=>app.edit('sites');
 const caption=document.createElement('p');caption.className='workspace-subtitle';caption.id='workspaceSubtitle';$('#viewTitle').after(caption);
 const shell=initWorkspaceShell(app);
 return {showMap:()=>navigation.showMap(),onSelection(){if(narrow()){body.classList.remove('open-navigation');body.classList.add('open-selection');}else body.classList.remove('hide-selection');sync();},afterRender(){
  // Rack actions appear only when inspecting that view; the inspector holds campus rack actions.
  if($('#mapView').value!=='rack')$('#rackControls').hidden=true;
  $('#mapEditSelection').disabled=!$('#editSelected');
  const inspector=$('#inspector');for(const heading of [...inspector.querySelectorAll('h3')]){
   if(!heading.textContent.startsWith('Ligações (')&&!heading.textContent.startsWith('Portas ·')&&!heading.textContent.startsWith('Seguir percurso por porta'))continue;
   const section=document.createElement('details');section.className='inspector-group';const summary=document.createElement('summary');summary.textContent=heading.textContent;section.append(summary);heading.before(section);let sibling=heading.nextElementSibling;heading.remove();
   while(sibling&&(sibling.matches('.connection,.port-face-controls,.port-grid,[data-follow-circuit],#configurePorts')||(heading.textContent.startsWith('Portas ·')&&sibling.matches('p.notice')))){const next=sibling.nextElementSibling;section.append(sibling);sibling=next;}
  }
  navigation.afterRender();shell.refresh();const mode=app.get().mode;body.dataset.view=mode;$('#workspaceSubtitle').textContent=body.dataset.workspace==='inventory'?'Encontre equipamentos e abra a respetiva localização.':mode==='physical'?'Explore os edifícios e selecione um objeto para consultar os detalhes.':mode==='plan'?'Organize salas, equipamentos e percursos de rede.':mode==='rack'?'Consulte a instalação e as portas do bastidor.':'Consulte a organização das redes e as suas ligações';
 }};
}
