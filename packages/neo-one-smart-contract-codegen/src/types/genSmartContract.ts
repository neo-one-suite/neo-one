import { ABI } from '@neo-one/client-common';
import { genSmartContractBase } from './getSmartContractBase';
import { getSmartContractName } from './getSmartContractName';

export const genSmartContract = (name: string, abi: ABI): string =>
  genSmartContractBase(name, getSmartContractName(name), abi);
