async function readBounded(request,limit){const reader=request.body?.getReader();if(!reader)return new Uint8Array();const chunks=[];let total=0;while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>limit){await reader.cancel();throw new Error('Ficheiro demasiado grande.');}chunks.push(value);}const out=new Uint8Array(total);let pos=0;for(const c of chunks){out.set(c,pos);pos+=c.length;}return out;}
async function featureAPI(request,env,url,owner){
 const path=url.pathname;if(!path.startsWith('/api/versions')&&!path.startsWith('/api/assets')&&!path.startsWith('/api/equipment-files'))return null;
 if(!owner)return json({error:'Inicie sessão para continuar.'},401);
 if(!['GET','HEAD'].includes(request.method)){const origin=request.headers.get('origin');if(origin&&origin!==url.origin)return json({error:'Origem não autorizada.'},403);}
 try{
 if(path==='/api/versions'&&request.method==='GET'){const result=await env.DB.prepare('SELECT id,label,created_at FROM atlas_versions WHERE owner = ? ORDER BY created_at DESC LIMIT 200').bind(owner).all();return json({versions:result.results});}
 if(path==='/api/versions'&&request.method==='POST'){const raw=await readBounded(request,1500000);const input=JSON.parse(new TextDecoder().decode(raw));validate(input.project);if(typeof input.label!=='string'||!input.label.trim()||input.label.length>100)return json({error:'Indique um nome para a versão (até 100 caracteres).'},400);const count=await env.DB.prepare('SELECT count(*) AS n FROM atlas_versions WHERE owner = ?').bind(owner).first();if(count.n>=200)return json({error:'Limite de 200 versões atingido. Exporte e elimine uma versão antiga.'},400);const id=crypto.randomUUID(),now=new Date().toISOString();await env.DB.prepare('INSERT INTO atlas_versions (id,owner,label,document,created_at) VALUES (?,?,?,?,?)').bind(id,owner,input.label.trim(),JSON.stringify(input.project),now).run();return json({id,label:input.label.trim(),created_at:now},201);}
 const version=path.match(/^\/api\/versions\/([a-zA-Z0-9_-]+)$/);if(version){if(request.method==='GET'){const row=await env.DB.prepare('SELECT id,label,document,created_at FROM atlas_versions WHERE id = ? AND owner = ?').bind(version[1],owner).first();return row?json({...row,project:JSON.parse(row.document),document:undefined}):json({error:'Versão não encontrada.'},404);}if(request.method==='DELETE'){await env.DB.prepare('DELETE FROM atlas_versions WHERE id = ? AND owner = ?').bind(version[1],owner).run();return json({ok:true});}}
 if(path.startsWith('/api/equipment-files')){
 if(!env.ATLAS_ASSETS)return json({error:'Armazenamento de anexos indisponível.'},503);
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(owner)))).map(x=>x.toString(16).padStart(2,'0')).join('');
 if(path==='/api/equipment-files'&&request.method==='POST'){
 if(request.headers.get('Origin')!==url.origin)return json({error:'Origem não autorizada.'},403);
 const bytes=await readBounded(request,5000000),start=new TextDecoder().decode(bytes.slice(0,12));let type;
 if(bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71&&bytes[4]===13&&bytes[5]===10&&bytes[6]===26&&bytes[7]===10)type='image/png';
 else if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)type='image/jpeg';
 else if(start.slice(0,4)==='RIFF'&&start.slice(8,12)==='WEBP')type='image/webp';
 else if(start.startsWith('%PDF-'))type='application/pdf';
 else return json({error:'Escolha uma fotografia PNG, JPEG, WebP ou um documento PDF.'},400);
 const name=decodeURIComponent(request.headers.get('X-File-Name')||'anexo').replace(/[\x00-\x1f\x7f]/g,'').slice(0,200)||'anexo',id=crypto.randomUUID();
 await env.ATLAS_ASSETS.put(hash+'/equipment/'+id,bytes,{httpMetadata:{contentType:type},customMetadata:{name}});
 return json({id,name,type,size:bytes.length},201);
 }
 const match=path.match(/^\/api\/equipment-files\/([a-zA-Z0-9_-]{1,80})$/);
 if(match&&['GET','HEAD'].includes(request.method)){const object=await env.ATLAS_ASSETS.get(hash+'/equipment/'+match[1]);if(!object)return json({error:'Anexo não encontrado nesta conta.'},404);
 const type=object.httpMetadata?.contentType||'application/octet-stream',download=type==='application/pdf'||url.searchParams.has('download'),name=object.customMetadata?.name||'anexo';
 return new Response(request.method==='HEAD'?null:object.body,{headers:{'Content-Type':type,'Content-Disposition':(download?'attachment':'inline')+"; filename*=UTF-8''"+encodeURIComponent(name),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}});
 }
 }
 if(path.startsWith('/api/assets')){if(!env.ATLAS_ASSETS)return json({error:'Armazenamento de plantas indisponível.'},503);const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(owner)))).map(x=>x.toString(16).padStart(2,'0')).join('');
 if(path==='/api/assets'&&request.method==='POST'){const bytes=await readBounded(request,5000000);let type;if(bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71)type='image/png';else if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)type='image/jpeg';else if(new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP')type='image/webp';else return json({error:'Use uma imagem PNG, JPEG ou WebP.'},400);const id=crypto.randomUUID();await env.ATLAS_ASSETS.put(hash+'/'+id,bytes,{httpMetadata:{contentType:type}});return json({id,url:'/api/assets/'+id},201);}
 const asset=path.match(/^\/api\/assets\/([a-zA-Z0-9_-]+)$/);if(asset&&['GET','HEAD'].includes(request.method)){const object=await env.ATLAS_ASSETS.get(hash+'/'+asset[1]);if(!object)return json({error:'Imagem não encontrada.'},404);return new Response(request.method==='HEAD'?null:object.body,{headers:{'Content-Type':object.httpMetadata?.contentType||'image/png','Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff'}});}}
 return json({error:'Operação não suportada.'},405);
 }catch(err){console.error('Feature API failure',err.message);return json({error:err.message||'Não foi possível concluir a operação.'},400);}
}
