import {worldPosition} from './model.js';
import {floorFootprint} from './move-alignment.js';
export function roomCameraFrame(p,id,aspect=1,fov=43){
 const room=p.rooms.find(r=>r.id===id),floor=p.floors.find(f=>f.id===room?.floor),site=p.sites.find(s=>s.id===floor?.site);if(!room||!site)return null;
 const base=floor.elevation||0,min=[site.x+room.x-room.w/2,base,site.z+room.z-room.d/2],max=[site.x+room.x+room.w/2,base+2,site.z+room.z+room.d/2];
 for(const d of p.devices.filter(d=>d.room===id&&!d.rack&&d.type!=='VM')){const pos=worldPosition(p,d),b=floorFootprint(d);min[0]=Math.min(min[0],b.minX);min[2]=Math.min(min[2],b.minZ);max[0]=Math.max(max[0],b.maxX);max[2]=Math.max(max[2],b.maxZ);max[1]=Math.max(max[1],(pos.y||base)+2);}
 for(const r of p.racks.filter(r=>r.room===id)){min[0]=Math.min(min[0],site.x+r.x-.7);max[0]=Math.max(max[0],site.x+r.x+.7);min[2]=Math.min(min[2],site.z+r.z-.65);max[2]=Math.max(max[2],site.z+r.z+.65);max[1]=Math.max(max[1],base+r.units*.12+.5);}
 const target=min.map((v,i)=>(v+max[i])/2),normalize=a=>{const n=Math.hypot(...a);return a.map(v=>v/n);},n=normalize([.65,1,.85]),right=normalize([n[2],0,-n[0]]);
 const u=normalize([-n[0]*n[1],n[0]*n[0]+n[2]*n[2],-n[2]*n[1]]),tanV=Math.tan(fov*Math.PI/360),tanH=tanV*Math.max(.1,aspect),dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0);let distance=4;
 for(const x of [min[0],max[0]])for(const y of [min[1],max[1]])for(const z of [min[2],max[2]]){const v=[x-target[0],y-target[1],z-target[2]],depth=dot(v,n);distance=Math.max(distance,Math.abs(dot(v,right))/tanH+depth,Math.abs(dot(v,u))/tanV+depth);}
 distance*=1.18;return {target,position:target.map((v,i)=>v+n[i]*distance),bounds:{min,max}};
}
