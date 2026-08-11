"use client";

import { useEffect, useRef, useState } from "react";
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
    cover: "/o-vestido-nunca-usado-capa.jpg",
    coverAlt: "Capa do livro O vestido nunca usado, de Sady Santana",
  },
  {
    id: "feminilidade",
    eyebrow: "Não ficção cristã",
    title: "Feminilidade Bíblica",
    subtitle: "Repensando o papel da mulher à luz de Cantares",
    description:
      "Uma reflexão sobre identidade, vocação e o papel da mulher cristã a partir das Escrituras, mencionada na biografia pública da autora.",
    meta: ["Feminilidade", "Cantares", "Vida cristã"],
    link: "https://www.amazon.com.br/FEMINILIDADE-B%C3%8DBLICA-Repensando-mulher-Cantares-ebook/dp/B0D261ZZMM",
    cta: "Conhecer o livro",
    cover: "/feminilidade-biblica-capa.jpg",
    coverAlt: "Capa do livro Feminilidade Bíblica, de Sady Santana Ferreira",
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
  const [requestedBook, setRequestedBook] = useState("vestido");
  const [bookPhase, setBookPhase] = useState("idle");
  const [reduceMotion, setReduceMotion] = useState(false);
  const tabRefs = useRef([]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!("IntersectionObserver" in window) || reduceMotion) {
      document.documentElement.classList.remove("motion-ready");
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -6%" }
    );
    document.documentElement.classList.add("motion-ready");
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduceMotion(media.matches);
    updatePreference();
    media.addEventListener?.("change", updatePreference);
    return () => media.removeEventListener?.("change", updatePreference);
  }, []);

  useEffect(() => {
    if (requestedBook === activeBook) {
      setBookPhase("idle");
      return undefined;
    }
    if (reduceMotion) {
      setActiveBook(requestedBook);
      setBookPhase("idle");
      return undefined;
    }

    let enterTimer;
    setBookPhase("leaving");
    const leaveTimer = window.setTimeout(() => {
      setActiveBook(requestedBook);
      setBookPhase("entering");
      enterTimer = window.setTimeout(() => setBookPhase("idle"), 360);
    }, 200);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(enterTimer);
    };
  }, [requestedBook, reduceMotion]);

  useEffect(() => {
    const header = document.querySelector(".site-header");
    if (!header) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const book = books.find((item) => item.id === activeBook);

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
            <p className="kicker" data-hero-item="kicker">Fé · literatura · feminilidade bíblica</p>
            <h1>
              <span data-hero-item="title">Palavras que</span>
              <em data-hero-item="emphasis">apontam para a graça.</em>
            </h1>
            <p className="hero-author" data-hero-item="author">Sady Santana</p>
            <p className="hero-copy" data-hero-item="copy">
              Seja bem-vindo a este espaço. Entre histórias, reflexões e
              verdades eternas, que cada leitura fortaleça sua fé e aponte seu
              coração para Cristo.
            </p>
            <div className="hero-actions" data-hero-item="actions">
              <a className="button primary" href="#livros">
                Conheça os livros <Arrow down />
              </a>
              <a className="text-link" href="#sobre">
                Sobre a autora <Arrow />
              </a>
            </div>
          </div>
        </section>

        <section className="manifesto">
          <p className="section-index reveal" data-reveal="soft">01 · essência</p>
          <blockquote className="reveal" data-reveal="up" data-delay="1">
            “A felicidade da existência humana está no{" "}
            <em className="manifesto-emphasis">Criador de todas as coisas.</em>”
          </blockquote>
          <p className="quote-source reveal" data-reveal="soft" data-delay="3">— O vestido nunca usado</p>
        </section>

        <section className="about chapter reveal" data-chapter="about" id="sobre">
          <figure className="about-portrait" data-chapter-item="portrait">
            <Image
              src="/sady-santana-biografia.jpg"
              alt="Sady Santana sorrindo"
              width={810}
              height={1080}
              sizes="(max-width: 900px) 86vw, 34vw"
            />
            <figcaption data-chapter-item="caption">
              <span>Sobre Sady</span>
              <p>Escrever é também um modo de servir.</p>
            </figcaption>
          </figure>
          <div className="about-copy">
            <p className="kicker" data-chapter-item="kicker">Jornalismo, teologia & literatura</p>
            <h2 data-chapter-item="title">Uma escrita que nasce da fé e encontra o cotidiano.</h2>
            <div className="columns">
              <p data-chapter-item="column-1">
                Sady Santana é escritora cristã presbiteriana, jornalista
                formada pela Universidade Presbiteriana Mackenzie e mestranda
                em Teologia Filosófica pelo Centro Presbiteriano de Pós-Graduação
                Andrew Jumper (CPAJ). É esposa, mãe e avó, e dedica parte de sua
                caminhada ao ensino, ao discipulado de mulheres e à reflexão
                sobre a vida cristã.
              </p>
              <p data-chapter-item="column-2">
                Autora de Feminilidade Bíblica e do romance O vestido nunca
                usado, também colaborou com o Sistema Mackenzie de Ensino na
                produção de material didático. Em sua escrita, busca unir fé,
                reflexão bíblica e sensibilidade literária, abordando temas como
                feminilidade, família, cultura, graça e as relações humanas à luz
                do evangelho.
              </p>
            </div>
            <div className="facts" data-chapter-item="facts" aria-label="Informações sobre a autora">
              <div data-chapter-item="fact-1">
                <strong>Mackenzie</strong>
                <span>Formação em Jornalismo</span>
              </div>
              <div data-chapter-item="fact-2">
                <strong>IBEL</strong>
                <span>Estudos em Teologia</span>
              </div>
              <div data-chapter-item="fact-3">
                <strong>CPAJ</strong>
                <span>Mestranda em Teologia Filosófica</span>
              </div>
              <div data-chapter-item="fact-4">
                <strong>02</strong>
                <span>Obras identificadas</span>
              </div>
            </div>
          </div>
        </section>

        <section className="books" id="livros">
          <div className="section-heading books-heading reveal">
            <div>
              <p className="section-index reveal" data-reveal="soft">02 · biblioteca</p>
              <h2 className="reveal" data-delay="1">Livros para ler<br />com o coração desperto.</h2>
            </div>
            <p className="reveal" data-reveal="soft" data-delay="2">
              Ficção e reflexão bíblica se encontram em páginas sobre amor,
              identidade, piedade e graça.
            </p>
          </div>

          <div className="book-selector reveal" data-delay="3" role="tablist" aria-label="Livros publicados">
            {books.map((item, index) => (
              <button
                key={item.id}
                ref={(node) => { tabRefs.current[index] = node; }}
                id={`book-tab-${item.id}`}
                role="tab"
                type="button"
                tabIndex={requestedBook === item.id ? 0 : -1}
                aria-selected={requestedBook === item.id}
                aria-controls="book-panel"
                onClick={() => setRequestedBook(item.id)}
                onKeyDown={(event) => {
                  const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
                  if (!keys.includes(event.key)) return;
                  event.preventDefault();
                  const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? books.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + books.length) % books.length;
                  setRequestedBook(books[nextIndex].id);
                  tabRefs.current[nextIndex]?.focus();
                }}
              >
                <span>{item.id === "vestido" ? "01" : "02"}</span>
                {item.title}
              </button>
            ))}
          </div>

          <article
            className={`book-card reveal is-${bookPhase}`}
            data-delay="4"
            id="book-panel"
            role="tabpanel"
            aria-labelledby={`book-tab-${requestedBook}`}
            aria-live="polite"
            aria-busy={bookPhase !== "idle"}
          >
            <div className={`book-art ${book.id}`} data-book-part="cover">
              <Image src={book.cover} alt={book.coverAlt} width={650} height={1000} sizes="(max-width: 560px) 270px, 325px" />
            </div>
            <div className="book-info" data-book-part="info">
              <p className="kicker" data-book-detail="kicker">{book.eyebrow}</p>
              <div data-book-detail="title"><h3>{book.title}</h3>{book.subtitle && <p className="subtitle">{book.subtitle}</p>}</div>
              <p data-book-detail="description">{book.description}</p>
              <ul data-book-detail="meta">
                {book.meta.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <a href={book.link} target="_blank" rel="noreferrer" className="button dark" data-book-detail="cta">
                {book.cta} <Arrow />
              </a>
            </div>
          </article>
        </section>

        <section className="talks" id="palestras">
          <div className="section-heading light reveal" data-reveal="soft">
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
            {themes.map((theme, index) => (
              <article className="theme reveal" data-delay={String(index + 1)} key={theme.number}>
                <span>{theme.number}</span>
                <div>
                  <h3>{theme.title}</h3>
                  <p>{theme.text}</p>
                </div>
                <small>{theme.verse}</small>
              </article>
            ))}
          </div>

          <div className="video-note reveal" data-reveal="soft">
            <div className="video-copy">
              <p className="kicker" data-video-item="kicker">Palestras em vídeo</p>
              <h3 data-video-item="title">Vídeo em destaque</h3>
            </div>
            <div className="video-frame" data-video-item="player">
              <iframe
                src="https://www.youtube-nocookie.com/embed/Engv2JRyjZc"
                title="Vídeo em destaque de Sady Santana"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
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
          <a className="article-card featured reveal" href="/artigos">
            <span>Acervo editorial</span>
            <h3>Leia todos os artigos de Sady.</h3>
            <p>Textos sobre fé, família, cultura e feminilidade bíblica.</p>
            <b>Visitar o acervo <Arrow /></b>
          </a>
        </section>

        <section className="newsletter chapter reveal" data-chapter="closing" id="contato">
          <span data-closing-item="ornament"><LeafMark light /></span>
          <div className="newsletter-copy">
            <p className="kicker" data-closing-item="kicker">Cartas de Sady</p>
            <h2 data-closing-item="title">Palavras de fé,<br />de tempos em tempos.</h2>
            <p data-closing-item="copy">
              Este formulário é uma demonstração interativa. Conecte uma
              plataforma de e-mail para transformá-lo em uma lista real.
            </p>
          </div>
          <div className="subscribe-form">
            <p role="status" data-closing-item="status">A lista de e-mails será integrada em uma etapa futura.</p>
            <a className="button newsletter-button" data-closing-item="cta" href="/artigos">Ler os artigos</a>
            <small data-closing-item="note">Os artigos já podem ser lidos sem cadastro.</small>
          </div>
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
