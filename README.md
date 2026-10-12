# Orbit Energy website

Single-page site for Orbit Energy Legal Consultants, P.A. Plain HTML, CSS and JavaScript, bundled with [Vite](https://vite.dev) and animated with [GSAP](https://gsap.com) + ScrollTrigger.

## Getting started

Requires Node.js 20.19+ (or 22.12+).

```bash
npm install
npm run dev       # local dev server with hot reload (add -- --host to test on a phone)
npm run build     # production build into dist/
npm run preview   # serve the production build locally
```

## Project structure

```
index.html                 Page markup: Home, Practice areas, History, Team, FAQ, Contact
public/
  favicon.svg              Copied to the site root as-is
src/
  main.js                  Entry point; starts the site logic, then the animations
  scripts/
    site.js                Navigation, mobile menu, tabs, services carousel, hero video
    animations.js          GSAP and ScrollTrigger motion (respects reduced-motion)
  styles/
    main.css               All styles, grouped by page section, then breakpoints
  assets/
    fonts/                 Switzer variable font
    images/                Logo, photography, video poster
    video/                 Hero background video
vercel.json                Vercel build settings and cache headers
```

Images, fonts and video are referenced from `index.html` / `main.css` with `/src/assets/...` paths. Vite fingerprints them at build time, and `vercel.json` caches everything under `/assets/` for a year.

Sources for the replacement Unsplash photography are recorded in [src/assets/images/SOURCES.md](src/assets/images/SOURCES.md).

Practice areas follow [Orbit's official practice page](https://orbitenergypa.com/practice-areas): residential solar; commercial and industrial solar; battery storage and backup power; commercial wind installation; general construction; and contracts and transactional review and drafting. Service descriptions retain the published scope. History and the two team profiles are based on [About Us](https://orbitenergypa.com/about-us). Firm age (nearly two decades) and Joshua's experience (over 30 years representing clean energy developers and manufacturers) are stated separately.

## Deploying to Vercel

The project is ready to deploy as-is; `vercel.json` pins the Vite preset, `npm run build` and the `dist` output folder.

- **From GitHub:** push this folder to a repository, then in Vercel choose *Add New → Project* and import it. No settings need changing.
- **From the terminal:** `npx vercel` for a preview deployment, `npx vercel --prod` for production.

## Before launch

- `index.html` contains `<meta name="robots" content="noindex,nofollow">` so the draft stays out of search results. Remove it when the site goes live.
- Photography is illustrative; the two team profiles reflect Orbit's published team. Mary's initials are shown in place of an unavailable portrait.
- Contact buttons use the [official contact details](https://orbitenergypa.com/contact-us): info@orbitenergypa.com and (773) 935-6501. They open email or telephone apps; there is no contact form backend.
- `src/assets/images/orbit-logo.png` is the original logo and is not used by the page (`orbit-logo-clean.png` is).
