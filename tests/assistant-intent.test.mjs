import test from 'node:test';
import assert from 'node:assert/strict';
import {assistantRequestMode} from '../public/assistant-intent.js';
test('help questions never authorize configuration',()=>{
 for(const prompt of ['Como criar um edifício?','Onde adiciono equipamentos?','Explica como ligar cabos','Podes ensinar a criar VLANs?','O que preciso para começar?'])assert.equal(assistantRequestMode('configure',prompt),'advice');
 assert.equal(assistantRequestMode('configure','Cria um edifício chamado Sede.'),'configure');
 assert.equal(assistantRequestMode('advice','Cria um edifício'),'advice');
});
