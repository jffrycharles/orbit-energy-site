/* Orbit Energy: navigation and accessible interaction logic. */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initSite(pageReady = Promise.resolve()) {
  // Smoothed wheel scrolling, driven by the GSAP ticker so ScrollTrigger stays in sync. Touch stays native.
  gsap.registerPlugin(ScrollTrigger);
  let lenis = null;
  if (!reduced()) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis?.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    // Hold the page still behind the loading screen.
    lenis.stop();
    pageReady.then(() => lenis?.start());
  }

  const header = $("#site-header");
  const menu = $("#mobile-menu");
  const toggle = $(".menu-toggle");
  const navLinks = $$(".desktop-nav a");
  const mainSections = ["home", "features", "history", "team", "contact"].map((id) => document.getElementById(id));
  let frame = 0;

  function updateHeader() {
    document.documentElement.style.setProperty("--nav-top", Math.max(16, 48 - window.scrollY) + "px");
    const scrolled = window.scrollY > 32;
    header.classList.toggle("is-light", scrolled);
    header.classList.toggle("is-scrolled", scrolled);
    let current = "home";
    for (const section of mainSections) if (section.getBoundingClientRect().top < 180) current = section.id;
    navLinks.forEach((a) => {
      if (a.hash === "#" + current) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });
    frame = 0;
  }
  addEventListener(
    "scroll",
    () => {
      if (!frame) frame = requestAnimationFrame(updateHeader);
    },
    { passive: true },
  );
  addEventListener("resize", updateHeader);
  updateHeader();

  function setMenu(open, restoreFocus = false) {
    menu.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    document.body.classList.toggle("menu-open", open);
    if (open) lenis?.stop();
    else lenis?.start();
    if (open) $("a", menu).focus({ preventScroll: true });
    if (!open && restoreFocus) toggle.focus({ preventScroll: true });
  }
  toggle.addEventListener("click", () => setMenu(menu.hidden));
  document.addEventListener("keydown", (event) => {
    if (menu.hidden) return;
    if (event.key === "Escape") {
      setMenu(false, true);
      return;
    }
    if (event.key === "Tab") {
      const targets = [toggle, ...$$("a", menu)];
      const index = targets.indexOf(document.activeElement);
      if (event.shiftKey && index <= 0) {
        event.preventDefault();
        targets.at(-1).focus();
      }
      if (!event.shiftKey && index === targets.length - 1) {
        event.preventDefault();
        toggle.focus();
      }
    }
  });
  document.addEventListener("pointerdown", (event) => {
    if (!menu.hidden && !header.contains(event.target)) setMenu(false);
  });
  matchMedia("(min-width: 801px)").addEventListener("change", (event) => {
    if (event.matches) setMenu(false);
  });

  // Anchor destinations remain normal links; this adds eased scrolling and focus handling.
  const anchorEase = gsap.parseEase("power3.inOut");
  $$('a[href^="#"]').forEach((link) =>
    link.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = document.getElementById(link.hash.slice(1));
      if (!target) return;
      event.preventDefault();
      if (link.dataset.tabTarget) selectTab(link.dataset.tabTarget);
      setMenu(false);
      const end = link.hash === "#home" ? 0 : Math.max(0, target.getBoundingClientRect().top + scrollY - 96);
      history.replaceState(null, "", link.hash);
      const focusTarget = () => {
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      };
      if (lenis) lenis.scrollTo(end, { duration: 1, easing: anchorEase, onComplete: focusTarget });
      else {
        window.scrollTo(0, end);
        focusTarget();
      }
    }),
  );

  const tabs = $$(".tabs [role=tab]");
  const panelRow = $(".panels");
  $$(".advice-panel").forEach((panel, i) => {
    panel.hidden = false;
    panel.inert = i !== 0;
    panel.setAttribute("aria-hidden", String(i !== 0));
  });
  $(".advice").classList.add("is-ready");
  function positionPanels(panel) {
    const position = -(panel.offsetLeft - panelRow.firstElementChild.offsetLeft);
    gsap.set(panelRow, { x: position });
    return position;
  }
  function selectTab(key, focus = false) {
    const selected = tabs.find((tab) => tab.id === "tab-" + key);
    if (!selected) return;
    const oldPanel = $('.advice-panel[aria-hidden="false"]');
    const transform = getComputedStyle(panelRow).transform;
    const fromX = transform === "none" ? 0 : new DOMMatrixReadOnly(transform).m41;
    tabs.forEach((tab) => {
      const active = tab === selected;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      const item = document.getElementById(tab.getAttribute("aria-controls"));
      item.inert = !active;
      item.setAttribute("aria-hidden", String(!active));
    });
    const panel = document.getElementById(selected.getAttribute("aria-controls"));
    const toX = positionPanels(panel);
    if (focus) selected.focus({ preventScroll: true });
    const tablist = selected.parentElement;
    const selectedBounds = selected.getBoundingClientRect();
    const listBounds = tablist.getBoundingClientRect();
    if (selectedBounds.left < listBounds.left + 8) {
      tablist.scrollLeft -= listBounds.left + 8 - selectedBounds.left;
    } else if (selectedBounds.right > listBounds.right - 8) {
      tablist.scrollLeft += selectedBounds.right - listBounds.right + 8;
    }
    if (oldPanel !== panel)
      document.dispatchEvent(new CustomEvent("orbit:tabchange", { detail: { panel, fromX, toX } }));
  }
  addEventListener("resize", () => positionPanels($('.advice-panel[aria-hidden="false"]')));
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => selectTab(tab.id.slice(4)));
    tab.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight") next = (i + 1) % tabs.length;
      if (event.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        selectTab(tabs[next].id.slice(4), true);
      }
    });
  });

  const track = $("#service-track");
  const cards = $$(".service-card");
  const previous = $('[data-slide="prev"]');
  const next = $('[data-slide="next"]');
  let slideTween;
  const cardStep = () => cards[1].offsetLeft - cards[0].offsetLeft;
  function updateCarousel() {
    const max = Math.max(0, track.scrollWidth - track.clientWidth);
    previous.disabled = track.scrollLeft <= 3;
    next.disabled = track.scrollLeft >= max - 3;
    const index = next.disabled ? cards.length : Math.min(cards.length, Math.round(track.scrollLeft / cardStep()) + 1);
    $(".carousel-status").textContent = String(index).padStart(2, "0") + " / " + String(cards.length).padStart(2, "0");
  }
  function slide(direction) {
    slideTween?.kill();
    const max = track.scrollWidth - track.clientWidth;
    const end = Math.max(0, Math.min(max, track.scrollLeft + direction * cardStep()));
    if (!reduced()) {
      track.style.scrollSnapType = "none";
      slideTween = gsap.to(track, {
        scrollLeft: end,
        duration: 0.65,
        ease: "power3.inOut",
        onUpdate: updateCarousel,
        onComplete: () => {
          track.style.scrollSnapType = "";
          updateCarousel();
        },
      });
    } else track.scrollTo({ left: end, behavior: "auto" });
  }
  previous.addEventListener("click", () => slide(-1));
  next.addEventListener("click", () => slide(1));
  track.addEventListener("scroll", updateCarousel, { passive: true });
  track.addEventListener(
    "touchstart",
    () => {
      slideTween?.kill();
      track.style.scrollSnapType = "";
    },
    { passive: true },
  );
  track.addEventListener("keydown", (event) => {
    if (event.target !== track) return;
    if (["ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      slide(event.key === "ArrowRight" ? 1 : -1);
    }
  });
  addEventListener("resize", updateCarousel);
  updateCarousel();

  const video = $(".hero-video");
  const videoButton = $(".video-toggle");
  let playWanted = !reduced();
  const syncVideoButton = () => {
    const playing = !video.paused;
    videoButton.classList.toggle("is-playing", playing);
    videoButton.setAttribute("aria-label", playing ? "Pause background video" : "Play background video");
    videoButton.setAttribute("aria-pressed", String(playing));
  };
  async function playVideo() {
    try {
      await video.play();
    } catch {
      /* The poster stays visible when autoplay is unavailable. */
    }
    syncVideoButton();
  }
  video.addEventListener("play", syncVideoButton);
  video.addEventListener("pause", syncVideoButton);
  videoButton.addEventListener("click", () => {
    playWanted = video.paused;
    if (playWanted) playVideo();
    else video.pause();
  });
  if (playWanted) playVideo();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) video.pause();
    else if (playWanted && !reduced()) playVideo();
  });
  new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting) video.pause();
      else if (playWanted && !document.hidden) playVideo();
    },
    { threshold: 0.05 },
  ).observe($(".hero"));
  matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", (event) => {
    if (event.matches) {
      playWanted = false;
      video.pause();
      lenis?.destroy();
      lenis = null;
    }
  });

  $("#year").textContent = String(new Date().getFullYear());
}
