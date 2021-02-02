import { ContractManifestClient } from '@neo-one/client-common';
import { genSmartContractBase } from './genSmartContractBase';
import { getSmartContractName } from './getSmartContractName';

export const genSmartContract = (name: string, manifest: ContractManifestClient): string =>
  genSmartContractBase(name, getSmartContractName(name), manifest);
