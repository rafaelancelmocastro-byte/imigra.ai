import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // REMOVIDO: O bloco 'define' que tentava emular process.env.
      // O Vite injeta import.meta.env automaticamente.
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Aumenta o limite para suprimir o aviso do Vercel sobre chunks grandes
        chunkSizeWarningLimit: 1600,
        rollupOptions: {
            output: {
                manualChunks: {
                    pdfjs: ['pdfjs-dist']
                }
            }
        }
      }
    };
});