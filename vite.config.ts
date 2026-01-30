import path from 'path';
import { defineConfig } from 'vite'; // loadEnv não é mais necessário aqui para o define
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // FIX: Removido bloco 'define' problemático. O Vite injeta import.meta.env automaticamente.
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        chunkSizeWarningLimit: 1600,
      }
    };
});