"use strict";

// Progressive enhancement: all donation details are readable without JavaScript.
document.documentElement.classList.add("js");

const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.getElementById("mobile-nav");
menuToggle.hidden = false;
function closeMenu() {
  mobileNav.hidden = true;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.querySelector("span").textContent = "+";
}
menuToggle.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(open));
  mobileNav.hidden = !open;
  menuToggle.querySelector("span").textContent = open ? "×" : "+";
});
mobileNav.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !mobileNav.hidden) {
    closeMenu();
    menuToggle.focus();
  }
});
const wideScreen = window.matchMedia("(min-width: 1024px)");
wideScreen.addEventListener("change", event => { if (event.matches) closeMenu(); });

const switcher = document.querySelector(".donation-switch");
const tabs = [...switcher.querySelectorAll("button")];
const panels = tabs.map(tab => document.getElementById(tab.getAttribute("aria-controls")));
switcher.hidden = false;
switcher.setAttribute("role", "tablist");
tabs.forEach((tab, index) => {
  tab.setAttribute("role", "tab");
  panels[index].setAttribute("role", "tabpanel");
  panels[index].setAttribute("aria-labelledby", tab.id);
  panels[index].tabIndex = 0;
  tab.addEventListener("click", () => activateTab(index));
  tab.addEventListener("keydown", event => {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      activateTab(next);
      tabs[next].focus();
    }
  });
});
function activateTab(activeIndex) {
  tabs.forEach((tab, index) => {
    const active = index === activeIndex;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    panels[index].hidden = !active;
  });
}
activateTab(0);

const toast = document.getElementById("toast");
let toastTimer;
function notify(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3800);
}
async function copyText(text) {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return true; } catch { /* Try local fallback. */ }
  }
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.cssText = "position:fixed;top:0;left:-9999px;font-size:16px";
  document.body.append(field);
  field.select();
  let copied = false;
  try { copied = document.execCommand("copy"); } catch { copied = false; }
  field.remove();
  return copied;
}
document.querySelectorAll("[data-copy]").forEach(button => {
  button.hidden = false;
  button.addEventListener("click", async () => {
    button.disabled = true;
    const copied = await copyText(button.dataset.copy);
    notify(copied ? button.dataset.copyLabel : "คัดลอกไม่ได้ กรุณาเลือกเลขบัญชีแล้วคัดลอกด้วยตนเอง");
    button.disabled = false;
    button.focus({ preventScroll: true });
  });
});

const imageDialog = document.getElementById("image-dialog");
const dialogImage = document.getElementById("dialog-image");
const dialogCaption = document.getElementById("image-dialog-caption");
let imageOpener;
if (typeof imageDialog.showModal === "function") {
  document.querySelectorAll("[data-lightbox]").forEach(link => {
    link.addEventListener("click", event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      imageOpener = link;
      dialogImage.src = link.href;
      dialogImage.alt = link.querySelector("img").alt;
      dialogCaption.textContent = link.dataset.caption;
      imageDialog.showModal();
      document.body.style.overflow = "hidden";
    });
  });
  imageDialog.querySelector(".dialog-close").addEventListener("click", () => imageDialog.close());
  imageDialog.addEventListener("click", event => {
    const bounds = imageDialog.getBoundingClientRect();
    if (event.target === imageDialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) imageDialog.close();
  });
  imageDialog.addEventListener("close", () => {
    document.body.style.overflow = "";
    imageOpener?.focus({ preventScroll: true });
    dialogImage.removeAttribute("src");
  });
}

// Only animate offscreen sections. Native scrolling and reduced-motion remain intact.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
if (!reducedMotion.matches && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-shown");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: "0px 0px 15px 0px" });
  document.querySelectorAll(".reveal").forEach(element => {
    if (element.getBoundingClientRect().top >= window.innerHeight) {
      element.classList.add("is-pending");
      revealObserver.observe(element);
    }
  });
  reducedMotion.addEventListener("change", event => {
    if (event.matches) {
      revealObserver.disconnect();
      document.querySelectorAll(".is-pending").forEach(element => element.classList.add("is-shown"));
    }
  });
}

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      document.querySelectorAll(".desktop-nav a").forEach(link => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-20% 0px -65% 0px", threshold: 0 });
  document.querySelectorAll("main section[id]").forEach(section => sectionObserver.observe(section));
}
