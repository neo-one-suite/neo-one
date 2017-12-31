/* @flow */
import { TaskList } from '@neo-one/server-plugin';

import { constants as compilerConstants } from '@neo-one/server-plugin-compiler';

import type { CreateContext } from './types';

export default {
  title: 'Compile contracts',
  enabled: (ctx: CreateContext) => ctx.options.targetContract != null,
  task: (ctx: CreateContext) => {
    const { targetContract } = ctx.options;
    if (targetContract == null) {
      throw new Error('For Flow');
    }
    ctx.dependencies.push(
      ...targetContract.compileContracts.map(contract => ({
        plugin: compilerConstants.PLUGIN,
        resourceType: compilerConstants.CONTRACT_RESOURCE_TYPE,
        name: contract.name,
      })),
    );
    return new TaskList({
      tasks: targetContract.compileContracts.map(contract => ({
        title: `Compile ${contract.name}`,
        task: () =>
          ctx.pluginManager
            .getResourcesManager({
              plugin: compilerConstants.PLUGIN,
              resourceType: compilerConstants.CONTRACT_RESOURCE_TYPE,
            })
            .create(contract.name, {
              scPath: contract.path,
              abi: contract.abi,
              hasDynamicInvoke: contract.hasDynamicInvoke,
              hasStorage: contract.hasStorage,
            }),
      })),
      concurrent: true,
    });
  },
};
