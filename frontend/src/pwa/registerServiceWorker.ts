const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        registration.update();
      })
      .catch((error: unknown) => {
        if (isLocalhost) {
          console.warn('No se pudo registrar el service worker de Neyqo.', error);
        }
      });
  });
}
