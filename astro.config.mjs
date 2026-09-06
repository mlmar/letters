import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const mode = process.argv.includes('dev') ? 'development' : 'production';
const env = loadEnv(mode, process.cwd(), '');
const base = env.BASE_PATH || process.env.BASE_PATH || '/';

export default defineConfig({
  base,
  vite: {
    resolve: {
      alias: {
        '#': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  },
});
