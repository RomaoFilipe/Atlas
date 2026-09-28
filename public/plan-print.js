import {makePlan} from './plan.js';
import {makeBlockPlan,sortedFloors} from './plan-blocks.js';
import {escapeHTML as e} from './model.js';
// Export scope is always the complete project, never the current map filters.
export function projectPlanSheets(project,{imageData={},ips=true,power=true,virtual=false,organized=true}={}){
 const common={project,imageData,ips,power,virtual,cables:true,labels:true,grid:false};
 const sheets=[{id:'overview',title:'Visão geral · edifícios e pisos',svg:makeBlockPlan(common)}];
 for(const floor of sortedFloors(project)){
  const site=project.sites.find(s=>s.id===floor.site);
  sheets.push({id:floor.id,title:site.name+' / '+floor.name,svg:!organized||floor.plan?makePlan({...common,floorId:floor.id}):makeBlockPlan({...common,floorId:floor.id})});
 }
 return sheets;
}
export function planSheetsHTML(project,options={}){
 const sheets=projectPlanSheets(project,options);
 return sheets.map((s,i)=>`<section class="atlas-print-sheet" data-print-floor="${e(s.id)}"><header><strong>${e(project.name)}</strong><span>${e(s.title)}</span></header><div class="atlas-print-drawing">${s.svg}</div><footer><span>Infraestrutura documentada · ${e(new Date().toLocaleDateString('pt-PT'))}</span><span>${i+1} / ${sheets.length}</span></footer></section>`).join('');
}
export const planPrintStyles=`.atlas-print-sheet{background:white;color:#203746;box-sizing:border-box;display:flex;flex-direction:column;gap:4mm;margin:0;padding:0;break-inside:avoid;break-after:page}.atlas-print-sheet:last-child{break-after:auto}.atlas-print-sheet>header,.atlas-print-sheet>footer{display:flex;justify-content:space-between;gap:8mm;font:12px Arial,sans-serif;position:static;border:0;padding:0;margin:0;height:auto;flex:none;background:white;color:#203746}.atlas-print-sheet>header{flex-wrap:wrap}.atlas-print-drawing{flex:1;min-height:0;display:flex;align-items:center;justify-content:center}.atlas-print-drawing>svg{display:block;width:100%;height:100%;max-height:none;print-color-adjust:exact;-webkit-print-color-adjust:exact}@media print{.atlas-print-sheet{height:269mm;width:100%;}.atlas-print-sheet>footer{margin-top:auto}}`;
