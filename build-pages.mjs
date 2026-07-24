import { promises as fs } from "fs";

const base = "/sady-santana-escritora-site";
const publicUrl = "https://eliabe-oliveira.github.io/sady-santana-escritora-site";

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
      "https://sady-santana-escritora.elufurtado.chatgpt.site/artigos",
      `${publicUrl}/artigos/`,
    );
  return replaceAll(
      result,
      "https://sady-santana-escritora.elufurtado.chatgpt.site/",
      `${publicUrl}/`,
    );
}

async function buildPages() {
  const [homeTemplate, articlesTemplate, css, js] = await Promise.all([
    fs.readFile("static/index.html", "utf8"),
    fs.readFile("static/articles.html", "utf8"),
    fs.readFile("app/globals.css", "utf8"),
    fs.readFile("static/site.js", "utf8"),
  ]);
  const pagesJs = js.replace(
    'fetch("/api/inscrever"',
    'fetch("https://sady-santana-escritora.elufurtado.chatgpt.site/api/inscrever"',
  );

  const home = pageLinks(homeTemplate)
    .replace("/*__CSS__*/", css)
    .replace("/*__JS__*/", pagesJs)
    .replace("__HERO_IMAGE__", `${base}/hero-sady-santana.png`)
    .split("__FEMININITY_COVER__").join(
      `${base}/feminilidade-biblica-capa.jpg`,
    )
    .split("__DRESS_COVER__").join(
      `${base}/o-vestido-nunca-usado-capa.jpg`,
    );

  const articles = pageLinks(articlesTemplate)
    .replace("/*__CSS__*/", css)
    .replace("/*__JS__*/", pagesJs);

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
