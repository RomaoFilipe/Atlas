# Empresa, países e unidades

O painel **Empresa e unidades**, na navegação lateral, organiza um projeto por
empresa → país → unidade → edifício → piso → sala → equipamento.

## Configuração simples

1. Abra **Empresa e unidades → Configurar empresa e adicionar unidades**.
2. Indique o nome da empresa.
3. Escolha **Uma unidade — formulário simples** e preencha país, cidade,
   código da unidade, edifício, perfil, pisos, fuso e responsável.
4. Reveja os espaços que serão criados e aplique a configuração.
5. Abra a planta da unidade e adicione os equipamentos pela biblioteca.

Os perfis escritório, armazém e datacenter criam apenas a estrutura de salas.
O perfil só pisos permite usar uma planta importada sem criar salas sugeridas.
Não são inventados equipamentos, ligações nem IPs. A operação pode ser desfeita.
Os edifícios existentes são preservados; **Configurar unidade** classifica-os.
A edição de uma unidade atualiza todos os seus edifícios.

## Configuração em lote

Escolha **Várias unidades — Excel / CSV**. Descarregue o modelo ou cole uma tabela
com estas oito colunas, pela ordem indicada:

```csv
pais;cidade;unidade;edificio;perfil;pisos;fuso;responsavel
PT;Lisboa;PT-LIS;Sede Lisboa;office;2;Europe/Lisbon;Equipa TI Portugal
DE;Berlim;DE-BER;Escritório Berlim;office;1;Europe/Berlin;Equipa TI Alemanha
```

Aceita ponto e vírgula, vírgulas ou tabulações, campos entre aspas e cabeçalhos
com acentos. O código do país tem duas letras; a unidade usa até 40 letras,
números, hífens ou sublinhados. Os perfis são `office`, `warehouse`, `datacenter`
e `empty`; os pisos vão de 1 a 10. O fuso usa identificadores como `Europe/Lisbon`
e `America/Sao_Paulo`. Pode importar até 100 edifícios por operação e 100 KB de CSV.

País + unidade identificam a filial. Vários edifícios podem pertencer à mesma
unidade se tiverem cidade, fuso e domínio de rede iguais. Os nomes de edifícios
são únicos dentro de cada unidade. A revisão valida a tabela inteira antes de
alterar o projeto; um erro impede a aplicação do lote. O exemplo é fictício.

## Endereços privados e pesquisa

Cada unidade nova recebe um domínio de endereçamento próprio. Um IP privado pode
repetir-se em domínios diferentes. Dentro do mesmo domínio, os IPs continuam a ser
únicos. Em **Configurar unidade**, use o mesmo domínio quando várias unidades
partilharem o mesmo espaço de endereçamento. Isto documenta a separação; não cria
VRFs, VPNs ou isolamento real de rede.

A árvore de navegação agrupa os locais por país e unidade. A pesquisa global
inclui códigos de unidade, cidade, país (código), responsável e domínio. O painel
da empresa filtra locais por país e por texto.

## Planos de VLAN por domínio

Em **Gerir redes / VLANs → Editar**, ative **Plano próprio** para cada domínio e
indique a sub-rede e o gateway. Por exemplo, a VLAN 10 pode usar `10.1.0.0/24`
na unidade de Lisboa e `10.2.0.0/24` no Porto. Os edifícios do mesmo domínio
partilham o plano, independentemente do país/unidade.

O ID, nome e cor da VLAN continuam partilhados; os planos de endereçamento são
independentes. Um domínio sem plano próprio herda a sub-rede/gateway gerais.
Um plano próprio com campos vazios deixa esses valores por documentar.
Os projetos antigos continuam a usar o plano geral, sem uma migração que
invente endereços. Auditoria documental, fichas, legendas por piso, dossier e
endereçamento em lote resolvem a rede no domínio do equipamento. Exportações
cifradas conservam os planos. Alterar o domínio de uma unidade muda o plano que
os seus equipamentos consultam; deve rever os IPs na verificação documental.

## Contas e organizações no servidor local

O modo sem contas mantém um projeto e uma identidade partilhados. Abra
**Ativar contas** no topo do editor, ou `/account`, para criar a primeira conta
administradora. A organização `default` conserva o projeto local existente.
Depois, em **Conta**, o administrador cria, atualiza e elimina contas da sua
organização, com papéis `admin`, `editor` e `reader`. A última conta administradora
não pode ser removida nem despromovida pela interface.

- Administrador: edita o projeto e gere as contas da organização.
- Editor: edita o projeto; não gere contas.
- Leitor: consulta projeto, inventário, anexos, histórico e auditoria; pedidos
  de escrita são recusados no servidor, incluindo os endpoints de importação.

A auditoria regista o utilizador autenticado. O servidor ignora cabeçalhos de
identidade enviados pelo navegador. Sessões usam cookies HttpOnly/SameSite,
expiram em oito horas e ficam inválidas com alteração da palavra-passe ou
remoção da conta. Os papéis são relidos em cada pedido. As palavras-passe são
armazenadas como derivações scrypt com salt. Há limitação de tentativas de login.
Rascunhos e retoma do assistente são separados por utilizador/organização.

Para criar outra organização ou recuperar uma conta através do sistema operativo:

```bash
read -rsp 'Palavra-passe: ' ATLAS_ACCOUNT_PASSWORD
export ATLAS_ACCOUNT_PASSWORD
npm run account -- set administrador admin outra-organizacao
unset ATLAS_ACCOUNT_PASSWORD
npm run account -- list
```

A variável é apenas lida pelo comando; não é escrita no `.env`. O ficheiro
`accounts.json` fica na pasta de dados, com permissões restritas. Guarde essa
pasta, a base SQLite, os anexos e o keyring nos backups. Contas locais não são
SSO empresarial nem permissões por unidade. A aplicação alojada mantém a
identidade autenticada fornecida pelo alojamento; esta gestão de contas pertence
ao servidor Node local. Para acesso remoto, termine HTTPS no servidor/proxy;
o modo de arranque documentado usa HTTP em loopback.

## Armazenamento e inventário paginado

O projeto passa a ser guardado em `atlas_workspaces` (metadados/revisão) e
`atlas_entities` (registos com índices por edifício, piso e sala). A migração
0006 copia os documentos antigos; `atlas_projects` conserva a cópia anterior
como backup de migração e deixa de receber gravações pela API. Histórico,
versões e auditoria anteriores são conservados.

O editor envia diferenças através de PATCH e o servidor valida o resultado
antes de gravar. Revisão, alterações e auditoria são aplicadas numa transação;
um conflito devolve 409 e uma falha reverte o lote. Só as entidades alteradas
são atualizadas. O histórico continua a guardar snapshots completos, até 100.

Abra **Inventário paginado** no topo do editor ou `/inventory.html`. As pesquisas
carregam páginas de 100 registos; o filtro de piso e **Abrir planta do piso**
consultam apenas equipamentos desse piso. A revisão é fixada durante a paginação;
se houver alterações, a consulta pede para repetir a pesquisa.

APIs de leitura autenticadas:

- `GET /api/project/manifest`: metadados, edifícios, pisos, salas e redes.
- `GET /api/inventory?floor=ID&q=TEXTO&limit=100&after=0`: equipamentos paginados.
- `GET /api/plant?floor=ID&limit=100&after=0`: equipamentos do piso, salas,
  bastidores e ligações incidentes. A vista omite extremos exteriores ao piso.
- `GET /api/project`: compatibilidade com o editor completo e exportações.

Os limites passam a 10 000 equipamentos, 30 000 ligações, 2 000 bastidores,
4 094 VLANs, 500 edifícios/pisos/salas e 200 versões. Um pedido de projeto JSON
aceita até 20 MB; um backup cifrado, até 28 MB. Os lotes de importação continuam
limitados a 200 linhas e os limites do assistente são conservados.

O editor completo e a validação de alterações ainda leem o projeto inteiro em
memória; a vista paginada é o percurso para consulta por piso. Não existe ainda
edição colaborativa em tempo real. `npm run bench:inventory` mede dados sintéticos
com 1 000/5 000/10 000 equipamentos em SQLite em memória; os resultados não
certificam carga multiutilizador, renderização de milhares de símbolos nem limites
do alojamento D1. Veja `docs/test-results/inventory-benchmark.json`.
