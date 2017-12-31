/* @flow */
import type { CreateContext } from './types';

import { executeHook } from '../common';

export default {
  title: 'Run simulation hooks',
  enabled: (ctx: CreateContext) => ctx.options.createHook != null,
  task: (ctx: CreateContext) => {
    const { createHook, simulationPath } = ctx.options;
    if (createHook == null) {
      throw new Error('For Flow');
    }

    return executeHook(createHook, simulationPath);
  },
};
