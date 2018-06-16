import { executeHook } from '../common';
import { CreateContext } from './types';

export const runCreateHooks = {
  title: 'Run simulation hooks',
  enabled: (ctx: CreateContext) => ctx.options.createHook !== undefined,
  task: (ctx: CreateContext) => {
    const { createHook, simulationPath } = ctx.options;
    if (createHook === undefined) {
      throw new Error('For Flow');
    }

    return executeHook(createHook, simulationPath);
  },
};
