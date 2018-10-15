// tslint:disable no-submodule-imports match-default-export-name
import { comlink } from '@neo-one/worker';
import PouchDB from 'pouchdb';
// @ts-ignore
import workerPouchClient from 'worker-pouch/client';
import { PouchDBFileSystem, PouchDBFileSystemDoc } from './PouchDBFileSystem';

// tslint:disable-next-line no-any
(PouchDB as any).adapter('worker', workerPouchClient);

export const createEndpointPouchDB = <Doc extends {}>(
  dbID: string,
  endpoint: comlink.Endpoint | ServiceWorkerContainer,
) =>
  new PouchDB<Doc>(dbID, {
    adapter: 'worker',
    worker: () => {
      // tslint:disable-next-line no-any
      if ((endpoint as any).start) {
        // tslint:disable-next-line no-any
        (endpoint as any).start();
      }

      return endpoint;
    },
    // tslint:disable-next-line no-any
  } as any);

export const createPouchDBFileSystem = async (
  dbID: string,
  endpoint: comlink.Endpoint | ServiceWorkerContainer,
): Promise<PouchDBFileSystem> => PouchDBFileSystem.create(createEndpointPouchDB<PouchDBFileSystemDoc>(dbID, endpoint));
