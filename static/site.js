const menuButton = document.querySelector(".menu-button");
const primaryNav = document.querySelector(".site-header nav");
if (menuButton && primaryNav) {
  menuButton.addEventListener("click", function () {
    const open = primaryNav.classList.toggle("open");
    this.setAttribute("aria-expanded", String(open));
    this.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  });
  primaryNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    primaryNav.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Abrir menu");
  }));
}

const books = {
  vestido: {
    eyebrow: "Romance cristão · 2022",
    title: "O vestido nunca usado",
    subtitle: "",
    description: "Uma história de amor bordada por relacionamentos, piedade, paixão e graça — e por um vestido carregado de significado. O romance aponta, em sua essência, para a maior história de amor de todos os tempos.",
    meta: ["GodBooks", "224 páginas", "ISBN 978-65-89198-45-1"],
    cover: window.BOOK_COVERS && window.BOOK_COVERS.vestido,
    coverAlt: "Capa do livro O vestido nunca usado, de Sady Santana",
    link: "https://godbooks.com.br/product/o-vestido-nunca-usado/",
    cta: "Conhecer o livro"
  },
  feminilidade: {
    eyebrow: "Não ficção cristã",
    title: "Feminilidade Bíblica",
    subtitle: "Repensando o papel da mulher à luz de Cantares",
    description: "Uma reflexão sobre identidade, vocação e o papel da mulher cristã a partir das Escrituras, mencionada na biografia pública da autora.",
    meta: ["Feminilidade", "Cantares", "Vida cristã"],
    cover: window.BOOK_COVERS && window.BOOK_COVERS.feminilidade,
    coverAlt: "Capa do livro Feminilidade Bíblica, de Sady Santana Ferreira",
    link: "https://goodprime.co/e-dai-o-malabarismo-hermeneutico-da-imprensa-para-desmoralizar-o-presidente/",
    cta: "Ver referência"
  }
};
document.querySelectorAll(".book-selector button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".book-selector button").forEach((b) => b.setAttribute("aria-selected", "false"));
    button.setAttribute("aria-selected", "true");
    const id = button.dataset.book, book = books[id];
    const art = document.querySelector(".book-art");
    if (!art) return;
    art.className = "book-art " + id;
    const cover = art.querySelector("img");
    cover.src = book.cover;
    cover.alt = book.coverAlt;
    document.querySelector(".book-info .kicker").textContent = book.eyebrow;
    document.querySelector(".book-info h3").textContent = book.title;
    const subtitle = document.querySelector(".book-info .subtitle");
    subtitle.textContent = book.subtitle;
    subtitle.hidden = !book.subtitle;
    document.querySelector(".book-description").textContent = book.description;
    document.querySelector(".book-info ul").innerHTML = book.meta.map((m) => "<li>" + m + "</li>").join("");
    const link = document.querySelector(".book-info .button");
    link.href = book.link;
    link.firstChild.textContent = book.cta + " ";
  });
});

const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
  if (entry.isIntersecting) entry.target.classList.add("visible");
}), { threshold: .12 });
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

const gardens = document.querySelectorAll(".corner-garden");
let lastScroll = window.scrollY;
let windTimer = null;
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  window.addEventListener("scroll", () => {
    const current = window.scrollY;
    const velocity = Math.max(-1, Math.min(1, (current - lastScroll) / 36));
    lastScroll = current;
    gardens.forEach((garden, index) => {
      const direction = index === 0 ? 1 : -1;
      garden.style.setProperty("--wind", velocity * 11 * direction + "deg");
      garden.classList.add("wind-active");
    });
    clearTimeout(windTimer);
    windTimer = setTimeout(() => {
      gardens.forEach((garden) => {
        garden.style.setProperty("--wind", "0deg");
        garden.classList.remove("wind-active");
      });
    }, 140);
  }, { passive: true });
}
