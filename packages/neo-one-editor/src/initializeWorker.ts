// tslint:disable no-submodule-imports no-any
// @ts-ignore
import { SimpleWorkerServer } from 'monaco-editor/esm/vs/base/common/worker/simpleWorker';
// @ts-ignore
import { EditorSimpleWorkerImpl } from 'monaco-editor/esm/vs/editor/common/services/editorSimpleWorker';

declare var self: DedicatedWorkerGlobalScope;

// tslint:disable-next-line no-let
let initialized = false;

// tslint:disable-next-line export-name
export function initializeWorker(foreignModule: any) {
  if (initialized) {
    return;
  }

  initialized = true;
  const editorWorker = new EditorSimpleWorkerImpl(foreignModule);
  const simpleWorker = new SimpleWorkerServer((msg: any) => {
    self.postMessage(msg);
  }, editorWorker);

  // tslint:disable-next-line no-object-mutation
  self.onmessage = (e) => {
    simpleWorker.onmessage(e.data);
  };
}
// tslint:disable-next-line no-object-mutation
self.onmessage = () => {
  if (!initialized) {
    // tslint:disable-next-line no-null-keyword
    initializeWorker(null);
  }
};
