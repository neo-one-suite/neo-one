import { Configuration } from '@neo-one/cli-common';
import { Contracts, scan } from '@neo-one/smart-contract-compiler';
import { createCompilerHost } from '@neo-one/smart-contract-compiler-node';

export const findContracts = async (config: Configuration): Promise<Contracts> =>
  scan(config.contracts.path, createCompilerHost());
