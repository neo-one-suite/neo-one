import {
  ABI,
  Client,
  ContractRegister,
  DeveloperClient,
  LocalKeyStore,
  LocalMemoryStore,
  LocalUserAccountProvider,
  NEOONEProvider,
  PublishReceipt,
  SmartContract,
  SmartContractAny,
  TransactionResult,
  UserAccountID,
} from '@neo-one/client';
import { CompileContractResult } from '@neo-one/smart-contract-compiler';
import ts from 'typescript';
import { createNode } from './createNode';

export async function testNodeSetup(omitCleanup = false) {
  const { privateKey, rpcURL, node } = await createNode(omitCleanup);
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

  return { client, masterWallet, networkName, provider, keystore, privateKey, userAccountProviders, node };
}

export interface TestOptions extends CompileContractResult {
  readonly abi: ABI;
  readonly diagnostics: ReadonlyArray<ts.Diagnostic>;
  readonly contract: ContractRegister;
  readonly deploy?: boolean;
}

// tslint:disable-next-line no-any
export interface Result<TSmartContract extends SmartContract<any> = SmartContractAny> {
  readonly networkName: string;
  readonly client: Client<{
    readonly memory: LocalUserAccountProvider<LocalKeyStore, NEOONEProvider>;
  }>;
  readonly developerClient: DeveloperClient;
  readonly smartContract: TSmartContract;
  readonly masterAccountID: UserAccountID;
  readonly masterPrivateKey: string;
  readonly cleanup: () => Promise<void>;
}

// tslint:disable-next-line no-any
export const setupTest = async <TContract extends SmartContract<any> = SmartContractAny>(
  getContract: () => Promise<TestOptions>,
): Promise<Result<TContract>> => {
  const { client, masterWallet, provider, networkName, privateKey, node } = await testNodeSetup(true);
  try {
    const { contract, sourceMap, abi, deploy } = await getContract();

    const developerClient = new DeveloperClient(provider.read(networkName));

    let result: TransactionResult<PublishReceipt>;
    // tslint:disable-next-line prefer-conditional-expression
    if (deploy) {
      result = await client.publishAndDeploy(contract, abi);
    } else {
      result = await client.publish(contract);
    }

    const [receipt] = await Promise.all([result.confirmed({ timeoutMS: 2500 }), developerClient.runConsensusNow()]);
    if (receipt.result.state === 'FAULT') {
      throw new Error(receipt.result.message);
    }

    const resolvedSourceMap = await sourceMap;
    const smartContract = client.smartContract<TContract>({
      networks: { [networkName]: { address: receipt.result.value.address } },
      abi,
      sourceMap: resolvedSourceMap,
    });

    return {
      networkName,
      client,
      developerClient,
      smartContract,
      masterAccountID: masterWallet.account.id,
      masterPrivateKey: privateKey,
      cleanup: async () => node.stop(),
    };
  } catch (error) {
    await node.stop();
    throw error;
  }
};
