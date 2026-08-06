import assert from "node:assert/strict";
import worker from "../dist/server/index.js";
import {isPublicArticle, publicArticles, readingMinutes, paginate, slugify} from "../lib/articles.mjs";
import {validatePermanentSlug} from "../sanity/schemaTypes/slugProtection.js";

const env = {
  PUBLIC_SANITY_PROJECT_ID: "test-project",
  PUBLIC_SANITY_DATASET: "production",
  SANITY_API_VERSION: "2025-02-19",
  PUBLIC_SITE_URL: "https://example.test",
};
const block = (text, extra = {}) => ({_type:"block", style:"normal", markDefs:[], children:[{_type:"span", text, marks:[]}], ...extra});
const valid = {
  _id:"article-valid", title:"Artigo publicado", slug:"artigo-publicado", summary:"Resumo aprovado",
  category:"Fé", status:"published", publishedAt:"2026-08-01T12:00:00Z", topics:["graça"], body:[block("Conteúdo completo")],
};
let result = [];
let failure = null;
globalThis.fetch = async () => {
  if (failure) throw failure;
  return new Response(JSON.stringify({result}), {status:200, headers:{"content-type":"application/json"}});
};
const request = async (path) => {
  const response = await worker.fetch(new Request(`https://example.test${path}`), env);
  return {response, body:await response.text()};
};
const withoutErrorNoise = async (callback) => {const original=console.error;console.error=()=>{};try{return await callback()}finally{console.error=original}};

// Regras puras de publicação.
const now = new Date("2026-08-05T12:00:00Z");
assert.equal(isPublicArticle(valid, now), true);
for (const invalid of [
  {...valid,status:"draft"}, {...valid,status:"archived"}, {...valid,publishedAt:"2999-01-01T00:00:00Z"},
  {...valid,publishedAt:"inválida"}, {...valid,body:[]}, {...valid,body:undefined}, {...valid,category:""},
  {...valid,slug:" "}, {...valid,title:""}, {...valid,summary:""},
]) assert.equal(isPublicArticle(invalid, now), false);
assert.deepEqual(publicArticles([{...valid,slug:"antigo",publishedAt:"2026-07-01T12:00:00Z"},valid],now).map(a=>a.slug),["artigo-publicado","antigo"]);
assert.equal(slugify("Fé, Graça & Família"),"fe-graca-familia");
assert.equal(readingMinutes([block("uma ".repeat(221))]),2);
assert.deepEqual(paginate([1,2,3,4,5],2,2),{items:[3,4],current:2,totalPages:3});

// Worker com Sanity simulado: vazio, falha, filtros e rotas.
result=[]; let page=await request("/artigos"); assert.equal(page.response.status,200); assert.match(page.body,/Ainda não há textos/);
failure=new Error("offline");page=await withoutErrorNoise(()=>request("/artigos"));assert.equal(page.response.status,503);assert.equal(page.response.headers.get("cache-control"),"no-store");assert.equal(page.response.headers.get("retry-after"),"60");
result=null;failure=null;page=await request("/artigos/inexistente");assert.equal(page.response.status,404);assert.match(page.body,/menu-button/);
failure=new Error("offline");page=await withoutErrorNoise(()=>request("/artigos/inexistente"));assert.equal(page.response.status,503);
failure=null;result=[{...valid,status:"draft"},{...valid,_id:"archived",slug:"archived",status:"archived"},{...valid,_id:"future",slug:"future",publishedAt:"2999-01-01T00:00:00Z"},{...valid,_id:"no-body",slug:"no-body",body:[]},{...valid,_id:"no-category",slug:"no-category",category:""},valid];
page=await request("/artigos");assert.equal(page.response.status,200);assert.match(page.body,/Artigo publicado/);for(const hidden of ["archived","future","no-body","no-category"])assert.doesNotMatch(page.body,new RegExp('href="/artigos/'+hidden+'"'));
assert.doesNotMatch(page.body,/<form class="subscribe-form/);assert.doesNotMatch(page.body,/Quero receber/);assert.doesNotMatch(page.body,/type="email"/);

// Portable Text, metadados e navegação mobile reutilizável.
result={...valid,body:[block("Item forte",{listItem:"bullet",children:[{_type:"span",text:"Item forte",marks:["strong"]}]}),block("Subitem",{listItem:"bullet",level:2}),block("Segundo",{listItem:"bullet"}),block("Primeiro",{listItem:"number"}),block("Depois")]};
page=await request("/artigos/artigo-publicado");assert.equal(page.response.status,200);assert.match(page.body,/<ul><li><strong>Item forte<\/strong><ul><li>Subitem<\/li><\/ul><\/li><li>Segundo<\/li><\/ul>/);assert.match(page.body,/<ol><li>Primeiro<\/li><\/ol>/);assert.match(page.body,/<button class="menu-button"[^>]+aria-expanded="false"/);assert.match(page.body,/Fechar menu/);assert.match(page.body,/"@type":"BlogPosting"/);

// Sitemap não mascara falhas.
result=[valid];page=await request("/sitemap.xml");assert.equal(page.response.status,200);assert.match(page.body,/artigo-publicado/);
failure=new Error("offline");page=await withoutErrorNoise(()=>request("/sitemap.xml"));assert.equal(page.response.status,503);assert.equal(page.response.headers.get("cache-control"),"no-store");

// Slug: livre antes da primeira publicação, imutável depois dela.
const context=(publishedSlug)=>({document:{_id:"drafts.article-1"},getClient:()=>({fetch:async()=>publishedSlug})});
assert.equal(await validatePermanentSlug({current:"slug-inicial"},context(null)),true);
assert.equal(await validatePermanentSlug({current:"slug-original"},context("slug-original")),true);
assert.match(await validatePermanentSlug({current:"slug-alterado"},context("slug-original")),/não pode ser alterado/);

// O bundle público não referencia segredos privados.
const bundle = await (await import("node:fs/promises")).readFile("dist/server/index.js","utf8");
assert.doesNotMatch(bundle,/SANITY_READ_TOKEN|SANITY_PREVIEW_SECRET|Bearer\s+[A-Za-z0-9]/);
console.log("Testes editoriais de regressão aprovados.");
