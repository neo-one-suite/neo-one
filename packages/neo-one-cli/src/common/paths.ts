import { Configuration } from '@neo-one/cli-common';
import * as nodePath from 'path';

export const getCommonPaths = (config: Configuration) => ({
  sourceMapsPath: nodePath.resolve(config.codegen.path, 'sourceMaps.js'),
  testPath: nodePath.resolve(config.codegen.path, 'test.js'),
  contractsPath: nodePath.resolve(config.codegen.path, 'contracts.js'),
  reactPath: nodePath.resolve(config.codegen.path, 'react.jsx'),
  angularPath: nodePath.resolve(config.codegen.path, 'angular.service.js'),
  vuePath: nodePath.resolve(config.codegen.path, 'vue.js'),
  clientPath: nodePath.resolve(config.codegen.path, 'client.js'),
  generatedPath: nodePath.resolve(config.codegen.path, 'index.js'),
});

export const getContractPaths = (config: Configuration, name: string) => {
  const base = nodePath.resolve(config.codegen.path, name);
  const typesPath = nodePath.resolve(base, 'types.js');
  const manifestPath = nodePath.resolve(base, 'manifest.js');
  const createContractPath = nodePath.resolve(base, 'contract.js');

  return {
    typesPath,
    manifestPath,
    createContractPath,
  };
};

export const getTSPath = (filePath: string) =>
  nodePath.resolve(
    nodePath.dirname(filePath),
    `${nodePath.basename(filePath, filePath.endsWith('.jsx') ? '.jsx' : '.js')}${
      filePath.endsWith('.jsx') ? '.tsx' : '.ts'
    }`,
  );
