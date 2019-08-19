import { Contracts, scan } from '@neo-one/smart-contract-compiler';
import { createCompilerHost } from '@neo-one/smart-contract-compiler-node';
import { Configuration } from '@neo-one/utils';

export const findContracts = async (config: Configuration): Promise<Contracts> =>
  scan(config.contracts.path, createCompilerHost());
