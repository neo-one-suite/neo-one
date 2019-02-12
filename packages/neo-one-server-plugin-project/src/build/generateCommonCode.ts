import { SourceMaps } from '@neo-one/client-common';
import { genCommonFiles, NetworkDefinition, Wallet } from '@neo-one/smart-contract-codegen';
import * as fs from 'fs-extra';
import { ProjectConfig } from '../types';
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
  browser: boolean,
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
    angularPath,
    vuePath,
    clientPath,
    generatedPath,
    projectIDPath,
  } = getCommonPaths(project);
  const {
    sourceMaps,
    test,
    commonTypes,
    react,
    angular,
    vue,
    client,
    generated,
    projectID: projectIDFile,
  } = genCommonFiles({
    contractsPaths,
    testPath,
    commonTypesPath,
    reactPath,
    angularPath,
    vuePath,
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
    framework: project.codegen.framework,
    browser,
  });

  await fs.ensureDir(project.paths.generated);
  await Promise.all(
    [
      {
        path: sourceMapsPath,
        data: sourceMaps,
      },
      {
        path: testPath,
        data: test,
      },
      {
        path: reactPath,
        data: project.codegen.framework === 'react' ? react : undefined,
      },
      {
        path: angularPath,
        data: project.codegen.framework === 'angular' ? angular : undefined,
      },
      {
        path: vuePath,
        data: project.codegen.framework === 'vue' ? vue : undefined,
      },
      {
        path: clientPath,
        data: client,
      },
      {
        path: generatedPath,
        data: generated,
      },
      {
        path: projectIDPath,
        data: projectIDFile,
      },
      {
        path: commonTypesPath,
        data: project.codegen.language === 'typescript' ? commonTypes : undefined,
      },
    ].map(async ({ path, data }) => {
      if (data !== undefined) {
        if (project.codegen.language === 'javascript') {
          await writeFile(path, data.js);
        } else {
          await writeFile(getTSPath(path), data.ts);
        }
      }
    }),
  );
};
