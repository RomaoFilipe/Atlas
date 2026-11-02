import {diagnosisAnswer} from './network-diagnosis.js';
// Read-only answers computed in the browser. Project data never needs to leave it.
import {equipmentResults} from './equipment-search.js';
import {operationReport} from './operations.js';
import {portsFor,portInUse} from './network.js';

const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const types={equipamentos:null,dispositivos:null,computadores:['Computador','Portátil','Posto de trabalho'],impressoras:['Impressora'],switches:['Switch','Mini-switch'],servidores:['Servidor'],tomadas:['Tomada de rede'],telefones:['Telefone IP'],bastidores:'racks',salas:'rooms',pisos:'floors',edificios:'sites',cabos:'links',ligacoes:'links'};
function scopeFor(project,state,text){
 if(/\b(?:nesta sala|na sala atual|desta sala|da sala atual)\b/.test(text)){const id=state.roomId||(state.selected?.type==='rooms'?state.selected.id:project.devices.find(d=>state.selected?.type==='devices'&&d.id===state.selected.id)?.room);return {kind:'room',id,label:project.rooms.find(r=>r.id===id)?.name};}
 if(/\b(?:neste piso|no piso atual|deste piso|do piso atual)\b/.test(text)){const id=state.floorId||(state.selected?.type==='floors'?state.selected.id:undefined);return {kind:'floor',id,label:project.floors.find(f=>f.id===id)?.name};}
 if(/\b(?:neste edificio|no edificio atual|deste edificio|do edificio atual)\b/.test(text)){const id=state.siteFilter||(state.selected?.type==='sites'?state.selected.id:undefined);return {kind:'site',id,label:project.sites.find(s=>s.id===id)?.name};}
 return {kind:'project',label:'todo o projeto'};
}
function inScope(project,item,group,scope){
 if(scope.kind==='project')return true;
 if(group==='links')return [item.a,item.b].some(id=>{const d=project.devices.find(d=>d.id===id);return d&&inScope(project,d,'devices',scope);});
 if(scope.kind==='room')return group==='rooms'?item.id===scope.id:item.room===scope.id;
 if(scope.kind==='floor')return group==='floors'?item.id===scope.id:item.floor===scope.id;
 if(group==='sites')return item.id===scope.id;
 if(group==='rooms')return project.floors.some(f=>f.id===item.floor&&f.site===scope.id);
 return item.site===scope.id;
}
const result=(reply,targets=[])=>({reply,targets,mode:'advice',source:'project',sources:[]});
const target=d=>({type:'devices',id:d.id,label:'Abrir '+d.name});
function locationText(project,d){return [project.sites.find(s=>s.id===d.site)?.name,project.floors.find(f=>f.id===d.floor)?.name,project.rooms.find(r=>r.id===d.room)?.name,project.racks.find(r=>r.id===d.rack)?.name].filter(Boolean).join(' → ')||'Localização por atribuir';}
export function projectAnswer(project,state={},prompt='',{today}={}){
 const diagnostic=diagnosisAnswer(project,state,prompt);if(diagnostic)return diagnostic;
 const text=norm(prompt).replace(/[?!.]+$/g,'').trim(),scope=scopeFor(project,state,text);
 const scopeMissing=()=>result('Abre ou seleciona '+({room:'uma sala',floor:'um piso',site:'um edifício'})[scope.kind]+' para consultar esse âmbito.');
 let match=text.match(/^(?:quantos|quantas) (equipamentos|dispositivos|computadores|impressoras|switches|servidores|tomadas|telefones|bastidores|salas|pisos|edificios|cabos|ligacoes)(?: (?:ha|existem|temos|tenho))?(?: (?:no projeto|nesta sala|na sala atual|neste piso|no piso atual|neste edificio|no edificio atual))?$/);
 if(match){if(!scope.label)return scopeMissing();const type=types[match[1]],group=typeof type==='string'?type:'devices';if(scope.kind==='room'&&['floors','sites'].includes(group)||scope.kind==='floor'&&group==='sites')return result('Escolhe todo o projeto para contar '+match[1]+'.');const items=project[group].filter(d=>inScope(project,d,group,scope)&&(!Array.isArray(type)||type.includes(d.type)));return result('Âmbito: '+scope.label+'.\n'+items.length+' '+match[1]+' registado(s). Estes valores descrevem o inventário documental.');}
 // Search terms are kept verbatim for local names, IPs and serial numbers.
 match=String(prompt).trim().match(/^(?:onde (?:está|esta|fica|estão|estao|ficam)|localiza|procura|encontra)\s+(?:(?:o|a|os|as)\s+)?(.+?)[?!.]*$/iu);
 if(match){const query=match[1].replace(/^(?:equipamento|dispositivo)\s+/iu,'').replace(/^["“]|["”]$/g,'').trim();if(!query)return null;const found=equipmentResults(project,query);if(!found.length)return result('Não encontrei equipamentos para «'+query+'». Experimenta o nome, IP ou número de série.');const rows=found.slice(0,8);return result(found.length+' resultado(s) no projeto:\n'+rows.map(d=>'• '+d.name+' · '+locationText(project,d)).join('\n')+(found.length>rows.length?'\nA mostrar os primeiros 8; acrescenta uma sala ou parte do nome para restringir.':''),rows.map(target));}
 if(/^(?:resume|mostra|explica) (?:o )?equipamento selecionado$|^(?:qual e o estado|quais sao as portas|que ligacoes tem) (?:do |o )?equipamento selecionado$/.test(text)){
 const d=state.selected?.type==='devices'?project.devices.find(d=>d.id===state.selected.id):null;if(!d)return result('Seleciona um equipamento no mapa ou inventário para consultar a sua ficha.');const ports=portsFor(project,d),used=ports.filter(port=>portInUse(project,d.id,port)),links=project.links.filter(l=>l.a===d.id||l.b===d.id);return result(d.name+' · '+d.type+'\n'+locationText(project,d)+'\nEstado registado: '+(d.record?.state||'por definir')+'.\n'+used.length+' de '+ports.length+' portas de rede ocupadas; '+links.length+' ligação(ões) documentada(s).\nPróxima revisão: '+(d.record?.nextMaintenance||'não agendada')+'. Substituição: '+(d.record?.replacementDate||'não agendada')+'.\nEstes registos não confirmam o funcionamento real.',[target(d)]);
 }
 const maintenance=/^(?:que|quais) (?:as )?(?:manutencoes|revisoes|substituicoes)(?: estao)? (?:pendentes|previstas|vencidas)(?: (?:no projeto|nesta sala|na sala atual|neste piso|no piso atual|neste edificio|no edificio atual))?$/.test(text);
 const issues=/^(?:o que falta (?:configurar|documentar)|quais (?:sao )?(?:as )?pendencias)(?: (?:no projeto|nesta sala|na sala atual|neste piso|no piso atual|neste edificio|no edificio atual))?$/.test(text);
 if(!maintenance&&!issues)return null;
 if(!scope.label)return scopeMissing();
 const report=operationReport(project,today?{today}:{}),items=report.issues.filter(issue=>{
 if(maintenance&&!(text.includes('substituicoes')?issue.kind==='replacement':text.includes('revisoes')?issue.kind==='maintenance':['maintenance','replacement'].includes(issue.kind)))return false;
 if(text.includes('vencidas')&&(!issue.due||issue.due>=report.today))return false;
 const group=issue.targetType,item=project[group]?.find(x=>x.id===issue.targetId);return item&&inScope(project,item,group,scope);
 }),rows=items.slice(0,8),targets=[];
 for(const issue of rows)if(issue.targetType==='devices'&&!targets.some(t=>t.id===issue.targetId)){const d=project.devices.find(d=>d.id===issue.targetId);if(d)targets.push(target(d));}
 const heading='Âmbito: '+scope.label+' · '+report.today+' (UTC).\n'+items.length+' pendência(s) documental(is).';
 return result(heading+(rows.length?'\n'+rows.map(i=>'• '+i.label+': '+i.detail).join('\n'):'')+(items.length>8?'\nA mostrar 8; consulta Pendências e capacidade para a lista completa.':'')+(maintenance?'\nInclui revisões até 30 dias e substituições até 90 dias, incluindo vencidas. Equipamentos abatidos são excluídos.':''),targets);
}
