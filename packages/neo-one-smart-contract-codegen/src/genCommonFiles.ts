import { CodegenFramework } from '@neo-one/cli-common';
import { SourceMaps } from '@neo-one/client-common';
import { genAngular } from './angular';
import { genClient, NetworkDefinition, Wallet } from './client';
import { genCommonTypes } from './commonTypes';
import { formatFile } from './formatFile';
import { genGenerated } from './generated';
import { genReact } from './react';
import { genSourceMaps } from './sourceMaps';
import { genTest } from './test';
import { ContractPaths, FileResult } from './type';
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
}

export const genCommonFiles = ({
  contractsPaths,
  testPath,
  commonTypesPath,
  reactPath,
  angularPath,
  vuePath,
  clientPath,
  generatedPath,
  sourceMapsPath,
  localDevNetworkName,
  localDevNetworkPort,
  wallets,
  networks,
  sourceMaps,
  framework,
  browserify,
}: {
  readonly contractsPaths: ReadonlyArray<ContractPaths>;
  readonly testPath: string;
  readonly commonTypesPath: string;
  readonly reactPath: string;
  readonly angularPath: string;
  readonly vuePath: string;
  readonly clientPath: string;
  readonly generatedPath: string;
  readonly localDevNetworkName: string;
  readonly localDevNetworkPort: number;
  readonly wallets: ReadonlyArray<Wallet>;
  readonly networks: ReadonlyArray<NetworkDefinition>;
  readonly sourceMapsPath: string;
  readonly sourceMaps: SourceMaps;
  readonly framework: CodegenFramework;
  readonly browserify: boolean;
}): CommonFilesResult => {
  const testFile = formatFile(genTest({ contractsPaths, testPath, commonTypesPath }), browserify);
  const commonTypesFile = formatFile(genCommonTypes({ contractsPaths, commonTypesPath }), browserify);
  const sourceMapsFile = formatFile(genSourceMaps({ sourceMapsPath, sourceMaps }), browserify);
  const reactFile = formatFile(genReact({ contractsPaths, reactPath, commonTypesPath, clientPath }), browserify);
  const angularFile = formatFile(genAngular({ contractsPaths, angularPath, commonTypesPath, clientPath }), browserify);
  const vueFile = formatFile(genVue({ contractsPaths, vuePath, commonTypesPath, clientPath }), browserify);
  const clientFile = formatFile(genClient({ localDevNetworkName, localDevNetworkPort, wallets, networks }), browserify);
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
    browserify,
  );

  return {
    test: testFile,
    commonTypes: commonTypesFile,
    sourceMaps: sourceMapsFile,
    react: reactFile,
    angular: angularFile,
    vue: vueFile,
    client: clientFile,
    generated: generatedFile,
  };
};
