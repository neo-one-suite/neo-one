import { genCommonFiles, NetworkDefinition } from '@neo-one/smart-contract-codegen';
import fs from 'fs-extra';
import { ProjectConfig } from '../types';
import { ContractResult } from './compileContract';
import { getCommonPaths, getContractPaths } from './paths';

export type CommonCodeContract = ContractResult & {
  readonly addresses: ReadonlyArray<string>;
};

export const generateCommonCode = async (
  project: ProjectConfig,
  contracts: ReadonlyArray<CommonCodeContract>,
  devNetworkName: string,
  masterPrivateKey: string,
  networks: ReadonlyArray<NetworkDefinition>,
) => {
  const contractsPaths = contracts.map(({ name, filePath, sourceMap, addresses }) => ({
    ...getContractPaths(project, { name, filePath }),
    sourceMap,
    name,
    addresses,
    contractPath: filePath,
  }));
  const { sourceMapsPath, testPath, commonTypesPath, reactPath, clientPath, generatedPath } = getCommonPaths(project);
  const { sourceMaps, test, commonTypes, react, client, generated } = genCommonFiles({
    contractsPaths,
    testPath,
    commonTypesPath,
    reactPath,
    clientPath,
    generatedPath,
    devNetworkName,
    masterPrivateKey,
    networks,
  });

  await fs.ensureDir(project.paths.generated);
  await Promise.all([
    fs.writeFile(sourceMapsPath, sourceMaps),
    fs.writeFile(testPath, test),
    fs.writeFile(commonTypesPath, commonTypes),
    fs.writeFile(reactPath, react),
    fs.writeFile(clientPath, client),
    fs.writeFile(generatedPath, generated),
  ]);
};
