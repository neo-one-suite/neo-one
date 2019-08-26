import { ABI } from '@neo-one/client-common';
import { genSmartContractBase } from './genSmartContractBase';
import { getMigrationSmartContractName } from './getMigrationSmartContractName';

export const genMigrationSmartContract = (name: string, abi: ABI): string =>
  genSmartContractBase(name, getMigrationSmartContractName(name), abi, true);
