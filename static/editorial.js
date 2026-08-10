const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const reduceMotion = motionPreference.matches;

document.querySelectorAll(".menu-button").forEach((button) => {
  const header = button.closest(".site-header");
  const nav = header && header.querySelector("nav");
  if (!nav) return;
  button.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  });
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    nav.classList.remove("open");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Abrir menu");
  }));
});

if ("IntersectionObserver" in window && !reduceMotion) {
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  }), {threshold: .12, rootMargin: "0px 0px -6%"});
  document.documentElement.classList.add("motion-ready");
  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
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
window.addEventListener("scroll", requestHeaderUpdate, {passive: true});

document.querySelectorAll("[data-copy-link]").forEach((button) => {
  button.addEventListener("click", async () => {
    const status = document.getElementById(button.getAttribute("aria-describedby"));
    let copied = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        copied = true;
      } else {
        const field = document.createElement("textarea");
        field.value = window.location.href;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        copied = document.execCommand("copy");
        field.remove();
      }
    } catch {
      copied = false;
    }
    button.textContent = copied ? "Link copiado" : "Não foi possível copiar";
    if (status) status.textContent = copied ? "Link copiado para a área de transferência." : "Não foi possível copiar o link automaticamente.";
  });
});
