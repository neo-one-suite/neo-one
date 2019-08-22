/* @hash 4301a15c8eaa3db2edd5ea02b6234983 */
// tslint:disable
/* eslint-disable */
import { TestOptions, WithContractsOptions } from '@neo-one/smart-contract-test';
import { Contracts } from './types';

export const withContracts: (
  test: (contracts: Contracts & TestOptions) => Promise<void>,
  options?: WithContractsOptions,
) => Promise<void>;
