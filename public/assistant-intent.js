// Help questions cannot authorize project mutations, regardless of model output.
export function isHelpQuestion(value){
 const text=String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
 return /^(?:como\b|onde\b|qual\b|quais\b|que\b|quantos\b|quantas\b|resume\b|procura\b|localiza\b|encontra\b|mostra\b|porque\b|por que\b|o que\b|que passos\b|explica\b|explicar\b|ensina\b|ensinar\b|mostra-me como\b|ajuda-me a perceber\b|podes (?:explicar|ensinar)\b)/.test(text);
}
export function assistantRequestMode(mode,prompt){return mode==='configure'&&!isHelpQuestion(prompt)?'configure':'advice';}
