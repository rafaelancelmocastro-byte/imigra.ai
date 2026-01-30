import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// --- SEGURANÇA CONTRA TELA BRANCA ---
// Verifica se o localStorage tem dados incompatíveis com a nova versão
try {
  const savedState = localStorage.getItem('imigra_global_state');
  if (savedState) {
    const parsed = JSON.parse(savedState);
    // Se não existir a array 'processes' (estrutura nova), apaga tudo para evitar crash
    if (!parsed.processes || !Array.isArray(parsed.processes)) {
      console.warn("Versão antiga de dados detectada. Limpando cache para evitar erros.");
      localStorage.clear(); 
      // Força um reload limpo se necessário
      if (window.location.hash !== '#/onboarding') {
         window.location.hash = '#/onboarding';
      }
    }
  }
} catch (e) {
  // Se o JSON estiver corrompido, limpa também
  localStorage.clear();
}
// ------------------------------------

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);