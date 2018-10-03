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
import { withContracts as withContractsBase } from '${mod}';
import * as path from 'path';

export const withContracts = async (test, options) =>
  withContractsBase(
    [${contractsPaths
      .map(
        ({ name, contractPath }) =>
          `{ name: '${name}', filePath: path.resolve(__dirname, '${normalizePath(
            path.relative(path.dirname(testPath), contractPath),
          )}') }`,
      )
      .join(', ')}],
    test,
    options,
  );
`,
  ts: `
import { TestOptions, withContracts as withContractsBase, WithContractsOptions } from '${mod}';
import * as path from 'path';
import { Contracts } from '${getRelativeImport(testPath, commonTypesPath)}';

export const withContracts = async (
  test: (contracts: Contracts & TestOptions) => Promise<void>,
  options?: WithContractsOptions,
): Promise<void> =>
  withContractsBase<Contracts>(
    [${contractsPaths
      .map(
        ({ name, contractPath }) =>
          `{ name: '${name}', filePath: path.resolve(__dirname, '${normalizePath(
            path.relative(path.dirname(testPath), contractPath),
          )}') }`,
      )
      .join(', ')}],
    test,
    options,
  );
`,
});
