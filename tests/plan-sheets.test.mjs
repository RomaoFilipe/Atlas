import test from 'node:test';
import assert from 'node:assert/strict';
import {makeExample} from '../public/examples.js';
import {projectPlanSheets,planSheetsHTML} from '../public/plan-print.js';
import {blockLayout,makeBlockPlan} from '../public/plan-blocks.js';
test('PDF always contains overview and every floor in building/level order, ignoring active map filters',()=>{
 const p=makeExample('municipal'),before=JSON.stringify(p);p.floors.reverse();
 const sheets=projectPlanSheets(p,{floorId:'pacos-0',roomId:'dept-ATM',selected:'posto-01',path:['posto-01']});
 assert.deepEqual(sheets.map(s=>s.id),['overview','pacos-0','pacos-1','pacos-2','oficinas-0','protecao-0']);
 for(const f of p.floors){const sheet=sheets.find(s=>s.id===f.id);assert(sheet.title.includes(p.sites.find(s=>s.id===f.site).name));for(const d of p.devices.filter(d=>d.floor===f.id&&d.type!=='VM'))assert(sheet.svg.includes('data-plan-id="'+d.id+'"'),d.id);for(const d of p.devices.filter(d=>d.floor!==f.id))assert(!sheet.svg.includes('data-plan-id="'+d.id+'"'),d.id);}
 assert.equal((planSheetsHTML(p).match(/class="atlas-print-sheet"/g)||[]).length,6);p.floors.reverse();assert.equal(JSON.stringify(p),before);
});
test('organised map keeps every room and equipment card inside its block without overlaps or moving coordinates',()=>{
 const p=makeExample('municipal'),before=JSON.stringify(p);
 for(const f of p.floors){const layout=blockLayout(p,{floorId:f.id});for(const box of layout.items){const cells=box.members.map(d=>layout.positions.get(d.id));for(const c of cells){assert(c.x-c.w/2>=box.x);assert(c.x+c.w/2<=box.x+box.w);assert(c.y-c.h/2>=box.y+75);assert(c.y+c.h/2<=box.y+box.h);}for(let i=0;i<cells.length;i++)for(let j=i+1;j<cells.length;j++){const a=cells[i],b=cells[j];assert(Math.abs(a.x-b.x)>=(a.w+b.w)/2||Math.abs(a.y-b.y)>=(a.h+b.h)/2);}}}
 assert.equal(JSON.stringify(p),before);
});
test('large campus blocks are disjoint, grow the drawing and retain accessible floor IDs',()=>{
 const p=makeExample('municipal');for(let i=0;i<15;i++){p.sites.push({...p.sites[0],id:'building-'+i,name:'Edifício '+i});p.floors.push({id:'floor-'+i,site:'building-'+i,name:'Piso '+i,level:i});}
 const layout=blockLayout(p),svg=makeBlockPlan({project:p});assert(layout.height>1320);assert(!svg.includes('undefined'));for(const f of p.floors)assert(svg.includes('data-plan-id="'+f.id+'"'));
 for(let i=0;i<layout.items.length;i++)for(let j=i+1;j<layout.items.length;j++){const a=layout.items[i],b=layout.items[j];assert(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y);}
});
test('imported floor backgrounds are retained in full-project export and user strings stay escaped',()=>{
 const p=makeExample('municipal'),f=p.floors[0];f.plan={asset:'image-1',x:0,z:0,widthMeters:42,heightMeters:22,opacity:.5};p.name='<script>bad</script>';p.rooms[0].name='<img onerror="bad">';
 const sheets=projectPlanSheets(p,{imageData:{'image-1':'data:image/png;base64,dGVzdA=='}});assert(sheets.find(s=>s.id===f.id).svg.includes('<image href="data:image/png;base64,dGVzdA=="'));
 const html=planSheetsHTML(p);assert(!html.includes('<script>'));assert(!html.includes('<img onerror='));assert(html.includes('&lt;script&gt;'));
});
