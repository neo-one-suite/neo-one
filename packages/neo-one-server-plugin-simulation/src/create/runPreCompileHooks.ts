import { TaskList } from '@neo-one/server-plugin';
import * as fs from 'fs-extra';
import { Observable } from 'rxjs';
import { executeHook } from '../common';
import { CreateContext } from './types';

export const runPreCompileHooks = {
  title: 'Run simulation pre-compile hooks',
  enabled: (ctx: CreateContext) => ctx.options.preCompile !== undefined && ctx.options.preCompileConfig !== undefined,
  task: () =>
    new TaskList({
      tasks: [
        {
          title: 'Write pre-compile configuration',
          task: async (ctx: CreateContext): Promise<void> => {
            const { preCompileConfig, configPath } = ctx.options;
            if (preCompileConfig === undefined) {
              throw new Error('For Flow');
            }
            await fs.writeJSON(configPath, preCompileConfig);
          },
        },
        {
          title: 'Run hooks',
          task: (ctx: CreateContext): Observable<string> => {
            const { preCompile, simulationPath } = ctx.options;
            if (preCompile === undefined) {
              throw new Error('For Flow');
            }

            return executeHook(preCompile, simulationPath);
          },
        },
      ],
    }),
};
