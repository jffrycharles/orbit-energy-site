/* Orbit Energy — GSAP + ScrollTrigger.
   All motion lives here; content and links work without it. */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

const all = (selector) => [...document.querySelectorAll(selector)];

export function initAnimations(pageReady = Promise.resolve()) {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  const media = gsap.matchMedia();

  // Character rollovers follow the Helios button treatment.
  all(".button-label").forEach((label) => {
    const text = label.textContent;
    label.textContent = "";
    // Screen readers get the plain text; the split letters are decorative.
    const accessibleText = document.createElement("span");
    accessibleText.className = "sr-only";
    accessibleText.textContent = text;
    const row = document.createElement("span");
    row.className = "label-original";
    row.setAttribute("aria-hidden", "true");
    [...text].forEach((char) => {
      const letter = document.createElement("span");
      letter.className = "letter";
      letter.textContent = char === " " ? " " : char;
      row.appendChild(letter);
    });
    const copy = row.cloneNode(true);
    copy.className = "label-copy";
    label.append(accessibleText, row, copy);
    gsap.set(copy.children, { yPercent: 110 });
  });

  media.add("(prefers-reduced-motion: no-preference)", () => {
    // The hero entrance waits for the loading screen to lift.
    const entrance = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
    pageReady.then(() => entrance.play());
    entrance
      .from(".hero h1 .line > span", { yPercent: 112, duration: 1.05, stagger: 0.11 }, 0.1)
      .from(".hero-copy", { y: 28, opacity: 0, duration: 0.9 }, 0.4)
      .from(".site-header", { y: -14, opacity: 0, duration: 0.8 }, 0.15)
      .from(".hero-media", { scale: 1.08, duration: 1.8 }, 0);

    all("[data-reveal]").forEach((element) => {
      gsap.from(element, {
        y: 32,
        opacity: 0,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: { trigger: element, start: "top 91%", once: true },
      });
    });

    // Statement copy fills in word by word as it scrolls through the viewport.
    // SplitText keeps an aria-label on the heading and reverts with this context.
    all("[data-text-reveal]").forEach((element) => {
      const split = SplitText.create(element, { type: "words" });
      gsap.fromTo(
        split.words,
        { opacity: 0.15 },
        {
          opacity: 1,
          stagger: 0.1,
          ease: "none",
          scrollTrigger: { trigger: element, start: "top 85%", end: "bottom 50%", scrub: true },
        },
      );
    });

    const buttonHandlers = [];
    all(".button").forEach((button) => {
      const first = button.querySelector(".label-original");
      const second = button.querySelector(".label-copy");
      if (!first || !second) return;
      const timeline = gsap
        .timeline({ paused: true })
        .to(first.children, { yPercent: -110, duration: 0.35, stagger: 0.008, ease: "power2.inOut" }, 0)
        .to(second.children, { yPercent: 0, duration: 0.35, stagger: 0.008, ease: "power2.inOut" }, 0);
      const enter = () => timeline.play();
      const leave = () => timeline.reverse();
      button.addEventListener("mouseenter", enter);
      button.addEventListener("mouseleave", leave);
      button.addEventListener("focusin", enter);
      button.addEventListener("focusout", leave);
      buttonHandlers.push(() => {
        button.removeEventListener("mouseenter", enter);
        button.removeEventListener("mouseleave", leave);
        button.removeEventListener("focusin", enter);
        button.removeEventListener("focusout", leave);
      });
    });

    // Image opens from an oval into the full-width section as the visitor scrolls.
    gsap.to(".orbit-picture", {
      width: "100%",
      borderRadius: "32px",
      ease: "none",
      scrollTrigger: { trigger: ".orbit-picture-wrap", start: "top 75%", end: "center 45%", scrub: 1 },
    });
    gsap.fromTo(
      ".orbit-picture img",
      { scale: 1.1 },
      {
        scale: 1,
        ease: "none",
        scrollTrigger: { trigger: ".orbit-picture-wrap", start: "top bottom", end: "bottom center", scrub: 1 },
      },
    );

    all(".parallax-image").forEach((image) => {
      gsap.fromTo(
        image,
        { yPercent: -5 },
        {
          yPercent: 5,
          ease: "none",
          scrollTrigger: { trigger: image.parentElement, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
    });

    const animatePanel = (event) => {
      const panel = event.detail.panel;
      gsap.fromTo(
        ".panels",
        { x: event.detail.fromX },
        { x: event.detail.toX, duration: 0.7, ease: "power3.inOut", overwrite: true },
      );
      gsap.fromTo(
        panel.querySelector(".panel-copy"),
        { opacity: 0.25 },
        { opacity: 1, duration: 0.7, ease: "power2.out", overwrite: true },
      );
    };
    document.addEventListener("orbit:tabchange", animatePanel);

    // Native details retains its keyboard semantics; GSAP animates the height.
    const detailHandlers = [];
    all(".faq-list details").forEach((details) => {
      const summary = details.querySelector("summary");
      let tween;
      let desired = details.open;
      const handler = (event) => {
        event.preventDefault();
        const start = details.getBoundingClientRect().height;
        desired = !desired;
        tween?.kill();
        if (desired) details.open = true;
        details.style.height = "";
        const end = desired ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height + 1;
        details.style.overflow = "hidden";
        tween = gsap.fromTo(
          details,
          { height: start },
          {
            height: end,
            duration: 0.35,
            ease: "power2.inOut",
            onComplete: () => {
              details.open = desired;
              details.style.height = "";
              details.style.overflow = "";
              ScrollTrigger.refresh();
            },
          },
        );
      };
      summary.addEventListener("click", handler);
      detailHandlers.push(() => {
        summary.removeEventListener("click", handler);
        tween?.kill();
        details.style.height = "";
        details.style.overflow = "";
      });
    });

    return () => {
      document.removeEventListener("orbit:tabchange", animatePanel);
      buttonHandlers.forEach((cleanup) => cleanup());
      detailHandlers.forEach((cleanup) => cleanup());
    };
  });

  // The desktop history uses a sticky photo that follows the active story.
  media.add({ desktop: "(min-width: 541px)", reduce: "(prefers-reduced-motion: reduce)" }, (context) => {
    if (!context.conditions.desktop) return;
    const photos = all(".story-image");
    const steps = all(".story-step");
    let active = 0;
    function show(index) {
      if (index === active) return;
      active = index;
      photos.forEach((photo, i) => {
        photo.classList.toggle("is-active", i === index);
        if (!context.conditions.reduce)
          gsap.to(photo, { opacity: i === index ? 1 : 0, duration: 0.65, ease: "power2.out", overwrite: true });
      });
    }
    steps.forEach((step, index) => {
      ScrollTrigger.create({
        trigger: step,
        start: "top center",
        end: "bottom center",
        onEnter: () => show(index),
        onEnterBack: () => show(index),
      });
    });
    gsap.to(".story-progress span", {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { trigger: ".story-grid", start: "top center", end: "bottom center", scrub: true },
    });
  });
  document.fonts.ready.then(() => ScrollTrigger.refresh());
  // The scrollbar returns once the loading screen is gone, which can shift layout.
  pageReady.then(() => ScrollTrigger.refresh());
  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
}
