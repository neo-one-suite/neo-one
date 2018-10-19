// tslint:disable no-submodule-imports
import {
  Builder,
  createEndpointPouchDB,
  getServiceWorkerEndpoint,
  OutputMessage,
  PouchDBFileSystem,
  ServiceWorkerManager,
} from '@neo-one/local-browser';
import { createBuilderManager } from '@neo-one/local-browser-worker';
import { JSONRPCLocalProvider } from '@neo-one/node-browser';
import { createJSONRPCLocalProviderManager } from '@neo-one/node-browser-worker';
import { WorkerManager } from '@neo-one/worker';
import { BehaviorSubject, Subject } from 'rxjs';
import { createFileSystem, createTranspileCache, getFileSystemDBID } from './create';
import { initializeFileSystem } from './initializeFileSystem';

interface EngineMeta {
  readonly openFiles: ReadonlyArray<string>;
}

interface EngineMetaWithRev {
  readonly doc: EngineMeta;
  readonly _rev: string;
}

const META_KEY = 'meta';
const handleMeta = async (metaDB: PouchDB.Database<EngineMeta>, fs: PouchDBFileSystem): Promise<EngineMetaWithRev> => {
  const metaResult = await metaDB.get(META_KEY).catch((error) => {
    if (error.reason !== 'missing') {
      // tslint:disable-next-line no-console
      console.error(error);
    }
  });

  let meta: EngineMetaWithRev;
  if (metaResult === undefined) {
    let shouldInitialize = false;
    try {
      const doc = { openFiles: [] };
      const { rev } = await metaDB.put({ _id: META_KEY, ...doc });
      meta = { doc, _rev: rev };
      shouldInitialize = true;
    } catch {
      const metaResultTryTwo = await metaDB.get(META_KEY);
      meta = { doc: { openFiles: metaResultTryTwo.openFiles }, _rev: metaResultTryTwo._rev };
    }

    if (shouldInitialize) {
      try {
        await initializeFileSystem(fs);
      } catch (error) {
        await metaDB.remove({ _id: META_KEY, _rev: meta._rev });
        throw error;
      }
    }
  } else {
    meta = { doc: { openFiles: metaResult.openFiles }, _rev: metaResult._rev };
  }

  return meta;
};

interface CreateEngineContextOptions {
  readonly id: string;
  readonly createPreviewURL: () => string;
}

export type Files = ReadonlyArray<string>;

export interface EngineContext {
  readonly id: string;
  readonly fs: PouchDBFileSystem;
  readonly transpileCache: PouchDBFileSystem;
  readonly output$: Subject<OutputMessage>;
  readonly openFiles$: BehaviorSubject<Files>;
  readonly serviceWorkerManager: ServiceWorkerManager;
  readonly builderManager: WorkerManager<typeof Builder>;
  readonly jsonRPCLocalProviderManager: WorkerManager<typeof JSONRPCLocalProvider>;
  readonly createPreviewURL: () => string;
  readonly dispose: () => Promise<void>;
}

export const createEngineContext = async ({
  id,
  createPreviewURL,
}: CreateEngineContextOptions): Promise<EngineContext> => {
  const { worker, container } = await getServiceWorkerEndpoint();

  const serviceWorkerManager = new ServiceWorkerManager(worker);
  const metaDB = createEndpointPouchDB<EngineMeta>(`${id}-meta`, container);
  const [fs, transpileCache] = await Promise.all([
    createFileSystem(id, container),
    createTranspileCache(id, container),
  ]);

  let meta = await handleMeta(metaDB, fs);
  const metaChanges = metaDB.changes({ since: 'now', live: true, include_docs: true }).on('change', (change) => {
    if (change.id === META_KEY && change.doc !== undefined) {
      meta = { doc: change.doc, _rev: change.doc._rev };
    }
  });

  const openFiles$ = new BehaviorSubject<Files>(meta.doc.openFiles);
  const openFilesSubscription = openFiles$.subscribe({
    next: (nextOpenFiles) => {
      metaDB.put({ _id: META_KEY, _rev: meta._rev, openFiles: nextOpenFiles }).catch((error) => {
        // tslint:disable-next-line no-console
        console.error(error);
      });
    },
  });

  const output$ = new Subject<OutputMessage>();
  const jsonRPCLocalProviderManager = createJSONRPCLocalProviderManager(id);
  const builderManager = createBuilderManager(
    getFileSystemDBID(id),
    () => serviceWorkerManager.getEndpoint(),
    output$,
    jsonRPCLocalProviderManager,
  );

  return {
    id,
    fs,
    transpileCache,
    output$,
    openFiles$,
    serviceWorkerManager,
    builderManager,
    jsonRPCLocalProviderManager,
    createPreviewURL,
    dispose: async () => {
      metaChanges.cancel();
      openFilesSubscription.unsubscribe();
      await Promise.all([fs.dispose(), transpileCache.dispose()]);
    },
  };
};
