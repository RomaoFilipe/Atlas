import {performance} from 'node:perf_hooks';
import {analyseMapProblems,cachedMapProblems} from '../public/map-problems.js';
import {equipmentOverlaps} from '../public/move-alignment.js';
const devices=Array.from({length:450},(_,i)=>({id:'device-'+i,name:'PC '+i,type:'Computador',site:'site',floor:'floor',room:'room',x:(i%25)*1.6-20,z:Math.floor(i/25)*1.2-12,y:.6})),project={devices,links:[]};
const measure=fn=>{fn();const samples=[];for(let i=0;i<7;i++){const start=performance.now();fn();samples.push(performance.now()-start);}return samples.sort((a,b)=>a-b)[3];};
const baseline=measure(()=>{for(const device of devices)equipmentOverlaps(project,device.id);});
const diagnostics=measure(()=>analyseMapProblems(project));cachedMapProblems(project);
const cached=measure(()=>{for(let i=0;i<1000;i++)cachedMapProblems(project);});
console.log(JSON.stringify({devices:devices.length,scenario:'Espaçamento regular no mesmo piso; mediana de 7 execuções, em ms',previousOverlapPassMs:+baseline.toFixed(3),newFullDiagnosticsMs:+diagnostics.toFixed(3),cached1000ReadsMs:+cached.toFixed(3),issues:cachedMapProblems(project).issues.length},null,2));
