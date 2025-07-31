import { defineConfig } from 'vite';
import { builtinModules } from 'module';

// Get all Node.js built-in modules
const builtins = builtinModules.filter(m => !m.startsWith('_'));

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.js',
      name: 'openai-api-mock',
      formats: ['es', 'cjs'],
      fileName: format => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: [...builtins.map(m => `node:${m}`), ...builtins, 'nock', 'node-fetch', 'openai'],
      output: {
        exports: 'auto',
        // Provide global variables to use in UMD build
        globals: {
          nock: 'nock',
          'node-fetch': 'fetch',
          openai: 'OpenAI',
        },
      },
    },
    target: 'node18',
    sourcemap: true,
    minify: false,
  },
});
