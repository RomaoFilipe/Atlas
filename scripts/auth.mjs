import {randomBytes} from 'node:crypto';
import {accountStore,passwordMatches,passwordRecord,validateAccount} from './accounts.mjs';
const page=(title,body)=>`<!doctype html><html lang="pt"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title} · Atlas</title><link rel="stylesheet" href="/layout.css"><body><main style="max-width:640px;margin:5vh auto;padding:24px"><h1>${title}</h1>${body}</main></body></html>`;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function body(req){let text='';for await(const part of req){text+=part;if(text.length>10000)throw Error('Pedido demasiado grande.');}return new URLSearchParams(text);}
export function createAuth(directory,{now=Date.now}={}){
 const store=accountStore(directory),sessions=new Map(),attempts=new Map();
 return async function authenticate(req,res,url){
  const send=(status,content,headers={})=>{res.writeHead(status,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'",...headers});res.end(content);};
  if(!store.exists()){
   if(url.pathname==='/account'){
    if(req.method==='GET'){send(200,page('Ativar contas','<p>A primeira conta será administradora da organização default, com acesso ao projeto local existente.</p><form method="post"><label>Utilizador<input name="username" autocomplete="username" required maxlength="100"></label><label>Palavra-passe (mínimo 12 caracteres)<input name="password" type="password" autocomplete="new-password" minlength="12" required></label><button>Ativar contas</button></form><a href="/">Voltar ao projeto</a>'));return null;}
    if(req.method==='POST'){try{const input=await body(req);if(store.exists()){send(409,'As contas já foram ativadas.');return null;}const account=validateAccount({username:input.get('username'),role:'admin',organization:'default'});account.password=passwordRecord(input.get('password'));store.write([account]);send(303,'',{Location:'/login'});}catch(error){send(400,page('Ativar contas',`<p>${escape(error.message)}</p><a href="/account">Voltar</a>`));}return null;}
    send(405,'');return null;
   }
   return {actor:'atlas-local',owner:'atlas-local',role:'admin',organization:null};
  }
  for(const [id,s] of sessions)if(s.expires<=now())sessions.delete(id);
  for(const [id,a] of attempts)if(a.until<=now())attempts.delete(id);
  const cookie=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('atlas_session='))?.slice(14),session=sessions.get(cookie),accounts=store.read();
  const user=session&&accounts.find(a=>a.username===session.username&&a.password.hash===session.hash),access=user?{actor:user.username,owner:user.organization==='default'?'atlas-local':'organization:'+user.organization,role:user.role,organization:user.organization,units:user.units??null}:null;
  if(url.pathname==='/login'){
   if(req.method==='POST'){
    const peer=req.socket.remoteAddress,limit=attempts.get(peer)||{count:0,until:now()+900000};if(limit.count>=10){send(429,page('Tenta mais tarde','<p>Demasiadas tentativas. Aguarda 15 minutos.</p>'));return null;}limit.count++;attempts.set(peer,limit);
    const input=await body(req),account=accounts.find(a=>a.username===input.get('username'));
    // Perform the same expensive derivation for unknown usernames.
    const dummy={salt:'00000000000000000000000000000000',hash:'00'.repeat(32)};
    if(!passwordMatches(input.get('password'),account?.password||dummy)||!account){send(401,page('Iniciar sessão','<p>Credenciais inválidas.</p><a href="/login">Tentar novamente</a>'));return null;}
    attempts.delete(peer);const token=randomBytes(32).toString('hex');sessions.set(token,{username:account.username,hash:account.password.hash,expires:now()+8*3600000});send(303,'',{Location:(url.searchParams.get('next')?.startsWith('/')&&!url.searchParams.get('next').startsWith('//')&&!/[\\\r\n]/.test(url.searchParams.get('next'))?url.searchParams.get('next'):'/home.html'), 'Set-Cookie':`atlas_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${req.socket.encrypted?'; Secure':''}`});return null;
   }
   if(req.method!=='GET'){send(405,'');return null;}
   send(200,page('Iniciar sessão','<form method="post"><label>Utilizador<input name="username" autocomplete="username" required></label><label>Palavra-passe<input name="password" type="password" autocomplete="current-password" required></label><button>Entrar</button></form>'));return null;
  }
  if(!access){if(['/layout.css'].includes(url.pathname))return {actor:null,owner:null,role:null};if(url.pathname.startsWith('/api/')){res.writeHead(401,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error:'Inicie sessão para continuar.',login:'/login'}));}else send(303,'',{Location:'/login'+(url.searchParams.has('equipment')||['/field.html','/portal.html'].includes(url.pathname)?'?next='+encodeURIComponent(url.pathname+url.search):'')});return null;}
  if(url.pathname==='/api/access/accounts'){res.writeHead(access.role==='admin'?200:403,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(access.role==='admin'?{accounts:accounts.filter(a=>a.organization===access.organization).map(({username,role,units})=>({username,role,units:units??null}))}:{error:'Apenas administradores.'}));return null;}
  if(url.pathname==='/logout'){if(req.method!=='POST'){send(405,'');return null;}sessions.delete(cookie);send(303,'',{Location:'/login','Set-Cookie':'atlas_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});return null;}
  if(url.pathname==='/account'){
   if(req.method==='POST'){
    if(access.role!=='admin'){send(403,'Apenas administradores podem gerir contas.');return null;}
    try{const input=await body(req),existing=accounts.find(a=>a.username===input.get('username')),data=validateAccount({username:input.get('username'),role:input.get('role'),organization:access.organization,units:input.get('unitMode')==='selected'?input.getAll('unit'):input.get('unitMode')==='all'?null:existing?.units});if(existing&&existing.organization!==access.organization)throw Error('Nome de utilizador indisponível.');const next=accounts.filter(a=>a.username!==data.username);if(input.get('operation')!=='delete')next.push({...data,password:input.get('password')?passwordRecord(input.get('password')):existing?.password||passwordRecord('')});if(!next.some(a=>a.organization===access.organization&&a.role==='admin'))throw Error('A organização precisa de um administrador.');store.write(next);send(303,'',{Location:'/account'});}catch(error){send(400,page('Conta',`<p>${escape(error.message)}</p><a href="/account">Voltar</a>`));}return null;
   }
   if(req.method!=='GET'){send(405,'');return null;}
   const list=accounts.filter(a=>a.organization===access.organization).map(a=>`<li>${escape(a.username)} · ${escape(a.role)}</li>`).join('');send(200,page('Conta',`<p>${escape(access.actor)} · ${escape(access.organization)} · ${escape(access.role)}</p><a href="/">Abrir projeto</a>${access.role==='admin'?`<h2>Contas da organização</h2><ul>${list}</ul><label>Editar conta<select id="accountPick"><option value="">Nova conta</option></select></label><form method="post" id="accountForm"><label>Utilizador<input name="username" required maxlength="100"></label><label>Papel<select name="role"><option value="reader">Leitor</option><option value="editor">Editor</option><option value="admin">Administrador</option></select></label><label>Palavra-passe (vazia mantém a existente)<input name="password" type="password" minlength="12" autocomplete="new-password"></label><label>Acesso às unidades<select name="unitMode"><option value="all">Toda a organização</option><option value="selected">Apenas unidades selecionadas</option></select></label><fieldset id="unitChoices"><legend>Unidades autorizadas</legend></fieldset><p>Uma seleção vazia não dá acesso a unidades. Administradores têm acesso à organização inteira.</p><button name="operation" value="save">Guardar conta</button><button name="operation" value="delete">Eliminar conta</button></form>`:''}<form action="/logout" method="post"><button>Terminar sessão</button></form><script src="/account-units.js" type="module"></script>`));return null;
  }
  return access;
 };
}
