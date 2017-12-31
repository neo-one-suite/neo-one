/* @flow */
import fs from 'fs-extra';

import type { CreateContext } from './types';

const copyTemplate = async (ctx: CreateContext) => {
  const { simulationPath, templatePath } = ctx.options;
  await fs.ensureDir(simulationPath);
  await fs.copy(templatePath, simulationPath);
};

const copyContracts = async (ctx: CreateContext) => {
  const { targetContract } = ctx.options;
  if (targetContract != null) {
    await fs.ensureDir(targetContract.targetPath);
    await fs.copy(targetContract.rootPath, targetContract.targetPath);
  }
};

export default {
  title: 'Create simulation directory',
  task: async (ctx: CreateContext) => {
    await Promise.all([copyTemplate(ctx), copyContracts(ctx)]);
  },
};
