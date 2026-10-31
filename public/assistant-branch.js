import {executeAssistantActions} from './assistant-actions.js';
export function branchProgram(config){
 if(config?.kind!=='branch'||typeof config.name!=='string'||!config.name.trim()||config.name.length>100||!Number.isInteger(config.floors)||config.floors<1||config.floors>10||!Number.isInteger(config.departments)||config.departments<1||config.departments>20||!Number.isInteger(config.people)||config.people<config.departments||config.people>200||Math.ceil(config.people/config.departments)>30)throw Error('Usa 1–10 pisos, 1–20 departamentos e até 30 postos por departamento (máximo 200 no plano).');
 const perFloor=Math.ceil(config.departments/config.floors),grids=[];
 for(let cols=1;cols<=4;cols++){const rows=Math.ceil(perFloor/cols),width=cols*12+(cols-1)*.2+.4,depth=rows*10+(rows-1)*.2+.4;if(width<=50&&depth<=50)grids.push({width:Math.max(24,width),depth:Math.max(20,depth),cols});}
 grids.sort((a,b)=>a.width*a.depth-b.width*b.depth);if(!grids.length)throw Error('Os departamentos não cabem num edifício de 50 × 50 m. Acrescenta pisos ou reduz departamentos.');
 const grid=grids[0],dimensions={width:grid.width,depth:grid.depth},steps=[{label:'Criar edifício '+config.name,actions:[{action:'create_building',ref:'new_branch_site',name:config.name,...dimensions}]},{label:'Criar '+config.floors+' pisos',actions:Array.from({length:config.floors},(_,i)=>({action:'create_floor',ref:'new_branch_floor_'+i,site:'new_branch_site',name:'Piso '+i,level:i}))}];
 for(let i=0;i<config.departments;i++){const people=Math.floor(config.people/config.departments)+(i<config.people%config.departments?1:0);steps.push({label:'Departamento '+(i+1)+' · '+people+' postos',actions:[{action:'create_room',ref:'new_branch_room_'+i,floor:'new_branch_floor_'+(i%config.floors),name:'Departamento '+(i+1),width:12,depth:10,x:-dimensions.width/2+6.2+(Math.floor(i/config.floors)%grid.cols)*12.2,z:-dimensions.depth/2+5.2+Math.floor(Math.floor(i/config.floors)/grid.cols)*10.2},{action:'prepare_office',room:'new_branch_room_'+i,people,printer:true,outlets:true,rack:true,connect:true,review:true}]});}
 return {steps,dimensions};
}
export function executeBranchStep(project,step,refs,prompt){return executeAssistantActions(project,step.actions,{project,refs:new Map(refs),portRefs:new Map(),context:{},prompt});}
export function planBranch(project,config,prompt){
 if(project.sites.some(s=>s.name.trim().toLowerCase()===config.name.trim().toLowerCase()))throw Error('Já existe um edifício com esse nome. Abre esse edifício ou indica um nome novo para a filial.');
 const program=branchProgram(config);let virtual=project,refs=[];
 for(const step of program.steps){const result=executeBranchStep(virtual,step,refs,prompt);virtual=result.project;refs=result.bindings;}
 return {...program,summary:config.name+': '+config.floors+' pisos, '+config.departments+' departamentos, '+config.people+' postos (uma impressora e um bastidor por departamento) · '+program.steps.length+' etapas; '+(virtual.devices.length-project.devices.length)+' equipamentos novos. Endereçamento e ligação à Internet ficam para configurar.'};
}
