# Evolução para utilização empresarial

A versão de 31 de outubro inclui planos de endereçamento por domínio, contas
locais por organização, papéis no servidor, autoria na auditoria, armazenamento
por entidade e uma vista paginada de inventário/plantas. Os detalhes operacionais
e as limitações estão em [organization.md](organization.md).

| Estado | Capacidade | Evidência / próximo passo |
| --- | --- | --- |
| Implementado | VLAN com sub-rede/gateway por domínio | Formulário, endereçamento do assistente, fichas, auditoria documental e dossier; herança do plano geral para projetos antigos. |
| Implementado no servidor local | Administrador/editor/leitor por organização | Sessões, gestão de contas, recusa de escritas no servidor e autor na auditoria; criação da primeira conta em `/account`. |
| Implementado | Entidades e gravação por diferenças | Migração preserva documentos antigos; PATCH com revisão, transação, auditoria e reversão de falhas. |
| Implementado | Consulta paginada e planta por piso | `/inventory.html`, manifest e APIs de consulta por piso; ensaio sintético com 1 000, 5 000 e 10 000 equipamentos. |
| Implementado no servidor local | Permissões por unidade e portal do cliente | Concessões por conta, filtragem no servidor e recusa de referências/ficheiros externos ao âmbito. |
| Implementado | Percursos de assistência e entrega | Hoje, preparação guiada, tarefas com histórico, ficha móvel, conflitos e relatório personalizado; ver customer-workflows.md. |
| Implementado no servidor local | Vários clientes por conta | Concessões por cliente e pedidos fixados ao contexto de cada separador, sem copiar projetos. |
| Implementado | Manutenção, checklists e avisos internos | Ocorrências idempotentes, evidências obrigatórias e preferências por pessoa/cliente. |
| Implementado | Consulta e intervenções offline | Descarga explícita, fila com fotografias, verificação de acesso e revisão de conflitos na sincronização. |
| Implementado | Aceitação de entregas e importação guiada | Snapshots por versão, decisões do cliente, mapeamento/correção de colunas e revisão antes de importar. |
| Pendente | SSO empresarial | Integrar fornecedor de identidade e provisionar memberships no alojamento; a gestão atual pertence ao servidor Node local. |
| Pendente | Editor inteiramente carregado por piso | O editor completo conserva operações globais e lê o projeto em memória; a consulta paginada já funciona separadamente. |
| Pendente | Carga multiutilizador e alojamento | Validar D1, histórico, anexos e concorrência com volumes e hardware de produção definidos. O benchmark atual usa SQLite em memória. |
| Pendente | Sincronização física do inventário | Definir revisão de alterações de tipo/portas/montagem; a atualização por CSV existente conserva essas alterações na ficha. |
| Pendente | Recolha autorizada em rede | Um coletor deverá propor inventário e ligações para revisão humana; não está implementado. |

As contas locais não são ativadas automaticamente durante desenvolvimento.
O utilizador escolhe as credenciais da primeira conta na interface ou no CLI.
