import { PluginManager } from '@neo-one/server-plugin';
import fs from 'fs-extra';
import { take } from 'rxjs/operators';
import { ProjectResourceOptions } from '../ProjectResourceType';
import { CodegenLanguage, ProjectConfig } from '../types';
import { getProjectResourceManager } from './getProjectResourceManager';
import { getCommonPaths, getTSPath } from './paths';

const projectIDRegex = /@projectID ([0-9a-z-]+)/;

const loadProjectIDFromFile = async (projectConfig: ProjectConfig): Promise<string | undefined> => {
  const { projectIDPath: projectIDPathIn } = getCommonPaths(projectConfig);

  const projectIDPath =
    projectConfig.codegen.language === CodegenLanguage.JavaScript ? projectIDPathIn : getTSPath(projectIDPathIn);

  const exists = await fs.pathExists(projectIDPath);
  if (exists) {
    const contents = await fs.readFile(projectIDPath, 'utf8');
    const match = projectIDRegex.exec(contents);
    if (match !== null) {
      return match[1];
    }
  }

  return undefined;
};

export const loadProjectID = async (
  pluginManager: PluginManager,
  projectConfig: ProjectConfig,
  options: ProjectResourceOptions,
): Promise<string | undefined> => {
  const resourceManager = getProjectResourceManager(pluginManager);
  const [projects, projectID] = await Promise.all([
    resourceManager
      .getResources$({})
      .pipe(take(1))
      .toPromise(),
    loadProjectIDFromFile(projectConfig),
  ]);

  if (projectID !== undefined) {
    return projectID;
  }

  const project = projects.find((proj) => proj.rootDir === options.rootDir);
  if (project !== undefined) {
    return project.name;
  }

  return undefined;
};
