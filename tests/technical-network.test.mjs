import test from 'node:test';
import assert from 'node:assert/strict';
import {devicePorts,floorNetwork,socketPortMarkers,technicalPanelHTML} from '../public/technical-network.js';
import {normalizeProject} from '../public/model.js';
import {makeExample} from '../public/examples.js';
import {makePlan,planGeometry} from '../public/plan.js';

test('port inventory keeps outlet front and rear channels independent and identifies the peer',()=>{
 const p=normalizeProject(makeExample('municipal')),socket=p.devices.find(d=>d.type==='Tomada de rede'),before=JSON.stringify(p),ports=devicePorts(p,socket);
 assert.equal(ports.length,socket.portCount*2);
 for(const entry of ports){const link=p.links.find(l=>l.kind!=='virtual'&&((l.a===socket.id&&l.portA===entry.port)||(l.b===socket.id&&l.portB===entry.port)));assert.equal(entry.link?.id,link?.id);if(link)assert.ok(entry.other);}
 assert.equal(JSON.stringify(p),before);
});
test('floor inventory includes rack equipment, counts RJ45 fronts and excludes power cables',()=>{
 const p=normalizeProject(makeExample('municipal')),f=p.floors[0],network=floorNetwork(p,f.id);
 assert.ok(network.devices.some(d=>d.rack));
 assert.equal(network.outlets.length,network.sockets.reduce((n,d)=>n+d.portCount,0));
 assert.ok(network.links.every(l=>!['power','virtual'].includes(l.kind)));
 assert.equal(floorNetwork(p,f.id,'missing-room').devices.length,0);
});
test('plan socket markers expose actionable ports and selected rack lists installed devices',()=>{
 const p=normalizeProject(makeExample('municipal')),socket=p.devices.find(d=>d.type==='Tomada de rede'),floorId=socket.floor;
 const markers=socketPortMarkers(p,[socket],planGeometry(p,{floorId}));
 assert.match(markers,/data-network-port="F1"/);assert.match(markers,/data-network-port="F2"/);assert.doesNotMatch(markers,/data-network-port="R1"/);
 const svg=makePlan({project:p,floorId,ports:true,cableMode:'all'});assert.match(svg,/socket-port-markers/);
 assert.doesNotMatch(makePlan({project:p,floorId,ports:false}),/socket-port-markers/);
 const rack=p.racks.find(r=>p.devices.some(d=>d.rack===r.id));
 const html=technicalPanelHTML(p,{floorId:rack.floor,selected:{type:'racks',id:rack.id}});
 for(const d of p.devices.filter(d=>d.rack===rack.id))assert.ok(html.includes('data-network-select="'+d.id+'"'));
 socket.name='<img src=x onerror=alert(1)>';
 const panel=technicalPanelHTML(p,{floorId,selected:{type:'devices',id:socket.id}});assert.ok(panel.includes('&lt;img'));assert.ok(!panel.includes('<img'));
});

test('switching floors never shows ports or rack inventory from a previous location',()=>{
 const p=normalizeProject(makeExample('municipal')),first=p.devices.find(d=>d.type==='Tomada de rede'),other=p.floors.find(f=>f.id!==first.floor);
 const html=technicalPanelHTML(p,{floorId:other.id,selected:{type:'devices',id:first.id}});
 assert.ok(!html.includes('data-network-device="'+first.id+'"'));
 const rack=p.racks.find(r=>r.floor!==other.id);assert.ok(!technicalPanelHTML(p,{floorId:other.id,selected:{type:'racks',id:rack.id}}).includes('network-rack-list'));
});
