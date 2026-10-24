import {defineConfig} from 'vite';
import {readFileSync} from 'node:fs';

export default defineConfig({plugins: [{name:'dependency-notices', generateBundle() {
  this.emitFile({type:'asset', fileName:'THIRD_PARTY_LICENSES.txt', source:
    'Tabulator\n\n' + readFileSync('node_modules/tabulator-tables/LICENSE','utf8') +
    '\n\ndecimal.js\n\n' + readFileSync('node_modules/decimal.js/LICENCE.md','utf8').replace(/\r\n/g,'\n')});
}}], build: {
  outDir: '../modelsheet/static/modelsheet', emptyOutDir: true, minify: true,
  lib: {entry: 'src/main.ts', formats: ['es'], fileName: () => 'sheet.js', cssFileName: 'sheet'},
  rollupOptions: {output: {assetFileNames: asset => asset.names?.[0]?.endsWith('.css') ? 'sheet.css' : '[name][extname]'}},
}});
