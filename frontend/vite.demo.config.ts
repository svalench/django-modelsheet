import {defineConfig, transformWithEsbuild} from 'vite';
import {readFileSync} from 'node:fs';

export default defineConfig({
  plugins: [{name:'demo-notices', async generateBundle(_options, bundle) {
    // The output is a final website asset, not a library for further tree shaking.
    for (const item of Object.values(bundle)) if (item.type === 'chunk') {
      item.code = (await transformWithEsbuild(item.code,item.fileName,{minify:true,target:'es2022'})).code;
    }
    this.emitFile({type:'asset',fileName:'THIRD_PARTY_LICENSES.txt',source:
      ('Tabulator\n\n' + readFileSync('node_modules/tabulator-tables/LICENSE','utf8') +
      '\n\ndecimal.js\n\n' + readFileSync('node_modules/decimal.js/LICENCE.md','utf8').replace(/\r\n/g,'\n')).trimEnd() + '\n'});
  }}],
  build: {
    minify: true,
    outDir: '../docs/assets/playground', emptyOutDir: true,
    lib: {entry:'src/demo.ts', formats:['es'], fileName:()=>'demo.js', cssFileName:'demo'},
  },
});
