import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

const mode = process.argv.includes('dev') ? 'development' : 'production';
const env = loadEnv(mode, process.cwd(), '');
const base = env.BASE_PATH || '/';

export default defineConfig({
  base,
});
