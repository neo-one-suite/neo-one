/* @flow */
import fs from 'fs-extra';
import path from 'path';

import type { CreateContext } from './types';

export default {
  title: 'Save configuration',
  task: async (ctx: CreateContext) => {
    await fs.ensureDir(path.dirname(ctx.staticOptions.createOptionsPath));
    await fs.writeJSON(ctx.staticOptions.createOptionsPath, ctx.createOptions);
  },
};
