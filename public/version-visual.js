import {escapeHTML as e} from './model.js';
export function visualChanges(before,after){
 const result={devices:[],links:[]};
 for(const group of Object.keys(result)){
  const a=new Map((before[group]||[]).map(x=>[x.id,x])),b=new Map((after[group]||[]).map(x=>[x.id,x]));
  for(const id of new Set([...a.keys(),...b.keys()])){const old=a.get(id),next=b.get(id);if(JSON.stringify(old)===JSON.stringify(next))continue;result[group].push({id,before:old,after:next,status:!old?'added':!next?'removed':'changed'});}
 }
 return result;
}
export function versionVisualHTML(before,after){
 const changes=visualChanges(before,after),colors={added:'#087f5b',removed:'#c92a2a',changed:'#9c6500'},labels={added:'Adicionado',removed:'Removido',changed:'Alterado'};
 const ids=new Set(changes.devices.map(x=>x.id));for(const l of changes.links)for(const item of [l.before,l.after])if(item){ids.add(item.a);ids.add(item.b);}
 if(!ids.size)return '<p>Sem alterações nos equipamentos ou cabos.</p>';
 const devices=new Map([...(before.devices||[]),...(after.devices||[])].map(d=>[d.id,d])),positions=new Map([...ids].map((id,i)=>[id,{x:130+(i%3)*290,y:55+Math.floor(i/3)*100}])),height=Math.max(150,Math.ceil(ids.size/3)*100);
 const links=changes.links.flatMap(l=>[l.before&&{item:l.before,status:'removed'},l.after&&{item:l.after,status:l.status==='added'?'added':'changed'}].filter(Boolean)).map(({item,status})=>{const a=positions.get(item.a),b=positions.get(item.b);return a&&b?`<g><title>${e(labels[status]+' · '+(item.label||item.id))}</title><line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${colors[status]}" stroke-width="3" ${status==='removed'?'stroke-dasharray="8 5"':''}/><text x="${(a.x+b.x)/2}" y="${(a.y+b.y)/2-8}" fill="${colors[status]}" font-size="11">${e(item.label||item.id)}</text></g>`:'';}).join('');
 const nodes=[...positions].map(([id,pos])=>{const change=changes.devices.find(d=>d.id===id),d=devices.get(id),color=colors[change?.status]||'#536878';return `<g><title>${e((change?labels[change.status]:'Extremo do cabo')+' · '+(d?.name||id))}</title><rect x="${pos.x-115}" y="${pos.y-25}" width="230" height="50" rx="8" fill="white" stroke="${color}" stroke-width="3" ${change?.status==='removed'?'stroke-dasharray="8 5"':''}/><text x="${pos.x}" y="${pos.y-3}" text-anchor="middle" fill="${color}" font-size="12">${e((d?.name||id).slice(0,30))}</text><text x="${pos.x}" y="${pos.y+15}" text-anchor="middle" fill="${color}" font-size="10">${e(change?labels[change.status]:'Extremo do cabo')}</text></g>`;}).join('');
 return `<section class="version-visual"><h4>Diagrama de alterações</h4><p>Verde: adicionado · Vermelho tracejado: removido · Âmbar: alterado. Disposição esquemática, independente da planta.</p><div class="version-visual-scroll"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 870 ${height}" role="img" aria-label="Equipamentos e cabos alterados">${links}${nodes}</svg></div></section>`;
}
