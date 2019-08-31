import * as path from 'path';
import { ContractPaths } from '../type';
import { getRelativeImport, normalizePath } from '../utils';

export const genTest = ({
  contractsPaths,
  testPath,
  contractsPath,
  mod = '@neo-one/smart-contract-test',
}: {
  readonly contractsPaths: ReadonlyArray<ContractPaths>;
  readonly testPath: string;
  readonly contractsPath: string;
  readonly mod?: string;
}) => {
  const createWithContracts = `createWithContracts([
  ${contractsPaths
    .map(
      ({ name, contractPath }) =>
        `{ name: '${name}', filePath: path.resolve(__dirname, '${normalizePath(
          path.relative(path.dirname(testPath), contractPath),
        )}') }`,
    )
    .join(', ')}
]);`;

  return {
    js: `
import { createWithContracts } from '${mod}';
import * as path from 'path';

export const withContracts = ${createWithContracts}
`,
    ts: `
import { createWithContracts, TestOptions, WithContractsOptions } from '${mod}';
import { Contracts } from '${getRelativeImport(testPath, contractsPath)}';
import * as path from 'path';

export const withContracts: (
  test: (contracts: Contracts & TestOptions) => Promise<void>,
  options?: WithContractsOptions,
) => Promise<void> = ${createWithContracts}
`,
  };
};
