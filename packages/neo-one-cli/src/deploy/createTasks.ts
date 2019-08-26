// tslint:disable no-object-mutation
import { Configuration } from '@neo-one/cli-common';
import Listr from 'listr';
import { loadMigration } from './loadMigration';

export const createTasks = (config: Configuration, _network: string) =>
  new Listr([
    {
      title: 'Load migration',
      task: async (ctx) => {
        ctx.migration = await loadMigration(config);
      },
    },
  ]);
