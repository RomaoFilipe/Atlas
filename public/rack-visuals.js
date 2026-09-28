import * as THREE from 'three';
function canvasTexture(w,h,draw){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;draw(canvas.getContext('2d'),w,h);const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;}
function plate(parent,texture,w,h,x,y,z,reverse=false){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:texture,transparent:true,side:THREE.DoubleSide,roughness:.75,metalness:.15}));mesh.position.set(x,y,z);if(reverse)mesh.rotation.y=Math.PI;mesh.userData.noPick=true;parent.add(mesh);return mesh;}
export function rackDetails({box,shell,x,z,h,units,interior,face,doorOpen}){
 // Side panels and recessed mounting rails make the usable depth explicit.
 for(const sign of [-1,1]){box(.045,h-.3,1.18,0x152330,x+sign*.69,h/2,z,shell,true);for(const zz of [-.52,.52])box(.055,h-.28,.06,0x91a2ac,x+sign*.56,h/2,z+zz,shell);for(const yy of [.18,h-.16])box(.11,.09,1.13,0x1b2c3b,x+sign*.6,yy,z,shell);}
 for(const xx of [-.55,.55])for(const zz of [-.46,.46])box(.15,.1,.15,0x0b121b,x+xx,.025,z+zz,shell);
 const front=face==='rear'?-1:1;
 if(interior){
 const ruler=canvasTexture(160,units*64,(ctx,w,h)=>{ctx.fillStyle='#172c3c';ctx.fillRect(0,0,w,h);ctx.font='600 36px Arial';ctx.textAlign='right';for(let u=1;u<=units;u++){const yy=h-(u-.5)*64;ctx.fillStyle=u%5===0?'#89f0d0':'#edf4fa';ctx.fillText(String(u).padStart(2,'0'),100,yy+12);ctx.fillRect(115,yy-2,36,4);ctx.fillStyle='#3c566a';ctx.fillRect(0,h-u*64,w,2);}});
 plate(shell,ruler,.24,units*.12,x+(front===1?-.85:.85),.3+units*.06,z+front*.65,front===-1);
 }
 // Open perforated door in inspection mode; closed doors in the campus view.
 const hinge=new THREE.Group();shell.add(hinge);hinge.position.set(x-.69,0,z+front*.68);hinge.rotation.y=interior&&doorOpen?-front*Math.PI*.62:0;
 for(const xx of [0,1.38])box(.055,h-.12,.055,0x526878,xx,h/2,0,hinge,true);for(const yy of [.08,h-.04])box(1.38,.055,.055,0x526878,.69,yy,0,hinge,true);
 const meshTexture=canvasTexture(128,128,ctx=>{ctx.fillStyle='#253847';ctx.fillRect(0,0,128,128);ctx.globalCompositeOperation='destination-out';for(let row=0;row<12;row++)for(let col=0;col<12;col++){ctx.beginPath();ctx.arc(col*12+(row%2?6:0),row*11,3.8,0,Math.PI*2);ctx.fill();}});meshTexture.wrapS=meshTexture.wrapT=THREE.RepeatWrapping;meshTexture.repeat.set(2,Math.max(1,units/10));const grille=plate(hinge,meshTexture,1.29,h-.24,.69,h/2,0);grille.material.alphaTest=.4;
 box(.045,.35,.065,0xb4c2cb,1.27,h*.48,front*.06,hinge,true);for(const yy of [h*.2,h*.8])box(.08,.15,.09,0x7e95a6,0,yy,0,hinge);
 if(interior)hinge.traverse(o=>{o.userData.noPick=true;});
}
const colors={'Switch':0x4a728c,'Firewall':0x934c42,'Servidor':0x697d90,'Armazenamento':0x4d6e80,'Patch panel':0x273b4b,'UPS':0x263b48,'PDU':0x9a6a32};
export function rackEquipment({box,g,d,h,detail}){
 const type=d.type,color=colors[type],height=Math.max(.07,h-.014);
 box(1.08,height,.93,0x273744,0,0,0,g,true);box(1.05,height*.92,.04,color,0,0,.495,g);
 for(const x of [-.55,.55]){box(.038,height*.86,.06,0xa0acb5,x,0,.51,g);for(const y of [-height*.3,height*.3])box(.014,.014,.012,0x1a2631,x,y,.546,g);}
 if(type==='Servidor'||type==='Armazenamento'){
 const cols=type==='Armazenamento'?6:4,rows=height>.18?2:1;
 for(let i=0;i<cols*rows;i++){const xx=-.46+(i%cols)*(.88/cols)+.44/cols,yy=((rows-1)/2-Math.floor(i/cols))*height*.43;box(.79/cols,height*.36,.024,0x1b2936,xx,yy,.527,g);box(.67/cols,height*.27,.013,0x587080,xx,yy,.545,g);box(.018,height*.22,.02,0xadc2cc,xx+.29/cols,yy,.558,g);box(.009,.008,.008,0x73d3ad,xx-.26/cols,yy,.56,g);}
 }else if(type==='UPS'){box(.38,height*.48,.03,0x0a1c27,-.18,0,.532,g);box(.31,height*.3,.008,0x63acb7,-.18,0,.552,g);box(.06,.06,.025,0xced9dd,.27,0,.54,g);for(let i=0;i<6;i++)box(.018,height*.65,.009,0x0b1c28,.36+i*.02,0,.523,g);
 }else if(type==='PDU'){box(.92,height*.52,.02,0x19242e,0,0,.526,g);box(.07,height*.43,.015,0xf7bd5a,.4,0,.543,g);
 }else if(type==='Firewall'){box(.018,height*.72,.015,0xe7b0a5,-.49,0,.529,g);box(.055,.018,.018,0x74d7b0,.48,height*.25,.53,g);}
 // Rear fan grilles and power supply housings, clear of the interactive ports.
 if(detail&&['Servidor','Armazenamento','Switch','Firewall','UPS'].includes(type)){
 for(const x of [-.34,-.1]){box(.17,height*.72,.018,0x101d29,x,0,-.484,g);for(let i=0;i<5;i++)box(.012,height*.6,.008,0x61788a,x-.055+i*.027,0,-.498,g);}
 }
 if(detail&&['Switch','Patch panel','Firewall'].includes(type)){
 const count=Math.min(d.portCount||24,96),cols=Math.min(12,count),rows=Math.ceil(count/cols);
 for(let i=0;i<count;i++){const x=-.43+(i%cols)*(.86/Math.max(cols-1,1)),y=((rows-1)/2-Math.floor(i/cols))*Math.min(.045,h*.7/Math.max(rows,1));box(Math.min(.084,.74/cols),Math.min(.053,h*.65/rows),.015,0x0b1722,x,y,.532,g);}
 }
 // Model markings are illustrative; network ports retain their real configured names.
 if(detail){const tex=canvasTexture(768,96,ctx=>{ctx.fillStyle='#d7e5ed';ctx.font='600 34px Arial';ctx.fillText(type.toUpperCase(),20,44);ctx.font='24px Arial';ctx.fillStyle='#8bb7c9';ctx.fillText(d.model||'MODELO GENÉRICO',20,80);});const marking=plate(g,tex,.7,.22,0,height/2+.003,0);marking.rotation.x=-Math.PI/2;}
}
