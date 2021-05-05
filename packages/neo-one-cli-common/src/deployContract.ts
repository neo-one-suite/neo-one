import { AddressString, common, ContractManifestClient, SourceMaps, UInt160 } from '@neo-one/client-common';
import { NEOONEDataProvider } from '@neo-one/client-core';
import { ContractRegister } from '@neo-one/client-full-core';
import { constants } from '@neo-one/utils';
import { BigNumber } from 'bignumber.js';
import { getClients } from './getClients';

export const deployContract = async (
  provider: NEOONEDataProvider,
  contract: ContractRegister,
  contractHash: UInt160,
  manifest: ContractManifestClient,
  sourceMaps: SourceMaps,
  masterPrivateKey: string = constants.PRIVATE_NET_PRIVATE_KEY,
): Promise<AddressString> => {
  const { client, developerClient, masterWallet } = await getClients(provider, masterPrivateKey);

  try {
    const existing = await client.read(provider.network).getContract(common.uInt160ToString(contractHash));

    return common.uInt160ToString(existing.hash);
  } catch {
    // do nothing
  }

  const result = await client.publishAndDeploy(
    contract,
    manifest,
    [masterWallet.userAccount.id.address],
    { maxSystemFee: new BigNumber(-1), maxNetworkFee: new BigNumber(-1) },
    sourceMaps,
  );
  const [receipt] = await Promise.all([result.confirmed(), developerClient.runConsensusNow()]);

  if (receipt.result.state === 'FAULT') {
    throw new Error(receipt.result.message);
  }

  return common.uInt160ToString(receipt.result.value.hash);
};
