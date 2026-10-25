# Melhorias prioritárias para utilização empresarial

A revisão desta versão concentrou-se em reduzir trabalho repetitivo e tornar
visíveis as tarefas de documentação. Foram implementadas a importação de
inventário, a vista de pendências/capacidade, as fichas e o diagrama WAN e as
etiquetas QR associadas ao projeto. O modelo atual continua a ser
um documento de projeto partilhado no modo local, com os limites descritos em
[organization.md](organization.md).

As próximas alterações com maior impacto são:

| Prioridade | Melhoria | Problema concreto | Critério de aceitação |
| --- | --- | --- | --- |
| 1 | Contas e permissões por organização/unidade | O modo local atribui a mesma identidade a todos os visitantes. A organização por país é uma classificação, não uma fronteira de acesso. | Administradores, editores e leitores têm permissões verificadas no servidor; um utilizador sem acesso não consegue ler projetos ou anexos de outra organização. |
| 1 | Planos de rede por domínio | As unidades já permitem repetir IPs, mas as VLANs/sub-redes ainda são globais no projeto. | Duas unidades podem usar VLAN 10 com sub-redes diferentes; formulários, verificação, cablagem, migração e exportações mantêm o domínio correto. |
| 1 | Base de dados por entidade e paginação | O projeto inteiro é validado, transferido e gravado como um documento, com limite de 500 equipamentos. | Carregar uma planta consulta apenas os seus dados; pesquisa e inventário são paginados; alterações não regravam a organização inteira; existem testes de carga com volumes definidos. |
| 2 | Atualizar inventário a partir de CSV | A importação atual adiciona equipamentos e impede duplicados; não sincroniza inventários existentes. | Pré-visualização separa novos, alterados e ignorados, identifica por ID/série e pede revisão de mudanças de local e respetivos cabos. |
| 2 | Auditoria de alterações | As versões e intervenções manuais existentes não são um registo imutável de quem alterou cada objeto. | O servidor regista ator, data, entidade e alteração; o registo não é editável pelo editor do projeto. |
| 3 | Recolha de inventário em rede | A documentação é preenchida manualmente ou importada. | Um coletor autorizado propõe equipamentos e ligações; o técnico revê antes de aplicar; a recolha não configura os equipamentos. |

Identidade, permissões e armazenamento devem preceder uma utilização partilhada
em grande escala. A escolha do serviço de autenticação e o dimensionamento
precisam de requisitos concretos de utilizadores, países, equipamentos e acesso
remoto. Não foram implementados nesta alteração.
