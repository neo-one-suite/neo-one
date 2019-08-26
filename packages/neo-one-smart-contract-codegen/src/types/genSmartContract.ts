import { ABI } from '@neo-one/client-common';
import { genSmartContractBase } from './genSmartContractBase';
import { getSmartContractName } from './getSmartContractName';

export const genSmartContract = (name: string, abi: ABI): string =>
  genSmartContractBase(name, getSmartContractName(name), abi);
