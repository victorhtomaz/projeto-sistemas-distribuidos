import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.AUTH_SERVICE_URL || 'http://localhost:5077';
  const proxyEntry = {
    target,
    changeOrigin: false,
    secure: false,
  };

  const proxy = {
    '/auth/': proxyEntry,
    '/connect/': proxyEntry,
    '/.well-known/': proxyEntry,
  };

  return {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 3000,
      strictPort: true,
      proxy,
    },
    preview: {
      port: 3000,
      strictPort: true,
      proxy,
    },
  };
});
