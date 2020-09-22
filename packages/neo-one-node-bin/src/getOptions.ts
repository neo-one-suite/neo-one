import { common } from '@neo-one/client-common';
// tslint:disable no-any
import { FullNodeCreateOptions } from '@neo-one/node';
import { createMain, createTest, deserializeSettings, serializeSettings } from '@neo-one/node-neo-settings';
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
  blockchain: serializeSettings(createMain()),
};

export const getOptions = (): FullNodeCreateOptions['options'] => {
  let options = rc('neo-one', DEFAULT_OPTIONS) as FullNodeCreateOptions['options'];

  const { blockchain: blockchainIn } = options;
  if ((typeof blockchainIn as any) === 'string') {
    options = {
      ...options,
      blockchain: serializeSettings((blockchainIn as any) === 'test' ? createTest() : createMain()) as any,
    };
  }

  const getFreeGas =
    (blockchainIn as any) === 'main'
      ? (index: number) => (index >= 6195000 ? common.FIFTY_FIXED8 : common.TEN_FIXED8)
      : undefined;

  const blockchain = {
    ...deserializeSettings(options.blockchain),
    getFreeGas,
  };

  options = {
    ...options,
    blockchain,
  };

  return options;
};
