const list = (S, title, filter) => S.listItem().title(title).child(S.documentList().title(title).filter(filter).defaultOrdering([{field: "publishedAt", direction: "desc"}]));
export const structure = (S) => S.list().title("Conteúdo").items([
  S.documentTypeListItem("article").title("Todos os artigos"),
  list(S, "Rascunhos", '_type == "article" && status == "draft"'),
  list(S, "Publicados", '_type == "article" && status == "published"'),
  list(S, "Arquivados", '_type == "article" && status == "archived"'),
  S.divider(), S.documentTypeListItem("category").title("Categorias"),
]);
