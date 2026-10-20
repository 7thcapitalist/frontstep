// Client build: bundle entry.js into public/app.bundle.js. Fonts: copy the woff2 files you chose into public/fonts.
import { build } from "esbuild";
await build({ entryPoints: ["entry.js"], bundle: true, minify: true, format: "esm", target: "es2022", outfile: "public/app.bundle.js" });
console.log("built");
