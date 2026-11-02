import test from 'node:test';import assert from 'node:assert/strict';
import {quickConfiguration} from '../public/assistant-fast-actions.js';
import {validateAssistantIntent} from '../public/assistant-protocol.js';
const context={rooms:[{ref:'room_1'}],currentRoom:'room_1'};
const prompt='Prepara esta sala para um pequeno escritório: insere dois postos de trabalho e uma impressora, sem telefones nem tomadas novas.';
test('the previously failing request preserves exact workstation quantities and exclusions locally',()=>{const result=quickConfiguration(prompt,context);assert.equal(result.source,'validated-command');assert.deepEqual(result.actions,[{action:'equip_room',room:'room_1',workstations:2,printers:1}]);});
test('unrecognized trailing commands and ambiguous counts do not get partly executed',()=>{assert.equal(quickConfiguration(prompt+' Apaga tudo.',context),null);assert.equal(quickConfiguration('Insere alguns postos e uma impressora.',context),null);assert.equal(quickConfiguration('Insere dois postos e dois postos.',context),null);});
test('model output cannot replace explicitly requested desks with generic computers',()=>{assert.throws(()=>validateAssistantIntent([{action:'prepare_office',room:'room_1',people:2}],prompt),/postos de trabalho/);assert.throws(()=>validateAssistantIntent([{action:'add_devices',type:'Telefone IP'}],prompt),/excluiu/);assert.doesNotThrow(()=>validateAssistantIntent([{action:'equip_room',workstations:2,printers:1}],prompt));});
