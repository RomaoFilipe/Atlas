export function privateText(value){
 return String(value).normalize('NFKC')
 .replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?(?:-----END [^-]*PRIVATE KEY-----|$)/gi,'[CHAVE REMOVIDA]')
 .replace(/\b(?:password|passwd|senha|palavra[- ]passe|token|secret|api[_ -]?key|authorization|cookie|conta|account|username|utilizador|login)\b\s*[:=]\s*[^\n]+/gi,'[CREDENCIAL REMOVIDA]')
 .replace(/\b(?:Bearer\s+\S+|eyJ[\w-]+\.[\w-]+\.[\w-]+|(?:sk-|ghp_|github_pat_)[\w-]+)/gi,'[TOKEN REMOVIDO]')
 .replace(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi,'[CONTA REMOVIDA]')
 .replace(/\b(?:\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?\b/g,'[IP REMOVIDO]')
 .replace(/(?<![\w:])(?:[a-f\d]{0,4}:){2,}[a-f\d:.%]*(?:\/\d{1,3})?/gi,'[IP REMOVIDO]')
 .replace(/\b(?:https?|ssh|ftp):\/\/[^\s]+/gi,'[ENDEREÇO REMOVIDO]');
}
