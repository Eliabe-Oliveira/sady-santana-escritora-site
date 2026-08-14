# Configuração externa do Sanity

## Studio já configurado

O projeto já existe. Não execute `sanity init` e não substitua a pasta `sanity/`.

Use Node 22 e crie localmente `sanity/.env.local`:

```text
SANITY_STUDIO_PROJECT_ID=zwhnxf2h
SANITY_STUDIO_DATASET=production
```

O arquivo é local e não deve ser versionado. Depois execute:

```bash
cd sanity
npm install
npm run dev
```

Acesse `http://localhost:3333`.

Cadastre em **Manage project > API > CORS origins**:

- `http://localhost:3333` com credenciais;
- `https://escritorasady.com.br` sem credenciais para leitura pública.

No ambiente de hospedagem do site, configure `PUBLIC_SANITY_PROJECT_ID`, `PUBLIC_SANITY_DATASET=production`, `SANITY_API_VERSION=2025-02-19` e `PUBLIC_SITE_URL` com a URL canônica. Nenhum token é necessário para o site público.

## Categorias e Studio

Crie as categorias iniciais: Fé; Feminilidade Bíblica; Família; Literatura; Cultura; Vida Cristã. Quando estiver validado, `npm run deploy` publica o Studio gratuitamente; escolha um hostname como `sady-santana-editorial` se estiver disponível. Cadastre depois a URL definitiva do Studio no CORS com credenciais habilitadas.

Confirme a conclusão abrindo o Studio, criando um rascunho e verificando que ele não aparece em `/artigos`. Depois publique um artigo de teste autorizado, confira sua rota individual e arquive-o.

## Importação

Copie `sanity/import-template.json`, substitua somente pelos textos e datas autorizados e execute `node scripts/prepare-import.mjs seu-arquivo.json`. Revise `sanity/import-ready.ndjson`; ele sempre marca os itens como rascunho. Importe com `cd sanity && npx sanity dataset import import-ready.ndjson production`. Categorias e imagens devem ser associadas no Studio depois da revisão.

## Deploy e segredos

Faça um novo build/deploy do Worker depois de cadastrar as variáveis. Publicações seguintes aparecem dinamicamente, sem rebuild. Nunca configure `SANITY_READ_TOKEN` ou `SANITY_PREVIEW_SECRET` como variável pública nem os inclua no bundle.

## Permanência do slug

Na primeira publicação, a ação **Publicar** grava automaticamente o slug em um campo interno oculto (`firstPublishedSlug`) usando `setIfMissing`. Publicações posteriores não sobrescrevem esse valor. A validação compara o slug editado com esse registro e rejeita mudanças mesmo se o artigo for arquivado, voltar para rascunho ou passar por **Unpublish**.

Documentos antigos que já estejam publicados também são protegidos pela consulta da versão publicada; na publicação seguinte, o registro interno é preenchido. Artigos nunca publicados continuam livres para definir o primeiro slug. Para retirar um texto do site, prefira o estado **Arquivado** em vez de apagar ou despublicar o documento.
