import { Contract, TestOptions, WithContractsOptions } from '@neo-one/smart-contract-test-common';
import { withContracts } from './withContracts';

export const createWithContracts =
  (contracts: ReadonlyArray<Contract>) =>
  async <T>(test: (contracts: T & TestOptions) => Promise<void>, options?: WithContractsOptions): Promise<void> =>
    withContracts(contracts, test, options);
