/* @hash d3ac2bd004d3ab370f9268e69ce113f6 */
// tslint:disable
/* eslint-disable */
import { TestOptions, WithContractsOptions } from '@neo-one/smart-contract-test';
import { Contracts } from './contracts';

export const withContracts: (
  test: (contracts: Contracts & TestOptions) => Promise<void>,
  options?: WithContractsOptions,
) => Promise<void>;
