import * as THREE from 'three';

// A shallow bevel stays inside the original bounding box. Network sockets keep
// their original geometry and coordinates; only the visible housings change.
export function softenEquipment(group){
 group.traverse(mesh=>{
  if(!mesh.isMesh||mesh.userData.type==='ports'||mesh.geometry.type!=='BoxGeometry')return;
  const {width:w,height:h,depth:d}=mesh.geometry.parameters;
  if(Math.min(w,h,d)<.024||Math.max(w,h,d)<.09)return;
  const r=Math.min(.022,Math.min(w,h,d)*.19),x=w/2-r,y=h/2-r;
  const shape=new THREE.Shape();shape.moveTo(-x,-y-r);shape.lineTo(x,-y-r);shape.quadraticCurveTo(x+r,-y-r,x+r,-y);shape.lineTo(x+r,y);shape.quadraticCurveTo(x+r,y+r,x,y+r);shape.lineTo(-x,y+r);shape.quadraticCurveTo(-x-r,y+r,-x-r,y);shape.lineTo(-x-r,-y);shape.quadraticCurveTo(-x-r,-y-r,-x,-y-r);
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r/2,bevelSegments:2,steps:1,curveSegments:3});
  // The outer bevel extends by r/2; shrink the profile to preserve the footprint.
  geometry.computeBoundingBox();const bounds=geometry.boundingBox,size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());geometry.translate(-center.x,-center.y,-center.z);geometry.scale(w/size.x,h/size.y,d/size.z);
  geometry.parameters={width:w,height:h,depth:d};mesh.geometry.dispose();mesh.geometry=geometry;
  for(const child of [...mesh.children])if(child.isLineSegments){mesh.remove(child);child.geometry.dispose();child.material.dispose();}
 });
}
