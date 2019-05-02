import { SourceMaps } from '@neo-one/client-common';
import { genAngular } from './angular';
import { genClient, NetworkDefinition, Wallet } from './client';
import { genCommonTypes } from './commonTypes';
import { formatFile } from './formatFile';
import { genGenerated } from './generated';
import { genProjectID } from './projectID';
import { genReact } from './react';
import { genSourceMaps } from './sourceMaps';
import { genTest } from './test';
import { CodegenFramework, ContractPaths, FileResult } from './type';
import { genVue } from './vue';

export interface CommonFilesResult {
  readonly test: FileResult;
  readonly commonTypes: FileResult;
  readonly sourceMaps: FileResult;
  readonly react: FileResult;
  readonly angular: FileResult;
  readonly vue: FileResult;
  readonly client: FileResult;
  readonly generated: FileResult;
  readonly projectID: FileResult;
}

export const genCommonFiles = ({
  contractsPaths,
  projectID,
  testPath,
  commonTypesPath,
  reactPath,
  angularPath,
  vuePath,
  clientPath,
  generatedPath,
  projectIDPath,
  localDevNetworkName,
  wallets,
  networks,
  httpServerPort,
  sourceMapsPath,
  sourceMaps,
  framework,
  browser,
}: {
  readonly contractsPaths: readonly ContractPaths[];
  readonly projectID: string;
  readonly testPath: string;
  readonly commonTypesPath: string;
  readonly reactPath: string;
  readonly angularPath: string;
  readonly vuePath: string;
  readonly clientPath: string;
  readonly generatedPath: string;
  readonly projectIDPath: string;
  readonly localDevNetworkName: string;
  readonly wallets: readonly Wallet[];
  readonly networks: readonly NetworkDefinition[];
  readonly httpServerPort: number;
  readonly sourceMapsPath: string;
  readonly sourceMaps: SourceMaps;
  readonly framework: CodegenFramework;
  readonly browser: boolean;
}): CommonFilesResult => {
  const testFile = formatFile(genTest({ contractsPaths, testPath, commonTypesPath }));
  const commonTypesFile = formatFile(genCommonTypes({ contractsPaths, commonTypesPath }));
  const sourceMapsFile = formatFile(
    genSourceMaps({ httpServerPort, sourceMapsPath, projectIDPath, sourceMaps, browser }),
  );
  const reactFile = formatFile(genReact({ contractsPaths, reactPath, commonTypesPath, clientPath, browser }));
  const angularFile = formatFile(genAngular({ contractsPaths, angularPath, commonTypesPath, clientPath, browser }));
  const vueFile = formatFile(genVue({ contractsPaths, vuePath, commonTypesPath, clientPath, browser }));
  const clientFile = formatFile(
    genClient({ localDevNetworkName, wallets, networks, clientPath, projectIDPath, httpServerPort, browser }),
  );
  const generatedFile = formatFile(
    genGenerated({
      contractsPaths,
      commonTypesPath,
      reactPath,
      angularPath,
      vuePath,
      clientPath,
      generatedPath,
      framework,
    }),
  );
  const projectIDFile = formatFile(genProjectID({ projectID }));

  return {
    test: testFile,
    commonTypes: commonTypesFile,
    sourceMaps: sourceMapsFile,
    react: reactFile,
    angular: angularFile,
    vue: vueFile,
    client: clientFile,
    generated: generatedFile,
    projectID: projectIDFile,
  };
};
