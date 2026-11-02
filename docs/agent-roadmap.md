# Próximas evoluções do agente

Propostas futuras, ordenadas por utilidade para quem utiliza o Atlas. A base atual já dispõe de ferramentas de rede, execução validada, relatório e opção de desfazer; o diagnóstico explicado já tem uma primeira versão entregue. As restantes propostas continuam por implementar.

| Prioridade | Ideia | Resultado para o utilizador | Critério de aceitação |
| --- | --- | --- | --- |
| Entregue · base | Diagnóstico com causas e próximos passos | Perguntar «Porque é que este PC não tem rede?» e receber o ponto documentado que interrompe o percurso e a informação em falta. | Cada conclusão aponta para equipamento, porta ou cabo concreto; diferencia falha conhecida de dado desconhecido e não promete acesso real à Internet. |
| Entregue · primeira versão | Revisão antes de aplicar | Antes de guardar uma alteração do agente, rever as operações e equipamentos envolvidos e aplicar ou cancelar. | Plano simulado e validado; cancelamento sem gravação; rejeição se o projeto mudar durante a revisão. A análise completa de impacto em todos os percursos e VLANs continua por fazer. |
| 2 | Impacto de rede antes da alteração | Antes de mudar uma VLAN ou desligar uma porta, ver todos os postos e percursos dependentes. | Comparação antes/depois e lista de dependências que atravessam VLANs, portas e percursos partilhados. |
| 3 | Tarefas genéricas com retoma | Preparar uma unidade, interromper e continuar no passo certo após recarregar. | Checkpoints, verificação de revisão, ausência de duplicados, retoma após falha de gravação e desfazer compatível com o histórico. |
| 4 | Correções transformadas em exemplos revistos | Quando o agente falha, conservar um caso de teste corrigido para evitar regressões. | Captura opcional sem dados privados, revisão explícita, resultado esperado verificável e conjunto de avaliação separado. Não equivale a treino automático. |
| 5 | Perfis de instalação reutilizáveis | Aplicar um padrão de escritório, loja ou escola com configurações de portas e checklists. | Mostrar o que será criado/reutilizado, adaptar capacidades ao material existente e deixar endereços desconhecidos pendentes. |
| 6 | Entrega técnica assistida | Gerar mapa de portas, etiquetas, fotografias e pendências para entregar ao cliente. | Dossier limitado às unidades autorizadas e identificação clara de campos incompletos; reutiliza os relatórios existentes. |
| 7 | Laboratório de avarias | Testar a quebra de um uplink ou indisponibilidade de um switch e explicar o impacto previsto. | Simulação isolada e reversível, rotulada como previsão; valida redundância documentada sem alterar hardware. |
| 8 | Comparar registos com o terreno | Importar ou recolher informação real de equipamentos autorizados para encontrar diferenças. | Integração inicialmente só de leitura, evidência com data, credenciais separadas do modelo e reconciliação antes de atualizar o projeto. |

A recomendação seguinte é aprofundar o diagnóstico e avançar com impacto de alterações e retoma de tarefas. Cada evolução deve ter exemplos de sucesso, dados em falta, falta de permissão, conflito entre sessões e execução repetida.
