import { genCommonFiles, NetworkDefinition, Wallet } from '@neo-one/smart-contract-codegen';
import fs from 'fs-extra';
import { ProjectConfig } from '../types';
import { getCommonPaths, getContractPaths, getTSPath } from '../utils';
import { ContractResult } from './compileContract';

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
  });

  await fs.ensureDir(project.paths.generated);
  if (project.codegen.javascript) {
    await Promise.all([
      fs.writeFile(sourceMapsPath, sourceMaps.js),
      fs.writeFile(testPath, test.js),
      fs.writeFile(reactPath, react.js),
      fs.writeFile(clientPath, client.js),
      fs.writeFile(generatedPath, generated.js),
      fs.writeFile(projectIDPath, projectIDFile.js),
    ]);
  } else {
    await Promise.all([
      fs.writeFile(getTSPath(sourceMapsPath), sourceMaps.ts),
      fs.writeFile(getTSPath(testPath), test.ts),
      fs.writeFile(getTSPath(reactPath), react.ts),
      fs.writeFile(getTSPath(clientPath), client.ts),
      fs.writeFile(getTSPath(generatedPath), generated.ts),
      fs.writeFile(getTSPath(projectIDPath), projectIDFile.ts),
      fs.writeFile(getTSPath(commonTypesPath), commonTypes.ts),
    ]);
  }
};
