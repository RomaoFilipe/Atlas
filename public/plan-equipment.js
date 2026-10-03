// Top-down equipment drawings. Coordinates are metres, matching the 3D scene.
import {escapeHTML as e} from './model.js';
import {floorFootprint} from './move-alignment.js';
const rect=(x,z,w,h,fill,rx=.025)=>`<rect x="${x}" y="${z}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;
const monitor=x=>rect(x-.36,-.22,.72,.075,'#25485e')+rect(x-.12,-.18,.24,.17,'#7297a5');
const keyboard=(x=-.395,z=.12)=>rect(x,z,.55,.2,'#405e70')+`<path d="M${x+.04} ${z+.07}h.47m-.47 .06h.47" stroke="#aec5d0"/>`;
export function equipmentDrawing(d){
 const type=d.type;
 if(type==='Posto de trabalho')return rect(-.925,-.475,1.85,.95,'#e7cba0',.07)+`<path d="M-.82 -.36H.82" stroke="#c5a578"/>`+((d.monitors||1)>1?monitor(-.4)+monitor(.4):monitor(0))+keyboard()+rect(.305,.13,.09,.14,'#8ba6b4',.04)+rect(-.375,.5,.75,.7,'#6e8e9e',.12)+rect(-.375,1.115,.75,.09,'#35556c',.035);
 if(type==='Computador')return monitor(0)+keyboard(-.3,.19)+rect(.44,-.2,.22,.4,'#3c576b');
 if(type==='Portátil')return rect(-.36,-.1,.72,.48,'#aabfc9',.04)+rect(-.34,-.103,.68,.055,'#294d65')+keyboard(-.275,.02)+rect(-.1,.27,.2,.08,'#d6e3e8');
 if(type==='Impressora')return rect(-.35,-.3,.7,.6,'#b4cbd5',.05)+rect(-.29,-.25,.58,.36,'#e3edf1')+rect(-.23,.24,.46,.07,'#35556c')+rect(-.215,.31,.43,.2,'white')+rect(.065,.08,.19,.1,'#468a99');
 if(type==='Wi-Fi')return '<circle r=".3" fill="#e6f3f5"/><path d="M-.17 -.04q.17-.16 .34 0m-.27 .07q.1-.09 .2 0" fill="none"/><circle cy=".1" r=".025" fill="#078773"/>';
 if(type==='Tomada de rede'){const n=Math.min(4,d.portCount||2);return rect(-.18,-.15,.36,.3,'#fff2d8')+Array.from({length:n},(_,i)=>rect(-.13+(i%2)*.15,-.1+Math.floor(i/2)*.13,.1,.085,'#657c88',.005)+`<text class="plan-port-detail" x="${-.08+(i%2)*.15}" y="${-.03+Math.floor(i/2)*.13}" font-size=".06" text-anchor="middle" fill="white" stroke="none">${i+1}</text>`).join('');}
 if(type==='Telefone IP')return rect(-.16,-.125,.32,.25,'#9cb5c2')+rect(-.15,-.12,.07,.24,'#35556c')+rect(0,-.085,.12,.07,'#70b7b1')+rect(0,.02,.11,.07,'#d9e7eb');
 if(type==='Câmara')return rect(-.125,-.215,.25,.43,'#c3d9e2')+rect(-.08,.2,.16,.06,'#294d65');
 if(type==='Bastidor')return rect(-.5,-.5,1,1,'#c9d9e2',.04)+rect(-.42,-.43,.84,.86,'#49677b')+Array.from({length:6},(_,i)=>`<path d="M-.32 ${-.32+i*.12}h.64" stroke="#a8c3cf"/>`).join('');
 if(['Mini-switch','Switch','Patch panel','Firewall','Servidor','Armazenamento','UPS','PDU'].includes(type)){const w=type==='Mini-switch'?.5:.6,h=type==='Mini-switch'?.28:.5;return rect(-w/2,-h/2,w,h,'#57778a')+Array.from({length:4},(_,i)=>rect(-w*.4+i*w*.2,h*.24,w*.12,.065,i===0?'#70d5b2':'#d0e0e7',.004)).join('');}
 if(type==='Internet')return '<circle r=".4" fill="#d8e9f5"/><ellipse rx=".18" ry=".4" fill="none"/><path d="M-.4 0h.8M-.34 -.2h.68M-.34 .2h.68" fill="none"/>';
 return rect(-.3,-.25,.6,.5,type==='VM'?'#d8caf0':'#c5dbe4',.05)+`<path d="M-.2 -.1h.4m-.4 .12h.4"/>`;
}
export function equipmentBounds(d,x,y,scale){const b=floorFootprint({...d,x:0,z:0});return{x:x+b.minX*scale,y:y+b.minZ*scale,w:(b.maxX-b.minX)*scale,h:(b.maxZ-b.minZ)*scale};}
export function planEquipment(d,x,y,scale,{selected=false,warning=false,type='devices',active=true}={}){
 return `<g data-plan-type="${type}" data-plan-id="${e(d.id)}" tabindex="0" role="button" aria-label="${e(d.name+' · '+d.type)}" opacity="${active?1:.2}" class="plan-equipment"><title>${e(d.name+' · '+d.type+' · '+(d.ip||'Sem IP')+' · '+(d.rotation||0)+'°')}</title><g transform="translate(${x} ${y}) rotate(${-(d.rotation||0)}) scale(${scale})" stroke="${warning?'#c64e32':selected?'#008773':'#44657a'}" stroke-width=".022" stroke-linejoin="round">${selected||warning?'<circle r="1.15" fill="none" stroke-dasharray=".1 .07" stroke-width=".035"/>':''}<circle r=".32" fill="none" stroke="none" pointer-events="all"/>${d.type==='Posto de trabalho'?'<g transform="scale('+((d.deskWidth||1.85)/1.85)+' '+((d.deskDepth||.95)/.95)+')">'+equipmentDrawing(d)+'</g>':equipmentDrawing(d)}</g></g>`;
}
// Names may move or be omitted when crowded; equipment never moves to fit a label.
export function equipmentLabels(items,occupied,bounds){
 const result=[];const hits=(a,b)=>a.x<b.x+b.w+4&&a.x+a.w+4>b.x&&a.y<b.y+b.h+4&&a.y+a.h+4>b.y;
 const used=[...occupied,...items.map(i=>i.box)];
 for(const i of [...items].sort((a,b)=>Number(b.selected)-Number(a.selected))){
  const name=i.name.length>24?i.name.slice(0,23)+'…':i.name,w=Math.max(30,name.length*6.7+12),h=21,b=i.box;
  const candidates=[{x:i.x-w/2,y:b.y+b.h+6,w,h},{x:i.x-w/2,y:b.y-h-6,w,h},{x:b.x+b.w+6,y:i.y-h/2,w,h},{x:b.x-w-6,y:i.y-h/2,w,h}];
  const area=i.bounds||bounds;
  const box=candidates.find(a=>a.x>=area.x&&a.y>=area.y&&a.x+w<=area.x+area.w&&a.y+h<=area.y+area.h&&!used.some(b=>hits(a,b)));
  if(!box)continue;used.push(box);result.push(`<g class="plan-object-name" pointer-events="none"><rect x="${box.x}" y="${box.y}" width="${w}" height="${h}" rx="4" fill="${i.selected?'#def4ec':'#ffffff'}" fill-opacity=".92"/><text x="${box.x+w/2}" y="${box.y+14}" text-anchor="middle" font-size="12" fill="#315368">${e(name)}</text></g>`);
 }
 return result.join('');
}
