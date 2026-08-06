import {promises as fs} from "fs";
import {slugify} from "../lib/articles.mjs";

const input = process.argv[2];
if (!input) throw new Error("Uso: node scripts/prepare-import.mjs caminho/artigos.json");
const articles = JSON.parse(await fs.readFile(input, "utf8"));
if (!Array.isArray(articles)) throw new Error("O arquivo deve conter uma lista JSON.");
const lines = articles.map((item, index) => {
  for (const field of ["title", "summary", "publishedAt", "body"]) if (!item[field]) throw new Error(`Item ${index + 1}: falta ${field}`);
  const slug = item.slug || slugify(item.title);
  return JSON.stringify({_id:`article-${slug}`, _type:"article", title:item.title, slug:{_type:"slug", current:slug}, summary:item.summary, publishedAt:item.publishedAt, updatedAt:item.updatedAt, status:"draft", topics:item.topics || [], body:item.body, sourceReference:item.sourceReference});
});
await fs.writeFile("sanity/import-ready.ndjson", lines.join("\n") + "\n");
console.log(`${lines.length} artigo(s) preparado(s) como rascunho em sanity/import-ready.ndjson`);
