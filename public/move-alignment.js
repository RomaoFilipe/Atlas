// Approximate occupied floor area of free-standing equipment, in metres.
const sizes={'Posto de trabalho':[1.85,2.1,0,.35],Computador:[1.2,.8,.15,.1],Portátil:[.75,.7,0,.1],Impressora:[.75,.9,0,.1],UPS:[.65,.65,0,0]};
export function floorFootprint(d,x=d.x,z=d.z){
 const [w,depth,ox,oz]=sizes[d.type]||[.6,.6,0,0],angle=(d.rotation||0)*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle),cx=x+ox*c+oz*s,cz=z-ox*s+oz*c,hw=(Math.abs(w*c)+Math.abs(depth*s))/2,hd=(Math.abs(w*s)+Math.abs(depth*c))/2;
 return {minX:cx-hw,maxX:cx+hw,minZ:cz-hd,maxZ:cz+hd};
}
export function canAlign(d){return !!d&&!d.rack&&!d.host&&!['VM','Tomada de rede','Wi-Fi','Câmara','Internet'].includes(d.type);}
function peers(p,d){return p.devices.filter(o=>o.id!==d.id&&canAlign(o)&&o.site===d.site&&o.floor===d.floor&&Math.abs((o.y||0)-(d.y||0))<.8);}
export function equipmentOverlaps(p,id){const d=p.devices.find(d=>d.id===id);if(!canAlign(d))return [];const a=floorFootprint(d);return peers(p,d).filter(o=>{const b=floorFootprint(o);return Math.min(a.maxX,b.maxX)-Math.max(a.minX,b.minX)>.03&&Math.min(a.maxZ,b.maxZ)-Math.max(a.minZ,b.minZ)>.03;});}
export function alignEquipment(p,id,x,z,{enabled=true,tolerance=.25,gap=.2}={}){
 const d=p.devices.find(d=>d.id===id);if(!canAlign(d)||!enabled)return {x,z,guides:[]};
 const a=floorFootprint(d,x,z),guides=[];let nx=Math.round(x*10)/10,nz=Math.round(z*10)/10;
 for(const [axis,min,max,value] of [['x','minX','maxX',x],['z','minZ','maxZ',z]]){
  let best=null;
  for(const o of peers(p,d).filter(o=>o.room===d.room&&Math.hypot(o.x-x,o.z-z)<8)){
   const b=floorFootprint(o),candidates=[{delta:o[axis]-value,at:o[axis]}, {delta:b[min]-a[min],at:b[min]},{delta:b[max]-a[max],at:b[max]},{delta:b[max]+gap-a[min],at:b[max]+gap},{delta:b[min]-gap-a[max],at:b[min]-gap}];
   for(const candidate of candidates)if(Math.abs(candidate.delta)<=tolerance&&(!best||Math.abs(candidate.delta)<Math.abs(best.delta)))best={...candidate,peer:o};
  }
  if(best){if(axis==='x')nx=x+best.delta;else nz=z+best.delta;guides.push({axis,at:best.at,peer:best.peer.id,from:axis==='x'?best.peer.z:best.peer.x,to:axis==='x'?z:x});}
 }
 return {x:nx,z:nz,guides};
}
