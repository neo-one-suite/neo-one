/* @flow */
import { TaskList } from '@neo-one/server-plugin';

import { constants as walletConstants } from '@neo-one/server-plugin-wallet';

import type { CreateContext } from './types';

export const deployContractsEnabled = (ctx: CreateContext) =>
  ctx.options.targetContract != null &&
  ctx.options.targetContract.deployContracts != null;
export default {
  title: 'Deploy contracts',
  enabled: deployContractsEnabled,
  task: (ctx: CreateContext) => {
    const { targetContract } = ctx.options;
    if (targetContract == null) {
      throw new Error('For Flow');
    }
    const { deployContracts } = targetContract;
    if (deployContracts == null) {
      throw new Error('For Flow');
    }

    return new TaskList({
      tasks: deployContracts.map(contract => ({
        title: `Deploy ${contract.baseName}`,
        task: () => {
          ctx.dependencies.push({
            plugin: walletConstants.PLUGIN,
            resourceType: walletConstants.SMART_CONTRACT_RESOURCE_TYPE,
            name: contract.name,
          });

          return ctx.pluginManager
            .getResourcesManager({
              plugin: walletConstants.PLUGIN,
              resourceType: walletConstants.SMART_CONTRACT_RESOURCE_TYPE,
            })
            .create(contract.name, {
              network: contract.network,
              wallet: contract.wallet,
              contract: contract.contract,
            });
        },
      })),
      concurrent: true,
    });
  },
};
