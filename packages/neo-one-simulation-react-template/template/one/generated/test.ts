/* @hash ac02f9839240fc891467b3665fa5443b */
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
    [{ name: 'Contract', filePath: path.resolve(__dirname, '../contracts/Contract.ts') }],
    test,
    options,
  );
