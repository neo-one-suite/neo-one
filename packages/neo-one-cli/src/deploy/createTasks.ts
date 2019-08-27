// tslint:disable no-object-mutation
import { Configuration } from '@neo-one/cli-common';
import { LocalKeyStore, LocalMemoryStore, NEOONEProvider } from '@neo-one/client-core';
import { Client, LocalUserAccountProvider } from '@neo-one/client-full-core';
import Listr from 'listr';
import { loadContracts } from './loadContracts';
import { loadMigration } from './loadMigration';

export const createTasks = (config: Configuration, _network: string) =>
  new Listr([
    {
      title: 'Load migration',
      task: async (ctx) => {
        const [migration, contracts] = await Promise.all([
          loadMigration(config),
          loadContracts(
            config,
            new Client({
              main: new LocalUserAccountProvider({
                keystore: new LocalKeyStore(new LocalMemoryStore()),
                provider: new NEOONEProvider([{ network: 'main', rpcURL: 'http://localhost:9040/rpc' }]),
              }),
            }),
          ),
        ]);
        ctx.migration = migration;
        ctx.contracts = contracts;
      },
    },
  ]);
