const kinds=['sites','floors','rooms','racks','devices','links','nets','templates','connectionProposals'];
export function projectDelta(previous,next){
 const changes=[];for(const kind of kinds){const old=previous[kind]||[],current=next[kind]||[],before=new Map(old.map(x=>[String(x.id),x]));for(const item of current){if(JSON.stringify(before.get(String(item.id)))!==JSON.stringify(item))changes.push({kind,operation:'put',item});before.delete(String(item.id));}for(const id of before.keys())changes.push({kind,operation:'delete',id});if(JSON.stringify(old.map(x=>x.id))!==JSON.stringify(current.map(x=>x.id)))changes.push({kind,operation:'order',ids:current.map(x=>x.id)});}
 const metadata=p=>Object.fromEntries(Object.entries(p).filter(([k])=>!kinds.includes(k)));const delta={changes};if(JSON.stringify(metadata(previous))!==JSON.stringify(metadata(next)))delta.metadata=metadata(next);return delta;
}
