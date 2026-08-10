import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import worker from "../dist/server/index.js";
import {isPublicArticle, publicArticles, readingMinutes, paginate, slugify} from "../lib/articles.mjs";
import {firstPublishedSlugFor, slugLockPatch, validatePermanentSlug} from "../sanity/schemaTypes/slugProtection.js";

const env = {
  PUBLIC_SANITY_PROJECT_ID: "test-project",
  PUBLIC_SANITY_DATASET: "production",
  SANITY_API_VERSION: "2025-02-19",
  PUBLIC_SITE_URL: "https://example.test",
};
const block = (text, extra = {}) => ({_type: "block", style: "normal", markDefs: [], children: [{_type: "span", text, marks: []}], ...extra});
const valid = {
  _id: "article-valid", title: "Artigo publicado", slug: "artigo-publicado", summary: "Resumo aprovado",
  category: "Fé", status: "published", publishedAt: "2026-08-01T12:00:00Z", topics: ["graça"], body: [block("Conteúdo completo")],
};
let result = [];
let failure = null;
globalThis.fetch = async () => {
  if (failure) throw failure;
  return new Response(JSON.stringify({result}), {status: 200, headers: {"content-type": "application/json"}});
};
const request = async (path) => {
  const response = await worker.fetch(new Request(`https://example.test${path}`), env);
  return {response, body: await response.text()};
};
const withoutErrorNoise = async (callback) => {
  const original = console.error;
  console.error = () => {};
  try { return await callback(); } finally { console.error = original; }
};
const scenarios = [];
const scenario = (name, run) => scenarios.push({name, run});

scenario("publica somente artigo editorialmente completo", () => {
  const now = new Date("2026-08-05T12:00:00Z");
  assert.equal(isPublicArticle(valid, now), true);
  for (const invalid of [
    {...valid, status: "draft"}, {...valid, status: "archived"}, {...valid, publishedAt: "2999-01-01T00:00:00Z"},
    {...valid, publishedAt: "inválida"}, {...valid, body: []}, {...valid, body: undefined}, {...valid, category: ""},
    {...valid, slug: " "}, {...valid, title: ""}, {...valid, summary: ""},
  ]) assert.equal(isPublicArticle(invalid, now), false);
});

scenario("exige texto Portable Text real", () => {
  const invalidBodies = [
    [{_type: "divider"}],
    [{_type: "image", asset: {_ref: "image-test"}}],
    [{_type: "block", children: []}],
    [block("   ")],
  ];
  for (const body of invalidBodies) assert.equal(isPublicArticle({...valid, body}), false);
  assert.equal(isPublicArticle({...valid, body: [block("Parágrafo real")]}), true);
  assert.equal(isPublicArticle({...valid, body: [block("Item real", {listItem: "bullet"})]}), true);
  assert.equal(isPublicArticle({...valid, body: [{_type: "divider"}, {_type: "image"}, block("Texto")]}), true);
});

scenario("mantém utilitários editoriais determinísticos", () => {
  const now = new Date("2026-08-05T12:00:00Z");
  assert.deepEqual(publicArticles([{...valid, slug: "antigo", publishedAt: "2026-07-01T12:00:00Z"}, valid], now).map((a) => a.slug), ["artigo-publicado", "antigo"]);
  assert.equal(slugify("Fé, Graça & Família"), "fe-graca-familia");
  assert.equal(readingMinutes([block("uma ".repeat(221))]), 2);
  assert.deepEqual(paginate([1, 2, 3, 4, 5], 2, 2), {items: [3, 4], current: 2, totalPages: 3});
});

scenario("renderiza acervo vazio", async () => {
  result = []; failure = null;
  const page = await request("/artigos");
  assert.equal(page.response.status, 200);
  assert.match(page.body, /Ainda não há textos/);
});

scenario("responde 503 quando o acervo perde o Sanity", async () => {
  failure = new Error("offline");
  const page = await withoutErrorNoise(() => request("/artigos"));
  assert.equal(page.response.status, 503);
  assert.equal(page.response.headers.get("cache-control"), "no-store");
  assert.equal(page.response.headers.get("retry-after"), "60");
  failure = null;
});

scenario("oculta documentos que não atendem à publicação", async () => {
  result = [
    {...valid, status: "draft"}, {...valid, _id: "archived", slug: "archived", status: "archived"},
    {...valid, _id: "future", slug: "future", publishedAt: "2999-01-01T00:00:00Z"},
    {...valid, _id: "no-body", slug: "no-body", body: []}, {...valid, _id: "no-category", slug: "no-category", category: ""}, valid,
  ];
  const page = await request("/artigos");
  assert.match(page.body, /Artigo publicado/);
  for (const hidden of ["archived", "future", "no-body", "no-category"]) assert.doesNotMatch(page.body, new RegExp(`href="/artigos/${hidden}"`));
});

scenario("remove formulário de newsletter legado", async () => {
  result = [valid];
  const page = await request("/artigos");
  assert.doesNotMatch(page.body, /<form class="subscribe-form/);
  assert.doesNotMatch(page.body, /Quero receber|type="email"/);
});

scenario("mantém o catálogo na coluna correta do acervo", async () => {
  result = [valid];
  const page = await request("/artigos");
  const library = page.body.match(/<section class="articles-library">([\s\S]*?)<\/section>/)?.[1] || "";
  assert.match(library, /class="article-tools"/);
  assert.match(library, /class="articles-list"/);
  assert.doesNotMatch(library, /article-cover-fallback/);
  assert.match(page.body, /\.article-tools,\.articles-list,\.pagination\{grid-column:2\}/);
  assert.match(page.body, /\.articles-list\{min-width:0\}/);
  assert.match(page.body, /@media\(max-width:900px\)\{\.article-tools,\.articles-list,\.pagination\{grid-column:1\}/);
  const css = await readFile("app/globals.css", "utf8");
  assert.match(css, /grid-template-columns:\s*minmax\(260px, 34%\) minmax\(0, 1fr\)/);
});

scenario("define canonical e próxima página no acervo", async () => {
  result = Array.from({length: 17}, (_, index) => ({...valid, _id: `article-${index}`, slug: `article-${index}`, title: `Artigo ${index}`}));
  const page = await request("/artigos");
  assert.match(page.body, /<link rel="canonical" href="https:\/\/example\.test\/artigos">/);
  assert.match(page.body, /<link rel="next" href="https:\/\/example\.test\/artigos\/pagina\/2">/);
  assert.doesNotMatch(page.body, /name="robots" content="noindex,follow"/);
});

scenario("define canonical, título, anterior e próxima na página 2", async () => {
  const page = await request("/artigos/pagina/2");
  assert.equal(page.response.status, 200);
  assert.match(page.body, /<title>Artigos — Página 2 \| Sady Santana<\/title>/);
  assert.match(page.body, /<link rel="canonical" href="https:\/\/example\.test\/artigos\/pagina\/2">/);
  assert.match(page.body, /<meta property="og:url" content="https:\/\/example\.test\/artigos\/pagina\/2">/);
  assert.match(page.body, /<link rel="prev" href="https:\/\/example\.test\/artigos">/);
  assert.match(page.body, /<link rel="next" href="https:\/\/example\.test\/artigos\/pagina\/3">/);
});

scenario("marca busca como noindex,follow sem canonizar parâmetros", async () => {
  const page = await request("/artigos?q=Artigo");
  assert.match(page.body, /<meta name="robots" content="noindex,follow">/);
  assert.match(page.body, /<link rel="canonical" href="https:\/\/example\.test\/artigos">/);
  assert.doesNotMatch(page.body, /canonical[^>]+\?q=/);
});

scenario("marca filtro de categoria como noindex,follow", async () => {
  const page = await request("/artigos?categoria=F%C3%A9");
  assert.match(page.body, /<meta name="robots" content="noindex,follow">/);
  assert.match(page.body, /<link rel="canonical" href="https:\/\/example\.test\/artigos">/);
});

scenario("retorna 404 para página além do total", async () => {
  const page = await request("/artigos/pagina/4");
  assert.equal(page.response.status, 404);
});

scenario("renderiza listas Portable Text e metadados estruturados", async () => {
  result = {...valid, body: [block("Item forte", {listItem: "bullet", children: [{_type: "span", text: "Item forte", marks: ["strong"]}]}), block("Subitem", {listItem: "bullet", level: 2}), block("Segundo", {listItem: "bullet"}), block("Primeiro", {listItem: "number"}), block("Depois")]};
  const page = await request("/artigos/artigo-publicado");
  assert.match(page.body, /<ul><li><strong>Item forte<\/strong><ul><li>Subitem<\/li><\/ul><\/li><li>Segundo<\/li><\/ul>/);
  assert.match(page.body, /<ol><li>Primeiro<\/li><\/ol>/);
  assert.match(page.body, /"@type":"BlogPosting"/);
});

scenario("preserva navegação mobile na página individual", async () => {
  const page = await request("/artigos/artigo-publicado");
  assert.match(page.body, /<button class="menu-button"[^>]+aria-expanded="false"/);
  assert.match(page.body, /Fechar menu/);
});

scenario("retorna 404 para slug inexistente", async () => {
  result = null;
  const page = await request("/artigos/slug-inexistente");
  assert.equal(page.response.status, 404);
  assert.match(page.body, /menu-button/);
});

scenario("responde 503 quando artigo individual perde o Sanity", async () => {
  failure = new Error("offline");
  const page = await withoutErrorNoise(() => request("/artigos/inexistente"));
  assert.equal(page.response.status, 503);
  failure = null;
});

scenario("gera sitemap apenas com artigo público", async () => {
  result = [valid];
  const page = await request("/sitemap.xml");
  assert.equal(page.response.status, 200);
  assert.match(page.body, /artigo-publicado/);
});

scenario("sitemap não mascara falha do Sanity", async () => {
  failure = new Error("offline");
  const page = await withoutErrorNoise(() => request("/sitemap.xml"));
  assert.equal(page.response.status, 503);
  assert.equal(page.response.headers.get("cache-control"), "no-store");
  failure = null;
});

scenario("artigo nunca publicado pode definir slug", async () => {
  const context = {document: {_id: "drafts.article-1"}, getClient: () => ({fetch: async () => null})};
  assert.equal(await validatePermanentSlug({current: "slug-inicial"}, context), true);
});

scenario("primeira publicação bloqueia o slug sem sobrescrever", () => {
  assert.equal(firstPublishedSlugFor({slug: {current: "slug-inicial"}}, null), "slug-inicial");
  assert.deepEqual(slugLockPatch({slug: {current: "slug-inicial"}}, null), {setIfMissing: {firstPublishedSlug: "slug-inicial"}});
  assert.equal(firstPublishedSlugFor({firstPublishedSlug: "original", slug: {current: "novo"}}, null), "original");
});

scenario("bloqueio persiste em archived, draft e sem documento publicado", async () => {
  for (const status of ["archived", "draft"]) {
    const context = {document: {_id: "drafts.article-1", status, firstPublishedSlug: "slug-original"}, getClient: () => ({fetch: async () => null})};
    assert.equal(await validatePermanentSlug({current: "slug-original"}, context), true);
    assert.match(await validatePermanentSlug({current: "slug-alterado"}, context), /não pode ser alterado/);
  }
});

scenario("protege documento legado enquanto a versão publicada existe", async () => {
  const context = {document: {_id: "drafts.article-1"}, getClient: () => ({fetch: async () => "slug-original"})};
  assert.equal(await validatePermanentSlug({current: "slug-original"}, context), true);
  assert.match(await validatePermanentSlug({current: "slug-alterado"}, context), /não pode ser alterado/);
});

scenario("bundle público não contém segredos privados", async () => {
  const bundle = await readFile("dist/server/index.js", "utf8");
  assert.doesNotMatch(bundle, /SANITY_READ_TOKEN|SANITY_PREVIEW_SECRET|Bearer\s+[A-Za-z0-9]/);
});

scenario("mantém a fundação de motion progressiva e acessível", async () => {
  const [css, script, home, packageJson] = await Promise.all([
    readFile("app/globals.css", "utf8"),
    readFile("static/site.js", "utf8"),
    readFile("static/index.html", "utf8"),
    readFile("package.json", "utf8"),
  ]);
  assert.match(css, /\.reveal\s*\{\s*opacity:\s*1;\s*transform:\s*none;/);
  assert.match(css, /\.motion-ready \.reveal:not\(\.visible\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(script, /"IntersectionObserver" in window/);
  assert.match(script, /classList\.add\("motion-ready"\)/);
  assert.match(script, /observer\.unobserve\(entry\.target\)/);
  assert.match(script, /requestAnimationFrame\(updateHeader\)/);
  assert.match(script, /requestAnimationFrame\(updateGardens\)/);
  assert.match(home, /data-hero-item="kicker"/);
  assert.match(home, /data-reveal="soft"/);
  assert.match(css, /\.hero h1 \[data-hero-item="title"\]\s*\{\s*display:\s*block;/);
  assert.match(css, /\.hero \.button\.primary:hover > span, \.hero \.button\.primary:focus-visible > span\s*\{\s*transform:\s*translateY\(3px\);/);
  assert.doesNotMatch(css, /(?:^|\n)\.button:hover > span/);
  assert.doesNotMatch(packageJson, /gsap|framer-motion|animejs|locomotive-scroll/);
});

scenario("preserva tokens e documenta os padrões editoriais", async () => {
  const [css, motion] = await Promise.all([
    readFile("app/globals.css", "utf8"),
    readFile("MOTION_SYSTEM.md", "utf8"),
  ]);
  for (const token of [
    "--motion-micro: 220ms", "--motion-component: 360ms", "--motion-section: 680ms",
    "--motion-stagger: 90ms", "--distance-reveal: 24px", "--distance-reveal-inline: 18px",
  ]) assert.match(css, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(motion, /## Padrões aplicados/);
  assert.match(motion, /\*\*Sobre:\*\*[\s\S]*\*\*Livros:\*\*[\s\S]*\*\*Palestras:\*\*[\s\S]*\*\*Fechamento:\*\*/);
});

scenario("oferece tabs de livros acessíveis e troca determinística", async () => {
  const [home, app, script, css] = await Promise.all([
    readFile("static/index.html", "utf8"),
    readFile("app/page.js", "utf8"),
    readFile("static/site.js", "utf8"),
    readFile("app/globals.css", "utf8"),
  ]);
  assert.match(home, /role="tablist"[^>]+aria-label="Livros publicados"/);
  assert.equal((home.match(/role="tab"/g) || []).length, 2);
  assert.equal((home.match(/aria-controls="book-panel"/g) || []).length, 2);
  assert.match(home, /role="tabpanel"[^>]+aria-live="polite"[^>]+aria-busy="false"/);
  for (const key of ["ArrowLeft", "ArrowRight", "Home", "End"]) {
    assert.match(script, new RegExp(key));
    assert.match(app, new RegExp(key));
  }
  assert.match(script, /timers:\s*new Set\(\)/);
  assert.match(script, /this\.cancel\(\)/);
  assert.match(script, /motionPreference\.matches/);
  assert.match(css, /\.book-card\.is-leaving/);
  assert.match(css, /\.book-card\.is-entering/);
});

scenario("mantém novos capítulos progressivos sem tocar artigos", async () => {
  const [home, css, articles] = await Promise.all([
    readFile("static/index.html", "utf8"),
    readFile("app/globals.css", "utf8"),
    readFile("static/articles.html", "utf8"),
  ]);
  assert.match(home, /data-chapter="about"/);
  assert.match(home, /data-chapter="closing"/);
  assert.match(home, /class="theme reveal" data-delay="4"/);
  assert.match(css, /\.motion-ready \.chapter\.reveal \{ opacity: 1; transform: none; \}/);
  assert.match(css, /prefers-reduced-motion:[\s\S]*\.book-info \[data-book-detail\]/);
  assert.doesNotMatch(articles, /data-chapter="about"|data-book-detail|data-video-item/);
});

for (const {name, run} of scenarios) {
  await run();
  console.log(`✓ ${name}`);
}
console.log(`${scenarios.length} cenários editoriais de regressão aprovados.`);
