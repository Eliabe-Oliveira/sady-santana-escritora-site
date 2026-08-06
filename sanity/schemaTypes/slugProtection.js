export async function validatePermanentSlug(value, context) {
  if (!value?.current) return "Defina o endereço permanente do artigo.";

  const documentId = context.document?._id?.replace(/^drafts\./, "");
  if (!documentId) return true;

  const client = context.getClient({apiVersion: "2025-02-19"});
  const publishedSlug = await client.fetch(
    '*[_id == $documentId][0].slug.current',
    {documentId},
  );

  if (publishedSlug && publishedSlug !== value.current) {
    return "Este artigo já foi publicado. O endereço permanente não pode ser alterado, mesmo ao arquivar ou voltar para rascunho.";
  }
  return true;
}
