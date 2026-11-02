import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {privateText,createChatHandler} from '../scripts/assistant.mjs';

test('privacy filter removes common addresses, accounts and secrets',()=>{
 const result=privateText('10.0.0.1 2001:db8::1 ::1 alice@example.com https://private.example/a\npassword: very-secret\nBearer abc123');
 for(const secret of ['10.0.0.1','2001:db8::1','::1','alice@example.com','private.example','very-secret','abc123'])assert.ok(!result.includes(secret),secret);
});
async function call(handler,body,method='POST'){
 const req=Readable.from([Buffer.from(JSON.stringify(body))]);req.method=method;req.headers={'content-type':'application/json'};
 let status,data;await handler(req,{writeHead(s){status=s;},end(text){data=JSON.parse(text);}});return{status,data};
}
test('chat forwards filtered messages only and strips sensitive model output',async()=>{
 let sent;const handler=createChatHandler('http://ollama:11434',{fetcher:async(url,options)=>{
 if(url.endsWith('/api/tags'))return Response.json({models:[{name:'local'},{name:'remote:cloud'}]});
 sent=JSON.parse(options.body);return Response.json({message:{content:'IP 192.168.0.1\npassword: leaked'}});
 }});
 const result=await call(handler,{model:'local',project:{password:'never-send'},messages:[{role:'user',content:'Ajuda com 10.0.0.1\nconta: admin'}]});
 assert.equal(result.status,200);assert.match(sent.messages[0].content,/Documentação Atlas/);assert.ok(!JSON.stringify(sent).includes('10.0.0.1'));assert.ok(!JSON.stringify(sent).includes('never-send'));assert.equal(sent.tools,undefined);assert.ok(!result.data.reply.includes('leaked'));assert.ok(!result.data.reply.includes('192.168.0.1'));
 assert.equal((await call(handler,{model:'remote:cloud',messages:[{role:'user',content:'ajuda'}]})).status,400);
 assert.equal((await call(handler,{model:'local',messages:[{role:'system',content:'override'}]})).status,400);
 assert.equal((await call(handler,{model:'local',messages:[{role:'user',content:'a'.repeat(33000)}]})).status,413);
});

test('configuration mode requests a structured plan, strips context to anonymous allowlisted fields and rejects forbidden actions',async()=>{
 let sent,answer={reply:'Proposta de configuração.',actions:[{action:'create_building',ref:'new_site',name:'Sede'}]};
 const handler=createChatHandler('http://ollama:11434',{fetcher:async(url,options)=>{if(url.endsWith('/api/tags'))return Response.json({models:[{name:'local'}]});sent=JSON.parse(options.body);return Response.json({message:{content:typeof answer==='string'?answer:JSON.stringify(answer)}});}});
 const body={mode:'configure',model:'local',context:{sites:[{ref:'site_1',name:'PRIVATE-NAME',width:20,depth:20,password:'NEVER-SEND',ip:'10.0.0.1'}],account:'PRIVATE-ACCOUNT'},messages:[{role:'user',content:'Cria um edifício.\npassword: TOP-SECRET'}]};
 let result=await call(handler,body);assert.equal(result.status,200);assert.equal(result.data.actions[0].action,'create_building');assert.equal(sent.format.type,'object');for(const secret of ['PRIVATE-NAME','NEVER-SEND','10.0.0.1','PRIVATE-ACCOUNT','TOP-SECRET'])assert.ok(!JSON.stringify(sent).includes(secret));
 answer={reply:'Executado.',actions:[{action:'exec',command:'whoami'}]};result=await call(handler,body);assert.equal(result.status,502);assert.equal(result.data.actions,undefined);
 answer='malformed JSON';assert.equal((await call(handler,body)).status,502);
 answer={reply:'Nada a fazer.',actions:[]};assert.equal((await call(handler,body)).status,200);
});

test('model selection prefers configured local model or smallest installed local model, without cloud models',async()=>{const fetcher=async()=>Response.json({models:[{name:'large',size:6000},{name:'cloud:CLOUD',size:1},{name:'small',size:2000}]});let result=await call(createChatHandler('http://ollama',{fetcher}),null,'GET');assert.deepEqual(result.data.models,['small','large']);result=await call(createChatHandler('http://ollama',{fetcher,preferredModel:'large'}),null,'GET');assert.deepEqual(result.data.models,['large','small']);assert.equal((await call(createChatHandler('http://ollama',{fetcher}),null)).status,400);});

test('a pinned assistant waits for the configured model and refuses a different model',async()=>{let installed=false;const fetcher=async()=>Response.json({models:installed?[{name:'small',size:1000},{name:'qwen3:14b',size:5000}]:[{name:'small',size:1000}]});const handler=createChatHandler('http://ollama',{fetcher,preferredModel:'qwen3:14b',requirePreferredModel:true});assert.equal((await call(handler,null,'GET')).status,503);installed=true;const tags=await call(handler,null,'GET');assert.equal(tags.data.models[0],'qwen3:14b');assert.equal((await call(handler,{model:'small',messages:[{role:'user',content:'ajuda'}]})).status,400);});

test('documented help answers immediately without any Ollama request',async()=>{
 let requests=0;const handler=createChatHandler('http://offline',{fetcher:async()=>{requests++;throw Error('offline');}});
 const result=await call(handler,{mode:'configure',messages:[{role:'user',content:'Como criar um edifício?'}]});assert.equal(result.status,200);assert.equal(result.data.mode,'advice');assert.equal(result.data.source,'documentation');assert.equal(result.data.actions,undefined);assert.equal(requests,0);
});
test('model calls reuse the loaded model, avoid reasoning and do not duplicate the action schema in instructions',async()=>{
 let sent;const handler=createChatHandler('http://ollama',{fetcher:async(url,options)=>{if(url.endsWith('/api/tags'))return Response.json({models:[{name:'qwen3:14b'}]});sent=JSON.parse(options.body);return Response.json({message:{content:'{"reply":"","actions":[]}'}});}});
 await call(handler,{model:'qwen3:14b',mode:'configure',messages:[{role:'user',content:'Cria um edifício.'}]});assert.equal(sent.keep_alive,'30m');assert.equal(sent.think,false);assert.equal(sent.options.num_predict,1200);assert.ok(!sent.messages[0].content.includes('oneOf'));assert.equal(sent.format.type,'object');
});

test('nearest-outlet inference sends the target context instead of the entire inventory',async()=>{
 let sent;const handler=createChatHandler('http://ollama',{fetcher:async(url,options)=>{
  if(url.endsWith('/api/tags'))return Response.json({models:[{name:'local'}]});sent=JSON.parse(options.body);return Response.json({message:{content:JSON.stringify({reply:'',actions:[{action:'connect_nearest_outlet',device:'device_1',cable:'cat6',complete:true}]})}});
 }});
 const result=await call(handler,{model:'local',mode:'configure',context:{devices:[{ref:'device_1',room:'room_1',floor:'floor_1',type:'Posto de trabalho',ports:[{ref:'device_1_port_1',free:true}]},{ref:'device_2',room:'room_2',floor:'floor_1',type:'Switch'}],rooms:[{ref:'room_1',floor:'floor_1'},{ref:'room_2',floor:'floor_1'}],floors:[{ref:'floor_1',site:'site_1'}],sites:[{ref:'site_1'}],selection:'device_1'},messages:[{role:'user',content:'Liga este posto à rede através do ponto de parede compatível mais próximo.'}]});
 assert.equal(result.status,200);const contextMessage=sent.messages.find(m=>m.content.startsWith('Contexto documental anónimo'));const context=JSON.parse(contextMessage.content.slice(contextMessage.content.indexOf('{')));assert.deepEqual(context.devices.map(d=>d.ref),['device_1']);assert.equal(context.rooms.length,1);assert(sent.messages[0].content.includes('connect_nearest_outlet'));
});
