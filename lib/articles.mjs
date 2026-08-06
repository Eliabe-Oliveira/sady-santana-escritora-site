export const PAGE_SIZE = 8;

export function isPublicArticle(article, now = new Date()) {
  return Boolean(
    article &&
    article.status === "published" &&
    article.slug &&
    article.title &&
    article.summary &&
    article.publishedAt &&
    new Date(article.publishedAt) <= now
  );
}

export function publicArticles(articles, now = new Date()) {
  return articles.filter((article) => isPublicArticle(article, now)).sort(
    (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt),
  );
}

export function readingMinutes(blocks = []) {
  const words = blocks
    .filter((block) => block && block._type === "block")
    .flatMap((block) => block.children || [])
    .map((child) => child.text || "")
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function paginate(items, page, size = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  return {items: items.slice((current - 1) * size, current * size), current, totalPages};
}

export function slugify(value) {
  return String(value || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
