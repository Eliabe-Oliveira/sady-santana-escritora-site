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
    link: "https://www.amazon.com.br/FEMINILIDADE-B%C3%8DBLICA-Repensando-mulher-Cantares-ebook/dp/B0D261ZZMM",
    cta: "Conhecer o livro"
  }
};
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

const contactForm = document.querySelector(".contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;
    const formData = new FormData(contactForm);
    const subject = "Convite pelo site — Sady Santana";
    const body = `E-mail: ${formData.get("email")}\n\nCelular / WhatsApp: ${formData.get("phone")}\n\nMensagem:\n${formData.get("message")}`;
    const status = contactForm.querySelector(".contact-status");
    status.textContent = "Seu aplicativo de e-mail será aberto para concluir o envio.";
    window.location.href = `mailto:sady287@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

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
