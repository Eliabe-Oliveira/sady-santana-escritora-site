import {promises as fs} from "fs";

const esc = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));

async function build() {
  const [homeTemplate, articlesTemplate, css, js, hero, bio, femininity, dress, hosting] = await Promise.all([
    fs.readFile("static/index.html", "utf8"), fs.readFile("static/articles.html", "utf8"),
    fs.readFile("app/globals.css", "utf8"), fs.readFile("static/site.js", "utf8"),
    fs.readFile("public/hero-sady-santana.png"), fs.readFile("public/sady-santana-biografia.jpg"),
    fs.readFile("public/feminilidade-biblica-capa.jpg"), fs.readFile("public/o-vestido-nunca-usado-capa.jpg"),
    fs.readFile(".openai/hosting.json", "utf8"),
  ]);
  const home = homeTemplate.replace("/*__CSS__*/", css).replace("/*__JS__*/", js)
    .replace("__HERO_IMAGE__", `data:image/png;base64,${hero.toString("base64")}`)
    .replace("__BIO_IMAGE__", `data:image/jpeg;base64,${bio.toString("base64")}`)
    .split("__FEMININITY_COVER__").join(`data:image/jpeg;base64,${femininity.toString("base64")}`)
    .split("__DRESS_COVER__").join(`data:image/jpeg;base64,${dress.toString("base64")}`);
  const archive = articlesTemplate
    .replace("/*__CSS__*/", css + "\n/*__EDITORIAL_CSS__*/")
    .replace("/*__JS__*/", js)
    .replace(/<div class="articles-list">[\s\S]*?<\/div>\s*<\/section>/, '<div class="article-tools">__TOOLS__</div><div class="articles-list">__ARTICLE_LIST__</div>__PAGINATION__</section>');

  const worker = `
const HOME=${JSON.stringify(home)};
const ARCHIVE=${JSON.stringify(archive)};
const CSS=${JSON.stringify(css)};
const SITE_DEFAULT="https://sady-santana-escritora.elufurtado.chatgpt.site";
const PAGE_SIZE=8;
const E=${esc.toString()};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
const html=(body,status=200)=>new Response(body,{status,headers:{"content-type":"text/html; charset=utf-8","cache-control":"public, max-age=60, stale-while-revalidate=300","x-content-type-options":"nosniff","referrer-policy":"strict-origin-when-cross-origin"}});
const date=(value)=>new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"long",year:"numeric",timeZone:"America/Sao_Paulo"}).format(new Date(value));
const words=(blocks=[])=>blocks.filter(b=>b&&b._type==="block").flatMap(b=>b.children||[]).map(c=>c.text||"").join(" ").trim().split(/\\s+/).filter(Boolean).length;
const minutes=(blocks)=>Math.max(1,Math.ceil(words(blocks)/220));
const imageUrl=(image,width=1200)=>image&&image.asset&&image.asset.url?image.asset.url+"?auto=format&fit=max&w="+width:"";
const publicFilter='status == "published" && defined(slug.current) && defined(title) && defined(summary) && defined(publishedAt) && publishedAt <= now()';
const projection='{_id,title,"slug":slug.current,summary,publishedAt,updatedAt,status,featured,topics,"category":category->title,body,coverImage{alt,caption,credit,asset->{url,metadata{dimensions}}},socialImage{asset->{url}},seoTitle,seoDescription,canonicalUrl,"related":relatedArticle->{title,"slug":slug.current,summary,publishedAt,status}}';
async function sanity(env,query){
  const project=env.PUBLIC_SANITY_PROJECT_ID, dataset=env.PUBLIC_SANITY_DATASET||"production", version=env.SANITY_API_VERSION||"2025-02-19";
  if(!project)return null;
  const endpoint="https://"+project+".api.sanity.io/v"+version+"/data/query/"+encodeURIComponent(dataset)+"?query="+encodeURIComponent(query);
  const response=await fetch(endpoint,{headers:{accept:"application/json"},cf:{cacheTtl:60,cacheEverything:true}});
  if(!response.ok)throw new Error("Sanity "+response.status);
  return (await response.json()).result;
}
function cover(article,detail=false){
  const src=imageUrl(article.coverImage,detail?1600:900); if(!src)return detail?"":'<span class="article-cover-fallback" aria-hidden="true"></span>';
  const alt=E(article.coverImage.alt||"");
  return '<figure class="article-cover"><img src="'+E(src)+'" alt="'+alt+'" width="1200" height="675" '+(detail?'':'loading="lazy"')+'><figcaption>'+(article.coverImage.caption?E(article.coverImage.caption):"")+(article.coverImage.credit?' <span>'+E(article.coverImage.credit)+'</span>':"")+'</figcaption></figure>';
}
function renderBlocks(blocks=[]){return blocks.map(block=>{
  if(block._type==="divider")return "<hr>";
  if(block._type==="image")return cover({coverImage:block},true);
  if(block._type!=="block")return "";
  const children=(block.children||[]).map(child=>{let value=E(child.text||"");(child.marks||[]).forEach(mark=>{if(mark==="strong")value="<strong>"+value+"</strong>";if(mark==="em")value="<em>"+value+"</em>";const def=(block.markDefs||[]).find(d=>d._key===mark&&d._type==="link");if(def)value='<a href="'+E(def.href)+'" rel="noreferrer">'+value+'</a>';});return value;}).join("");
  const tag={h2:"h2",h3:"h3",blockquote:"blockquote"}[block.style]||"p"; return "<"+tag+">"+children+"</"+tag+">";
}).join("")}
function shell(content,title,description,canonical,ogType="website",ogImage="",schema=""){
  const meta='<title>'+E(title)+'</title><meta name="description" content="'+E(description)+'"><link rel="canonical" href="'+E(canonical)+'"><meta property="og:title" content="'+E(title)+'"><meta property="og:description" content="'+E(description)+'"><meta property="og:type" content="'+ogType+'"><meta property="og:url" content="'+E(canonical)+'">'+(ogImage?'<meta property="og:image" content="'+E(ogImage)+'">':"")+'<meta name="twitter:card" content="summary_large_image">'+(schema?'<script type="application/ld+json">'+schema.replace(/</g,"\\u003c")+'<\\/script>':"");
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+meta+'<style>'+CSS+'/*__EDITORIAL_CSS__*/</style></head><body class="articles-page">'+content+'</body></html>';
}
function header(){return '<a class="skip-link" href="#conteudo">Ir para o conteúdo</a><header class="site-header"><a class="brand" href="/" aria-label="Sady Santana — início"><span class="leaf-mark"><i></i><i></i><i></i><i></i><b></b></span><span><strong>Sady Santana</strong><small>escritora</small></span></a><nav aria-label="Navegação principal"><a href="/#sobre">Sobre</a><a href="/#livros">Livros</a><a href="/#palestras">Palestras</a><a href="/artigos" aria-current="page">Artigos</a></nav></header>'}
function footer(){return '<footer><a class="brand footer-brand" href="/"><span class="leaf-mark light"><i></i><i></i><i></i><i></i><b></b></span><span><strong>Sady Santana</strong><small>escritora</small></span></a><p>Fé, literatura e feminilidade bíblica.</p><div><a href="/">Início</a><a href="/artigos">Artigos</a><a href="#conteudo">↑</a></div></footer>'}
function tools(categories,selected,q){return '<form class="archive-filters" method="get" action="/artigos" role="search"><label for="busca">Buscar no acervo</label><input id="busca" name="q" value="'+E(q)+'" placeholder="Título, resumo ou tema"><label for="categoria">Categoria</label><select id="categoria" name="categoria"><option value="">Todas as categorias</option>'+categories.map(c=>'<option '+(c===selected?'selected ':"")+'value="'+E(c)+'">'+E(c)+'</option>').join("")+'</select><button class="button dark" type="submit">Filtrar</button></form>'}
function row(a,index){return '<article class="article-row"><span class="article-number">'+String(index+1).padStart(2,"0")+'</span><div>'+cover(a)+'<p>'+E(a.category||"Reflexão")+' · '+E(date(a.publishedAt))+' · '+minutes(a.body)+' min</p><h3><a href="/artigos/'+encodeURIComponent(a.slug)+'">'+E(a.title)+'</a></h3><small>'+E(a.summary)+'</small></div><b aria-hidden="true">↗</b></article>'}
async function archivePage(url,env,page=1){
  let articles=[]; try{articles=await sanity(env,'*[_type == "article" && '+publicFilter+'] | order(publishedAt desc) '+projection)||[]}catch{}
  const categories=[...new Set(articles.map(a=>a.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
  const selected=url.searchParams.get("categoria")||"", q=(url.searchParams.get("q")||"").trim().toLocaleLowerCase("pt-BR");
  articles=articles.filter(a=>(!selected||a.category===selected)&&(!q||[a.title,a.summary,a.category,...(a.topics||[])].join(" ").toLocaleLowerCase("pt-BR").includes(q)));
  const total=Math.max(1,Math.ceil(articles.length/PAGE_SIZE)); if(page>total)return html("Página não encontrada",404);
  const visible=articles.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const query=(selected?'&categoria='+encodeURIComponent(selected):'')+(q?'&q='+encodeURIComponent(q):'');
  const pagination=total>1?'<nav class="pagination" aria-label="Páginas do acervo">'+Array.from({length:total},(_,i)=>{const n=i+1,href=n===1?"/artigos":"/artigos/pagina/"+n;return '<a '+(n===page?'aria-current="page" ':'')+'href="'+href+'?'+query.slice(1)+'">'+n+'</a>'}).join("")+'</nav>':"";
  const empty='<div class="archive-empty"><h3>Ainda não há textos para estes filtros.</h3><p>Volte ao acervo completo ou tente outra busca.</p><a href="/artigos">Ver todo o acervo</a></div>';
  return html(ARCHIVE.replace("__TOOLS__",tools(categories,selected,url.searchParams.get("q")||"")).replace("__ARTICLE_LIST__",visible.length?visible.map(row).join(""):empty).replace("__PAGINATION__",pagination).replaceAll("/*__EDITORIAL_CSS__*/",EDITORIAL_CSS));
}
async function articlePage(slug,env,url){
  let article; try{article=await sanity(env,'*[_type == "article" && slug.current == '+JSON.stringify(slug)+' && '+publicFilter+'][0] '+projection)}catch{}
  if(!article)return html(shell(header()+'<main id="conteudo" class="not-found"><h1>Este artigo não foi encontrado.</h1><a href="/artigos">Voltar ao acervo</a></main>'+footer(),"Artigo não encontrado | Sady Santana","O artigo solicitado não está disponível.",url.origin+url.pathname).replaceAll("/*__EDITORIAL_CSS__*/",EDITORIAL_CSS),404);
  const site=env.PUBLIC_SITE_URL||SITE_DEFAULT, canonical=article.canonicalUrl||site+"/artigos/"+article.slug, title=article.seoTitle||article.title, description=article.seoDescription||article.summary, image=imageUrl(article.socialImage||article.coverImage,1200);
  const schema=JSON.stringify({"@context":"https://schema.org","@type":"BlogPosting",headline:title,description,image:image||undefined,datePublished:article.publishedAt,dateModified:article.updatedAt||article.publishedAt,author:{"@type":"Person",name:"Sady Santana"},mainEntityOfPage:canonical});
  const related=article.related&&article.related.status==="published"&&article.related.publishedAt&&new Date(article.related.publishedAt)<=new Date()?'<aside class="related"><p>Continue lendo</p><a href="/artigos/'+E(article.related.slug)+'">'+E(article.related.title)+'</a></aside>':"";
  const content=header()+'<main id="conteudo"><article class="article-detail"><header><p class="kicker">'+E(article.category||"Reflexão")+'</p><h1>'+E(article.title)+'</h1><p class="article-lead">'+E(article.summary)+'</p><p class="article-meta"><time datetime="'+E(article.publishedAt)+'">'+E(date(article.publishedAt))+'</time> · '+minutes(article.body)+' min de leitura'+(article.updatedAt?' · Atualizado em '+E(date(article.updatedAt)):"")+'</p></header>'+cover(article,true)+'<div class="prose">'+renderBlocks(article.body)+'</div><div class="article-actions"><a href="/artigos">← Voltar ao acervo</a><a href="https://wa.me/?text='+encodeURIComponent(article.title+" "+canonical)+'" target="_blank" rel="noreferrer">Compartilhar no WhatsApp</a><button type="button" onclick="navigator.clipboard.writeText(location.href);this.textContent=&quot;Link copiado&quot;">Copiar link</button></div>'+related+'<aside class="books-callout"><p>Outras histórias, a mesma esperança.</p><a href="/#livros">Conheça os livros de Sady</a></aside></article></main>'+footer();
  return html(shell(content,title+" | Sady Santana",description,canonical,"article",image,schema).replaceAll("/*__EDITORIAL_CSS__*/",EDITORIAL_CSS));
}
const EDITORIAL_CSS=${JSON.stringify(`
.article-tools{grid-column:2}.archive-filters{display:grid;grid-template-columns:1fr 220px auto;gap:12px;align-items:end;margin-bottom:35px}.archive-filters label{position:absolute;clip:rect(0 0 0 0)}.archive-filters input,.archive-filters select{min-height:48px;border:1px solid var(--line);background:#fff;padding:0 14px;color:var(--ink);font:inherit}.article-row{display:grid}.article-row>div{min-width:0}.article-row h3 a{color:inherit}.article-cover{margin:0 0 22px}.article-row .article-cover{float:right;width:150px;margin:0 0 15px 25px}.article-cover img{display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:cover}.article-cover figcaption{font-size:11px;color:var(--muted);margin-top:8px}.article-cover figcaption span{font-style:italic}.article-cover-fallback{display:block;aspect-ratio:16/9;background:linear-gradient(135deg,var(--ivory),#e9ded5)}.pagination{grid-column:2;display:flex;gap:8px;margin-top:35px}.pagination a{display:grid;place-items:center;width:42px;height:42px;border:1px solid var(--line)}.pagination a[aria-current]{background:var(--burgundy);color:#fff}.archive-empty{padding:55px 0;border-bottom:1px solid var(--line)}.archive-empty h3{font-size:30px}.article-detail{max-width:1120px;margin:auto;padding:130px 8vw 100px}.article-detail>header{max-width:850px;margin-bottom:55px}.article-detail h1{font-size:clamp(48px,7vw,92px);line-height:1;letter-spacing:-.045em;margin:22px 0}.article-lead{font:clamp(18px,2vw,24px)/1.6 "Playfair Display",serif;color:var(--muted)}.article-meta{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rose)}.article-detail>.article-cover{max-width:980px}.prose{max-width:720px;margin:70px auto;font:18px/1.85 "Playfair Display",serif}.prose h2{font-size:38px;line-height:1.2;margin:2em 0 .7em}.prose h3{font-size:27px;margin:1.8em 0 .6em}.prose blockquote{font-size:27px;line-height:1.5;border-left:3px solid var(--rose);margin:2em 0;padding-left:30px}.prose a{text-decoration:underline;text-underline-offset:3px;overflow-wrap:anywhere}.prose hr{border:0;border-top:1px solid var(--line);margin:55px 0}.article-actions,.books-callout,.related{max-width:720px;margin:35px auto;display:flex;flex-wrap:wrap;gap:20px;padding-top:25px;border-top:1px solid var(--line)}.article-actions button{border:0;background:none;font:inherit;color:var(--rose);cursor:pointer}.books-callout{background:var(--burgundy);color:#fff;padding:30px;border:0;justify-content:space-between}.not-found{min-height:70vh;padding:180px 8vw}.not-found h1{font-size:clamp(42px,6vw,80px)}
@media(max-width:900px){.article-tools,.pagination{grid-column:1}.archive-filters{grid-template-columns:1fr}.article-row .article-cover{float:none;width:100%;margin:0 0 20px}.article-detail{padding:90px 7vw}.prose{font-size:17px}}@media(max-width:380px){.article-detail h1{font-size:42px}.article-detail{padding-left:5vw;padding-right:5vw}.article-actions{flex-direction:column}.prose blockquote{font-size:22px;padding-left:18px}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;transition-duration:.01ms!important}}
`)};
async function sitemap(env,site){let articles=[];try{articles=await sanity(env,'*[_type == "article" && '+publicFilter+'] | order(publishedAt desc) {"slug":slug.current,updatedAt,publishedAt}')||[]}catch{}return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'+site+'/</loc></url><url><loc>'+site+'/artigos</loc></url>'+articles.map(a=>'<url><loc>'+site+'/artigos/'+E(a.slug)+'</loc><lastmod>'+E(a.updatedAt||a.publishedAt)+'</lastmod></url>').join("")+'</urlset>'}
export default {async fetch(request,env){const url=new URL(request.url),site=env.PUBLIC_SITE_URL||SITE_DEFAULT;
  if(url.pathname==="/robots.txt")return new Response("User-agent: *\\nAllow: /\\nSitemap: "+site+"/sitemap.xml\\n",{headers:{"content-type":"text/plain"}});
  if(url.pathname==="/sitemap.xml")return new Response(await sitemap(env,site),{headers:{"content-type":"application/xml","cache-control":"public, max-age=300"}});
  if(url.pathname==="/api/inscrever"&&request.method==="POST"){let body;try{body=await request.json()}catch{return json({error:"Dados inválidos."},400)}const email=String(body.email||"").trim().toLowerCase();if(body.company)return json({ok:true});if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email))return json({error:"Informe um e-mail válido."},400);if(!body.consent)return json({error:"É necessário aceitar o envio dos avisos."},400);return json({error:"A lista de artigos ainda será integrada em uma etapa futura.",code:"CONFIG_PENDING"},503)}
  if(url.pathname==="/artigos"||url.pathname==="/artigos/")return archivePage(url,env,1);
  const page=url.pathname.match(/^\\/artigos\\/pagina\\/(\\d+)\\/?$/);if(page)return archivePage(url,env,Number(page[1]));
  const article=url.pathname.match(/^\\/artigos\\/([^/]+)\\/?$/);if(article)return articlePage(decodeURIComponent(article[1]),env,url);
  if(url.pathname!=="/")return html("Página não encontrada",404);return html(HOME);
}};`;
  await fs.mkdir("dist/server", {recursive:true}); await fs.mkdir("dist/.openai", {recursive:true});
  await fs.writeFile("dist/server/index.js", worker); await fs.writeFile("dist/.openai/hosting.json", hosting);
}
build().catch((error) => {console.error(error); process.exit(1)});
