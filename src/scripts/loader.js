/* Orbit Energy: loading screen. Holds until fonts and the hero poster are ready, then lifts away.
   Returns a promise that resolves as the page is revealed, so the hero entrance can follow it. */
import { gsap } from "gsap";

const MIN_TIME = 1200;
const MAX_WAIT = 4000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const decode = (src) => {
  if (!src) return Promise.resolve();
  const image = new Image();
  image.src = src;
  return image.decode().catch(() => {});
};

export function initLoader() {
  const root = document.documentElement;
  const loader = document.querySelector(".loader");
  if (!loader || !root.classList.contains("is-loading")) return Promise.resolve();

  const logo = loader.querySelector(".loader-logo img");
  const bar = loader.querySelector(".loader-bar span");
  const count = loader.querySelector(".loader-count");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const loaded = new Promise((resolve) =>
    document.readyState === "complete" ? resolve() : addEventListener("load", resolve, { once: true }),
  );
  const assets = Promise.all([loaded, document.fonts.ready, decode(document.querySelector(".hero-video")?.poster)]);
  const ready = Promise.all([Promise.race([assets, wait(MAX_WAIT)]), wait(reduced ? 0 : MIN_TIME)]);

  const progress = { value: 0 };
  const render = () => {
    bar.style.transform = `scaleX(${progress.value / 100})`;
    count.textContent = Math.round(progress.value) + "%";
  };
  const finish = () => {
    root.classList.remove("is-loading");
    loader.remove();
  };

  if (reduced) {
    gsap.set(logo, { y: 0, yPercent: 0 });
    return ready.then(
      () =>
        new Promise((resolve) => {
          progress.value = 100;
          render();
          gsap.to(loader, { opacity: 0, duration: 0.3, onComplete: () => (finish(), resolve()) });
        }),
    );
  }

  decode(logo.currentSrc || logo.src).then(() =>
    // y: 0 clears the CSS start offset, which GSAP would otherwise read in as pixels.
    gsap.fromTo(logo, { y: 0, yPercent: 105 }, { yPercent: 0, duration: 0.9, ease: "power3.out" }),
  );
  // Progress crawls towards 90% while assets load, then completes once they are ready.
  const crawl = gsap.to(progress, { value: 90, duration: 2.4, ease: "power2.out", onUpdate: render });

  return ready.then(
    () =>
      new Promise((resolve) => {
        crawl.kill();
        gsap
          .timeline({ onComplete: finish })
          .to(progress, { value: 100, duration: 0.45, ease: "power2.inOut", onUpdate: render })
          .to(loader.firstElementChild, { y: -24, opacity: 0, duration: 0.45, ease: "power2.in" }, "+=0.1")
          .fromTo(
            loader,
            { borderRadius: "0px 0px 0px 0px" },
            { yPercent: -100, borderRadius: "0px 0px 40px 40px", duration: 0.9, ease: "power3.inOut" },
            "<0.2",
          )
          .call(resolve, null, "<0.35");
      }),
  );
}
