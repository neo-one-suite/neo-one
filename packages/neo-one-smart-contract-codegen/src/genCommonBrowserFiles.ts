import { CodegenFramework } from '@neo-one/cli-common';
import { SourceMaps } from '@neo-one/client-common';
import { genAngular } from './angular';
import { genBrowserClient, NetworkDefinition, Wallet } from './client';
import { genCommonTypes } from './commonTypes';
import { formatFile } from './formatFile';
import { genGenerated } from './generated';
import { genReact } from './react';
import { genSourceMaps } from './sourceMaps';
import { genTest } from './test';
import { ContractPaths, FileResult } from './type';
import { genVue } from './vue';

export interface CommonBrowserFilesResult {
  readonly test: FileResult;
  readonly commonTypes: FileResult;
  readonly sourceMaps: FileResult;
  readonly react: FileResult;
  readonly angular: FileResult;
  readonly vue: FileResult;
  readonly client: FileResult;
  readonly generated: FileResult;
}

export const genCommonBrowserFiles = ({
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
  wallets,
  networks,
  sourceMaps,
  framework,
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
  readonly wallets: ReadonlyArray<Wallet>;
  readonly networks: ReadonlyArray<NetworkDefinition>;
  readonly sourceMapsPath: string;
  readonly sourceMaps: SourceMaps;
  readonly framework: CodegenFramework;
}): CommonBrowserFilesResult => {
  const testFile = formatFile(
    genTest({ contractsPaths, testPath, commonTypesPath, mod: '@neo-one/smart-contract-test-browser' }),
    false,
  );
  const commonTypesFile = formatFile(genCommonTypes({ contractsPaths, commonTypesPath }), false);
  const sourceMapsFile = formatFile(genSourceMaps({ sourceMapsPath, sourceMaps }), false);
  const reactFile = formatFile(genReact({ contractsPaths, reactPath, commonTypesPath, clientPath }), false);
  const angularFile = formatFile(genAngular({ contractsPaths, angularPath, commonTypesPath, clientPath }), false);
  const vueFile = formatFile(genVue({ contractsPaths, vuePath, commonTypesPath, clientPath }), false);
  const clientFile = formatFile(genBrowserClient({ localDevNetworkName, wallets, networks }), false);
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
    false,
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
