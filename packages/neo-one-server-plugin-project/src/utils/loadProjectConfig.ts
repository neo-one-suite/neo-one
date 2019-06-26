import { CodegenFramework } from '@neo-one/smart-contract-codegen';
import convict from 'convict';
import cosmiconfig from 'cosmiconfig';
import fs from 'fs-extra';
import path from 'path';
import { ProjectConfig, projectConfigSchema } from '../types';

const validateConfig = async (rootDir: string, configIn: cosmiconfig.Config): Promise<ProjectConfig> => {
  const config = convict<ProjectConfig>(projectConfigSchema);
  config.load(configIn);
  config.validate({ allowed: 'warn' });

  const validatedConfig = config.getProperties();

  let newFramework: CodegenFramework | undefined;
  if (Object.entries(configIn).length === 0) {
    newFramework = await getProjectFramework(rootDir);
  }

  return {
    codegen: {
      ...validatedConfig.codegen,
      framework: newFramework ? newFramework : validatedConfig.codegen.framework,
    },
    paths: {
      contracts: path.resolve(rootDir, validatedConfig.paths.contracts),
      generated: path.resolve(rootDir, validatedConfig.paths.generated),
    },
  };
};

export const loadProjectConfig = async (rootDir: string): Promise<ProjectConfig> => {
  const explorer = cosmiconfig('one', { stopDir: rootDir });

  const result = await explorer.search(rootDir);

  return validateConfig(rootDir, result === null ? {} : result.config);
};

// tslint:disable-next-line: no-any
const getPkgDependencies = (pkg: any): Set<string> => {
  const dependencies = pkg.dependencies === undefined ? [] : Object.keys(pkg.dependencies);
  const devDependencies = pkg.devDependencies === undefined ? [] : Object.keys(pkg.devDependencies);

  return new Set(dependencies.concat(devDependencies));
};

const getProjectFramework = async (rootDir: string): Promise<CodegenFramework> => {
  const pkgPath = path.resolve(rootDir, 'package.json');
  const pkgExists = await fs.pathExists(pkgPath);
  if (!pkgExists) {
    return 'none';
  }
  const pkg = await fs.readJSON(path.resolve(rootDir, 'package.json'));
  const dependencies = getPkgDependencies(pkg);

  if (dependencies.has('react') || dependencies.has('react-dom')) {
    return 'react';
  }

  if (dependencies.has('@angular/core') || dependencies.has('@angular/cli')) {
    return 'angular';
  }

  if (dependencies.has('vue') || dependencies.has('@vue/cli-service')) {
    return 'vue';
  }

  return 'none';
};
