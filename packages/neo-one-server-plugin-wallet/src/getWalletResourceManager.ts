import { PluginManager, ResourcesManager } from '@neo-one/server-plugin';
import { constants } from './constants';
import { Wallet } from './WalletResourceType';

export const getWalletResourceManager = (pluginManager: PluginManager) =>
  pluginManager.getResourcesManager({
    plugin: constants.PLUGIN,
    resourceType: constants.WALLET_RESOURCE_TYPE,
  }) as ResourcesManager<Wallet>;
