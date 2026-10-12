import { initLoader } from "./scripts/loader.js";
import { initSite } from "./scripts/site.js";
import { initAnimations } from "./scripts/animations.js";

const pageReady = initLoader();
initSite(pageReady);
initAnimations(pageReady);
