import { constants as networkConstants } from '@neo-one/server-plugin-network';
import { CreateContext } from './types';

export const createNetwork = {
  title: 'Create network',
  enabled: (ctx: CreateContext) => ctx.options.network !== undefined,
  task: (ctx: CreateContext) => {
    const { network } = ctx.options;
    if (network === undefined) {
      throw new Error('For Flow');
    }
    // tslint:disable-next-line no-array-mutation
    ctx.mutableDependencies.push({
      plugin: networkConstants.PLUGIN,
      resourceType: networkConstants.NETWORK_RESOURCE_TYPE,
      name: network.name,
    });

    return ctx.pluginManager
      .getResourcesManager({
        plugin: networkConstants.PLUGIN,
        resourceType: networkConstants.NETWORK_RESOURCE_TYPE,
      })
      .create(network.name, {});
  },
};
