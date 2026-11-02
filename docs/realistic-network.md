# Configuração de interfaces e diagnóstico dos circuitos

O Atlas conserva o editor existente e passa a documentar a configuração de cada interface ativa. Esta é uma previsão documental: não existe descoberta de equipamentos, leitura por SNMP, execução de comandos nem medição da rede.

## Utilização

1. Selecione um equipamento ativo no mapa ou na pesquisa.
2. Abra o separador **Ligações** e **Configurar interfaces · VLANs e velocidade**.
3. Escolha a porta. Registe estado administrativo, meio físico, capacidade máxima e velocidades efetivamente suportadas em **Mbps** (por exemplo, `100, 1000`). Deixe por confirmar o que desconhece.
4. Documente autonegociação ou velocidade fixa, duplex, modo access/trunk/encaminhado, VLAN access, VLAN nativa e lista de VLANs permitidas. A VLAN nativa `0` significa tudo etiquetado. Num trunk, uma lista vazia não significa todas as VLANs: tem de escolher as permitidas.
5. Se aplicável, registe PoE: fonte PSE ou consumidor PD, potência e orçamento total do equipamento.
6. Pode editar várias portas antes de guardar. Mudar de porta conserva as alterações locais; apenas as interfaces editadas são acrescentadas à configuração.

Ao criar ou editar um cabo, a etapa **Confirmar** apresenta o diagnóstico do circuito. Em **Detalhes opcionais do cabo**, indique comprimento, categoria e instalação: patch cord ou ligação permanente. O diagnóstico acompanha a edição. A ficha do cabo e a **Verificação** apresentam as mesmas regras; o dossier técnico inclui as interfaces documentadas. As portas desativadas estão identificadas na ficha e a cinzento no bastidor 3D.

## Regras implementadas

- O circuito atravessa exclusivamente canais passivos correspondentes: F1 ↔ R1, F2 ↔ R2, etc. Termina nas interfaces ativas; não mistura portas de um switch nem prolonga o canal por um mini-switch.
- São somados os comprimentos de todos os cabos. Um comprimento desconhecido continua desconhecido; troços já medidos que excedem o limite geram uma observação mesmo se faltar medir outro troço.
- Como referência para cablagem estruturada de cobre, verifica 100 m para o canal completo e 90 m para cada ligação permanente explicitamente identificada. Cabos com capacidades, bitolas ou condições especiais exigem verificação própria. [Fluke Networks: Copper Cabling](https://download.flukenetworks.com/Download/Asset/7002941-a-en.pdf)
- A velocidade prevista exige uma velocidade comum documentada nas duas interfaces, respeitando as capacidades declaradas dos cabos e as velocidades fixas. A capacidade máxima isolada não prova quais as velocidades intermédias suportadas. Shutdown, meios incompatíveis, velocidades fixas diferentes e conflitos de duplex são identificados. [Cisco: Ethernet auto-negotiation](https://www.cisco.com/c/en/us/support/docs/lan-switching/ethernet/10561-3.html)
- Para 10 Gbps em cobre a 100 m, sinaliza categorias abaixo de Cat 6A. Acima de 10 Gbps, exige confirmação adicional; não aplica automaticamente o alcance genérico. [HPE Aruba: Transmission distance](https://arubanetworking.hpe.com/techdocs/Switches/xcvrs/xcvr_guide/Content/GUID-FC7DD7AC-012F-41B5-A02F-A3ADBBB23E86.html)
- Identifica diferenças de VLAN nativa, trunks sem VLAN comum, listas permitidas divergentes e incompatibilidade entre VLAN access e VLAN documentada no terminal. VLANs locais diferentes em duas portas access são uma observação, pois uma tradução pode ser intencional. [Cisco: Troubleshoot LAN switching](https://www.cisco.com/c/en/us/support/docs/lan-switching/ethernet/12006-chapter22.html)
- PoE segue o mesmo circuito de cobre e verifica fonte desligada, potência pedida superior à disponível e reserva máxima das portas ligadas face ao orçamento global. A reserva excessiva é aviso, não prova de consumo real. Norma/classe negociada, perdas e potência útil no PD continuam por confirmar. [Cisco: Troubleshooting PoE](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3750/software/troubleshooting/g_power_over_ethernet.html)
- A auditoria IPv4 também identifica endereços de rede e broadcast usados em equipamentos, preservando o caso de sub-redes /31.

## Compatibilidade e limites

Projetos existentes continuam válidos sem migração. Os campos opcionais `devices[].portProfiles`, `devices[].poeBudgetWatts` e `links[].installation` são preservados na gravação, exportação e histórico. A validação estrutural corre no navegador e no servidor. Uma VLAN referida por uma interface não pode ser eliminada.

O modelo distingue **compatível**, **por rever** e **incompatibilidade**, sempre com base no que foi registado. Dados desconhecidos não passam a factos medidos. É possível guardar um planeamento ainda incompatível para o corrigir; a escolha de um cabo com meio explicitamente incompatível com a interface é rejeitada no assistente de ligação.

O percurso físico e a simulação de falhas anteriores continuam a representar topologia. Não simulam encaminhamento IP, ACLs, NAT, STP, LACP, DHCP, DNS ou tráfego real. Interfaces encaminhadas são registadas e sinalizadas para verificação. Fibra é sempre assinalada para confirmação de transceivers, comprimento de onda, tipo de fibra e orçamento ótico. O modelo não certifica a instalação nem determina throughput medido.
