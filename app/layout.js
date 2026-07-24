import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://sady-santana-escritora.elufurtado.chatgpt.site"),
  alternates: {
    canonical: "/",
  },
  title: {
    default: "Sady Santana Escritora site",
    template: "%s | Sady Santana",
  },
  description:
    "Conheça a trajetória, os livros e os temas de Sady Santana, jornalista, escritora cristã e pesquisadora da feminilidade bíblica.",
  keywords: [
    "Sady Santana",
    "escritora cristã",
    "feminilidade bíblica",
    "literatura cristã",
    "O vestido nunca usado",
    "mulher cristã reformada",
  ],
  authors: [{ name: "Sady Santana" }],
  creator: "Sady Santana",
  openGraph: {
    title: "Sady Santana Escritora site",
    description:
      "Palavras que atravessam o cotidiano e apontam para a graça.",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/hero-sady-santana.png",
        width: 1586,
        height: 992,
        alt: "Livro aberto entre rosas e ramos de oliveira",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sady Santana Escritora site",
    description: "Fé, literatura e feminilidade bíblica.",
    images: ["/hero-sady-santana.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({ children }) {
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Sady Santana",
    jobTitle: "Jornalista e escritora",
    description:
      "Jornalista formada pelo Mackenzie, autora cristã e estudiosa de teologia.",
    knowsAbout: [
      "Literatura cristã",
      "Feminilidade bíblica",
      "Família cristã",
      "Teologia",
    ],
  };

  return (
    <html lang="pt-BR">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
      </body>
    </html>
  );
}
