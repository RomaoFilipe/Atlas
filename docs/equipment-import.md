# Importar equipamentos e acompanhar pendências

## Importar inventário de Excel / CSV

Abra **Equipamentos → Importar Excel / CSV**, ou **Empresa e unidades → Importar
equipamentos**. Selecione a sala de destino, cole a tabela ou carregue um CSV/TSV.
O ficheiro pode ter até 100 KB e 200 equipamentos; mantém-se o limite global de
500 equipamentos por projeto.

As únicas colunas obrigatórias são **Nome** e **Tipo**:

```csv
Nome;Tipo;IP;VLAN;Modelo;Serie;Responsavel
PC-001;Computador;192.168.1.10;;Modelo conhecido;SN-001;Equipa TI
IMP-001;Impressora;192.168.1.20;;;SN-002;Equipa TI
```

Cabeçalhos e tipos não distinguem maiúsculas de minúsculas nem acentos. Também
aceita cabeçalhos como `Name`, `Type`, `Serial Number`, `Owner`, `Building`, `Floor`
e `Room`. PC, laptop, printer, socket e AP são reconhecidos como tipos físicos.
As colunas desconhecidas são listadas na revisão e não são importadas.

Colunas opcionais:

| Colunas | Utilização |
| --- | --- |
| IP, VLAN, Modelo | Informação de rede e fabricante/modelo. A VLAN tem de existir. |
| Serie, Responsavel, Estado | Ficha de identidade; estados: Em serviço, Em reserva, Em manutenção, Abatido. |
| Pais, Unidade, Edificio, Piso, Sala | Localização por linha para lotes distribuídos por vários locais. |
| Bastidor, U, Altura U | Instalação em bastidor. U vazia procura uma posição livre. |
| Portas | Número de portas. Se vazio, usa o padrão do tipo, visível na revisão. |

Sem colunas de localização, todas as linhas usam a sala escolhida. Para vários
locais, indique edifício, piso e sala; país e unidade resolvem nomes repetidos.
Pode usar apenas Sala, ou Piso e Sala, para outras salas do edifício escolhido.
Uma localização ambígua impede a importação.

O lote adiciona equipamentos físicos. Não atualiza equipamentos existentes nem
cria VMs, cabos, redes ou IPs por dedução. Nomes repetidos no mesmo edifício,
números de série já existentes, IPs repetidos no mesmo domínio, unidades U
ocupadas, salas protegidas ou sem espaço são apresentados com o número da linha.
Se existir qualquer erro, nenhum equipamento do lote é aplicado.

A revisão mostra a localização, o tipo, as portas, o IP e a posição U de cada
registo. Só depois de confirmar é que os dados são alterados. As posições na planta
são sugeridas em espaços livres; confirme-as no local. Se a sala estiver cheia,
ajuste as suas medidas ou distribua os equipamentos por outras salas.
A importação pode ser desfeita como uma única operação.

## Pendências e capacidade

O botão **Pendências e capacidade** apresenta verificações dos dados guardados,
com filtros por país, unidade e categoria. As listas são paginadas e incluem atalhos
para a ficha, ligação, configuração do equipamento ou classificação da unidade.

- Erros de configuração encontrados pelas verificações de rede existentes.
- Garantias vencidas e garantias que terminam nos próximos 90 dias, incluindo hoje.
- Equipamentos em serviço sem ligação de dados documentada.
- Responsáveis por atribuir e locais ainda sem país/unidade.
- Portas livres registadas em switches e mini-switches, e unidades U ocupadas.

Os equipamentos abatidos não geram pendências de ficha, garantia ou ligação,
nem contribuem para a capacidade de portas. Equipamentos em reserva ou manutenção
não geram uma pendência apenas por estarem desligados. Equipamentos sem estado
são incluídos nas verificações de ligação. As unidades U continuam ocupadas
até retirar o equipamento do bastidor no modelo.

A referência das garantias é a data UTC apresentada no painel. Estas listas
não enviam notificações. Os indicadores descrevem a documentação e não medem
tráfego, disponibilidade, consumo ou conectividade da infraestrutura real.
