import { PluginManager, ResourcesManager } from '@neo-one/server-plugin';
import { constants } from './constants';
import { Network } from './NetworkResourceType';

export const getNetworkResourceManager = (pluginManager: PluginManager) =>
  pluginManager.getResourcesManager({
    plugin: constants.PLUGIN,
    resourceType: constants.NETWORK_RESOURCE_TYPE,
  }) as ResourcesManager<Network>;
