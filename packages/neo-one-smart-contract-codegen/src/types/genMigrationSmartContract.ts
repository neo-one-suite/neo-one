import { ABI } from '@neo-one/client-common';
import { getMigrationSmartContractName } from './getMigrationSmartContractName';
import { genSmartContractBase } from './getSmartContractBase';

export const genMigrationSmartContract = (name: string, abi: ABI): string =>
  genSmartContractBase(name, getMigrationSmartContractName(name), abi, true);
