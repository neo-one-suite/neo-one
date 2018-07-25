import {
  ABI,
  Client,
  Contract,
  DeveloperClient,
  InvocationResult,
  LocalKeyStore,
  SmartContract,
  UserAccountID,
  LocalWallet,
  RawInvokeReceipt,
  InvokeTransactionOptions,
  InvocationTransaction,
  ReadClient,
} from '@neo-one/client';
import ts from 'typescript';
import { compile } from '../../compile';
import { CompileResult } from '../../compile/types';
import { testNodeSetup } from '../../test';
import { throwOnDiagnosticErrorOrWarning } from '../../utils';
import { createContextForSnippet } from '../../createContext';

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
  readonly addContract: (script: string) => Promise<Contract>;
  // tslint:disable-next-line no-any
  readonly executeString: (
    script: string,
    options?: InvokeTransactionOptions,
  ) => Promise<{ readonly receipt: RawInvokeReceipt; readonly transaction: InvocationTransaction }>;
  readonly compileScript: (script: string) => Promise<CompileResult>;
  readonly masterWallet: LocalWallet;
  readonly client: Client;
  readonly readClient: ReadClient;
  readonly developerClient: DeveloperClient;
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
  const { context, sourceFile } = await createContextForSnippet(script);

  return compile({ context, sourceFile });
};

export const startNode = async (options: StartNodeOptions = {}): Promise<TestNode> => {
  const { client, masterWallet, provider, networkName, userAccountProviders } = await testNodeSetup();
  const developerClient = new DeveloperClient(provider.read(networkName), userAccountProviders);

  return {
    async addContract(script): Promise<Contract> {
      const { code, context } = await getCompiledScript(script);

      throwOnDiagnosticErrorOrWarning(context.diagnostics, options.ignoreWarnings);

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

      return publishReceipt.result.value;
    },
    async executeString(
      script,
      options = {},
    ): Promise<{ readonly receipt: RawInvokeReceipt; readonly transaction: InvocationTransaction }> {
      const { code, sourceMap } = await getCompiledScript(script);

      return developerClient.execute(code.toString('hex'), { from: masterWallet.account.id, ...options }, sourceMap);
    },
    compileScript: getCompiledScript,
    client,
    readClient: client.read(networkName),
    masterWallet,
    developerClient,
  };
};
