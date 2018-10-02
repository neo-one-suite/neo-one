import { Contracts, scan } from '@neo-one/smart-contract-compiler';
import { createCompilerHost } from '../createCompilerHost';
import { FileSystem } from '../filesystem';
import { CONTRACTS_PATH } from '../utils';

export const findContracts = async (fs: FileSystem): Promise<Contracts> =>
  scan(CONTRACTS_PATH, createCompilerHost({ fs }));
