import test from 'node:test';
import assert from 'node:assert/strict';
import {clone,normalizeProject,replaceProjectContents,validate} from '../public/model.js';
import {makeExample} from '../public/examples.js';
import {labelURL,resolveLabel,labelEntries,labelMarkup,labelsDocument} from '../public/asset-labels.js';
const fixture=()=>({...normalizeProject(makeExample('connections')),labelNamespace:'labels-test-project'});
test('QR links bind to the project and reject credentials, foreign projects, missing devices and ports',()=>{
 const p=fixture(),d=p.devices.find(d=>d.type==='Tomada de rede'),url=labelURL(p,d,'http://192.168.1.103:3000/?unwanted=yes#old','F2'),parsed=new URL(url);
 assert.equal(parsed.searchParams.get('atlasProject'),p.labelNamespace);assert.equal(parsed.searchParams.get('unwanted'),null);assert.equal(parsed.hash,'');assert.equal(resolveLabel(p,url).device.id,d.id);assert.equal(resolveLabel(p,url).port,'F2');
 const other=clone(p);other.labelNamespace='other';assert.throws(()=>resolveLabel(other,url),/outro projeto/);other.labelNamespace=p.labelNamespace;other.devices=other.devices.filter(v=>v.id!==d.id);assert.throws(()=>resolveLabel(other,url),/não existe/);
 const badPort=new URL(url);badPort.searchParams.set('port','F99');assert.throws(()=>resolveLabel(p,badPort.href),/porta/);assert.throws(()=>labelURL(p,d,'javascript:alert(1)'),/HTTP/);assert.throws(()=>labelURL(p,d,'https://user:password@example.com'),/credenciais/);assert.equal(resolveLabel(p,'http://localhost:3000/'),null);
});
test('port label generation keeps each independent outlet and excludes VMs',()=>{
 const p=fixture(),socket=p.devices.find(d=>d.type==='Tomada de rede'),rows=[...labelEntries(p,[socket.id],{socketPorts:true})];assert.equal(rows.length,socket.portCount);assert.equal(rows[0].port,'F1');assert.equal(rows[1].port,'F2');assert.equal([...labelEntries(p,[socket.id])].length,1);
 p.devices.push({...clone(socket),id:'vm-test',type:'VM'});assert.equal([...labelEntries(p,['vm-test'])].length,0);
});
test('print sheets escape inventory names, omit IPs by default and cap jobs at 100 labels',()=>{
 const p=fixture(),d=p.devices.find(d=>d.ip);d.name='<script>alert(1)</script>';const entry={device:d,port:''},markup=labelMarkup(p,entry,'http://192.168.1.103:3000/');assert.ok(markup.includes('&lt;script&gt;'));assert.ok(!markup.includes('<script>'));assert.ok(!markup.includes(d.ip));assert.ok(markup.includes('<svg'));assert.ok(labelMarkup(p,entry,'http://192.168.1.103:3000/',{showIP:true}).includes(d.ip));
 assert.match(labelsDocument(p,[d.id],'http://192.168.1.103:3000/'),/@page\{size:A4/);
 const socket=p.devices.find(d=>d.type==='Tomada de rede');p.devices=[...p.devices,...Array.from({length:51},(_,i)=>({...clone(socket),id:'extra-'+i,portCount:2}))];assert.throws(()=>labelsDocument(p,p.devices.filter(v=>v.id.startsWith('extra-')).map(v=>v.id),'http://localhost:3000/',{socketPorts:true}),/100 etiquetas/);
});
test('project replacement cannot retain another project label namespace or enterprise data',()=>{
 const p=fixture();p.organization={name:'Old company'};const incoming=normalizeProject(makeExample('office'));replaceProjectContents(p,incoming);assert.equal(p.labelNamespace,undefined);assert.equal(p.organization,undefined);assert.equal(p.name,incoming.name);p.name='Changed';assert.notEqual(incoming.name,p.name);validate(p);
 const invalid=fixture();invalid.labelNamespace='<script>';assert.throws(()=>validate(invalid),/etiquetas/);
});
