import { CodegenFramework } from '@neo-one/cli-common';
import { SourceMaps } from '@neo-one/client-common';
import { genAngular } from './angular';
import { genBrowserClient, NetworkDefinition, Wallet } from './client';
import { genContracts } from './contracts';
import { formatFile } from './formatFile';
import { genGenerated } from './generated';
import { genReact } from './react';
import { genSourceMaps } from './sourceMaps';
import { genTest } from './test';
import { ContractPaths, FileResult } from './type';
import { genVue } from './vue';

export interface CommonBrowserFilesResult {
  readonly test: FileResult;
  readonly contracts: FileResult;
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
  contractsPath,
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
  readonly contractsPath: string;
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
    genTest({ contractsPaths, testPath, contractsPath, mod: '@neo-one/smart-contract-test-browser' }),
    false,
  );
  const contractsFile = formatFile(genContracts({ contractsPaths, contractsPath }), false);
  const sourceMapsFile = formatFile(genSourceMaps({ sourceMapsPath, sourceMaps }), false);
  const reactFile = formatFile(genReact({ contractsPaths, reactPath, contractsPath, clientPath }), false);
  const angularFile = formatFile(genAngular({ contractsPaths, angularPath, contractsPath, clientPath }), false);
  const vueFile = formatFile(genVue({ contractsPaths, vuePath, contractsPath, clientPath }), false);
  const clientFile = formatFile(genBrowserClient({ localDevNetworkName, wallets, networks }), false);
  const generatedFile = formatFile(
    genGenerated({
      contractsPaths,
      contractsPath,
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
    contracts: contractsFile,
    sourceMaps: sourceMapsFile,
    react: reactFile,
    angular: angularFile,
    vue: vueFile,
    client: clientFile,
    generated: generatedFile,
  };
};
