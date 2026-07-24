"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const books = [
  {
    id: "vestido",
    eyebrow: "Romance cristão · 2022",
    title: "O vestido nunca usado",
    description:
      "Uma história de amor bordada por relacionamentos, piedade, paixão e graça — e por um vestido carregado de significado. O romance aponta, em sua essência, para a maior história de amor de todos os tempos.",
    meta: ["GodBooks", "224 páginas", "ISBN 978-65-89198-45-1"],
    link: "https://godbooks.com.br/product/o-vestido-nunca-usado/",
    cta: "Conhecer o livro",
  },
  {
    id: "feminilidade",
    eyebrow: "Não ficção cristã",
    title: "Feminilidade Bíblica",
    subtitle: "Repensando o papel da mulher à luz de Cantares",
    description:
      "Uma reflexão sobre identidade, vocação e o papel da mulher cristã a partir das Escrituras, mencionada na biografia pública da autora.",
    meta: ["Feminilidade", "Cantares", "Vida cristã"],
    link: "https://goodprime.co/e-dai-o-malabarismo-hermeneutico-da-imprensa-para-desmoralizar-o-presidente/",
    cta: "Ver referência",
  },
];

const themes = [
  {
    number: "01",
    title: "Feminilidade à luz das Escrituras",
    text: "Identidade, beleza, vocação e sabedoria feminina sob uma cosmovisão bíblica.",
    verse: "“Enganosa é a graça, e vã, a formosura.” · Pv 31.30",
  },
  {
    number: "02",
    title: "Mulheres cristãs no mundo digital",
    text: "Presença, modéstia e discernimento para comunicar a fé sem perder a essência.",
    verse: "“Andai como filhos da luz.” · Ef 5.8",
  },
  {
    number: "03",
    title: "Família, cultura e formação dos filhos",
    text: "Como cultivar uma casa firmada na aliança e formar afetos voltados para o Senhor.",
    verse: "“Ensina a criança no caminho.” · Pv 22.6",
  },
  {
    number: "04",
    title: "Graça e redenção na literatura",
    text: "Histórias como janelas para o coração humano e para a maior história de amor.",
    verse: "“Tudo fez formoso no seu devido tempo.” · Ec 3.11",
  },
];

function LeafMark({ light = false }) {
  return (
    <span className={`leaf-mark ${light ? "light" : ""}`} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
      <b />
    </span>
  );
}

function Arrow({ down = false }) {
  return <span aria-hidden="true">{down ? "↓" : "↗"}</span>;
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeBook, setActiveBook] = useState("vestido");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        }),
      { threshold: 0.14 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const book = books.find((item) => item.id === activeBook);

  const handleSubscribe = (event) => {
    event.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <>
      <a className="skip-link" href="#conteudo">
        Ir para o conteúdo
      </a>

      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Sady Santana — início">
          <LeafMark />
          <span>
            <strong>Sady Santana</strong>
            <small>escritora</small>
          </span>
        </a>

        <button
          className="menu-button"
          aria-label="Abrir menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span />
          <span />
        </button>

        <nav className={menuOpen ? "open" : ""} aria-label="Navegação principal">
          {[
            ["Sobre", "#sobre"],
            ["Livros", "#livros"],
            ["Palestras", "#palestras"],
            ["Escritos", "#escritos"],
          ].map(([label, href]) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)}>
              {label}
            </a>
          ))}
          <a className="nav-cta" href="#contato" onClick={() => setMenuOpen(false)}>
            Convites <Arrow />
          </a>
        </nav>
      </header>

      <main id="conteudo">
        <section className="hero" id="inicio">
          <Image
            src="/hero-sady-santana.png"
            alt="Livro aberto, flores e ramos de oliveira em luz suave"
            fill
            priority
            sizes="100vw"
            className="hero-image"
          />
          <div className="hero-shade" />
          <div className="hero-content">
            <p className="kicker">Fé · literatura · feminilidade bíblica</p>
            <h1>
              Palavras que
              <em>apontam para a graça.</em>
            </h1>
            <p className="hero-copy">
              Jornalista e escritora cristã, Sady Santana escreve sobre a beleza
              da fé vivida no cotidiano — entre histórias, afetos e a verdade
              que permanece.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#livros">
                Conheça os livros <Arrow down />
              </a>
              <a className="text-link" href="#sobre">
                Sobre a autora <Arrow />
              </a>
            </div>
          </div>
          <div className="hero-note">
            <LeafMark light />
            <p>
              <span>Uma vida de palavras</span>
              a serviço da verdade.
            </p>
          </div>
        </section>

        <section className="manifesto">
          <p className="section-index">01 · essência</p>
          <blockquote className="reveal">
            “A felicidade da existência humana está no{" "}
            <em>Criador de todas as coisas.</em>”
          </blockquote>
          <p className="quote-source">— O vestido nunca usado</p>
        </section>

        <section className="about" id="sobre">
          <figure className="about-portrait reveal">
            <Image
              src="/sady-santana-biografia.jpg"
              alt="Sady Santana sorrindo"
              width={810}
              height={1080}
              sizes="(max-width: 900px) 86vw, 34vw"
            />
            <figcaption>
              <span>Sobre Sady</span>
              <p>Escrever é também um modo de servir.</p>
            </figcaption>
          </figure>
          <div className="about-copy reveal">
            <p className="kicker">Jornalismo, teologia & literatura</p>
            <h2>Uma escrita que nasce da fé e encontra o cotidiano.</h2>
            <div className="columns">
              <p>
                Sady Santana é jornalista formada pela Universidade
                Presbiteriana Mackenzie. Estudou Teologia no Instituto Bíblico
                Eduardo Lane (IBEL), onde aprofundou seu amor por missões e pela
                Igreja.
              </p>
              <p>
                Escritora, esposa do pastor presbiteriano Nelson Ferreira, mãe
                e avó, sua voz pública percorre temas como feminilidade bíblica,
                família, cultura e graça — com o olhar de quem reconhece a
                soberania de Deus em cada história.
              </p>
            </div>
            <div className="facts" aria-label="Informações sobre a autora">
              <div>
                <strong>Mackenzie</strong>
                <span>Formação em Jornalismo</span>
              </div>
              <div>
                <strong>IBEL</strong>
                <span>Estudos em Teologia</span>
              </div>
              <div>
                <strong>02</strong>
                <span>Obras identificadas</span>
              </div>
            </div>
          </div>
        </section>

        <section className="books" id="livros">
          <div className="section-heading reveal">
            <div>
              <p className="section-index">02 · biblioteca</p>
              <h2>Livros para ler<br />com o coração desperto.</h2>
            </div>
            <p>
              Ficção e reflexão bíblica se encontram em páginas sobre amor,
              identidade, piedade e graça.
            </p>
          </div>

          <div className="book-selector reveal" role="tablist" aria-label="Livros">
            {books.map((item) => (
              <button
                key={item.id}
                role="tab"
                aria-selected={activeBook === item.id}
                onClick={() => setActiveBook(item.id)}
              >
                <span>{item.id === "vestido" ? "01" : "02"}</span>
                {item.title}
              </button>
            ))}
          </div>

          <article className="book-card reveal" key={book.id}>
            <div className={`book-art ${book.id}`}>
              <span className="book-label">Sady Santana</span>
              <div>
                <i />
                <strong>{book.title}</strong>
                {book.subtitle && <small>{book.subtitle}</small>}
              </div>
              <span className="book-publisher">literatura cristã</span>
            </div>
            <div className="book-info">
              <p className="kicker">{book.eyebrow}</p>
              <h3>{book.title}</h3>
              {book.subtitle && <p className="subtitle">{book.subtitle}</p>}
              <p>{book.description}</p>
              <ul>
                {book.meta.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <a href={book.link} target="_blank" rel="noreferrer" className="button dark">
                {book.cta} <Arrow />
              </a>
            </div>
          </article>
        </section>

        <section className="talks" id="palestras">
          <div className="section-heading light reveal">
            <div>
              <p className="section-index">03 · conversas & palestras</p>
              <h2>Verdade que alcança<br />a vida real.</h2>
            </div>
            <p>
              Temas recorrentes na produção pública da autora, adequados a
              igrejas, conferências de mulheres e encontros de famílias.
            </p>
          </div>

          <div className="theme-list">
            {themes.map((theme) => (
              <article className="theme reveal" key={theme.number}>
                <span>{theme.number}</span>
                <div>
                  <h3>{theme.title}</h3>
                  <p>{theme.text}</p>
                </div>
                <small>{theme.verse}</small>
              </article>
            ))}
          </div>

          <div className="video-note reveal">
            <div className="play-icon" aria-hidden="true">▶</div>
            <div>
              <p className="kicker">Acervo em construção</p>
              <h3>Palestras em vídeo</h3>
              <p>
                Não localizamos, até julho de 2026, uma gravação pública
                verificável de palestra individual de Sady Santana no YouTube.
                Este espaço está preparado para receber o conteúdo oficial.
              </p>
            </div>
          </div>
        </section>

        <section className="writings" id="escritos">
          <div className="section-heading reveal">
            <div>
              <p className="section-index">04 · escritos</p>
              <h2>Reflexões para<br />discernir o tempo.</h2>
            </div>
          </div>
          <div className="article-grid">
            <a
              className="article-card reveal"
              href="https://primeiraigrejavirtual.com.br/2015/11/11/mulher-crista-redes-sociais/"
              target="_blank"
              rel="noreferrer"
            >
              <span>Mulher & cultura digital</span>
              <h3>Da vida “sem véu” à exposição “sem filtro”</h3>
              <p>
                Uma reflexão sobre influência, modéstia e identidade cristã nas
                redes sociais.
              </p>
              <b>Ler artigo <Arrow /></b>
            </a>
            <a
              className="article-card featured reveal"
              href="https://goodprime.co/voce-esta-preparando-seu-filho-para-o-que-vem-a-seguir/"
              target="_blank"
              rel="noreferrer"
            >
              <span>Família & cosmovisão</span>
              <h3>Você está preparando seu filho para o que vem a seguir?</h3>
              <p>
                Um chamado à responsabilidade dos pais na formação espiritual
                e cultural dos filhos.
              </p>
              <b>Ler artigo <Arrow /></b>
            </a>
          </div>
        </section>

        <section className="newsletter" id="contato">
          <LeafMark light />
          <div className="newsletter-copy reveal">
            <p className="kicker">Cartas de Sady</p>
            <h2>Palavras de fé,<br />de tempos em tempos.</h2>
            <p>
              Este formulário é uma demonstração interativa. Conecte uma
              plataforma de e-mail para transformá-lo em uma lista real.
            </p>
          </div>
          <form className="subscribe-form reveal" onSubmit={handleSubscribe}>
            {subscribed ? (
              <p className="success" role="status">
                Obrigada! A demonstração funcionou perfeitamente.
              </p>
            ) : (
              <>
                <label htmlFor="email">Seu melhor e-mail</label>
                <div>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="nome@exemplo.com.br"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                  <button type="submit" aria-label="Cadastrar e-mail">
                    <Arrow />
                  </button>
                </div>
                <small>Sem excesso. Apenas quando houver algo que valha a leitura.</small>
              </>
            )}
          </form>
        </section>
      </main>

      <footer>
        <a className="brand footer-brand" href="#inicio">
          <LeafMark light />
          <span>
            <strong>Sady Santana</strong>
            <small>escritora</small>
          </span>
        </a>
        <p>
          Site-conceito criado a partir de informações públicas. Conteúdo
          biográfico sujeito à validação da autora.
        </p>
        <div>
          <a href="#sobre">Sobre</a>
          <a href="#livros">Livros</a>
          <a href="#palestras">Palestras</a>
          <a href="#inicio" aria-label="Voltar ao topo">↑</a>
        </div>
      </footer>
    </>
  );
}
