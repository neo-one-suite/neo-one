import { genCommonTypes } from './commonTypes';
import { formatFile } from './formatFile';
import { genReact } from './react';
import { genSourceMaps } from './sourceMaps';
import { genTest } from './test';
import { ContractPaths } from './type';

export interface CommonFilesResult {
  readonly test: string;
  readonly commonTypes: string;
  readonly sourceMaps: string;
  readonly react: string;
}

export const genCommonFiles = ({
  contractsPaths,
  testPath,
  commonTypesPath,
  reactPath,
}: {
  readonly contractsPaths: ReadonlyArray<ContractPaths>;
  readonly testPath: string;
  readonly commonTypesPath: string;
  readonly reactPath: string;
}) => {
  const testFile = formatFile(genTest({ contractsPaths, testPath, commonTypesPath }));
  const commonTypesFile = formatFile(genCommonTypes({ contractsPaths, commonTypesPath }));
  const sourceMapsFile = formatFile(genSourceMaps({ contractsPaths }));
  const reactFile = formatFile(genReact({ contractsPaths, reactPath, commonTypesPath }));

  return {
    test: testFile,
    commonTypes: commonTypesFile,
    sourceMaps: sourceMapsFile,
    react: reactFile,
  };
};
