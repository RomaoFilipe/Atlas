// Serialize callers; a newer edit is saved only after the previous revision returns.
export function createSaveQueue({get,persist,onSaved,onError}){
 let flight=null;
 return function save(){
  if(flight)return flight;
  flight=(async()=>{
   while(true){
    const state=get();
    if(!state.ready||state.conflict)return false;
    if(!state.dirty)return true;
    const snapshot={revision:state.revision,generation:state.generation,project:state.project};
    try{const result=await persist(snapshot);if(!Number.isInteger(result.revision)||result.revision!==snapshot.revision+1)throw Error('O servidor devolveu uma revisão inesperada.');onSaved(result,snapshot);}
    catch(error){onError(error);return false;}
   }
  })().finally(()=>{flight=null;});
  return flight;
 };
}
