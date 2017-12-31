/* @flow */
import { constants as networkConstants } from '@neo-one/server-plugin-network';

import type { CreateContext } from './types';

export default {
  title: 'Create network',
  enabled: (ctx: CreateContext) => ctx.options.network != null,
  task: (ctx: CreateContext) => {
    const { network } = ctx.options;
    if (network == null) {
      throw new Error('For Flow');
    }

    ctx.dependencies.push({
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
