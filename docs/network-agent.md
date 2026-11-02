# Agente de configuração e cablagem

O assistente existente passa a ter ferramentas de interfaces, ligação de cabos e verificação. Usa os mesmos validadores, permissões, gravação e histórico do editor. Não houve treino dos pesos do modelo: foram acrescentadas ferramentas, interpretação local, instruções e testes.

## Experimentar

Selecione o equipamento no mapa ou na pesquisa, abra **Falar com a IA → Configurar por mim** e use, por exemplo:

- `Liga o equipamento selecionado à rede usando a tomada mais próxima.`
- `Liga o equipamento selecionado à tomada mais próxima com Cat 6A.` — só o cabo terminal; não pede completar o percurso.
- `Configura a porta "Gi1/0/1" do equipamento selecionado como access na VLAN 30.`
- `Configura a porta "Gi1/0/24" do equipamento selecionado como trunk com VLANs 10, 20, 30 e VLAN nativa 10.`
- `Define as velocidades suportadas da porta "Gi1/0/1" do equipamento selecionado como 100, 1000 Mbps.`
- `Define a capacidade máxima da porta "Gi1/0/1" do equipamento selecionado como 1000 Mbps.`
- `Configura a porta "Gi1/0/1" do equipamento selecionado para 100 Mbps em full duplex.`
- `Desativa a porta "Gi1/0/1" do equipamento selecionado.`
- `Define o meio da porta "Gi1/0/1" do equipamento selecionado como cobre.`
- `Configura a porta "Gi1/0/1" do equipamento selecionado com PoE PSE de 30 W.`
- `Liga a porta "Ethernet1" de "POSTO-01" à porta "F1" de "TOMADA-DUPLA-A" com RJ45 Cat 6A.`
- `Verifica as ligações do equipamento selecionado.`
- `Porque é que este PC não tem rede?`
- `Porque "POSTO-01" não tem Internet?`
- `Diagnostica o equipamento selecionado.`

Separe vários comandos por ponto e vírgula. O lote é validado em conjunto; um passo inválido impede aplicar os restantes. A verificação isolada também funciona em **Só conversar** e não grava alterações. Nomes dos exemplos pertencem ao projeto fictício; adapte-os e use dados confirmados.

## Como executa

1. Consulta os dados atuais e prepara referências anónimas, incluindo as configurações de portas explicitamente documentadas.
2. Interpreta comandos conhecidos localmente. Pedidos menos diretos podem usar o modelo para escolher ferramentas estruturadas.
3. Simula o plano numa cópia do projeto e valida portas, canais, VLANs, permissões de alteração do mapa e restrições do pedido.
4. Verifica os cabos esperados e o estado final das interfaces antes de aplicar. Alterações sucessivas da mesma interface verificam o estado combinado final.
5. Aplica pelo editor, verifica novamente, guarda e mantém a opção de desfazer. O relatório do agente mostra verificações e observações, sem apresentar dados desconhecidos como medições.

O projeto tem de continuar a corresponder ao estado usado para preparar o plano. Conflitos de gravação continuam sujeitos ao mecanismo existente de revisão. Um plano rejeitado não é aplicado parcialmente.

## Diagnóstico explicado

As perguntas de diagnóstico são resolvidas localmente e sem alterações, tanto em **Só conversar** como em **Configurar por mim**. Também pode indicar um nome exato e único entre aspas. Se faltar seleção ou o nome for ambíguo, o agente pede a identificação em vez de adivinhar.

O relatório distingue incompatibilidades registadas, falta de documentação e dados por confirmar. Segue apenas os canais F/R correspondentes e o uplink definido de um mini-switch, sem atravessar portas de outros clientes. Mostra evidência e próximo passo para cada observação e permite abrir o equipamento ou cabo envolvido.

A primeira versão identifica cabos por registar, canais incompletos, uplinks em falta, shutdown, incompatibilidades de meio/velocidade/duplex/VLAN/PoE, comprimentos e endereços fora da sub-rede da unidade. Quando o percurso está completo e não há bloqueios conhecidos, orienta a confirmação local de ligação, endereço, gateway, DNS, rotas e firewall. Não executa testes de rede nem efetua reparações.

## Ferramentas

- `connect_nearest_outlet`: escolhe a saída compatível mais próxima na mesma sala, pela posição guardada. Reutiliza o cabo do posto, a cablagem horizontal e o patch existentes. Para completar o percurso, procura material existente com portas livres; não cria equipamentos, não remove ligações e não inventa adaptadores. Empates favorecem canais já documentados. Repetir um percurso completo não duplica cabos.
- `connect_cable`: cria um cabo nas duas portas anónimas escolhidas. A variante local aceita os nomes literais indicados pelo utilizador. Cabos propostos também reservam portas.
- `configure_port`: permite ao modelo referir portas e VLANs conhecidas para access/trunk e estado administrativo explicitamente pedido. Velocidades, meio e potência literais são interpretados localmente e protegidos contra substituição pela resposta do modelo.
- `diagnose_network`: explica evidências e próximos passos para um equipamento, sem alterar o projeto.
- `verify_network`: consulta circuitos relacionados, interfaces, VLANs e PoE, sem alterar o projeto.

As ferramentas são chamadas estruturadas sobre o projeto, não comandos de shell nem acesso direto a hardware. O servidor de inferência continua sem acesso à base de dados, ficheiros ou credenciais. O modelo recebe referências e capacidades documentadas; nomes, IPs e dados pessoais seguem o filtro existente. Para tarefas pela tomada mais próxima, o contexto enviado ao modelo fica limitado ao alvo: a ferramenta consulta o resto localmente.

## Exemplos revistos e avaliação

`docs/agent-examples.json` contém pedidos sintéticos com ações e resultados esperados, incluindo recusas. Servem como especificação e avaliação; não são conversas privadas nem um modelo treinado.

Execute `npm run eval:agent` para avaliar os exemplos em memória. O resultado fica em `docs/agent-evaluation.json`; pode mudar o destino com `ATLAS_AGENT_EVAL_OUTPUT`. Para uma avaliação adicional da escolha de ferramenta pelo Ollama, use `npm run eval:agent -- --with-model`. Essa inferência pode demorar e tem limite de dois minutos; falha não autoriza alterações ao projeto real.

Para melhorar o agente, acrescente exemplos revistos de falhas reais sem dados privados, mantenha casos de avaliação separados dos exemplos eventualmente usados num futuro treino, e teste o resultado completo. Conversar com a IA não altera automaticamente o modelo nem acrescenta exemplos aprovados.

## Limites

O percurso até ao switch é documental. Não prova DHCP, DNS, routing, firewall, Internet, negociação ótica ou tráfego real. Categorias e curvas não certificam cablagem; capacidades por confirmar continuam desconhecidas. A ferramenta não cria interfaces nem ativa portas desativadas para fazer um pedido caber. A configuração literal pode documentar shutdown, mas uma ligação automática à rede exige interfaces ativas e um percurso sem incompatibilidades conhecidas.

A retoma existente continua destinada aos planos de filial. O relatório de um lote genérico não é ainda uma tarefa persistente com retoma. As próximas propostas estão em `docs/agent-roadmap.md`.
