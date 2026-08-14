import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {Readable} from "node:stream";
import worker from "../dist/server/index.js";
import {vercelHandler} from "../api/index.mjs";
import {isPublicArticle, publicArticles, readingMinutes, paginate, slugify} from "../lib/articles.mjs";
import {firstPublishedSlugFor, slugLockPatch, validatePermanentSlug} from "../sanity/schemaTypes/slugProtection.js";

const env = {
  PUBLIC_SANITY_PROJECT_ID: "test-project",
  PUBLIC_SANITY_DATASET: "production",
  SANITY_API_VERSION: "2025-02-19",
  PUBLIC_SITE_URL: "https://example.test",
};
Object.assign(process.env, {
  PUBLIC_SANITY_PROJECT_ID: "test-project",
  PUBLIC_SANITY_DATASET: "production",
  SANITY_API_VERSION: "2025-02-19",
  PUBLIC_SITE_URL: "https://escritorasady.com.br",
});
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
const vercelRequest = async (path, options = {}) => {
  const incoming = Readable.from(options.body ? [options.body] : []);
  incoming.method = options.method || "GET";
  incoming.url = path;
  incoming.headers = {host: "preview.vercel.app", "x-forwarded-proto": "https", ...(options.headers || {})};
  const headers = new Map();
  let responseBody;
  const outgoing = {
    statusCode: 200,
    setHeader(name, value) { headers.set(name.toLowerCase(), String(value)); },
    end(value = "") { responseBody = Buffer.isBuffer(value) ? value : Buffer.from(value); },
  };
  await vercelHandler(incoming, outgoing);
  return {status: outgoing.statusCode, headers, body: responseBody.toString("utf8")};
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

scenario("mantém contato exclusivamente na Home", async () => {
  result = [valid];
  const page = await request("/artigos");
  assert.doesNotMatch(page.body, /<form class="contact-form|action="mailto:sady287@gmail\.com/);
  assert.doesNotMatch(page.body, /Cartas de Sady|articles-signup/);
});

scenario("mantém o catálogo na largura editorial completa", async () => {
  result = [valid];
  const page = await request("/artigos");
  const library = page.body.match(/<section class="articles-library">([\s\S]*?)<\/section>/)?.[1] || "";
  assert.match(library, /class="article-tools"/);
  assert.match(library, /class="articles-list"/);
  assert.doesNotMatch(library, /article-cover-fallback/);
  assert.match(page.body, /\.article-tools,\.articles-list,\.pagination\{width:100%\}/);
  assert.match(page.body, /\.articles-list\{min-width:0\}/);
  assert.doesNotMatch(page.body, /grid-column:2|articles-intro|Leia com calma/);
  const css = await readFile("app/globals.css", "utf8");
  assert.match(css, /\.articles-library \{ width: min\(100%, 1480px\); padding: 110px 5vw;/);
  assert.match(css, /\.article-row h3 \{[^}]*font-size: clamp\(22px, 2\.1vw, 32px\)/);
  assert.match(css, /\.article-row > div \{ min-width: 0; \}/);
  assert.match(css, /\.article-row h3 \{[^}]*overflow-wrap: anywhere/);
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
  const [css, editorial, script, home, packageJson] = await Promise.all([
    readFile("app/globals.css", "utf8"),
    readFile("static/editorial.js", "utf8"),
    readFile("static/site.js", "utf8"),
    readFile("static/index.html", "utf8"),
    readFile("package.json", "utf8"),
  ]);
  assert.match(css, /\.reveal\s*\{\s*opacity:\s*1;\s*transform:\s*none;/);
  assert.match(css, /\.motion-ready \.reveal:not\(\.visible\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(editorial, /"IntersectionObserver" in window/);
  assert.match(editorial, /classList\.add\("motion-ready"\)/);
  assert.match(editorial, /observer\.unobserve\(entry\.target\)/);
  assert.match(editorial, /requestAnimationFrame\(updateHeader\)/);
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
  assert.match(motion, /\*\*Sobre:\*\*[\s\S]*\*\*Livros:\*\*[\s\S]*\*\*Vídeo:\*\*[\s\S]*\*\*Fechamento:\*\*/);
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
  assert.doesNotMatch(home, /class="theme|theme-list|Verdade que alcança/);
  assert.match(home, /youtube-nocookie\.com\/embed\/Engv2JRyjZc/);
  assert.match(css, /\.motion-ready \.chapter\.reveal \{ opacity: 1; transform: none; \}/);
  assert.match(css, /prefers-reduced-motion:[\s\S]*\.book-info \[data-book-detail\]/);
  assert.doesNotMatch(articles, /data-chapter="about"|data-book-detail|data-video-item/);
});

scenario("oferece contato mailto acessível e crédito editorial consistente", async () => {
  const [home, app, script, archive, css, build] = await Promise.all([
    readFile("static/index.html", "utf8"), readFile("app/page.js", "utf8"),
    readFile("static/site.js", "utf8"), readFile("static/articles.html", "utf8"),
    readFile("app/globals.css", "utf8"), readFile("build.mjs", "utf8"),
  ]);
  for (const source of [home, app]) {
    assert.match(source, /mailto:sady287@gmail\.com/);
    assert.match(source, /type="email" name="email" (?:autoComplete|autocomplete)="email" required/);
    assert.match(source, /type="tel" name="phone" (?:autoComplete|autocomplete)="tel" required/);
    assert.match(source, /textarea[^>]*name="message"[^>]*required/);
    assert.match(source, /role="status" (?:ariaLive|aria-live)="polite"/);
    assert.match(source, /Site desenvolvido pela Lumen Society\./);
  }
  for (const source of [script, app]) {
    assert.match(source, /Convite pelo site — Sady Santana/);
    assert.match(source, /encodeURIComponent\(subject\)/);
    assert.match(source, /encodeURIComponent\(body\)/);
    assert.match(source, /Seu aplicativo de e-mail será aberto para concluir o envio\./);
  }
  assert.doesNotMatch(`${home}\n${app}\n${script}`, /FormSubmit|EmailJS|SendGrid|Resend|SMTP/i);
  assert.match(archive, /Site desenvolvido pela Lumen Society\./);
  assert.doesNotMatch(archive, /contact-form|Cartas de Sady|articles-intro/);
  assert.match(build, /Site desenvolvido pela Lumen Society\./);
  assert.match(build, /\.article-detail h1\{font-size:clamp\(40px,5\.2vw,72px\);line-height:1\.06/);
  assert.doesNotMatch(build, /grid-column:2/);
  assert.match(css, /\.contact-form input:focus-visible, \.contact-form textarea:focus-visible/);
});

scenario("mantém as revisões editoriais da Home equivalentes em React e static", async () => {
  const [app, home, script, css] = await Promise.all([
    readFile("app/page.js", "utf8"),
    readFile("static/index.html", "utf8"),
    readFile("static/site.js", "utf8"),
    readFile("app/globals.css", "utf8"),
  ]);
  const welcome = "Seja bem-vindo a este espaço. Entre histórias, reflexões e verdades eternas, que cada leitura fortaleça sua fé e aponte seu coração para Cristo.";
  const amazon = "https://www.amazon.com.br/FEMINILIDADE-B%C3%8DBLICA-Repensando-mulher-Cantares-ebook/dp/B0D261ZZMM";
  assert.match(app, /className="hero-author" data-hero-item="author">Sady Santana/);
  assert.match(home, /class="hero-author" data-hero-item="author">Sady Santana/);
  assert.match(app.replace(/\s+/g, " "), new RegExp(welcome));
  assert.match(home, new RegExp(welcome));
  assert.doesNotMatch(`${app}\n${home}\n${css}`, /hero-note|Uma vida de palavras/);
  for (const source of [app, home]) {
    assert.match(source.replace(/\s+/g, " "), /Sady Santana é escritora cristã presbiteriana,[\s\S]*?Centro Presbiteriano de Pós-Graduação Andrew Jumper \(CPAJ\)/);
    assert.match(source.replace(/\s+/g, " "), /Autora de Feminilidade Bíblica e do romance O vestido nunca usado,[\s\S]*?à luz do evangelho\./);
    for (const fact of ["Mackenzie", "IBEL", "CPAJ", "02"]) assert.match(source, new RegExp(`>${fact}<`));
    assert.equal((source.match(/data-chapter-item=["']fact-[1-4]["']/g) || []).length, 4);
  }
  for (const source of [app, script]) {
    assert.match(source, new RegExp(amazon.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(source, /Conhecer o livro/);
  }
  assert.match(app, /youtube-nocookie\.com\/embed\/Engv2JRyjZc/);
  assert.match(home, /youtube-nocookie\.com\/embed\/Engv2JRyjZc/);
  for (const source of [app, home]) {
    assert.equal((source.match(/03 · vídeo em destaque/g) || []).length, 1);
    assert.doesNotMatch(source, /<h3[^>]*>Vídeo em destaque<\/h3>|data-video-item=["']title["']/);
  }
  assert.match(home, /title="Vídeo em destaque de Sady Santana" loading="lazy"[\s\S]*allowfullscreen/);
  assert.match(css, /\.facts \{[^}]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*\.facts \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.video-frame \{[^}]*aspect-ratio: 16 \/ 9/);
  assert.doesNotMatch(css, /\.video-note h3|data-video-item=["']title["']/);
  assert.match(home, /"description":"Escritora cristã presbiteriana,[^"]*CPAJ\."/);
});

scenario("gera o preview do acervo a partir do Sanity sem conteúdo legacy", async () => {
  const [template, pagesBuild, workerBuild] = await Promise.all([
    readFile("static/articles.html", "utf8"),
    readFile("build-pages.mjs", "utf8"),
    readFile("build.mjs", "utf8"),
  ]);
  for (const legacy of [
    "Mulher & cultura digital",
    "Da vida “sem véu” à exposição “sem filtro”",
    "Você está preparando seu filho para o que vem a seguir?",
    "primeiraigrejavirtual.com.br",
    "goodprime.co",
  ]) assert.doesNotMatch(template, new RegExp(legacy));
  assert.match(template, /__ARTICLE_LIST__/);
  assert.match(pagesBuild, /zwhnxf2h/);
  assert.match(pagesBuild, /2025-02-19/);
  assert.match(pagesBuild, /!\(_id in path\("drafts\.\*\*"\)\)/);
  assert.match(pagesBuild, /status == "published"/);
  assert.match(pagesBuild, /dateTime\(publishedAt\) <= dateTime\(now\(\)\)/);
  assert.match(pagesBuild, /officialArticlesUrl[^\n]*\/artigos/);
  assert.match(pagesBuild, /O acervo atualizado está disponível no site oficial\./);
  assert.doesNotMatch(pagesBuild, /SANITY_READ_TOKEN|SANITY_PREVIEW_SECRET|navigator\.userAgent|headers\.get\(["']user-agent|innerWidth|matchMedia/i);
  assert.match(workerBuild, /async function archivePage[\s\S]*sanity\(env/);
  assert.doesNotMatch(workerBuild, /navigator\.userAgent|headers\.get\(["']user-agent|innerWidth|matchMedia/i);
});

scenario("aplica a coreografia editorial ao acervo sem layout shift", async () => {
  result = Array.from({length: 7}, (_, index) => ({...valid, _id: `motion-${index}`, slug: `motion-${index}`, title: `Movimento ${index}`}));
  const [{body}, css, archive] = await Promise.all([
    request("/artigos"),
    readFile("app/globals.css", "utf8"),
    readFile("static/articles.html", "utf8"),
  ]);
  assert.match(archive, /data-editorial-sequence="archive-hero"/);
  assert.doesNotMatch(archive, /data-editorial-sequence="archive-intro"|articles-intro/);
  assert.equal((body.match(/class="article-row reveal" data-reveal="soft"/g) || []).length, 7);
  assert.match(body, /data-delay="4"/);
  assert.doesNotMatch(css, /transition:\s*padding/);
  assert.doesNotMatch(css, /article-row:hover[^{}]*padding/);
  assert.match(css, /article-row:hover > div[\s\S]{0,120}translateX\(5px\)/);
});

scenario("mantém a prosa imóvel e anima somente os marcos da leitura", async () => {
  result = {
    ...valid,
    coverImage: {alt: "Capa editorial", asset: {url: "https://cdn.sanity.io/images/test/production/cover.jpg"}},
    related: {...valid, _id: "related", slug: "relacionado", title: "Relacionado"},
  };
  const page = await request("/artigos/artigo-publicado");
  assert.match(page.body, /class="article-header editorial-sequence reveal"/);
  assert.match(page.body, /class="article-cover article-cover-enter reveal"/);
  assert.match(page.body, /class="related reveal" data-reveal="soft"/);
  assert.match(page.body, /class="books-callout reveal" data-reveal="soft"/);
  const prose = page.body.match(/<div class="prose">([\s\S]*?)<\/div><div class="article-actions">/)?.[1] || "";
  assert.doesNotMatch(prose, /\breveal\b|data-reveal|data-editorial-item/);
});

scenario("oferece cópia de link acessível com fallback", async () => {
  result = valid;
  const [page, editorial] = await Promise.all([
    request("/artigos/artigo-publicado"),
    readFile("static/editorial.js", "utf8"),
  ]);
  assert.match(page.body, /data-copy-link aria-describedby="copy-status"/);
  assert.match(page.body, /id="copy-status" aria-live="polite"/);
  assert.doesNotMatch(page.body, /onclick=/);
  assert.match(editorial, /navigator\.clipboard\.writeText/);
  assert.match(editorial, /document\.execCommand\("copy"\)/);
});

scenario("preserva estados HTTP, SEO e filtros server-side com o runtime comum", async () => {
  result = [valid];
  const archive = await request("/artigos?q=publicado&categoria=F%C3%A9");
  assert.match(archive.body, /<form class="archive-filters" method="get" action="\/artigos" role="search">/);
  assert.match(archive.body, /<meta name="robots" content="noindex,follow">/);
  result = valid;
  const detail = await request("/artigos/artigo-publicado");
  assert.match(detail.body, /"@type":"BlogPosting"/);
  assert.match(detail.body, /<link rel="canonical" href="https:\/\/example\.test\/artigos\/artigo-publicado">/);
  assert.match(detail.body, /requestAnimationFrame\(updateHeader\)/);
  result = null;
  assert.equal((await request("/artigos/inexistente")).response.status, 404);
  failure = new Error("offline");
  assert.equal((await withoutErrorNoise(() => request("/artigos"))).response.status, 503);
  failure = null;
});

scenario("adapter Vercel preserva Home, headers e canonical de produção", async () => {
  const page = await vercelRequest("/");
  assert.equal(page.status, 200);
  assert.match(page.headers.get("content-type"), /text\/html/);
  assert.equal(page.headers.get("cache-control"), "public, max-age=60, stale-while-revalidate=300");
  assert.match(page.body, /<link rel="canonical" href="https:\/\/escritorasady\.com\.br\/">/);
  assert.doesNotMatch(page.body, /chatgpt\.site|vercel\.app/);
});

scenario("adapter Vercel preserva query string de busca e categoria", async () => {
  result = [valid]; failure = null;
  const page = await vercelRequest("/artigos?q=publicado&categoria=F%C3%A9");
  assert.equal(page.status, 200);
  assert.match(page.body, /value="publicado"/);
  assert.match(page.body, /selected value="Fé"/);
  assert.match(page.body, /name="robots" content="noindex,follow"/);
});

scenario("adapter Vercel abre artigo de referência e mantém SEO", async () => {
  result = {...valid, title: "O TESTE DA HOSPITALIDADE", slug: "o-teste-da-hospitalidade-um-chamado-ao-amor-e-a-fe"};
  const page = await vercelRequest("/artigos/o-teste-da-hospitalidade-um-chamado-ao-amor-e-a-fe");
  assert.equal(page.status, 200);
  assert.match(page.body, /O TESTE DA HOSPITALIDADE/);
  assert.match(page.body, /"@type":"BlogPosting"/);
  assert.match(page.body, /https:\/\/escritorasady\.com\.br\/artigos\/o-teste-da-hospitalidade-um-chamado-ao-amor-e-a-fe/);
});

scenario("adapter Vercel preserva 404 real", async () => {
  result = null; failure = null;
  const page = await vercelRequest("/artigos/slug-inexistente-vercel-qa");
  assert.equal(page.status, 404);
  assert.match(page.body, /Este artigo não foi encontrado/);
  assert.match(page.body, /Site desenvolvido pela Lumen Society\./);
});

scenario("adapter Vercel preserva 503, Retry-After e no-store", async () => {
  failure = new Error("offline");
  const page = await withoutErrorNoise(() => vercelRequest("/artigos"));
  assert.equal(page.status, 503);
  assert.equal(page.headers.get("retry-after"), "60");
  assert.equal(page.headers.get("cache-control"), "no-store");
  assert.match(page.body, /Site desenvolvido pela Lumen Society\./);
  failure = null;
});

scenario("adapter Vercel serve sitemap e robots no domínio definitivo", async () => {
  result = [{slug: "o-teste-da-hospitalidade-um-chamado-ao-amor-e-a-fe", publishedAt: valid.publishedAt}];
  const [sitemap, robots] = await Promise.all([vercelRequest("/sitemap.xml"), vercelRequest("/robots.txt")]);
  assert.equal(sitemap.status, 200);
  assert.match(sitemap.body, /https:\/\/escritorasady\.com\.br\/artigos\/o-teste-da-hospitalidade-um-chamado-ao-amor-e-a-fe/);
  assert.equal(robots.status, 200);
  assert.match(robots.body, /Sitemap: https:\/\/escritorasady\.com\.br\/sitemap\.xml/);
});

scenario("adapter Vercel usa Sanity público sem token", async () => {
  const source = await readFile("api/index.mjs", "utf8");
  const build = await readFile("build.mjs", "utf8");
  assert.doesNotMatch(`${source}\n${build}`, /SANITY_READ_TOKEN|SANITY_PREVIEW_SECRET|Authorization|Bearer/);
  assert.doesNotMatch(build, /\bcf\s*:/);
});

for (const {name, run} of scenarios) {
  await run();
  console.log(`✓ ${name}`);
}
console.log(`${scenarios.length} cenários editoriais de regressão aprovados.`);
