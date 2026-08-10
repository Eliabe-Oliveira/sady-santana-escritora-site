# Sistema editorial de movimento

## Metáfora e intenção

O movimento do site traduz a ideia de **um livro que ganha vida durante a leitura**. Ele deve orientar o olhar com silêncio, ritmo e continuidade — nunca competir com o texto, transformar a interface em espetáculo ou atrasar o acesso ao conteúdo.

## Timings oficiais

| Escala | Token | Faixa | Uso |
| --- | --- | --- | --- |
| Microinteração | `--motion-micro` | 180–260ms | links, setas, foco e botões |
| Componente | `--motion-component` | 280–420ms | header e estados de componentes |
| Seção | `--motion-section` | 550–750ms | entradas editoriais no viewport |
| Stagger | `--motion-stagger` | 70–120ms | sequência entre elementos relacionados |

Os valores-base são 220ms, 360ms, 680ms e 90ms, respectivamente.

## Distâncias e escala

- Reveal vertical: no máximo `24px` (`--distance-reveal`).
- Reveal horizontal: no máximo `18px` (`--distance-reveal-inline`).
- Escala: nunca superior a `1.02`; a imagem do hero parte de `1.015`.
- Em telas de até 900px, distâncias e delays são reduzidos para priorizar leitura imediata.

## Easings

- `--ease-editorial`: entrada editorial precisa, desacelerando com naturalidade.
- `--ease-soft`: transições contemplativas e mais longas.
- `--ease-out`: resposta rápida de microinterações.

Easings elásticos, bounce e overshoot não fazem parte da linguagem.

## Gramática declarativa

Elementos com `.reveal` permanecem visíveis por padrão. Quando o navegador confirma JavaScript, suporte a `IntersectionObserver` e ausência de preferência por movimento reduzido, `html.motion-ready` habilita o estado inicial.

- `data-reveal="up"`: entrada vertical padrão.
- `data-reveal="left"`: entrada horizontal de até 18px.
- `data-reveal="soft"`: presença por opacidade e deslocamento mínimo.
- `data-reveal="scale"`: entrada com escala discreta, sem alterar layout.
- `data-delay="1"` a `data-delay="5"`: stagger em passos de `--motion-stagger`.

O observer revela uma única vez e remove a observação imediatamente. Sem JavaScript ou sem `IntersectionObserver`, todo o conteúdo continua legível.

## Princípios

- Movimento silencioso acompanha a hierarquia editorial.
- Texto nunca fica permanentemente oculto nem ilegível durante leitura longa.
- Entradas usam `transform` e `opacity`, evitando layout shift.
- Não animar `width`, `height`, `top`, `left`, `margin` ou `padding` quando transform resolve.
- Evitar muitas animações simultâneas e não repetir reveals agressivamente.
- Não usar `will-change` permanente.
- Touch e teclado recebem acesso completo; nenhuma ação depende de hover.
- Não há scroll hijacking, parallax mobile ou biblioteca de smooth scroll.

## Viewports

### Mobile — 320, 360, 390, 412 e 768px

- Distâncias e stagger reduzidos.
- Hero e texto permanecem legíveis desde o primeiro frame.
- A imagem não recebe parallax.
- Hover é complementar; foco e toque preservam toda a funcionalidade.

### Desktop — 1024, 1280, 1366 e 1440px

- A coreografia completa do hero usa stagger curto e previsível.
- A imagem abre em `scale(1.015)` e repousa em `scale(1)`.
- Header ganha profundidade discreta após sair do topo, sem mudar dimensões.

## Movimento reduzido

Em `prefers-reduced-motion: reduce`, reveals, coreografia do hero, transições decorativas e vento das flores são desativados. O scroll volta a ser instantâneo e todo o conteúdo é exibido no estado final.

## Padrões aplicados

- **Sobre:** fotografia revelada como uma página, seguida por legenda, kicker, título, colunas, linha e fatos em uma sequência única de seção.
- **Livros:** troca de ficha editorial em fases de saída, atualização e entrada; capa antecede os detalhes e cliques sucessivos cancelam a transição anterior.
- **Palestras:** heading e linhas temáticas entram em stagger; em dispositivos com hover, cada linha responde apenas de modo ambiental.
- **Fechamento:** ornamento, kicker, título, texto, status e chamada encerram a página em progressão silenciosa.
- **Acervo de artigos:** hero e introdução entram em sequência curta; linhas, filtros e paginação respondem por `transform`, cor e opacidade, sem deslocar o layout.
- **Leitura de artigo:** cabeçalho e capa estabelecem a entrada da página; relacionados e chamada de livros fecham a leitura com um único reveal cada.
- **Corpo do artigo:** não animar a prosa durante o scroll. Parágrafos, subtítulos, listas, citações, links e imagens permanecem estáticos para preservar concentração e ritmo de leitura.

Todos os padrões permanecem visíveis sem JavaScript ou sem `IntersectionObserver` e tornam-se imediatos com movimento reduzido.
