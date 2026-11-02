import test from 'node:test';
import assert from 'node:assert/strict';
import {makeExample} from '../public/examples.js';
import {validate,clone,removeEntity} from '../public/model.js';
import {auditProject} from '../public/network.js';
import {validateCableChoice} from '../public/connection-guide.js';
import {assessCircuit,auditPhysicalNetwork,interfaceProfile} from '../public/physical-network.js';
function fixture(){
 const p=makeExample('connections');
 const sw=p.devices.find(d=>d.id==='sw0'),pc=p.devices.find(d=>d.id==='pc1');
 const profile=(d,port,extra={})=>{const {documented,...c}=interfaceProfile(d,port);return {...c,medium:'copper',maxSpeed:1000,supportedSpeeds:[100,1000],...extra};};
 sw.portProfiles=[profile(sw,'Gi1/0/1',{mode:'access',accessVlan:30})];pc.portProfiles=[profile(pc,'Ethernet1')];
 for(const [id,length,installation] of [['PATCH-1',5,'patch'],['HORIZONTAL-1',90,'permanent'],['POSTO-1',5,'patch']])Object.assign(p.links.find(l=>l.id===id),{length,installation,category:'Cat 6A',speed:'1 Gbps'});
 return p;
}
const codes=r=>r.issues.map(i=>i.code);
test('passive channel circuit negotiates documented common speeds and sums all three cables',()=>{
 const p=fixture();validate(p);const r=assessCircuit(p,'POSTO-1');assert.equal(r.status,'compatible');assert.equal(r.speed,1000);assert.equal(r.length,100);assert.equal(r.links.length,3);assert.deepEqual(r.endpoints.map(e=>e.device.id).sort(),['pc1','sw0']);assert(!r.links.includes('POSTO-2'));
});
test('active devices terminate a circuit rather than merging switch ports and uplinks',()=>{const p=fixture(),r=assessCircuit(p,'MINI-PC');assert.deepEqual(r.links,['MINI-PC']);assert(!r.endpoints.some(e=>e.device.id==='sw0'));});
test('channel length and permanent link limits are separate and unknown sections are never zero',()=>{
 const p=fixture();p.links.find(l=>l.id==='POSTO-1').length=6;assert(codes(assessCircuit(p,'PATCH-1')).includes('channel-length'));
 p.links.find(l=>l.id==='HORIZONTAL-1').length=91;assert(codes(assessCircuit(p,'PATCH-1')).includes('permanent-length'));
 p.links.find(l=>l.id==='HORIZONTAL-1').length=null;const r=assessCircuit(p,'PATCH-1');assert.equal(r.length,null);assert(codes(r).includes('unknown-length'));
 p.links.find(l=>l.id==='PATCH-1').length=120;assert(codes(assessCircuit(p,'PATCH-1')).includes('channel-length'));
});
test('missing passive continuation is reported rather than pretending link up',()=>{const p=fixture();p.links=p.links.filter(l=>l.id!=='HORIZONTAL-1');const r=assessCircuit(p,'POSTO-1');assert.equal(r.complete,false);assert.equal(r.speed,null);assert(codes(r).includes('incomplete'));});
test('shutdown and duplex or forced speed conflicts suppress a successful speed',()=>{
 const p=fixture(),a=p.devices.find(d=>d.id==='sw0').portProfiles[0],b=p.devices.find(d=>d.id==='pc1').portProfiles[0];a.adminUp=false;assert.equal(assessCircuit(p,'POSTO-1').status,'blocked');a.adminUp=true;
 a.speed=100;b.speed=1000;assert(codes(assessCircuit(p,'POSTO-1')).includes('speed-mismatch'));assert.equal(assessCircuit(p,'POSTO-1').speed,null);
 a.speed=b.speed=100;a.duplex='full';b.duplex='half';assert(codes(assessCircuit(p,'POSTO-1')).includes('duplex-mismatch'));
});
test('maximum speed alone cannot invent a supported common rate',()=>{
 const p=fixture(),a=p.devices.find(d=>d.id==='sw0').portProfiles[0],b=p.devices.find(d=>d.id==='pc1').portProfiles[0];a.supportedSpeeds=[];assert.equal(assessCircuit(p,'POSTO-1').speed,null);assert(codes(assessCircuit(p,'POSTO-1')).includes('unknown-rates'));
 a.supportedSpeeds=[1000];b.supportedSpeeds=[100];assert(codes(assessCircuit(p,'POSTO-1')).includes('no-common-speed'));
});
test('incompatible medium is found across passive channels and rejected in direct cable choice',()=>{
 const p=fixture();p.devices.find(d=>d.id==='pc1').portProfiles[0].medium='fiber';assert(codes(assessCircuit(p,'POSTO-1')).includes('medium'));
 const l=p.links.find(l=>l.id==='POSTO-1');assert.throws(()=>validateCableChoice(p,l,l.id),/meio físico incompatível/);
});
test('access VLAN mismatches and trunk native or allowed VLAN differences are diagnosed',()=>{
 const p=fixture(),a=p.devices.find(d=>d.id==='sw0').portProfiles[0],b=p.devices.find(d=>d.id==='pc1').portProfiles[0];a.accessVlan=20;assert(codes(assessCircuit(p,'POSTO-1')).includes('endpoint-vlan'));
 Object.assign(a,{mode:'trunk',nativeVlan:10,allowedVlans:[10,20,30]});Object.assign(b,{mode:'trunk',nativeVlan:20,allowedVlans:[20,30]});assert(codes(assessCircuit(p,'POSTO-1')).includes('native-vlan'));assert(codes(assessCircuit(p,'POSTO-1')).includes('allowed-vlans'));
 b.allowedVlans=[10];a.allowedVlans=[20];assert(codes(assessCircuit(p,'POSTO-1')).includes('no-common-vlan'));
});
test('PoE demand is traced through patching and oversubscription is a budget warning',()=>{
 const p=fixture(),sw=p.devices.find(d=>d.id==='sw0'),a=sw.portProfiles[0],b=p.devices.find(d=>d.id==='pc1').portProfiles[0];a.poe='pse';a.poeWatts=30;b.poe='pd';b.poeWatts=40;assert(codes(assessCircuit(p,'POSTO-1')).includes('poe-power'));
 b.poeWatts=20;sw.poeBudgetWatts=15;assert(auditPhysicalNetwork(p).some(i=>i.code==='poe-budget'&&i.severity==='aviso'));a.poe='off';assert(codes(assessCircuit(p,'POSTO-1')).includes('poe-off'));
});
test('legacy projects remain valid and missing facts are explicit review items',()=>{const p=makeExample('connections');validate(p);const r=assessCircuit(p,'POSTO-1');assert.equal(r.status,'review');assert.equal(r.speed,null);assert(codes(r).includes('unknown-interface'));});
test('power and virtual links do not become Ethernet circuits',()=>{const p=fixture();for(const id of ['ENERGIA-01','VIRTUAL-01'])assert.equal(assessCircuit(p,id).status,'not-applicable');});
test('server model rejects invalid or duplicate profiles and protects referenced VLANs',()=>{
 const p=fixture(),d=p.devices.find(d=>d.id==='sw0');validate(p);d.portProfiles.push(clone(d.portProfiles[0]));assert.throws(()=>validate(p),/repetida/);d.portProfiles.pop();d.portProfiles[0].allowedVlans=[999];assert.throws(()=>validate(p),/VLANs permitidas/);d.portProfiles[0].allowedVlans=[];
 d.portProfiles[0].speed=10000;assert.throws(()=>validate(p),/Velocidades suportadas|velocidade fixa/);d.portProfiles[0].speed=0;
 p.devices.forEach(d=>d.vlan=0);p.links.forEach(l=>l.vlans=[]);assert.throws(()=>removeEntity(p,'nets',30),/em utilização/);
});
test('IPv4 audit detects network and broadcast addresses while allowing point-to-point /31',()=>{
 const p=fixture(),d=p.devices.find(d=>d.id==='pc1'),n=p.nets.find(n=>n.id===30);n.subnet='192.0.2.0/24';d.ip='192.0.2.0';assert(auditProject(p).some(i=>i.id===d.id&&i.message.includes('broadcast')));d.ip='192.0.2.255';assert(auditProject(p).some(i=>i.id===d.id&&i.message.includes('broadcast')));n.subnet='192.0.2.254/31';assert(!auditProject(p).some(i=>i.id===d.id&&i.message.includes('broadcast')));
});
test('fibre requires optical verification and 10G copper needs category checks',()=>{
 const p=fixture(),a=p.devices.find(d=>d.id==='sw0').portProfiles[0],b=p.devices.find(d=>d.id==='pc1').portProfiles[0];for(const c of [a,b]){c.maxSpeed=10000;c.supportedSpeeds=[1000,10000];}
 for(const l of p.links.filter(l=>['PATCH-1','HORIZONTAL-1','POSTO-1'].includes(l.id))){l.speed='10 Gbps';l.category='Cat 6';}assert(codes(assessCircuit(p,'POSTO-1')).includes('10g-category'));
 for(const l of p.links.filter(l=>['PATCH-1','HORIZONTAL-1','POSTO-1'].includes(l.id)))l.kind='fiber';a.medium=b.medium='fiber';assert(codes(assessCircuit(p,'POSTO-1')).includes('fiber-optics'));
});
