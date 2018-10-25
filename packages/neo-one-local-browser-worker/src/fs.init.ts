// tslint:disable no-submodule-imports match-default-export-name no-import-side-effect
import '@babel/polyfill';

import { registerWorkerPouch } from '@neo-one/local-browser';
import PouchDB from 'pouchdb';

// tslint:disable-next-line
registerWorkerPouch(self, (...args: any[]) => {
  // tslint:disable-next-line no-any
  const db = new PouchDB<any>(...args);
  db.setMaxListeners(100);

  return db;
});
