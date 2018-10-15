var registerWorkerPouch = require('worker-pouch/worker');
var PouchDB = require('pouchdb').default;

workbox.precaching.precacheAndRoute(self.__precacheManifest || []);

registerWorkerPouch(self, (value) => new PouchDB(value));

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});
