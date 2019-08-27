// tslint:disable no-object-mutation
import { Configuration } from '@neo-one/cli-common';
import { LocalKeyStore, LocalMemoryStore, NEOONEProvider } from '@neo-one/client-core';
import { Client, LocalUserAccountProvider } from '@neo-one/client-full-core';
import Listr from 'listr';
import { loadContracts } from './loadContracts';
import { loadMigration } from './loadMigration';
import { runMigration } from './runMigration';

export const createTasks = (config: Configuration, network: string) =>
  new Listr([
    {
      title: 'Load migration',
      task: async (ctx) => {
        const client = new Client({
          main: new LocalUserAccountProvider({
            keystore: new LocalKeyStore(new LocalMemoryStore()),
            provider: new NEOONEProvider([{ network: 'main', rpcURL: 'http://localhost:9040/rpc' }]),
          }),
        });
        const [migration, contracts] = await Promise.all([loadMigration(config), loadContracts(config, client)]);
        ctx.migration = migration;
        ctx.contracts = contracts;
        ctx.client = client;
      },
    },
    {
      title: 'Run migration',
      task: async (ctx) => {
        await runMigration(ctx.migration, ctx.contracts, ctx.client, network);
      },
    },
  ]);
