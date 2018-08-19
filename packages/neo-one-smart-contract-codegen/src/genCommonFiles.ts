import { genClient, NetworkDefinition } from './client';
import { genCommonTypes } from './commonTypes';
import { formatFile } from './formatFile';
import { genGenerated } from './generated';
import { genReact } from './react';
import { genSourceMaps } from './sourceMaps';
import { genTest } from './test';
import { ContractPaths, FileResult } from './type';

export interface CommonFilesResult {
  readonly test: FileResult;
  readonly commonTypes: FileResult;
  readonly sourceMaps: FileResult;
  readonly react: FileResult;
  readonly client: FileResult;
  readonly generated: FileResult;
}

export const genCommonFiles = ({
  contractsPaths,
  testPath,
  commonTypesPath,
  reactPath,
  clientPath,
  generatedPath,
  devNetworkName,
  masterPrivateKey,
  networks,
}: {
  readonly contractsPaths: ReadonlyArray<ContractPaths>;
  readonly testPath: string;
  readonly commonTypesPath: string;
  readonly reactPath: string;
  readonly clientPath: string;
  readonly generatedPath: string;
  readonly devNetworkName: string;
  readonly masterPrivateKey: string;
  readonly networks: ReadonlyArray<NetworkDefinition>;
}) => {
  const testFile = formatFile(genTest({ contractsPaths, testPath, commonTypesPath }));
  const commonTypesFile = formatFile(genCommonTypes({ contractsPaths, commonTypesPath }));
  const sourceMapsFile = formatFile(genSourceMaps({ contractsPaths }));
  const reactFile = formatFile(genReact({ contractsPaths, reactPath, commonTypesPath, clientPath }));
  const clientFile = formatFile(genClient({ devNetworkName, masterPrivateKey, networks }));
  const generatedFile = formatFile(
    genGenerated({
      contractsPaths,
      commonTypesPath,
      reactPath,
      clientPath,
      generatedPath,
    }),
  );

  return {
    test: testFile,
    commonTypes: commonTypesFile,
    sourceMaps: sourceMapsFile,
    react: reactFile,
    client: clientFile,
    generated: generatedFile,
  };
};
