import test from 'node:test';
import assert from 'node:assert/strict';
import {operationReport} from '../public/operations.js';
import {makeExample} from '../public/examples.js';
import {normalizeProject} from '../public/model.js';

test('operations detects warranty boundaries and excludes retired assets and reserve connectivity',()=>{
 const p=normalizeProject(makeExample('office')),a=p.devices.find(d=>d.id==='pc1'),b=p.devices.find(d=>d.id==='pc2');
 a.record={owner:'TI',warranty:'2026-10-24',state:'Em serviço'};b.record={owner:'TI',warranty:'2026-10-23',state:'Em reserva'};p.links=p.links.filter(l=>l.a!==b.id&&l.b!==b.id);const before=JSON.stringify(p),report=operationReport(p,{today:'2026-10-24'});
 assert.ok(report.issues.some(i=>i.kind==='warranty'&&i.targetId===a.id));assert.ok(report.issues.some(i=>i.kind==='expired'&&i.targetId===b.id));assert.ok(!report.issues.some(i=>i.kind==='unconnected'&&i.targetId===b.id));assert.equal(JSON.stringify(p),before);
 b.record.state='Abatido';assert.ok(!operationReport(p,{today:'2026-10-24'}).issues.some(i=>i.targetId===b.id));assert.throws(()=>operationReport(p,{today:'2026-02-31'}),/inválida/);
});
test('site capacity counts documented switch ports and rack units, not live utilization',()=>{
 const p=normalizeProject(makeExample('office')),report=operationReport(p,{today:'2026-10-24'}),summary=report.capacity.get(p.sites[0].id),switches=p.devices.filter(d=>['Switch','Mini-switch'].includes(d.type));
 assert.equal(summary.totalPorts,switches.reduce((sum,d)=>sum+d.portCount,0));assert.ok(summary.freePorts>=0&&summary.freePorts<summary.totalPorts);assert.equal(summary.totalU,p.racks.reduce((n,r)=>n+r.units,0));assert.equal(summary.usedU,p.devices.filter(d=>d.rack).reduce((n,d)=>n+d.units,0));
 assert.ok(report.issues.some(i=>i.kind==='classification'));assert.ok(report.issues.some(i=>i.kind==='owner'));
});
test('grouped branch totals reconcile with project totals and network errors expose their targets',()=>{
 const p=normalizeProject(makeExample('municipal'));for(const site of p.sites)site.branch={country:'PT',unit:'MUNICIPAL',city:'Lisboa',timezone:'Europe/Lisbon',networkDomain:'MUNICIPAL',contact:'TI'};
 const d=p.devices.find(d=>d.ip&&d.vlan);d.ip='203.0.113.10';const report=operationReport(p,{today:'2026-10-24'});assert.equal(report.branches.length,1);assert.equal(report.branches[0].capacity.devices,p.devices.length);assert.equal(report.branches[0].issues.length,report.issues.length);assert.ok(report.issues.some(i=>i.kind==='network'&&i.targetId===d.id&&i.targetType==='devices'));assert.equal(new Set(report.issues.map(i=>i.key)).size,report.issues.length);
});

test('retired switches do not advertise free ports as capacity',()=>{
 const p=normalizeProject(makeExample('office')),sw=p.devices.find(d=>d.type==='Switch'),before=operationReport(p).capacity.get(sw.site).totalPorts;
 sw.record={state:'Abatido'};assert.equal(operationReport(p).capacity.get(sw.site).totalPorts,before-sw.portCount);
});
