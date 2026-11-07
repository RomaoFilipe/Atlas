# Criar espaço — Atlas

A página `/register` usa o conceito escuro aprovado: apresentação do espaço à
esquerda, formulário à direita, campos grafite, verde-lima e percurso ciano.
Em ecrãs pequenos o formulário vem primeiro. O login partilha o mesmo layout,
com texto e formulário próprios.

O formulário mantém os quatro campos, a validação no servidor e o destino
`/editor.html?welcome=1`. Mostrar palavras-passe é uma melhoria progressiva:
sem JavaScript, o registo continua funcional. Cada controlo de visibilidade tem
nome acessível e estado; erros do servidor recebem foco e não repetem segredos.
O movimento da ilustração pode ser pausado, respeita movimento reduzido e pausa
quando o separador está oculto. O escritório é uma imagem, com SVG animado e
efeito de profundidade ao rato; não é um modelo 3D rotativo.

Implementação: `scripts/registration-page.mjs`, `public/registration.css`,
`public/registration.js`. Recurso visual: `public/images/atlas-workspace.webp`.
A autenticação permite explicitamente o acesso público apenas a estes recursos.

Imagem criada com a ferramenta integrada `image_gen`, usando como referência
a proposta de registo aprovada. Saída convertida para WebP com canvas do browser.

Prompt final:

> Create a standalone website illustration asset extracted and faithfully recreated from the LEFT illustration of this ATLAS registration page reference. Only the beautiful isometric cutaway single-floor office miniature, desks and monitors at front, glass meeting room behind, plants, and a detailed black server rack on the right. Same dark graphite architecture, smoked glass, warm amber interior lights, elegant premium architectural rendering, same camera angle. Floor sits on subtle cyan wireframe blueprint grid extending slightly beyond edges. Center entire office with full building visible, filling the frame, on a near black #070d12 background smoothly fading into that exact solid color at all edges. Square composition, clean premium quality. REMOVE all text, labels, logos, UI, form, diagonal lime line, decorative footer and navigation. REMOVE glowing cable route and dots: those will be implemented as animated SVG overlays. No typography anywhere. No extra stories, no people. Just this faithful beautifully detailed office floor architectural miniature on dark background.

## Login

A página `/login` reutiliza o layout, os ícones, a ilustração existente e as
animações, com “Bem-vindo de volta.” e os campos email/utilizador e palavra-passe.
Não foi gerada outra imagem. O formulário continua a funcionar sem JavaScript;
a opção de mostrar a palavra-passe é progressiva. O parâmetro `next` é conservado
nas tentativas falhadas e a validação de destinos continua no servidor.

Verificação: 341 testes do projeto e 7 testes de browser de login, registo e home,
incluindo erros, navegação por teclado, movimento reduzido, tamanhos de ecrã e
login sem JavaScript.
