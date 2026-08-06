# Configuração externa do Sanity

## Pré-requisitos e criação

Use Node 20 ou 22. Na raiz do site, execute:

```bash
npx sanity@latest init --env .env.local
```

Selecione **Create new project**, nome **Sady Santana Editorial**, organização pessoal ou existente, dataset **production**, visibilidade **Public**, e não substitua a pasta `sanity/` preparada. Se o assistente tentar gerar um novo projeto, cancele depois de obter o `projectId` e configure manualmente `sanity/.env.local`:

```text
SANITY_STUDIO_PROJECT_ID=SEU_PROJECT_ID
SANITY_STUDIO_DATASET=production
```

Cadastre em **Manage project > API > CORS origins**:

- `http://localhost:3333` com credenciais;
- `https://sady-santana-escritora.elufurtado.chatgpt.site` sem credenciais para leitura pública.

No ambiente de hospedagem do site, configure `PUBLIC_SANITY_PROJECT_ID`, `PUBLIC_SANITY_DATASET=production`, `SANITY_API_VERSION=2025-02-19` e `PUBLIC_SITE_URL` com a URL canônica. Nenhum token é necessário para o site público.

## Categorias e Studio

Execute `cd sanity && npm install && npm run dev`. Crie as categorias iniciais: Fé; Feminilidade Bíblica; Família; Literatura; Cultura; Vida Cristã. Quando estiver validado, `npm run deploy` publica o Studio gratuitamente; escolha um hostname como `sady-santana-editorial` se estiver disponível.

Confirme a conclusão abrindo o Studio, criando um rascunho e verificando que ele não aparece em `/artigos`. Depois publique um artigo de teste autorizado, confira sua rota individual e arquive-o.

## Importação

Copie `sanity/import-template.json`, substitua somente pelos textos e datas autorizados e execute `node scripts/prepare-import.mjs seu-arquivo.json`. Revise `sanity/import-ready.ndjson`; ele sempre marca os itens como rascunho. Importe com `cd sanity && npx sanity dataset import import-ready.ndjson production`. Categorias e imagens devem ser associadas no Studio depois da revisão.

## Deploy e segredos

Faça um novo build/deploy do Worker depois de cadastrar as variáveis. Publicações seguintes aparecem dinamicamente, sem rebuild. Nunca configure `SANITY_READ_TOKEN` ou `SANITY_PREVIEW_SECRET` como variável pública nem os inclua no bundle.
