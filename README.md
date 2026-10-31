<div align="center">

Atualização de 31/10/2026: página inicial Hoje, portal do cliente com permissões
por unidade no servidor local, preparação guiada de salas, pedidos e tarefas,
ficha móvel com fotografia/intervenção, revisão de conflitos e relatório de
entrega personalizado. Percursos e limites: [Guia para equipas e clientes](docs/customer-workflows.md).
O editor completo está em `/editor.html`; a raiz abre a página Hoje.
VLANs por domínio, armazenamento por entidade e inventário paginado mantêm-se.
A configuração de contas é feita em `/account`. SSO continua pendente.


# ATLAS

### See your infrastructure. Understand every connection.
### Visualiza a tua infraestrutura. Compreende cada ligação.

**2D floor plans · 3D racks · Network inventory · Cable tracing · Technical documentation**

**Plantas 2D · Bastidores 3D · Inventário de rede · Percursos de cabos · Documentação técnica**

[🇬🇧 English](#english) · [🇵🇹 Português](#portugues) · [Application / Aplicação](https://atlas-rede-3d.romaofilipe.chatgpt.site) · [Issues](https://github.com/RomaoFilipe/Atlas/issues)

![JavaScript](https://img.shields.io/badge/JavaScript-ES_Modules-F7DF1E?logo=javascript&logoColor=black)
![Three.js](https://img.shields.io/badge/3D-Three.js-000000?logo=threedotjs&logoColor=white)
![Runtime](https://img.shields.io/badge/Runtime-Worker_ESM-2563EB)
![Storage](https://img.shields.io/badge/Storage-D1_%2B_R2-0F766E)

</div>

---

## Circuitos entre filiais e etiquetas QR

Em **Ligações entre locais**, documente operador, referência, capacidade e circuitos
alternativos, e consulte o diagrama entre edifícios. Em **Equipamentos → Etiquetas
QR**, prepare etiquetas A4 por equipamento ou por saída da tomada. A leitura abre
a ficha e confirma que pertence ao projeto correto.

Consulte o [guia de circuitos WAN e etiquetas](docs/wan-labels.md).

## Inventário em lote e pendências

Em **Equipamentos → Importar Excel / CSV**, carregue inventário com localização,
IP, VLAN, número de série e responsável. O lote é validado e revisto antes de
aplicar; erros impedem a importação parcial. Pode indicar bastidor e unidades U.

Em **Pendências e capacidade**, filtre por país ou unidade para consultar garantias,
responsáveis por atribuir, ligações por documentar e capacidade registada dos
switches e bastidores. Os itens abrem o formulário ou ficha correspondentes.

Consulte o [guia de importação e pendências](docs/equipment-import.md).

## Empresa e filiais internacionais

Abra **Empresa e unidades** para configurar uma filial por formulário simples ou
criar várias a partir de Excel / CSV, com revisão antes de aplicar. A navegação
agrupa países, unidades, edifícios, pisos e salas. Cada unidade pode ter cidade,
fuso, responsável e domínio de endereçamento próprios. Perfis de escritório,
armazém ou datacenter preparam os espaços sem inventar equipamentos.

Consulte [configuração empresarial e limites atuais](docs/organization.md).
O modo local continua a usar um projeto partilhado sem permissões por equipa.

## Planta técnica de rede

Na planta do piso, pode consultar as ligações de dados. A biblioteca
permite colocar equipamentos nas salas. As tomadas apresentam as portas F1/F2:
clique para criar uma ligação numa saída livre ou consultar o cabo de uma saída ocupada.
O painel abaixo da planta reúne equipamentos de rede, portas e cablagem do piso.
Selecione um bastidor para consultar os equipamentos instalados e as suas portas.
As camadas permitem ocultar portas RJ45, energia, etiquetas ou ligações.
Sem um projeto guardado, o exemplo inicial mostra tomadas duplas e um mini-switch.

## Arranque local em um comando

Com Docker e Docker Compose instalados, execute na pasta do projeto:

```bash
docker compose up --build
```

Abra **http://localhost:3000**. O comando compila a aplicação, prepara a base de dados,
cria as chaves de backup e inicia o servidor. Não precisa de configurar contas ou serviços cloud.
O volume `atlas-data` conserva projetos, versões, anexos e chaves entre arranques.
Para parar, use Ctrl+C; para voltar a iniciar, repita o comando. Não elimine o volume
se quiser conservar os dados e conseguir abrir os backups antigos.

**Assistente com Ollama no Docker:** execute `docker compose up --build -d`.
O serviço `ollama-init` instala automaticamente o modelo configurado, `qwen3:14b`
por predefinição; o Atlas aguarda a instalação antes de arrancar. Abra **Falar com
a IA** para conversar ou pedir configurações documentais. O primeiro download
requer Internet e espaço em disco. Pode consultar os **Guias de configuração**
no chat mesmo quando o modelo está indisponível.

**Sem Docker:** com Node.js **22.13 ou superior**, basta executar `npm start`.
Não é necessário instalar dependências para este arranque. Os dados ficam em `.atlas-local/`. Para ativar a IA neste modo, instale e inicie o Ollama no mesmo computador e descarregue um modelo; o Atlas procura o serviço em `http://127.0.0.1:11434` por predefinição. Pode definir outro endereço com `ATLAS_OLLAMA_URL`.
Pode mudar a porta com `PORT=3001 npm start` e a pasta com `ATLAS_DATA_DIR=/caminho npm start`.
Copie toda a pasta de dados, incluindo as chaves, para conservar uma instalação local.
Os dados do Docker e do arranque direto são independentes.

Este é um modo para uma pessoa, sem login. O Docker publica a aplicação apenas
em **http://localhost:3000** por predefinição. O arranque direto com `npm start`
também está limitado a localhost por predefinição. A publicação na rede exige
configuração explícita; `ATLAS_ALLOWED_HOSTS` valida hosts, mas não autentica
utilizadores. Para acesso remoto, use um proxy com autenticação e TLS.
A identidade local é fixa; backups da instalação Sites continuam associados à conta original.
Para utilização partilhada, mantenha o alojamento com autenticação descrito abaixo.

Na aplicação, abra **Configurar o projeto**, acima do mapa: **Criar espaços →
Equipar salas → Documentar ligações → Rever pendências**. O guia destaca a próxima
ação, abre a criação de equipamentos numa sala e encaminha as ligações em falta
para as tarefas da sala. As propostas e portas por identificar continuam pendentes.
A revisão abre o painel de pendências, com ações para resolver os registos em falta.
Redes/VLANs e empresa ficam numa secção opcional. O progresso acompanha os dados
atuais, incluindo alterações desfeitas; pode interromper e retomar mais tarde.
Nos exemplos, o guia indica que os dados e pendências pertencem ao exemplo.
As verificações são documentais e não confirmam a instalação física.


<a id="english"></a>

## 🇬🇧 English

### Contents

[Overview](#en-overview) · [Features](#en-features) · [Getting started](#en-start) · [Build and tests](#en-build) · [Architecture](#en-architecture) · [Security](#en-security) · [Scope and contributions](#en-scope)

<a id="en-overview"></a>

### What is Atlas?

**Atlas is a visual editor for documenting IT infrastructure**, from buildings and rooms to individual rack units, network interfaces and power connections. It combines spatial views with inventory and connection records so that a team can understand where equipment is located and how it is connected.

It is designed for IT teams, system administrators, support technicians and organisations that need to maintain clear infrastructure documentation across multiple spaces.

Typical questions Atlas helps answer:

- Where is this workstation, printer or server?
- Which outlet and patch-panel channel does this cable use?
- Which rack units and interfaces are occupied?
- What documented path remains if a cable or device fails?
- How can the current inventory and floor plans be handed over to another technician?

> **Current scope:** Atlas is a documentation application with model-based connectivity analysis. It does not discover devices automatically, monitor live traffic or configure real hardware. The application interface is currently in Portuguese; this README is bilingual. Access to the hosted application may require an authorised account.

<a id="en-features"></a>

### Features

| Area | Available capabilities |
| :--- | :--- |
| **Buildings and spaces** | Buildings, floors, rooms, equipment locations and imported floor-plan backgrounds. |
| **Readable 2D maps** | Organised building/floor/room blocks, spatial floor plans, equipment symbols, labels, filters and selection-focused connections. |
| **3D infrastructure** | Campus view, workstations and rack interiors with front/rear inspection, doors, numbered rack units and interactive ports. |
| **Inventory** | Switches, firewalls, servers, storage, PCs, laptops, IP phones, Wi-Fi, printers, cameras, patch panels, outlets, UPSs, PDUs and VMs. |
| **Addressing** | Documented IP addresses, subnets, gateways, VLANs and equipment specifications. |
| **Cabling** | Port-to-port links, categories, colours, lengths, VLAN records, notes and manually marked routes. |
| **Power** | Numbered PDU outputs, equipment power inputs and documented UPS/PDU connections. |
| **Analysis** | Inventory checks, passive-channel cable tracing and simulated connectivity failures. |
| **Reusable layouts** | Building and rack templates with equipment and internal links. |
| **History** | Named versions, comparisons, restoration and undo/redo during editing. |
| **Documentation** | Standalone HTML dossier, CSV, SVG, PNG and browser print/PDF. |
| **Project backups** | Authenticated, encrypted `.atlasenc` exports and compatible legacy JSON imports. |

#### A clearer 2D map

- **Organised blocks** group equipment by building, floor and room without changing its recorded coordinates.
- **Spatial floor plans** show one floor at a time. The all-floor view provides building navigation instead of overlapping floors.
- Connections can follow the current selection, show all links on a floor or be hidden.
- Cross-floor highlighted routes use a separate location-based diagram.
- The all-floor PDF includes an overview and one page per floor, independent of the current filters.
- PNG, JPEG and WebP floor-plan backgrounds can be imported, positioned and calibrated using two points and a known distance.

#### Guided connections and configuration

Direct connections use three steps: **Equipment → Ports → Review**. Search for each endpoint by name, IP or location, choose an available port from a labelled card, and confirm both ends before saving. Occupied ports are disabled; an existing cable retains access to its own ports while editing. Power connections require an output and an input. Virtual links skip physical port selection. **Ligar um posto ao bastidor** handles the separate three-cable outlet/patch-panel workflow. Map actions use visible Explore, Move and Connect buttons with a Finish action. Common equipment types have creation shortcuts, and configuration fields include contextual help.

#### Follow a cable, channel by channel

Network outlets and patch panels preserve independent front/rear channel pairs: **F1 ↔ R1**, **F2 ↔ R2**, and so on. A two-channel outlet can therefore document two separate connections.

The cabling assistant prepares three cable segments between a workstation and a switch, through an outlet and patch panel. It checks free interfaces and channels before applying the operation as a single undoable change.

The cable-circuit view follows passive channels to active endpoints. This is distinct from IP routing or protocol emulation. The dedicated **Mini-switch** type provides 2–16 numbered ports, a configurable uplink and occupied/free connection cards. New network outlets default to two independent RJ45 channels. Cable tracing can continue through the designated mini-switch uplink without including sibling endpoints.

#### Equipment records

Every device has a record for its responsible person, status, serial number, warranty expiry and notes. Upload up to 20 photographs (PNG/JPEG/WebP) or PDF documents, up to 5 MB each, and maintain up to 100 dated, editable intervention records with technician, work performed and outcome. Attachments are stored per account; PDFs download as documents. Removing an attachment unlinks it from the current record while preserving earlier version references. These manual intervention records are not an immutable audit log. Template copies start without identity records, attachments or interventions.

#### Inspect racks and workstations

Rack editing checks unit capacity and overlapping equipment. Front and rear views expose data and power connections. Workstation records collect location, network information and documented peripherals, including monitor count and telephone extension.

PDU outputs are individually numbered and can be labelled. Occupied outputs and power inputs are identified when documenting a new connection. Power views describe the recorded installation; they do not measure consumption or control sockets.

<a id="en-start"></a>

### A task-based workspace

The application opens on the organised 2D map. Five persistent areas separate **Map**, **Equipment**, **Connections**, **Checks** and **Documentation**. Equipment has a dedicated list rather than a table below the canvas. Shared search includes names, IPs, technical specifications, responsible people and serial numbers; visible scope and a clear-filters action explain the current results. Selected objects use **Sheet**, **Connections** and **Location** tabs. Editing groups identity, network and installation fields, while advanced specifications and exports stay in expandable sections. Tool dialogs show only related tasks.

### First steps in the application

1. Open **Exemplos** and choose a guided scenario.
2. Explore **Planta 2D → Blocos organizados**, then select a floor or room.
3. Select a workstation or rack to inspect its details and connections.
4. Use **Onde vai dar este cabo?** to follow a documented cable circuit.
5. Run **Verificar** to review model inconsistencies.
6. Save a named version before larger changes and generate a **Dossier** for handover.

| Example | What to explore |
| :--- | :--- |
| **Complete office** | Workstations, cabling, a main rack, server, storage and power connections. |
| **Two-floor building** | Floor plans, rooms and fibre links between racks. |
| **Failures and redundancy** | Deliberate documentation problems and alternative connectivity paths. |
| **Municipal organisation** | A fictional municipality with 3 buildings, 12 departments and 24 complete workstations. |

Loading an example first attempts to save the current project as a named version. If that backup fails, the example does not replace the current project. Example names, addresses and infrastructure records are fictional.

<a id="en-build"></a>

### Build and tests

**Requirements:** Git, npm and a modern Node.js runtime with ES modules, the built-in test runner and Web Crypto support.

```bash
git clone https://github.com/RomaoFilipe/Atlas.git
cd Atlas
npm ci
npm run build
node --test tests/*.test.mjs
```

Build before running tests: server-side tests use the generated Worker. The build creates `dist/server/index.js` and copies the hosting configuration to `dist/.openai/hosting.json`.

| Command | Purpose |
| :--- | :--- |
| `npm ci` | Install the dependencies recorded in the lockfile. |
| `npm run build` | Bundle public assets, shared validation and server modules into the Worker. |
| `node --test tests/*.test.mjs` | Run model, network, layout, API, isolation and encrypted-export tests. |
| `npm run db:generate` | Generate Drizzle migration files after schema changes; this does not apply migrations. |

**Runtime setup:** the repository targets the configured Sites hosting environment. For local single-user use, run `docker compose up --build` or `npm start` with Node.js 22.13+. The local server supplies persistent storage without a login service.

A working deployment needs the Worker runtime, database migrations, a D1 binding named `DB`, an R2 binding named `ATLAS_ASSETS`, trusted platform authentication and the export keyring secret. Opening `public/index.html` alone does not provide the persistence API.

The hosting configuration and encrypted-backup domain contain the current Site identity. A separate deployment needs deliberate configuration and a backup migration strategy; encrypted exports are not automatically portable between Sites.

<a id="en-architecture"></a>

### Architecture and repository guide

| Layer / path | Responsibility |
| :--- | :--- |
| `public/` | Browser interface, ES modules, styles and visualisation. |
| `public/vendor/` | Vendored Three.js and OrbitControls. |
| `public/model.js` | Project model, normalisation and shared validation. |
| `public/network.js`, `public/cabling*.js` | Port model, tracing and cabling workflows. |
| `public/plan*.js`, `public/scene.js` | 2D plans, printing and 3D scenes. |
| `worker/` | Project API, versions, assets and encrypted import/export. |
| `db/schema.ts`, `drizzle/` | Database schema and migration history. |
| `scripts/build.mjs` | Worker build process. |
| `tests/` | Automated checks for data and application behaviour. |
| `docs/export-security.md` | Detailed backup security and recovery model, in Portuguese. |
| `.env.example` | Export keyring placeholder; not a working secret. |
| `.openai/hosting.json` | Existing Sites deployment configuration. |

Project documents use schema **version 3**. D1 stores workspace metadata, indexed entities and named versions by owner; R2 stores imported floor-plan assets. Revision checks detect conflicting saves rather than silently overwriting a newer project.

<a id="en-security"></a>

### Security, backups and recovery

- Server APIs obtain identity from the platform-provided `oai-authenticated-user-id` header. A deployment must ensure that this identity comes from trusted infrastructure, not an arbitrary client header.
- The runtime secret `ATLAS_EXPORT_KEYRING` supplies the keys for `.atlasenc` files. Keep actual keys out of source control and browser assets.
- Exported project files use **AES-256-GCM** and per-file key derivation bound to the user and Site.
- Keep old keys when rotating the keyring. Losing a required key can make its backups unrecoverable.
- Encrypted backups depend on the original account/Site context. Floor-plan images and equipment attachments remain referenced assets; the export is not a self-contained image archive.
- PDF, SVG, PNG, CSV and HTML exports are readable files and do not inherit `.atlasenc` protection.

Encryption is performed on the server. This is **not end-to-end or zero-knowledge encryption**, and it does not describe encryption of every storage layer. See [the security document](docs/export-security.md) before planning production recovery.

<a id="en-scope"></a>

### Scope, contributions and licensing

Atlas currently provides per-user projects and documentation tools. The local Node server supports organization accounts and shared projects with revision conflicts; SSO, real-time shared editing, billing, live monitoring and automated discovery are not included. Inventory exports may support internal documentation processes, but the application does not claim compliance certification.

For a bug report, include the affected view, reproduction steps, expected behaviour and a sanitised example when possible. Never attach real credentials, export keys or sensitive infrastructure records to a public issue.

For contributions, describe the user problem, keep model changes compatible where possible, and run the relevant tests after building. Changes to authentication, ownership or encryption require particular care.

**License:** no project-level `LICENSE` file is currently included. Do not assume a specific open-source licence. Third-party components retain their own licence notices.

[Back to top](#atlas) · [Ler em português ↓](#portugues)

---

<a id="portugues"></a>

## 🇵🇹 Português

### Índice

[Apresentação](#pt-apresentacao) · [Funcionalidades](#pt-funcionalidades) · [Primeiros passos](#pt-inicio) · [Compilação e testes](#pt-testes) · [Arquitetura](#pt-arquitetura) · [Segurança](#pt-seguranca) · [Âmbito e contributos](#pt-ambito)

<a id="pt-apresentacao"></a>

### O que é o Atlas?

O **Atlas é um editor visual para documentar infraestruturas informáticas**, desde edifícios e salas até unidades de bastidor, interfaces de rede e ligações de alimentação. Reúne vistas espaciais, inventário e registos de ligações para facilitar a identificação dos equipamentos e a compreensão da rede.

Destina-se a equipas de informática, administradores de sistemas, técnicos de suporte e organizações que precisam de manter documentação clara sobre vários espaços.

Exemplos de perguntas a que o Atlas ajuda a responder:

- Onde está este posto de trabalho, impressora ou servidor?
- Por que tomada e canal do patch panel passa este cabo?
- Que unidades do bastidor e interfaces estão ocupadas?
- Que percurso documentado permanece disponível se um cabo ou equipamento falhar?
- Como entregar o inventário e as plantas atuais a outro técnico?

> **Âmbito atual:** o Atlas é uma aplicação documental com análise de conectividade baseada no modelo. Não descobre equipamentos automaticamente, não monitoriza tráfego real nem configura hardware. A interface está atualmente em português; este README é bilingue. O acesso à aplicação alojada pode exigir uma conta autorizada.

<a id="pt-funcionalidades"></a>

### Funcionalidades

| Área | Capacidades disponíveis |
| :--- | :--- |
| **Edifícios e espaços** | Edifícios, pisos, salas, localização de equipamentos e plantas de fundo importadas. |
| **Mapas 2D legíveis** | Blocos organizados por edifício/piso/sala, plantas espaciais, símbolos, etiquetas, filtros e ligações da seleção. |
| **Infraestrutura 3D** | Vista de campus, postos e interiores de bastidores com frente/traseira, portas, unidades U numeradas e interfaces interativas. |
| **Inventário** | Switches, firewalls, servidores, armazenamento, PCs, portáteis, telefones IP, Wi-Fi, impressoras, câmaras, patch panels, tomadas, UPS, PDU e VMs. |
| **Endereçamento** | Registo de IPs, sub-redes, gateways, VLANs e características técnicas. |
| **Cablagem** | Ligações entre portas, categorias, cores, comprimentos, VLANs documentadas, notas e percursos marcados manualmente. |
| **Energia** | Saídas PDU numeradas, entradas de alimentação e ligações documentadas entre UPS, PDU e equipamentos. |
| **Análise** | Verificação do inventário, seguimento de canais passivos e simulação de falhas de conectividade. |
| **Modelos reutilizáveis** | Cópias de edifícios e bastidores com equipamentos e ligações internas. |
| **Histórico** | Versões nomeadas, comparação, restauro e anular/refazer durante a edição. |
| **Documentação** | Dossier HTML autónomo, CSV, SVG, PNG e impressão/PDF pelo navegador. |
| **Cópias do projeto** | Exportações `.atlasenc` cifradas e autenticadas e importação de JSON antigo compatível. |

#### Uma planta 2D mais clara

- **Blocos organizados** agrupam os equipamentos por edifício, piso e sala sem alterar as coordenadas registadas.
- **Posições / planta** apresenta um piso de cada vez. A vista de todos os pisos permite navegar pelos edifícios, sem sobrepor plantas.
- As ligações podem acompanhar a seleção, mostrar todos os cabos do piso ou ficar ocultas.
- Percursos destacados entre pisos usam um diagrama separado por localização.
- O PDF de todos os pisos inclui uma visão geral e uma página por piso, independentemente dos filtros ativos.
- É possível importar plantas PNG, JPEG e WebP, posicioná-las e calibrar a escala com dois pontos e uma distância conhecida.

#### Ligações e configuração guiadas

As ligações diretas têm três passos: **Equipamentos → Portas → Confirmar**. Pesquise cada extremidade por nome, IP ou localização, escolha uma porta disponível num cartão identificado e confirme os dois lados antes de guardar. As portas ocupadas ficam bloqueadas; ao editar um cabo, as suas próprias portas continuam disponíveis. As ligações de energia exigem uma saída e uma entrada. As ligações virtuais dispensam portas físicas. **Ligar um posto ao bastidor** trata do percurso separado com três cabos, tomada e patch panel. No mapa, os botões Explorar, Mover e Ligar no mapa indicam a ação ativa, com a opção Terminar. Os equipamentos mais comuns têm atalhos de criação e os campos de configuração incluem ajuda contextual.

#### Seguir um cabo, canal a canal

As tomadas de rede e os patch panels mantêm pares independentes de frente/traseira: **F1 ↔ R1**, **F2 ↔ R2**, e assim sucessivamente. Uma tomada configurada com dois canais permite documentar duas ligações distintas.

O assistente de cablagem prepara três segmentos entre um posto e um switch, através de uma tomada e de um patch panel. Verifica as interfaces e os canais livres antes de aplicar a operação numa única alteração anulável.

A vista de circuito segue os canais passivos até às extremidades ativas. Este percurso é diferente de encaminhamento IP ou emulação de protocolos. O tipo **Mini-switch** disponibiliza 2–16 portas numeradas, uma porta configurável de ligação à rede principal e cartões de portas ocupadas/livres. As novas tomadas de rede têm duas saídas RJ45 independentes por predefinição. O percurso pode continuar pelo uplink do mini-switch sem incluir os equipamentos das outras saídas.

#### Fichas de equipamento

Cada equipamento tem uma ficha com responsável, estado, número de série, fim da garantia e notas. Pode carregar até 20 fotografias (PNG/JPEG/WebP) ou documentos PDF, até 5 MB por ficheiro, e manter até 100 intervenções editáveis, com data, técnico, trabalho realizado e resultado. Os anexos ficam isolados por conta; os PDF são descarregados como documentos. Remover um anexo retira a referência da ficha atual e preserva as referências das versões anteriores. As intervenções são registos manuais, não um registo de auditoria imutável. As cópias de modelos começam sem fichas de identificação, anexos ou intervenções.

#### Inspecionar bastidores e postos

A edição de bastidores verifica a capacidade em U e a sobreposição de equipamentos. As vistas de frente e traseira expõem as ligações de dados e alimentação. As fichas dos postos reúnem localização, rede e periféricos documentados, incluindo número de monitores e extensão telefónica.

As saídas das PDU são numeradas individualmente e podem receber etiquetas. A aplicação identifica saídas e entradas de alimentação ocupadas ao registar uma nova ligação. As vistas de energia representam a instalação documentada; não medem consumos nem comandam tomadas.

<a id="pt-inicio"></a>

### Um espaço de trabalho organizado por tarefas

A aplicação abre no mapa 2D organizado. Cinco áreas fixas separam **Mapa**, **Equipamentos**, **Ligações**, **Verificação** e **Documentação**. Os equipamentos têm uma lista própria, em vez de uma tabela por baixo do mapa. A pesquisa partilhada inclui nomes, IPs, características, responsáveis e números de série; o âmbito visível e a ação de limpar filtros ajudam a interpretar os resultados. Os objetos selecionados têm separadores **Ficha**, **Ligações** e **Localização**. A edição agrupa identificação, rede e instalação; as características avançadas e as exportações ficam em secções expansíveis. As janelas de ferramentas apresentam apenas tarefas relacionadas.

### Primeiros passos na aplicação

1. Abra **Exemplos** e escolha um cenário guiado.
2. Explore **Planta 2D → Blocos organizados** e selecione um piso ou sala.
3. Selecione um posto ou bastidor para consultar os detalhes e ligações.
4. Use **Onde vai dar este cabo?** para seguir um circuito documentado.
5. Execute **Verificar** para analisar incoerências do modelo.
6. Guarde uma versão nomeada antes de alterações maiores e gere um **Dossier** para passagem de informação.

| Exemplo | O que explorar |
| :--- | :--- |
| **Escritório completo** | Postos, cablagem, bastidor principal, servidor, armazenamento e alimentação. |
| **Edifício com dois pisos** | Plantas, salas e fibra entre bastidores. |
| **Falhas e redundância** | Problemas documentais propositados e percursos alternativos de conectividade. |
| **Câmara Municipal** | Município fictício com 3 edifícios, 12 departamentos e 24 postos completos. |

A abertura de um exemplo tenta primeiro guardar o projeto atual numa versão nomeada. Se essa cópia falhar, o exemplo não substitui o projeto. Os nomes, endereços e registos de infraestrutura dos exemplos são fictícios.

<a id="pt-testes"></a>

### Compilação e testes

**Requisitos:** Git, npm e uma versão moderna de Node.js com módulos ES, executor de testes integrado e suporte para Web Crypto.

```bash
git clone https://github.com/RomaoFilipe/Atlas.git
cd Atlas
npm ci
npm run build
node --test tests/*.test.mjs
```

Execute a compilação antes dos testes: os testes do servidor utilizam o Worker gerado. A compilação cria `dist/server/index.js` e copia a configuração de alojamento para `dist/.openai/hosting.json`.

| Comando | Finalidade |
| :--- | :--- |
| `npm ci` | Instalar as dependências registadas no lockfile. |
| `npm run build` | Reunir recursos públicos, validação partilhada e módulos do servidor no Worker. |
| `node --test tests/*.test.mjs` | Executar testes do modelo, rede, plantas, API, isolamento e exportações cifradas. |
| `npm run db:generate` | Gerar migrações Drizzle após alterações ao esquema; não aplica as migrações. |

**Configuração de execução:** o repositório destina-se ao ambiente Sites configurado. O modo local arranca com `docker compose up --build` ou `npm start` (Node.js 22.13+), com armazenamento persistente e identidade local fixa.

Uma instalação funcional precisa do runtime Worker, das migrações da base de dados, de uma ligação D1 chamada `DB`, de uma ligação R2 chamada `ATLAS_ASSETS`, da autenticação confiável da plataforma e do segredo com as chaves de exportação. Abrir apenas `public/index.html` não disponibiliza a API de persistência.

A configuração de alojamento e o domínio dos backups cifrados contêm a identidade do Site atual. Uma instalação separada exige configuração própria e uma estratégia de migração dos backups; as exportações cifradas não são automaticamente portáveis entre Sites.

<a id="pt-arquitetura"></a>

### Arquitetura e organização do repositório

| Camada / caminho | Responsabilidade |
| :--- | :--- |
| `public/` | Interface no navegador, módulos ES, estilos e visualização. |
| `public/vendor/` | Cópias locais de Three.js e OrbitControls. |
| `public/model.js` | Modelo do projeto, normalização e validação partilhada. |
| `public/network.js`, `public/cabling*.js` | Portas, percursos e fluxos de cablagem. |
| `public/plan*.js`, `public/scene.js` | Plantas 2D, impressão e cenas 3D. |
| `worker/` | API do projeto, versões, recursos e importação/exportação cifrada. |
| `db/schema.ts`, `drizzle/` | Esquema da base de dados e histórico de migrações. |
| `scripts/build.mjs` | Processo de compilação do Worker. |
| `tests/` | Verificações automáticas dos dados e do comportamento da aplicação. |
| `docs/export-security.md` | Modelo detalhado de segurança e recuperação dos backups. |
| `.env.example` | Exemplo de configuração das chaves; não contém um segredo funcional. |
| `.openai/hosting.json` | Configuração existente de publicação em Sites. |

Os documentos do projeto usam o esquema **versão 3**. A D1 guarda projetos e versões nomeadas por proprietário; a R2 guarda imagens de plantas importadas. A verificação de revisões deteta conflitos de gravação e evita substituir silenciosamente uma versão mais recente.

<a id="pt-seguranca"></a>

### Segurança, backups e recuperação

- As APIs recebem a identidade pelo cabeçalho `oai-authenticated-user-id` fornecido pela plataforma. A instalação deve garantir que esta identidade vem de infraestrutura confiável, não de um cabeçalho arbitrário enviado pelo cliente.
- O segredo de execução `ATLAS_EXPORT_KEYRING` fornece as chaves dos ficheiros `.atlasenc`. As chaves reais não devem entrar no repositório nem nos recursos do navegador.
- Os ficheiros exportados usam **AES-256-GCM**, com derivação de chave por ficheiro vinculada ao utilizador e ao Site.
- Preserve as chaves antigas durante a rotação. A perda de uma chave necessária pode tornar os respetivos backups irrecuperáveis.
- Os backups cifrados dependem do contexto da conta/Site original. As imagens de plantas e os anexos de equipamentos continuam como recursos referenciados; a exportação não é um arquivo autónomo dessas imagens.
- PDF, SVG, PNG, CSV e HTML são ficheiros legíveis e não recebem a proteção `.atlasenc`.

A cifra ocorre no servidor. **Não é encriptação ponta a ponta nem de conhecimento zero**, e não corresponde à cifra de todas as camadas de armazenamento. Consulte [a documentação de segurança](docs/export-security.md) antes de definir a recuperação em produção.

<a id="pt-ambito"></a>

### Âmbito, contributos e licença

O Atlas disponibiliza atualmente projetos por utilizador e ferramentas de documentação. Espaços de equipa, edição partilhada, faturação, monitorização em tempo real e descoberta automática não estão incluídos. As exportações de inventário podem apoiar processos internos de documentação, mas a aplicação não reivindica certificação de conformidade.

Ao comunicar um erro, indique a vista afetada, os passos para reproduzir, o resultado esperado e, se possível, um exemplo sem dados sensíveis. Nunca anexe credenciais reais, chaves de exportação ou registos sensíveis de infraestrutura a uma issue pública.

Para contribuir, descreva o problema do utilizador, mantenha a compatibilidade do modelo sempre que possível e execute os testes relevantes após a compilação. Alterações à autenticação, propriedade dos dados ou cifra exigem especial cuidado.

**Licença:** o repositório ainda não inclui um ficheiro `LICENSE` do projeto. Não se deve presumir uma licença open source específica. Os componentes de terceiros mantêm os respetivos avisos de licença.

[Voltar ao início](#atlas) · [Read in English ↑](#english)

### Simplified network connections / Ligações de rede simplificadas

**English:** Select a device and choose **Ligar à rede**. Search named destinations, with the current room listed first, choose a free outlet and review before saving. Wall plates show independent A/B outlets and their documented upstream path. Mini-switch uplinks are reserved in the suggested choices. Occupied outlets open the existing connection for review/editing. **Identificar mais tarde** saves a pending port without inventing a cable; creating its connection clears that marker. Technical cabling remains available. New equipment supports quantities of 1–20, with numbered names, without shared IP addresses or rack placement. Recorded paths do not certify physical connectivity.

**Português:** Selecione um equipamento e escolha **Ligar à rede**. Procure o destino pelo nome, com os equipamentos da mesma sala primeiro, escolha uma saída livre e confirme. As tomadas apresentam saídas A/B independentes e o respetivo percurso registado até à rede. As sugestões respeitam a porta principal dos mini-switches. Uma saída ocupada abre a ligação existente para consulta/alteração. **Identificar mais tarde** guarda uma porta pendente sem inventar cabos; a criação da ligação retira essa indicação. As opções técnicas continuam disponíveis. Pode criar 1–20 equipamentos iguais, com nomes numerados, sem repetir IPs nem posições no bastidor. Um percurso registado não comprova a ligação física.

### Room workspace / Espaço de trabalho da sala

**English:** Open a floor, then a room. The room workspace groups its equipment, quick creation, connection actions and a **Falta configurar** checklist. Quick creation asks for name, type and quantity, inheriting the selected room/floor/building; IP and other details can be added later. Select multiple room devices to assign an owner or move them together. Rack-mounted devices and VMs must move through their rack/host. Selected devices expose Connect, Edit, Move and Duplicate actions directly. Room duplication copies equipment and racks, clears IPs and identity records, and stores internal cables as separate proposals for individual review; no copied cable becomes active before confirmation. External connections are marked unidentified. Undo/redo labels identify the action. Floor overviews show room summaries; room views show equipment and selected connections. Duplication preserves the source layout coordinates, which can be adjusted afterwards.

**Português:** Abra um piso e depois uma sala. O espaço de trabalho reúne equipamentos, criação rápida, ações de ligação e a lista **Falta configurar**. A criação rápida pede nome, tipo e quantidade e preenche a sala, piso e edifício selecionados; o IP e restantes dados podem ser adicionados depois. Selecione vários equipamentos para atribuir um responsável ou mudar de sala. Equipamentos em bastidores e VMs seguem a localização do bastidor/servidor. Ao selecionar um equipamento, as ações Ligar, Editar, Mudar de sala e Duplicar ficam diretamente acessíveis. A duplicação de salas copia equipamentos e bastidores, retira IPs e registos de identidade e guarda os cabos internos como propostas para revisão individual. Nenhum cabo copiado fica ativo antes da confirmação; ligações externas ficam por identificar. Desfazer/refazer indica a ação. A vista do piso resume as salas; dentro da sala aparecem os equipamentos e as ligações selecionadas. A duplicação conserva as coordenadas da organização original, que podem ser ajustadas depois.

**Room and connection usability:** New rooms ask for name and floor first, with optional geometry, and open immediately after creation. Connection actions distinguish power equipment, virtual machines and network devices. Existing source connections are shown directly for editing; destination choices show free ports first, with an option to include occupied ports. The room checklist keeps its expanded state during updates. Outlet lettering supports A–Z and AA onwards.

**Utilização de salas e ligações:** A criação de salas apresenta primeiro nome e piso, com medidas opcionais, e abre a sala após guardar. As ações distinguem alimentação, máquinas virtuais e rede. As ligações do equipamento aparecem diretamente para edição; os destinos mostram primeiro portas livres, com opção de incluir as ocupadas. A lista de tarefas mantém-se aberta durante as atualizações. As saídas usam letras A–Z e AA em diante.

### Create a complete building / Criar um edifício completo

**English:** **+ Building** opens one form for the building name, 1–10 floors and up to 20 room names per floor (one per line). The summary shows the counts before creation. Blank floors are allowed. Duplicate floor names and duplicate room names within a floor are rejected. Initial room dimensions and positions are suggested, and the first created room opens automatically. The whole operation can be undone together. Equipment and cables are added separately.

**Português:** **+ Edifício** abre uma janela para o nome do edifício, 1–10 pisos e até 20 salas por piso (uma por linha). O resumo apresenta as quantidades antes da criação. Pode deixar pisos sem salas. Nomes de pisos repetidos e salas com o mesmo nome dentro de um piso são rejeitados. As medidas e posições iniciais são sugeridas e a primeira sala abre automaticamente. Pode desfazer toda a criação numa operação. Os equipamentos e cabos são adicionados depois.

**Configuration follow-through:** Quick creation requires an explicit room when none is selected and lists rooms on the current floor first. Changing equipment type updates the suggested name while preserving custom names. Mini-switch checks follow occupied uplinks and identify missing continuation. Moving an unmounted server between rooms/buildings also updates its hosted VMs; the transfer form states how many VMs follow it.

**Continuidade da configuração:** A criação rápida exige a escolha de uma sala quando nenhuma está selecionada e apresenta primeiro as salas do piso atual. Alterar o tipo atualiza o nome sugerido e preserva nomes personalizados. A verificação de mini-switches segue a porta principal mesmo quando ocupada e identifica troços em falta. A transferência de um servidor fora do bastidor atualiza também a localização das suas VMs; o formulário indica quantas acompanham a mudança.

### Room-first workflow / Utilização centrada na sala

**English:** Use the building → floor → room breadcrumbs to navigate. Empty rooms highlight **Equip room**; rooms with unfinished connections highlight **Configure connections**. Equipment creation offers visual type cards, inherits the room, and shows **Connect now / Add more / Undo** after adding devices. Editing an existing device opens a side drawer with the map still visible. Search covers the entire project, including owners and locations, and opens the matching room. Forms warn before discarding edits; the header reports save progress separately from action feedback. Occupied-port errors identify the existing peer and the affected field.

**Português:** Navegue pelo percurso edifício → piso → sala. Nas salas vazias, a ação principal é **Equipar sala**; quando existem ligações pendentes, é **Configurar ligações**. Escolha o tipo de equipamento através de cartões; a sala fica preenchida automaticamente. Depois de adicionar, pode **Ligar agora / Adicionar mais / Desfazer**. A edição de um equipamento abre um painel lateral mantendo o mapa visível. A pesquisa abrange todo o projeto, incluindo responsáveis e localizações, e abre a sala do resultado. Os formulários avisam antes de descartar alterações; o cabeçalho apresenta o estado de gravação separado das mensagens de ações. Os erros de portas ocupadas indicam o equipamento já ligado e o campo a corrigir.

### Equip a whole room / Equipar uma sala completa

**English:** In an empty room, choose **Equipar sala**; in an existing room, use **Mais ações → Equipar sala em conjunto**. Start with Office, Meeting room or Reception, then adjust workstations, one/two monitors per workstation, IP phones, printers, double network outlets and mini-switches. The preview lists the new equipment before one undoable operation. Existing equipment stays in place. Monitors belong to workstations and do not consume Ethernet outlets.

Capacity distinguishes free outlet fronts, free mini-switch downstream ports and free ports with a documented upstream path. Pending proposals reserve ports. **Propor ligações** suggests available local endpoints and, where present, panel/switch ports in the same building. These remain proposals until each cable is reviewed and confirmed; they do not establish real connectivity or verify cable routes. Missing infrastructure stays unresolved. **Ver percurso** follows the documented passive channel and mini-switch uplink, with buttons to inspect equipment or highlight the path on the map. Moving equipment requires an explicit keep/disconnect decision for every affected cable and removes its stale proposals.

**Português:** Numa sala vazia, escolha **Equipar sala**; numa sala existente, use **Mais ações → Equipar sala em conjunto**. Comece por Escritório, Sala de reuniões ou Atendimento e ajuste os postos, um/dois monitores por posto, telefones IP, impressoras, tomadas duplas e mini-switches. A pré-visualização apresenta os equipamentos antes de uma única operação que pode desfazer. Os equipamentos existentes mantêm a posição. Os monitores pertencem ao posto e não consomem saídas Ethernet.

O resumo distingue saídas de tomada livres, portas livres de mini-switch (excluindo a entrada) e portas com percurso até à rede registado. As propostas pendentes reservam portas. **Propor ligações** sugere destinos na sala e, quando existem, portas de patch panel e switch no mesmo edifício. Cada cabo exige revisão e confirmação; nenhuma proposta confirma a instalação física. A infraestrutura em falta fica por identificar. **Ver percurso** segue o canal da tomada/painel e a entrada do mini-switch, permite abrir os equipamentos e destacar o percurso no mapa. Ao mudar equipamentos de sala, é obrigatório decidir quais os cabos a manter ou desligar; as propostas antigas dos equipamentos são retiradas.

### Campus-first layout / Campus como vista inicial

**English:** Atlas opens in Campus 3D. The selection panel starts collapsed and opens when an object is selected. Map view tabs, editing actions and location filters are grouped separately. A sidebar action creates a building directly; responsive project counters and search keep the map central.

**Português:** O Atlas abre no Campus 3D. O painel de detalhes começa recolhido e abre ao selecionar um objeto. Os separadores de vista, as ações de edição e os filtros de localização têm grupos próprios. A navegação lateral permite criar um edifício diretamente; os indicadores e a pesquisa adaptam-se à largura do ecrã.

### Map tools and locks / Ferramentas e bloqueios

**English:** Map tools are grouped into View and Protection. Centre the selection, isolate its location, fit the current view or return to the full Campus 3D. Lock a selected object, lock the current floor or manage building/floor/room locks together. A parent lock protects the positions of its contents, including moves made through forms. Unlock the parent to move a child. Records and cable editing remain available. Existing rack locks are respected. Locks are saved in the project and can be undone; they prevent accidental layout edits and are not access-control permissions.

**Português:** As ferramentas do mapa estão agrupadas em Vista e Proteção. Pode centrar a seleção, isolar a localização, enquadrar a vista ou regressar ao Campus 3D completo. Bloqueie o objeto selecionado, tranque o piso atual ou gira os bloqueios de edifícios, pisos e salas num único painel. O bloqueio de um espaço protege a posição dos seus objetos, mesmo em alterações por formulário. Para mover um objeto, desbloqueie o espaço que o protege. As fichas e os cabos continuam editáveis. Os bloqueios existentes de bastidores são respeitados. Os bloqueios ficam guardados no projeto e podem ser desfeitos; protegem contra alterações acidentais da disposição e não substituem permissões de acesso.

### Chat local para ajudar na configuração

O painel «Falar com a IA» usa o modelo local configurado (Qwen3 14B por defeito) e
permite escrever perguntas, usar sugestões e iniciar uma nova conversa. O histórico fica apenas na memória da página;
não é guardado no projeto. O chat recebe apenas um contexto estrutural anónimo. No modo «Configurar por mim»,
o Atlas executa ações documentais validadas; não existem comandos de sistema,
acesso a ficheiros, contas ou operações privilegiadas.

```sh
docker compose up -d --build
# O serviço ollama-init instala automaticamente o Qwen3 14B.
```

Abre `http://localhost:3000` e abre «Falar com a IA». A ligação é automática. O primeiro download
requer Internet e espaço para o modelo. O Ollama não publica portas no anfitrião;
o Atlas publica apenas em loopback por defeito. Para acesso remoto, usa um proxy
com autenticação e TLS; este runtime continua a ser de utilizador único e a lista
de hosts permitidos não autentica pessoas.

O servidor filtra padrões comuns de IPv4, IPv6, emails, URLs, tokens e credenciais
rotuladas antes de enviar mensagens e antes de devolver respostas. O assistente de
planta envia apenas campos de geometria permitidos, com nomes genéricos. Estes
filtros não garantem deteção de segredos arbitrários, codificados ou ofuscados:
não introduzas dados sensíveis no chat. As ações disponíveis pertencem a uma lista explícita e são validadas antes de
serem aplicadas. Não há execução de código nem acesso a equipamentos reais.
A integração usa a [API oficial de chat do Ollama](https://docs.ollama.com/api/chat).

### Navegação e edição na planta

- **Mostrar tudo** limpa filtros e sai da sala/piso aberto para enquadrar o projeto.
- **Centrar seleção** abre a localização do equipamento e aproxima a vista.
- O caminho acima do mapa permite regressar ao projeto, edifício ou piso.
- **Configurar o projeto** apresenta as etapas Edifício → Piso → Sala → Equipamentos
  → Ligações → Rever e indica o próximo passo disponível.
- Numa sala, **Duplicar sala** cria uma cópia num espaço livre do mesmo piso,
  mantendo a disposição relativa dos equipamentos e bastidores. Remove IPs e
  registos pessoais; os cabos internos tornam-se propostas para revisão. Se não
  houver espaço, é necessário ajustar as salas ou aumentar o edifício.
- Na **Planta 2D**, centra um equipamento para abrir a planta de posições. Usa
  **Selecionar vários**, desenha uma caixa ou faz Shift+clique nos equipamentos.
  Conclui a seleção para arrastar um dos selecionados e mover o grupo. Também podes
  usar as setas do painel com passos de 10 cm, 50 cm ou 1 m. Os bloqueios e limites
  das salas são respeitados. **Desfazer** anula cada operação completa.

### Seguir cabos, recuperar estados e pesquisar diretamente

Ao selecionar uma **tomada de rede**, o painel de percurso destaca a saída A.
Escolhe outra saída para seguir o seu canal independente. O percurso começa na
traseira da tomada, atravessa o canal correspondente dos painéis e continua pela
porta principal dos mini-switches até encontrar um switch. Mostra os cabos por
ordem, as portas em cada extremo e o ponto onde falta documentar a continuação.
Não atravessa equipamentos ativos nem mistura saídas vizinhas, energia ou
ligações virtuais. **Limpar destaque** repõe a vista normal.

Em **Projeto → Histórico de alterações**, consulta as últimas 100 gravações
anteriores do projeto ou as versões nomeadas. **Ver alterações** compara um estado
com o atual; **Recuperar** apresenta primeiro as diferenças que serão aplicadas.
O estado atual é preservado numa versão nomeada antes da recuperação. Os registos
automáticos são privados por utilizador e começam após esta atualização; cada
registo corresponde a uma gravação concluída, podendo agrupar várias ações rápidas.
As versões nomeadas mantêm o limite de 200 e não são eliminadas pela retenção do
histórico automático. A migração SQL é aplicada automaticamente ao iniciar o
runtime local/Docker.

A pesquisa global apresenta até oito atalhos com nome e localização. Clica num
resultado ou usa ↑/↓ e Enter para abrir e centrar o equipamento. Equipamentos
instalados abrem o respetivo bastidor; os restantes abrem a localização no mapa.
**Ver todos no inventário** mantém a pesquisa para consultar a lista completa.

### Modelos de salas e pendências no mapa

Abre uma sala e usa **Guardar modelo**. Para reutilizar, escolhe **Adicionar → A
partir de um modelo de sala…**, seleciona o modelo, o piso de destino e o nome da
nova sala. A colocação procura espaço livre e respeita os bloqueios do destino.
As medidas, equipamentos, bastidores e disposição relativa são preservados. Os
modelos de sala não incluem IPs, gateways, VLANs, responsáveis, fichas, anexos ou
histórico. Os cabos internos tornam-se propostas; portas externas ficam por
identificar. A operação pode ser anulada e os modelos ficam guardados no projeto.

**Pendências no mapa** mostra equipamentos em serviço sem ligação documentada,
portas por identificar e possíveis sobreposições entre objetos físicos no mesmo
piso e altura. As portas de tomadas apenas livres não são tratadas como falhas.
Os indicadores `!` aparecem em 2D e 3D; podem ser ocultados. Usa **Centrar**,
**Configurar ligação** ou **Reposicionar** para abrir a ação correspondente. A
lista respeita o edifício, piso e sala abertos e apresenta 15 itens por página.
Estas indicações verificam os registos do projeto, não a infraestrutura real.

A planta mantém o SVG nas atualizações sem alterações visuais. A vista 3D evita
reconstruções idênticas, deixa de desenhar quando está oculta ou parada sem fluxo
animado e usa formas simplificadas quando há mais de 120 equipamentos visíveis.
O objeto selecionado e os equipamentos do percurso mantêm o detalhe completo;
os bastidores mantêm sempre o detalhe. Os diagnósticos são reutilizados enquanto
o projeto não muda e a deteção de sobreposições calcula cada área uma única vez.

Para medir o cálculo de diagnósticos com 450 equipamentos neste computador:

```sh
npm run bench:map
```

### IA que configura o projeto

No chat, o modo **Configurar por mim** interpreta o pedido, valida todas as ações e
aplica-as automaticamente numa única operação com **Desfazer**. O modo **Só
conversar** responde sem alterar o projeto. Exemplos:

- «Cria um edifício chamado Sede com um piso e uma sala de 10 por 8 metros.»
- «Adiciona três computadores à sala atual.»
- «Liga à rede os equipamentos da sala atual usando as portas livres.»
- «Cria a VLAN 30 com o nome Utilizadores.»

Pode criar edifícios, pisos, salas, equipamentos e VLANs; renomear elementos; mover
equipamentos livres dentro da sala; atribuir VLANs; registar cabos de dados e aplicar
modelos de salas. Os cabos são registos documentais: não há alterações na rede real.
Os cabos de uma sala usam os canais e portas livres que o Atlas consegue identificar.
Portas reservadas por propostas não são reutilizadas automaticamente.

O modelo recebe referências anónimas, dimensões, tipos e disponibilidade de portas.
O browser associa essas referências aos objetos reais. Nomes existentes escritos
no pedido são substituídos localmente por referências quando são inequívocos. Não
são enviados IPs, gateways, sub-redes, contas, fichas, responsáveis, anexos ou histórico
do projeto. A filtragem de texto continua sujeita às limitações indicadas acima.

As respostas usam o [esquema estruturado do Ollama](https://docs.ollama.com/capabilities/structured-outputs).
O executor aceita apenas as ações previstas: não apaga elementos, não altera
bloqueios ou credenciais, e não executa código, comandos, ficheiros ou acessos
privilegiados. IPs e dados de ficha só são aplicados a partir de comandos locais
explícitos; o modelo não pode inventar esses valores. Uma ação inválida, falta de espaço, conflito, porta ocupada ou mudança
do projeto durante a resposta impede a aplicação de todo o lote. Máximo de 12 ações
e 50 equipamentos novos por pedido. A gravação usa a persistência e o histórico
normais do Atlas; o chat distingue uma configuração guardada de gravação pendente.

O modelo está fixado em **Qwen3 14B** (`qwen3:14b`). O serviço Docker `ollama-init`
instala-o no volume persistente do Ollama; o Atlas aguarda a conclusão antes de
arrancar. O assistente não muda silenciosamente para um modelo menor. Para escolher
outro modelo, define `ATLAS_OLLAMA_MODEL` no ambiente/Compose e reinicia os serviços.
Não são mostrados controlos de modelo ou ligação no chat. A primeira resposta pode
demorar durante o carregamento; em máquinas sem GPU, a latência depende do modelo
e do processador; o pedido de configuração tem um limite de cinco minutos.

### Ajuda rápida e revisão de alterações

O chat começa em **Só conversar**. As perguntas cobertas pelos guias recebem uma
**Resposta imediata · guia do Atlas**, sem aguardar o Ollama. Em **Configurar por
mim**, alguns comandos exatos também dispensam o modelo, mantendo as validações
do editor e a opção Desfazer. Pedidos livres continuam a usar o Qwen3 configurado;
não foi efetuado fine-tuning. As fontes da ajuda podem ser abertas no próprio chat.

Em **Equipamentos → Importar Excel / CSV**, a operação **Adicionar e atualizar por
ID / série** revê novos, alterados e registos sem alterações. Colunas ausentes são
preservadas; valores explicitamente vazios podem limpar campos. Cada cabo afetado
por uma mudança de sala exige uma decisão. Alterações de tipo, quantidade de portas
e montagem em U devem ser feitas na ficha.

Em **Projeto → Auditoria de alterações**, consulta os registos por entidade e revisão.
A auditoria começa após as migrações 0003/0004; não reconstrói alterações anteriores.
No modo local, o autor é a identidade partilhada. Os triggers impedem editar ou
eliminar eventos, mas não protegem contra um administrador da base de dados.

Validação adicional: `npm run test:browser` executa percursos Chromium numa instalação
temporária. `npm run eval:assistant` avalia consultas, guias e comandos diretos;
`npm run eval:assistant -- --with-model` acrescenta inferência real. Resultados em `docs/test-results/assistant-evaluation.json`.

### Pesquisa, manutenção e comparação visual

A pesquisa superior encontra equipamentos por nome, IP e número de série; Enter
abre o resultado no mapa ou bastidor. Na ficha, registe intervenções, **Próxima
revisão** e **Substituição prevista**. As pendências incluem revisões vencidas ou
nos próximos 30 dias e substituições vencidas ou nos próximos 90 dias, excluindo
os equipamentos abatidos. As datas são documentais; não são enviadas notificações.

No inspetor, **Simular falha deste equipamento/cabo** prepara a seleção; escolha
o destino de referência e execute **Simular** para destacar o impacto no mapa.
Em **Documentação → Histórico → Ver alterações**, o diagrama distingue adições,
remoções e alterações de equipamentos e cabos. A disposição é esquemática.

O **Dossier técnico → Imprimir / PDF** inclui plantas, bastidores, inventário,
cabos, verificação e manutenção; escolha guardar como PDF no navegador.
No telemóvel, leia uma etiqueta QR com a câmara do sistema para abrir a ficha,
consultar portas e ligações e editar registos. O endereço da etiqueta deve ser
acessível ao telemóvel; a ficha apresenta controlos adaptados a ecrãs pequenos.

### Consultar o projeto no chat

O assistente responde a estas consultas a partir dos dados atuais, no próprio
browser, sem enviar o inventário ao modelo e sem alterar o projeto:

- «Quantos switches existem?» ou «Quantos equipamentos há nesta sala?»
- «Onde está POSTO-01?» (também aceita IP ou número de série).
- «Resume o equipamento selecionado.»
- «O que falta documentar nesta sala?»
- «Que manutenções estão pendentes?» ou «Quais revisões estão vencidas?»

Os resultados incluem botões para abrir os equipamentos. Os âmbitos sala, piso e
edifício exigem a localização aberta ou selecionada; uma localização em falta não
é substituída silenciosamente pelo projeto inteiro. As consultas mostram os
registos documentais, sem afirmar disponibilidade real na rede. As respostas
locais não são acrescentadas ao histórico enviado ao modelo.

`npm run eval:assistant` avalia consultas, ajuda e comandos diretos sem Ollama.
`npm run eval:assistant -- --with-model` acrescenta casos de inferência real no
modelo configurado; a disponibilidade e os resultados do modelo são registados
separadamente. O relatório usa projetos sintéticos e fica em
`docs/test-results/assistant-evaluation.json`. O CI executa a avaliação sem modelo.

### Inserir e configurar pelo chat

Em **Configurar por mim**, abre **O que posso inserir e configurar** e escolhe um
exemplo. Os comandos diretos funcionam também no site sem ligação ao Ollama.
Exemplos (adapta nomes e datas):

```text
Cria um edifício chamado "Sede" com um piso chamado "Piso 0" e uma sala chamada "Escritório" de 10 por 8 metros.
Adiciona 1 switch chamado "SW-01" com 24 portas na sala atual.
Cria um bastidor chamado "RACK-01" de 24 U na sala atual.
Define o responsável do equipamento selecionado como "Equipa TI".
Define o estado do equipamento selecionado como "Em manutenção".
Agenda a próxima revisão do equipamento selecionado para 2026-12-01.
Regista uma intervenção no equipamento selecionado com o título "Revisão preventiva" na data 2026-10-29.
Define o IP do equipamento selecionado como 192.0.2.10.
Define o gateway do equipamento selecionado como 192.0.2.1.
Atribui a VLAN 30 ao equipamento selecionado.
Define a sub-rede da VLAN 30 como 192.0.2.0/24.
Configura o equipamento selecionado com 24 portas.
Cria uma VM chamada "VM-01" no servidor selecionado.
Instala o equipamento selecionado no bastidor "RACK-01" na U 4.
Liga a alimentação do equipamento selecionado à PDU "PDU-01" na tomada 1.
```

Pode indicar o nome exato entre aspas em vez de «equipamento selecionado».
Para executar vários comandos sobre elementos existentes, separa-os por ponto e
vírgula; todo o lote é validado antes de aplicar e tem uma única ação de Desfazer.
Os comandos podem referir pelo nome espaços, equipamentos, VLANs e modelos
criados nos passos anteriores do mesmo pedido. Quantidades com vários equipamentos
continuam a exigir referências inequívocas para ações posteriores.
Nomes ambíguos exigem selecionar o elemento. Reduzir portas ligadas ou reservadas
por propostas, datas inválidas e IPs repetidos impede a aplicação de todo o lote.
Em Só conversar, um comando reconhecido fica na caixa de texto e o chat indica
como mudar para Configurar por mim; não é executado nesse modo.

IPs, gateways, dados de ficha e intervenções são tratados no browser e não entram
no histórico enviado ao modelo. VMs, portas, cablagem e alimentação são registos
do projeto. A gravação, auditoria e recuperação usam os mecanismos normais do Atlas.

### Qwen3 14B e tarefas de várias etapas

O modelo por predefinição é **qwen3:14b**, no chat e no assistente de organização
da planta. No arranque direto, instala-o com `ollama pull qwen3:14b` e inicia
`npm start`; no Docker, `ollama-init` instala o modelo configurado automaticamente.
A configuração não muda silenciosamente para um modelo menor. Pedidos livres
podem demorar em CPU; o chat permite até cinco minutos por pedido ao modelo.

Em Configurar por mim, também podes usar:

```text
Equipa a sala atual com 4 postos de trabalho, 4 telefones IP, 1 impressora e 4 tomadas de rede.
Atribui a VLAN 30 a todos os equipamentos da sala atual.
Instala os equipamentos livres da sala atual no bastidor "RACK-01".
Alimenta os equipamentos ativos do bastidor "RACK-01" usando a PDU "PDU-01".
Guarda a sala atual como modelo chamado "Escritório padrão".
Duplica a sala atual com o nome "Novo escritório".
```

A montagem escolhe U livres para equipamentos compatíveis da mesma sala. A
alimentação do bastidor usa uma PDU nele instalada, preserva cabos existentes e
inclui switches, firewalls, servidores e armazenamento sem alimentação registada.
Equipar uma sala acrescenta apenas as quantidades pedidas; não cria IPs nem
infraestrutura implícita. A cópia de sala/modelo não inclui fichas ou IPs, e os cabos
copiados ficam como propostas. Todos os passos partilham validação e Desfazer.
Os limites continuam a ser 12 ações e 50 equipamentos novos por pedido.

**Local e alojado:** o Ollama instalado neste computador serve o Atlas local. A
publicação no Sites não cria uma ligação ao computador. Os comandos diretos
funcionam no site sem modelo; pedidos livres ao Qwen3 no site exigem uma ligação
a um servidor de inferência configurada separadamente.

### Pedir um escritório completo

Abre a sala de destino, escolhe **Configurar por mim** e envia:

> Prepara este escritório para 20 pessoas, com computadores, impressora, tomadas e um bastidor. Liga os equipamentos e verifica o que falta.

Este pedido funciona também no site sem ligação ao Ollama. Numa sala vazia com
espaço suficiente, cria 20 computadores, uma impressora, 11 tomadas duplas, um
bastidor de 24 U, switch e patch panel de 24 portas, montados e ligados por 63
cabos documentais. Os equipamentos compatíveis já existentes são reutilizados;
repetir o pedido não duplica a instalação nem cria uma gravação sem alterações.
Para 30 pessoas, as quantidades são divididas pelos limites de criação em lote.

A verificação final calcula os percursos reais do modelo e indica o que fica por
documentar, incluindo IPs, VLANs e destino Internet. Não inventa endereçamento nem
confirma acesso físico à rede. Falta de espaço, bloqueio ou capacidade insuficiente
impede todo o lote. O relatório acompanha o resultado aplicado, e Desfazer recupera
o estado anterior numa única operação.

### Reparação de ligações, IPs em lote e filial por etapas

Em **Configurar por mim**, os seguintes pedidos funcionam também sem Ollama:

```text
Revê esta sala e completa as ligações que faltam, usando as portas livres.
Usa a rede 192.168.10.0/24, reserva o gateway .1 e atribui IPs aos computadores sem repetir endereços.
Prepara uma filial com dois pisos, três departamentos e 40 postos.
```

A reparação preserva os cabos confirmados e as propostas, completa canais de
patch panel já ligados ao switch e pode ligar diretamente a switches da mesma
sala. Não cria equipamentos nem retira ligações. O relatório final mostra o que
continua sem percurso; uma ligação registada não confirma a instalação física.

O endereçamento é calculado no browser a partir da sub-rede e gateway explícitos.
Reserva rede, broadcast, gateway e endereços já usados no mesmo domínio. Preserva
IPs existentes válidos; recusa endereços fora da rede, gateways incompatíveis,
VLANs com outro plano e intervalos sem capacidade. O lote inteiro é validado antes
de aplicar. O pedido pode terminar com `a partir de .10 sem repetir endereços` ou
usar `equipamentos` em vez de `computadores`. Limite: 100 equipamentos por lote.
Os valores de rede não entram no histórico enviado ao modelo.

O plano de filial valida previamente todos os passos e distribui os postos pelos
departamentos. Por predefinição cria um edifício, pisos e salas de 12 × 10 m,
com uma impressora e um bastidor por departamento e cablagem documental. Podes
indicar o nome: `Prepara uma filial chamada "Filial Lisboa" com dois pisos, três
departamentos e 40 postos.` As dimensões do edifício são calculadas para as salas.
Cada etapa respeita 12 ações/50 equipamentos novos e é guardada antes da seguinte;
os limites globais do projeto continuam em vigor. A preparação não inventa IPs,
VLANs, país, responsáveis ou ligação à Internet.

Os controlos permitem **Pausar após esta etapa**, **Retomar**, **Desfazer última
etapa** e **Terminar plano**. Terminar conserva o trabalho aplicado. A retoma é
guardada em sessionStorage no mesmo separador, incluindo após recarregar; fechar
o separador termina essa disponibilidade. Após recarregar, o botão Desfazer serve
as etapas executadas nessa nova sessão; estados anteriores permanecem no histórico
do projeto. Alterações manuais, conflitos ou falhas de gravação pausam a execução;
nenhuma etapa posterior é aplicada sobre um estado diferente do esperado.
