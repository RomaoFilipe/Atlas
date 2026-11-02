import * as THREE from 'three';
import {rackCableRoute} from './cable-routing.js';
const colorMaterial=(color,roughness=.55,metalness=.12)=>new THREE.MeshStandardMaterial({color,roughness,metalness,transparent:true});
function block(parent,w,h,d,color,x,y,z,roughness=.55,metalness=.12){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),colorMaterial(color,roughness,metalness));mesh.position.set(x,y,z);parent.add(mesh);return mesh;}

function blocks(parent,items,color,roughness=.55,metalness=.12){
 const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),colorMaterial(color,roughness,metalness),items.length),matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion();
 items.forEach(([w,h,d,x,y,z],i)=>{matrix.compose(new THREE.Vector3(x,y,z),rotation,new THREE.Vector3(w,h,d));mesh.setMatrixAt(i,matrix);});parent.add(mesh);return mesh;
}
export function socketAnchor(mesh,device){
 const direction=new THREE.Vector3(0,0,mesh.userData.face==='rear'?-1:1).applyQuaternion(mesh.getWorldQuaternion(new THREE.Quaternion()));
 const point=mesh.getWorldPosition(new THREE.Vector3()).addScaledVector(direction,(mesh.geometry.parameters.depth||0)/2+.003);
 return {point:point.toArray(),direction:direction.toArray(),width:mesh.geometry.parameters.width,height:mesh.geometry.parameters.height,deviceId:device.id,port:mesh.userData.port,face:mesh.userData.face,passive:['Tomada de rede','Patch panel'].includes(device.type),exact:true};
}
export function decorateSocket(port,{kind='copper',down=false}={}){
 const {width:w,height:h}=port.geometry.parameters,sign=port.userData.face==='rear'?-1:1;
 port.material.color.set(down?0x505d69:0x07121b);port.material.metalness=.25;port.material.roughness=.68;
 const bezel=new THREE.Group();bezel.position.z=sign*.024;port.add(bezel);
 if(sign<0)bezel.rotation.y=Math.PI;
 const metal=kind==='fiber'?0x75a3b3:0x9cabb5;
 blocks(bezel,[...[-w*.49,w*.49].map(x=>[w*.07,h,.006,x,0,0]),...[-h*.47,h*.47].map(y=>[w,h*.08,.006,0,y,0])],metal,.3,.72);
 if(kind==='fiber'){
  for(const x of [-w*.22,w*.22]){block(bezel,w*.32,h*.62,.006,0x142c37,x,0,.003);block(bezel,w*.19,h*.44,.008,0x0a1219,x,0,.008);}
 }else if(kind==='copper'){
  blocks(bezel,Array.from({length:8},(_,i)=>[w*.035,h*.13,.005,(i-3.5)*w*.085,-h*.25,.005]),0xd6b16a,.3,.7);
 }
 // The socket trim shares the port's interaction target.
 bezel.traverse(o=>{if(o.isMesh)o.userData={...port.userData};});
}
function connector(parent,anchor,kind,color,{termination=false}={}){
 const plug=new THREE.Group();plug.position.fromArray(anchor.point);plug.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(...anchor.direction));parent.add(plug);
 const w=anchor.width||.054,h=anchor.height||.032;
 if(kind==='fiber'){
  // A paired LC-style termination; appearance is illustrative, not an optics spec.
  for(const x of [-w*.22,w*.22]){
   block(plug,w*.36,h*.58,.045,0xc6d6d9,x,0,.01,.32,.4);
   block(plug,w*.39,h*.66,.033,0x4aa0be,x,0,.038);
   block(plug,w*.28,h*.1,.035,0xa2d7e3,x,h*.38,.038);
   block(plug,w*.24,h*.44,.026,color,x,0,.067);
  }
  block(plug,w*.78,h*.25,.008,0x244d62,0,h*.38,.048);
 }else if(kind==='power'){
  block(plug,w*.76,h*.76,.065,0x171f28,0,0,.027);block(plug,w*.55,h*.6,.034,0x303e49,0,0,.071);
 }else if(termination){
  block(plug,w*.8,h*.7,.027,0xb5c4c8,0,0,.008);block(plug,w*.48,h*.48,.06,color,0,0,.046);
 }else{
  const housing=block(plug,w*.82,h*.78,.05,0xc2dee2,0,0,.016,.22,.2);housing.material.opacity=.72;housing.material.depthWrite=false;
  blocks(plug,Array.from({length:8},(_,i)=>[w*.046,h*.1,.027,(i-3.5)*w*.085,-h*.27,.009]),0xd7b46a,.26,.75);
  block(plug,w*.48,h*.13,.046,0xe5f0f2,0,h*.49,.034,.3,.22);
  block(plug,w*.86,h*.9,.035,color,0,0,.056);
  blocks(plug,Array.from({length:4},(_,i)=>[w*(.79-i*.06),h*(.83-i*.06),.005,0,0,.076+i*.007]),color);
 }
 // The flexible jacket starts after the strain relief, rather than inside a port.
 const sleeve=new THREE.Mesh(new THREE.CylinderGeometry(.007,.009,.026,8),colorMaterial(color));sleeve.rotation.x=Math.PI/2;sleeve.position.z=.098;plug.add(sleeve);
 plug.traverse(o=>{if(o.isMesh)o.userData={type:'ports',id:anchor.deviceId,port:anchor.port,face:anchor.face,cableEnd:kind};});
 return plug;
}
export function createRackCable({link,start,end,color,active=true,failed=false,lane=0,rack=true,waypoints=[]}){
 const group=new THREE.Group(),route=rackCableRoute(start,end,{lane});
 let curve;
 if(rack)curve=new THREE.CatmullRomCurve3(route.points.map(p=>new THREE.Vector3(...p)),false,'centripetal');
 else{
  const floor=Math.min(start.floorY||0,end.floorY||0)+.2,a=new THREE.Vector3(...route.start),b=new THREE.Vector3(...route.end),da=new THREE.Vector3(...start.direction),db=new THREE.Vector3(...end.direction),leadA=a.clone().addScaledVector(da,.1),leadB=b.clone().addScaledVector(db,.1),groundA=leadA.clone().addScaledVector(da,.12),groundB=leadB.clone().addScaledVector(db,.12),up=new THREE.Vector3(0,.12,0);
  groundA.y=groundB.y=floor;curve=new THREE.CurvePath();curve.add(new THREE.LineCurve3(a,leadA));curve.add(new THREE.CubicBezierCurve3(leadA,leadA.clone().addScaledVector(da,.1),groundA.clone().add(up),groundA));
  const path=[groundA,...waypoints.map(p=>new THREE.Vector3(p.x,p.y??floor,p.z)),groundB];for(let i=1;i<path.length;i++)curve.add(new THREE.LineCurve3(path[i-1],path[i]));
  curve.add(new THREE.CubicBezierCurve3(groundB,groundB.clone().add(up),leadB.clone().addScaledVector(db,.1),leadB));curve.add(new THREE.LineCurve3(leadB,b));
 }

 const radius=link.kind==='power'?.012:link.kind==='fiber'?.006:.009;
 const jacket=colorMaterial(color,.66,.06);jacket.opacity=active?1:.12;jacket.depthWrite=active;
 const body=new THREE.Mesh(new THREE.TubeGeometry(curve,64,radius,6,false),jacket);body.userData={type:'links',id:link.id,cableJacket:link.kind};group.add(body);
 if(failed)body.material.color.set(0xd96d61);
 for(const anchor of [start,end]){
  if(!anchor.exact)continue;
  const plug=connector(group,anchor,link.kind,color,{termination:link.kind==='copper'&&anchor.passive&&anchor.face==='rear'});
  plug.traverse(o=>{if(o.material){o.material.opacity*=active?1:.12;if(!active)o.material.depthWrite=false;if(failed)o.material.color.set(0xd96d61);}});
 }
 return {group,curve};
}
