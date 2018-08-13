import convict from 'convict';
import cosmiconfig from 'cosmiconfig';
import * as path from 'path';
import { ProjectConfig, projectConfigSchema } from './types';

const validateConfig = (rootDir: string, configIn: cosmiconfig.Config): ProjectConfig => {
  const config = convict<ProjectConfig>(projectConfigSchema);
  config.load(configIn);
  config.validate({ allowed: 'warn' });

  const validatedConfig = config.getProperties();

  return {
    ...validatedConfig,
    paths: {
      contracts: path.resolve(rootDir, validatedConfig.paths.contracts),
      generated: path.resolve(rootDir, validatedConfig.paths.generated),
    },
  };
};

export const loadProject = async (rootDir: string): Promise<ProjectConfig> => {
  const explorer = cosmiconfig('one');

  const result = await explorer.search(rootDir);

  return validateConfig(rootDir, result === null ? {} : result.config);
};
