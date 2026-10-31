import test from 'node:test';
import assert from 'node:assert/strict';
import {quickConfiguration} from '../public/assistant-fast-actions.js';
test('exact direct commands preserve names and explicit absence of floors',()=>{
 assert.deepEqual(quickConfiguration('Cria um edifício chamado Sede sem pisos nem salas.',{}).actions,[{action:'create_building',ref:'new_site',name:'Sede'}]);
 assert.equal(quickConfiguration('Cria a VLAN 30 com o nome Administração.',{}).actions[0].name,'Administração');
 const context={rooms:[{ref:'room_1'}],currentRoom:'room_1'};assert.equal(quickConfiguration('Adiciona 3 computadores à sala atual.',context).actions[0].quantity,3);
});
test('ambiguous, unsupported and compound requests never enter the fast execution path',()=>{
 for(const prompt of ['Como criar um edifício chamado Sede?','Cria um edifício chamado Sede com dois pisos.','Cria um edifício chamado Sede e apaga tudo.','Apaga o projeto.','Adiciona 3 computadores à sala atual.','Cria a VLAN 5000 com o nome Inválida.'])assert.equal(quickConfiguration(prompt,{}),null,prompt);
});
