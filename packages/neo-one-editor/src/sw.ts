// tslint:disable no-any no-submodule-imports match-default-export-name
import PouchDB from 'pouchdb';
// @ts-ignore
import registerWorkerPouch from 'worker-pouch/worker';

declare const workbox: any;

// tslint:disable-next-line
workbox.precaching.precacheAndRoute((self as any).__precacheManifest || []);

// tslint:disable-next-line
registerWorkerPouch(self, (value: any) => new PouchDB(value));

self.addEventListener('activate', (event: any) => {
  event.waitUntil((self as any).clients.claim());
});
