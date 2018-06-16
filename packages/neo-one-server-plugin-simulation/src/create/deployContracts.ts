import { TaskList } from '@neo-one/server-plugin';
import { constants as walletConstants } from '@neo-one/server-plugin-wallet';
import { CreateContext } from './types';

export const deployContractsEnabled = (ctx: CreateContext) =>
  ctx.options.targetContract !== undefined && ctx.options.targetContract.deployContracts !== undefined;
export const deployContracts = {
  title: 'Deploy contracts',
  enabled: deployContractsEnabled,
  task: (ctx: CreateContext): TaskList => {
    const { targetContract } = ctx.options;
    if (targetContract === undefined) {
      throw new Error('For Flow');
    }
    const deployContractsArray = targetContract.deployContracts;
    if (deployContractsArray === undefined) {
      throw new Error('For Flow');
    }

    return new TaskList({
      tasks: deployContractsArray.map((contract) => ({
        title: `Deploy ${contract.baseName}`,
        task: () => {
          // tslint:disable-next-line no-array-mutation
          ctx.mutableDependencies.push({
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
