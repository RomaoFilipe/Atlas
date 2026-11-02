import test from 'node:test';import assert from 'node:assert/strict';
import {makeExample} from '../public/examples.js';
import {assistantContext,executeAssistantActions} from '../public/assistant-actions.js';
import {localConfiguration} from '../public/assistant-local-actions.js';
import {prepareAgentPlan,verifyAgentPlan} from '../public/assistant-agent.js';
import {validateAssistantActions,validateAssistantIntent} from '../public/assistant-protocol.js';
import {connectNearestOutlet} from '../public/agent-network-tools.js';
import {interfaceProfile} from '../public/physical-network.js';
import {clone} from '../public/model.js';
const nearest='Liga o equipamento selecionado à rede usando a tomada mais próxima.';
function fixture(remove=['POSTO-1','HORIZONTAL-1','PATCH-1']){const p=makeExample('connections');p.links=p.links.filter(l=>!remove.includes(l.id));return p;}
function run(p,prompt,id='pc1'){const snapshot=assistantContext(p,{selected:{type:'devices',id}},prompt),data=localConfiguration(prompt,snapshot);assert(data);return prepareAgentPlan(p,data.actions,snapshot);}
test('agent prepares and verifies three cables through exact passive channels without mutating the input',()=>{
 const p=fixture(),before=JSON.stringify(p),plan=run(p,nearest);assert.equal(JSON.stringify(p),before);assert.equal(plan.expectedLinks.length,3);assert.deepEqual(plan.toolResults[0].route,['pc1','socket1','panel0','sw0']);assert(plan.warnings.some(w=>w.includes('medir')));assert.equal(verifyAgentPlan(plan.project,plan).verified,true);
});
test('agent reuses partial horizontal cabling and repeating a completed task creates nothing',()=>{
 const p=fixture(['POSTO-1','PATCH-1']),horizontal=clone(p.links.find(l=>l.id==='HORIZONTAL-1')),plan=run(p,nearest);assert.equal(plan.expectedLinks.length,2);assert.deepEqual(plan.project.links.find(l=>l.id===horizontal.id),horizontal);const repeated=run(plan.project,nearest);assert.equal(repeated.changed,false);assert.equal(repeated.expectedLinks.length,0);
});
test('the nearest compatible outlet is selected by position rather than project list order',()=>{
 const p=fixture();const far=p.devices.find(d=>d.id==='socket1'),near={...clone(far),id:'near',name:'Tomada próxima',x:0,z:.2};p.devices.push(near);const result=run(p,nearest);assert.equal(result.toolResults[0].route[1],'near');
});
test('missing infrastructure or reservations reject the complete task atomically',()=>{
 const p=fixture();p.devices=p.devices.filter(d=>d.type!=='Switch');const ids=new Set(p.devices.map(d=>d.id));p.links=p.links.filter(l=>ids.has(l.a)&&ids.has(l.b));const before=JSON.stringify(p);assert.throws(()=>run(p,nearest),/switch livre/);assert.equal(JSON.stringify(p),before);
 const q=fixture();q.connectionProposals=[{id:'reserved',a:'pc1',portA:'Ethernet1',b:'socket1',portB:'F1',kind:'copper'}];assert.throws(()=>run(q,nearest),/interface livre/);
});
test('an existing connection to another device is never disconnected to satisfy nearest outlet',()=>{const p=makeExample('connections'),before=JSON.stringify(p);assert.throws(()=>run(p,nearest,'pc3'),/já está ligada/);assert.equal(JSON.stringify(p),before);});
test('interface commands preserve unrelated fields and reject invalid VLANs or half gigabit',()=>{
 const p=fixture(),a=run(p,'Configura a porta "Gi1/0/1" do equipamento selecionado como access na VLAN 30.','sw0');const profile=a.project.devices.find(d=>d.id==='sw0').portProfiles[0];assert.equal(profile.mode,'access');assert.equal(profile.accessVlan,30);assert.equal(profile.maxSpeed,0);assert.deepEqual(profile.supportedSpeeds,[]);
 const b=run(a.project,'Configura a porta "Gi1/0/1" do equipamento selecionado para 100 Mbps em full duplex.','sw0');assert.equal(b.project.devices.find(d=>d.id==='sw0').portProfiles[0].accessVlan,30);assert.equal(b.project.devices.find(d=>d.id==='sw0').portProfiles[0].speed,100);
 assert.throws(()=>run(p,'Configura a porta "Gi1/0/1" do equipamento selecionado como access na VLAN 999.','sw0'),/VLAN/);
 assert.throws(()=>run(p,'Configura a porta "Gi1/0/1" do equipamento selecionado para 1000 Mbps em half duplex.','sw0'),/Half duplex/);
});
test('trunk, administrative state and explicit PoE commands update only the requested interface',()=>{
 const p=fixture(),a=run(p,'Configura a porta "Gi1/0/24" do equipamento selecionado como trunk com VLANs 10, 20 e VLAN nativa 10.','sw0');let c=a.project.devices.find(d=>d.id==='sw0').portProfiles[0];assert.deepEqual(c.allowedVlans,[10,20]);assert.equal(c.nativeVlan,10);
 const b=run(a.project,'Desativa a porta "Gi1/0/24" do equipamento selecionado.','sw0');assert.equal(b.project.devices.find(d=>d.id==='sw0').portProfiles[0].adminUp,false);
 const power=run(p,'Configura a porta "Gi1/0/1" do equipamento selecionado com PoE PSE de 30 W.','sw0');assert.equal(power.project.devices.find(d=>d.id==='sw0').portProfiles[0].poeWatts,30);
});
test('exact cable commands and model reference tools use the same manual cable checks',()=>{
 const p=fixture(),plan=run(p,'Liga a porta "Ethernet1" de "POSTO-01" à porta "F1" de "TOMADA-DUPLA-A" com RJ45 Cat 6A.');assert.equal(plan.expectedLinks[0].category,'Cat 6A');assert.equal(plan.expectedLinks.length,1);
 const prompt='Liga as portas de dados livres com Cat 6.',snapshot=assistantContext(p,{selected:{type:'devices',id:'pc1'}},prompt),ref=id=>[...snapshot.refs].find(([,r])=>r.id===id&&r.type==='devices')[0],port=(id,name)=>[...snapshot.portRefs].find(([,r])=>r.device===id&&r.port===name)[0];const model=prepareAgentPlan(p,[{action:'connect_cable',a:ref('pc1'),portA:port('pc1','Ethernet1'),b:ref('socket1'),portB:port('socket1','F1'),cable:'cat6'}],snapshot);assert.equal(model.expectedLinks.length,1);
});
test('model proposals cannot inject literal configuration or enable a port without authorization',()=>{
 assert.throws(()=>validateAssistantActions([{action:'configure_interface_exact',device:'device_1',port:'P1',adminUp:true}]),/não permitida/);
 assert.throws(()=>validateAssistantIntent([{action:'configure_port',device:'device_1',port:'device_1_port_1',adminUp:true}],'Configura a porta como access na VLAN 30.'),/pedido explícito/);
 assert.throws(()=>validateAssistantActions([{action:'configure_port',device:'device_1',port:'device_1_port_1',mode:'trunk',networks:['network_1','network_1']}]),/lista/);
 const p=fixture(),prompt='Configura a porta "Gi1/0/1" do equipamento selecionado como access na VLAN 30.',snapshot=assistantContext(p,{selected:{type:'devices',id:'sw0'}},prompt),data=localConfiguration(prompt,snapshot);data.actions[0].accessVlan=20;assert.throws(()=>executeAssistantActions(p,data.actions,snapshot),/corresponder exatamente/);
});
test('verification is read-only and postconditions detect changed cables and interfaces',()=>{
 const p=fixture(),read=run(p,'Verifica as ligações do equipamento selecionado.');assert.equal(read.changed,false);const plan=run(p,nearest),tampered=clone(plan.project);tampered.links.find(l=>l.id===plan.expectedLinks[0].id).portA='Ethernet99';assert.throws(()=>verifyAgentPlan(tampered,plan),/cabo diferente/);
 const configured=run(p,'Configura a porta "Gi1/0/1" do equipamento selecionado como access na VLAN 30.','sw0');configured.project.devices.find(d=>d.id==='sw0').portProfiles[0].accessVlan=20;assert.throws(()=>verifyAgentPlan(configured.project,configured),/difere do plano/);
});
test('unknown steps and stale snapshots cannot partially apply an agent plan',()=>{
 const p=fixture(),prompt=nearest+'; Faz magia com tudo.',snapshot=assistantContext(p,{selected:{type:'devices',id:'pc1'}},prompt);assert.throws(()=>localConfiguration(prompt,snapshot),/Nada foi aplicado/);
 const valid=assistantContext(p,{selected:{type:'devices',id:'pc1'}},nearest),actions=localConfiguration(nearest,valid).actions;assert.throws(()=>prepareAgentPlan(clone(p),actions,valid),/projeto mudou/i);
});
test('anonymous context exposes capabilities but no raw port names, owners or IPs',()=>{
 const p=fixture(),d=p.devices.find(d=>d.id==='sw0'),{documented,...profile}=interfaceProfile(d,'Gi1/0/1');d.portProfiles=[{...profile,medium:'copper',mode:'access',accessVlan:30,supportedSpeeds:[100,1000],maxSpeed:1000}];d.record={owner:'OWNER_SECRET'};const context=assistantContext(p,{selected:{type:'devices',id:d.id}}).context,json=JSON.stringify(context);assert(!json.includes('Gi1/0/1'));assert(!json.includes('OWNER_SECRET'));assert(!json.includes(d.ip));assert(context.devices.find(x=>x.ref===context.selection).ports.some(p=>p.mode==='access'&&p.supportedSpeeds.length===2));
});

test('multiple updates to one port verify the final combined configuration',()=>{const p=fixture(),plan=run(p,'Configura a porta "Gi1/0/1" do equipamento selecionado como access na VLAN 30; Configura a porta "Gi1/0/1" do equipamento selecionado para 100 Mbps em full duplex; Verifica as ligações do equipamento selecionado.','sw0');assert.equal(plan.expectedInterfaces.length,1);assert.equal(plan.expectedInterfaces[0].values.speed,100);assert.equal(verifyAgentPlan(plan.project,plan).verified,true);});

test('a verification-only request cannot authorize mutating model tools',()=>{assert.throws(()=>validateAssistantIntent([{action:'connect_nearest_outlet',device:'device_1'}],'Verifica as ligações do equipamento selecionado.'),/apenas de verificação/);assert.throws(()=>validateAssistantIntent([{action:'configure_port',device:'device_1',port:'device_1_port_1',mode:'access'}],'Verifica sem alterar o projeto.'),/pedido explícito|verificação/);});

test('natural room cabling request resolves its named room and never falls back to another room',()=>{
 const p=fixture(),room=p.rooms.find(r=>r.id===p.devices.find(d=>d.id==='pc1').room);room.name='Taxas e Licenças';
 const prompt='Taxas e Licenças NESTA SALA FAZ A configuracao da rede e das fichas, e ligar os computadores !';
 const snapshot=assistantContext(p,{selected:{type:'rooms',id:room.id}},prompt),data=localConfiguration(prompt,snapshot);
 assert.equal(data.actions.length,1);assert.equal(data.actions[0].action,'repair_room');assert.equal(snapshot.refs.get(data.actions[0].room).id,room.id);
 const before=JSON.stringify(p),plan=prepareAgentPlan(p,data.actions,snapshot);assert.equal(JSON.stringify(p),before);assert.ok(plan.expectedLinks.length>0);
 assert.throws(()=>localConfiguration(prompt.replace('Taxas e Licenças','Sala inexistente'),snapshot),/Não identifiquei/);
 assert.equal(localConfiguration(prompt+' Não ligar cabos.',snapshot),null);
});
