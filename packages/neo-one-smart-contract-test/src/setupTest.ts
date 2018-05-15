import {
  ABI,
  Client,
  DeveloperClient,
  LocalKeyStore,
  LocalMemoryStore,
  LocalUserAccountProvider,
  NEOONEProvider,
  SmartContract,
  UserAccountID,
} from '@neo-one/client';
import { DiagnosticCategory, ts } from 'ts-simple-ast';

import { createNode } from './createNode';

export interface Options {
  script: Buffer;
  abi: ABI;
  diagnostics: ts.Diagnostic[];
  ignoreWarnings?: boolean;
}

export interface Result {
  networkName: string;
  client: Client<any>;
  keystore: LocalKeyStore;
  developerClient: DeveloperClient;
  smartContract: SmartContract;
  masterAccountID: UserAccountID;
  masterPrivateKey: string;
}

export const setupTest = async (
  getContract: () => Promise<Options>,
): Promise<Result> => {
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

  const { script, diagnostics, abi, ignoreWarnings } = await getContract();
  const error = diagnostics.filter(
    (diagnostic) => diagnostic.category === DiagnosticCategory.Error,
  )[0];
  if (error != null) {
    throw new Error(
      `Compilation error: ${error.messageText} at ${error.source}`,
    );
  }

  const warning = diagnostics.filter(
    (diagnostic) => diagnostic.category === DiagnosticCategory.Warning,
  )[0];
  if (warning != null && !ignoreWarnings) {
    throw new Error(
      `Compilation warning: ${warning.messageText} at ${warning.source}`,
    );
  }

  // Give RPC server a chance to startup.
  await new Promise((resolve) => setTimeout(() => resolve(), 5000));

  const result = await client.publish({
    script: script.toString('hex'),
    parameters: ['String', 'Array'],
    returnType: 'ByteArray',
    name: 'TestContract',
    codeVersion: '1.0',
    author: 'test',
    email: 'test@test.com',
    description: 'test',
    properties: {
      storage: true,
      dynamicInvoke: true,
    },
  });

  const [receipt] = await Promise.all([
    result.confirmed({ timeoutMS: 2500 }),
    developerClient.runConsensusNow(),
  ]);
  if (receipt.result.state === 'FAULT') {
    throw new Error(receipt.result.message);
  }

  const smartContract = client.smartContract({
    networks: { [networkName]: { hash: receipt.result.value.hash } },
    abi,
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
