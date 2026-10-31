// Each document pins API calls to its client, independently of other tabs.
(()=>{
 const original=window.fetch.bind(window),pinned=()=>{if(window.__atlasClient)return window.__atlasClient;try{return sessionStorage.getItem('atlas-active-client');}catch{return null;}},pin=value=>{window.__atlasClient=value;try{sessionStorage.setItem('atlas-active-client',value);}catch{}};
 if(location.pathname==='/login'){window.__atlasClient=null;try{sessionStorage.removeItem('atlas-active-client');sessionStorage.removeItem('atlas-offline-identity');localStorage.removeItem('atlas-offline-active');}catch{}}
 window.fetch=(input,init={})=>{const url=new URL(input instanceof Request?input.url:String(input),location.href);if(url.origin===location.origin&&url.pathname.startsWith('/api/')){const headers=new Headers(input instanceof Request?input.headers:undefined);new Headers(init.headers).forEach((value,key)=>headers.set(key,value));const organization=pinned();if(organization&&!headers.has('X-Atlas-Organization'))headers.set('X-Atlas-Organization',organization);init={...init,headers};}
  return original(input,init).then(async response=>{if(url.origin===location.origin&&url.pathname==='/api/session'&&response.ok){try{const data=await response.clone().json(),current=pinned();if(data.organization&&(!current||current===data.organization))pin(data.organization);}catch{}}return response;});
 };
})();
