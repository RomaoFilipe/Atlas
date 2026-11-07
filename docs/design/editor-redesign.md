# Editor Atlas — novo espaço de trabalho

O editor em `/editor.html` segue a proposta escura aprovada: grafite, verde-lima,
ciano, ferramentas junto à planta e ficha lateral. Usa os dados e controlos reais
do editor. Nenhuma imagem de interface ou equipamento substitui o mapa funcional.

## Organização

- A barra superior mantém pesquisa, estado de gravação, exportação e conta.
- A navegação lateral agrupa áreas, edifícios, pisos, salas, redes e permissões.
- O guia de configuração fica compacto na barra lateral, com progresso calculado
  a partir do projeto. Abre as mesmas seis etapas e os formulários existentes.
- O estado vazio abre diretamente a criação do primeiro edifício. Exemplos só são
  abertos por ação explícita; não são colocados nos projetos novos.
- Planta 2D, Campus 3D e Bastidor têm acesso direto. As redes continuam em Mais
  vistas e no menu de ferramentas. Os controlos existentes são movidos, mantendo
  os seus eventos e verificações.
- Selecionar, mover, ligar, adicionar, camadas e histórico ficam junto à planta.
- Biblioteca, seleção em grupo, bloqueios, posição, rotação e outras ferramentas
  ficam em menus. Portas do piso e operações da sala mantêm acesso por expansores.
- O inventário também aparece como painel inferior do mapa e pode ser recolhido.

## Equipamentos e ligações

Os desenhos SVG dos equipamentos têm mais detalhe e conservam as coordenadas,
rotação, quantidade de monitores e dimensões físicas registadas. A seleção usa
uma moldura sobre o footprint real, sem mover equipamentos para caberem etiquetas.
O enquadramento considera o edifício/sala e fundos de planta importados.

A ficha apresenta localização, IP, VLAN, portas e alimentação documentadas. Os
controlos das portas abrem os formulários existentes ou participam na ligação
manual quando uma ferramenta de cabo está ativa. A visualização do percurso segue
a ligação de um equipamento, respeita os canais F/R dos elementos passivos e pára
no próximo equipamento ativo; percursos incompletos são identificados.

As cores escuras são aplicadas ao SVG no ecrã por `editor.css`. Os ficheiros de
planta gerados para exportação mantêm o tema de papel e os respetivos metadados.
A apresentação no ecrã esconde os metadados de impressão. Movimentos de cabos
selecionados e transições respeitam `prefers-reduced-motion`.

## Implementação

`editor-design.js` adapta a apresentação no ciclo de renderização do layout;
`editor.css` está limitado ao editor. As alterações do projeto continuam a passar
pelos mecanismos existentes de validação, gravação, permissões e desfazer/refazer.
Em ecrãs pequenos, navegação e ficha abrem como painéis laterais, e o mapa pode
ser navegado e ampliado com os controlos existentes.

## Validação

349 testes do projeto e 29 testes de browser passaram, incluindo gravação,
permissões, registo/login, edição de interfaces, cablagem manual, desfazer/refazer,
bastidores 3D, diagnóstico e acessibilidade em ecrãs pequenos. A inspeção na conta
local de verificação confirmou que o projeto vazio permaneceu com revisão zero;
navegar e usar a nova apresentação não cria dados no projeto.

## Campo 3D — melhoria de 5 de novembro de 2026

A vista mantém a geometria e a organização técnica existentes. O estilo Melhorado acrescenta enquadramento adaptado às dimensões e ao ecrã, iluminação ACES com sombras suaves, cadeiras curvas, ecrãs procedurais, superfícies mais escuras e legendas de sala discretas. As transições de câmara e o fluxo animado continuam ativos. Não altera posições, tomadas, ligações ou dados do projeto.

Em Campus 3D, **Estilo 3D → Clássico** recupera os materiais, modelos e enquadramento anteriores. A preferência é local ao navegador. O estilo também se aplica ao bastidor.

Backup anterior às alterações: `/home/romao/Atlas-backups/before-3d-20261105T161536Z/atlas-before-3d.tar.gz`. O diretório contém manifesto SHA256 e instruções de reposição. Para recuperar o código, extrair para uma pasta separada e copiar os ficheiros visuais indicados no manifesto; preservar a base de dados atual. O backup inclui a base de dados existente no momento da cópia e tem acesso restrito.

Comparação visual: `output/design/3d-antes.png`, `3d-melhorado.png` e `3d-classico.png`.

### Pré-visualização dos equipamentos

O painel de seleção utiliza uma cena 3D interativa reutilizada entre seleções (um único contexto WebGL adicional). Mostra o modelo real e as portas sem alterar o projeto. Arrastar para rodar, roda para aproximar e botão Enquadrar para recentrar. O retrato vetorial mantém-se disponível quando WebGL está indisponível.

As caixas do estilo Melhorado têm cantos suaves que preservam as dimensões originais, frentes escuras, grelhas e detalhes USB. As tomadas interativas não são deformadas nem deslocadas. O destaque da seleção acompanha os contornos das caixas. O modo Clássico conserva a geometria anterior.

Backup anterior a esta etapa: `/home/romao/Atlas-backups/before-equipment-view-20261105T195731/equipment-view.tar.gz` (quatro ficheiros visuais, sem base de dados).
