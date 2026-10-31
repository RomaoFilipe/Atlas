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
 if(!actions)return null;validateAssistantActions(actions);validateAssistantIntent(actions,prompt);
 return{reply:'',actions,mode:'configure',source:'validated-command',sources:[]};
}
