import test from 'node:test';
import assert from 'node:assert/strict';
import {spaceTree} from '../public/workspace-shell.js';
const p={sites:[{id:'s',name:'Edifício <Norte>'}],floors:[{id:'f',site:'s',name:'Piso 0'}],rooms:[{id:'r',floor:'f',name:'Receção & apoio'}],devices:[{id:'pc',room:'r'}]};
test('location tree exposes floor and room destinations and escapes user names',()=>{const html=spaceTree(p,{floorId:'f',roomId:'r'});assert.match(html,/data-tree-key="s" open/);assert.match(html,/data-tree-key="f" open/);assert.match(html,/data-tree-floor="f"/);assert.match(html,/data-tree-room="r" aria-current="location"/);assert.match(html,/Edifício &lt;Norte&gt;/);assert.match(html,/Receção &amp; apoio/);assert.doesNotMatch(html,/<Norte>/);});
test('tree preserves expanded branches and supports empty buildings',()=>{assert.match(spaceTree(p,{},new Set(['s'])),/data-tree-key="s" open/);assert.match(spaceTree({...p,floors:[],rooms:[]}),/primeiro piso/);});
