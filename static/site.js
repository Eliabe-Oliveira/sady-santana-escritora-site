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
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const bookTabs = Array.from(document.querySelectorAll('.book-selector [role="tab"]'));
const bookPanel = document.querySelector("#book-panel");
const bookTransition = {
  displayed: "vestido",
  requested: "vestido",
  timers: new Set(),
  cancel() {
    this.timers.forEach((timer) => window.clearTimeout(timer));
    this.timers.clear();
  },
  schedule(callback, delay) {
    const timer = window.setTimeout(() => {
      this.timers.delete(timer);
      callback();
    }, delay);
    this.timers.add(timer);
  },
  update(id) {
    const book = books[id];
    const art = bookPanel.querySelector(".book-art");
    art.className = "book-art " + id;
    const cover = art.querySelector("img");
    cover.src = book.cover;
    cover.alt = book.coverAlt;
    bookPanel.querySelector(".book-info .kicker").textContent = book.eyebrow;
    bookPanel.querySelector(".book-info h3").textContent = book.title;
    const subtitle = bookPanel.querySelector(".book-info .subtitle");
    subtitle.textContent = book.subtitle;
    subtitle.hidden = !book.subtitle;
    bookPanel.querySelector(".book-description").textContent = book.description;
    const meta = bookPanel.querySelector(".book-info ul");
    meta.replaceChildren(...book.meta.map((value) => {
      const item = document.createElement("li");
      item.textContent = value;
      return item;
    }));
    const link = bookPanel.querySelector(".book-info .button");
    link.href = book.link;
    link.firstChild.textContent = book.cta + " ";
    this.displayed = id;
  },
  select(id) {
    if (!books[id] || !bookPanel) return;
    this.cancel();
    this.requested = id;
    bookTabs.forEach((tab) => {
      const selected = tab.dataset.book === id;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    bookPanel.setAttribute("aria-labelledby", "book-tab-" + id);
    if (motionPreference.matches || id === this.displayed) {
      if (id !== this.displayed) this.update(id);
      bookPanel.className = "book-card reveal visible is-idle";
      bookPanel.setAttribute("aria-busy", "false");
      return;
    }
    bookPanel.className = "book-card reveal visible is-leaving";
    bookPanel.setAttribute("aria-busy", "true");
    this.schedule(() => {
      this.update(this.requested);
      bookPanel.className = "book-card reveal visible is-entering";
      this.schedule(() => {
        bookPanel.className = "book-card reveal visible is-idle";
        bookPanel.setAttribute("aria-busy", "false");
      }, 360);
    }, 200);
  }
};

bookTabs.forEach((button, index) => {
  button.addEventListener("click", () => bookTransition.select(button.dataset.book));
  button.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? bookTabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + bookTabs.length) % bookTabs.length;
    bookTabs[nextIndex].focus();
    bookTransition.select(bookTabs[nextIndex].dataset.book);
  });
});
if (motionPreference.addEventListener) {
  motionPreference.addEventListener("change", () => {
    if (motionPreference.matches) bookTransition.select(bookTransition.requested);
  });
}

const reduceMotion = motionPreference.matches;
if ("IntersectionObserver" in window && !reduceMotion) {
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  }), { threshold: .12, rootMargin: "0px 0px -6%" });
  document.documentElement.classList.add("motion-ready");
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
} else {
  document.documentElement.classList.remove("motion-ready");
}

const siteHeader = document.querySelector(".site-header");
let headerFrame = 0;
const updateHeader = () => {
  headerFrame = 0;
  if (siteHeader) siteHeader.classList.toggle("is-scrolled", window.scrollY > 12);
};
const requestHeaderUpdate = () => {
  if (!headerFrame) headerFrame = window.requestAnimationFrame(updateHeader);
};
updateHeader();
window.addEventListener("scroll", requestHeaderUpdate, { passive: true });

const gardens = document.querySelectorAll(".corner-garden");
let lastScroll = window.scrollY;
let windTimer = null;
let gardenFrame = 0;
if (!reduceMotion) {
  const updateGardens = () => {
    gardenFrame = 0;
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
  };
  window.addEventListener("scroll", () => {
    if (!gardenFrame) gardenFrame = window.requestAnimationFrame(updateGardens);
  }, { passive: true });
}
