import { genCommonFiles, NetworkDefinition } from '@neo-one/smart-contract-codegen';
import fs from 'fs-extra';
import { ProjectConfig } from '../types';
import { ContractResult } from './compileContract';
import { getCommonPaths, getContractPaths, getTSPath } from './paths';

export type CommonCodeContract = ContractResult & {
  readonly addresses: ReadonlyArray<string>;
};

export const generateCommonCode = async (
  project: ProjectConfig,
  contracts: ReadonlyArray<CommonCodeContract>,
  devNetworkName: string,
  masterPrivateKey: string,
  networks: ReadonlyArray<NetworkDefinition>,
  javascript: boolean,
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
  if (javascript) {
    await Promise.all([
      fs.writeFile(sourceMapsPath, sourceMaps.js),
      fs.writeFile(testPath, test.js),
      fs.writeFile(reactPath, react.js),
      fs.writeFile(clientPath, client.js),
      fs.writeFile(generatedPath, generated.js),
    ]);
  } else {
    await Promise.all([
      fs.writeFile(getTSPath(sourceMapsPath), sourceMaps.ts),
      fs.writeFile(getTSPath(testPath), test.ts),
      fs.writeFile(getTSPath(reactPath), react.ts),
      fs.writeFile(getTSPath(clientPath), client.ts),
      fs.writeFile(getTSPath(generatedPath), generated.ts),
      fs.writeFile(getTSPath(commonTypesPath), commonTypes.ts),
    ]);
  }
};
