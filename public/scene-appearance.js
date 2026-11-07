const key='atlas-scene-appearance';
export function sceneAppearance(){try{return localStorage.getItem(key)==='classic'?'classic':'enhanced';}catch{return 'enhanced';}}
export function setSceneAppearance(value){try{localStorage.setItem(key,value==='classic'?'classic':'enhanced');}catch{}}
