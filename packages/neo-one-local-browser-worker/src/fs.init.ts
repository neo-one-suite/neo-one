// tslint:disable match-default-export-name

import { registerWorkerPouch } from '@neo-one/local-browser';
import PouchDB from 'pouchdb';

// tslint:disable-next-line
registerWorkerPouch(self, (...args: any[]) => {
  // tslint:disable-next-line no-any
  const db = new PouchDB<any>(...args);
  db.setMaxListeners(100);

  return db;
});
