import {
  ABI,
  Client,
  Contract,
  DeveloperClient,
  InvocationResult,
  LocalKeyStore,
  LocalMemoryStore,
  LocalUserAccountProvider,
  NEOONEProvider,
  SmartContract,
  UserAccountID,
} from '@neo-one/client';
import { common, UInt160 } from '@neo-one/client-core';
import { DiagnosticCategory, ts } from 'ts-simple-ast';
import { compile } from '../../compile';
import { CompileResult } from '../../compile/types';
import { createNode } from '../../test/createNode';
import * as utils from '../../utils';

export interface Result {
  readonly networkName: string;
  readonly client: Client;
  readonly keystore: LocalKeyStore;
  readonly developerClient: DeveloperClient;
  readonly smartContract: SmartContract;
  readonly masterAccountID: UserAccountID;
  readonly masterPrivateKey: string;
}

export interface TestNode {
  readonly addContract: (script: string) => Promise<UInt160>;
  // tslint:disable-next-line no-any
  readonly executeString: (script: string) => Promise<any>;
}

export interface Options {
  readonly script: Buffer;
  readonly abi: ABI;
  readonly diagnostics: ReadonlyArray<ts.Diagnostic>;
  readonly ignoreWarnings?: boolean;
}

export interface StartNodeOptions {
  readonly ignoreWarnings?: boolean;
}

// execute string
export interface InvokeValidateResultOptions {
  readonly result: InvocationResult<Contract>;
  readonly developerClient: DeveloperClient;
}

const getCompiledScript = async (script: string): Promise<CompileResult> => {
  const { ast, sourceFile } = await utils.getAstForSnippet(script);

  return compile({ ast, sourceFile });
};

export const startNode = async (options: StartNodeOptions = {}): Promise<TestNode> => {
  const { privateKey, rpcURL } = await createNode();

  // Give RPC server a chance to startup.
  await new Promise<void>((resolve) => setTimeout(resolve, 5000));

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
  const localUserAccountProvider = new LocalUserAccountProvider({
    keystore,
    provider,
  });
  const userAccountProviders = {
    memory: localUserAccountProvider,
  };
  const client = new Client(userAccountProviders);

  const developerClient = new DeveloperClient(provider.read(networkName), userAccountProviders);

  return {
    async addContract(script: string): Promise<UInt160> {
      const { code, context } = await getCompiledScript(script);
      const error = context.diagnostics.find((diagnostic) => diagnostic.category === DiagnosticCategory.Error);
      if (error !== undefined) {
        throw new Error(`Compilation error: ${error.messageText} at ${error.source}`);
      }
      const warning = context.diagnostics.find((diagnostic) => diagnostic.category === DiagnosticCategory.Warning);
      if (warning !== undefined && !options.ignoreWarnings) {
        throw new Error(`Compilation warning: ${warning.messageText} at ${warning.source}`);
      }

      const result = await client.publish({
        script: code.toString('hex'),
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
          payable: true,
        },
      });

      const [publishReceipt] = await Promise.all([
        result.confirmed({ timeoutMS: 2500 }),
        developerClient.runConsensusNow(),
      ]);
      if (publishReceipt.result.state === 'FAULT') {
        throw new Error(publishReceipt.result.message);
      }

      return common.stringToUInt160(publishReceipt.result.value.hash);
    },
    // tslint:disable-next-line no-any
    async executeString(script): Promise<any> {
      const { code, sourceMap } = await getCompiledScript(script);

      const result = await developerClient.execute(code.toString('hex'), { from: masterWallet.account.id }, sourceMap);
      if (!(result.type === 'Void' || result.type === 'InteropInterface')) {
        return result.value;
      }

      return undefined;
    },
  };
};
