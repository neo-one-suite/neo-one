import {
  ABI,
  Client,
  ContractRegister,
  DeveloperClient,
  LocalKeyStore,
  LocalMemoryStore,
  LocalUserAccountProvider,
  NEOONEProvider,
  SmartContract,
  UserAccountID,
} from '@neo-one/client';
import ts from 'typescript';
import { CompileContractResult } from '../compileContract';

import { throwOnDiagnosticErrorOrWarning } from '../utils';
import { createNode } from './createNode';

export async function testNodeSetup() {
  const { privateKey, rpcURL } = await createNode();
  const networkName = 'priv';
  const masterWalletName = 'master';

  const keystore = new LocalKeyStore({
    store: new LocalMemoryStore(),
  });

  const masterWallet = await keystore.addAccount({
    network: networkName,
    name: masterWalletName,
    privateKey,
  });

  const provider = new NEOONEProvider([{ network: networkName, rpcURL }]);

  const localUserAccountProvider = new LocalUserAccountProvider({
    keystore,
    provider,
  });
  const userAccountProviders = {
    memory: localUserAccountProvider,
  };
  const client = new Client(userAccountProviders);

  return { client, masterWallet, networkName, provider, keystore, privateKey, userAccountProviders };
}

export interface TestOptions extends CompileContractResult {
  readonly abi: ABI;
  readonly diagnostics: ReadonlyArray<ts.Diagnostic>;
  readonly contract: ContractRegister;
  readonly ignoreWarnings?: boolean;
}

export interface Result {
  readonly networkName: string;
  readonly client: Client<{
    readonly memory: LocalUserAccountProvider<LocalKeyStore, NEOONEProvider>;
  }>;
  readonly keystore: LocalKeyStore;
  readonly developerClient: DeveloperClient;
  readonly smartContract: SmartContract;
  readonly masterAccountID: UserAccountID;
  readonly masterPrivateKey: string;
}

export const setupTest = async (getContract: () => Promise<TestOptions>): Promise<Result> => {
  const [
    { client, masterWallet, provider, networkName, keystore, privateKey },
    { contract, sourceMap, diagnostics, abi, ignoreWarnings },
  ] = await Promise.all([testNodeSetup(), getContract()]);

  const developerClient = new DeveloperClient(provider.read(networkName));

  throwOnDiagnosticErrorOrWarning(diagnostics, ignoreWarnings);

  const result = await client.publish(contract);

  const [receipt] = await Promise.all([result.confirmed({ timeoutMS: 2500 }), developerClient.runConsensusNow()]);
  if (receipt.result.state === 'FAULT') {
    throw new Error(receipt.result.message);
  }

  const smartContract = client.smartContract({
    networks: { [networkName]: { hash: receipt.result.value.hash } },
    abi,
    sourceMap,
  });

  return {
    networkName,
    client,
    keystore,
    developerClient,
    smartContract,
    masterAccountID: masterWallet.account.id,
    masterPrivateKey: privateKey,
  };
};
