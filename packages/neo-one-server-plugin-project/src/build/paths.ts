import * as path from 'path';
import { ProjectConfig } from '../types';

export const getCommonPaths = (project: ProjectConfig) => ({
  sourceMapsPath: path.resolve(project.paths.generated, 'sourceMaps.ts'),
  testPath: path.resolve(project.paths.generated, 'test.ts'),
  commonTypesPath: path.resolve(project.paths.generated, 'types.ts'),
  reactPath: path.resolve(project.paths.generated, 'react.tsx'),
  clientPath: path.resolve(project.paths.generated, 'client.ts'),
  generatedPath: path.resolve(project.paths.generated, 'index.ts'),
});

export const getContractPaths = (
  project: ProjectConfig,
  contractResult: {
    readonly filePath: string;
    readonly name: string;
  },
) => {
  const base = path.resolve(project.paths.generated, contractResult.name);
  const typesPath = path.resolve(base, 'types.ts');
  const abiPath = path.resolve(base, 'abi.ts');
  const createContractPath = path.resolve(base, 'contract.ts');

  return {
    typesPath,
    abiPath,
    createContractPath,
  };
};
