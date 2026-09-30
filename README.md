<div align="center">

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

**Runtime setup:** the repository targets the configured Sites hosting environment. It does not currently provide an `npm run dev` script, a standalone login service or a generic one-command deployment.

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

Project documents use schema **version 3**. D1 stores projects and named versions by owner; R2 stores imported floor-plan assets. Revision checks detect conflicting saves rather than silently overwriting a newer project.

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

Atlas currently provides per-user projects and documentation tools. Team workspaces, shared editing, billing, live monitoring and automated discovery are not included. Inventory exports may support internal documentation processes, but the application does not claim compliance certification.

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

**Configuração de execução:** o repositório destina-se ao ambiente Sites configurado. Ainda não inclui um comando `npm run dev`, um serviço autónomo de autenticação ou uma instalação genérica com um único comando.

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
