// tslint:disable no-submodule-imports match-default-export-name
import PouchDB from 'pouchdb';
// @ts-ignore
import registerWorkerPouch from 'worker-pouch/worker';

// tslint:disable no-any no-submodule-imports
if (!(self as any).__initialized) {
  // tslint:disable-next-line
  workbox.precaching.precacheAndRoute((self as any).__precacheManifest || []);

  self.addEventListener('activate', (event: any) => {
    event.waitUntil((self as any).clients.claim());
  });
}

// tslint:disable-next-line
registerWorkerPouch(self, (value: any) => new PouchDB(value));
