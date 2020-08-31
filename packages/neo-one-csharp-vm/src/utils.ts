import { func, Params, Source, TSQL } from '@neo-one/edge';
import path from 'path';
import { DefaultMethods, DispatcherFunc } from './types';

const APP_ROOT = path.resolve(__dirname, '..');
const CSHARP_APP_ROOT = process.env.EDGE_APP_ROOT ?? path.resolve(APP_ROOT, 'lib', 'bin', 'Debug', 'netcoreapp3.0');

export const constants = {
  APP_ROOT,
  CSHARP_APP_ROOT,
};

type EdgeOptions = (() => void) | string | Params | Source | TSQL;

export const createCSharpDispatchInvoke = <Methods extends DefaultMethods>(
  options: EdgeOptions,
): DispatcherFunc<Methods> => {
  const invokeFunction = func(options);

  return (input) => invokeFunction(input, true);
};
