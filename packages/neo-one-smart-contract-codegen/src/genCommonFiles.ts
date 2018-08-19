import { genCommonTypes } from './commonTypes';
import { formatFile } from './formatFile';
import { genSourceMaps } from './sourceMaps';
import { genTest } from './test';
import { ContractPaths } from './type';

export interface CommonFilesResult {
  readonly test: string;
  readonly commonTypes: string;
  readonly sourceMaps: string;
}

export const genCommonFiles = ({
  contractsPaths,
  testPath,
  commonTypesPath,
}: {
  readonly contractsPaths: ReadonlyArray<ContractPaths>;
  readonly testPath: string;
  readonly commonTypesPath: string;
}) => {
  const testFile = formatFile(genTest({ contractsPaths, testPath, commonTypesPath }));
  const commonTypesFile = formatFile(genCommonTypes({ contractsPaths, commonTypesPath }));
  const sourceMapsFile = formatFile(genSourceMaps({ contractsPaths }));

  return {
    test: testFile,
    commonTypes: commonTypesFile,
    sourceMaps: sourceMapsFile,
  };
};
