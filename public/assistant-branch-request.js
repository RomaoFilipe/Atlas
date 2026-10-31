const counts={um:1,uma:1,dois:2,duas:2,tres:3,quatro:4,cinco:5,seis:6,sete:7,oito:8,nove:9,dez:10,vinte:20,quarenta:40};
const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export const branchExample='Prepara uma filial com dois pisos, três departamentos e 40 postos.';
export function parseBranchRequest(prompt){
 const m=String(prompt||'').trim().replace(/[.!]$/,'').match(/^prepara uma filial(?: chamada "([^"]+)")? com (\d+|um|dois|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez) pisos?, (\d+|um|dois|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|vinte) departamentos? e (\d+|dez|vinte|quarenta) postos$/iu);
 if(!m)return null;return {kind:'branch',name:m[1]||'Filial',floors:Number(m[2])||counts[norm(m[2])],departments:Number(m[3])||counts[norm(m[3])],people:Number(m[4])||counts[norm(m[4])]};
}
