import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_BACKEND_PROXY_TARGET || 'http://localhost:80';
  const adapterTarget = env.VITE_ADAPTER_PROXY_TARGET || 'http://localhost:4000';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/agui': {
          target: adapterTarget,
          changeOrigin: true,
        },
        '/api': {
          target: adapterTarget,
          changeOrigin: true,
        },
        '/backend': {
          target: backendTarget,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/backend/, ''),
        },
      },
    },
  };
});
