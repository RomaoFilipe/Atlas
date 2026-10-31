# Estado do desenvolvimento

## Primeira fase — 28 de outubro de 2026

- Corrigida a inicialização de bastidores no contexto do assistente.
- Base de conhecimento versionada em `public/assistant-knowledge.js`, com 12 guias e pesquisa lexical. Não constitui fine-tuning do modelo.
- O servidor acrescenta documentação relevante às instruções do assistente nos dois modos. O texto do utilizador não é copiado para a documentação de confiança.
- Guias consultáveis no painel de chat, sem depender do Ollama.
- CI preparada para build e testes em Node 22 e 24; execução no GitHub ainda não verificada.
- Instruções de Docker/modelo e exposição de rede corrigidas no README.
- Validação local: build e 198 testes aprovados. Sintaxe do chat e servidor validada.

## Validação ainda necessária nesta fase

- Browser: abrir, pesquisar e consultar guias; teclado e ecrã pequeno.
- Ollama real: qualidade das explicações com a nova documentação e regressão de ações.
- Expandir os guias para anexos, backups, dossier, QR, exportações e plantas importadas após conferir os controlos da interface.
- Avaliação reproduzível com métricas de ações, explicações e latência.

## Próximas fases

1. Concluir cobertura da ajuda e avaliações; adicionar sugestões contextuais e encaminhamento para formulários reais.
2. Definir e implementar identidade, organizações e permissões verificadas no servidor, preservando o modo local.
3. Migrar armazenamento para entidades e paginação com recuperação e testes de carga.
4. Planos VLAN/sub-redes por domínio; atualização CSV e auditoria imutável.
5. Coletor opcional autorizado com propostas para revisão.

O roadmap empresarial continua pendente. Não foi feito deploy nem foram alterados dados persistentes do utilizador.

## Segunda fase — ajuda, gravação, inventário e rapidez do chat

- 17 guias com pesquisa por sinónimos e acentos, fontes apresentadas no chat, sugestões por contexto e atalhos para os painéis reais.
- O chat começa em Só conversar. Perguntas de ajuda são tratadas como conselho mesmo quando o modo Configurar por mim está selecionado.
- Perguntas documentadas respondem diretamente a partir dos guias, sem modelo; a interface identifica a origem. Medição local: 1–2 ms no handler (não inclui renderização nem rede).
- Comandos exatos de criação de edifício/VLAN, adição de equipamentos e ligação da sala têm interpretação determinística. Passam pelo executor habitual, com limites, bloqueios e desfazer. Comandos ambíguos ou compostos continuam no modelo. A criação simples medida passou de 42,5 segundos com o Qwen3 a 2 ms no handler.
- O Qwen3 mantém-se configurado. Foram removidos o esquema duplicado das instruções e documentação desnecessária em ações; reasoning está desativado e o modelo permanece carregado durante 30 minutos após a utilização. Pedidos abertos ao modelo continuam a ter latência variável.
- Gravação serializada com revisão atualizada, espera por edições feitas durante o pedido, timeout de 20 segundos, conservação do rascunho em falhas e chave de rascunho separada por separador.
- CSV permite adicionar e atualizar por ID/série, rever alterados/ignorados e decidir por cabo se mantém ou desliga uma ligação numa mudança de sala. Colunas ausentes são preservadas; valores explicitamente vazios podem limpar campos. Mudanças de tipo, portas e montagem em U continuam na ficha.
- Auditoria por entidade com diferenças antes/depois, revisão, autor e data, gerada por triggers na mesma transação da gravação. API paginada e isolada por identidade, consulta em Projeto → Auditoria de alterações. UPDATE/DELETE da tabela são rejeitados por triggers. Não é proteção contra administradores da base de dados. No modo local, o ator continua a ser a identidade partilhada.
- Migrações novas: 0003 cria a tabela; 0004 cria os triggers. Não existe reconstrução retroativa da auditoria.
- Normalização preserva listas de pisos explicitamente vazias; migração de documentos antigos sem o campo mantém-se.
- Build publica o Worker por rename atómico, evitando a remoção do ficheiro durante testes de arranque concorrentes.
- Validação: 211 testes unitários/API/runtime e 4 testes Chromium aprovados. Browser testado em desktop e 390 px; ajuda com Ollama indisponível e ausência de gravações ao pedir instruções verificadas. Criação direta sem Ollama, gravação e Desfazer também verificados no browser.
- CI inclui os testes de browser; execução no GitHub ainda não verificada.
- Avaliação reproduzível: `npm run eval:assistant`, resultados em `docs/test-results/assistant-evaluation.json`. A avaliação distingue respostas dos guias, comandos diretos e inferência real; os critérios automáticos não substituem revisão humana.

O servidor local foi iniciado a pedido do utilizador em http://localhost:3000, com dados em `.atlas-local`. As migrações foram aplicadas ao reiniciar. Não foi feito deploy externo.

### Trabalho ainda pendente

- Identidade empresarial, organizações e permissões por unidade verificadas no servidor.
- Armazenamento por entidade e paginação do inventário/planta; os limites documentais existentes mantêm-se.
- VLANs/sub-redes por domínio.
- Coletor autorizado com propostas, avaliação de carga ampla e cobertura de browser dos restantes percursos.
- A latência de pedidos livres ao Qwen3 continua a depender do hardware; não foi feito fine-tuning.

## Pesquisa, simulação, manutenção e comparação — 29 de outubro de 2026

- Preservada a pesquisa global existente por nome, IP, série e localização, com abertura no mapa/bastidor.
- Atalho no inspetor prepara a simulação da falha do equipamento ou cabo selecionado.
- Ficha inclui próxima revisão e substituição prevista, validadas no modelo partilhado com o servidor.
- Pendências apresentam revisões vencidas/a 30 dias e substituições vencidas/a 90 dias; equipamentos abatidos são excluídos.
- Dossier HTML/impressão para PDF inclui identificação, calendário e intervenções.
- Histórico inclui diagrama esquemático de equipamentos e cabos adicionados, removidos e alterados, mantendo extremos removidos.
- Ficha adaptada a 390 px, com portas e ações de ligação acessíveis após leitura de QR pela câmara do sistema.
- Validação: 211 testes existentes e 3 novos testes de datas, pendências e comparação aprovados; 4 percursos Chromium existentes e novo percurso de pesquisa/edição de manutenção a 390 px aprovados.

## Assistente — consultas locais e avaliação contínua

- Consultas do inventário no browser: contagens por projeto/sala/piso/edifício, pesquisa por nome/IP/série, resumo do equipamento selecionado e pendências/manutenção.
- Respostas calculadas sobre os registos atuais, com até oito resultados e botões para abrir os equipamentos. Não há alterações ao projeto; um âmbito em falta exige selecionar a localização.
- Perguntas de consulta são tratadas como conversa mesmo no modo Configurar por mim. Respostas de consulta local não entram no histórico enviado ao modelo.
- Guias atualizados para manutenção, comparação visual, QR no telemóvel, pesquisa e simulação. Documentação: 2026-10-29.1.
- Ausência do endpoint de IA no alojamento explicada sem expor erros de JSON; consultas, guias e comandos diretos continuam disponíveis.
- Avaliação sem Ollama: 12 casos aprovados. Execução incluída no CI; o CI remoto ainda não foi verificado.
- Validação local: 219 testes e 8 percursos Chromium aprovados, incluindo consultas sem modelo e sem gravações a 1280 px e 390 px.
- Inferência real opcional: `npm run eval:assistant -- --with-model`. Criação encadeada passou no Qwen3 8B em cerca de 121 segundos, em CPU. A latência continua dependente do hardware; não foi feito fine-tuning.

## Assistente — inserir e configurar o projeto

- Comandos locais com seleção ou nome exato: criar estrutura completa, pisos, salas, bastidores e equipamentos com quantidade/portas; instalar em U e registar cabos de dados.
- Ações novas: criar VMs em servidores existentes, documentar alimentação por PDU, editar responsável/estado/série/notas, agendar revisão/substituição/garantia, registar intervenções e configurar endereçamento documental.
- IPs, gateways, sub-redes, fichas e intervenções só são aceites com valores expressos no pedido local. As propostas do modelo não podem introduzir nem substituir esses campos; as conversas locais não entram no histórico enviado ao modelo.
- Campos não mencionados são preservados. Vários comandos separados por ponto e vírgula são aplicados atomicamente, com um único Desfazer e persistência/auditoria normais.
- Referências ambíguas, ausência de seleção, datas inválidas, IPs duplicados, portas ocupadas/reservadas e capacidade inválida impedem a aplicação. A quantidade de portas respeita os tipos representados pelo Atlas.
- O chat oferece exemplos em O que posso inserir e configurar. Em Só conversar, reconhece um comando, conserva-o na caixa e indica como passar a Configurar por mim.
- Documentação 2026-10-29.3; avaliação determinística expandida para 20 casos, incluindo inserção e aplicação/recusa de alterações.
- Verificação final: 228 testes aprovados; 11 percursos Chromium aprovados, com repetição dos três percursos de configuração após os últimos ajustes. Persistência, ausência de chamadas ao modelo para campos locais e Desfazer do lote verificados a 1280 px e 390 px.

- Lista de exemplos limitada em altura para manter a mensagem acessível no telemóvel. Verificação final de browser: 12 percursos aprovados, incluindo a escolha de um exemplo a 390 × 660 px.


## Qwen3 14B e tarefas em lote — 30 de outubro de 2026

- Qwen3 14B instalado no Ollama local (cerca de 9,3 GB de modelo) e definido como modelo por predefinição no arranque direto, Compose, avaliação e guias. Chat e organização da planta usam o modelo configurado, sem troca silenciosa para um menor.
- Atlas local iniciado em http://localhost:3000 com os dados e chaves existentes em .atlas-local. Ambos os endpoints de descoberta confirmaram qwen3:14b como modelo selecionado.
- Ações novas: equipar sala com quantidades pedidas, atribuir VLAN em lote, montar equipamentos livres da sala, documentar alimentação dos equipamentos ativos do bastidor, guardar modelos e duplicar salas.
- Pedidos sequenciais podem referir pelo nome elementos criados nos passos anteriores. Não mudam a seleção implícita a meio do lote; os destinos novos devem ser identificados pelo nome.
- Equipar sala preserva os existentes e procura posições livres. A montagem e alimentação respeitam capacidade, bloqueios, portas e propostas; duplicações retiram identidades/IPs e conservam cabos como propostas.
- Contexto anónimo inclui bastidor/anfitrião, U, portas e bastidor atual, sem enviar nomes, IPs ou fichas. O formato estruturado limita monitores a 1 ou 2; exclusões de tipos de equipamento são verificadas antes de aplicar.
- Limite de resposta do modelo aumentado para cinco minutos, comunicado ao cliente. Mantêm-se 12 ações e 50 equipamentos novos, aplicação atómica, gravação e Desfazer.
- Verificação: 235 testes unitários/API/runtime e 13 percursos Chromium aprovados. Criação dependente, gravação e recuperação do lote verificadas no browser.
- Avaliação: 24 casos determinísticos e um caso real do Qwen3 14B aprovados. Pedido livre de dois postos e uma impressora: cerca de 35 segundos com o modelo carregado em CPU; a primeira execução demorou cerca de 177 segundos. Não é uma garantia de latência nem uma comparação controlada com o 8B.
- Ollama local e site alojado continuam separados. Os comandos diretos novos funcionam no site; inferência livre no site exige uma ligação ao servidor Ollama configurada separadamente.


## Objetivo completo de escritório — 30 de outubro de 2026

- Acrescentada a ação prepare_office e reconhecimento local do pedido completo para 20 pessoas, com computadores, impressora, tomadas, bastidor, ligação e revisão. Não depende de Ollama para esta frase suportada.
- O objetivo expande-se em ações existentes e validadas: acrescentar apenas os computadores/impressora em falta, dimensionar tomadas duplas, reutilizar capacidade de switch/painel e instalar material necessário num bastidor.
- A verificação é calculada sobre o resultado final, com percursos até ao switch, IPs/VLANs ausentes, destino Internet, propostas e portas pendentes. Não usa o texto de sucesso do modelo como prova de execução.
- Resultado num cenário sintético de sala vazia: 20 computadores, 1 impressora, 11 tomadas duplas, 1 bastidor, 1 switch, 1 patch panel e 63 ligações; 21/21 terminais com percurso documentado até ao switch. Endereçamento e Internet ficam explicitamente pendentes.
- Repetir o objetivo reutiliza os registos, sem duplicados nem nova gravação. Todos os passos podem ser desfeitos numa única operação. Posições livres passam também a respeitar a área física dos bastidores.
- Verificação: 241 testes, 14 percursos Chromium e 26 casos de avaliação determinística aprovados. No browser a 390 px foram verificadas criação, gravação, revisão, repetição sem alterações e recuperação do projeto anterior sem Ollama.


## Reparação, endereçamento e planos por etapas — 30 de outubro de 2026

- Reparação de ligações: reutiliza canais de patch panel já ligados ao switch, usa portas livres na sala e preserva cabos confirmados/propostas. Relata percursos que permanecem incompletos; não cria equipamento.
- Endereçamento local em lote: sub-rede e gateway explícitos, reserva de rede/broadcast/gateways/IPs ocupados no mesmo domínio, preservação de endereços válidos e recusa atómica de conflitos ou falta de capacidade. Valores não são enviados ao modelo.
- Plano de filial por etapas: valida todos os passos antes de iniciar, distribui os postos por departamentos e grava cada etapa. Exemplo de 2 pisos/3 departamentos/40 postos executado em 5 etapas, com impressora e bastidor por departamento.
- Controlos para pausar, retomar, desfazer a última etapa e terminar. Retoma após recarregar no mesmo separador; guarda apenas parâmetros/referências e uma impressão digital do projeto em sessionStorage, sem cópias do inventário.
- Gravações pendentes são repetidas sem recriar a etapa. Mudanças externas, conflitos e divergências no histórico pausam o plano, preservando os dados existentes.
- Criação de salas aceita posições explícitas validadas, permitindo distribuir salas no edifício sem depender da colocação automática no centro.
- Verificação: 253 testes unitários/API/runtime, 16 percursos Chromium e 29 casos de avaliação determinística aprovados. Os dois percursos novos foram repetidos após os ajustes finais: reparação/endereçamento/desfazer e pausa/recarregamento/retoma/desfazer da filial.
- As funcionalidades operam no browser e na persistência normal do Atlas, sem depender de Ollama para os pedidos suportados. Não foi realizado fine-tuning nem avaliada nova inferência do Qwen3 nesta fase.

## Domínios, contas, entidades e consolidação — 31 de outubro de 2026

- VLANs conservam IDs numéricos e recebem planos próprios por domínio, com sub-rede e gateway independentes. Domínios sem plano próprio herdam os valores gerais; projetos antigos mantêm o comportamento. Fichas, auditoria documental, endereçamento do assistente, dossier e legendas por piso consultam o plano correto.
- Contas no servidor Node local: primeira conta em `/account`, gestão de utilizadores na mesma organização, papéis administrador/editor/leitor, palavras-passe derivadas com scrypt e sessões HttpOnly/SameSite com duração de oito horas. Contas/roles são relidos em cada pedido; alteração de palavra-passe e remoção invalidam sessões. A organização default conserva o projeto local existente.
- Escritas recusadas no servidor para leitores. Cabeçalhos de identidade enviados pelo cliente são ignorados no arranque local. Auditoria regista o autor autenticado, mantendo isolamento por organização. SSO e permissões por unidade continuam pendentes; a gestão de contas não altera a identidade do alojamento Sites.
- Migrações 0005/0006 preservam documentos, histórico e auditoria anteriores. Metadados e entidades passam a ser o armazenamento ativo; os documentos antigos ficam como backup de migração. Gravações PATCH enviam diferenças; só entidades alteradas são atualizadas. Revisão, dados e eventos são atómicos e falhas revertem a transação. O adaptador SQLite executa o lote sincronamente, impedindo transações sobrepostas.
- Nova consulta em `/inventory.html`: pesquisa paginada, filtro de piso e planta com carregamento dos equipamentos desse piso. Cursor vinculado à revisão deteta alterações entre páginas. Manifest não inclui o inventário completo; plantas não representam extremos exteriores ao piso.
- Limites: 10 000 equipamentos, 30 000 ligações, 2 000 bastidores; pedidos JSON até 20 MB e backups cifrados até 28 MB. Lotes CSV continuam a 200 linhas. Editor completo, validação e snapshots históricos continuam a trabalhar com o projeto completo em memória.
- Ensaios sintéticos reproduzíveis em `npm run bench:inventory`, com 1 000/5 000/10 000 equipamentos. No ensaio registado, uma alteração enviou 268 bytes nos três volumes; uma página de 100 equipamentos recebeu cerca de 18 KB. Medições em SQLite em memória, sem simulação de utilizadores simultâneos ou desempenho de renderização/D1.
- Cobertura nova: planos de VLAN independentes, login/gestão/revogação/expiração, migração de documentos antigos, paginação e isolamento, gravações concorrentes, reversão de falhas e retoma de etapas pendentes do assistente após interrupção/conflito.
- Validação: 267 testes unitários/API/runtime aprovados, 19 percursos Chromium aprovados, com repetição dos três percursos de contas/VLAN/inventário após os ajustes finais. Avaliação determinística: 29 casos aprovados. `db:generate` não deteta diferenças no schema. Sem nova inferência Qwen3 e sem deploy externo.
- Não foram criadas credenciais na instalação do utilizador: o administrador escolhe-as em Ativar contas. Os testes usam apenas pastas e contas temporárias.
