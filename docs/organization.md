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

## Âmbito atual

Este é o suporte de organização multinacional dentro do modelo atual, com
compatibilidade com projetos de versão 3. O modo local continua a ter um utilizador
e um projeto partilhado; não constitui isolamento entre empresas. O alojamento
Sites mantém a separação por utilizador já existente.

Os limites atuais continuam a ser 500 elementos por lista principal, 500 pisos,
500 salas, 200 versões e aproximadamente 1,5 MB por documento de projeto.
As VLANs e sub-redes continuam definidas ao nível do projeto; não há planos de
VLAN independentes por domínio. Não foi feita uma validação de carga para milhares
de equipamentos ou utilizadores simultâneos.

Para operação empresarial partilhada em grande escala, continuam necessários
organizações no servidor com permissões por unidade, autenticação empresarial,
registo de auditoria, armazenamento paginado por entidade e testes de carga.
