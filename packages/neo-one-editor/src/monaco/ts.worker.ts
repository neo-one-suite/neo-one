// tslint:disable
import 'babel-polyfill';
// @ts-ignore
import * as worker from 'monaco-editor/esm/vs/editor/editor.worker';
import { TypeScriptWorker } from './tsWorker';
import { initializeWorker } from '../initializeWorker';

initializeWorker((ctx: any, createData: any) => {
  return new TypeScriptWorker(ctx, createData);
});
