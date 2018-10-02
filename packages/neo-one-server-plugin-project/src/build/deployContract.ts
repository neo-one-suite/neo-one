import { AddressString, NEOONEDataProvider, SourceMaps } from '@neo-one/client-full';
import { deployContract as deployContractBase } from '@neo-one/local';
import { Network } from '@neo-one/server-plugin-network';
import { ContractResult } from './compileContract';

export const deployContract = async (
  network: Network,
  contract: ContractResult,
  sourceMaps: SourceMaps,
  masterPrivateKey: string,
): Promise<AddressString> => {
  const provider = new NEOONEDataProvider({ network: network.name, rpcURL: network.nodes[0].rpcAddress });

  return deployContractBase(provider, contract.contract, contract.abi, Promise.resolve(sourceMaps), masterPrivateKey);
};
