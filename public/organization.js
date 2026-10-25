import {clone,validate,escapeHTML as e} from './model.js';
import {createBuilding} from './building-setup.js';
import {beginForm,mayDiscard} from './ux-feedback.js';

export const branchProfiles={
 office:{name:'Escritório',rooms:['Receção','Escritório','Sala de reuniões','Sala técnica']},
 warehouse:{name:'Armazém',rooms:['Receção','Escritório','Armazém','Sala técnica']},
 datacenter:{name:'Datacenter',rooms:['Sala de operação','Sala técnica','Sala de bastidores']},
 empty:{name:'Só pisos',rooms:[]}
};
export function countryName(code){if(!code)return 'Sem país';try{return new Intl.DisplayNames(['pt'],{type:'region'}).of(code)||code;}catch{return code;}}
export function branchKey(branch){return branch?.unit?`${branch.country||''}/${branch.unit}`:'';}
const fingerprint=(country,unit,name)=>[country,unit,name].map(v=>v.trim().toLocaleLowerCase('pt')).join('|');
export function parseBranchTable(source){
 if(!source.trim())return [];
 if(source.length>100000)throw new Error('A tabela excede 100 KB. Importe até 100 edifícios de cada vez.');
 const first=source.split(/\r?\n/)[0],delimiter=first.includes('\t')?'\t':first.includes(';')?';':',';
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<source.length;i++){const char=source[i];if(char==='"'){if(quoted&&source[i+1]==='"'){cell+='"';i++;}else if(quoted||cell==='')quoted=!quoted;else throw new Error('Aspas inválidas na tabela.');}
 else if(!quoted&&char===delimiter){row.push(cell.trim());cell='';}
 else if(!quoted&&(char==='\n'||char==='\r')){if(char==='\r'&&source[i+1]==='\n')i++;row.push(cell.trim());if(row.some(Boolean))rows.push(row);row=[];cell='';}
 else cell+=char;}
 if(quoted)throw new Error('Existe um campo com aspas por fechar.');row.push(cell.trim());if(row.some(Boolean))rows.push(row);
 const header=['pais','cidade','unidade','edificio','perfil','pisos','fuso','responsavel'];
 const canonical=value=>value.replace(/^\uFEFF/,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
 if(rows[0]?.map(canonical).join('|')!==header.join('|'))throw new Error('Use o cabeçalho: pais;cidade;unidade;edificio;perfil;pisos;fuso;responsavel');
 if(rows.length>101)throw new Error('Importe até 100 edifícios de cada vez.');
 return rows.slice(1).map((cells,i)=>{if(cells.length!==8)throw new Error('Linha '+(i+2)+': são necessárias 8 colunas.');const [country,city,unit,name,profile,floors,timezone,contact]=cells;return {country:country.toUpperCase(),city,unit:unit.toUpperCase(),name,profile:profile||'office',floors:Number(floors||1),timezone:timezone||'UTC',contact};});
}
export function planOrganization(project,{name,rows}){
 name=String(name||'').trim();if(!name||name.length>100)throw new Error('Indique o nome da empresa, até 100 caracteres.');
 if(!Array.isArray(rows)||rows.length>100)throw new Error('Importe até 100 edifícios de cada vez.');
 const next=clone(project),created=[],seen=new Set(next.sites.filter(s=>s.branch).map(s=>fingerprint(s.branch.country,s.branch.unit,s.name)));
 next.organization={...next.organization,name};next.name=name;
 for(const [i,row] of rows.entries()){
  try{
   if(!/^[A-Z]{2}$/.test(row.country))throw new Error('Indique um país com duas letras, por exemplo PT, BR ou US.');
   if(!/^[A-Z0-9][A-Z0-9_-]{0,39}$/.test(row.unit))throw new Error('Código da unidade: até 40 letras, números, hífens ou sublinhados.');
   if(!branchProfiles[row.profile])throw new Error('Perfil: office, warehouse, datacenter ou empty.');
   if(!Number.isInteger(row.floors)||row.floors<1||row.floors>10)throw new Error('Escolha entre 1 e 10 pisos.');
   new Intl.DateTimeFormat('pt',{timeZone:row.timezone});
   const key=fingerprint(row.country,row.unit,row.name);if(seen.has(key))throw new Error('Este edifício já existe nesta unidade.');seen.add(key);
   const branch={country:row.country,city:row.city,unit:row.unit,timezone:row.timezone,contact:row.contact,networkDomain:row.country+'-'+row.unit};
   const existing=next.sites.find(s=>branchKey(s.branch)===branchKey(branch));
   if(existing)branch.networkDomain=existing.branch.networkDomain;
   if(existing&&['city','timezone','networkDomain'].some(k=>existing.branch[k]!==branch[k]))throw new Error('Os edifícios da mesma unidade devem ter a mesma cidade, fuso e domínio de rede.');
   const result=createBuilding(next,{name:row.name,branch,floors:Array.from({length:row.floors},(_,n)=>({name:'Piso '+n,rooms:branchProfiles[row.profile].rooms.join('\n')}))});created.push(result);
  }catch(error){throw new Error('Edifício '+(i+1)+' ('+(row.unit||'?')+'): '+error.message);}
 }
 validate(next);return {project:next,created};
}
export function planBranchAssignment(project,id,values){
 const next=clone(project),current=next.sites.find(site=>site.id===id);if(!current)throw new Error('Edifício inexistente.');
 const branch={country:String(values.country||'').trim().toUpperCase(),unit:String(values.unit||'').trim().toUpperCase(),city:values.city,timezone:values.timezone,contact:values.contact,networkDomain:values.networkDomain};
 const old=branchKey(current.branch),target=branchKey(branch),members=old?next.sites.filter(site=>branchKey(site.branch)===old):[current],existing=next.sites.find(site=>!members.includes(site)&&branchKey(site.branch)===target);
 if(existing&&['city','timezone','networkDomain'].some(key=>existing.branch[key]!==branch[key]))throw new Error('Escolha a unidade existente para usar a mesma cidade, fuso e domínio de rede.');
 for(const member of members)member.branch={...branch};validate(next);return next;
}
export function organizationGroups(project){
 const countries=new Map();
 for(const site of project.sites){const country=site.branch?.country||'',unit=site.branch?.unit||'';if(!countries.has(country))countries.set(country,new Map());const units=countries.get(country);if(!units.has(unit))units.set(unit,[]);units.get(unit).push(site);}
 return [...countries].sort(([a],[b])=>countryName(a).localeCompare(countryName(b),'pt')).map(([country,units])=>({country,name:countryName(country),units:[...units].sort(([a],[b])=>a.localeCompare(b)).map(([unit,sites])=>({unit,sites}))}));
}
const example='pais;cidade;unidade;edificio;perfil;pisos;fuso;responsavel\nPT;Lisboa;PT-LIS;Sede Lisboa;office;2;Europe/Lisbon;Equipa TI Portugal\nDE;Berlim;DE-BER;Escritório Berlim;office;1;Europe/Berlin;Equipa TI Alemanha';
export function initOrganization(app,{form}){
 const dialog=document.createElement('dialog');dialog.id='organizationDialog';dialog.setAttribute('aria-labelledby','organizationTitle');document.body.append(dialog);
 let step=0,review=null,reviewSource='',dashboardQuery='',dashboardCountry='',dashboardProject=null;
 function close(){if(mayDiscard(dialog))dialog.close();}
 dialog.addEventListener('cancel',ev=>{ev.preventDefault();close();});
 function editBranch(id){const site=app.get().project.sites.find(s=>s.id===id);if(!site)return;const b=site.branch||{},units=[...new Map(app.get().project.sites.filter(s=>s.branch).map(s=>[branchKey(s.branch),s.branch])).entries()];
 const existingSelect=`<label class="form-field wide">Usar uma unidade existente<select name="existingUnit"><option value="">Dados personalizados / nova unidade</option>${units.map(([key,value])=>`<option value="${e(key)}">${e(key+' · '+value.city)}</option>`).join('')}</select></label>`;
 const input=(key,label,value='',extra='')=>`<label class="form-field">${label}<input name="${key}" value="${e(value)}" ${extra}></label>`;
 form('Organizar unidade · '+site.name,existingSelect+input('country','País (código de 2 letras)',b.country,'required pattern="[A-Za-z]{2}" maxlength="2" placeholder="PT"')+input('city','Cidade',b.city,'maxlength="100"')+input('unit','Código da unidade',b.unit,'required maxlength="40" pattern="[A-Za-z0-9][A-Za-z0-9_-]{0,39}" placeholder="PT-LIS"')+input('timezone','Fuso horário',b.timezone||'Europe/Lisbon','required maxlength="80" placeholder="Europe/Lisbon"')+input('contact','Responsável local / equipa',b.contact,'maxlength="200"')+input('networkDomain','Domínio de endereçamento',b.networkDomain||'','maxlength="80" placeholder="Ex.: PT-LIS"')+'<p class="wide notice">O mesmo domínio representa a mesma rede de endereçamento: não pode repetir IPs. Domínios diferentes permitem IPs privados iguais. A classificação aplica-se a todos os edifícios da unidade original. Nenhum cabo ou IP é criado.</p>',v=>{
  if(app.mutate(p=>Object.assign(p,planBranchAssignment(p,id,v)),'organizar unidade '+v.unit.toUpperCase()))dashboard();
 },f=>{f.elements.existingUnit.onchange=()=>{const selected=units.find(([key])=>key===f.elements.existingUnit.value)?.[1];if(selected)for(const key of ['country','unit','city','timezone','contact','networkDomain'])f.elements[key].value=selected[key]||'';};});
 }
 function dashboard(){
 const p=app.get().project,groups=organizationGroups(p),unitCount=new Set(p.sites.filter(s=>s.branch).map(s=>branchKey(s.branch))).size;
 dialog.innerHTML=`<div class="dialog-head"><div><div class="eyebrow">EMPRESA E UNIDADES</div><h2 id="organizationTitle">${e(p.organization?.name||'Organizar a empresa')}</h2><p>${groups.filter(g=>g.country).length} países · ${unitCount} unidades · ${p.sites.length} edifícios · ${p.devices.length} equipamentos</p></div><button type="button" data-org-close aria-label="Fechar">×</button></div><div class="organization-body"><p>Empresa → país → unidade → edifício → piso → sala → equipamentos. Abra a planta do local onde quer trabalhar.</p><div class="organization-actions"><button type="button" class="primary" data-org-wizard>Configurar empresa e adicionar unidades</button><button type="button" data-org-building>Adicionar edifício</button><button type="button" data-org-import>Importar equipamentos</button><button type="button" data-org-operations>Pendências e capacidade</button></div><div class="organization-filters"><label>País<select data-org-country><option value="">Todos os países</option>${groups.filter(g=>g.country).map(g=>`<option value="${e(g.country)}" ${dashboardCountry===g.country?'selected':''}>${e(g.name)}</option>`).join('')}</select></label><label>Procurar unidade, cidade ou responsável<input data-org-search value="${e(dashboardQuery)}" placeholder="Lisboa, PT-LIS, equipa TI…"></label></div><div data-org-results></div><p class="notice">A organização dos locais não cria contas nem permissões. O modo local mantém um único utilizador e um projeto partilhado.</p></div>`;
 dialog.querySelector('[data-org-close]').onclick=close;dialog.querySelector('[data-org-wizard]').onclick=wizard;dialog.querySelector('[data-org-building]').onclick=()=>app.createBuilding();dialog.querySelector('[data-org-import]').onclick=()=>{dialog.close();app.importEquipment();};dialog.querySelector('[data-org-operations]').onclick=()=>{dialog.close();app.openOperations();};
 dialog.querySelector('[data-org-search]').oninput=ev=>{dashboardQuery=ev.target.value;renderResults();};dialog.querySelector('[data-org-country]').onchange=ev=>{dashboardCountry=ev.target.value;renderResults();};
 function renderResults(){const query=dashboardQuery.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),sites=p.sites.filter(s=>(!dashboardCountry||s.branch?.country===dashboardCountry)&&[s.name,...Object.values(s.branch||{})].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(query));
 dialog.querySelector('[data-org-results]').innerHTML=sites.map(s=>{const f=p.floors.filter(f=>f.site===s.id);return `<article class="organization-site"><div><small>${e([countryName(s.branch?.country),s.branch?.city,s.branch?.unit].filter(Boolean).join(' / '))}</small><h3>${e(s.name)}</h3><p>${f.length} pisos · ${p.devices.filter(d=>d.site===s.id).length} equipamentos · ${e(s.branch?.timezone||'Fuso por definir')}</p><small>${e(s.branch?.contact||'Responsável por definir')}</small></div><div><button type="button" data-org-floor="${e(f[0]?.id||'')}" ${!f.length?'disabled':''}>Abrir planta</button><button type="button" data-org-edit="${e(s.id)}">Configurar unidade</button></div></article>`;}).join('')||'<p>Nenhum local corresponde à pesquisa.</p>';
 dialog.querySelectorAll('[data-org-floor]').forEach(button=>button.onclick=()=>{dialog.close();app.openFloor(button.dataset.orgFloor);});dialog.querySelectorAll('[data-org-edit]').forEach(button=>button.onclick=()=>editBranch(button.dataset.orgEdit));}
 renderResults();dashboardProject=p;beginForm(dialog);if(!dialog.open)dialog.showModal();
 }
 function wizard(){
 step=0;review=null;
 dialog.innerHTML=`<form id="organizationWizard"><div class="dialog-head"><div><div class="eyebrow">CONFIGURAÇÃO GUIADA</div><h2 id="organizationTitle">Empresa e filiais</h2></div><button type="button" data-org-close aria-label="Fechar">×</button></div><div class="organization-body"><ol class="organization-progress"><li>1. Empresa</li><li>2. Unidades</li><li>3. Rever</li></ol><section data-org-step="0"><h3>Como se chama a empresa?</h3><label class="form-field">Nome da empresa<input name="companyName" required maxlength="100" value="${e(app.get().project.organization?.name||'')}" placeholder="Ex.: Grupo Atlântico"></label><p>Os locais existentes são preservados. Poderá classificá-los por país e unidade.</p></section><section data-org-step="1" hidden><h3>Onde fica a unidade?</h3><label class="form-field">Como quer configurar?<select name="entryMode"><option value="single">Uma unidade — formulário simples</option><option value="batch">Várias unidades — Excel / CSV</option><option value="company">Apenas o nome da empresa</option></select></label><div data-org-single class="organization-single"><label class="form-field">País (2 letras)<input name="countryCode" value="PT" maxlength="2" pattern="[A-Za-z]{2}" list="organizationCountries"><datalist id="organizationCountries"><option value="PT">Portugal</option><option value="BR">Brasil</option><option value="ES">Espanha</option><option value="DE">Alemanha</option><option value="FR">França</option><option value="GB">Reino Unido</option><option value="US">Estados Unidos</option><option value="AO">Angola</option><option value="MZ">Moçambique</option></datalist></label><label class="form-field">Cidade<input name="cityName" maxlength="100" placeholder="Lisboa"></label><label class="form-field">Código da unidade<input name="unitCode" maxlength="40" pattern="[A-Za-z0-9][A-Za-z0-9_-]{0,39}" placeholder="PT-LIS"></label><label class="form-field">Nome do edifício<input name="siteName" maxlength="100" placeholder="Sede Lisboa"></label><label class="form-field">Modelo de espaços<select name="profile">${Object.entries(branchProfiles).map(([id,p])=>`<option value="${id}">${p.name}</option>`).join('')}</select></label><label class="form-field">Número de pisos<input name="floorCount" type="number" min="1" max="10" value="1"></label><label class="form-field">Fuso horário<input name="timeZone" value="Europe/Lisbon" maxlength="80" list="organizationTimezones"><datalist id="organizationTimezones"><option>Europe/Lisbon</option><option>Europe/Berlin</option><option>America/Sao_Paulo</option><option>America/New_York</option><option>Asia/Singapore</option><option>Africa/Luanda</option><option>UTC</option></datalist></label><label class="form-field">Responsável local / equipa<input name="localContact" maxlength="200" placeholder="Equipa TI Portugal"></label></div><div data-org-batch hidden><h3>Adicione os locais de uma vez</h3><p>Cole uma tabela do Excel ou carregue um CSV. Uma linha por edifício; use o mesmo código de unidade para agrupar edifícios. Pode deixar a tabela vazia para configurar apenas o nome.</p><div class="organization-actions"><button type="button" data-org-example>Preencher exemplo editável</button><button type="button" data-org-template>Descarregar modelo CSV</button><label class="organization-upload">Carregar CSV<input type="file" data-org-file accept=".csv,.tsv,text/csv,text/tab-separated-values"></label></div><label class="form-field">Tabela de edifícios<textarea name="branchTable" rows="9" maxlength="100000" spellcheck="false" placeholder="${e(example)}"></textarea></label><p>País: PT, BR, US… · Perfil: office (escritório), warehouse (armazém), datacenter ou empty (só pisos). Fuso: Europe/Lisbon, Europe/Berlin, America/Sao_Paulo…</p><p>Os modelos criam salas e pisos. Equipamentos, IPs e cabos são configurados depois, na planta.</p></div></section><section data-org-step="2" hidden><h3>Confirme antes de criar</h3><div data-org-review></div></section><p data-org-error role="alert"></p></div><div class="dialog-actions"><button type="button" data-org-back>Voltar</button><button type="submit" class="primary" data-org-next>Continuar</button></div></form>`;
 const f=dialog.querySelector('form'),error=dialog.querySelector('[data-org-error]');
 function draw(){dialog.querySelectorAll('[data-org-step]').forEach(section=>section.hidden=Number(section.dataset.orgStep)!==step);dialog.querySelectorAll('.organization-progress li').forEach((li,i)=>li.setAttribute('aria-current',i===step?'step':'false'));f.elements.companyName.required=step===0;const single=f.elements.entryMode.value==='single';dialog.querySelector('[data-org-single]').hidden=!single;dialog.querySelector('[data-org-batch]').hidden=f.elements.entryMode.value!=='batch';for(const key of ['countryCode','unitCode','siteName','floorCount','timeZone'])f.elements[key].required=step===1&&single;dialog.querySelector('[data-org-next]').textContent=step===2?'Aplicar configuração':'Continuar';dialog.querySelector('[data-org-back]').textContent=step===0?'Cancelar':'Voltar';error.textContent='';}
 f.elements.entryMode.onchange=draw;f.elements.countryCode.onchange=()=>{const zones={PT:'Europe/Lisbon',BR:'America/Sao_Paulo',ES:'Europe/Madrid',DE:'Europe/Berlin',FR:'Europe/Paris',GB:'Europe/London',US:'America/New_York',AO:'Africa/Luanda',MZ:'Africa/Maputo',SG:'Asia/Singapore'};f.elements.timeZone.value=zones[f.elements.countryCode.value.toUpperCase()]||'UTC';};
 dialog.querySelector('[data-org-close]').onclick=close;dialog.querySelector('[data-org-back]').onclick=()=>{if(step===0){if(mayDiscard(dialog))dashboard();}else{step--;draw();}};
 dialog.querySelector('[data-org-example]').onclick=()=>{f.elements.branchTable.value=example;f.elements.branchTable.dispatchEvent(new Event('input',{bubbles:true}));};
 dialog.querySelector('[data-org-template]').onclick=()=>{const url=URL.createObjectURL(new Blob(['\uFEFF'+example],{type:'text/csv;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download='atlas-unidades.csv';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);};
 dialog.querySelector('[data-org-file]').onchange=async ev=>{try{const file=ev.target.files[0];if(!file)return;if(file.size>100000)throw new Error('O CSV deve ter até 100 KB.');f.elements.branchTable.value=await file.text();f.elements.branchTable.dispatchEvent(new Event('input',{bubbles:true}));error.textContent='Tabela carregada. Continue para validar e rever.';}catch(err){error.textContent=err.message;}};
 f.onsubmit=ev=>{ev.preventDefault();try{if(step===0){if(!f.elements.companyName.reportValidity())return;step=1;draw();return;}
 const values={name:f.elements.companyName.value,rows:f.elements.entryMode.value==='batch'?parseBranchTable(f.elements.branchTable.value):f.elements.entryMode.value==='company'?[]:[{country:f.elements.countryCode.value.trim().toUpperCase(),city:f.elements.cityName.value.trim(),unit:f.elements.unitCode.value.trim().toUpperCase(),name:f.elements.siteName.value.trim(),profile:f.elements.profile.value,floors:Number(f.elements.floorCount.value),timezone:f.elements.timeZone.value.trim(),contact:f.elements.localContact.value.trim()}]};
 if(step===1){review=planOrganization(app.get().project,values);reviewSource=JSON.stringify(app.get().project);const floors=review.created.reduce((n,r)=>n+r.floors.length,0),rooms=review.created.reduce((n,r)=>n+r.rooms.length,0);
 dialog.querySelector('[data-org-review]').innerHTML=`<p><strong>${e(values.name)}</strong> · ${values.rows.length} novos edifícios · ${floors} pisos · ${rooms} salas</p><p>Não serão criados equipamentos, cabos ou endereços IP. Pode desfazer esta operação.</p><div class="organization-review-list">${values.rows.map(row=>`<p>${e(countryName(row.country))} / ${e(row.unit)} / <strong>${e(row.name)}</strong> · ${e(branchProfiles[row.profile].name)} · ${row.floors} piso(s)</p>`).join('')||'<p>Apenas o nome da empresa será atualizado.</p>'}</div>`;step=2;draw();return;}
 if(reviewSource!==JSON.stringify(app.get().project)){step=1;draw();throw new Error('O projeto mudou. Reveja novamente antes de aplicar.');}
 if(app.mutate(p=>Object.assign(p,planOrganization(p,values).project),'configurar empresa e unidades')){beginForm(dialog);dashboard();app.status('Empresa configurada. Abra a planta de uma unidade para adicionar equipamentos.');}
 }catch(err){error.textContent=err.message;}};
 draw();beginForm(dialog);
 }
 const button=document.createElement('button');button.type='button';button.id='organizationButton';button.className='organise-spaces';button.textContent='Empresa e unidades';document.querySelector('.sidebar h1').after(button);button.onclick=dashboard;
 return {open:dashboard,editBranch,refresh(){const state=app.get();button.disabled=!state.ready;button.textContent=state.project.organization?.name||'Empresa e unidades';if(dialog.open&&!dialog.querySelector('#organizationWizard')&&dashboardProject!==state.project)dashboard();}};
}
