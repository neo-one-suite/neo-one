import { common, crypto } from '@neo-one/client-common';
import { AddressString, NEOONEDataProvider, SourceMaps } from '@neo-one/client-full';
import { CompileContractResult } from '@neo-one/smart-contract-compiler';
import BigNumber from 'bignumber.js';
import { constants } from './constants';
import { getClients } from './getClients';

export const deployContract = async (
  provider: NEOONEDataProvider,
  contract: CompileContractResult['contract'],
  abi: CompileContractResult['abi'],
  sourceMaps: Promise<SourceMaps>,
  masterPrivateKey: string = constants.PRIVATE_NET_PRIVATE_KEY,
): Promise<AddressString> => {
  const { client, developerClient } = await getClients(provider, masterPrivateKey);

  const hash = crypto.toScriptHash(Buffer.from(contract.script, 'hex'));
  try {
    const existing = await client.read(provider.network).getContract(common.uInt160ToString(hash));

    return existing.address;
  } catch {
    // do nothing
  }

  const result = await client.publishAndDeploy(contract, abi, [], { systemFee: new BigNumber(-1) }, sourceMaps);
  const [receipt] = await Promise.all([result.confirmed(), developerClient.runConsensusNow()]);

  if (receipt.result.state === 'FAULT') {
    throw new Error(receipt.result.message);
  }

  return receipt.result.value.address;
};
