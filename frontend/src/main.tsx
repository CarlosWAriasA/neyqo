import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from './app/providers/AppProviders';
import { registerServiceWorker } from './pwa/registerServiceWorker';
import { router } from './routes/router';
import './styles/globals.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('No se encontró el contenedor principal de Neyqo.');
}

createRoot(root).render(
  <StrictMode>
    <AppProviders router={router} />
  </StrictMode>,
);

registerServiceWorker();
