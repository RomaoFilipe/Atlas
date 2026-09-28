# Atlas — editor de infraestrutura de rede

Projeto documental em português, com campus 3D, bastidores, planta 2D, VLANs, endereçamento e máquinas virtuais. Um clique seleciona o bastidor. O arrasto move a posição quando desbloqueada; o botão «Ver interior 3D» abre o interior.

## Oficina

- **Cabos:** ligação entre portas na frente/traseira do equipamento, identificação, cores, categoria, comprimento documentado, VLANs e notas. «Percurso» permite marcar até 50 pontos na planta 2D. Painéis e tomadas usam canais independentes F1–R1, F2–R2, etc.
- **Pisos e plantas:** criar pisos e salas, atribuir localizações, importar PNG/JPEG/WebP até 5 MB, calibrar a escala com dois pontos e uma distância. Filtrar por piso e sala.
- **Montagem:** arrastar para uma unidade U ou entre bastidores, com verificação de sobreposição e capacidade. No interior 3D, escolher «Mover equipamento em U». Frente/traseira inclui conectores de dados e alimentação.
- **Modelos:** guardar edifícios ou bastidores e criar cópias com equipamentos e ligações internas. IPs e gateways dos equipamentos copiados ficam vazios para evitar duplicados.
- **Verificar:** detetar equipamentos sem ligação, IPs/gateways fora da sub-rede, VLANs inconsistentes, portas não documentadas e elevada ocupação.
- **Simular:** desativar equipamentos/cabos e identificar perda de percurso até um destino. Simulação de conectividade documental, sem emulação de protocolos, ACLs ou falhas elétricas.
- **Versões:** guardar até 200 marcos nomeados por utilizador, comparar com o estado atual ou outra versão, exportar e restaurar. A restauração guarda previamente uma cópia de segurança.
- **Dossier:** HTML autónomo com plantas, pisos, inventário, redes, ocupação U, mapa de portas e verificações; impressão/PDF e CSV. A planta 2D também exporta SVG e PNG.

## Persistência e execução

Worker ESM, identidade de sessão confiada ao cabeçalho da plataforma, projeto e versões em D1 (`DB`), imagens em R2 (`ATLAS_ASSETS`) com chaves isoladas por utilizador. Migrações Drizzle incrementais em `drizzle/`. O projeto mantém compatibilidade com os documentos version 3 existentes. Não envia comandos a equipamentos reais.

```sh
npm ci
npm run build
node --test tests/*.test.mjs
```

Os testes cobrem validação, bloqueio e posição de bastidores, canais passivos, impacto de falhas, montagem em U, modelos, diferenças de versões, conflitos de gravação e isolamento de projetos/versões/imagens entre utilizadores.

## Exemplos e edição visual

O botão **Exemplos** oferece escritório completo, edifício com dois pisos e falhas/redundância. Cada cenário tem passos guiados e descarga JSON. Abrir um cenário guarda primeiro o projeto atual numa versão nomeada; se a cópia não puder ser guardada, o projeto não é substituído.

No mapa, escolha **Navegar**, **Mover objetos** ou **Ligar equipamentos**. No último modo, clique na origem e no destino: o formulário sugere interfaces livres e indica as ocupadas. **Ampliar mapa** ocupa a janela; Escape reduz a vista. A planta 2D aproxima com a roda do rato e mantém a escala durante o arrasto; **Enquadrar** recalcula os limites. Os bastidores bloqueados mantêm a posição. Arrastos cancelados não gravam alterações.

**+ Posto de trabalho** cria uma secretária com cadeira, computador e um/dois monitores, orientação e características técnicas. O formulário adapta os campos ao tipo: PCs não pedem quantidade de portas nem unidades U; painéis mostram canais, PDUs saídas, VMs anfitrião/recursos e os restantes equipamentos características próprias. Os modelos 3D distinguem portáteis, PCs, impressoras, câmaras, tomadas, postos de trabalho e equipamentos de bastidor.

## Réguas de tomadas (PDU)

Em **PDU / Energia**, adicione uma régua ao bastidor, configure a quantidade de tomadas, a origem/circuito e o tipo de conector. Cada saída OUT1, OUT2, etc. aparece numerada e pode ter uma etiqueta. Clique numa saída livre para escolher equipamento e fonte (PSU1/PSU2); as entradas ocupadas não são oferecidas. A lista permite editar, seguir ou desligar o cabo no modelo. **Ver traseira 3D** mostra as tomadas e respetiva numeração. O dossier inclui o mapa de alimentação por régua, incluindo saídas livres. O exemplo de escritório contém PDU-A ligada à UPS, ao servidor, ao switch e à firewall. A representação é documental, sem medição de consumo ou comando de tomadas reais.

### Assistente de cablagem
Em **Cabos → Assistente de cablagem**, escolha computador/posto/portátil e switch, depois tomada e patch panel. O assistente sugere interfaces livres e ordena os equipamentos intermédios pela localização. Os canais F/R têm de estar ambos livres. A revisão apresenta os três segmentos, categoria e VLAN documentada do posto. A confirmação cria todos os cabos numa única alteração anulável e destaca o percurso no mapa. Revalida o estado antes de guardar; não modifica ligações existentes nem configura hardware real. Comprimentos ficam por definir e podem ser editados nos cabos.

### Postos, circuitos e planta 2D
- **Pesquisar posto** consulta nomes, códigos, IP e características; a ficha reúne periféricos documentados, rede e alimentação. Os campos telefone/extensão, monitores e tomada elétrica são editáveis no equipamento; dados em falta aparecem como não documentados.
- **Onde vai dar este cabo?** e os botões por porta seguem canais passivos F/R até às extremidades ativas, sem misturar os outros canais do painel ou representar encaminhamento IP. O percurso pode ser destacado na planta, com enquadramento automático e contexto esbatido.
- A planta abre em navegação, tem maior área útil, camadas independentes de energia, etiquetas e grelha, cabos com área de clique ampliada e comandos para enquadrar o mapa ou centrar a seleção. Os documentos SVG/PNG continuam a incluir legenda e carimbo completos.

### Organização do espaço de trabalho
Navegação e ferramentas agrupadas à esquerda (Estrutura, Ligações e energia, Análise e documentação), mapa central e seleção à direita. Os painéis podem ser recolhidos; em ecrãs pequenos abrem como painéis laterais. O menu **Adicionar** concentra criação de objetos e postos; **Projeto** reúne guardar/importar/exportar/novo. O estado de gravação permanece junto ao título do mapa. A lista do inventário é expansível e abre ao pesquisar. As ligações e portas da seleção ficam em secções expansíveis. O mapa inicia em navegação, com uma única barra de vistas e comandos de anular/refazer compactos e identificados.

### Acabamento dos bastidores e planta
Os bastidores mostram painéis laterais, calhas, pés, porta perfurada e régua numerada em U. Em **Bastidor 3D**, o botão **Abrir / Fechar porta** acompanha a face selecionada; a inspeção começa com a porta aberta. Servidores e armazenamento têm gavetas, UPS apresenta visor, e switch, firewall, patch panel e PDU têm frentes distintas. As portas interativas continuam a corresponder às interfaces configuradas; o equipamento é ilustrativo.
A planta inclui símbolos próprios por tipo, preenchimento discreto das salas, títulos de edifícios acima do contorno e etiquetas distribuídas para evitar outras etiquetas e títulos. Linhas finas ligam cada etiqueta deslocada à posição real do objeto. A exportação mantém os mesmos símbolos e a legenda.

### Backups cifrados
**Projeto → Exportar cifrado** descarrega `.atlasenc` (AES-256-GCM), que **Importar projeto** abre na mesma conta do Atlas. Exportações de versões e recuperação de rascunhos também usam este formato. A chave é um segredo de execução do servidor; a aplicação bloqueia a exportação se ele não estiver disponível. PDFs, imagens, CSV e HTML exigem confirmação de que são ficheiros legíveis. JSON antigo ainda pode ser importado mediante aviso. Consulte `docs/export-security.md` para modelo de proteção, configuração, rotação, limites e recuperação. Os ficheiros dependem da preservação da chave original e da conta/Site.

### Planta organizada e PDF completo
**Planta 2D → Blocos organizados** apresenta edifícios separados e pisos selecionáveis. Cada piso agrupa bastidores e equipamentos por sala, com identificação, IP/VLAN, extensão telefónica e U quando aplicável. Os blocos crescem com o inventário sem alterar coordenadas do projeto. **Posições / planta** mantém a edição espacial e fundos importados; o modo Mover e os percursos destacados usam esta vista.
**PDF · todos os pisos** ignora os filtros atuais: imprime uma visão geral e uma folha por piso, agrupadas por edifício e ordenadas pelo nível, com título e paginação. O mesmo conjunto é incluído no dossier. Plantas importadas mantêm o respetivo fundo. A gravação em PDF usa a opção Guardar como PDF do navegador; a confirmação de exportação legível mantém-se.

### Leitura da planta por piso
A vista espacial já não sobrepõe pisos: sem piso selecionado apresenta o navegador de edifícios; **Planta do piso** abre o piso do objeto selecionado, ou o primeiro disponível. As etiquetas são distribuídas em células dentro da sala quando existe capacidade, mantendo as coordenadas originais; apenas a seleção mostra a linha até à posição documentada. **Ligações: Da seleção** é o modo inicial, com opções explícitas para mostrar todas as ligações do piso ou ocultá-las. As camadas secundárias ficam num menu recolhível. Percursos que atravessam pisos usam um diagrama separado por localização, apenas com as extremidades e cabos selecionados. Os PDFs continuam a incluir todos os pisos.
