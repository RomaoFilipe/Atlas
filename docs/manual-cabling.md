# Ligar cabos no mapa

A barra **Cabos** está no mapa, antes dos controlos do bastidor, com o tema existente. Oferece RJ45 Cat 5e, Cat 6 e Cat 6A, fibra OS2 e OM3, e alimentação.

1. Escolha um tipo de cabo.
2. Clique numa porta na planta ou no modelo 3D. Também pode clicar no equipamento e escolher a porta na barra; a pesquisa global permite mudar de equipamento e de vista sem perder a primeira ponta.
3. Clique na segunda porta. Esta ação cria o cabo, guarda automaticamente e mantém a ferramenta preparada para o seguinte. A planta mostra a pré-visualização enquanto escolhe o destino.
4. Use **Terminar**, **Esc** ou **Recomeçar ligação** para abandonar uma ligação incompleta. Use **Anular** para desfazer um cabo criado.

Portas ocupadas continuam identificadas e dão um aviso, sem retirar cabos existentes. Meio físico incompatível, origem/destino iguais ou alimentação sem saída OUT e entrada PSU/IN impedem a criação. A disponibilidade das duas portas é novamente verificada no momento de guardar. Interfaces em shutdown podem receber um cabo físico: a ferramenta avisa e o diagnóstico continua a indicar que a comunicação está bloqueada.

Nas tomadas e painéis, F1 ↔ R1 e F2 ↔ R2 são canais independentes. Para documentar um percurso completo, ligue **PC → F da tomada**, **R da tomada → R do painel**, **F do painel → switch**. Só os dois últimos lados traseiros são classificados automaticamente como ligação permanente. A ferramenta cria um cabo de cada vez; a alimentação não é confundida com uma ligação de dados.

As linhas e pequenas fichas na planta usam as posições das portas e acompanham movimento, rotação e dimensões do posto. Na vista 3D, os cabos entre portas representadas têm volume e fichas; os elementos simplificados mantêm linhas leves. A traseira das tomadas recebe a continuação da cablagem. As curvas visuais não são medições: o comprimento continua por medir até ser registado.

Escolher uma categoria não configura nem mede a velocidade. O campo de velocidade dos novos cabos de dados fica vazio; o diagnóstico usa as capacidades explicitamente documentadas nas interfaces. Fibra ainda exige confirmação de óticas e conectores; alimentação exige confirmar a ficha real. A ferramenta não certifica a instalação.

## Correção do assistente

O pedido «Prepara esta sala para um pequeno escritório: insere dois postos de trabalho e uma impressora, sem telefones nem tomadas novas» é agora reconhecido integralmente por um comando local validado. Gera `equip_room` com `workstations: 2` e `printers: 1`, sem inserir outros tipos e sem esperar pelo Ollama.

A falha anterior resultou de o modelo escolher `prepare_office`, que cria computadores genéricos, em vez de postos de trabalho. A validação de intenção rejeita essa substituição quando o pedido especifica «posto de trabalho». Frases desconhecidas ou com instruções adicionais não são parcialmente executadas pelo novo reconhecimento local.

A avaliação repetida passou em cerca de 1 ms para o comando local. Uma avaliação separada de inferência real (`model-build-spaces`) passou com `qwen3:14b` em cerca de 40 s; isso confirma esse cenário, não perfeição nem baixa latência em todos os pedidos. As avaliações usam projetos sintéticos em memória e não alteram a instalação do utilizador.
