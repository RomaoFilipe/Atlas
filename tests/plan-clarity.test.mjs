import test from 'node:test';import assert from 'node:assert/strict';
import {makeExample} from '../public/examples.js';
import {makePlan,planGeometry} from '../public/plan.js';
import {resolvePlanScope} from '../public/plan-scope.js';

test('all-floor positions view is a building navigator rather than overlapping devices',()=>{
 const p=makeExample('municipal'),before=JSON.stringify(p),svg=makePlan({project:p});
 for(const f of p.floors)assert(svg.includes('data-plan-id="'+f.id+'"'));
 assert(!svg.includes('data-plan-type="devices"'));assert(!svg.includes('data-plan-type="links"'));
 assert.equal(JSON.stringify(p),before);
});
test('municipal spatial labels stay inside their own rooms on each floor and never overlap',()=>{
 const p=makeExample('municipal');
 for(const f of p.floors){const svg=makePlan({project:p,floorId:f.id}),g=planGeometry(p,{floorId:f.id}),site=p.sites.find(s=>s.id===f.site),rects=[];
 for(const d of [...p.racks.filter(d=>d.floor===f.id),...p.devices.filter(d=>d.floor===f.id&&!d.rack&&d.type!=='VM')]){
 const room=p.rooms.find(r=>r.id===d.room);if(!room)continue;
 const entry=svg.match(new RegExp('data-plan-id="'+d.id+'"[^>]*><rect x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"'));
 assert(entry,d.id);const [x,y,w,h]=entry.slice(1).map(Number),box={x:g.x(site.x+room.x-room.w/2),y:g.y(site.z+room.z-room.d/2),w:room.w*g.scale,h:room.d*g.scale};
 assert(x>=box.x&&x+w<=box.x+box.w,d.id+' outside room horizontally');assert(y>=box.y+30&&y+h<=box.y+box.h,d.id+' outside room vertically');rects.push({x,y,w,h,id:d.id});
 }
 for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){const a=rects[i],b=rects[j];assert(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y,a.id+' overlaps '+b.id);}
 }
});
test('default floor has no cable mesh, selection reveals only attached cables and All is explicit',()=>{
 const p=makeExample('municipal');let svg=makePlan({project:p,floorId:'pacos-0'});assert(!svg.includes('data-plan-type="links"'));
 svg=makePlan({project:p,floorId:'pacos-0',selected:'posto-01'});assert(svg.includes('data-plan-id="TERMINAL-posto-01"'));assert(!svg.includes('data-plan-id="TERMINAL-posto-02"'));assert((svg.match(/stroke-dasharray="3 3"/g)||[]).length<=1);
 svg=makePlan({project:p,floorId:'pacos-0',cableMode:'all'});assert(svg.includes('data-plan-id="TERMINAL-posto-02"'));
 svg=makePlan({project:p,floorId:'pacos-0',selected:'posto-01',cableMode:'none'});assert(!svg.includes('data-plan-type="links"'));
});
test('cross-floor cable uses a bounded circuit with only its endpoints and respects hidden cables',()=>{
 const p=makeExample('municipal'),id='FIBRA-oficinas-0';assert.equal(resolvePlanScope(p,{selectedLink:id}).kind,'circuit');
 const svg=makePlan({project:p,selectedLink:id});assert(svg.includes('data-circuit="true"'));assert(svg.includes('data-plan-id="core"'));assert(svg.includes('data-plan-id="sw-oficinas-0"'));assert(svg.includes('data-plan-id="'+id+'"'));assert(!svg.includes('data-plan-id="posto-01"'));assert(svg.includes('Paços do Concelho'));assert(svg.includes('Armazém e Oficinas'));
 assert(!makePlan({project:p,selectedLink:id,cableMode:'none'}).includes('data-plan-type="links"'));
 assert.equal(resolvePlanScope(p,{selectedLink:'TERMINAL-posto-01'}).floorId,'pacos-0');
});
