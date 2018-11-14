// tslint:disable no-submodule-imports match-default-export-name
import { comlink } from '@neo-one/worker';
import PouchDB from 'pouchdb';
import { PouchDBFileSystem, PouchDBFileSystemDoc } from './PouchDBFileSystem';
import { workerPouch } from './worker/workerPouch';

// tslint:disable-next-line no-any
(PouchDB as any).adapter('worker', workerPouch);

export const createEndpointPouchDB = <Doc extends {}>(
  dbID: string,
  endpoint: comlink.Endpoint | ServiceWorkerContainer,
) => {
  const db = new PouchDB<Doc>(dbID, {
    adapter: 'worker',
    endpoint: () => endpoint,
    // tslint:disable-next-line no-any
  } as any);
  db.setMaxListeners(20);

  return db;
};

export const createPouchDBFileSystem = async (
  dbID: string,
  endpoint: comlink.Endpoint | ServiceWorkerContainer,
): Promise<PouchDBFileSystem> => PouchDBFileSystem.create(createEndpointPouchDB<PouchDBFileSystemDoc>(dbID, endpoint));
