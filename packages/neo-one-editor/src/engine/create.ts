// tslint:disable no-submodule-imports
import { createPouchDBFileSystem, PouchDBFileSystem } from '@neo-one/local-browser';
import { comlink } from '@neo-one/worker';

export const getFileSystemDBID = (id: string) => `${id}-fs`;
export const createFileSystem = async (
  id: string,
  endpoint: comlink.Endpoint | ServiceWorkerContainer,
): Promise<PouchDBFileSystem> => createPouchDBFileSystem(getFileSystemDBID(id), endpoint);
export const createTranspileCache = async (
  id: string,
  endpoint: comlink.Endpoint | ServiceWorkerContainer,
): Promise<PouchDBFileSystem> => createPouchDBFileSystem(`${id}-transpile`, endpoint);
