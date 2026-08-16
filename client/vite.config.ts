import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '') as Partial<Record<string, string>>;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
        '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
        '@contexts': fileURLToPath(new URL('./src/contexts', import.meta.url)),
        '@editor': fileURLToPath(new URL('./src/editor', import.meta.url)),
        '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
        '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
        '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
        '@socket': fileURLToPath(new URL('./src/socket', import.meta.url)),
        '@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
        '@types': fileURLToPath(new URL('./src/types', import.meta.url)),
        '@utils': fileURLToPath(new URL('./src/utils', import.meta.url))
      }
    },
    server: {
      host: '0.0.0.0',
      port: Number(env.VITE_CLIENT_PORT ?? 5173),
      strictPort: true
    },
    preview: {
      host: '0.0.0.0',
      port: Number(env.VITE_PREVIEW_PORT ?? 4173),
      strictPort: true
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      emptyOutDir: true
    }
  };
});
