/* @hash 816917fb6584e4ed8ab33801bbd6d200 */
// tslint:disable
/* eslint-disable */
import { TestOptions, withContracts as withContractsBase, WithContractsOptions } from '@neo-one/smart-contract-test';
import * as path from 'path';
import { Contracts } from './types';

export const withContracts = async (
  test: (contracts: Contracts & TestOptions) => Promise<void>,
  options?: WithContractsOptions,
): Promise<void> =>
  withContractsBase<Contracts>(
    [
      { name: 'Escrow', filePath: path.resolve(__dirname, '../contracts/Escrow.ts') },
      { name: 'Token', filePath: path.resolve(__dirname, '../contracts/Token.ts') },
      { name: 'ICO', filePath: path.resolve(__dirname, '../contracts/ICO.ts') },
    ],
    test,
    options,
  );
