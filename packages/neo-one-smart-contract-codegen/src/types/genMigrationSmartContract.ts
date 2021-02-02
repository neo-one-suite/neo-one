import { ContractManifestClient } from '@neo-one/client-common';
import { genSmartContractBase } from './genSmartContractBase';
import { getMigrationSmartContractName } from './getMigrationSmartContractName';

export const genMigrationSmartContract = (name: string, manifest: ContractManifestClient): string =>
  genSmartContractBase(name, getMigrationSmartContractName(name), manifest, true);
