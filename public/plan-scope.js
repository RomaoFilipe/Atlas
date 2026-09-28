import {escapeHTML as e} from './model.js';
import {planSymbol} from './plan-symbols.js';
export function resolvePlanScope(p,{floorId='',path=[],routeLinks=[],selectedLink=''}={}){
 if(p.floors.some(f=>f.id===floorId))return {kind:'floor',floorId};
 const links=p.links.filter(l=>routeLinks.includes(l.id)||l.id===selectedLink),ids=new Set([...path,...links.flatMap(l=>[l.a,l.b])]);
 const floors=p.floors.filter(f=>p.devices.some(d=>ids.has(d.id)&&d.floor===f.id));
 return floors.length===1?{kind:'floor',floorId:floors[0].id}:floors.length>1?{kind:'circuit',floors,ids,links}:{kind:'overview'};
}
export function makeCircuitPlan(p,scope,{selected='',power=true,ips=true,cables=true,cableMode='selection'}={}){
 const {floors,ids}=scope,links=cables&&cableMode!=='none'?scope.links.filter(l=>power||l.kind!=='power'):[],positions=new Map(),cols=Math.min(3,floors.length),w=(1480-(cols-1)*30)/cols;let y=130,body='';
 const t=(x,y,s,size=16,attrs='')=>`<text x="${x}" y="${y}" font-size="${size}" ${attrs}>${e(s)}</text>`,short=s=>String(s||'').length>37?String(s).slice(0,36)+'…':String(s||'');
 for(let i=0;i<floors.length;i+=cols){const row=floors.slice(i,i+cols),height=Math.max(...row.map(f=>p.devices.filter(d=>ids.has(d.id)&&d.floor===f.id).length))*100+110;
 row.forEach((f,j)=>{const x=60+j*(w+30),site=p.sites.find(s=>s.id===f.site);body+=`<rect x="${x}" y="${y}" width="${w}" height="${height}" rx="10" fill="#eff5f9" stroke="#b7cddc"/>${t(x+18,y+28,short(site.name),19,'font-weight="700"')}${t(x+18,y+55,short(f.name),16)}`;
 p.devices.filter(d=>ids.has(d.id)&&d.floor===f.id).forEach((d,k)=>{const yy=y+80+k*100,cx=x+w/2;positions.set(d.id,{x:cx,y:yy+36,left:x+16,right:x+w-16});body+=`<g data-plan-type="devices" data-plan-id="${e(d.id)}" tabindex="0" role="button" aria-label="${e(d.name)}"><rect x="${x+16}" y="${yy}" width="${w-32}" height="76" rx="6" fill="${selected===d.id?'#d6f1e8':'white'}" stroke="#5a819a"/>${planSymbol(d.type,x+44,yy+38)}${t(x+72,yy+25,short(d.name),16,'font-weight="700"')}${t(x+72,yy+47,d.type,14)}${t(x+72,yy+65,ips?d.ip||'Sem IP':p.rooms.find(r=>r.id===d.room)?.name||'',13)}<title>${e(d.name)}</title></g>`;});});y+=height+50;}
 let wires='';links.forEach((l,i)=>{const a=positions.get(l.a),b=positions.get(l.b);if(!a||!b)return;const same=a.x===b.x,ax=same?a.right:a.x<b.x?a.right:a.left,bx=same?b.right:a.x<b.x?b.left:b.right,lane=same?ax+8+(i%3)*5:(ax+bx)/2,d=`M${ax} ${a.y}H${lane}V${b.y}H${bx}`,color=l.kind==='power'?'#ad7028':l.kind==='fiber'?'#0a8273':'#3563c7';wires+=`<g data-plan-type="links" data-plan-id="${e(l.id)}" tabindex="0" role="button" aria-label="${e(l.label||l.id)}"><path d="${d}" fill="none" stroke="transparent" stroke-width="14" pointer-events="stroke"/><path d="${d}" fill="none" stroke="${color}" stroke-width="3"/><title>${e((l.label||l.id)+' · '+l.portA+' ↔ '+l.portB)}</title></g>`;});
 const height=y+Math.max(1,links.length)*28+70;
 const list=links.map((l,i)=>t(60,y+30+i*28,(l.label||l.id)+' · '+p.devices.find(d=>d.id===l.a)?.name+' / '+l.portA+' → '+p.devices.find(d=>d.id===l.b)?.name+' / '+l.portB,15)).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="${height}" viewBox="0 0 1600 ${height}" data-map-height="${height}" data-circuit="true"><g font-family="Arial,sans-serif" fill="#203746"><rect width="1600" height="${height}" fill="white"/>${t(60,48,'Percurso entre pisos',26,'font-weight="700"')}${t(60,82,'Apenas equipamentos e cabos do percurso selecionado · agrupados por edifício e piso',17)}${body}${wires}${list}</g></svg>`;
}
