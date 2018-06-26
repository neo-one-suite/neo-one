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
import { DiagnosticCategory, ts } from 'ts-simple-ast';
import { CompileContractResult } from '../compileContract';

import { createNode } from './createNode';

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

  const provider = new NEOONEProvider({
    options: [{ network: networkName, rpcURL }],
  });

  const client = new Client({
    memory: new LocalUserAccountProvider({
      keystore,
      provider,
    }),
  });
  const developerClient = new DeveloperClient(provider.read(networkName));

  const { contract, sourceMap, diagnostics, abi, ignoreWarnings } = await getContract();
  const error = diagnostics.find((diagnostic) => diagnostic.category === DiagnosticCategory.Error);
  if (error !== undefined) {
    throw new Error(`Compilation error: ${error.messageText} at ${error.source}`);
  }

  const warning = diagnostics.find((diagnostic) => diagnostic.category === DiagnosticCategory.Warning);
  if (warning !== undefined && !ignoreWarnings) {
    throw new Error(`Compilation warning: ${warning.messageText} at ${warning.source}`);
  }

  // Give RPC server a chance to startup.
  await new Promise<void>((resolve) => setTimeout(resolve, 5000));

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
