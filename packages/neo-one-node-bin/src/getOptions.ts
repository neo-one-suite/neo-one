import { FullNodeCreateOptions } from '@neo-one/node';
import { createMain, createTest } from '@neo-one/node-neo-settings';
import envPaths from 'env-paths';
import rc from 'rc';

const DEFAULT_OPTIONS = {
  path: envPaths('neo-one', { suffix: '' }).data,
  rpc: {
    http:
      process.env.PORT === undefined
        ? undefined
        : {
            port: process.env.PORT,
            host: 'localhost',
          },
  },
  blockchain: createMain(),
};

export const getOptions = (): FullNodeCreateOptions['options'] => {
  let options = rc('neo-one', DEFAULT_OPTIONS) as FullNodeCreateOptions['options'];

  const { blockchain } = options;
  if ((typeof blockchain as any) === 'string') {
    options = {
      ...options,
      blockchain: (blockchain as any) === 'test' ? createTest() : createMain(),
    };
  }

  return options;
};
