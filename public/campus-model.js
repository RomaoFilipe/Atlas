export function buildingLevels(p,siteId){
 const floors=p.floors.filter(f=>f.site===siteId).sort((a,b)=>a.elevation-b.elevation);
 return floors.map((floor,i)=>({floor,base:floor.elevation,height:Math.max(2.4,(floors[i+1]?.elevation??floor.elevation+3)-floor.elevation)}));
}
export function campusVisibility(p,{siteId='',floorId='',roomId='',interior=false}={}){
 const site=siteId||p.floors.find(f=>f.id===floorId)?.site||'';
 const inScope=x=>(!site||x.site===site)&&(!floorId||x.floor===floorId)&&(!roomId||x.room===roomId);
 return {sites:p.sites.filter(s=>!site||s.id===site),devices:interior?p.devices.filter(inScope):[],racks:interior?p.racks.filter(inScope):[]};
}
export function campusLinkVisible(link,{selected='',routeLinks=[],selectedLink=''}={}){
 return routeLinks.length?routeLinks.includes(link.id):selectedLink?link.id===selectedLink:link.a===selected||link.b===selected;
}
