import {escapeHTML as e} from './model.js';
const searchCache=new WeakMap();
const normalized=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
// The editor replaces the project on each edit; reuse normalized entries between queries.
export function equipmentResults(project,query){
 const q=normalized(query);if(!q)return[];let entries=searchCache.get(project);
 if(!entries){const sites=new Map(project.sites.map(s=>[s.id,s])),floors=new Map(project.floors.map(f=>[f.id,f])),rooms=new Map(project.rooms.map(r=>[r.id,r]));entries=project.devices.map(device=>{const site=sites.get(device.site),exact=[device.name,device.ip,device.record?.serial,device.specs?.workstation].map(normalized),text=normalized([device.name,device.ip,device.type,device.record?.owner,device.record?.serial,...Object.values(device.specs||{}),site?.name,...Object.values(site?.branch||{}),floors.get(device.floor)?.name,rooms.get(device.room)?.name].join(' '));return{device,exact,text};});searchCache.set(project,entries);}
 const words=q.split(/\s+/),score=entry=>entry.exact.includes(q)?0:entry.exact[0].startsWith(q)?1:2;
 return entries.filter(entry=>words.every(word=>entry.text.includes(word))).sort((a,b)=>score(a)-score(b)||a.device.name.localeCompare(b.device.name,'pt')).map(entry=>entry.device);
}
export function initEquipmentSearch({get,open,inventory}){
 const input=document.querySelector('#search'),root=document.createElement('section');root.id='equipmentSearchResults';root.hidden=true;root.setAttribute('aria-label','Resultados da pesquisa');document.querySelector('#workspaceSearch').append(root);
 input.setAttribute('autocomplete','off');input.setAttribute('aria-controls',root.id);input.setAttribute('aria-expanded','false');
 let results=[],index=-1;
 const close=()=>{root.hidden=true;input.setAttribute('aria-expanded','false');index=-1;};
 function render(){const p=get().project,query=input.value.trim();results=equipmentResults(p,query);index=-1;if(!query||document.activeElement!==input){close();return;}
 root.innerHTML='<div class="search-results-caption">'+results.length+' equipamento(s)</div>'+results.slice(0,8).map(d=>{const location=[p.sites.find(s=>s.id===d.site)?.name,p.floors.find(f=>f.id===d.floor)?.name,p.rooms.find(r=>r.id===d.room)?.name,p.racks.find(r=>r.id===d.rack)?.name].filter(Boolean).join(' › ');return '<button type="button" data-search-device="'+e(d.id)+'"><span><strong>'+e(d.name)+'</strong><small>'+e(location||'Localização por atribuir')+'</small></span><span class="search-result-kind">'+e(d.type)+' ↗</span></button>';}).join('')+(!results.length?'<p>Nenhum equipamento encontrado. Experimenta outro nome ou localização.</p>':'<button type="button" data-search-all>Ver todos no inventário</button>');root.hidden=false;input.setAttribute('aria-expanded','true');}
 root.onclick=event=>{const button=event.target.closest('button');if(!button)return;close();if(button.dataset.searchDevice)open(button.dataset.searchDevice);if(button.hasAttribute('data-search-all'))inventory();};
 input.addEventListener('input',render);input.addEventListener('focus',render);
 input.addEventListener('keydown',event=>{if(event.key==='Escape'){close();return;}const buttons=[...root.querySelectorAll('[data-search-device]')];if(['ArrowDown','ArrowUp'].includes(event.key)&&buttons.length){event.preventDefault();if(root.hidden){render();return;}index=(index+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;buttons.forEach((b,i)=>b.classList.toggle('active',i===index));buttons[index].scrollIntoView({block:'nearest'});}if(event.key==='Enter'&&results.length){event.preventDefault();const id=results[index<0?0:index]?.id;close();if(id)open(id);}});
 document.addEventListener('pointerdown',event=>{if(event.target!==input&&!root.contains(event.target))close();});
 input.addEventListener('blur',()=>{setTimeout(()=>{if(!root.contains(document.activeElement))close();},150);});
 return{render,close};
}
