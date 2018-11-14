import { SourceMaps } from '@neo-one/client-common';
import { genCommonFiles, NetworkDefinition, Wallet } from '@neo-one/smart-contract-codegen';
import * as fs from 'fs-extra';
import { CodegenLanguage, ProjectConfig, CodegenFrameworks } from '../types';
import { getCommonPaths, getContractPaths, getTSPath } from '../utils';
import { ContractResult } from './compileContract';
import { writeFile } from './writeFile';

export type CommonCodeContract = ContractResult & {
  readonly addresses: ReadonlyArray<string>;
};

export const generateCommonCode = async (
  project: ProjectConfig,
  projectID: string,
  contracts: ReadonlyArray<CommonCodeContract>,
  localDevNetworkName: string,
  wallets: ReadonlyArray<Wallet>,
  networks: ReadonlyArray<NetworkDefinition>,
  httpServerPort: number,
  sourceMapsIn: SourceMaps,
) => {
  const contractsPaths = contracts.map(({ name, filePath, sourceMap, addresses }) => ({
    ...getContractPaths(project, { name, filePath }),
    sourceMap,
    name,
    addresses,
    contractPath: filePath,
  }));
  const {
    sourceMapsPath,
    testPath,
    commonTypesPath,
    reactPath,
    clientPath,
    generatedPath,
    projectIDPath,
  } = getCommonPaths(project);
  const { sourceMaps, test, commonTypes, react, client, generated, projectID: projectIDFile } = genCommonFiles({
    contractsPaths,
    testPath,
    commonTypesPath,
    reactPath,
    clientPath,
    generatedPath,
    localDevNetworkName,
    wallets,
    networks,
    httpServerPort,
    projectID,
    projectIDPath,
    sourceMapsPath,
    sourceMaps: sourceMapsIn,
  });

  await fs.ensureDir(project.paths.generated);
  if (project.codegen.language == CodegenLanguage.TypeScript) {
    await Promise.all([
      writeFile(getTSPath(sourceMapsPath), sourceMaps.ts),
      writeFile(getTSPath(testPath), test.ts),
      writeFile(getTSPath(reactPath), react.ts),
      writeFile(getTSPath(clientPath), client.ts),
      writeFile(getTSPath(generatedPath), generated.ts),
      writeFile(getTSPath(projectIDPath), projectIDFile.ts),
      writeFile(getTSPath(commonTypesPath), commonTypes.ts),
    ]);
  } else {
    await Promise.all([
      writeFile(sourceMapsPath, sourceMaps.js),
      writeFile(testPath, test.js),
      writeFile(reactPath, react.js),
      writeFile(clientPath, client.js),
      writeFile(generatedPath, generated.js),
      writeFile(projectIDPath, projectIDFile.js),
    ]);
  }
};
