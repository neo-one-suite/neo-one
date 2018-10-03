// tslint:disable
import '@babel/polyfill';

import { TypeScriptWorker } from './tsWorker';
import { initializeWorker } from './initializeWorker';
import { WorkerMirrorFileSystem, MemoryFileSystem, LocalForageFileSystem } from '@neo-one/local-browser';

// tslint:disable-next-line no-let
let fs: WorkerMirrorFileSystem | undefined;
let fallbackCallback: (event: MessageEvent) => void;
// tslint:disable-next-line readonly-array
const queue: MessageEvent[] = [];
initializeWorker(
  (ctx: any, createData: any) => {
    const fsPromise = WorkerMirrorFileSystem.create<WorkerMirrorFileSystem>(
      new MemoryFileSystem(),
      new LocalForageFileSystem(createData.fileSystemID),
    )
      .then((_fs) => {
        fs = _fs;

        for (const event of queue) {
          fs.handleMessage(event, fallbackCallback);
        }

        return fs;
      })
      .catch((error) => {
        // tslint:disable-next-line no-console
        console.error(error);
      });
    return new TypeScriptWorker(ctx, createData, fsPromise);
  },
  (fallback) => {
    fallbackCallback = fallback;
    return (event) => {
      if (fs === undefined) {
        if (event.data != undefined && event.data.fsChange) {
          queue.push(event);
        } else {
          fallback(event);
        }
      } else {
        fs.handleMessage(event, fallback);
      }
    };
  },
);
