import {worldPosition} from './model.js';
// Top-down coordinates corresponding to the modelled sockets. Rotation and desk
// scaling are applied around the equipment's saved anchor, never to its name.
export function planConnectionPoint(project,device,port){
 const p=worldPosition(project,device),power=/^(PSU\d+|IN|OUT\d+)$/i.test(port);let x=0,z=.3;
 const anchors={'Computador':[.55,-.208],'Posto de trabalho':[.65,-.283],'Portátil':[.365,.13],'Telefone IP':[.08,-.134],'Impressora':[0,-.31],'Wi-Fi':[0,-.31],'Câmara':[0,-.225]};
 if(anchors[device.type])[x,z]=anchors[device.type];
 if(device.type==='Mini-switch'){const i=Math.max(0,Number(port.replace(/\D/g,''))-1);x=power?.16:-.2+(i%8)*.057;z=power?-.15:.15;}
 if(device.type==='Tomada de rede'){const i=Math.max(0,Number(port.slice(1))-1);x=(i%2-.5)*.1;z=port.toUpperCase().startsWith('R')?-.035:.035;}
 if(device.type==='Posto de trabalho'){x*=((device.deskWidth||1.85)/1.85);z*=((device.deskDepth||.95)/.95);}
 if(power&&device.type==='Impressora')x=.2;
 const rotation=(device.rotation||0)*Math.PI/180,cos=Math.cos(rotation),sin=Math.sin(rotation);
 return {x:p.x+x*cos+z*sin,z:p.z-x*sin+z*cos};
}
