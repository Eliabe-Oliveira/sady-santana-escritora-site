import { promises as fs } from "fs";

async function build() {
  const html = await fs.readFile("static/index.html", "utf8");
  const articlesHtml = await fs.readFile("static/articles.html", "utf8");
  const css = await fs.readFile("app/globals.css", "utf8");
  const js = await fs.readFile("static/site.js", "utf8");
  const image = await fs.readFile("public/hero-sady-santana.png");
  const femininityCover = await fs.readFile("public/feminilidade-biblica-capa.jpg");
  const dressCover = await fs.readFile("public/o-vestido-nunca-usado-capa.jpg");
  const hosting = await fs.readFile(".openai/hosting.json", "utf8");

  const document = html
    .replace("/*__CSS__*/", css)
    .replace("/*__JS__*/", js)
    .replace("__HERO_IMAGE__", `data:image/png;base64,${image.toString("base64")}`)
    .split("__FEMININITY_COVER__").join(`data:image/jpeg;base64,${femininityCover.toString("base64")}`)
    .split("__DRESS_COVER__").join(`data:image/jpeg;base64,${dressCover.toString("base64")}`);
  const articlesDocument = articlesHtml
    .replace("/*__CSS__*/", css)
    .replace("/*__JS__*/", js);

  const worker = `const HTML=${JSON.stringify(document)};
const ARTICLES_HTML=${JSON.stringify(articlesDocument)};
const ROBOTS="User-agent: *\\nAllow: /\\nSitemap: https://sady-santana-escritora.elufurtado.chatgpt.site/sitemap.xml\\n";
const SITEMAP='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://sady-santana-escritora.elufurtado.chatgpt.site/</loc><changefreq>monthly</changefreq><priority>1.0</priority></url><url><loc>https://sady-santana-escritora.elufurtado.chatgpt.site/artigos</loc><changefreq>monthly</changefreq><priority>0.8</priority></url></urlset>';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
export default {async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==="/robots.txt") return new Response(ROBOTS,{headers:{"content-type":"text/plain; charset=utf-8","cache-control":"public, max-age=3600"}});
  if(url.pathname==="/sitemap.xml") return new Response(SITEMAP,{headers:{"content-type":"application/xml; charset=utf-8","cache-control":"public, max-age=3600"}});
  if(url.pathname==="/api/inscrever"&&request.method==="POST"){
    let body; try{body=await request.json()}catch{return json({error:"Dados inválidos."},400)}
    const email=String(body.email||"").trim().toLowerCase(),name=String(body.name||"").trim();
    if(body.company)return json({ok:true});
    if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email))return json({error:"Informe um e-mail válido."},400);
    if(!body.consent)return json({error:"É necessário aceitar o envio dos avisos."},400);
    if(!env.LISTMONK_URL||!env.LISTMONK_LIST_UUID)return json({error:"A lista de artigos ainda está sendo configurada. Tente novamente em breve.",code:"CONFIG_PENDING"},503);
    const endpoint=env.LISTMONK_URL.replace(/\\/$/,"")+"/api/public/subscription";
    try{
      const response=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email,name,list_uuids:[env.LISTMONK_LIST_UUID]})});
      if(!response.ok)return json({error:"Não foi possível concluir a inscrição agora."},502);
      return json({ok:true,message:"Confira seu e-mail para confirmar a inscrição."});
    }catch{return json({error:"O serviço de inscrições está temporariamente indisponível."},502)}
  }
  if(url.pathname==="/artigos"||url.pathname==="/artigos/")return new Response(ARTICLES_HTML,{headers:{"content-type":"text/html; charset=utf-8","cache-control":"public, max-age=300","x-content-type-options":"nosniff"}});
  if(url.pathname!=="/") return new Response("Página não encontrada",{status:404,headers:{"content-type":"text/plain; charset=utf-8"}});
  return new Response(HTML,{headers:{"content-type":"text/html; charset=utf-8","cache-control":"public, max-age=300","x-content-type-options":"nosniff","referrer-policy":"strict-origin-when-cross-origin"}});
}};`;

  await fs.mkdir("dist/server", { recursive: true });
  await fs.mkdir("dist/.openai", { recursive: true });
  await fs.writeFile("dist/server/index.js", worker);
  await fs.writeFile("dist/.openai/hosting.json", hosting);
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
