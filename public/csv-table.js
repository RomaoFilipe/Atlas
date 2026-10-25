export const normalizeColumn=value=>String(value||'').replace(/^\uFEFF/,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/[ _-]+/g,'');
export function readCSVTable(source,{maxBytes=100000,maxRows=200}={}){
 if(new TextEncoder().encode(source).length>maxBytes)throw new Error('A tabela excede '+Math.round(maxBytes/1000)+' KB.');
 if(!source.trim())return {headers:[],rows:[],lines:[]};
 const first=source.split(/\r?\n/)[0],delimiter=first.includes('\t')?'\t':first.includes(';')?';':',';
 const table=[],lines=[];let row=[],cell='',quoted=false,line=1,startLine=1;
 const push=()=>{row.push(cell.trim());if(row.some(Boolean)){table.push(row);lines.push(startLine);}row=[];cell='';startLine=line;};
 for(let i=0;i<source.length;i++){const char=source[i];if(char==='"'){if(quoted&&source[i+1]==='"'){cell+='"';i++;}else if(quoted||!cell.trim())quoted=!quoted;else throw new Error('Linha '+line+': aspas inválidas.');}
 else if(!quoted&&char===delimiter){row.push(cell.trim());cell='';}
 else if(char==='\n'||char==='\r'){if(char==='\r'&&source[i+1]==='\n')i++;line++;if(quoted)cell+='\n';else push();}
 else cell+=char;
 }
 if(quoted)throw new Error('Existe um campo com aspas por fechar.');push();
 if(table.length>maxRows+1)throw new Error('Importe até '+maxRows+' linhas de dados de cada vez.');
 return {headers:table.shift()||[],rows:table,lines:lines.slice(1)};
}
