import {registrationPage,registrationForm as registerForm,loginPage as authPage,loginForm} from './registration-page.mjs';
import {randomBytes} from 'node:crypto';
import {accountStore,passwordMatches,passwordRecord,validateAccount,accountGrants,withGrant,withoutGrant,assertOrganizationAdmins} from './accounts.mjs';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const page=(title,body)=>`<!doctype html><html lang="pt"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title} · Atlas</title><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/layout.css"><script src="/client-context.js"></script><body><main style="max-width:640px;margin:5vh auto;padding:24px"><h1>${title}</h1>${body}</main></body></html>`;
function orgCode(name,accounts){const base=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'equipa',taken=new Set(accounts.flatMap(a=>accountGrants(a).map(g=>g.organization)));let code=base,n=2;while(taken.has(code))code=base.slice(0,Math.max(1,70-String(n).length-1))+'-'+n++;return code;}
async function body(req){let text='';for await(const part of req){text+=part;if(text.length>10000)throw Error('Pedido demasiado grande.');}return new URLSearchParams(text);}
export function createAuth(directory,{now=Date.now}={}){
 const store=accountStore(directory),sessions=new Map(),attempts=new Map(),registrationAttempts=new Map();
 // Initialize/migrate before accepting requests; invalid legacy data must fail closed.
 store.exists();
 return async function authenticate(req,res,url){
  const send=(status,content,headers={})=>{res.writeHead(status,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'",...headers});res.end(content);};
  const jsonAuth=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));return null;};
  if(url.pathname==='/register'){
   if(req.method==='GET'){send(200,registrationPage('Crie o seu espaço de trabalho',registerForm()));return null;}
   if(req.method!=='POST'){send(405,'');return null;}
   try{
    const peer=req.socket.remoteAddress,limit=registrationAttempts.get(peer)||{count:0,until:now()+900000};if(limit.until<=now()){limit.count=0;limit.until=now()+900000;}if(limit.count>=5){send(429,registrationPage('Registo temporariamente indisponível',`<p class="register-error" role="alert" tabindex="-1">Demasiadas tentativas. Aguarde 15 minutos.</p><a href="/register">Tentar novamente</a>`));return null;}limit.count++;registrationAttempts.set(peer,limit);
    const input=await body(req),email=(input.get('email')||'').trim().toLowerCase(),organizationName=(input.get('organizationName')||'').trim(),password=input.get('password')||'';
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>100)throw Error('Indique um endereço de email válido.');
    if(organizationName.length<2||organizationName.length>100)throw Error('Indique o nome da empresa ou equipa (2 a 100 caracteres).');
    if(password!==input.get('passwordConfirm'))throw Error('As palavras-passe não coincidem.');
    const accounts=store.exists()?store.read():[];if(accounts.some(a=>a.username.toLowerCase()===email))throw Error('Este email já tem uma conta. Inicie sessão ou use outro email.');
    const organization=orgCode(organizationName,accounts),account={...validateAccount({username:email,role:'admin',organization}),organizationName,password:passwordRecord(password)};
    store.write([...accounts,account]);registrationAttempts.delete(peer);
    const token=randomBytes(32).toString('hex');sessions.set(token,{username:account.username,hash:account.password.hash,organization:account.organization,expires:now()+8*3600000});
    send(303,'',{Location:'/editor.html?welcome=1','Set-Cookie':`atlas_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${req.socket.encrypted?'; Secure':''}`});return null;
   }catch(error){send(400,registrationPage('Crie o seu espaço de trabalho',registerForm(error.message)));return null;}
  }
  if(url.pathname==='/login'&&req.method==='GET'){send(200,authPage('Iniciar sessão',loginForm('',url.searchParams.get('next')||'')));return null;}
  if(!store.exists()){
   if(url.pathname==='/'||url.pathname==='/landing.html')return {actor:null,owner:null,role:null};
   if(url.pathname==='/login'&&req.method==='POST'){send(401,authPage('Iniciar sessão',loginForm('Email ou palavra-passe incorretos.')));return null;}
   if(url.pathname==='/account'){
    if(req.method==='GET'){send(200,page('Ativar contas','<p>A primeira conta será administradora do cliente default, com acesso ao projeto local existente.</p><form method="post"><label>Utilizador<input name="username" autocomplete="username" required maxlength="100"></label><label>Palavra-passe (mínimo 12 caracteres)<input name="password" type="password" autocomplete="new-password" minlength="12" required></label><button>Ativar contas</button></form><a href="/">Voltar ao projeto</a>'));return null;}
    if(req.method==='POST'){try{const input=await body(req);if(store.exists()){send(409,'As contas já foram ativadas.');return null;}const account=validateAccount({username:input.get('username'),role:'admin',organization:'default'});account.password=passwordRecord(input.get('password'));store.write([account]);send(303,'',{Location:'/login'});}catch(error){send(400,page('Ativar contas',`<p>${escape(error.message)}</p><a href="/account">Voltar</a>`));}return null;}send(405,'');return null;
   }
   if(url.pathname==='/api/clients')return jsonAuth({clients:[],local:true});
   return {actor:'atlas-local',owner:'atlas-local',role:'admin',organization:null,units:null};
  }
  for(const [id,s] of sessions)if(s.expires<=now())sessions.delete(id);
  for(const [id,a] of attempts)if(a.until<=now())attempts.delete(id);
  const cookie=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('atlas_session='))?.slice(14),session=sessions.get(cookie),accounts=store.read(),user=session&&accounts.find(a=>a.username===session.username&&a.password.hash===session.hash);
  const grants=user?accountGrants(user):[],requested=req.headers['x-atlas-organization']||(url.pathname==='/account'?url.searchParams.get('client'):null),organization=requested||session?.organization||user?.organization,grant=grants.find(g=>g.organization===organization),access=user&&grant?{actor:user.username,owner:organization==='default'?'atlas-local':'organization:'+organization,role:grant.role,organization,organizationName:user.organization===organization?(user.organizationName||organization):organization,units:grant.units}:null;
  if(url.pathname==='/login'){
   if(req.method==='POST'){
    const peer=req.socket.remoteAddress,limit=attempts.get(peer)||{count:0,until:now()+900000};if(limit.count>=10){send(429,authPage('Tenta mais tarde','<p class="register-error" role="alert" tabindex="-1">Demasiadas tentativas. Aguarde 15 minutos.</p>'));return null;}limit.count++;attempts.set(peer,limit);
    const input=await body(req),account=accounts.find(a=>a.username===input.get('username')),dummy={salt:'00000000000000000000000000000000',hash:'00'.repeat(32)};
    if(!passwordMatches(input.get('password'),account?.password||dummy)||!account){send(401,authPage('Iniciar sessão',loginForm('Email ou palavra-passe incorretos.',url.searchParams.get('next')||'')));return null;}
    attempts.delete(peer);const token=randomBytes(32).toString('hex');sessions.set(token,{username:account.username,hash:account.password.hash,organization:account.organization,expires:now()+8*3600000});const next=url.searchParams.get('next'),destination=next?.startsWith('/')&&!next.startsWith('//')&&!/[\\\r\n]/.test(next)?next:'/editor.html';send(303,'',{Location:destination,'Set-Cookie':`atlas_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${req.socket.encrypted?'; Secure':''}`});return null;
   }
   if(req.method!=='GET'){send(405,'');return null;}send(200,authPage('Iniciar sessão',loginForm('',url.searchParams.get('next')||'')));return null;
  }
  if(user&&url.pathname==='/api/clients'&&req.method==='GET')return jsonAuth({clients:grants,active:access?.organization||null});
  if(user&&url.pathname==='/api/clients/select'&&req.method==='POST'){const input=await body(req),next=grants.find(g=>g.organization===input.get('organization'));if(!next)return jsonAuth({error:'Não tem acesso a este cliente.'},403);session.organization=next.organization;return jsonAuth({organization:next.organization});}
  if(user&&url.pathname==='/api/clients'&&req.method==='POST'){
   if(access?.role!=='admin')return jsonAuth({error:'Só administradores podem criar clientes.'},403);
   try{const input=await body(req),organization=input.get('organization'),valid=validateAccount({username:user.username,organization,role:'admin'});if(accounts.some(a=>accountGrants(a).some(g=>g.organization===organization)))return jsonAuth({error:'Código de cliente indisponível.'},409);store.write(accounts.map(a=>a.username===user.username?withGrant(a,valid):a));return jsonAuth({organization},201);}catch(error){return jsonAuth({error:error.message},400);}
  }
  if(user&&!access&&url.pathname.startsWith('/api/'))return jsonAuth({error:'Este cliente deixou de estar autorizado. Escolha outro cliente.',selectClient:true},403);
   if(!access){if(url.pathname==='/'||url.pathname==='/landing.html'||['/style.css','/layout.css','/client-context.js','/product.css','/auth-pages.css','/registration.css','/registration.js','/images/atlas-workspace.webp','/landing.css','/landing.js','/images/atlas-campus.webp','/atlas-product-preview.png','/clients.html','/clients-page.js','/product-api.js','/model.js','/offline-store.js'].includes(url.pathname))return {actor:null,owner:null,role:null};if(url.pathname.startsWith('/api/'))return jsonAuth({error:'Inicie sessão para continuar.',login:'/login'},401);send(303,'',{Location:user?'/clients.html':'/login'+(url.searchParams.has('equipment')||['/field.html','/portal.html'].includes(url.pathname)?'?next='+encodeURIComponent(url.pathname+url.search):'')});return null;}
  if(url.pathname==='/api/access/accounts'){if(access.role!=='admin')return jsonAuth({error:'Apenas administradores.'},403);return jsonAuth({accounts:accounts.flatMap(a=>{const g=accountGrants(a).find(g=>g.organization===access.organization);return g?[{username:a.username,role:g.role,units:g.units}]:[]})});}
  if(url.pathname==='/logout'){if(req.method!=='POST'){send(405,'');return null;}sessions.delete(cookie);send(303,'',{Location:'/login','Set-Cookie':'atlas_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});return null;}
  if(url.pathname==='/account'){
   if(req.method==='POST'){
    if(access.role!=='admin'){send(403,'Apenas administradores podem gerir contas.');return null;}
    try{const input=await body(req),existing=accounts.find(a=>a.username===input.get('username')),previous=existing&&accountGrants(existing).find(g=>g.organization===access.organization),data=validateAccount({username:input.get('username'),role:input.get('role'),organization:access.organization,units:input.get('unitMode')==='selected'?input.getAll('unit'):input.get('unitMode')==='all'?null:previous?.units});
     if(existing&&existing.organization!==access.organization&&input.get('password'))throw Error('Não pode alterar a palavra-passe de uma conta de outro cliente. Deixe esse campo vazio para gerir apenas o acesso.');
     let updated;if(input.get('operation')==='delete'){if(!previous)throw Error('Conta não associada a este cliente.');updated=withoutGrant(existing,access.organization);}else updated=existing?withGrant({...existing,...(input.get('password')?{password:passwordRecord(input.get('password'))}:{})},data):{...data,password:passwordRecord(input.get('password'))};
     const next=accounts.filter(a=>a.username!==data.username);if(updated)next.push(updated);if(!next.some(a=>accountGrants(a).some(g=>g.organization===access.organization&&g.role==='admin')))throw Error('O cliente precisa de um administrador.');assertOrganizationAdmins(next);store.write(next);send(303,'',{Location:'/account?client='+encodeURIComponent(access.organization)});
    }catch(error){send(400,page('Conta',`<p>${escape(error.message)}</p><a href="/account">Voltar</a>`));}return null;
   }
   if(req.method!=='GET'){send(405,'');return null;}const list=accounts.flatMap(a=>{const g=accountGrants(a).find(g=>g.organization===access.organization);return g?[`<li>${escape(a.username)} · ${escape(g.role)}</li>`]:[]}).join('');
   send(200,page('Conta',`<p>${escape(access.actor)} · ${escape(access.organization)} · ${escape(access.role)}</p><a href="/home.html">Abrir projeto</a> · <a href="/clients.html">Mudar de cliente</a>${access.role==='admin'?`<h2>Contas da organização</h2><ul>${list}</ul><label>Editar conta<select id="accountPick"><option value="">Nova conta ou conta existente de outro cliente</option></select></label><form method="post" id="accountForm"><label>Utilizador<input name="username" required maxlength="100"></label><label>Papel<select name="role"><option value="reader">Leitor</option><option value="editor">Editor</option><option value="admin">Administrador</option></select></label><label>Palavra-passe (vazia mantém a existente)<input name="password" type="password" minlength="12" autocomplete="new-password"></label><label>Acesso às unidades<select name="unitMode"><option value="all">Toda a organização</option><option value="selected">Apenas unidades selecionadas</option></select></label><fieldset id="unitChoices"><legend>Unidades autorizadas</legend></fieldset><p>Uma seleção vazia não dá acesso a unidades. Administradores têm acesso à organização inteira. Uma conta já existente pode receber acesso a este cliente sem mudar a sua palavra-passe.</p><button name="operation" value="save">Guardar conta</button><button name="operation" value="delete">Eliminar acesso a este cliente</button></form>`:''}<form action="/logout" method="post"><button>Terminar sessão</button></form><script src="/account-units.js" type="module"></script>`));return null;
  }
  return access;
 };
}
