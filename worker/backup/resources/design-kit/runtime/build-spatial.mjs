import { build } from '../../../site/node_modules/esbuild/lib/main.js';
import { copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
await build({entryPoints:[path.resolve(here,'../../../site/src/hero-scene.js')],outfile:path.join(here,'public/frontstep-spatial.js'),bundle:true,format:'esm',target:'es2020',minify:true,legalComments:'linked'});
await copyFile(path.resolve(here,'../../../site/node_modules/three/LICENSE'),path.join(here,'public/THREE-LICENSE.txt'));
console.log('Optional local spatial runtime built from the flagship source.');
