import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const minimaxKey = env.MINIMAX_API_KEY || process.env.MINIMAX_API_KEY || env.VITE_MINIMAX_API_KEY || process.env.VITE_MINIMAX_API_KEY || '';

  return {
    envPrefix: ['VITE_', 'MINIMAX_'],
    server: {
      port: 5173,
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
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''),
      'import.meta.env.MINIMAX_API_KEY': JSON.stringify(minimaxKey),
      'process.env.MINIMAX_API_KEY': JSON.stringify(minimaxKey)
    }
  };
});
