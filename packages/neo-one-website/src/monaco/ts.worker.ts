// tslint:disable
// @ts-ignore
import * as worker from 'monaco-editor-core/esm/vs/editor/editor.worker';
import { TypeScriptWorker } from './tsWorker';

worker.initialize((ctx: any, createData: any) => {
  return new TypeScriptWorker(ctx, createData);
});
