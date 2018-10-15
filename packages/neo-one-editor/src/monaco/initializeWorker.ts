/// <reference lib="webworker" />
// tslint:disable no-submodule-imports no-any
// @ts-ignore
import { SimpleWorkerServer } from 'monaco-editor/esm/vs/base/common/worker/simpleWorker';
// @ts-ignore
import { EditorSimpleWorkerImpl } from 'monaco-editor/esm/vs/editor/common/services/editorSimpleWorker';
import { createFileSystem } from '../engine/create';

declare var self: DedicatedWorkerGlobalScope;

// tslint:disable-next-line no-let
let initialized = false;

const mutableQueue: MessageEvent[] = [];

// tslint:disable-next-line export-name
export function initializeWorker(foreignModule: (fs: any) => any) {
  if (initialized) {
    return;
  }

  initialized = true;
  self.onmessage = (event) => {
    if (event.data && event.data.id && event.data.endpoint) {
      createFileSystem(event.data.id, event.data.endpoint)
        .then((fs) => {
          const editorWorker = new EditorSimpleWorkerImpl(foreignModule(fs));
          const simpleWorker = new SimpleWorkerServer((msg: any) => {
            self.postMessage(msg);
          }, editorWorker);

          mutableQueue.forEach((e) => {
            simpleWorker.onmessage(e);
          });

          // tslint:disable-next-line no-object-mutation
          self.onmessage = (e) => {
            simpleWorker.onmessage(e.data);
          };
        })
        .catch((error) => {
          // tslint:disable-next-line no-console
          console.error(error);
        });
    } else {
      mutableQueue.push(event);
    }
  };
}
