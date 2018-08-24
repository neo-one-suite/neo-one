import { PluginManager, ResourcesManager } from '@neo-one/server-plugin';
import { constants } from '../constants';
import { NEOTracker } from '../NEOTrackerResourceType';

export const getNEOTrackerResourceManager = (pluginManager: PluginManager) =>
  pluginManager.getResourcesManager({
    plugin: constants.PLUGIN,
    resourceType: constants.NEOTRACKER_RESOURCE_TYPE,
  }) as ResourcesManager<NEOTracker>;
