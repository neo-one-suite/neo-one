import { PluginManager } from '@neo-one/server-plugin';
import { utils } from '@neo-one/utils';
import { filter, take, timeout } from 'rxjs/operators';
import { Project } from '../ProjectResourceType';
import { getProjectResourceManager } from './getProjectResourceManager';

export const getProject = async (pluginManager: PluginManager, projectID: string): Promise<Project> => {
  const resourceManager = getProjectResourceManager(pluginManager);

  return resourceManager
    .getResource$({ name: projectID, options: {} })
    .pipe(
      filter(utils.notNull),
      take(1),
      timeout(500),
    )
    .toPromise();
};
