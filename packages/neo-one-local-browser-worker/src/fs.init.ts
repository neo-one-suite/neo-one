// tslint:disable no-submodule-imports match-default-export-name
import PouchDB from 'pouchdb';
// @ts-ignore
import registerWorkerPouch from 'worker-pouch/worker';

// tslint:disable-next-line
registerWorkerPouch(self, (value: any) => {
  // tslint:disable-next-line no-any
  const db = new PouchDB<any>(value);
  db.setMaxListeners(100);

  return db;
});
