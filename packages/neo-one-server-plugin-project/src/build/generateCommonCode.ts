import { genCommonFiles } from '@neo-one/smart-contract-codegen';
import fs from 'fs-extra';
import * as path from 'path';
import { ProjectConfig } from '../types';
import { ContractResult } from './compileContract';

export type CommonCodeContract = ContractResult & {
  readonly addresses: ReadonlyArray<string>;
};

export const generateCommonCode = async (project: ProjectConfig, contracts: ReadonlyArray<CommonCodeContract>) => {
  const contractsPaths = contracts.map(({ name, filePath, sourceMap, addresses }) => ({
    sourceMap,
    name,
    addresses,
    contractPath: filePath,
    typesPath: path.resolve(project.paths.generated, name, 'types.ts'),
    createContractPath: path.resolve(project.paths.generated, name, 'contract.ts'),
  }));
  const testPath = path.resolve(project.paths.generated, 'test.ts');
  const commonTypesPath = path.resolve(project.paths.generated, 'types.ts');
  const sourceMapsPath = path.resolve(project.paths.generated, 'sourceMaps.ts');
  const reactPath = path.resolve(project.paths.generated, 'react.tsx');
  const { test, react, commonTypes, sourceMaps } = genCommonFiles({
    contractsPaths,
    testPath,
    commonTypesPath,
    reactPath,
  });

  await fs.ensureDir(project.paths.generated);
  await Promise.all([
    fs.writeFile(testPath, test),
    fs.writeFile(commonTypesPath, commonTypes),
    fs.writeFile(sourceMapsPath, sourceMaps),
    fs.writeFile(reactPath, react),
  ]);
};
