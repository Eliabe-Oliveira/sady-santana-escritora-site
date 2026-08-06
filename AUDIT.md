# Auditoria técnica e arquitetura editorial

## Estado inicial

- Stack entregue: HTML, CSS e JavaScript sem framework em produção, empacotados por scripts Node.js como Cloudflare Worker (`dist/`) e como GitHub Pages (`docs/`).
- Há um protótipo parcial no App Router do Next.js em `app/`, mas `package.json` não declara Next ou React; portanto ele não é a origem do deploy atual. O arquivo `next.config.mjs` não informa versão.
- Gerenciador: npm 8.5.1; runtime local: Node 12.22.9.
- Rotas anteriores do Worker: `/`, `/artigos`, `/robots.txt`, `/sitemap.xml` e `/api/inscrever`.
- Renderização anterior: HTML embutido no Worker; uma cópia inteiramente estática é gerada em `docs/`.
- Artigos demonstrativos estavam escritos diretamente em `static/articles.html`, com links externos. Eles não foram apagados do histórico do arquivo-fonte durante a auditoria, mas o build do Worker substitui a lista pelo CMS.
- Componentes editoriais: `static/articles.html`, regras `.articles-*` em `app/globals.css` e comportamento geral em `static/site.js`.
- Build: `node build.mjs`; build alternativo para Pages: `node build-pages.mjs`.
- Deploy principal: metadados OpenAI Sites em `.openai/hosting.json`; a saída é um Worker compatível com Cloudflare. A pasta `docs/` aponta para GitHub Pages, mas não consegue atualizar conteúdo sem rebuild.
- Não havia variáveis Sanity, testes, lint, formatter ou checagem de tipos.
- Sitemap e metadados eram estáticos. Não existiam rotas individuais nem 404 editorial.

## Compatibilidade e decisão

O Worker pode consultar a API CDN pública do Sanity sem token, renderizar no servidor e atualizar a cada publicação. Essa é a menor mudança e preserva integralmente o visual. O cache de 60 segundos reduz chamadas. Rascunhos permanecem privados porque a consulta pública só usa documentos publicados e o dataset deve ser público apenas para leitura.

As rotas implementadas são `/artigos`, `/artigos/pagina/N` e `/artigos/[slug]`. Filtro e busca usam query string e funcionam por navegação HTML. O sitemap é montado em tempo de requisição. O artigo inclui metadados, Open Graph, JSON-LD, imagem responsiva do pipeline Sanity e 404.

## Limitações encontradas

1. O Git detectado tem raiz em `/home/eliabe`, branch `master`, nenhum commit e milhares de arquivos pessoais não rastreados. O `.git` local do workspace é somente metadado da ferramenta. Criar a branch solicitada nesse estado afetaria a pasta pessoal; por segurança, nenhuma branch ou commit foi criado.
2. Node 12 não executa o Sanity Studio 4. Use Node 20 ou 22 no painel/ambiente de desenvolvimento do Studio. O build do site permanece compatível com Node 12.
3. A saída GitHub Pages não oferece renderização dinâmica. O CMS funcional é servido pela saída Worker. `build:pages` continua sendo somente uma alternativa estática legada.
4. Preview de rascunhos e publicação agendada automática não foram habilitados. Uma data futura é segura e fica oculta, mas seu aparecimento depende da consulta dinâmica depois do horário.
5. A newsletter permanece visual. O endpoint responde claramente que a integração está pendente e não armazena endereços.

## Rollback

Restaure `build.mjs` e `package.json` a partir do controle de versão e remova `sanity/`, `lib/`, `scripts/`, `tests/` e a documentação. Como não houve deploy, a produção atual não foi alterada.
