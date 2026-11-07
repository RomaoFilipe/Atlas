import {sceneAppearance} from './scene-appearance.js';

// Reuse one WebGL context across inspector refreshes and selections.
export function createEquipmentPreview(){
 const root=document.createElement('div');root.className='equipment-preview';
 const canvas=document.createElement('div');canvas.className='equipment-preview-canvas';canvas.setAttribute('role','img');
 const labels=document.createElement('div');labels.hidden=true;
 const hint=document.createElement('small');hint.textContent='Arraste para rodar · roda para aproximar';
 const reset=document.createElement('button');reset.type='button';reset.className='equipment-preview-reset';reset.textContent='⛶';reset.setAttribute('aria-label','Enquadrar equipamento');
 root.append(canvas,labels,hint,reset);
 let view=null,lastKey='',currentId='',failed=false,request=0;
 reset.onclick=()=>view?.focusDevice(currentId);
 return {async mount(parent,project,device){
  const token=++request;
  parent.classList.add('has-equipment-preview');parent.prepend(root);
  canvas.setAttribute('aria-label','Modelo 3D de '+device.name);
  if(failed)return;
  try{
   const {createScene}=await import('./scene.js');if(token!==request)return;
   view??=createScene(canvas,labels,()=>{},()=>{},()=>{},{preview:true});
   const key=JSON.stringify([device,sceneAppearance()]);currentId=device.id;
   view.resize();
   if(key!==lastKey){
    view.update({...project,devices:[device],links:[]},{mode:'portrait',appearance:sceneAppearance()});
    view.focusDevice(device.id);lastKey=key;
   }
  }catch(error){failed=true;parent.classList.remove('has-equipment-preview');root.remove();}
 }};
}
