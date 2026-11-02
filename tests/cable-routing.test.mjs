import test from 'node:test';
import assert from 'node:assert/strict';
import {rackCableRoute} from '../public/cable-routing.js';
const anchor=(point,direction=[0,0,1])=>({point,direction});
const near=(actual,expected)=>actual.forEach((n,i)=>assert(Math.abs(n-expected[i])<1e-10));
test('rack jackets begin at the strain relief on both sockets and preserve the lead direction',()=>{
 const a=anchor([-.4,2,.58]),b=anchor([.3,1,.58]);const r=rackCableRoute(a,b);
 near(r.start,[-.4,2,.69]);near(r.end,[.3,1,.69]);near(r.points[0],r.start);near(r.points.at(-1),r.end);assert(r.points[1][2]>r.start[2]);assert(r.points.at(-2)[2]>r.end[2]);
});
test('rear plugs leave the rear instead of routing their lead through the chassis',()=>{const r=rackCableRoute(anchor([0,2,-.52],[0,0,-1]),anchor([.2,1,-.52],[0,0,-1]));assert(r.start[2]<-.52);assert(r.points[1][2]<r.start[2]);assert(r.points.at(-2)[2]<r.end[2]);});
test('a front-to-rear patch lead changes face outside the rack wall',()=>{
 const r=rackCableRoute(anchor([-.4,2,.58]),anchor([.3,1,-.52],[0,0,-1]));const transitions=r.points.filter(p=>p[2]===0);assert.equal(transitions.length,2);assert(transitions.every(p=>p[0]>.7));
});
test('routing lanes are deterministic, separated and stay away from the hinged door',()=>{const a=anchor([0,2,.58]),b=anchor([.2,1,.58]);const x=rackCableRoute(a,b,{lane:0}),y=rackCableRoute(a,b,{lane:1});assert.notDeepEqual(x.points,y.points);assert.deepEqual(x,rackCableRoute(a,b,{lane:0}));assert(x.points[2][0]>.7&&y.points[2][0]>.7);});
test('an external continuation can exit sideways without creating a second physical socket',()=>{const r=rackCableRoute(anchor([0,2,.58]),anchor([1.3,1.8,.9],[-1,0,0]),{exit:true});near(r.end,[1.19,1.8,.9]);assert(r.points.every(p=>p.every(Number.isFinite)));});
