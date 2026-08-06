import assert from "assert";
import {promises as fs} from "fs";
import {isPublicArticle, publicArticles, readingMinutes, paginate, slugify} from "../lib/articles.mjs";

const now = new Date("2026-08-05T12:00:00Z");
const valid = {title:"Texto", slug:"texto", summary:"Resumo", status:"published", publishedAt:"2026-08-01T12:00:00Z"};
assert.strictEqual(isPublicArticle(valid, now), true, "publica artigo válido");
for (const status of ["draft", "archived"]) assert.strictEqual(isPublicArticle({...valid, status}, now), false, `oculta ${status}`);
assert.strictEqual(isPublicArticle({...valid, publishedAt:"2026-08-06T12:00:00Z"}, now), false, "oculta artigo futuro");
assert.strictEqual(isPublicArticle({...valid, summary:""}, now), false, "oculta conteúdo incompleto");
assert.deepStrictEqual(publicArticles([{...valid, slug:"antigo", publishedAt:"2026-07-01T12:00:00Z"}, valid], now).map((a) => a.slug), ["texto", "antigo"], "ordena do mais recente");
assert.strictEqual(slugify("Fé, Graça & Família"), "fe-graca-familia", "gera slug legível");
assert.strictEqual(readingMinutes([{_type:"block", children:[{text:"uma ".repeat(221)}]}]), 2, "calcula leitura");
assert.deepStrictEqual(paginate([1,2,3,4,5], 2, 2), {items:[3,4], current:2, totalPages:3}, "pagina corretamente");
Promise.all([fs.readFile("build.mjs", "utf8"), fs.readFile("sanity/schemaTypes/article.js", "utf8")]).then(([build, schema]) => {
  for (const requirement of ["/artigos/pagina/", "BlogPosting", "sitemap.xml", "archive-empty", "category", "publishedAt <= now()", "status == \"published\""]) assert.ok(build.includes(requirement), `build contém ${requirement}`);
  for (const requirement of ["readOnly: published", "Texto alternativo", "archived", "canonicalUrl", "relatedArticle"]) assert.ok(schema.includes(requirement), `schema contém ${requirement}`);
  assert.ok(!build.includes("SANITY_READ_TOKEN"), "bundle público não usa token privado");
  console.log("21 verificações editoriais aprovadas.");
}).catch((error) => { console.error(error); process.exit(1); });
