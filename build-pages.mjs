import { promises as fs } from "fs";
import https from "https";

const base = "/sady-santana-escritora-site";
const publicUrl = "https://eliabe-oliveira.github.io/sady-santana-escritora-site";
const officialArticlesUrl = "https://escritorasady.com.br/artigos";
const sanityProject = "zwhnxf2h";
const sanityDataset = "production";
const sanityApiVersion = "2025-02-19";
const articleQuery = `*[_type == "article" && !(_id in path("drafts.**")) && status == "published" && defined(category->_id) && count(body[_type == "block" && count(children[_type == "span" && text match "*"]) > 0]) > 0 && length(slug.current) > 0 && length(title) > 0 && length(summary) > 0 && defined(dateTime(publishedAt)) && dateTime(publishedAt) <= dateTime(now())] | order(publishedAt desc) {_id,title,"slug":slug.current,summary,publishedAt,status,"category":category->title,body}`;

const escapeHtml = (value) => String(value == null ? "" : value).replace(
  /[&<>"']/g,
  (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character],
);

function hasTextContent(body) {
  return Array.isArray(body) && body.some((block) => block && block._type === "block" &&
    Array.isArray(block.children) && block.children.some((child) => child && child._type === "span" &&
      typeof child.text === "string" && child.text.trim()));
}

function isPublicArticle(article, now = new Date()) {
  const publishedAt = article && new Date(article.publishedAt);
  return Boolean(article && article.status === "published" && article.slug && article.slug.trim() &&
    article.title && article.title.trim() && article.summary && article.summary.trim() &&
    article.category && article.category.trim() && hasTextContent(article.body) &&
    !Number.isNaN(publishedAt.getTime()) && publishedAt <= now);
}

function readingMinutes(blocks = []) {
  const words = blocks.filter((block) => block && block._type === "block")
    .reduce((children, block) => children.concat(block.children || []), [])
    .map((child) => child.text || "").join(" ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function articleRows(articles) {
  return articles.map((article, index) => {
    const href = `${officialArticlesUrl}/${encodeURIComponent(article.slug)}`;
    const delay = Math.min(index + 1, 4);
    return `<article class="article-row reveal" data-reveal="soft" data-delay="${delay}"><span class="article-number">${String(index + 1).padStart(2, "0")}</span><div><p>${escapeHtml(article.category)} · ${readingMinutes(article.body)} min</p><h3><a href="${href}">${escapeHtml(article.title)}</a></h3><small>${escapeHtml(article.summary)}</small></div><b aria-hidden="true">↗</b></article>`;
  }).join("");
}

function articlesFallback() {
  return `<div class="archive-empty reveal" data-reveal="soft"><p>O acervo atualizado está disponível no site oficial.</p><a href="${officialArticlesUrl}">Acessar o acervo</a></div>`;
}

async function fetchPublicArticles() {
  const endpoint = `https://${sanityProject}.api.sanity.io/v${sanityApiVersion}/data/query/${sanityDataset}?query=${encodeURIComponent(articleQuery)}`;
  const payload = await new Promise((resolve, reject) => {
    const request = https.get(endpoint, { headers: { accept: "application/json" } }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => {
        if (response.statusCode < 200 || response.statusCode >= 300) return reject(new Error(`Sanity ${response.statusCode}`));
        try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
      });
    });
    request.setTimeout(8000, () => request.destroy(new Error("timeout do Sanity")));
    request.on("error", reject);
  });
  if (!payload || !Array.isArray(payload.result)) throw new Error("resposta inválida do Sanity");
  return payload.result.filter((article) => isPublicArticle(article));
}

function pageLinks(html) {
  const replaceAll = (value, search, replacement) =>
    value.split(search).join(replacement);
  let result = replaceAll(
    html,
    'href="/artigos"',
    `href="${base}/artigos/"`,
  );
  result = replaceAll(result, 'href="/#', `href="${base}/#`);
  result = replaceAll(result, 'href="/"', `href="${base}/"`);
  result = replaceAll(
      result,
      "https://escritorasady.com.br/artigos",
      `${publicUrl}/artigos/`,
    );
  return replaceAll(
      result,
      "https://escritorasady.com.br/",
      `${publicUrl}/`,
    );
}

async function buildPages() {
  const [homeTemplate, articlesTemplate, css, editorialJs, js, biographyImage, articleList] = await Promise.all([
    fs.readFile("static/index.html", "utf8"),
    fs.readFile("static/articles.html", "utf8"),
    fs.readFile("app/globals.css", "utf8"),
    fs.readFile("static/editorial.js", "utf8"),
    fs.readFile("static/site.js", "utf8"),
    fs.readFile("public/sady-santana-biografia.jpg"),
    fetchPublicArticles().then(articleRows).catch((error) => {
      console.warn(`[pages] Sanity indisponível; usando fallback do acervo: ${error instanceof Error ? error.message : "erro desconhecido"}`);
      return articlesFallback();
    }),
  ]);
  const pagesJs = js.replace(
    'fetch("/api/inscrever"',
    'fetch("https://escritorasady.com.br/api/inscrever"',
  );

  const home = pageLinks(homeTemplate)
    .replace("/*__CSS__*/", css)
    .replace("/*__EDITORIAL_JS__*/", editorialJs)
    .replace("/*__JS__*/", pagesJs)
    .replace("__HERO_IMAGE__", `${base}/hero-sady-santana.png`)
    .replace(
      "__BIO_IMAGE__",
      `data:image/jpeg;base64,${biographyImage.toString("base64")}`,
    )
    .split("__FEMININITY_COVER__").join(
      `${base}/feminilidade-biblica-capa.jpg`,
    )
    .split("__DRESS_COVER__").join(
      `${base}/o-vestido-nunca-usado-capa.jpg`,
    );

  const articles = pageLinks(articlesTemplate)
    .replace("/*__CSS__*/", css)
    .replace("/*__EDITORIAL_JS__*/", editorialJs)
    .replace("__ARTICLE_LIST__", articleList);

  await fs.mkdir("docs/artigos", { recursive: true });
  await Promise.all([
    fs.writeFile("docs/index.html", home),
    fs.writeFile("docs/artigos/index.html", articles),
    fs.copyFile("public/hero-sady-santana.png", "docs/hero-sady-santana.png"),
    fs.copyFile(
      "public/feminilidade-biblica-capa.jpg",
      "docs/feminilidade-biblica-capa.jpg",
    ),
    fs.copyFile(
      "public/o-vestido-nunca-usado-capa.jpg",
      "docs/o-vestido-nunca-usado-capa.jpg",
    ),
    fs.writeFile("docs/.nojekyll", ""),
    fs.writeFile(
      "docs/robots.txt",
      `User-agent: *\nAllow: /\nSitemap: ${publicUrl}/sitemap.xml\n`,
    ),
    fs.writeFile(
      "docs/sitemap.xml",
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${publicUrl}/</loc></url><url><loc>${publicUrl}/artigos/</loc></url></urlset>\n`,
    ),
  ]);
}

buildPages().catch((error) => {
  console.error(error);
  process.exit(1);
});
