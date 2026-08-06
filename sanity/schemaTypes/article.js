import {defineArrayMember, defineField, defineType} from "sanity";

const published = ({document}) => document?.status === "published";
export default defineType({
  name: "article", title: "Artigo", type: "document",
  groups: [
    {name: "writing", title: "Texto", default: true}, {name: "image", title: "Imagem"},
    {name: "dates", title: "Datas"}, {name: "seo", title: "SEO"}, {name: "editorial", title: "Estado editorial"},
  ],
  fields: [
    defineField({name: "title", title: "Título", type: "string", group: "writing", validation: (r) => r.required().max(120)}),
    defineField({name: "slug", title: "Endereço permanente", description: "Depois de publicar, não altere: links antigos deixariam de funcionar.", type: "slug", group: "writing", options: {source: "title", maxLength: 96}, readOnly: published, validation: (r) => r.required()}),
    defineField({name: "summary", title: "Resumo", description: "Duas ou três frases para o acervo e compartilhamento.", type: "text", rows: 3, group: "writing", validation: (r) => r.required().max(280)}),
    defineField({name: "category", title: "Categoria", type: "reference", to: [{type: "category"}], group: "writing", validation: (r) => r.required()}),
    defineField({name: "topics", title: "Temas e palavras-chave", type: "array", of: [{type: "string"}], options: {layout: "tags"}, group: "writing"}),
    defineField({name: "featured", title: "Destacar no acervo", type: "boolean", initialValue: false, group: "writing"}),
    defineField({name: "relatedArticle", title: "Artigo relacionado", type: "reference", to: [{type: "article"}], options: {disableNew: true}, group: "writing"}),
    defineField({name: "coverImage", title: "Imagem de capa", type: "image", options: {hotspot: true}, group: "image", fields: [
      defineField({name: "alt", title: "Texto alternativo", type: "string", validation: (r) => r.custom((value, context) => context.parent?.asset && !value ? "Descreva a imagem para leitores de tela." : true)}),
      defineField({name: "caption", title: "Legenda", type: "string"}), defineField({name: "credit", title: "Crédito", type: "string"}),
    ]}),
    defineField({name: "body", title: "Conteúdo", type: "array", group: "writing", validation: (r) => r.required().min(1), of: [
      defineArrayMember({type: "block", styles: [{title: "Normal", value: "normal"}, {title: "Título 2", value: "h2"}, {title: "Título 3", value: "h3"}, {title: "Citação", value: "blockquote"}], marks: {annotations: [{name: "link", type: "object", title: "Link", fields: [{name: "href", type: "url", title: "Endereço", validation: (r) => r.uri({scheme: ["http", "https", "mailto"]})}]}]}}),
      defineArrayMember({type: "object", name: "divider", title: "Divisor", fields: [{name: "style", type: "string", hidden: true, initialValue: "default"}], preview: {prepare: () => ({title: "Divisor"})}}),
      defineArrayMember({type: "image", options: {hotspot: true}, fields: [{name: "alt", title: "Texto alternativo", type: "string", validation: (r) => r.required()}, {name: "caption", title: "Legenda", type: "string"}, {name: "credit", title: "Crédito", type: "string"}]})
    ]}),
    defineField({name: "publishedAt", title: "Data original de publicação", type: "datetime", group: "dates", validation: (r) => r.required()}),
    defineField({name: "updatedAt", title: "Data da última atualização editorial", type: "datetime", group: "dates"}),
    defineField({name: "seoTitle", title: "Título de SEO", type: "string", group: "seo", validation: (r) => r.max(60)}),
    defineField({name: "seoDescription", title: "Descrição de SEO", type: "text", rows: 3, group: "seo", validation: (r) => r.max(160)}),
    defineField({name: "socialImage", title: "Imagem para compartilhamento", type: "image", group: "seo"}),
    defineField({name: "canonicalUrl", title: "URL canônica alternativa", description: "Deixe vazio quando o artigo nasceu neste site.", type: "url", group: "seo"}),
    defineField({name: "status", title: "Estado", type: "string", group: "editorial", initialValue: "draft", options: {layout: "radio", list: [{title: "Rascunho", value: "draft"}, {title: "Publicado", value: "published"}, {title: "Arquivado", value: "archived"}]}, validation: (r) => r.required()}),
    defineField({name: "sourceReference", title: "Origem ou referência", type: "url", group: "editorial"}),
  ],
  preview: {select: {title: "title", subtitle: "status", media: "coverImage"}, prepare: ({title, subtitle, media}) => ({title, subtitle: ({draft: "Rascunho", published: "Publicado", archived: "Arquivado"})[subtitle] || subtitle, media})},
});
