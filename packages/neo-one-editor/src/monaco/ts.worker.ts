// tslint:disable
import '@babel/polyfill';

import { TypeScriptWorker } from './tsWorker';
import { initializeWorker } from './initializeWorker';

initializeWorker((fs: any) => (ctx: any, createData: any) => {
  return new TypeScriptWorker(ctx, createData, fs);
});
