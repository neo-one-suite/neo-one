import { Contracts, scan } from '@neo-one/smart-contract-compiler';
import { createCompilerHost } from '@neo-one/smart-contract-compiler-node';

export const findContracts = async (path: string): Promise<Contracts> => scan(path, createCompilerHost());
