import test from 'node:test';
import assert from 'node:assert/strict';
import {clone,normalizeProject,validate} from '../public/model.js';
import {makeExample} from '../public/examples.js';
import {intersiteLinks,planWAN,wanScope,makeWANMap} from '../public/wan.js';
const metadata={provider:'Operador exemplo',reference:'WAN-001',service:'MPLS',role:'primary',backupOf:'',bandwidthMbps:1000,status:'Em serviço'};
const fixture=()=>normalizeProject(makeExample('municipal'));
test('WAN inventory includes only intersite data links and filters keep the remote context',()=>{
 const p=fixture(),links=intersiteLinks(p);assert.ok(links.length>0);for(const l of links){assert.notEqual(p.devices.find(d=>d.id===l.a).site,p.devices.find(d=>d.id===l.b).site);assert.notEqual(l.kind,'power');}
 const scope=wanScope(p,{siteId:p.sites[1].id});assert.ok(scope.links.length>0);assert.ok(scope.sites.length>1);assert.ok(scope.sites.some(s=>s.id===p.sites[1].id));
 assert.equal(wanScope(p,{country:'ZZ'}).links.length,0);
});
test('WAN edits are pure, preserve physical ports, and validate alternative circuits',()=>{
 const p=fixture(),link=intersiteLinks(p)[0],before=JSON.stringify(p),next=planWAN(p,link.id,metadata);assert.equal(JSON.stringify(p),before);const updated=next.links.find(l=>l.id===link.id);assert.equal(updated.portA,link.portA);assert.equal(updated.portB,link.portB);assert.equal(updated.wan.bandwidthMbps,1000);validate(next);
 const backup={...clone(link),id:'backup-circuit',kind:'virtual',portA:'',portB:'',label:'Alternativo'};next.links.push(backup);const configured=planWAN(next,backup.id,{...metadata,role:'backup',backupOf:link.id,reference:'WAN-002'});validate(configured);
 assert.throws(()=>planWAN(configured,backup.id,{...metadata,role:'backup',backupOf:'missing'}),/principal/);
 assert.throws(()=>planWAN(configured,link.id,{...metadata,role:'backup',backupOf:backup.id}),/principal/);
 assert.throws(()=>planWAN(p,link.id,{...metadata,bandwidthMbps:-1}),/Mbps/);
 const local=p.links.find(l=>p.devices.find(d=>d.id===l.a)?.site===p.devices.find(d=>d.id===l.b)?.site);assert.throws(()=>planWAN(p,local.id,metadata),/diferentes/);
});
test('deleting a principal clears stale references without deleting the alternative',()=>{
 const p=fixture(),main=intersiteLinks(p)[0];p.links.push({...clone(main),id:'alternate',kind:'virtual',portA:'',portB:'',wan:{...metadata,role:'backup',backupOf:main.id}});
 p.links=p.links.filter(l=>l.id!==main.id);assert.throws(()=>validate(p),/principal/);normalizeProject(p);assert.equal(p.links.find(l=>l.id==='alternate').wan.backupOf,'');assert.equal(p.links.find(l=>l.id==='alternate').wan.role,'backup');validate(p);
});
test('WAN diagram escapes names and makes its truncation explicit',()=>{
 const p=fixture();p.sites[0].name='<script>alert(1)</script>';const svg=makeWANMap(p);assert.ok(!svg.includes('<script>'));assert.ok(svg.includes('&lt;script&gt;'));assert.ok(svg.includes('data-wan-link='));
 const more=clone(p);for(let i=0;i<25;i++)more.sites.push({...clone(p.sites[0]),id:'extra-'+i,name:'Extra '+i});assert.match(makeWANMap(more),/Mostra 24 de/);
});
