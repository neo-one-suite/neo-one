import * as path from 'path';
import { ProjectConfig } from '../types';

export const getCommonPaths = (project: ProjectConfig) => ({
  sourceMapsPath: path.resolve(project.paths.generated, 'sourceMaps.js'),
  testPath: path.resolve(project.paths.generated, 'test.js'),
  commonTypesPath: path.resolve(project.paths.generated, 'types.js'),
  reactPath: path.resolve(project.paths.generated, 'react.jsx'),
  clientPath: path.resolve(project.paths.generated, 'client.js'),
  generatedPath: path.resolve(project.paths.generated, 'index.js'),
});

export const getContractPaths = (
  project: ProjectConfig,
  contractResult: {
    readonly filePath: string;
    readonly name: string;
  },
) => {
  const base = path.resolve(project.paths.generated, contractResult.name);
  const typesPath = path.resolve(base, 'types.js');
  const abiPath = path.resolve(base, 'abi.js');
  const createContractPath = path.resolve(base, 'contract.js');

  return {
    typesPath,
    abiPath,
    createContractPath,
  };
};

export const getTSPath = (filePath: string) =>
  path.resolve(
    path.dirname(filePath),
    `${path.basename(filePath, filePath.endsWith('.jsx') ? '.jsx' : '.js')}${
      filePath.endsWith('.jsx') ? '.tsx' : '.ts'
    }`,
  );
