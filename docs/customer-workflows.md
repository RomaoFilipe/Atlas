# Percursos para equipas e clientes

A página inicial é **Hoje** (`/` ou `/home.html`). O editor completo mantém-se em
`/editor.html`; os QR existentes abertos na raiz passam a apresentar a ficha de
trabalho no terreno. O namespace do projeto e a porta da etiqueta continuam a
ser verificados. Depois do login, um QR regressa à ficha pedida.

## O trabalho de hoje

A página inicial reúne equipamentos, revisões a 30 dias, pendências documentais
e pedidos por concluir. O filtro de unidade aplica-se aos indicadores e aos
pedidos. Os pedidos ativos são ordenados por prioridade e prazo. Cada pendência
de equipamento abre a respetiva ficha; o utilizador pode registar trabalho ou
comunicar um problema. Os indicadores refletem os registos existentes, não o
estado medido da instalação.

## Preparação guiada de salas

Em **Preparar sala**, selecione uma sala existente, 1–30 pessoas e as necessidades
(impressora, tomadas, bastidor e ligações). A proposta reutiliza o material já
registado e respeita capacidade e posições protegidas. Gerar a proposta não grava
nada. **Aplicar e guardar** executa uma gravação com revisão e conserva o estado
anterior no histórico. Repetir a preparação não duplica os registos.

IPs, VLANs e ligação à Internet não são inventados; a revisão apresenta esses
pontos pendentes. O formulário utiliza as ações locais validadas, sem Ollama.
Se outra sessão alterar o projeto, prepare uma nova proposta antes de aplicar.

## Contas e acesso por unidade

Em `/account`, o administrador escolhe a conta, papel e acesso a toda a
organização ou apenas a unidades selecionadas. Uma seleção vazia concede zero
unidades. Administradores têm acesso à organização inteira. Unidades são
identificadas por `país/código`, por exemplo `PT/LIS`; edifícios sem classificação
usam `site:ID`. Uma alteração da classificação pode retirar o acesso de uma
conta; reveja as atribuições ao reorganizar unidades.

Os acessos são lidos em cada pedido, incluindo sessões já abertas. O servidor
filtra projeto, inventário, plantas, redes e ficheiros. Ligações entre uma unidade
autorizada e outra excluída são omitidas da vista limitada. Os editores limitados
podem alterar pisos, salas, bastidores, equipamentos e ligações dentro das suas
unidades; metadados da organização, edifícios, planos de VLAN e modelos globais
são geridos pelas contas com acesso completo. Identificadores e ficheiros de
outras unidades não podem ser reutilizados para contornar o âmbito.

Versões, histórico completo e importação/exportação cifrada ficam indisponíveis
para contas limitadas, pois podem conter dados de outras unidades. Podem gerar
relatórios de entrega com os registos autorizados. A auditoria de entidades
existentes é filtrada; eventos com referências fora do âmbito são omitidos.
As contas e concessões por unidade pertencem ao servidor Node local; SSO e
provisionamento de memberships no alojamento continuam fora desta versão.

## Portal do cliente

Em **Unidades** (`/portal.html`), o cliente vê os seus locais, escolhe um piso e
consulta planta, equipamentos e fichas. Pode abrir o inventário, gerar um
relatório ou comunicar um problema da unidade. Os leitores não alteram a
configuração da rede nem as intervenções; podem criar pedidos de assistência.
Não são criadas contas nem ligações públicas de partilha automaticamente.

## Pedidos e tarefas

**Pedidos e tarefas** (`/tasks.html`) associa cada pedido a um edifício e,
opcionalmente, a um equipamento. Regista título, descrição e prioridade. O cliente
pode comunicar o problema; o técnico atribui um responsável com acesso à unidade,
um prazo e o estado: aberto, em curso, a aguardar ou resolvido.

Resolver exige uma descrição da resolução. Revisões impedem que duas atualizações
se sobreponham. O histórico de alterações tem autor, data e diferenças, gravados
na mesma transação; os eventos recusam UPDATE/DELETE. Os pedidos conservam-se
separadamente do documento do projeto, pelo que recuperar uma versão do projeto
não apaga o trabalho da assistência. Não há envio de emails, mensagens externas
nem notificações push. Se um edifício for eliminado, os seus pedidos deixam de
surgir nas consultas até que essa localização seja recuperada.

## Trabalho no terreno

A ficha móvel (`/field.html?equipment=ID`) apresenta localização, endereçamento,
anexos e intervenções. Os técnicos podem registar trabalho, resultado, estado,
próxima revisão e fotografia; a autoria vem da sessão autenticada. Fotografias
aceitam PNG/JPEG/WebP até 5 MB, dentro do limite de 20 anexos por equipamento.

O rascunho textual fica em sessionStorage, separado por conta, organização,
projeto e equipamento. Uma fotografia só pode ser retomada depois de carregada;
um ficheiro apenas selecionado precisa de ser selecionado novamente após
recarregar. Isto não é edição offline: guardar e carregar fotografias exige rede.

A gravação lê a revisão atual, conserva campos não alterados e deteta mudanças
concorrentes nos campos editados. Uma intervenção com o mesmo ID é reconhecida
após perda da resposta, evitando repetições. Conflitos conservam o rascunho para
revisão. Os limites e validações da ficha normal mantêm-se.

## Revisão de conflitos no editor

Quando uma gravação encontra outra revisão, o editor mostra **Rever e combinar
alterações**. Compara a base guardada, o rascunho local e o estado atual do
servidor. Campos diferentes podem ser combinados; o mesmo campo alterado nas
duas sessões exige escolher a versão local ou guardada. Eliminação versus edição
também exige escolha. Se as relações entre entidades impedirem uma combinação
válida, é necessário escolher explicitamente um dos estados completos.

A combinação é validada antes de entrar no editor e continua protegida pela
revisão do servidor. Uma nova alteração remota exige nova revisão. Um erro de
rede conserva a combinação e o rascunho; não é uma fusão automática de sessões.

## Relatório de entrega

Em **Relatório de entrega** (`/delivery.html`), escolha a unidade e personalize
título, prestador, cliente, contacto, notas e logótipo raster até 1 MB. Pode incluir
plantas, inventário, manutenção e pendências/pedidos. A pré-visualização contém
apenas a unidade selecionada e os dados autorizados.

As imagens das plantas e o logótipo são incorporados no HTML, permitindo entregar
um ficheiro autónomo. **Imprimir / guardar PDF** usa a impressão do navegador;
**Descarregar HTML** guarda o relatório legível. O relatório não certifica o estado
real da rede. Não se gera um PDF automaticamente no servidor.

## Validação com utilizadores

Os percursos são cobertos por testes de browser em desktop e a 390 px. Isto não
substitui observação de pessoas reais. O protocolo de três participantes está em
[usability-study.md](usability-study.md); as sessões humanas ainda não foram realizadas.
