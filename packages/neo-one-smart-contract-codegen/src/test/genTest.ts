import * as path from 'path';
import { ContractPaths } from '../type';
import { getRelativeImport, normalizePath } from '../utils';

export const genTest = ({
  contractsPaths,
  testPath,
  commonTypesPath,
  mod = '@neo-one/smart-contract-test',
}: {
  readonly contractsPaths: ReadonlyArray<ContractPaths>;
  readonly testPath: string;
  readonly commonTypesPath: string;
  readonly mod?: string;
}) => ({
  js: `
import { createWithContracts } from '${mod}';
import * as path from 'path';

export const withContracts = createWithContracts([
  ${contractsPaths
    .map(
      ({ name, contractPath }) =>
        `{ name: '${name}', filePath: path.resolve(__dirname, '${normalizePath(
          path.relative(testPath, contractPath),
        )}') }`,
    )
    .join(', ')}
]);
`,
  ts: `
import { TestOptions, WithContractsOptions } from '${mod}';
import { Contracts } from '${getRelativeImport(testPath, commonTypesPath)}';

export const withContracts: (
  test: (contracts: Contracts & TestOptions) => Promise<void>,
  options?: WithContractsOptions,
) => Promise<void>;
`,
});
