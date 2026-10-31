# Vários clientes, manutenção e trabalho offline

As funcionalidades desta fase são utilizadas a partir da navegação da página
Hoje. A gestão de contas, vários clientes e o agendador pertencem ao servidor
Node local. As APIs conservam a separação por proprietário no alojamento; esta
fase não instala SSO, cron de alojamento, email nem serviços de notificações.

## Uma conta técnica, vários clientes

Ative contas em `/account`. Em **Clientes**, o administrador pode criar um código
de cliente novo. Uma conta existente pode receber acesso a esse cliente através
de **Conta**, com papel e unidades próprios; não é necessário criar outra
palavra-passe nem terminar sessão. O administrador de um cliente não pode alterar
a palavra-passe principal de uma conta pertencente a outro cliente.

Cada pedido API é associado ao cliente selecionado no separador, verificado
contra as concessões da conta. Mudar num separador não muda o destino dos pedidos
noutro. Os links de Conta também conservam esse contexto. Remover uma concessão
bloqueia os pedidos seguintes desse cliente; a conta mantém os outros acessos.
O último administrador de um cliente não pode ser removido. Não é possível
assumir um código de cliente que já exista.

Contas antigas mantêm o cliente principal, papel, unidades e palavra-passe.
Concessões adicionais são guardadas em `memberships` no ficheiro de contas, sem
copiar os documentos dos projetos. Um novo cliente inicia um projeto vazio.

## Manutenção recorrente

Em **Manutenção**, escolha edifício, equipamento opcional, intervalo de 1–120
meses, primeira data, responsável e checklist. É possível pausar e retomar o plano.
Os passos ficam guardados no plano como um snapshot; editar a biblioteca não os
substitui silenciosamente. Ao editar o plano, pode conservar, substituir ou retirar
a checklist das ocorrências futuras.

O servidor local verifica os planos a cada 60 segundos enquanto está iniciado.
O botão **Gerar tarefas vencidas** permite a mesma verificação manual. A ocorrência
é identificada pelo plano e data; pedidos concorrentes não criam duplicados.
Criar a tarefa, avançar o plano, registar histórico e criar o aviso são atómicos.
Se a gravação falhar, a data não avança.

O dia de referência é conservado: uma recorrência do dia 31 usa o último dia de
fevereiro e regressa ao dia 31 no mês seguinte. Cada verificação cria no máximo
uma ocorrência vencida por plano; períodos de inatividade são recuperados ao longo
das verificações seguintes. Não depende de o browser estar aberto, mas o processo
Node tem de estar ativo. Não existe um serviço do sistema instalado automaticamente.

Um responsável sem acesso técnico à unidade ou um equipamento eliminado/abatido
impede essa ocorrência. A verificação manual apresenta os planos a rever. As
ocorrências já criadas conservam a checklist, prazo e histórico próprios.

## Checklists

A biblioteca permite modelos por edifício ou, para contas sem limitação por
unidade, modelos da organização inteira. Use até 30 passos:

- Uma linha normal: confirmação de verificação.
- `texto: Resultado do teste`: resultado escrito obrigatório ao concluir.
- `foto: Fotografar instalação`: fotografia associada à tarefa.
- `opcional: ...`: passo não obrigatório.

Associe o modelo ao criar uma tarefa ou plano. Na tarefa, assinale os passos,
registe os resultados e carregue as fotografias. Uma tarefa não pode ser resolvida
sem completar os passos obrigatórios e escrever uma resolução. O servidor valida
as evidências e o âmbito do ficheiro. Autoria e data dos passos ficam no histórico
da tarefa. Alterar um modelo não altera tarefas existentes.

A migração 0008 cria um registo de ficheiros por cliente/edifício e importa as
referências já existentes. Uploads limitados a unidades exigem um edifício
autorizado. Evidências de outra unidade não podem ser associadas à checklist.

## Notificações configuráveis

Em **Notificações**, cada pessoa escolhe, separadamente por cliente, atribuições,
prazos próximos, resoluções, manutenção e entregas. A antecedência dos prazos é
configurável de 1–30 dias. Atribuições e decisões criam avisos na transação da
alteração; avisos de prazo são calculados ao consultar a caixa, sem repetição do
mesmo prazo/tarefa/destinatário.

Os avisos respeitam o acesso atual às unidades e podem ser marcados como lidos.
Desativar uma categoria afeta avisos futuros; não elimina o histórico da caixa.
O contador da navegação é atualizado ao abrir uma página. São avisos internos:
não há envio de emails, SMS, mensagens externas nem Web Push.

## Fichas e intervenções offline

Num navegador com suporte a Service Worker e IndexedDB, através de HTTPS ou
localhost, abra **Offline** com ligação e descarregue uma unidade. É necessário
aguardar a confirmação da descarga antes de desligar a rede.

As fichas descarregadas ficam disponíveis durante 24 horas, vinculadas à conta,
cliente e concessões verificadas. São guardados inventário e intervenções da
unidade selecionada; fotografias/documentos anteriores não são descarregados.
O acesso inicial, outra conta ou outro cliente exigem autenticação e uma descarga
própria. O manifesto permite adicionar o Atlas ao ecrã principal quando o
navegador disponibiliza essa opção; não existe uma aplicação de loja instalada
automaticamente. Depois de uma descarga explícita, a identidade offline é
conservada neste dispositivo para reabrir a aplicação sem rede dentro da janela
de 24 horas. Sem contas ativadas, a identidade continua a ser a local partilhada.

Na ficha, registe título, data, resultado, estado, próxima revisão e fotografia.
Sem rede, esses dados e o ficheiro ficam numa fila IndexedDB neste dispositivo.
Uma nova tentativa atualiza o mesmo registo pendente, conservando a fotografia.
O Atlas indica claramente que ainda não foi guardado no servidor.

Ao voltar a ter ligação, escolha **Sincronizar**. A aplicação volta a verificar
sessão, conta, cliente, papel e existência/acesso ao equipamento. Conserva campos
não editados e deteta alterações nos campos editados. Uma intervenção já guardada
com o mesmo ID e conteúdo não é repetida, mesmo que a resposta se tenha perdido.
Ficheiros carregados antes de um conflito são reutilizados na nova tentativa.

Os conflitos ficam pendentes. **Rever diferenças** apresenta o trabalho e a ficha
atual; aplicar os campos editados é uma decisão explícita. Se a ficha mudar outra
vez durante a revisão, é pedida nova revisão. Uma perda de permissão não é
ultrapassada pelo modo offline: a sincronização é recusada, mantendo o trabalho
local para recuperação autorizada.

A cache da aplicação contém apenas ficheiros estáticos; não interceta nem guarda
respostas API. As descargas privadas e a fila ficam separadas por conta/cliente
no IndexedDB. Sair da conta limpa a identidade ativa; dados já descarregados
permanecem no dispositivo até serem eliminados pelo utilizador; o acesso às
fichas expira ao fim de 24 horas. Intervenções pendentes não são eliminadas pela
expiração e podem ser recuperadas após autenticação autorizada. Sem
rede, não é possível saber de uma revogação ocorrida no servidor; a janela local
é limitada a 24 horas e a autorização é sempre verificada ao sincronizar.

Não limpe os dados do browser nem use **Eliminar descargas e intervenções
pendentes** antes de sincronizar o trabalho que pretende conservar. O botão pede
confirmação e elimina os ficheiros locais, incluindo fotografias pendentes.

## Entregas, correções e confirmação

Gere o relatório normal e escolha **Disponibilizar para revisão do cliente**.
É guardado um snapshot da unidade autorizada, configuração do relatório,
pendências e imagens incorporadas. O cliente consulta-o em **Entregas** e uma
conta de leitura pode aceitar ou pedir correções. Pedir correções exige comentário.

A decisão guarda autor, data e versão. O técnico pode preparar nova revisão
apenas depois de serem pedidas correções. A versão anterior continua consultável;
uma versão aceite não pode ser substituída. Revisões concorrentes são recusadas.
Versões e eventos têm proteção contra UPDATE/DELETE na base de dados.

Esta confirmação é um registo de aceitação dentro do Atlas. Não é uma assinatura
digital certificada. Não cria links públicos nem envia relatórios por email.

## Importação orientada de Excel e CSV

Em **Importar**, cole uma tabela do Excel ou carregue CSV/TSV, até 100 KB e 200
linhas. Ficheiros XLSX não são abertos diretamente; use colagem ou exporte CSV.

1. Associe as colunas, confirmando Nome e Tipo. Colunas desconhecidas podem ser ignoradas.
2. Escolha sala de destino quando a localização não vem na tabela e o modo de adição/atualização.
3. Associe tipos desconhecidos, corrija células e desmarque linhas duplicadas ou indesejadas.
4. Valide a proposta e reveja novos, alterados, ignorados e cada cabo numa mudança de localização.
5. Aplique apenas depois de não haver erros e de completar as decisões por cabo.

A proposta usa as validações do importador existente. Atualizações por ID/série
não alteram tipo, quantidade física de portas ou montagem sem revisão na ficha.
Um erro impede o lote inteiro. Alterar fonte, mapeamento, sala, modo ou células
invalida a proposta anterior. Um conflito de revisão conserva a tabela para nova
validação; nenhum dado é enviado a um modelo ou serviço externo.
