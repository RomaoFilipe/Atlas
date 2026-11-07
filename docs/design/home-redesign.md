# Home Atlas — conceito escuro

A home pública em `/` segue o conceito aprovado: fundo grafite e azul petróleo,
verde-lima, edifício de escritórios iluminado, percurso ciano e quatro etapas.
Os controlos, etiquetas, texto, portas e percursos são HTML/SVG reais. O edifício
é uma ilustração estática gerada por IA, com movimento de profundidade ao rato;
não é um modelo 3D que possa ser rodado. Planta e bastidor são demonstrações
ilustrativas, independentes dos projetos privados dos utilizadores.

## Movimento e interação

- Percurso SVG com pulsos contínuos e seleção automática de etapas.
- Seleção manual de PC, tomada, patch panel e switch, incluindo teclado.
- Pausa global das animações e da progressão automática.
- Modos campus, planta e bastidor; camadas física, lógica e operação.
- Revelação suave das secções ao fazer scroll.
- Movimento reduzido respeitado; pausa fora do ecrã e em separadores ocultos.

## Recurso visual

Ferramenta: geração de imagem integrada (`image_gen`), com o conceito escuro
como referência. A saída foi convertida para WebP através do canvas do browser,
sem dependências adicionais. Recurso publicado: `public/images/atlas-campus.webp`.
Apenas este recurso e a captura existente do produto foram acrescentados à lista
explícita de recursos públicos da autenticação local.

Prompt final usado para criar a ilustração:

> Extract and recreate ONLY the main cinematic three-storey office building illustration from this reference website concept as a standalone wide landscape website hero background asset. Preserve the exact architecture, camera angle, graphite concrete floor slabs, smoked glass, warm interior lights, office desks on upper floors and server racks on ground floor. The building fills most of the frame centered, with breathing room on sides. Background perfectly near black #070d12 with subtle petrol illumination, fading smoothly to near black at all edges. Keep the cyan technical perspective ground grid. REMOVE ALL text, headings, navigation, logos, buttons, labels, inset port closeup, bottom cards, UI, cable route, glowing cable pulses. No text anywhere. The building should be beautifully realistic, premium architectural miniature with exceptional details. Keep building fully in frame including roof and floor. This will have actual animated cable paths and actual HTML labels overlaid, so clean architecture only. Wide landscape 3:2 composition.
