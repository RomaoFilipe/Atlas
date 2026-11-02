import * as THREE from 'three';

// Small procedural maps stay local: no image downloads or textures per device.
export function createEquipmentMaterials(){
 const textures=new Map();
 function texture(kind){
  if(textures.has(kind))return textures.get(kind);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d');
  if(kind==='screen'){
   const gradient=ctx.createLinearGradient(0,0,256,256);gradient.addColorStop(0,'#173e59');gradient.addColorStop(.55,'#277d91');gradient.addColorStop(1,'#102c46');ctx.fillStyle=gradient;ctx.fillRect(0,0,256,256);
   ctx.fillStyle='#a3e6e7';ctx.globalAlpha=.22;ctx.fillRect(18,22,150,7);ctx.fillRect(18,38,92,4);ctx.fillRect(18,194,220,1);
   for(let i=0;i<4;i++){ctx.fillStyle=i%2?'#81cfca':'#d1eef1';ctx.fillRect(18+i*55,211,37,25);}
   ctx.globalAlpha=.08;ctx.fillStyle='#ffffff';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(200,0);ctx.lineTo(45,256);ctx.lineTo(0,256);ctx.fill();
  }else if(kind==='vents'){
   ctx.clearRect(0,0,256,256);ctx.fillStyle='#0a131c';
   for(let row=0;row<13;row++){ctx.fillRect(24,18+row*17,208,8);ctx.fillStyle='#526878';ctx.fillRect(24,26+row*17,208,2);ctx.fillStyle='#0a131c';}
  }else if(kind==='keyboard'){
   ctx.fillStyle='#182633';ctx.fillRect(0,0,256,256);
   for(let row=0;row<5;row++)for(let col=0;col<14;col++){ctx.fillStyle='#587080';ctx.fillRect(7+col*17.5,10+row*46,14,35);ctx.fillStyle='#a2b6c0';ctx.fillRect(10+col*17.5,16+row*46,5,3);}
   ctx.fillStyle='#182633';ctx.fillRect(52,194,154,49);ctx.fillStyle='#587080';ctx.fillRect(55,197,148,34);
  }else{
   // Seeded grain keeps the material stable when selecting or moving equipment.
   const image=ctx.createImageData(256,256);let seed=73;
   for(let y=0;y<256;y++)for(let x=0;x<256;x++){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const grain=(seed>>>24)/255;
    const value=kind==='wood'?Math.round(155+25*Math.sin(x*.12+Math.sin(y*.018)*1.8)+grain*14):kind==='metal'?Math.round(192+grain*20+Math.sin(y*2.4)*9):Math.round(185+grain*35);
    const i=(y*256+x)*4;image.data[i]=image.data[i+1]=image.data[i+2]=value;image.data[i+3]=255;
   }
   ctx.putImageData(image,0,0);
  }
  const map=new THREE.CanvasTexture(canvas);if(kind==='screen'||kind==='keyboard')map.colorSpace=THREE.SRGBColorSpace;
  map.anisotropy=2;map.userData.equipmentMaterial=true;textures.set(kind,map);return map;
 }
 function details({box,g,d}){
  function decal(w,h,x,y,z){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:texture('vents'),transparent:true,roughness:.8,depthWrite:false}));mesh.position.set(x,y,z);mesh.userData.noPick=true;g.add(mesh);}
  if(d.type==='Computador'||d.type==='Posto de trabalho'){
   const desk=d.type==='Posto de trabalho';decal(.16,.24,desk?.65:.55,desk?.28:-.06,desk?.157:.202);
   // Webcam and monitor controls; no changes to the device's network anchors.
   const count=desk?(d.monitors||1):1;
   for(let i=0;i<count;i++){const x=desk?(count===1?0:(i-.5)*.8):0;box(.018,.012,.008,0x080f18,x,desk?1.335:.425,desk?-.148:.04,g);}
  }else if(d.type==='Portátil'){
   box(.018,.009,.006,0x080f18,0,.257,-.054,g);
   for(const x of [-.315,.315]){box(.04,.018,.03,0x93a7b3,x,-.128,-.055,g);}
  }else if(d.type==='Câmara'){
   const glass=new THREE.Mesh(new THREE.CylinderGeometry(.051,.051,.008,24),new THREE.MeshStandardMaterial({color:0x244c6b,metalness:.65,roughness:.12}));glass.rotation.x=Math.PI/2;glass.position.z=.269;g.add(glass);
   const pupil=new THREE.Mesh(new THREE.CylinderGeometry(.023,.023,.01,20),new THREE.MeshStandardMaterial({color:0x06121e,metalness:.3,roughness:.08}));pupil.rotation.x=Math.PI/2;pupil.position.z=.275;g.add(pupil);
  }else if(d.type==='Wi-Fi'){
   const seam=new THREE.Mesh(new THREE.TorusGeometry(.274,.003,4,40),new THREE.MeshStandardMaterial({color:0x8fa6b2,roughness:.7}));seam.rotation.x=Math.PI/2;seam.position.y=.044;g.add(seam);
  }else if(d.type==='Impressora'){
   for(let i=0;i<3;i++)box(.023,.009,.025,0xa8bfc9,-.04+i*.045,.262,.08,g);
   decal(.17,.16,-.24,-.03,.302);
  }
 }
 function apply(group,type){
  group.traverse(mesh=>{
   if(!mesh.isMesh||!mesh.material?.isMeshStandardMaterial||mesh.material.map)return;
   const material=mesh.material,color=material.color.getHex(),size=mesh.geometry.parameters;
   if([0x368aa1,0x38859b,0x3b8da4].includes(color)){
    material.color.set(0xffffff);material.map=texture('screen');material.roughness=.24;material.metalness=.12;return;
   }
   if([0x283e4f,0x283b4e].includes(color)&&size.width>.4&&size.height<.04){material.color.set(0xffffff);material.map=texture('keyboard');material.roughness=.78;return;}
   if(color===0x997850){material.map=texture('wood');material.bumpMap=texture('wood');material.bumpScale=.004;material.roughness=.72;material.metalness=0;return;}
   // Leave interactive ports, LEDs, paper and virtual symbols visually legible.
   if(mesh.userData.type==='ports'||type==='VM'||type==='Internet'||Math.max(size.width||0,size.height||0,size.depth||0)<.18||[0xf0f4f5,0x73c5bc,0x276d82].includes(color))return;
   const metal=['Switch','Firewall','Servidor','Armazenamento','Patch panel','UPS','PDU','Mini-switch','Portátil'].includes(type);
   material.bumpMap=texture(metal?'metal':'plastic');material.bumpScale=metal?.0015:.003;material.roughness=metal?.4:.68;material.metalness=metal?.62:.08;
  });
 }
 // Scene rebuilds own the pool; shared textures are disposed once per rebuild.
 function dispose(){for(const map of textures.values())map.dispose();textures.clear();}
 return {apply,details,dispose};
}
