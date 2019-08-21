// tslint:disable no-any
import { CodegenFramework, Configuration } from '@neo-one/client-common';
import convict from 'convict';
import cosmiconfig from 'cosmiconfig';
import * as fs from 'fs-extra';
import _ from 'lodash';
import * as nodePath from 'path';
import { register } from 'ts-node';
import { defaultNetworks } from './networks';

const checkNetworksValue = (val: any) => {
  if (typeof val !== 'object') {
    throw new Error('value must be an object');
  }

  if (typeof val.userAccountProvider !== 'function') {
    throw new Error('userAccountProvider must be provided and be an async function');
  }
};

export const configurationSchema = {
  contracts: {
    path: {
      format: String,
      default: 'contracts',
    },
  },
  codegen: {
    path: {
      format: String,
      default: nodePath.join('src', 'neo-one'),
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
      default: nodePath.join('.neo-one', 'network'),
    },
    port: {
      format: Number,
      default: 9040,
    },
  },
  networks: {
    format: (val: any) => {
      if (typeof val !== 'object') {
        throw new Error('must be an object');
      }

      Object.values(val).forEach(checkNetworksValue);
    },
    default: defaultNetworks,
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

const relativizePaths = (config: Configuration) => ({
  ...config,
  contracts: {
    ...config.contracts,
    path: nodePath.relative(process.cwd(), config.contracts.path),
  },
  codegen: {
    ...config.codegen,
    path: nodePath.relative(process.cwd(), config.codegen.path),
  },
  network: {
    ...config.network,
    path: nodePath.relative(process.cwd(), config.network.path),
  },
  neotracker: {
    ...config.neotracker,
    path: nodePath.relative(process.cwd(), config.neotracker.path),
  },
});

const createDefaultConfiguration = (configIn: Configuration, importDefaultNetworks: string, exportConfig: string) => {
  const config = relativizePaths(configIn);

  return `${importDefaultNetworks}

${exportConfig} {
  contracts: {
    // NEO•ONE will look for smart contracts in this directory.
    path: '${config.contracts.path}',
  },
  codegen: {
    // NEO•ONE will write source artifacts to this directory. This directory should be committed.
    path: '${config.codegen.path}',
    // NEO•ONE will generate client helpers for the framework specified here. Can be one of 'react', 'angular', 'vue' or 'none'.
    framework: '${config.codegen.framework}',
    // Set this to true if you're using an environment like Expo that doesn't handle browserifying dependencies automatically.
    browserify: ${config.codegen.browserify},
  },
  network: {
    // NEO•ONE will store network data here. This path should be ignored by your vcs, e.g. by specifiying it in a .gitignore file.
    path: '${config.network.path}',
    // NEO•ONE will start the network on this port.
    port: ${config.network.port},
  },
  // NEO•ONE will configure various parts of the CLI that require network accounts using the value provided here, for example, when deploying contracts.
  // Refer to the documentation at https://neo-one.io/docs/configuration for more information.
  networks: defaultNetworks,
  neotracker: {
    // NEO•ONE will start an instance of NEO tracker using this path for local data. This directory should not be committed.
    path: '${config.neotracker.path}',
    // NEO•ONE will start an instance of NEO tracker using this port.
    port: 9041,
  }
};
`;
};

export const createDefaultConfigurationJavaScript = (config: Configuration) =>
  createDefaultConfiguration(config, "const { defaultNetworks } = require('@neo-one/cli');", 'module.exports =');
export const createDefaultConfigurationTypeScript = (config: Configuration) =>
  createDefaultConfiguration(config, "import { defaultNetworks } from '@neo-one/cli';", 'export default');

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
    pkg = await fs.readFile(nodePath.resolve(rootDir, 'package.json'), 'utf8');
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
    networks: config.networks,
    neotracker: {
      ...config.neotracker,
      path: nodePath.resolve(rootDir, config.neotracker.path),
    },
  };
};

// tslint:disable-next-line no-let
let cachedConfig: Configuration | undefined;

export const loadConfiguration = async (): Promise<Configuration> => {
  if (cachedConfig === undefined) {
    const explorer = cosmiconfig('neo-one', {
      loaders: {
        '.ts': {
          sync: (filePath: string): object => {
            register();
            const obj = require(filePath);

            return obj.default === undefined ? obj : obj.default;
          },
        },
      },
      searchPlaces: ['.neo-one.config.js', '.neo-one.config.ts'],
    });
    const result = await explorer.search();
    cachedConfig = await validateConfig(
      result === null ? process.cwd() : nodePath.dirname(result.filepath),
      result === null ? {} : result.config,
    );
  }

  return cachedConfig;
};

export const configToSerializable = (config: Configuration) => ({
  ...config,
  networks: _.fromPairs(
    Object.entries(config.networks).map(([key, value]) => [
      key,
      {
        ...value,
        userAccountProvider: 'omitted',
      },
    ]),
  ),
});
