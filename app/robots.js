export const dynamic = "force-static";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://sady-santana-escritora.elufurtado.chatgpt.site/sitemap.xml",
  };
}
