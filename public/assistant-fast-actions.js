import {validateAssistantActions,validateAssistantIntent,sanitizeAssistantContext} from './assistant-protocol.js';
// Only exact, unambiguous commands. Everything else goes to the configured model.
export function quickConfiguration(prompt,context){
 const text=String(prompt||'').trim(),clean=sanitizeAssistantContext(context);let actions=null,match;
 const name=value=>{const result=value.trim().replace(/^"|"$/g,'');return result.length<=100&&!/\b(?:com|e|sem|pisos?|salas?|equipamentos?|cabos?)\b/iu.test(result)?result:null;};
 match=text.match(/^(?:cria|criar|adiciona) (?:um )?edif[ií]cio (?:chamado|com o nome) (.+?)(?: sem pisos(?: nem salas)?)?[.!]?$/iu);
 if(match){const label=name(match[1]);if(label)actions=[{action:'create_building',ref:'new_site',name:label}];}
 match=text.match(/^(?:adiciona|adicionar|cria) ([1-9]|1[0-9]|20) (computadores|impressoras|telefones IP|tomadas de rede) (?:[aà] sala atual|na sala atual)[.!]?$/iu);
 if(match&&clean.currentRoom){const type=({'computadores':'Computador','impressoras':'Impressora','telefones ip':'Telefone IP','tomadas de rede':'Tomada de rede'})[match[2].toLowerCase()];actions=[{action:'add_devices',ref:'new_devices',room:clean.currentRoom,type,name:type,quantity:Number(match[1])}];}
 if(clean.currentRoom&&/^liga [aà] rede os equipamentos da sala atual usando as portas livres[.!]?$/iu.test(text))actions=[{action:'connect_room',room:clean.currentRoom}];
 match=text.match(/^cria (?:a )?VLAN ([1-9][0-9]{0,3}) com o nome (.+?)[.!]?$/iu);
 if(match&&Number(match[1])<=4094){const label=name(match[2]);if(label)actions=[{action:'create_vlan',ref:'new_vlan',vlan:Number(match[1]),name:label}];}
 // Quantified room insertion is handled locally, including explicit exclusions.
 // Match the whole sentence: unknown trailing instructions still go to the model.
 const normalized=text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const roomInsertion=normalized.match(/^(?:prepara esta sala para um pequeno escritorio:\s*)?(?:insere|adiciona|equipa a sala atual com) (.+?)(?:,? sem (telefones(?: ip)?)(?: nem (tomadas(?: de rede)?)(?: novas)?)?)?[.!]?$/);
 if(clean.currentRoom&&roomInsertion){
  const counts={um:1,uma:1,dois:2,duas:2,tres:3,quatro:4,cinco:5,seis:6,sete:7,oito:8,nove:9,dez:10},fields={},types={'posto':'workstations','postos':'workstations','posto de trabalho':'workstations','postos de trabalho':'workstations','impressora':'printers','impressoras':'printers','telefone ip':'phones','telefones ip':'phones','tomada de rede':'sockets','tomadas de rede':'sockets'};let valid=true;
  for(const part of roomInsertion[1].replace(/[.!]$/,'').split(/,| e /)){const m=part.trim().match(/^(\d{1,2}|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez) (.+)$/),field=m&&types[m[2]],quantity=m&&(Number(m[1])||counts[m[1]]);if(!field||!quantity||quantity>20||Object.hasOwn(fields,field)){valid=false;break;}fields[field]=quantity;}
  if(valid&&Object.keys(fields).length)actions=[{action:'equip_room',room:clean.currentRoom,...fields}];
 }
 if(!actions)return null;validateAssistantActions(actions);validateAssistantIntent(actions,prompt);
 return{reply:'',actions,mode:'configure',source:'validated-command',sources:[]};
}
