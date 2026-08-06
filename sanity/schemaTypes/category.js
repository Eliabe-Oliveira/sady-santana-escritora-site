import {defineField, defineType} from "sanity";

export default defineType({
  name: "category", title: "Categoria", type: "document",
  fields: [
    defineField({name: "title", title: "Nome", type: "string", validation: (r) => r.required()}),
    defineField({name: "slug", title: "Identificador", type: "slug", options: {source: "title"}, validation: (r) => r.required()}),
  ],
});
