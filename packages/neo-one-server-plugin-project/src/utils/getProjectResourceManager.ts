import { PluginManager, ResourcesManager } from '@neo-one/server-plugin';
import { constants } from '../constants';
import { Project } from '../ProjectResourceType';

export const getProjectResourceManager = (pluginManager: PluginManager) =>
  pluginManager.getResourcesManager({
    plugin: constants.PLUGIN,
    resourceType: constants.PROJECT_RESOURCE_TYPE,
  }) as ResourcesManager<Project>;
