// Diagram symbols describe equipment; geometry remains tied to its true map anchor.
export function planSymbol(type,x,y,color='#33566d'){
 const paths={
 'Bastidor':'<rect x="-10" y="-16" width="20" height="32" rx="2"/><path d="M-7-9H7M-7-3H7M-7 3H7M-7 9H7"/><path d="M-5-11v2m0 4v2m0 4v2m0 4v2"/>',
 'Posto de trabalho':'<rect x="-16" y="-10" width="32" height="18" rx="2"/><rect x="-8" y="-7" width="16" height="9" rx="1"/><path d="M0 2v3m-4 0h8M-12 8v5m24-5v5"/><path d="M-7 15q7 6 14 0"/>',
 'Telefone IP':'<rect x="-13" y="-10" width="26" height="22" rx="3"/><rect x="-9" y="-7" width="5" height="15" rx="2"/><path d="M0-5h8M0 1h2m4 0h2M0 6h2m4 0h2"/>',
 'Computador':'<rect x="-14" y="-11" width="28" height="18" rx="2"/><path d="M0 7v6m-8 0H8"/>',
 'Portátil':'<path d="M-11 6V-9h22V6M-16 6h32l-3 5h-26z"/>',
 'Tomada de rede':'<rect x="-12" y="-13" width="24" height="26" rx="3"/><path d="M-7-5H7v9H3v3h-6V4h-4zM-4-5v3m4-3v3m4-3v3"/>',
 'Patch panel':'<rect x="-17" y="-8" width="34" height="16" rx="1"/><path d="M-12-3h5v6h-5zM-3-3h5v6h-5zM6-3h5v6H6zM-12 11h3m6 0h3m6 0h3"/>',
 'Switch':'<rect x="-16" y="-8" width="32" height="16" rx="2"/><path d="M-12-3h5v5h-5zM-4-3h5v5h-5zM4-3h5v5H4zM12-3v5"/>',
 'Firewall':'<path d="M0-15l12 5v11q-3 9-12 14Q-9 10-12 1v-11zM-8-1H8M-6 5H6M0-7v6m-4 0v6m8-6v6"/>',
 'Servidor':'<rect x="-11" y="-14" width="22" height="28" rx="2"/><path d="M-7-7H7M-7 0H7M-7 7H7"/>',
 'Armazenamento':'<ellipse cy="-9" rx="13" ry="5"/><path d="M-13-9v18c0 7 26 7 26 0v-18M-13 0c0 7 26 7 26 0"/>',
 'Wi-Fi':'<path d="M-15-3q15-16 30 0M-10 3q10-11 20 0M-5 9q5-6 10 0"/><circle cy="14" r="1"/>',
 'Impressora':'<path d="M-9-5v-9H9v9M-9 9h-6V-5h30V9H9M-9 3H9v11H-9z"/>',
 'Câmara':'<rect x="-14" y="-8" width="21" height="15" rx="2"/><path d="M7-4l8-4v15L7 3M-4 7v7h-8"/>',
 'PDU':'<rect x="-17" y="-7" width="34" height="14" rx="2"/><circle cx="-10" r="3"/><circle r="3"/><circle cx="10" r="3"/>',
 'UPS':'<rect x="-12" y="-15" width="24" height="30" rx="2"/><path d="M3-10l-9 12h7l-3 9 9-13H0z"/>',
 'VM':'<rect x="-12" y="-12" width="24" height="24" rx="3"/><path d="M-6-5l6 10 6-10"/>',
 'Internet':'<circle r="14"/><ellipse rx="6" ry="14"/><path d="M-13-5h26M-13 5h26"/>'
 };
 return `<g transform="translate(${x} ${y})" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" pointer-events="none">${paths[type]||paths.Computador}</g>`;
}
export function labelLayout(nodes,obstacles=[]){
 const occupied=obstacles.map(b=>({...b})),result=new Map();
 const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
 for(const node of nodes){let best=null,bestScore=Infinity;const {anchor,w,h,site}=node;
 const cx=Math.round(anchor.x/8)*8,cy=Math.round(anchor.y/8)*8;
 for(let ring=0;ring<=9;ring++)for(let dx=-ring;dx<=ring;dx++)for(let dy=-ring;dy<=ring;dy++){
  if(Math.max(Math.abs(dx),Math.abs(dy))!==ring)continue;
  const x=cx+dx*(w+12),y=cy+dy*(h+12),b={x:x-w/2-5,y:y-h/2-5,w:w+10,h:h+10};if(b.x<35||b.y<92||b.x+b.w>1565||b.y+b.h>1012)continue;
  const outside=site?Math.max(0,site.x-b.x)+Math.max(0,b.x+b.w-site.x-site.w)+Math.max(0,site.y+45-b.y)+Math.max(0,b.y+b.h-site.y-site.h):0;
  const score=occupied.reduce((sum,a)=>sum+overlap(a,b)*10000,0)+Math.hypot(x-anchor.x,y-anchor.y)+outside*3;
  if(score<bestScore){bestScore=score;best={x,y,box:b};}
  if(ring===0&&score===0)break;
 }
 if(!best)best={x:anchor.x,y:anchor.y,box:{x:anchor.x-w/2,y:anchor.y-h/2,w,h}};
 occupied.push(best.box);result.set(node.id,{x:best.x,y:best.y});
 }
 return result;
}

// Allocate labels to room-local slots. True anchors are not altered.
export function roomLabelLayout(nodes,rooms,obstacles=[]){
 const result=new Map(),unplaced=[],occupied=[...obstacles];
 for(const [roomId,box] of rooms){const group=nodes.filter(n=>n.room===roomId);if(!group.length)continue;
 const width=Math.max(...group.map(n=>n.w)),height=Math.max(...group.map(n=>n.h)),cols=Math.floor((box.w-20)/(width+12)),rows=Math.floor((box.h-48)/(height+12));
 if(cols*rows<group.length||cols<1||rows<1)continue;
 const slots=[];for(let row=0;row<rows;row++)for(let col=0;col<cols;col++)slots.push({x:box.x+10+(col+.5)*(box.w-20)/cols,y:box.y+38+(row+.5)*(box.h-48)/rows});
 for(const node of group){slots.sort((a,b)=>Math.hypot(a.x-node.anchor.x,a.y-node.anchor.y)-Math.hypot(b.x-node.anchor.x,b.y-node.anchor.y));const slot=slots.shift();result.set(node.id,slot);occupied.push({x:slot.x-node.w/2-5,y:slot.y-node.h/2-5,w:node.w+10,h:node.h+10});}
 }
 for(const n of nodes)if(!result.has(n.id))unplaced.push(n);
 for(const [id,pos] of labelLayout(unplaced,occupied))result.set(id,pos);
 return result;
}
