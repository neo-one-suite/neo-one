// tslint:disable no-any no-submodule-imports

declare const workbox: any;
// tslint:disable-next-line
workbox.precaching.precacheAndRoute((self as any).__precacheManifest || []);

self.addEventListener('activate', (event: any) => {
  event.waitUntil((self as any).clients.claim());
});

// tslint:disable-next-line no-object-mutation
(self as any).__initialized = true;

import('./sw.init').catch((error) => {
  // tslint:disable-next-line no-console
  console.error(error);
});
