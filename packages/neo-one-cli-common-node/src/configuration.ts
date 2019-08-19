import { CodegenFramework, Configuration } from '@neo-one/utils';
import convict from 'convict';
import cosmiconfig from 'cosmiconfig';
import * as fs from 'fs-extra';
import * as nodePath from 'path';

export const configurationSchema = {
  contracts: {
    path: {
      format: String,
      default: nodePath.join('contracts'),
    },
  },
  codegen: {
    path: {
      format: String,
      default: nodePath.join('src', 'neo-one'),
    },
    language: {
      format: ['typescript', 'javascript'],
      default: 'typescript',
    },
    framework: {
      format: ['none', 'react', 'angular', 'vue'],
      default: 'none',
    },
    browserify: {
      format: Boolean,
      default: false,
    },
  },
  network: {
    path: {
      format: String,
      default: nodePath.join('.neo-one', 'node'),
    },
    port: {
      format: Number,
      default: 9040,
    },
  },
  neotracker: {
    path: {
      format: String,
      default: nodePath.join('.neo-one', 'neotracker'),
    },
    port: {
      format: Number,
      default: 9041,
    },
  },
} as const;

// tslint:disable-next-line: no-any
const getPkgDependencies = (pkg: any): Set<string> => {
  const dependencies = pkg.dependencies === undefined ? [] : Object.keys(pkg.dependencies);
  const devDependencies = pkg.devDependencies === undefined ? [] : Object.keys(pkg.devDependencies);

  return new Set(dependencies.concat(devDependencies));
};

const getProjectFramework = async (rootDir: string): Promise<CodegenFramework> => {
  // tslint:disable-next-line no-any
  let pkg: any;
  try {
    pkg = fs.readFile(nodePath.resolve(rootDir, 'package.json'), 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      return 'none';
    }

    throw err;
  }
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

const validateConfig = async (rootDir: string, configIn: cosmiconfig.Config): Promise<Configuration> => {
  const validator = convict<Configuration>(configurationSchema);
  validator.load(configIn);
  validator.validate({ allowed: 'warn' });

  const config = validator.getProperties();

  let newFramework: CodegenFramework | undefined;
  if (Object.keys(configIn).length === 0) {
    newFramework = await getProjectFramework(rootDir);
  }

  return {
    contracts: {
      ...config.contracts,
      path: nodePath.resolve(rootDir, config.contracts.path),
    },
    codegen: {
      ...config.codegen,
      path: nodePath.resolve(rootDir, config.codegen.path),
      framework: newFramework === undefined ? config.codegen.framework : newFramework,
    },
    network: {
      ...config.network,
      path: nodePath.resolve(rootDir, config.network.path),
    },
    neotracker: {
      ...config.neotracker,
      path: nodePath.resolve(rootDir, config.neotracker.path),
    },
  };
};

export const loadConfiguration = async (): Promise<Configuration> => {
  const explorer = cosmiconfig('neo-one');
  const result = await explorer.search();

  return validateConfig(
    result === null ? process.cwd() : nodePath.dirname(result.filepath),
    result === null ? {} : result.config,
  );
};
