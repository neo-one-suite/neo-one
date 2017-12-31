/* @flow */
import { TaskList } from '@neo-one/server-plugin';

import fs from 'fs-extra';

import type { CreateContext } from './types';

import { executeHook } from '../common';

export default {
  title: 'Run simulation pre-compile hooks',
  enabled: (ctx: CreateContext) =>
    ctx.options.preCompile != null && ctx.options.preCompileConfig != null,
  task: () =>
    new TaskList({
      tasks: [
        {
          title: 'Write pre-compile configuration',
          task: async (ctx: CreateContext) => {
            const { preCompileConfig, configPath } = ctx.options;
            if (preCompileConfig == null) {
              throw new Error('For Flow');
            }
            await fs.writeJSON(configPath, preCompileConfig);
          },
        },
        {
          title: 'Run hooks',
          task: (ctx: CreateContext) => {
            const { preCompile, simulationPath } = ctx.options;
            if (preCompile == null) {
              throw new Error('For Flow');
            }

            return executeHook(preCompile, simulationPath);
          },
        },
      ],
    }),
};
