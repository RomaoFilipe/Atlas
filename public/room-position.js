export function freeRoomPosition(p,room){
 const floor=p.floors.find(f=>f.id===room.floor),site=p.sites.find(s=>s.id===floor?.site);if(!site)throw Error('Escolha um piso existente.');const peers=p.rooms.filter(r=>r.floor===room.floor),gap=.2;
 const minX=-site.w/2+room.w/2,maxX=site.w/2-room.w/2,minZ=-site.d/2+room.d/2,maxZ=site.d/2-room.d/2;
 const candidates=[];
 // Rectangle edges provide compact candidates without a costly fine grid.
 const xs=[minX,maxX,room.x],zs=[minZ,maxZ,room.z];
 for(const r of peers){xs.push(r.x+(r.w+room.w)/2+gap,r.x-(r.w+room.w)/2-gap);zs.push(r.z+(r.d+room.d)/2+gap,r.z-(r.d+room.d)/2-gap);}
 for(const x of new Set(xs))for(const z of new Set(zs))if(Number.isFinite(x)&&Number.isFinite(z)&&x>=minX&&x<=maxX&&z>=minZ&&z<=maxZ&&!peers.some(r=>Math.abs(x-r.x)<(room.w+r.w)/2+.01&&Math.abs(z-r.z)<(room.d+r.d)/2+.01))candidates.push({x,z});
 candidates.sort((a,b)=>Math.hypot(a.x-room.x,a.z-room.z)-Math.hypot(b.x-room.x,b.z-room.z));
 if(!candidates.length)throw Error('Não existe espaço livre para outra sala neste piso. Aumente o edifício ou ajuste as salas antes de duplicar.');
 return candidates[0];
}
