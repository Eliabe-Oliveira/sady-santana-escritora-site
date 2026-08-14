# Sady Santana

## Deploy Vercel

O renderer editorial permanece um core HTTP baseado em `Request`/`Response`, gerado por `build.mjs`. O adapter Cloudflare continua exportado por `dist/server/index.js`; a Vercel Function Node em `api/index.mjs` converte a requisição e a resposta sem duplicar a lógica editorial. `vercel.json` encaminha somente as rotas dinâmicas, deixando os arquivos de `public/` a cargo da Vercel.

Para instalar, gerar o core e executar os testes localmente:

```bash
npm ci
npm test
```

O teste automatizado chama o adapter Vercel diretamente como handler Node. Os builds disponíveis continuam sendo `npm run build` e `npm run build:pages`.

Cadastre posteriormente na Vercel, para Production e Preview:

```text
PUBLIC_SANITY_PROJECT_ID=zwhnxf2h
PUBLIC_SANITY_DATASET=production
SANITY_API_VERSION=2025-02-19
PUBLIC_SITE_URL=https://escritorasady.com.br
```

O Sanity usa o dataset público e não requer token de leitura. O canonical permanece `https://escritorasady.com.br` também em previews. O domínio e o redirect permanente de `www` serão conectados posteriormente; o DNS continua na UOL Host nesta etapa.
