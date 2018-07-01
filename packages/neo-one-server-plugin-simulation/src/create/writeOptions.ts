import * as fs from 'fs-extra';
import * as path from 'path';
import { CreateContext } from './types';

export const writeOptions = {
  title: 'Save configuration',
  task: async (ctx: CreateContext) => {
    await fs.ensureDir(path.dirname(ctx.staticOptions.createOptionsPath));
    await fs.writeJSON(ctx.staticOptions.createOptionsPath, ctx.createOptions);
  },
};
