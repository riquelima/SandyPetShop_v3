import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  return {
    envPrefix: ['VITE_', 'OPENROUTER_'],
    server: {
      port: 5175,
      strictPort: true,
      host: '0.0.0.0',
      allowedHosts: true,
      historyApiFallback: true,
      proxy: {
        '/api/n8n': {
          target: 'https://n8n.intelektus.tech',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/n8n/, ''),
        },
      },
    },
    preview: {
      port: 4173,
      host: '0.0.0.0'
    },
    plugins: [react()],
    resolve: {
      alias: {}
    }
  };
});
