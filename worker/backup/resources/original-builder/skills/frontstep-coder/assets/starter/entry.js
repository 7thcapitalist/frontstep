// Client site entry. Configure ONE signature effect + page polish. `npm run build` → public/app.bundle.js
import { initPage } from "./fx/page.js";
// import { mountProduct3D } from "./fx/product3d.js";      // 3D product in the hero (needs a .glb)
// import { mountPhotoReveal } from "./fx/photoReveal.js";  // real photos, cinematic, scroll-scrubbed
// import { mountMenuHover } from "./fx/menuHover.js";      // menu/product list, photo follows cursor
// import { mountBloom } from "./fx/bloom.js";              // generative bouquet
// import { mountParticleWord } from "./fx/particles.js";   // particles form the business name
// import { mountGlass } from "./fx/glass.js";              // glass object hero

const $ = s => document.querySelector(s);
initPage({ whatsapp: "55DDDNUMERO", message: "Olá! Vi o site e quero ...", headlines: "h1", reveals: "h2" });
