// tslint:disable no-submodule-imports match-default-export-name
import PouchDB from 'pouchdb';
// @ts-ignore
import registerWorkerPouch from 'worker-pouch/worker';

// tslint:disable-next-line
registerWorkerPouch(self, (value: any) => new PouchDB(value));
