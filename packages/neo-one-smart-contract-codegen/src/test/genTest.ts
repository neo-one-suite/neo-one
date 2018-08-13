import * as path from 'path';
import { getSmartContractName } from '../types';
import { getRelativeImport, normalizePath } from '../utils';
import { getSetupTestName } from './getSetupTestName';

export const genTest = ({
  name,
  contractPath,
  typesPath,
  testPath,
}: {
  readonly name: string;
  readonly contractPath: string;
  readonly typesPath: string;
  readonly testPath: string;
}): string => {
  const relativeTypes = getRelativeImport(testPath, typesPath);
  const smartContract = getSmartContractName(name);

  return `
import { setupContractTest, SetupTestResult } from '@neo-one/smart-contract-test';
import * as path from 'path';
import { ${smartContract} } from '${relativeTypes}';

export const ${getSetupTestName(name)} = async (): Promise<SetupTestResult<${smartContract}>> =>
  setupContractTest<${smartContract}>(
    path.resolve(__dirname, '${normalizePath(path.relative(path.dirname(testPath), contractPath))}'),
    '${name}',
  );
`;
};
