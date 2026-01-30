import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Carrega as variáveis de ambiente baseadas no modo (development/production)
    const env = loadEnv(mode, process.cwd(), '');

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // CORREÇÃO CRÍTICA: Isso impede o erro "process is not defined"
        'process.env': {
           VITE_GROQ_API_KEY: env.VITE_GROQ_API_KEY
        },
        // Fallback de segurança para garantir a substituição direta
        'process.env.VITE_GROQ_API_KEY': JSON.stringify(env.VITE_GROQ_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Evita que o build falhe por arquivos grandes (aviso do pdfjs)
        chunkSizeWarningLimit: 1600,
      }
    };
});