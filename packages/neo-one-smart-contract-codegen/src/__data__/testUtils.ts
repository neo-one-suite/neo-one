import { ContractManifestClient } from '@neo-one/client-common';
import { genSmartContractTypes } from '../types';

const testContractManifestClient = (manifest: ContractManifestClient, name: string) => {
  test(name, () => {
    expect({
      inputManifest: manifest,
      types: genSmartContractTypes(name, manifest),
    }).toMatchSnapshot();
  });
};

export const testUtils = {
  testContractManifestClient,
};
