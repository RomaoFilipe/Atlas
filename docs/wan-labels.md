# Circuitos WAN e etiquetas QR

## Ligações entre locais

Abra **Ligações entre locais**, na navegação lateral. O diagrama mostra ligações
de dados existentes entre edifícios, com país, unidade e nome do local, mantendo
as plantas dos pisos separadas. Não inclui ligações de alimentação.

Pode filtrar por país ou local. Um filtro mantém os extremos remotos dos circuitos
para não esconder onde terminam. Para mapas extensos, o diagrama mostra até 24
locais e indica o limite; a lista mantém todas as ligações do filtro, paginadas.
A exportação SVG corresponde ao diagrama visível.

Em **Nova ligação entre locais**, escolha os locais e os equipamentos, e continue
no assistente de ligação existente para escolher o meio, as portas e confirmar.
As ligações virtuais não ocupam portas físicas.

Em **Ficha WAN**, registe:

- Operador e referência do circuito/contrato.
- Serviço (Internet, MPLS, VPN, SD-WAN, fibra dedicada ou outro).
- Capacidade contratada em Mbps e estado declarado.
- Função principal ou alternativa e o circuito principal correspondente.

O circuito alternativo só pode referir um principal entre os mesmos locais.
Não pode referir-se a si próprio nem a outro alternativo. Se o principal for
removido, o alternativo mantém-se, com o principal por identificar.
**Retirar ficha WAN** remove só os dados contratuais; **Portas e cabo** abre a
ligação física/virtual existente.

Os estados são documentados pelo utilizador. Esta vista não mede disponibilidade,
não configura VPNs e não prova redundância operacional.

## Etiquetas de equipamentos e tomadas

Abra **Equipamentos → Etiquetas QR**. Ative a identificação do projeto uma vez e
aguarde a confirmação da gravação. Sem essa gravação, a impressão fica desativada.
Se houver uma falha de gravação, use **Guardar projeto / tentar novamente**;
conflitos entre sessões exigem resolver a gravação antes de imprimir.

Confirme o endereço da aplicação que será incluído nos códigos. Para leitura num
telemóvel, use o IP ou nome acessível na rede, e não `localhost`. Um nome de rede
estável evita reimprimir etiquetas quando o endereço IP do servidor mudar.

Filtre por edifício, piso e sala, escolha os equipamentos e reveja as primeiras
etiquetas. Existem dois modos:

- **Equipamentos físicos**: uma etiqueta por equipamento, sem VMs.
- **Saídas das tomadas**: uma etiqueta por canal frontal (F1, F2…), com acesso à
  ficha e ao contexto da porta correspondente.

A impressão abre uma folha A4, com etiquetas de **63 × 34 mm**, até 100 por lote.
Cada página comporta 21 etiquetas. Use escala de 100% e desative cabeçalhos e
rodapés do navegador. Teste numa folha normal antes de usar papel autocolante.
O endereço IP do equipamento só é impresso se ativar essa opção. As etiquetas
são legíveis e não são um backup cifrado.

Os códigos são gerados localmente, sem enviar o inventário a um serviço externo.
Incluem o endereço da aplicação, a identificação do projeto, o equipamento e,
quando aplicável, a porta. Não incluem chaves nem credenciais. A leitura mantém
as condições de acesso existentes: no modo local, o projeto é partilhado na rede;
no alojamento autenticado, é necessário o acesso correspondente.

## Abrir uma etiqueta e restaurar projetos

A leitura do QR abre a ficha do equipamento. Nas tomadas, mostra também o canal
e a ligação documentada, com um botão para consultar ou configurar o cabo.
Abrir a etiqueta não modifica dados.

Uma etiqueta de outro projeto, de um equipamento removido ou de uma porta que já
não existe apresenta uma mensagem de erro. A identificação do projeto é
preservada nos backups e versões que a contenham. Para conservar as etiquetas,
restaure um backup desse mesmo projeto com a identificação original. Um projeto
novo ou uma importação de outro projeto não herda essa identificação.

A geração usa `qrcode-generator` 1.4.4, incluído com licença MIT em
`public/vendor/`; a adaptação limita-se à exportação como módulo ES.
