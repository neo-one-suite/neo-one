// tslint:disable no-console
import { Configuration } from '@neo-one/cli-common';
import { Hash160 } from '@neo-one/client-core';
import BigNumber from 'bignumber.js';
import repl from 'repl';
import { loadClient } from '../common';
import { loadCreateContracts } from './loadCreateContracts';

export const startConsole = async (config: Configuration, networks: readonly string[]) => {
  const print = console.log.bind(console);
  const [client, createContracts] = await Promise.all([
    loadClient(config, networks, print),
    loadCreateContracts(config),
  ]);

  const replServer = repl.start({
    prompt: 'NEO•ONE> ',
  });

  // tslint:disable-next-line no-any
  const addProperty = (name: string, value: any) => {
    Object.defineProperty(replServer.context, name, {
      configurable: false,
      enumerable: true,
      value,
    });
  };

  addProperty('client', client);
  Object.entries(createContracts(client)).forEach(([name, contract]) => {
    addProperty(name, contract);
  });
  addProperty('BigNumber', BigNumber);
  addProperty('print', console.log.bind(console));
  addProperty('printError', console.error.bind(console));
  addProperty('Hash160', Hash160);

  return () => {
    replServer.close();
  };
};
