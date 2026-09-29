# Segurança dos backups exportados

## Modelo de proteção

O formato `.atlasenc` protege o documento do projeto exportado (incluindo nomes, IPs, VLANs, cabos, modelos e configurações) contra a leitura de uma cópia do ficheiro sem acesso à chave e à identidade correta. A extensão não é a proteção: o conteúdo é cifrado e autenticado.

- AES-256-GCM, etiqueta de autenticação de 128 bits, IV aleatório de 96 bits.
- Chave de 256 bits gerada por CSPRNG, guardada como segredo de execução `ATLAS_EXPORT_KEYRING` em Sites. Nunca em `public/`, no repositório, na exportação ou em armazenamento do navegador.
- Cada exportação usa salt aleatório de 256 bits; HKDF-SHA-256 deriva uma chave por ficheiro, vinculada ao domínio `atlas-export`, versão do protocolo, ID do Site e ID do utilizador autenticado fornecido pela plataforma. O pedido não pode escolher outro proprietário.
- Cabeçalho canónico autenticado como AAD: formato, versão, algoritmo, ID da chave, salt e IV. Não há metadados da empresa em claro. O tamanho aproximado do documento permanece observável.
- A importação verifica a autenticação antes de interpretar/validar o conteúdo. Não escreve na base de dados: o utilizador confirma a substituição pelo fluxo normal, com possibilidade de anular.
- APIs exigem identidade, POST, Origin exata e JSON; têm limites de leitura e respostas sem cache. Ficheiros inválidos ou de outra conta devolvem uma mensagem genérica. A falta da chave impede a exportação, sem fallback em claro.

## Operação e recuperação

Configuração do segredo (exemplo esquemático, não utilizar como chave):

`{"active":"k1","keys":{"k1":"32_BYTES_ALEATORIOS_EM_BASE64"}}`

Para rodar, gerar uma chave nova por CSPRNG, adicionar um novo ID à coleção e alterar `active`. **Preservar as chaves antigas**: cada backup identifica a sua chave original. A implementação aceita até 20 IDs; não eliminar uma chave enquanto existirem ficheiros que dependem dela. Aplicar alterações através de uma nova publicação do Site. Não regenerar silenciosamente uma chave ausente.

A instalação inicial mantém a chave no serviço de segredos de Sites. Não foi criada uma cópia externa de recuperação, um cofre HSM/KMS dedicado, nem rotação automática. Antes de usar como backup de desastre de uma empresa, o responsável deve definir custódia/recuperação da chave num cofre aprovado, testar um restauro e assegurar continuidade da conta e do Site. Perder a chave torna os backups correspondentes irrecuperáveis. A cifra não oferece abertura offline nem portabilidade para outra conta/Site.

## Limites explícitos

Esta é cifra do ficheiro exportado, efetuada no servidor, não E2EE/zero-knowledge. O servidor processa o documento em claro. Um administrador com controlo do serviço e da chave pode decifrá-lo; uma conta/sessão comprometida pode consultar os seus dados. Não é matematicamente possível garantir que apenas uma interface específica possa ler dados quando alguém obtém a chave.

Não modifica o armazenamento do projeto, versões, plantas em R2 ou rascunhos locais. As imagens de plantas e os anexos de equipamentos mantêm referências aos ativos da mesma conta; o backup do projeto não é um arquivo autónomo desses ativos. JSONs exportados anteriormente continuam legíveis. Exemplos fictícios incorporados continuam disponíveis em JSON.

SVG, PNG, impressão/PDF, HTML do dossier e CSV são exportações legíveis, com aviso e confirmação explícitos. Não têm a proteção `.atlasenc`. Esta implementação não impede fotografias, capturas de ecrã ou cópias feitas por utilizadores autorizados.

Não se reivindica ausência de vulnerabilidades ou certificação. Antes de introduzir topologia empresarial altamente sensível, recomenda-se revisão independente da implementação e dos controlos de acesso, custódia, sessão, alojamento e recuperação.

## Verificação

Testes verificam restauro, ausência de nomes/IP/chave em claro, aleatoriedade, adulteração de cabeçalho/ciphertext, outra conta, rotação com retenção da chave antiga, ausência de segredo, origem/método/tipo/tamanho, e indisponibilidade do código privado como ativo público.

Referências: OWASP Cryptographic Storage Cheat Sheet; OWASP Key Management Cheat Sheet; Web Crypto API (`AES-GCM`, `HKDF`).
